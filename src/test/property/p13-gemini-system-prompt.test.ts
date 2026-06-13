// Feature: terminal-portfolio, Property 13: Gemini system prompt always contains profile data and constraints
// Requirements: 13.1, 13.6

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';

describe('Property 13: Gemini system prompt contains profile data and response constraints', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_GEMINI_KEY = 'test-key-12345';
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete process.env.NEXT_PUBLIC_GEMINI_KEY;
  });

  it('request body includes serialized profile and max-3-paragraph constraint', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1 }),
        async (question) => {
          const mockFetch = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({
              candidates: [{ content: { parts: [{ text: 'mock response' }] } }],
            }),
          });
          vi.stubGlobal('fetch', mockFetch);

          const { askGemini } = await import('@/lib/gemini');
          const { profile } = await import('@/data/profile');

          await askGemini(question, profile);

          expect(mockFetch).toHaveBeenCalledOnce();

          const [, options] = mockFetch.mock.calls[0] as [string, RequestInit];
          const body = JSON.parse(options.body as string);

          // Must include system instruction (Req. 13.1)
          expect(body.systemInstruction).toBeDefined();
          const systemText: string = body.systemInstruction.parts[0].text;

          // System prompt must contain serialized profile data (Req. 13.1)
          // Check for a key that definitely appears in the profile JSON
          expect(systemText).toContain('bio');

          // Must constrain response length (Req. 13.6)
          expect(systemText.toLowerCase()).toMatch(/3.*(párrafos|paragraphs|p.rrafos)/i);

          vi.restoreAllMocks();
        }
      ),
      { numRuns: 10 }
    );
  });
});
