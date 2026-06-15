// src/lib/commands/index.ts
// Command_Registry: registration and resolution of all terminal commands.
// Requirements: 16.1, 1.9, 20.2, 20.3

import type { ReactNode } from 'react';
import type { Theme, Lang } from '@/types/terminal';

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

import type { HistoryEntry } from '@/types/terminal';

export interface CommandContext {
  lang: Lang;
  theme: Theme;
  setTheme: (t: Theme) => void;
  setLang: (l: Lang) => void;
  getHistory: () => HistoryEntry[];
  getCommandHistory: () => string[];
  getAliases: () => Record<string, string>;
  setAliases: (aliases: Record<string, string>) => void;
  // Estado global compartido para nuevas funcionalidades
  getCurrentDir: () => string;
  setCurrentDir: (dir: string) => void;
  getSessionStats: () => { commandCount: number; startTime: number | null };
}

export type CommandResult =
  | { type: 'text'; content: string }
  | { type: 'jsx'; content: ReactNode }
  | { type: 'error'; content: string }
  | { type: 'clear' }
  | { type: 'banner' }
  | { type: 'async'; loader: string; promise: Promise<{ text: string; metadata?: Record<string, unknown> }> };

export interface CommandDefinition {
  name: string;
  description: string;
  execute: (args: string[], ctx: CommandContext) => CommandResult | Promise<CommandResult>;
}

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

const registry: Map<string, CommandDefinition> = new Map();

/**
 * Register a command definition in the global registry.
 * If a command with the same name is already registered it will be overwritten.
 */
export function registerCommand(def: CommandDefinition): void {
  registry.set(def.name.toLowerCase(), def);
}

/**
 * Expose the registry for helpers that need to iterate it (e.g. `help`).
 */
export function getRegistry(): Map<string, CommandDefinition> {
  return registry;
}

/**
 * Get all available command names (sorted alphabetically).
 */
export function getAvailableCommands(): string[] {
  return Array.from(registry.keys()).sort();
}

// ---------------------------------------------------------------------------
// Command modules — importing each file registers its commands via side effects.
// NOTE: These imports must NOT be in this file because the command modules
// import registerCommand from this file, creating a circular dependency.
// They are imported in Terminal.tsx instead.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Command parsing helpers
// ---------------------------------------------------------------------------

/**
 * Compute Levenshtein distance between two strings.
 */
function levenshtein(a: string, b: string): number {
  const la = a.length;
  const lb = b.length;
  const dp: number[][] = Array.from({ length: la + 1 }, () => Array(lb + 1).fill(0));
  for (let i = 0; i <= la; i++) dp[i][0] = i;
  for (let j = 0; j <= lb; j++) dp[0][j] = j;
  for (let i = 1; i <= la; i++) {
    for (let j = 1; j <= lb; j++) {
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
  }
  return dp[la][lb];
}

/**
 * Find the closest command names to a given input.
 */
function suggestCommands(input: string, maxSuggestions = 3): string[] {
  const commands = Array.from(registry.keys());
  return commands
    .map(cmd => ({ cmd, dist: levenshtein(input, cmd) }))
    .filter(({ dist }) => dist <= 3)
    .sort((a, b) => a.dist - b.dist)
    .slice(0, maxSuggestions)
    .map(({ cmd }) => cmd);
}

/**
 * Parse raw input into a (token, args[]) pair.
 *
 * Parsing rules (from design doc):
 *  - trim whitespace
 *  - token = first word, lowercased
 *  - args  = remainder split on spaces
 *
 * Special cases handled here:
 *  - "ask <question>" → args is the *full* remainder as a single string
 *    so that multi-word questions are preserved intact.
 *  - All other commands follow the split-on-first-space approach.
 */
function parseRawInput(raw: string): { token: string; args: string[] } {
  const trimmed = raw.trim();
  const spaceIndex = trimmed.indexOf(' ');

  if (spaceIndex === -1) {
    // Single word — no arguments
    return { token: trimmed.toLowerCase(), args: [] };
  }

  const token = trimmed.slice(0, spaceIndex).toLowerCase();
  const rest = trimmed.slice(spaceIndex + 1).trim();

  // For the `ask` command keep the entire remainder as one argument so the
  // question is passed through verbatim (Req. 13.1).
  if (token === 'ask') {
    return { token, args: [rest] };
  }

  // General case: split remainder by spaces
  const args = rest.split(' ').filter(Boolean);
  return { token, args };
}

// ---------------------------------------------------------------------------
// resolveCommand
// ---------------------------------------------------------------------------

/**
 * Resolve a raw input string to a CommandResult.
 *
 * This function NEVER throws (Req. 1.9). Unknown commands return an error
 * result with the `--text-error` colour convention (Req. 16.1).
 */
export function resolveCommand(raw: string, ctx: CommandContext): CommandResult {
  try {
    const { token, args } = parseRawInput(raw);

    if (!token) {
      // Empty after trimming — should not reach here normally (Terminal guards
      // against empty input), but handle it gracefully just in case.
      return {
        type: 'error',
        content: "escribe 'help' para ver los comandos disponibles",
      };
    }

    const def = registry.get(token);

    if (!def) {
      // Unknown command error (Req. 16.1)
      const suggestions = suggestCommands(token);
      const suggestionText = suggestions.length > 0
        ? suggestions.length === 1
          ? `\n¿Quisiste decir '${suggestions[0]}'?`
          : `\n¿Quisiste decir: ${suggestions.map(s => `'${s}'`).join(', ')}?`
        : '';
      return {
        type: 'error',
        content: `comando no encontrado: '${token}'${suggestionText}\nEscribe 'help' para ver los comandos disponibles`,
      };
    }

    const result = def.execute(args, ctx);
    
    // Si es una promesa, envolverla en un async para que la terminal la maneje
    if (result instanceof Promise) {
      return {
        type: 'async',
        loader: 'Cargando...',
        promise: result.then(r => {
          if ('type' in r && r.type === 'text') return { text: r.content };
          if ('type' in r && r.type === 'error') return { text: r.content };
          return { text: '' };
        })
      };
    }

    return result;
  } catch (err) {
    // Safety net: ensure we never propagate exceptions (Req. 1.9)
    const detail = err instanceof Error ? `: ${err.message}` : '';
    return {
      type: 'error',
      content: `Error inesperado al ejecutar el comando${detail}\nSi el problema persiste, prueba con 'help' para ver los comandos disponibles`,
    };
  }
}
