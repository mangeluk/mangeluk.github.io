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
import StartMenu from './StartMenu';
import { SnakeGame } from '../Games';
import { TetrisGame } from '../Games';
import { Game2048 } from '../Games';
import { PongGame } from '../Games';
import { QuizGame } from '../Games';
import { DoomGame } from '../Games';
import { CalculatorApp } from '../Utilities';
import { NotepadApp } from '../Utilities';
import { WeatherApp } from '../Utilities';

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
  /** If set, window renders a game */
  gameType?: 'snake' | 'tetris' | '2048' | 'pong' | 'quiz' | 'doom';
  /** If set, window renders a utility app */
  utilityType?: 'calculator' | 'notepad' | 'weather';
}

const DESKTOP_ICONS = [
  { id: 'terminal', icon: '⬛', label: 'Terminal', command: '' },
  { id: 'about', icon: '👤', label: 'About', contentType: 'about' as const },
  { id: 'projects', icon: '📂', label: 'Projects', contentType: 'projects' as const },
  { id: 'skills', icon: '⚡', label: 'Skills', contentType: 'skills' as const },
  { id: 'experience', icon: '💼', label: 'Experience', contentType: 'experience' as const },
  { id: 'contact', icon: '📧', label: 'Contact', contentType: 'contact' as const },
];

const GAME_ICONS: Record<string, { icon: string; label: string }> = {
  snake: { icon: '🐍', label: 'Snake' },
  tetris: { icon: '🧱', label: 'Tetris' },
  '2048': { icon: '🔢', label: '2048' },
  pong: { icon: '🏓', label: 'Pong' },
  quiz: { icon: '❓', label: 'Quiz' },
  doom: { icon: '👹', label: 'Doom' },
};

const UTILITY_ICONS: Record<string, { icon: string; label: string }> = {
  calculator: { icon: '🧮', label: 'Calculator' },
  notepad: { icon: '📝', label: 'Notepad' },
  weather: { icon: '🌤️', label: 'Weather' },
};

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
  const [startMenuOpen, setStartMenuOpen] = useState(false);

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

  const openWindow = useCallback((
    id: string,
    contentType?: 'about' | 'projects' | 'skills' | 'experience' | 'contact',
    gameType?: 'snake' | 'tetris' | '2048' | 'pong' | 'quiz' | 'doom',
    utilityType?: 'calculator' | 'notepad' | 'weather',
  ) => {
    setWindows((prev) => {
      const existing = prev.find((w) => w.id === id);
      if (existing) {
        return prev.map((w) =>
          w.id === id ? { ...w, isOpen: true, isMinimized: false } : w
        );
      }

      let icon = '📄';
      let title = id;

      if (utilityType && UTILITY_ICONS[utilityType]) {
        icon = UTILITY_ICONS[utilityType].icon;
        title = UTILITY_ICONS[utilityType].label;
      } else if (gameType && GAME_ICONS[gameType]) {
        icon = GAME_ICONS[gameType].icon;
        title = GAME_ICONS[gameType].label;
      } else {
        const iconDef = DESKTOP_ICONS.find((d) => d.id === id);
        if (iconDef) {
          icon = iconDef.icon;
          title = iconDef.label;
        }
      }

      return [
        ...prev,
        {
          id,
          title,
          icon,
          isOpen: true,
          isMinimized: false,
          isMaximized: false,
          contentType,
          gameType,
          utilityType,
        },
      ];
    });
    focusWindow(id);
  }, [focusWindow]);

  const closeWindow = useCallback((id: string) => {
    setWindows((prev) => prev.filter((w) => w.id !== id));
    if (activeWindowId === id) {
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

  const handleDesktopClick = useCallback((e: React.MouseEvent) => {
    // Don't close start menu if clicking on taskbar or start menu itself
    const target = e.target as HTMLElement;
    if (target.closest('.os-taskbar') || target.closest('.start-menu') || target.closest('.start-menu-backdrop')) {
      return;
    }
    setActiveWindowId('');
    setStartMenuOpen(false);
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

  const handleStartMenuOpen = useCallback((id: string, type: 'terminal' | 'game' | 'content' | 'utility', contentType?: string) => {
    if (type === 'terminal') {
      openWindow('terminal');
    } else if (type === 'game') {
      openWindow(id, undefined, id as 'snake' | 'tetris' | '2048' | 'pong' | 'quiz' | 'doom');
    } else if (type === 'content' && contentType) {
      openWindow(id, contentType as 'about' | 'projects' | 'skills' | 'experience' | 'contact');
    } else if (type === 'utility') {
      openWindow(id, undefined, undefined, id as 'calculator' | 'notepad' | 'weather');
    }
  }, [openWindow]);

  const renderGameContent = useCallback((gameType: string) => {
    switch (gameType) {
      case 'snake': return <SnakeGame />;
      case 'tetris': return <TetrisGame />;
      case '2048': return <Game2048 />;
      case 'pong': return <PongGame />;
      case 'quiz': return <QuizGame lang={lang} />;
      case 'doom': return <DoomGame />;
      default: return <div>Game not found</div>;
    }
  }, [lang]);

  const renderUtilityContent = useCallback((utilityType: string) => {
    switch (utilityType) {
      case 'calculator': return <CalculatorApp />;
      case 'notepad': return <NotepadApp />;
      case 'weather': return <WeatherApp />;
      default: return <div>App not found</div>;
    }
  }, []);

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
            {win.gameType ? (
              renderGameContent(win.gameType)
            ) : win.utilityType ? (
              renderUtilityContent(win.utilityType)
            ) : win.contentType ? (
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

      {/* Start Menu */}
      <StartMenu
        isOpen={startMenuOpen}
        onClose={() => setStartMenuOpen(false)}
        onOpenApp={handleStartMenuOpen}
      />

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
        onStartClick={() => setStartMenuOpen((o) => !o)}
        isStartMenuOpen={startMenuOpen}
      />
    </div>
  );
}
