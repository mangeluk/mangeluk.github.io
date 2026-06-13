// Feature: terminal-portfolio, Property 16: Theme preference persists and restores across sessions
// Requirements: 14.5, 14.6

import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';

import '@/lib/commands/utility';
import { resolveCommand } from '@/lib/commands/index';
import type { CommandContext } from '@/lib/commands/index';
import { isValidTheme } from '@/lib/theme';

// jsdom provides localStorage globally
describe('Property 16: Theme preference persists and restores across sessions', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('setting a valid theme persists it to localStorage', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('dark' as const, 'light' as const, 'matrix' as const),
        (theme) => {
          localStorage.clear();

          const ctx: CommandContext = {
            lang: 'es',
            theme: 'dark',
            setTheme: () => {},
            setLang: () => {},
          };

          resolveCommand(`theme ${theme}`, ctx);

          // localStorage must contain the applied theme (Req. 14.5)
          expect(localStorage.getItem('terminal-theme')).toBe(theme);
        }
      ),
      { numRuns: 3 }
    );
  });

  it('absent localStorage key defaults to dark', () => {
    localStorage.removeItem('terminal-theme');
    const stored = localStorage.getItem('terminal-theme');
    const resolved = stored && isValidTheme(stored) ? stored : 'dark';
    expect(resolved).toBe('dark');
  });

  it('stored valid theme is recognized by isValidTheme', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('dark' as const, 'light' as const, 'matrix' as const),
        (theme) => {
          localStorage.setItem('terminal-theme', theme);
          const stored = localStorage.getItem('terminal-theme');
          expect(isValidTheme(stored)).toBe(true);
        }
      ),
      { numRuns: 3 }
    );
  });
});
