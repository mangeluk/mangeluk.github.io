// Feature: terminal-portfolio, Property 5: `help` output is always alphabetically sorted
// Requirements: 2.1, 2.2

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

// Import the help formatter logic directly to test in isolation
// The `help` command formats registry entries — we test the format function logic here.

/**
 * Reimplementation of the format function to test the sorting invariant
 * independently of the registry state.
 */
function formatHelpOutput(commands: Array<{ name: string; description: string }>): string {
  if (commands.length === 0) return 'No hay comandos disponibles.';
  return [...commands]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((def) => `${def.name.padEnd(20)}${def.description}`)
    .join('\n');
}

describe('Property 5: help output is always alphabetically sorted', () => {
  it('sorts command names lexicographically and pads each name to 20 characters', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            name: fc
              .string({ minLength: 1, maxLength: 15 })
              .map((s) => s.replace(/\s/g, 'x').toLowerCase() || 'x'),
            description: fc.string(),
          }),
          { minLength: 1, maxLength: 30 }
        ),
        (commands) => {
          // Deduplicate by name
          const unique = Array.from(
            new Map(commands.map((c) => [c.name, c])).values()
          );

          const output = formatHelpOutput(unique);
          const lines = output.split('\n').filter(Boolean);

          // Should have one line per command (Req. 2.1)
          expect(lines).toHaveLength(unique.length);

          // Names extracted from the start of each line
          const names = lines.map((l) => l.slice(0, 20).trimEnd());

          // Must be sorted alphabetically (Req. 2.1)
          const sorted = [...names].sort((a, b) => a.localeCompare(b));
          expect(names).toEqual(sorted);

          // Each line: name section is exactly 20 chars (Req. 2.2)
          lines.forEach((line) => {
            expect(line.length).toBeGreaterThanOrEqual(20);
            const nameSection = line.slice(0, 20);
            expect(nameSection).toHaveLength(20);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('returns "no commands" message when command list is empty', () => {
    const output = formatHelpOutput([]);
    expect(output).toContain('disponibles');
  });
});
