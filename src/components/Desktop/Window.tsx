'use client';

// src/components/Desktop/Window.tsx
// Draggable window with title bar and minimize/maximize/close controls.

import React, { useState, useRef, useCallback, useEffect } from 'react';

interface WindowProps {
  id: string;
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  isOpen: boolean;
  isMinimized?: boolean;
  isMaximized?: boolean;
  onClose: () => void;
  onMinimize: () => void;
  onMaximize: () => void;
  onFocus: () => void;
  zIndex: number;
  initialX?: number;
  initialY?: number;
  initialWidth?: number;
  initialHeight?: number;
}

export default function Window({
  id,
  title,
  icon,
  children,
  isOpen,
  isMinimized = false,
  isMaximized = false,
  onClose,
  onMinimize,
  onMaximize,
  onFocus,
  zIndex,
  initialX = 80,
  initialY = 40,
  initialWidth = 860,
  initialHeight = 560,
}: WindowProps) {
  const [pos, setPos] = useState({ x: initialX, y: initialY });
  const [size, setSize] = useState({ w: initialWidth, h: initialHeight });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const resizeStart = useRef({ x: 0, y: 0, w: 0, h: 0 });

  // Drag handlers
  const handleDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    onFocus();
    setIsDragging(true);
    dragOffset.current = {
      x: e.clientX - pos.x,
      y: e.clientY - pos.y,
    };
  }, [pos.x, pos.y, onFocus]);

  // Touch drag support
  const handleTouchDragStart = useCallback((e: React.TouchEvent) => {
    onFocus();
    const touch = e.touches[0];
    setIsDragging(true);
    dragOffset.current = {
      x: touch.clientX - pos.x,
      y: touch.clientY - pos.y,
    };
  }, [pos.x, pos.y, onFocus]);

  useEffect(() => {
    if (!isDragging && !isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setPos({
          x: Math.max(0, Math.min(e.clientX - dragOffset.current.x, window.innerWidth - 100)),
          y: Math.max(0, Math.min(e.clientY - dragOffset.current.y, window.innerHeight - 100)),
        });
      }
      if (isResizing) {
        const dx = e.clientX - resizeStart.current.x;
        const dy = e.clientY - resizeStart.current.y;
        setSize({
          w: Math.max(400, resizeStart.current.w + dx),
          h: Math.max(300, resizeStart.current.h + dy),
        });
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (isDragging) {
        const touch = e.touches[0];
        setPos({
          x: Math.max(0, Math.min(touch.clientX - dragOffset.current.x, window.innerWidth - 100)),
          y: Math.max(0, Math.min(touch.clientY - dragOffset.current.y, window.innerHeight - 100)),
        });
      }
    };

    const handleUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleUp);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleUp);
    };
  }, [isDragging, isResizing]);

  // Resize handle
  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onFocus();
    setIsResizing(true);
    resizeStart.current = {
      x: e.clientX,
      y: e.clientY,
      w: size.w,
      h: size.h,
    };
  }, [size.w, size.h, onFocus]);

  if (!isOpen) return null;

  // Maximized style
  const windowStyle: React.CSSProperties = isMaximized
    ? { position: 'fixed', top: 0, left: 0, width: '100%', height: 'calc(100% - 48px)', zIndex }
    : { position: 'fixed', top: pos.y, left: pos.x, width: size.w, height: size.h, zIndex };

  return (
    <div
      className={`os-window ${isMinimized ? 'os-window--minimized' : ''}`}
      style={windowStyle}
      onMouseDown={onFocus}
      onTouchStart={onFocus}
    >
      {/* Title bar */}
      <div
        className="os-window__titlebar"
        onMouseDown={handleDragStart}
        onTouchStart={handleTouchDragStart}
        onDoubleClick={onMaximize}
      >
        <div className="os-window__titlebar-left">
          {icon && <span className="os-window__icon">{icon}</span>}
          <span className="os-window__title">{title}</span>
        </div>
        <div className="os-window__controls">
          <button
            className="os-window__btn os-window__btn--minimize"
            onClick={(e) => { e.stopPropagation(); onMinimize(); }}
            aria-label="Minimize"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <rect x="2" y="5.5" width="8" height="1" fill="currentColor" />
            </svg>
          </button>
          <button
            className="os-window__btn os-window__btn--maximize"
            onClick={(e) => { e.stopPropagation(); onMaximize(); }}
            aria-label="Maximize"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <rect x="2" y="2" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="1" fill="none" />
            </svg>
          </button>
          <button
            className="os-window__btn os-window__btn--close"
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            aria-label="Close"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </button>
        </div>
      </div>

      {/* Window body */}
      <div className="os-window__body">
        {children}
      </div>

      {/* Resize handle (bottom-right corner) */}
      {!isMaximized && (
        <div
          className="os-window__resize"
          onMouseDown={handleResizeStart}
        />
      )}
    </div>
  );
}
