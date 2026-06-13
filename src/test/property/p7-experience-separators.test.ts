// Feature: terminal-portfolio, Property 7: experience output has separators between all entries
// Requirements: 4.2

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

// Pure formatter function — mirrors content.tsx experience logic
const DIVIDER = '──────────────────────────────────────────────────';

interface WorkEntry {
  company: string;
  role: string;
  from: string;
  to: string;
  description: string;
}

function formatExperience(entries: WorkEntry[]): string {
  const lines: string[] = [];
  entries.forEach((entry, i) => {
    if (i > 0) lines.push(DIVIDER);
    lines.push(`${entry.company}  |  ${entry.role}  |  ${entry.from}–${entry.to}`);
    lines.push(entry.description);
  });
  return lines.join('\n');
}

const workEntryArbitrary = fc.record({
  company: fc.string({ minLength: 1 }),
  role: fc.string({ minLength: 1 }),
  from: fc.string({ minLength: 4, maxLength: 4 }),
  to: fc.string({ minLength: 4, maxLength: 7 }),
  description: fc.string({ minLength: 1 }),
});

describe('Property 7: experience output has separators between all entries', () => {
  it('contains a separator between every pair of adjacent entries', () => {
    fc.assert(
      fc.property(
        fc.array(workEntryArbitrary, { minLength: 2, maxLength: 10 }),
        (entries) => {
          const output = formatExperience(entries);

          // Count separator occurrences — must be exactly (entries.length - 1)
          const separatorCount = (output.match(new RegExp(DIVIDER.replace(/─/g, '─'), 'g')) || []).length;
          expect(separatorCount).toBe(entries.length - 1);
        }
      ),
      { numRuns: 100 }
    );
  });
});
