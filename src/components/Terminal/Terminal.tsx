'use client';

// src/components/Terminal/Terminal.tsx
// Main stateful terminal component.
// Can run standalone or embedded inside a Desktop Window.

import React, { useState, useEffect, useLayoutEffect, useRef, useCallback, useImperativeHandle, forwardRef } from 'react';
import type { HistoryEntry, Theme, Lang } from '@/types/terminal';
import { isValidTheme, isValidLang } from '@/lib/theme';
import { resolveCommand } from '@/lib/commands/index';
import { resetConversationHistory } from '@/lib/commands/ai';

// Import all command modules to register them via side effects
import '@/lib/commands/help';
import '@/lib/commands/content';
import '@/lib/commands/utility';
import '@/lib/commands/ai';
import '@/lib/commands/filesystem';
import '@/lib/commands/extras';
import '@/lib/commands/env';
import '@/lib/commands/system';
import '@/lib/commands/process';
import '@/lib/commands/fileops';
import '@/lib/commands/textproc';
import '@/lib/commands/packages';

import OutputLine from './OutputLine';
import InputLine from './InputLine';
import WelcomeBanner from './WelcomeBanner';
import MobileKeyboard from '../MobileKeyboard';

// Initialize session start time at module level to avoid ref access during render
const sessionStartTime = Date.now();

let idCounter = 0;
function genId(): string {
  return `entry-${++idCounter}-${Date.now()}`;
}

interface TerminalProps {
  /** When embedded, parent controls theme/lang */
  theme?: Theme;
  lang?: Lang;
  setTheme?: (t: Theme) => void;
  setLang?: (l: Lang) => void;
  /** When embedded in Desktop, hide header and accept external props */
  isEmbedded?: boolean;
  /** Command to auto-submit on mount */
  initialCommand?: string;
}

export interface TerminalHandle {
  submitCommand: (cmd: string) => void;
}

