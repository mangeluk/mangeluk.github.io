'use client';

// src/components/Desktop/DesktopIcon.tsx
// Clickable desktop icon with emoji image and label.

import React, { useState, useRef, useCallback } from 'react';

interface DesktopIconProps {
  icon: string;
  label: string;
  onDoubleClick: () => void;
  onRightClick?: (e: { x: number; y: number; iconId: string }) => void;
  iconId: string;
}

export default function DesktopIcon({ icon, label, onDoubleClick, onRightClick, iconId }: DesktopIconProps) {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragActive, setIsDragActive] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const dragMoved = useRef(false);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    dragStart.current = { x: e.clientX - offset.x, y: e.clientY - offset.y };
    dragMoved.current = false;

    const handleMouseMove = (me: MouseEvent) => {
      const dx = me.clientX - dragStart.current.x;
      const dy = me.clientY - dragStart.current.y;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        dragMoved.current = true;
        setIsDragActive(true);
      }
      if (dragMoved.current) {
        setOffset({ x: dx, y: dy });
      }
    };

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      if (dragMoved.current) {
        setOffset({ x: 0, y: 0 });
        setTimeout(() => setIsDragActive(false), 150);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }, [offset]);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onRightClick?.({ x: e.clientX, y: e.clientY, iconId });
  }, [onRightClick, iconId]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (!dragMoved.current) onDoubleClick();
      return;
    }

    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      e.preventDefault();
      const container = (e.currentTarget as HTMLElement).parentElement;
      if (!container) return;
      const icons = Array.from(container.querySelectorAll<HTMLElement>('.desktop-icon'));
      const idx = icons.indexOf(e.currentTarget as HTMLElement);
      if (idx === -1) return;

      let nextIdx = idx;
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        nextIdx = (idx + 1) % icons.length;
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        nextIdx = (idx - 1 + icons.length) % icons.length;
      }
      icons[nextIdx].focus();
    }
  }, [onDoubleClick]);

  return (
    <button
      className={`desktop-icon ${isDragActive ? 'desktop-icon--dragging' : ''}`}
      role="button"
      tabIndex={0}
      onDoubleClick={(e) => {
        e.stopPropagation();
        if (!dragMoved.current) onDoubleClick();
      }}
      onKeyDown={handleKeyDown}
      onMouseDown={handleMouseDown}
      onContextMenu={handleContextMenu}
      aria-label={`Open ${label}`}
    >
      <div className="desktop-icon__image">
        <span className="desktop-icon__emoji">{icon}</span>
      </div>
      <span className="desktop-icon__label">{label}</span>
    </button>
  );
}
