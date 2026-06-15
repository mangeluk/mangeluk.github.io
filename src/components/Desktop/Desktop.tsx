'use client';

// src/components/Desktop/Desktop.tsx
// Main desktop container with wallpaper, icons, windows, and taskbar.

import React, { useState, useCallback, useEffect, useRef } from 'react';
import type { Theme, Lang } from '@/types/terminal';
import { isValidTheme, isValidLang } from '@/lib/theme';

import Terminal from '../Terminal/Terminal';
import Window from './Window';
import DesktopIcon from './DesktopIcon';
import Taskbar from './Taskbar';
import ContentWindow from './ContentWindow';
import StartMenu from './StartMenu';
import ContextMenu from './ContextMenu';
const SnakeGame = React.lazy(() => import('../Games/SnakeGame'));
const TetrisGame = React.lazy(() => import('../Games/TetrisGame'));
const Game2048 = React.lazy(() => import('../Games/Game2048'));
const PongGame = React.lazy(() => import('../Games/PongGame'));
const QuizGame = React.lazy(() => import('../Games/QuizGame'));
const DoomGame = React.lazy(() => import('../Games/DoomGame'));
const MinesweeperGame = React.lazy(() => import('../Games/Minesweeper'));
const BreakoutGame = React.lazy(() => import('../Games/Breakout'));
const FlappyBirdGame = React.lazy(() => import('../Games/FlappyBird'));
const ChessGame = React.lazy(() => import('../Games/Chess'));
const SolitaireGame = React.lazy(() => import('../Games/Solitaire'));

const CalculatorApp = React.lazy(() => import('../Utilities/CalculatorApp'));
const NotepadApp = React.lazy(() => import('../Utilities/NotepadApp'));
const WeatherApp = React.lazy(() => import('../Utilities/WeatherApp'));
const SettingsApp = React.lazy(() => import('../Utilities/SettingsApp'));
const FileManagerApp = React.lazy(() => import('../Utilities/FileManagerApp'));
const CalendarApp = React.lazy(() => import('../Utilities/CalendarApp'));
const SystemMonitorApp = React.lazy(() => import('../Utilities/SystemMonitorApp'));
const MusicPlayerApp = React.lazy(() => import('../Utilities/MusicPlayerApp'));
const PomodoroApp = React.lazy(() => import('../Utilities/PomodoroApp'));
const QRCodeApp = React.lazy(() => import('../Utilities/QRCodeApp'));

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
  gameType?: 'snake' | 'tetris' | '2048' | 'pong' | 'quiz' | 'doom' | 'minesweeper' | 'breakout' | 'flappybird' | 'chess' | 'solitaire';
  /** If set, window renders a utility app */
  utilityType?: 'calculator' | 'notepad' | 'weather' | 'settings' | 'filemanager' | 'calendar' | 'sysmonitor' | 'musicplayer' | 'pomodoro' | 'qrcode';
}

const DESKTOP_ICONS = [
  { id: 'terminal', icon: '⬛', label: 'Terminal', type: 'terminal' as const },
  { id: 'about', icon: '👤', label: 'About', type: 'content' as const, contentType: 'about' as const },
  { id: 'projects', icon: '📂', label: 'Projects', type: 'content' as const, contentType: 'projects' as const },
  { id: 'skills', icon: '⚡', label: 'Skills', type: 'content' as const, contentType: 'skills' as const },
  { id: 'experience', icon: '💼', label: 'Experience', type: 'content' as const, contentType: 'experience' as const },
  { id: 'contact', icon: '📧', label: 'Contact', type: 'content' as const, contentType: 'contact' as const },
];

