'use client';

// src/components/Desktop/Desktop.tsx
// Main desktop container with wallpaper, icons, windows, and taskbar.

import React, { useState, useCallback, useRef } from 'react';
import type { Theme, Lang } from '@/types/terminal';
import { isValidTheme, isValidLang } from '@/lib/theme';
import { resolveCommand } from '@/lib/commands/index';
import { resetConversationHistory } from '@/lib/commands/ai';

// Import all command modules
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

import Terminal from '../Terminal/Terminal';
import Window from './Window';
import DesktopIcon from './DesktopIcon';
import Taskbar from './Taskbar';

interface DesktopWindow {
  id: string;
  title: string;
  icon: string;
  isOpen: boolean;
  isMinimized: boolean;
  isMaximized: boolean;
  initialCommand?: string;
}

const DESKTOP_ICONS = [
  { id: 'terminal', icon: '⬛', label: 'Terminal', command: '' },
  { id: 'about', icon: '👤', label: 'About', command: 'about' },
  { id: 'projects', icon: '📂', label: 'Projects', command: 'projects' },
  { id: 'skills', icon: '⚡', label: 'Skills', command: 'skills' },
  { id: 'experience', icon: '💼', label: 'Experience', command: 'experience' },
  { id: 'contact', icon: '📧', label: 'Contact', command: 'contact' },
];

export default function Desktop() {
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

  const [theme, setThemeState] = useState<Theme>(getInitialTheme);
  const [lang, setLangState] = useState<Lang>(getInitialLang);
  const [windows, setWindows] = useState<DesktopWindow[]>([
    {
      id: 'terminal',
      title: 'visitor@portfolio: ~',
      icon: '⬛',
      isOpen: true,
      isMinimized: false,
      isMaximized: false,
    },
  ]);
  const [activeWindowId, setActiveWindowId] = useState<string>('terminal');
  const [zCounter, setZCounter] = useState(100);
  const terminalRefs = useRef<Map<string, { submitCommand: (cmd: string) => void }>>(new Map());

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    try {
      localStorage.setItem('terminal-theme', t);
    } catch {}
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem('terminal-lang', l);
    } catch {}
  }, []);

  const focusWindow = useCallback((id: string) => {
    setActiveWindowId(id);
    setZCounter((z) => z + 1);
  }, []);

  const openWindow = useCallback((id: string, command?: string) => {
    setWindows((prev) => {
      const existing = prev.find((w) => w.id === id);
      if (existing) {
        return prev.map((w) =>
          w.id === id
            ? { ...w, isOpen: true, isMinimized: false }
            : w
        );
      }
      const icon = DESKTOP_ICONS.find((d) => d.id === id);
      return [
        ...prev,
        {
          id,
          title: id === 'terminal' ? 'visitor@portfolio: ~' : `${icon?.label || id}`,
          icon: icon?.icon || '📄',
          isOpen: true,
          isMinimized: false,
          isMaximized: false,
          initialCommand: command,
        },
      ];
    });
    focusWindow(id);
  }, [focusWindow]);

  const closeWindow = useCallback((id: string) => {
    if (id === 'terminal') return; // Can't close main terminal
    setWindows((prev) => prev.filter((w) => w.id !== id));
    if (activeWindowId === id) {
      setActiveWindowId('terminal');
    }
  }, [activeWindowId]);

  const minimizeWindow = useCallback((id: string) => {
    setWindows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, isMinimized: true } : w))
    );
    if (activeWindowId === id) {
      setActiveWindowId('');
    }
  }, [activeWindowId]);

  const maximizeWindow = useCallback((id: string) => {
    setWindows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, isMaximized: !w.isMaximized } : w))
    );
  }, []);

  const handleDesktopClick = useCallback(() => {
    setActiveWindowId('');
  }, []);

  const handleIconClick = useCallback((iconId: string, command: string) => {
    if (iconId === 'terminal') {
      openWindow('terminal');
    } else {
      // For content icons, open terminal and run command
      openWindow('terminal');
      // We need to submit a command to the terminal
      // We'll use a ref to the terminal's submit function
      setTimeout(() => {
        const terminalRef = terminalRefs.current.get('terminal');
        if (terminalRef && command) {
          terminalRef.submitCommand(command);
        }
      }, 100);
    }
  }, [openWindow]);

  const handleTaskbarAppClick = useCallback((id: string) => {
    const win = windows.find((w) => w.id === id);
    if (!win) return;

    if (win.isMinimized) {
      // Restore
      setWindows((prev) =>
        prev.map((w) => (w.id === id ? { ...w, isMinimized: false } : w))
      );
      focusWindow(id);
    } else if (activeWindowId === id) {
      // Minimize
      minimizeWindow(id);
    } else {
      // Focus
      focusWindow(id);
    }
  }, [windows, activeWindowId, focusWindow, minimizeWindow]);

  const handleToggleLang = useCallback(() => {
    setLang(lang === 'es' ? 'en' : 'es');
  }, [lang, setLang]);

  // Get terminal commands context for the desktop
  const getTerminalCtx = useCallback(() => ({
    lang,
    theme,
    setTheme,
    setLang,
    getHistory: () => [],
    getCommandHistory: () => [],
    getAliases: () => ({}),
    setAliases: () => {},
    getCurrentDir: () => '~',
    setCurrentDir: () => {},
    getSessionStats: () => ({ commandCount: 0, startTime: Date.now() }),
  }), [lang, theme, setTheme, setLang]);

  return (
    <div className="os-desktop" onClick={handleDesktopClick}>
      {/* Desktop icons */}
      <div className="os-desktop__icons">
        {DESKTOP_ICONS.map((iconDef) => (
          <DesktopIcon
            key={iconDef.id}
            icon={iconDef.icon}
            label={iconDef.label}
            onClick={() => handleIconClick(iconDef.id, iconDef.command)}
          />
        ))}
      </div>

      {/* Windows */}
      {windows.map((win, index) => (
        <Window
          key={win.id}
          id={win.id}
          title={win.title}
          icon={<span>{win.icon}</span>}
          isOpen={win.isOpen && !win.isMinimized}
          isMinimized={win.isMinimized}
          isMaximized={win.isMaximized}
          onClose={() => closeWindow(win.id)}
          onMinimize={() => minimizeWindow(win.id)}
          onMaximize={() => maximizeWindow(win.id)}
          onFocus={() => focusWindow(win.id)}
          zIndex={activeWindowId === win.id ? zCounter + 1 : 100 + index}
          initialX={win.id === 'terminal' ? 80 : 120 + index * 40}
          initialY={win.id === 'terminal' ? 40 : 60 + index * 40}
        >
          <Terminal
            theme={theme}
            lang={lang}
            setTheme={setTheme}
            setLang={setLang}
            isEmbedded={true}
            initialCommand={win.initialCommand}
          />
        </Window>
      ))}

      {/* Taskbar */}
      <Taskbar
        apps={windows.map((w) => ({
          id: w.id,
          icon: w.icon,
          title: w.title,
          isActive: activeWindowId === w.id,
          isMinimized: w.isMinimized,
          onClick: () => handleTaskbarAppClick(w.id),
        }))}
        lang={lang}
        onToggleLang={handleToggleLang}
      />
    </div>
  );
}
