// Feature: terminal-portfolio, Property 1: Submitting a non-empty command grows the history
// Requirements: 1.2

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

// Import commands so they are registered
import '@/lib/commands/help';
import '@/lib/commands/content';
import '@/lib/commands/utility';

import { resolveCommand } from '@/lib/commands/index';
import type { CommandContext } from '@/lib/commands/index';
import type { HistoryEntry } from '@/types/terminal';

function genId() {
  return Math.random().toString(36).slice(2);
}

/**
 * Simulate what Terminal.tsx does on submit:
 * - add echo entry
 * - resolve command
 * - add output entry (or handle clear/async)
 */
function simulateSubmit(
  history: HistoryEntry[],
  raw: string,
  ctx: CommandContext
): HistoryEntry[] {
  if (!raw.trim()) return history;

  const inputEntry: HistoryEntry = {
    id: genId(),
    type: 'input',
    content: `visitor@portfolio:~$ ${raw}`,
    timestamp: Date.now(),
  };

  const result = resolveCommand(raw, ctx);

  if (result.type === 'clear') return [];

  if (result.type === 'async') {
    // Loader counts as an entry
    const loaderEntry: HistoryEntry = {
      id: genId(),
      type: 'loader',
      content: result.loader,
      timestamp: Date.now(),
    };
    return [...history, inputEntry, loaderEntry];
  }

  const outputEntry: HistoryEntry = {
    id: genId(),
    type: result.type === 'error' ? 'error' : 'output',
    content: result.type === 'error' || result.type === 'text' || result.type === 'jsx'
      ? result.content
      : '',
    timestamp: Date.now(),
  };

  return [...history, inputEntry, outputEntry];
}

describe('Property 1: Submitting a non-empty command grows the history', () => {
  it('adds exactly 2 entries (echo + output) for non-clear commands', () => {
    const ctx: CommandContext = {
      lang: 'es',
      theme: 'dark',
      setTheme: () => {},
      setLang: () => {},
    };

    fc.assert(
      fc.property(
        // Non-empty, non-clear, non-whitespace commands
        fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0 && s.trim() !== 'clear'),
        (cmd) => {
          const before: HistoryEntry[] = [];
          const after = simulateSubmit(before, cmd, ctx);

          if (after.length === 0) return; // clear command — skip

          // Must grow by exactly 2 (Req. 1.2)
          expect(after.length - before.length).toBe(2);

          // Input field would be cleared (verified by the caller in Terminal.tsx)
          // We verify the echo entry type
          expect(after[0].type).toBe('input');
        }
      ),
      { numRuns: 100 }
    );
  });
});
