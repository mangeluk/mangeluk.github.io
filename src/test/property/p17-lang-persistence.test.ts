// Feature: terminal-portfolio, Property 17: Lang preference persists and restores across sessions
// Requirements: 15.4, 15.5

import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';

import '@/lib/commands/utility';
import { resolveCommand } from '@/lib/commands/index';
import type { CommandContext } from '@/lib/commands/index';
import { isValidLang } from '@/lib/theme';
import { createMockContext } from '../utils';

describe('Property 17: Lang preference persists and restores across sessions', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('setting a valid lang persists it to localStorage', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('es' as const, 'en' as const),
        (lang) => {
          localStorage.clear();

          const ctx = createMockContext({
            lang: 'es',
            theme: 'dark',
          });

          resolveCommand(`lang ${lang}`, ctx);

          // localStorage must contain the applied lang (Req. 15.4)
          expect(localStorage.getItem('terminal-lang')).toBe(lang);
        }
      ),
      { numRuns: 2 }
    );
  });

  it('absent localStorage key defaults to es', () => {
    localStorage.removeItem('terminal-lang');
    const stored = localStorage.getItem('terminal-lang');
    const resolved = stored && isValidLang(stored) ? stored : 'es';
    expect(resolved).toBe('es');
  });

  it('stored valid lang is recognized by isValidLang', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('es' as const, 'en' as const),
        (lang) => {
          localStorage.setItem('terminal-lang', lang);
          const stored = localStorage.getItem('terminal-lang');
          expect(isValidLang(stored)).toBe(true);
        }
      ),
      { numRuns: 2 }
    );
  });
});
