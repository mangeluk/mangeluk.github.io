// Feature: terminal-portfolio, Property 15: Invalid theme argument does not change the active theme
// Requirements: 14.4

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

import '@/lib/commands/utility';
import { resolveCommand } from '@/lib/commands/index';
import type { CommandContext } from '@/lib/commands/index';
import type { Theme } from '@/types/terminal';

const VALID_THEMES = ['dark', 'light', 'matrix'];

describe('Property 15: Invalid theme argument does not change the active theme', () => {
  it('keeps the active theme unchanged and lists valid options on invalid argument', () => {
    fc.assert(
      fc.property(
        fc.string().filter((s) => !VALID_THEMES.includes(s.toLowerCase().trim())),
        fc.constantFrom('dark' as const, 'light' as const, 'matrix' as const),
        (invalidArg, currentTheme) => {
          let capturedTheme: Theme = currentTheme;

          const ctx: CommandContext = {
            lang: 'es',
            theme: currentTheme,
            setTheme: (t) => { capturedTheme = t; },
            setLang: () => {},
          };

          const result = resolveCommand(`theme ${invalidArg}`, ctx);

          // Theme must not change (Req. 14.4)
          expect(capturedTheme).toBe(currentTheme);

          // Output must be an error listing valid options
          expect(result.type).toBe('error');
          if (result.type === 'error') {
            expect(result.content).toContain('dark');
            expect(result.content).toContain('light');
            expect(result.content).toContain('matrix');
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
