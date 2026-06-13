import type { Theme, Lang } from '@/types/terminal';

const VALID_THEMES: Theme[] = ['dark', 'light', 'matrix'];
const VALID_LANGS: Lang[] = ['es', 'en'];

/**
 * Type guard — returns true when `value` is one of the three supported themes.
 * Used by Terminal.tsx to validate values read from localStorage before applying them.
 */
export function isValidTheme(value: unknown): value is Theme {
  return VALID_THEMES.includes(value as Theme);
}

/**
 * Type guard — returns true when `value` is one of the two supported language codes.
 * Used by Terminal.tsx to validate values read from localStorage before applying them.
 */
export function isValidLang(value: unknown): value is Lang {
  return VALID_LANGS.includes(value as Lang);
}