const Terminal = forwardRef<TerminalHandle, TerminalProps>(function Terminal(
  { theme: themeProp, lang: langProp, setTheme: setThemeProp, setLang: setLangProp, isEmbedded = false, initialCommand },
  ref
) {
  function getInitialTheme(): Theme {
    try {
      const stored = localStorage.getItem('terminal-theme');
      if (stored && isValidTheme(stored)) return stored;
    } catch {}
    return 'dark';
  }

  function getInitialLang(): Lang {
    try {
      const stored = localStorage.getItem('terminal-lang');
      if (stored && isValidLang(stored)) return stored;
    } catch {}
    return 'es';
  }

  function getInitialCommandHistory(): string[] {
    try {
      const stored = localStorage.getItem('terminal-cmd-history');
      if (stored) return JSON.parse(stored);
    } catch {}
    return [];
  }

  function getInitialAliases(): Record<string, string> {
    try {
      const stored = localStorage.getItem('terminal-aliases');
      if (stored) return JSON.parse(stored);
    } catch {}
    return {};
  }

  function getInitialHistory(): HistoryEntry[] {
    return [
      {
        id: genId(),
        type: 'banner',
        content: '__BANNER__',
        timestamp: Date.now(),
      },
    ];
  }

  // Use props if provided (embedded mode), otherwise use local state
  const [localTheme, setLocalThemeState] = useState<Theme>(getInitialTheme);
  const [localLang, setLocalLangState] = useState<Lang>(getInitialLang);
  const theme = themeProp ?? localTheme;
  const lang = langProp ?? localLang;

  const setThemeLocal = useCallback((t: Theme) => {
    setLocalThemeState(t);
    try { localStorage.setItem('terminal-theme', t); } catch {}
  }, []);
  const setLangLocal = useCallback((l: Lang) => {
    setLocalLangState(l);
    try { localStorage.setItem('terminal-lang', l); } catch {}
  }, []);

  const setTheme = setThemeProp ?? setThemeLocal;
  const setLang = setLangProp ?? setLangLocal;

  const [history, setHistory] = useState<HistoryEntry[]>(getInitialHistory);
  const [inputValue, setInputValue] = useState('');
  const [commandHistory, setCommandHistory] = useState<string[]>(getInitialCommandHistory);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  const [aliases, setAliases] = useState<Record<string, string>>(getInitialAliases);
  const [currentDir, setCurrentDirState] = useState<string>('~');
  const [commandCount, setCommandCount] = useState(0);
  const [currentTime, setCurrentTime] = useState('');
  const [mounted, setMounted] = useState(false);
  const [initialCommandSent, setInitialCommandSent] = useState(false);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useLayoutEffect(() => { setMounted(true); }, []);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const handleSubmitRef = useRef<(rawInput: string) => void>(() => {});

  // Expose submitCommand to parent via ref
  useImperativeHandle(ref, () => ({
    submitCommand: (cmd: string) => {
      handleSubmitRef.current(cmd);
    },
  }));

  // ── Persist command history and aliases ──
  useEffect(() => {
    try { localStorage.setItem('terminal-cmd-history', JSON.stringify(commandHistory)); } catch {}
  }, [commandHistory]);

  useEffect(() => {
    try { localStorage.setItem('terminal-aliases', JSON.stringify(aliases)); } catch {}
  }, [aliases]);

  // ── Clock effect ──
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const dateStr = now.toLocaleDateString('es-ES', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      });
      const timeStr = now.toLocaleTimeString('es-ES');
      setCurrentTime(`${dateStr} • ${timeStr}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // ── Scroll to bottom ──
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  // ── Auto-submit initial command ──
  useEffect(() => {
    if (initialCommand && !initialCommandSent && mounted) {
      setInitialCommandSent(true);
      setTimeout(() => {
        handleSubmitRef.current(initialCommand);
      }, 500);
    }
  }, [initialCommand, initialCommandSent, mounted]);

  // ── handleSubmit ──
  const handleSubmit = useCallback(
    (rawInput: string) => {
      let raw = rawInput.trim();
      if (!raw) return;

      // Check for !n syntax
      if (raw.startsWith('!')) {
        const numStr = raw.slice(1);
        const num = parseInt(numStr, 10);
        if (!isNaN(num) && num > 0 && num <= commandHistory.length) {
          raw = commandHistory[num - 1];
        } else {
          const inputEntry: HistoryEntry = {
            id: genId(),
            type: 'input',
            content: `visitor@portfolio:${currentDir}$ ${rawInput}`,
            timestamp: Date.now(),
          };
          const errorEntry: HistoryEntry = {
            id: genId(),
            type: 'error',
            content: lang === 'en'
              ? `No command at position ${numStr}. Use 'history' to see command list.`
              : `No hay comando en la posición ${numStr}. Usa 'history' para ver la lista.`,
            timestamp: Date.now(),
          };
          setHistory(prev => [...prev, inputEntry, errorEntry]);
          return;
        }
      }

      // Expand aliases
      const firstSpace = raw.indexOf(' ');
      const cmdPart = firstSpace === -1 ? raw : raw.slice(0, firstSpace);
      if (aliases[cmdPart]) {
        raw = aliases[cmdPart] + (firstSpace === -1 ? '' : raw.slice(firstSpace));
      }

      const inputEntry: HistoryEntry = {
        id: genId(),
        type: 'input',
        content: `visitor@portfolio:${currentDir}$ ${rawInput}`,
        timestamp: Date.now(),
      };

      const ctx = {
        lang,
        theme,
        setTheme,
        setLang,
        getHistory: () => history,
        getCommandHistory: () => commandHistory,
        getAliases: () => aliases,
        setAliases,
        getCurrentDir: () => currentDir,
        setCurrentDir: setCurrentDirState,
        getSessionStats: () => ({
          commandCount: commandCount,
          startTime: sessionStartTime
        })
      };
      const result = resolveCommand(raw, ctx);

      setCommandCount(prev => prev + 1);

      const isClearHistory = raw.toLowerCase() === 'clear history';

      setInputValue('');
      if (!isClearHistory) {
        setCommandHistory((prev) => [...prev, raw]);
      } else {
        setCommandHistory([]);
        try { localStorage.removeItem('terminal-cmd-history'); } catch {}
      }
      setHistoryIndex(-1);

      if (result.type === 'clear') {
        setHistory([]);
        resetConversationHistory();
        return;
      }

      if (result.type === 'async') {
        const loaderId = genId();
        const loaderEntry: HistoryEntry = {
          id: loaderId,
          type: 'loader',
          content: result.loader,
          timestamp: Date.now(),
        };

        setHistory((prev) => [...prev, inputEntry, loaderEntry]);
        setIsLoading(true);

        result.promise
          .then(({ text }) => {
            setHistory((prev) =>
              prev.map((e) => e.id === loaderId ? { ...e, type: 'output', content: text } : e)
            );
          })
          .catch((err: Error) => {
            setHistory((prev) =>
              prev.map((e) => e.id === loaderId ? { ...e, type: 'error', content: err.message || 'Error desconocido.' } : e)
            );
          })
          .finally(() => setIsLoading(false));

        return;
      }

      const outputEntry: HistoryEntry = {
        id: genId(),
        type:
          result.type === 'error'
            ? 'error'
            : result.type === 'jsx' || result.type === 'text'
              ? result.content === '__BANNER__' ? 'banner' : 'output'
              : 'output',
        content: result.type === 'error' || result.type === 'text' || result.type === 'jsx'
          ? result.content
          : '',
        timestamp: Date.now(),
      };

      setHistory((prev) => [...prev, inputEntry, outputEntry]);
    },
    [lang, theme, setTheme, setLang, history, commandHistory, aliases, currentDir, commandCount]
  );

  // Keep ref updated
  handleSubmitRef.current = handleSubmit;

  // ── ArrowUp navigation ──
  const handleArrowUp = useCallback(() => {
    if (commandHistory.length === 0) return;
    setHistoryIndex((prev) => {
      const next = prev === -1 ? commandHistory.length - 1 : Math.max(0, prev - 1);
      setInputValue(commandHistory[next] ?? '');
      return next;
    });
  }, [commandHistory]);

  // ── ArrowDown navigation ──
  const handleArrowDown = useCallback(() => {
    if (historyIndex === -1) return;
    setHistoryIndex((prev) => {
      if (prev === commandHistory.length - 1) {
        setInputValue('');
        return -1;
      }
      const next = prev + 1;
      setInputValue(commandHistory[next] ?? '');
      return next;
    });
  }, [commandHistory, historyIndex]);

  // ── Focus input on panel click ──
  function handlePanelClick(e: React.MouseEvent<HTMLDivElement>) {
    const target = e.target as HTMLElement;
    if (target.tagName === 'A' || target.tagName === 'BUTTON') return;
    inputRef.current?.focus();
  }

  return (
    <div
      onClick={handlePanelClick}
      className="terminal-panel fade-in flex flex-col h-full overflow-hidden"
      style={{
        backgroundColor: isEmbedded ? 'transparent' : 'var(--bg-terminal)',
        borderRadius: isEmbedded ? 0 : undefined,
      }}
      suppressHydrationWarning
    >
      {/* Header — only show when not embedded */}
      {!isEmbedded && (
        <>
          {/* Title Bar */}
          <div
            className="flex items-center justify-between px-4 py-2 border-b"
            style={{
              borderColor: 'var(--text-secondary)',
              backgroundColor: 'rgba(0,0,0,0.4)'
            }}
          >
            <div className="flex items-center gap-2">
              <span className="text-sm font-mono" style={{ color: 'var(--text-primary)' }}>
                visitor@portfolio: {currentDir}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-xs md:text-sm font-mono" style={{ color: 'var(--text-secondary)' }}>
                {mounted ? currentTime : '—'}
              </div>
            </div>
          </div>

          {/* Profile Header */}
          <div
            className="px-4 py-3 flex flex-col md:flex-row justify-between items-center gap-2 border-b"
            style={{
              borderColor: 'var(--text-secondary)',
              backgroundColor: 'rgba(0,0,0,0.1)'
            }}
          >
            <div className="text-center md:text-left">
              <h1 className="text-lg md:text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                Matías Angeluk
              </h1>
              <div className="text-xs md:text-sm flex flex-wrap justify-center md:justify-start gap-2 md:gap-4 mt-1" style={{ color: 'var(--text-secondary)' }}>
                <a href="https://github.com/Magamex" target="_blank" rel="noopener noreferrer" className="hover:underline">
                  GitHub
                </a>
                <a href="https://linkedin.com/in/matiasangeluk" target="_blank" rel="noopener noreferrer" className="hover:underline">
                  LinkedIn
                </a>
                <a href="mailto:matiasangeluk@gmail.com" className="hover:underline">
                  Email
                </a>
              </div>
            </div>
          </div>
        </>
      )}

      {/* History area */}
      <div
        role="log"
        aria-live="polite"
        aria-atomic="false"
        aria-label="Historial de la terminal"
        className="flex-1 overflow-y-auto p-4"
        style={{ color: 'var(--text-primary)' }}
      >
        {history.map((entry) =>
          entry.type === 'banner' ? (
            <WelcomeBanner key={entry.id} lang={lang} />
          ) : (
            <OutputLine key={entry.id} entry={entry} theme={theme} />
          )
        )}
        <div ref={bottomRef} />
      </div>

      {/* Mobile shortcuts */}
      <MobileKeyboard onCommand={handleSubmit} disabled={isLoading} />

      {/* Input area */}
      <div className="p-4 pt-0 border-t" style={{ borderColor: 'var(--text-secondary)' }}>
        <InputLine
          ref={inputRef}
          value={inputValue}
          onChange={setInputValue}
          onSubmit={handleSubmit}
          onArrowUp={handleArrowUp}
          onArrowDown={handleArrowDown}
          disabled={isLoading}
          prompt={`visitor@portfolio:${currentDir}$`}
          commandHistory={commandHistory}
        />
      </div>
    </div>
  );
});

export default Terminal;
