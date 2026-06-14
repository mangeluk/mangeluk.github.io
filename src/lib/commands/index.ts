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
  getSessionStats: () => { commandCount: number; startTime: number };
}

export type CommandResult =
  | { type: 'text'; content: string }
  | { type: 'jsx'; content: ReactNode }
  | { type: 'error'; content: string }
  | { type: 'clear' }
  | { type: 'banner' }
  | { type: 'async'; loader: string; promise: Promise<{ text: string; metadata?: any }> };

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
// Command parsing helpers
// ---------------------------------------------------------------------------

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
      return {
        type: 'error',
        content: `comando no encontrado: '${token}' — escribe 'help' para ver los comandos disponibles`,
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
  } catch {
    // Safety net: ensure we never propagate exceptions (Req. 1.9)
    return {
      type: 'error',
      content: "ocurrió un error inesperado — escribe 'help' para ver los comandos disponibles",
    };
  }
}
