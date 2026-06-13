// Feature: terminal-portfolio, Property 3: History navigation round-trip
// Requirements: 1.7, 1.8

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

/**
 * Pure simulation of the ArrowUp/ArrowDown logic from Terminal.tsx
 * (from design doc pseudocode).
 */
function simulateNavigation(
  commandHistory: string[],
  arrowUps: number,
  arrowDowns: number
): { inputValue: string; historyIndex: number } {
  let historyIndex = -1;
  let inputValue = '';

  for (let i = 0; i < arrowUps; i++) {
    if (commandHistory.length === 0) break;
    if (historyIndex === -1) {
      historyIndex = commandHistory.length - 1;
    } else {
      historyIndex = Math.max(0, historyIndex - 1);
    }
    inputValue = commandHistory[historyIndex] ?? '';
  }

  for (let i = 0; i < arrowDowns; i++) {
    if (historyIndex === -1) break;
    if (historyIndex === commandHistory.length - 1) {
      historyIndex = -1;
      inputValue = '';
    } else {
      historyIndex++;
      inputValue = commandHistory[historyIndex] ?? '';
    }
  }

  return { inputValue, historyIndex };
}

describe('Property 3: History navigation round-trip', () => {
  it('pressing ArrowUp N times then ArrowDown N times returns to empty input', () => {
    fc.assert(
      fc.property(
        fc.array(fc.string({ minLength: 1 }), { minLength: 1, maxLength: 20 }),
        (commandHistory) => {
          const n = commandHistory.length;
          const { inputValue, historyIndex } = simulateNavigation(commandHistory, n, n);

          // After N up + N down: input should be empty and index should be -1 (Req. 1.8)
          expect(inputValue).toBe('');
          expect(historyIndex).toBe(-1);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('ArrowUp steps match command history in reverse order (most recent first)', () => {
    fc.assert(
      fc.property(
        fc.array(fc.string({ minLength: 1 }), { minLength: 1, maxLength: 10 }),
        (commandHistory) => {
          for (let step = 1; step <= commandHistory.length; step++) {
            const { inputValue } = simulateNavigation(commandHistory, step, 0);
            const expectedIndex = commandHistory.length - step;
            expect(inputValue).toBe(commandHistory[expectedIndex]);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
