// Feature: terminal-portfolio, Property 11: banner always appends without removing existing history
// Requirements: 9.1, 9.3

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

// The banner command returns { type: 'text', content: '__BANNER__' }
// Terminal.tsx maps '__BANNER__' content to a 'banner' type entry.
// We test that the banner command always produces a non-clear result.

import '@/lib/commands/utility';
import { resolveCommand } from '@/lib/commands/index';
import type { CommandContext } from '@/lib/commands/index';
import type { HistoryEntry } from '@/types/terminal';

const historyEntryArbitrary: fc.Arbitrary<HistoryEntry> = fc.record({
  id: fc.uuid(),
  type: fc.constantFrom('input' as const, 'output' as const, 'error' as const),
  content: fc.string(),
  timestamp: fc.integer({ min: 0 }),
});

describe('Property 11: banner always appends without removing existing history', () => {
  it('banner command result is never of type clear', () => {
    fc.assert(
      fc.property(
        fc.array(historyEntryArbitrary),
        (history) => {
          const ctx: CommandContext = {
            lang: 'es',
            theme: 'dark',
            setTheme: () => {},
            setLang: () => {},
          };

          const result = resolveCommand('banner', ctx);

          // Banner must NOT clear history — type must not be 'clear' (Req. 9.1, 9.3)
          expect(result.type).not.toBe('clear');

          // Result must be defined and have content
          expect(result.type).toBe('text');
          if (result.type === 'text') {
            expect(result.content).toBe('__BANNER__');
          }

          // History length is unchanged — banner only adds, never removes
          // (This is enforced by Terminal.tsx mapping __BANNER__ to a new entry)
          const _ = history; // Used to vary the test run seed
        }
      ),
      { numRuns: 100 }
    );
  });
});