const UTILITY_ICONS = [
  { id: 'calculator', icon: '🧮', label: 'Calculator', type: 'utility' as const },
  { id: 'notepad', icon: '📝', label: 'Notepad', type: 'utility' as const },
  { id: 'weather', icon: '🌤️', label: 'Weather', type: 'utility' as const },
  { id: 'calendar', icon: '📅', label: 'Calendar', type: 'utility' as const },
  { id: 'settings', icon: '⚙️', label: 'Settings', type: 'utility' as const },
  { id: 'filemanager', icon: '📁', label: 'File Manager', type: 'utility' as const },
  { id: 'pomodoro', icon: '🍅', label: 'Pomodoro', type: 'utility' as const },
  { id: 'qrcode', icon: '📱', label: 'QR Code', type: 'utility' as const },
  { id: 'sysmonitor', icon: '📊', label: 'Sys Monitor', type: 'utility' as const },
  { id: 'musicplayer', icon: '🎵', label: 'Music Player', type: 'utility' as const },
];

const GAME_ICONS = [
  { id: 'snake', icon: '🐍', label: 'Snake', type: 'game' as const },
  { id: 'tetris', icon: '🧱', label: 'Tetris', type: 'game' as const },
  { id: '2048', icon: '🔢', label: '2048', type: 'game' as const },
  { id: 'pong', icon: '🏓', label: 'Pong', type: 'game' as const },
  { id: 'chess', icon: '♟️', label: 'Chess', type: 'game' as const },
  { id: 'solitaire', icon: '🃏', label: 'Solitaire', type: 'game' as const },
  { id: 'minesweeper', icon: '💣', label: 'Minesweeper', type: 'game' as const },
  { id: 'flappybird', icon: '🐦', label: 'Flappy Bird', type: 'game' as const },
  { id: 'breakout', icon: '🧱', label: 'Breakout', type: 'game' as const },
  { id: 'quiz', icon: '❓', label: 'Quiz', type: 'game' as const },
  { id: 'doom', icon: '👹', label: 'Doom', type: 'game' as const },
];

const GAME_ICON_MAP: Record<string, { icon: string; label: string }> = {
  snake: { icon: '🐍', label: 'Snake' },
  tetris: { icon: '🧱', label: 'Tetris' },
  '2048': { icon: '🔢', label: '2048' },
  pong: { icon: '🏓', label: 'Pong' },
  quiz: { icon: '❓', label: 'Quiz' },
  doom: { icon: '👹', label: 'Doom' },
  minesweeper: { icon: '💣', label: 'Minesweeper' },
  breakout: { icon: '🧱', label: 'Breakout' },
  flappybird: { icon: '🐦', label: 'Flappy Bird' },
  chess: { icon: '♟️', label: 'Chess' },
  solitaire: { icon: '🃏', label: 'Solitaire' },
};

const UTILITY_ICON_MAP: Record<string, { icon: string; label: string }> = {
  calculator: { icon: '🧮', label: 'Calculator' },
  notepad: { icon: '📝', label: 'Notepad' },
  weather: { icon: '🌤️', label: 'Weather' },
  settings: { icon: '⚙️', label: 'Settings' },
  filemanager: { icon: '📁', label: 'File Manager' },
  calendar: { icon: '📅', label: 'Calendar' },
  sysmonitor: { icon: '📊', label: 'System Monitor' },
  musicplayer: { icon: '🎵', label: 'Music Player' },
  pomodoro: { icon: '🍅', label: 'Pomodoro' },
  qrcode: { icon: '📱', label: 'QR Code' },
};

