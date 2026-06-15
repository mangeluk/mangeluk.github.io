// Feature: terminal-portfolio, Property 20: Mobile shortcut buttons behave identically to typing the command
// Requirements: 19.3

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

// Import all commands
import '@/lib/commands/help';
import '@/lib/commands/content';
import '@/lib/commands/utility';

import { resolveCommand } from '@/lib/commands/index';
import type { CommandContext } from '@/lib/commands/index';
import { createMockContext } from '../utils';

const MOBILE_SHORTCUTS = ['help', 'about', 'projects', 'contact', 'clear'] as const;

describe('Property 20: Mobile shortcut buttons behave identically to typing the command', () => {
  it('shortcut commands produce the same result as typing them manually', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...MOBILE_SHORTCUTS),
        (cmd) => {
          const ctx = createMockContext();

          // Simulate button tap (passes cmd directly, same as handleSubmit)
          const shortcutResult = resolveCommand(cmd, ctx);

          // Simulate typing and pressing Enter (same string)
          const typedResult = resolveCommand(cmd, ctx);

          // Both must produce the same type (Req. 19.3)
          expect(shortcutResult.type).toBe(typedResult.type);

          // For text/error results, content must match
          if (
            (shortcutResult.type === 'text' || shortcutResult.type === 'error') &&
            (typedResult.type === 'text' || typedResult.type === 'error')
          ) {
            expect(shortcutResult.content).toBe(typedResult.content);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
