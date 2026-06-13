// Feature: terminal-portfolio, Property 6: Content commands return data for active lang with es fallback
// Requirements: 3.1, 3.3, 4.1, 4.3, 5.1, 5.3, 6.1, 6.3, 7.1, 7.3, 10.1, 10.2, 20.4

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

// Import command modules to register all commands via side effects
import '@/lib/commands/help';
import '@/lib/commands/content';
import '@/lib/commands/utility';

import { resolveCommand } from '@/lib/commands/index';
import type { CommandContext } from '@/lib/commands/index';

const CONTENT_COMMANDS = ['about', 'experience', 'projects', 'skills', 'contact', 'social', 'whoami'] as const;

describe('Property 6: Content commands return data for active lang with es fallback', () => {
  it('never returns undefined or throws for any valid lang + content command combination', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('es' as const, 'en' as const),
        fc.constantFrom(...CONTENT_COMMANDS),
        (lang, cmd) => {
          const ctx: CommandContext = {
            lang,
            theme: 'dark',
            setTheme: () => {},
            setLang: () => {},
          };

          let result!: ReturnType<typeof resolveCommand>;

          // Must never throw (Req. 1.9)
          expect(() => {
            result = resolveCommand(cmd, ctx);
          }).not.toThrow();

          // Result must be defined
          expect(result).toBeDefined();

          // Result must be one of the known types
          expect(['text', 'jsx', 'error', 'clear', 'async']).toContain(result.type);

          // Content must not be undefined
          if (result.type !== 'clear' && result.type !== 'async') {
            expect(result.content).toBeDefined();
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
