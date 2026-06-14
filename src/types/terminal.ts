import type { ReactNode } from 'react';

export type Theme = 'dark' | 'light' | 'matrix' | 'dracula' | 'nord' | 'monokai';

export type Lang = 'es' | 'en';

export type OutputType = 'input' | 'output' | 'error' | 'banner' | 'loader';

export interface HistoryEntry {
  id: string;
  type: OutputType;
  content: string | ReactNode;
  timestamp: number;
}