export default function Desktop() {
  function getInitialTheme(): Theme {
    try {
      const stored = localStorage.getItem('terminal-theme');
      if (stored && isValidTheme(stored)) return stored;
    } catch {}
    // Auto-detect from OS preference
    if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: light)').matches) {
      return 'light';
    }
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
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [iconContextMenu, setIconContextMenu] = useState<{ x: number; y: number; iconId: string } | null>(null);
  const [altTabActive, setAltTabActive] = useState(false);
  const [altTabIndex, setAltTabIndex] = useState(0);
  const altHeld = useRef(false);

  // Apply saved font size on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('terminal-font-size');
      const sizes: Record<string, string> = { small: '12px', medium: '14px', large: '16px' };
      if (saved && sizes[saved]) {
        document.documentElement.style.setProperty('--term-font-size', sizes[saved]);
      }
    } catch {}
  }, []);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    try {
      localStorage.setItem('terminal-theme', t);
      document.documentElement.setAttribute('data-theme', t);
    } catch {}
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try { localStorage.setItem('terminal-lang', l); } catch {}
  }, []);

  const focusWindow = useCallback((id: string) => {
    setActiveWindowId(id);
    setZCounter((z) => z + 1);
  }, []);

  // Alt+Tab window switching
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Alt') {
        if (!altHeld.current) {
          altHeld.current = true;
          const openWins = windows.filter((w) => w.isOpen);
          if (openWins.length > 1) {
            const currentIdx = openWins.findIndex((w) => w.id === activeWindowId);
            setAltTabActive(true);
            setAltTabIndex(currentIdx >= 0 ? (currentIdx + 1) % openWins.length : 0);
          }
        }
        e.preventDefault();
        return;
      }
      if (altHeld.current && e.key === 'Tab') {
        e.preventDefault();
        const openWins = windows.filter((w) => w.isOpen);
        setAltTabIndex((prev) => (prev + (e.shiftKey ? -1 : 1) + openWins.length) % openWins.length);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Alt') {
        altHeld.current = false;
        if (altTabActive) {
          const openWins = windows.filter((w) => w.isOpen);
          if (openWins.length > 0 && altTabIndex < openWins.length) {
            const targetId = openWins[altTabIndex].id;
            focusWindow(targetId);
            setWindows((prev) =>
              prev.map((w) =>
                w.id === targetId ? { ...w, isMinimized: false } : w
              )
            );
          }
          setAltTabActive(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [windows, activeWindowId, altTabActive, altTabIndex, focusWindow]);

  const openWindow = useCallback((
    id: string,
    contentType?: 'about' | 'projects' | 'skills' | 'experience' | 'contact',
    gameType?: 'snake' | 'tetris' | '2048' | 'pong' | 'quiz' | 'doom' | 'minesweeper' | 'breakout' | 'flappybird' | 'chess' | 'solitaire',
    utilityType?: 'calculator' | 'notepad' | 'weather' | 'settings' | 'filemanager' | 'calendar' | 'sysmonitor' | 'musicplayer' | 'pomodoro' | 'qrcode',
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

      if (utilityType && UTILITY_ICON_MAP[utilityType]) {
        icon = UTILITY_ICON_MAP[utilityType].icon;
        title = UTILITY_ICON_MAP[utilityType].label;
      } else if (gameType && GAME_ICON_MAP[gameType]) {
        icon = GAME_ICON_MAP[gameType].icon;
        title = GAME_ICON_MAP[gameType].label;
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
    if (target.closest('.os-taskbar') || target.closest('.start-menu') || target.closest('.start-menu-backdrop') || target.closest('.os-context-menu')) {
      return;
    }
    setActiveWindowId('');
    setStartMenuOpen(false);
  }, []);

  const handleDesktopContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const target = e.target as HTMLElement;
    if (target.closest('.os-taskbar') || target.closest('.start-menu')) {
      return;
    }
    setContextMenu({ x: e.clientX, y: e.clientY });
  }, []);

  const handleContextNewTerminal = useCallback(() => {
    openWindow('terminal');
  }, [openWindow]);

  const handleContextChangeWallpaper = useCallback(() => {
    openWindow('settings', undefined, undefined, 'settings');
  }, [openWindow]);

  const handleContextAbout = useCallback(() => {
    openWindow('about', 'about');
  }, [openWindow]);

  const handleIconDoubleClick = useCallback((iconId: string, iconType?: string, contentType?: string) => {
    if (iconId === 'terminal') {
      openWindow('terminal');
    } else if (iconType === 'content' && contentType) {
      openWindow(iconId, contentType as 'about' | 'projects' | 'skills' | 'experience' | 'contact');
    } else if (iconType === 'game') {
      openWindow(iconId, undefined, iconId as 'snake' | 'tetris' | '2048' | 'pong' | 'quiz' | 'doom' | 'minesweeper' | 'breakout' | 'flappybird' | 'chess' | 'solitaire');
    } else if (iconType === 'utility') {
      openWindow(iconId, undefined, undefined, iconId as 'calculator' | 'notepad' | 'weather' | 'settings' | 'filemanager' | 'calendar' | 'sysmonitor' | 'musicplayer' | 'pomodoro' | 'qrcode');
    }
  }, [openWindow]);

  const handleIconRightClick = useCallback((e: { x: number; y: number; iconId: string }) => {
    setIconContextMenu(e);
  }, []);

  const handleIconContextOpen = useCallback(() => {
    if (!iconContextMenu) return;
    const iconDef = DESKTOP_ICONS.find((d) => d.id === iconContextMenu.iconId);
    if (iconDef) {
      handleIconDoubleClick(iconContextMenu.iconId, iconDef.type, 'contentType' in iconDef ? iconDef.contentType : undefined);
    }
    setIconContextMenu(null);
  }, [iconContextMenu, handleIconDoubleClick]);

  const handleIconContextProperties = useCallback(() => {
    if (!iconContextMenu) return;
    const iconDef = DESKTOP_ICONS.find((d) => d.id === iconContextMenu.iconId);
    if (iconDef) {
      window.alert(`${iconDef.label}\nID: ${iconDef.id}\nType: ${iconDef.contentType ?? 'terminal'}`);
    }
    setIconContextMenu(null);
  }, [iconContextMenu]);

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
      openWindow(id, undefined, id as 'snake' | 'tetris' | '2048' | 'pong' | 'quiz' | 'doom' | 'minesweeper' | 'breakout' | 'flappybird' | 'chess' | 'solitaire');
    } else if (type === 'content' && contentType) {
      openWindow(id, contentType as 'about' | 'projects' | 'skills' | 'experience' | 'contact');
    } else if (type === 'utility') {
      openWindow(id, undefined, undefined, id as 'calculator' | 'notepad' | 'weather' | 'settings' | 'filemanager' | 'calendar' | 'sysmonitor' | 'musicplayer' | 'pomodoro' | 'qrcode');
    }
  }, [openWindow]);

  const renderGameContent = useCallback((gameType: string) => {
    let content: React.ReactNode;
    switch (gameType) {
      case 'snake': content = <SnakeGame />; break;
      case 'tetris': content = <TetrisGame />; break;
      case '2048': content = <Game2048 />; break;
      case 'pong': content = <PongGame />; break;
      case 'quiz': content = <QuizGame lang={lang} />; break;
      case 'doom': content = <DoomGame />; break;
      case 'minesweeper': content = <MinesweeperGame />; break;
      case 'breakout': content = <BreakoutGame />; break;
      case 'flappybird': content = <FlappyBirdGame />; break;
      case 'chess': content = <ChessGame />; break;
      case 'solitaire': content = <SolitaireGame />; break;
      default: content = <div>Game not found</div>;
    }
    return <React.Suspense fallback={<div style={{ padding: 16, color: '#00ff9f' }}>Loading...</div>}>{content}</React.Suspense>;
  }, [lang]);

  const renderUtilityContent = useCallback((utilityType: string) => {
    let content: React.ReactNode;
    switch (utilityType) {
      case 'calculator': content = <CalculatorApp />; break;
      case 'notepad': content = <NotepadApp />; break;
      case 'weather': content = <WeatherApp />; break;
      case 'settings': content = <SettingsApp theme={theme} lang={lang} setTheme={(t) => setTheme(t as Theme)} setLang={(l) => setLang(l as Lang)} />; break;
      case 'filemanager': content = <FileManagerApp />; break;
      case 'calendar': content = <CalendarApp />; break;
      case 'sysmonitor': content = <SystemMonitorApp />; break;
      case 'musicplayer': content = <MusicPlayerApp />; break;
      case 'pomodoro': content = <PomodoroApp />; break;
      case 'qrcode': content = <QRCodeApp />; break;
      default: content = <div>App not found</div>;
    }
    return <React.Suspense fallback={<div style={{ padding: 16, color: '#00ff9f' }}>Loading...</div>}>{content}</React.Suspense>;
  }, [theme, lang, setTheme, setLang]);

  return (
    <div className="os-desktop" onClick={handleDesktopClick} onContextMenu={handleDesktopContextMenu}>
      {/* Desktop icons */}
      <div className="os-desktop__icons os-desktop__icons--portfolio">
        {DESKTOP_ICONS.map((iconDef) => (
          <DesktopIcon
            key={iconDef.id}
            icon={iconDef.icon}
            label={iconDef.label}
            iconId={iconDef.id}
            onDoubleClick={() => handleIconDoubleClick(iconDef.id, iconDef.type, 'contentType' in iconDef ? iconDef.contentType : undefined)}
            onRightClick={handleIconRightClick}
          />
        ))}
      </div>
      <div className="os-desktop__icons os-desktop__icons--utils">
        {UTILITY_ICONS.map((iconDef) => (
          <DesktopIcon
            key={iconDef.id}
            icon={iconDef.icon}
            label={iconDef.label}
            iconId={iconDef.id}
            onDoubleClick={() => handleIconDoubleClick(iconDef.id, iconDef.type)}
            onRightClick={handleIconRightClick}
          />
        ))}
      </div>
      <div className="os-desktop__icons os-desktop__icons--games">
        {GAME_ICONS.map((iconDef) => (
          <DesktopIcon
            key={iconDef.id}
            icon={iconDef.icon}
            label={iconDef.label}
            iconId={iconDef.id}
            onDoubleClick={() => handleIconDoubleClick(iconDef.id, iconDef.type)}
            onRightClick={handleIconRightClick}
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

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          onNewTerminal={handleContextNewTerminal}
          onChangeWallpaper={handleContextChangeWallpaper}
          onAbout={handleContextAbout}
        />
      )}

      {/* Icon Context Menu */}
      {iconContextMenu && (
        <IconContextMenu
          x={iconContextMenu.x}
          y={iconContextMenu.y}
          onClose={() => setIconContextMenu(null)}
          onOpen={handleIconContextOpen}
          onProperties={handleIconContextProperties}
        />
      )}

      {/* Alt+Tab Overlay */}
      {altTabActive && (
        <div className="os-alttab-overlay" role="dialog" aria-label="Window switcher">
          <div className="os-alttab-grid">
            {windows.filter((w) => w.isOpen).map((win, i) => (
              <div
                key={win.id}
                className={`os-alttab-item${i === altTabIndex ? ' os-alttab-item--active' : ''}`}
              >
                <span className="os-alttab-icon">{win.icon}</span>
                <span className="os-alttab-title">{win.title}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface IconContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  onOpen: () => void;
  onProperties: () => void;
}

function IconContextMenu({ x, y, onClose, onOpen, onProperties }: IconContextMenuProps) {
  const menuRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  const adjustedX = Math.min(x, window.innerWidth - 180);
  const adjustedY = Math.min(y, window.innerHeight - 100);

  return (
    <div
      ref={menuRef}
      className="os-context-menu"
      style={{ top: adjustedY, left: adjustedX }}
      role="menu"
      aria-label="Icon context menu"
    >
      <button className="os-context-menu__item" onClick={onOpen} role="menuitem">
        <span className="os-context-menu__icon">📂</span>
        <span className="os-context-menu__label">Open</span>
      </button>
      <button className="os-context-menu__item" onClick={onProperties} role="menuitem">
        <span className="os-context-menu__icon">ℹ️</span>
        <span className="os-context-menu__label">Properties</span>
      </button>
    </div>
  );
}
