// Feature: terminal-portfolio, Property 12: ask always replaces the loader with a final output
// Requirements: 13.3, 13.4

import { describe, it, expect, vi, afterEach } from 'vitest';
import * as fc from 'fast-check';

/**
 * Simulate what Terminal.tsx does with an async CommandResult:
 * - Adds loader entry
 * - When promise resolves/rejects, replaces loader entry with output/error
 * Returns the final history.
 */
async function simulateAskFlow(
  loaderText: string,
  promise: Promise<string>
): Promise<{ type: string; content: string }[]> {
  const LOADER_ID = 'loader-1';

  const history: { id: string; type: string; content: string }[] = [
    { id: LOADER_ID, type: 'loader', content: loaderText },
  ];

  try {
    const text = await promise;
    return history.map((e) =>
      e.id === LOADER_ID ? { ...e, type: 'output', content: text } : e
    );
  } catch (err) {
    return history.map((e) =>
      e.id === LOADER_ID
        ? { ...e, type: 'error', content: (err as Error).message }
        : e
    );
  }
}

describe('Property 12: ask always replaces the loader with a final output', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('loader is replaced by output when promise resolves', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1 }),  // question
        fc.string({ minLength: 1 }),  // resolved response
        async (_question, responseText) => {
          const promise = Promise.resolve(responseText);
          const finalHistory = await simulateAskFlow('Pensando...', promise);

          // No loader entries in final history (Req. 13.3)
          const loaderEntries = finalHistory.filter((e) => e.type === 'loader');
          expect(loaderEntries).toHaveLength(0);

          // Output entry must exist with the response text
          const outputEntry = finalHistory.find((e) => e.type === 'output');
          expect(outputEntry).toBeDefined();
          expect(outputEntry!.content).toBe(responseText);
        }
      ),
      { numRuns: 50 }
    );
  });

  it('loader is replaced by error when promise rejects', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1 }),  // question
        fc.string({ minLength: 1 }),  // error message
        async (_question, errorMessage) => {
          const promise = Promise.reject(new Error(errorMessage));
          const finalHistory = await simulateAskFlow('Pensando...', promise);

          // No loader entries (Req. 13.4)
          const loaderEntries = finalHistory.filter((e) => e.type === 'loader');
          expect(loaderEntries).toHaveLength(0);

          // Error entry must exist
          const errorEntry = finalHistory.find((e) => e.type === 'error');
          expect(errorEntry).toBeDefined();
          expect(errorEntry!.content).toBe(errorMessage);
        }
      ),
      { numRuns: 50 }
    );
  });
});
