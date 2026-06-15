import type { CommandContext } from '@/lib/commands/index';
import type { HistoryEntry } from '@/types/terminal';

/**
 * Creates a mock CommandContext for testing purposes.
 * All required properties are provided with no-op implementations.
 */
export function createMockContext(overrides: Partial<CommandContext> = {}): CommandContext {
  const mockHistory: HistoryEntry[] = [];
  const mockCommandHistory: string[] = [];
  const mockAliases: Record<string, string> = {};
  let mockCurrentDir = '~';

  return {
    lang: 'es',
    theme: 'dark',
    setTheme: () => {},
    setLang: () => {},
    getHistory: () => mockHistory,
    getCommandHistory: () => mockCommandHistory,
    getAliases: () => mockAliases,
    setAliases: () => {},
    getCurrentDir: () => mockCurrentDir,
    setCurrentDir: (dir: string) => { mockCurrentDir = dir; },
    getSessionStats: () => ({ commandCount: 0, startTime: Date.now() }),
    ...overrides,
  };
}