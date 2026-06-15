'use client';

import React from 'react';

interface MenuItem {
  id: string;
  icon: string;
  label: string;
  category: 'system' | 'games' | 'utilities';
}

interface StartMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenApp: (id: string, type: 'terminal' | 'game' | 'content' | 'utility', contentType?: string) => void;
}

const MENU_ITEMS: MenuItem[] = [
  { id: 'terminal', icon: '⬛', label: 'Terminal', category: 'system' },
  { id: 'about', icon: '👤', label: 'About', category: 'system' },
  { id: 'projects', icon: '📂', label: 'Projects', category: 'system' },
  { id: 'skills', icon: '⚡', label: 'Skills', category: 'system' },
  { id: 'experience', icon: '💼', label: 'Experience', category: 'system' },
  { id: 'contact', icon: '📧', label: 'Contact', category: 'system' },
  { id: 'settings', icon: '⚙️', label: 'Settings', category: 'system' },
  { id: 'filemanager', icon: '📁', label: 'File Manager', category: 'system' },
  { id: 'snake', icon: '🐍', label: 'Snake', category: 'games' },
  { id: 'tetris', icon: '🧱', label: 'Tetris', category: 'games' },
  { id: '2048', icon: '🔢', label: '2048', category: 'games' },
  { id: 'pong', icon: '🏓', label: 'Pong', category: 'games' },
  { id: 'quiz', icon: '❓', label: 'Quiz', category: 'games' },
  { id: 'doom', icon: '👹', label: 'Doom', category: 'games' },
  { id: 'minesweeper', icon: '💣', label: 'Minesweeper', category: 'games' },
  { id: 'breakout', icon: '🧱', label: 'Breakout', category: 'games' },
  { id: 'flappybird', icon: '🐦', label: 'Flappy Bird', category: 'games' },
  { id: 'chess', icon: '♟️', label: 'Chess', category: 'games' },
  { id: 'solitaire', icon: '🃏', label: 'Solitaire', category: 'games' },
  { id: 'calculator', icon: '🧮', label: 'Calculator', category: 'utilities' },
  { id: 'notepad', icon: '📝', label: 'Notepad', category: 'utilities' },
  { id: 'weather', icon: '🌤️', label: 'Weather', category: 'utilities' },
  { id: 'calendar', icon: '📅', label: 'Calendar', category: 'utilities' },
  { id: 'sysmonitor', icon: '📊', label: 'System Monitor', category: 'utilities' },
  { id: 'musicplayer', icon: '🎵', label: 'Music Player', category: 'utilities' },
  { id: 'pomodoro', icon: '🍅', label: 'Pomodoro', category: 'utilities' },
  { id: 'qrcode', icon: '📱', label: 'QR Code', category: 'utilities' },
];

const CATEGORIES = {
  system: { label: 'System', icon: '💻' },
  games: { label: 'Games', icon: '🎮' },
  utilities: { label: 'Utilities', icon: '🔧' },
};

export default function StartMenu({ isOpen, onClose, onOpenApp }: StartMenuProps) {
  if (!isOpen) return null;

  const handleItemClick = (item: MenuItem) => {
    if (item.category === 'games') {
      onOpenApp(item.id, 'game');
    } else if (['about', 'projects', 'skills', 'experience', 'contact'].includes(item.id)) {
      onOpenApp(item.id, 'content', item.id);
    } else if (item.id === 'terminal') {
      onOpenApp(item.id, 'terminal');
    } else {
      onOpenApp(item.id, 'utility');
    }
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="start-menu-backdrop"
        onClick={onClose}
      />

      {/* Menu */}
      <div className="start-menu">
        <div className="start-menu__header">
          <span className="start-menu__logo">⬛</span>
          <span className="start-menu__title">Mangeluk OS</span>
        </div>

        <div className="start-menu__content">
          {(Object.keys(CATEGORIES) as Array<keyof typeof CATEGORIES>).map((catKey) => {
            const cat = CATEGORIES[catKey];
            const items = MENU_ITEMS.filter((item) => item.category === catKey);
            if (items.length === 0) return null;

            return (
              <div key={catKey} className="start-menu__category">
                <div className="start-menu__category-header">
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                </div>
                <div className="start-menu__category-items">
                  {items.map((item) => (
                    <button
                      key={item.id}
                      className="start-menu__item"
                      onClick={() => handleItemClick(item)}
                    >
                      <span className="start-menu__item-icon">{item.icon}</span>
                      <span className="start-menu__item-label">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="start-menu__footer">
          <div className="start-menu__user">
            <span>👤</span>
            <span>visitor@portfolio</span>
          </div>
        </div>
      </div>
    </>
  );
}
