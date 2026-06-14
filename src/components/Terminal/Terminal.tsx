'use client';

// src/components/Terminal/Terminal.tsx
// Main stateful terminal component.
// Requirements: 1.1–1.9, 8.1–8.3, 9.1–9.3, 14.5–14.6, 15.4–15.5, 18.2–18.3, 19.1, 19.5, 22.2

import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { HistoryEntry, Theme, Lang } from '@/types/terminal';
import { isValidTheme, isValidLang } from '@/lib/theme';
import { resolveCommand } from '@/lib/commands/index';

// Import command modules to register all commands via side effects
import '@/lib/commands/help';
import '@/lib/commands/content';
import '@/lib/commands/utility';
import '@/lib/commands/ai';
import '@/lib/commands/filesystem';
import '@/lib/commands/extras';
import { resetConversationHistory } from '@/lib/commands/ai';

import OutputLine from './OutputLine';
import InputLine from './InputLine';
import WelcomeBanner from './WelcomeBanner';
import MobileKeyboard from '../MobileKeyboard';

function genId(): string {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
}

export default function Terminal() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [theme, setThemeState] = useState<Theme>('dark');
  const [lang, setLangState] = useState<Lang>('es');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  const [aliases, setAliases] = useState<Record<string, string>>({});
  // Nuevos estados globales
  const [currentDir, setCurrentDirState] = useState<string>('~');
  const sessionStatsStartTime = useRef(Date.now());
  const [commandCount, setCommandCount] = useState(0);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // ── On mount: restore theme, lang, command history and aliases from localStorage ──
  useEffect(() => {
    try {
      const storedTheme = localStorage.getItem('terminal-theme');
      const storedLang = localStorage.getItem('terminal-lang');
      const storedCmdHistory = localStorage.getItem('terminal-cmd-history');
      const storedAliases = localStorage.getItem('terminal-aliases');
      
      if (storedTheme && isValidTheme(storedTheme)) setThemeState(storedTheme);
      if (storedLang && isValidLang(storedLang)) setLangState(storedLang);
      if (storedCmdHistory) setCommandHistory(JSON.parse(storedCmdHistory));
      if (storedAliases) setAliases(JSON.parse(storedAliases));
    } catch {
      // localStorage unavailable — use defaults
    }

    // Show WelcomeBanner as first entry (Req. 9.2)
    setHistory([
      {
        id: genId(),
        type: 'banner',
        content: '__BANNER__',
        timestamp: Date.now(),
      },
    ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Persist command history and aliases to localStorage when they change ──
  useEffect(() => {
    try {
      localStorage.setItem('terminal-cmd-history', JSON.stringify(commandHistory));
    } catch { /* ignore */ }
  }, [commandHistory]);

  useEffect(() => {
    try {
      localStorage.setItem('terminal-aliases', JSON.stringify(aliases));
    } catch { /* ignore */ }
  }, [aliases]);

  // ── Scroll to bottom on every history change (Req. 1.5, 18.3) ──
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  // ── Theme setter — also updates data-theme on wrapper ──
  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
  }, []);

  // ── Lang setter ──
  const setLang = useCallback((l: Lang) => {
    setLangState(l);
  }, []);

  // ── handleSubmit ──
  const handleSubmit = useCallback(
    (rawInput: string) => {
      let raw = rawInput.trim();
      if (!raw) return; // Req. 1.3: ignore empty/whitespace

      // 1. Check for !n syntax to re-run command
      if (raw.startsWith('!')) {
        const numStr = raw.slice(1);
        const num = parseInt(numStr, 10);
        if (!isNaN(num) && num > 0 && num <= commandHistory.length) {
          raw = commandHistory[num - 1];
        } else {
          // Show error if invalid number
          const inputEntry: HistoryEntry = {
            id: genId(),
            type: 'input',
            content: `visitor@portfolio:~$ ${rawInput}`,
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

      // 2. Expand aliases
      const firstSpace = raw.indexOf(' ');
      const cmdPart = firstSpace === -1 ? raw : raw.slice(0, firstSpace);
      if (aliases[cmdPart]) {
        raw = aliases[cmdPart] + (firstSpace === -1 ? '' : raw.slice(firstSpace));
      }

      // Echo the input (Req. 1.2)
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
          startTime: sessionStatsStartTime.current
        })
      };
      const result = resolveCommand(raw, ctx);

      // Incrementar contador de comandos
      setCommandCount(prev => prev + 1);

      // Check if this is a clear history command
      const isClearHistory = raw.toLowerCase() === 'clear history';

      setInputValue('');
      if (!isClearHistory) {
        setCommandHistory((prev) => [...prev, raw]);
      } else {
        // Clear command history
        setCommandHistory([]);
        try {
          localStorage.removeItem('terminal-cmd-history');
        } catch {
          // ignore
        }
      }
      setHistoryIndex(-1);

      if (result.type === 'clear') {
        // Req. 8.1: clear history entirely
        setHistory([]);
        resetConversationHistory(); // Also reset AI conversation history
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
              prev.map((e) =>
                e.id === loaderId
                  ? { ...e, type: 'output', content: text }
                  : e
              )
            );
          })
          .catch((err: Error) => {
            setHistory((prev) =>
              prev.map((e) =>
                e.id === loaderId
                  ? { ...e, type: 'error', content: err.message || 'Error desconocido.' }
                  : e
              )
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
              ? result.content === '__BANNER__'
                ? 'banner'
                : 'output'
              : 'output',
        content: result.type === 'error' || result.type === 'text' || result.type === 'jsx'
          ? result.content
          : '',
        timestamp: Date.now(),
      };

      setHistory((prev) => [...prev, inputEntry, outputEntry]);
    },
    [lang, theme, setTheme, setLang, history, commandHistory, aliases]
  );

  // ── ArrowUp navigation (Req. 1.7) ──
  const handleArrowUp = useCallback(() => {
    if (commandHistory.length === 0) return;
    setHistoryIndex((prev) => {
      const next = prev === -1 ? commandHistory.length - 1 : Math.max(0, prev - 1);
      setInputValue(commandHistory[next] ?? '');
      return next;
    });
  }, [commandHistory]);

  // ── ArrowDown navigation (Req. 1.8) ──
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

  // ── Focus input on panel click (Req. 19.5) ──
  function handlePanelClick(e: React.MouseEvent<HTMLDivElement>) {
    const target = e.target as HTMLElement;
    if (target.tagName === 'A' || target.tagName === 'BUTTON') return;
    inputRef.current?.focus();
  }

  return (
    <div
      data-theme={theme}
      onClick={handlePanelClick}
      className="terminal-panel flex flex-col h-[100dvh] md:h-[80vh] md:max-w-[900px] md:w-full md:mx-auto md:rounded-lg overflow-hidden"
      style={{ backgroundColor: 'var(--bg-terminal)' }}
    >
      {/* History area (Req. 22.2) */}
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

      {/* Mobile shortcuts (Req. 19.2) */}
      <MobileKeyboard onCommand={handleSubmit} disabled={isLoading} />

      {/* Input area (Req. 1.1) */}
      <div className="p-4 pt-0" style={{ borderTop: '1px solid var(--text-secondary)' }}>
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
}
