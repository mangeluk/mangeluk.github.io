'use client';

// src/components/Desktop/Desktop.tsx
// Main desktop container with wallpaper, icons, windows, and taskbar.

import React, { useState, useCallback } from 'react';
import type { Theme, Lang } from '@/types/terminal';
import { isValidTheme, isValidLang } from '@/lib/theme';

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
import ContentWindow from './ContentWindow';

interface DesktopWindow {
  id: string;
  title: string;
  icon: string;
  isOpen: boolean;
  isMinimized: boolean;
  isMaximized: boolean;
  /** If set, window renders a content viewer instead of terminal */
  contentType?: 'about' | 'projects' | 'skills' | 'experience' | 'contact';
  /** Command to auto-submit when terminal opens */
  initialCommand?: string;
}

const DESKTOP_ICONS = [
  { id: 'terminal', icon: '⬛', label: 'Terminal', command: '' },
  { id: 'about', icon: '👤', label: 'About', contentType: 'about' as const },
  { id: 'projects', icon: '📂', label: 'Projects', contentType: 'projects' as const },
  { id: 'skills', icon: '⚡', label: 'Skills', contentType: 'skills' as const },
  { id: 'experience', icon: '💼', label: 'Experience', contentType: 'experience' as const },
  { id: 'contact', icon: '📧', label: 'Contact', contentType: 'contact' as const },
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
      title: 'Terminal',
      icon: '⬛',
      isOpen: true,
      isMinimized: false,
      isMaximized: false,
    },
  ]);
  const [activeWindowId, setActiveWindowId] = useState<string>('terminal');
  const [zCounter, setZCounter] = useState(100);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    try { localStorage.setItem('terminal-theme', t); } catch {}
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try { localStorage.setItem('terminal-lang', l); } catch {}
  }, []);

  const focusWindow = useCallback((id: string) => {
    setActiveWindowId(id);
    setZCounter((z) => z + 1);
  }, []);

  const openWindow = useCallback((id: string, contentType?: 'about' | 'projects' | 'skills' | 'experience' | 'contact') => {
    setWindows((prev) => {
      const existing = prev.find((w) => w.id === id);
      if (existing) {
        return prev.map((w) =>
          w.id === id ? { ...w, isOpen: true, isMinimized: false } : w
        );
      }
      const icon = DESKTOP_ICONS.find((d) => d.id === id);
      return [
        ...prev,
        {
          id,
          title: icon?.label || id,
          icon: icon?.icon || '📄',
          isOpen: true,
          isMinimized: false,
          isMaximized: false,
          contentType,
        },
      ];
    });
    focusWindow(id);
  }, [focusWindow]);

  const closeWindow = useCallback((id: string) => {
    setWindows((prev) => prev.filter((w) => w.id !== id));
    if (activeWindowId === id) {
      // Focus the most recently focused remaining window
      setActiveWindowId('');
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

  const handleIconDoubleClick = useCallback((iconId: string, contentType?: 'about' | 'projects' | 'skills' | 'experience' | 'contact') => {
    if (iconId === 'terminal') {
      openWindow('terminal');
    } else if (contentType) {
      openWindow(iconId, contentType);
    }
  }, [openWindow]);

  const handleTaskbarAppClick = useCallback((id: string) => {
    const win = windows.find((w) => w.id === id);
    if (!win) return;

    if (win.isMinimized) {
      setWindows((prev) =>
        prev.map((w) => (w.id === id ? { ...w, isMinimized: false } : w))
      );
      focusWindow(id);
    } else if (activeWindowId === id) {
      minimizeWindow(id);
    } else {
      focusWindow(id);
    }
  }, [windows, activeWindowId, focusWindow, minimizeWindow]);

  const handleToggleLang = useCallback(() => {
    setLang(lang === 'es' ? 'en' : 'es');
  }, [lang, setLang]);

  return (
    <div className="os-desktop" onClick={handleDesktopClick}>
      {/* Desktop icons */}
      <div className="os-desktop__icons">
        {DESKTOP_ICONS.map((iconDef) => (
          <DesktopIcon
            key={iconDef.id}
            icon={iconDef.icon}
            label={iconDef.label}
            onDoubleClick={() => handleIconDoubleClick(iconDef.id, iconDef.contentType)}
          />
        ))}
      </div>

      {/* Windows */}
      {windows.map((win, index) => {
        // Determine z-index: active window on top, others in insertion order
        const isActive = activeWindowId === win.id;
        const winZ = isActive ? zCounter + 1 : 100 + index;

        return (
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
            zIndex={winZ}
            initialX={win.id === 'terminal' ? 100 : 160 + index * 30}
            initialY={win.id === 'terminal' ? 30 : 50 + index * 30}
          >
            {win.contentType ? (
              <ContentWindow contentType={win.contentType} lang={lang} />
            ) : (
              <Terminal
                theme={theme}
                lang={lang}
                setTheme={setTheme}
                setLang={setLang}
                isEmbedded={true}
              />
            )}
          </Window>
        );
      })}

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
