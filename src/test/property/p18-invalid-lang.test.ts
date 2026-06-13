// Feature: terminal-portfolio, Property 18: Invalid lang argument does not change the active lang
// Requirements: 15.3

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

import '@/lib/commands/utility';
import { resolveCommand } from '@/lib/commands/index';
import type { CommandContext } from '@/lib/commands/index';
import type { Lang } from '@/types/terminal';

const VALID_LANGS = ['es', 'en'];

describe('Property 18: Invalid lang argument does not change the active lang', () => {
  it('keeps the active lang unchanged and lists valid codes on invalid argument', () => {
    fc.assert(
      fc.property(
        fc.string().filter((s) => !VALID_LANGS.includes(s.toLowerCase().trim())),
        fc.constantFrom('es' as const, 'en' as const),
        (invalidCode, currentLang) => {
          let capturedLang: Lang = currentLang;

          const ctx: CommandContext = {
            lang: currentLang,
            theme: 'dark',
            setTheme: () => {},
            setLang: (l) => { capturedLang = l; },
          };

          const result = resolveCommand(`lang ${invalidCode}`, ctx);

          // Lang must not change (Req. 15.3)
          expect(capturedLang).toBe(currentLang);

          // Output must be an error listing valid codes
          expect(result.type).toBe('error');
          if (result.type === 'error') {
            expect(result.content).toContain('es');
            expect(result.content).toContain('en');
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
