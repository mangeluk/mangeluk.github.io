// Feature: terminal-portfolio, Property 19: All themes maintain WCAG 2.1 AA contrast ratio
// Requirements: 14.1, 14.2, 14.3, 22.3

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

// Theme values from design doc
const THEME_COLORS = {
  dark: {
    textPrimary: '#00ff9f',
    bgTerminal: 'rgba(10,10,10,0.85)',
  },
  light: {
    textPrimary: '#1a1a2e',
    bgTerminal: 'rgba(245,245,245,0.92)',
  },
  matrix: {
    textPrimary: '#00ff41',
    bgTerminal: 'rgba(0,0,0,0.92)',
  },
} as const;

// WCAG 2.1 relative luminance formula
function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return [r, g, b];
}

function parseRgba(rgba: string): [number, number, number, number] {
  const m = rgba.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
  if (!m) return [0, 0, 0, 1];
  return [
    parseInt(m[1]),
    parseInt(m[2]),
    parseInt(m[3]),
    m[4] !== undefined ? parseFloat(m[4]) : 1,
  ];
}

function toLinear(c: number): number {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

function relativeLuminance(r: number, g: number, b: number): number {
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

function contrastRatio(l1: number, l2: number): number {
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

// Composite color: blend RGBA bg over solid black (#000000) as effective background
function compositeOnDark(rgba: [number, number, number, number]): [number, number, number] {
  const [r, g, b, a] = rgba;
  const bgR = 0, bgG = 0, bgB = 0; // #000000
  return [
    Math.round(r * a + bgR * (1 - a)),
    Math.round(g * a + bgG * (1 - a)),
    Math.round(b * a + bgB * (1 - a)),
  ];
}

describe('Property 19: All themes maintain WCAG 2.1 AA contrast ratio (≥4.5:1)', () => {
  it('each theme has sufficient contrast between --text-primary and --bg-terminal', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('dark' as const, 'light' as const, 'matrix' as const),
        (theme) => {
          const { textPrimary, bgTerminal } = THEME_COLORS[theme];

          const [tr, tg, tb] = hexToRgb(textPrimary);
          const textLum = relativeLuminance(tr, tg, tb);

          const bgRgba = parseRgba(bgTerminal.replace(/\s/g, ''));
          const [bgR, bgG, bgB] = compositeOnDark(bgRgba);
          const bgLum = relativeLuminance(bgR, bgG, bgB);

          const ratio = contrastRatio(textLum, bgLum);

          // WCAG 2.1 AA requires ≥4.5:1 for normal text (Req. 22.3)
          expect(ratio).toBeGreaterThanOrEqual(4.5);
        }
      ),
      { numRuns: 3 } // Only 3 possible values
    );
  });
});
