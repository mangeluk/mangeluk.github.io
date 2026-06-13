// Feature: terminal-portfolio, Property 4: Unknown commands never throw, always show an error
// Requirements: 1.9, 16.1

import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';

// We need a fresh registry for each test run so registered commands don't interfere.
// Import resolveCommand and registerCommand from the registry.
import { resolveCommand, registerCommand, getRegistry } from '@/lib/commands/index';
import type { CommandContext } from '@/lib/commands/index';

const ctx: CommandContext = {
  lang: 'es',
  theme: 'dark',
  setTheme: () => {},
  setLang: () => {},
};

describe('Property 4: Unknown commands never throw, always show an error', () => {
  it('returns an error result for any string not matching a registered command', () => {
    // Seed some real commands to ensure we're filtering them out properly
    // (the registry is populated by importing the command modules)
    const registeredNames = new Set(Array.from(getRegistry().keys()));

    fc.assert(
      fc.property(
        fc.string().filter((s) => {
          const token = s.trim().split(' ')[0]?.toLowerCase() ?? '';
          return token.length > 0 && !registeredNames.has(token);
        }),
        (input) => {
          // Must never throw (Req. 1.9)
          let result!: ReturnType<typeof resolveCommand>;
          expect(() => {
            result = resolveCommand(input, ctx);
          }).not.toThrow();

          // Must return error type (Req. 16.1)
          expect(result).toBeDefined();
          expect(result.type).toBe('error');

          // Must include the input token in the message
          const token = input.trim().split(' ')[0]?.toLowerCase() ?? '';
          if (result.type === 'error' || result.type === 'text') {
            const content = result.content as string;
            expect(content).toContain(token);
            // Must suggest `help`
            expect(content).toContain('help');
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
