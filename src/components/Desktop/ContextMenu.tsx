'use client';

// src/components/Desktop/ContextMenu.tsx
// Right-click context menu for the desktop.

import React, { useEffect, useRef } from 'react';

interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  onNewTerminal: () => void;
  onChangeWallpaper: () => void;
  onAbout: () => void;
}

const MENU_ITEMS = [
  { id: 'terminal', label: 'New Terminal', icon: '⬛', action: 'terminal' as const },
  { id: 'wallpaper', label: 'Change Wallpaper', icon: '🖼️', action: 'wallpaper' as const },
  { id: 'refresh', label: 'Refresh', icon: '🔄', action: 'refresh' as const },
  { id: 'about', label: 'About', icon: 'ℹ️', action: 'about' as const },
];

export default function ContextMenu({ x, y, onClose, onNewTerminal, onChangeWallpaper, onAbout }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  const handleAction = (action: string) => {
    switch (action) {
      case 'terminal':
        onNewTerminal();
        break;
      case 'wallpaper':
        onChangeWallpaper();
        break;
      case 'refresh':
        break;
      case 'about':
        onAbout();
        break;
    }
    onClose();
  };

  const adjustedX = Math.min(x, window.innerWidth - 200);
  const adjustedY = Math.min(y, window.innerHeight - 180);

  return (
    <div
      ref={menuRef}
      className="os-context-menu"
      style={{ top: adjustedY, left: adjustedX }}
      role="menu"
      aria-label="Desktop context menu"
    >
      {MENU_ITEMS.map((item) => (
        <button
          key={item.id}
          className="os-context-menu__item"
          onClick={() => handleAction(item.action)}
          role="menuitem"
        >
          <span className="os-context-menu__icon">{item.icon}</span>
          <span className="os-context-menu__label">{item.label}</span>
        </button>
      ))}
    </div>
  );
}
