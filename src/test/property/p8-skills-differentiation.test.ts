// Feature: terminal-portfolio, Property 8: skills output differentiates category names from skill items
// Requirements: 6.2

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

interface SkillCategory {
  name: string;
  skills: string[];
}

function formatSkills(categories: SkillCategory[]): string {
  return categories
    .map((cat) => `▶ ${cat.name.toUpperCase()}\n  ${cat.skills.join(' · ')}`)
    .join('\n\n');
}

const skillCategoryArbitrary = fc.record({
  name: fc.string({ minLength: 1 }),
  skills: fc.array(fc.string({ minLength: 1 }), { minLength: 1 }),
});

describe('Property 8: skills output differentiates category names from skill items', () => {
  it('each category name line is uppercase and prefixed with ▶', () => {
    fc.assert(
      fc.property(
        fc.array(skillCategoryArbitrary, { minLength: 1, maxLength: 10 }),
        (categories) => {
          const output = formatSkills(categories);
          const lines = output.split('\n');

          // Every line that starts with '▶' should contain the category name in uppercase
          const categoryLines = lines.filter((l) => l.startsWith('▶'));

          // Must have exactly as many category header lines as categories
          expect(categoryLines).toHaveLength(categories.length);

          categoryLines.forEach((line, i) => {
            // Must start with ▶ (Req. 6.2)
            expect(line).toMatch(/^▶ /);

            // Category name must appear uppercased
            const expectedName = categories[i].name.toUpperCase();
            expect(line).toContain(expectedName);
          });
        }
      ),
      { numRuns: 100 }
    );
  });
});
