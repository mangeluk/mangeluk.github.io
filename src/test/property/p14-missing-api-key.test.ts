// Feature: terminal-portfolio, Property 14: Missing API key prevents any HTTP call
// Requirements: 13.8

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';

describe('Property 14: Missing API key prevents any HTTP call', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    // Clear any previously set env var
    delete process.env.NEXT_PUBLIC_GEMINI_KEY;
  });

  it('rejects immediately without calling fetch when API key is absent', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1 }),
        async (question) => {
          // Reset env to empty / missing
          process.env.NEXT_PUBLIC_GEMINI_KEY = '';

          const { askGemini } = await import('@/lib/gemini');
          const { profile } = await import('@/data/profile');

          await expect(askGemini(question, profile)).rejects.toThrow();

          // fetch must never have been called (Req. 13.8)
          expect(fetch).not.toHaveBeenCalled();

          vi.mocked(fetch).mockReset();
        }
      ),
      { numRuns: 20 }
    );
  });
});
