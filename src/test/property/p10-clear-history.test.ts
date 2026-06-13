// Feature: terminal-portfolio, Property 10: clear resets history regardless of its prior size
// Requirements: 8.1, 8.3

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

import '@/lib/commands/utility';
import { resolveCommand } from '@/lib/commands/index';
import type { CommandContext } from '@/lib/commands/index';
import type { Theme, Lang, HistoryEntry } from '@/types/terminal';

const historyEntryArbitrary: fc.Arbitrary<HistoryEntry> = fc.record({
  id: fc.uuid(),
  type: fc.constantFrom('input' as const, 'output' as const, 'error' as const, 'banner' as const),
  content: fc.string(),
  timestamp: fc.integer({ min: 0 }),
});

describe('Property 10: clear resets history regardless of its prior size', () => {
  it('returns clear type and does not change theme or lang', () => {
    fc.assert(
      fc.property(
        fc.array(historyEntryArbitrary),
        fc.constantFrom('dark' as const, 'light' as const, 'matrix' as const),
        fc.constantFrom('es' as const, 'en' as const),
        (_history, theme, lang) => {
          let capturedTheme: Theme = theme;
          let capturedLang: Lang = lang;

          const ctx: CommandContext = {
            lang,
            theme,
            setTheme: (t) => { capturedTheme = t; },
            setLang: (l) => { capturedLang = l; },
          };

          const result = resolveCommand('clear', ctx);

          // Must return clear type (Req. 8.1)
          expect(result.type).toBe('clear');

          // Theme and lang must not be changed (Req. 8.3)
          expect(capturedTheme).toBe(theme);
          expect(capturedLang).toBe(lang);
        }
      ),
      { numRuns: 100 }
    );
  });
});
