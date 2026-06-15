'use client';

// src/components/Desktop/Window.tsx
// Draggable window with title bar, minimize/maximize/close controls, and edge snapping.

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

type SnapPosition = 'left' | 'right' | 'maximized' | null;

export default function Window({
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
  const [snapPreview, setSnapPreview] = useState<SnapPosition>(null);
  const dragOffset = useRef({ x: 0, y: 0 });
  const resizeStart = useRef({ x: 0, y: 0, w: 0, h: 0 });
  const preSnapPos = useRef({ x: 0, y: 0, w: 0, h: 0 });

  const SNAP_THRESHOLD = 20;

  const getSnapPosition = useCallback((x: number, y: number): SnapPosition => {
    if (y < SNAP_THRESHOLD) return 'maximized';
    if (x < SNAP_THRESHOLD) return 'left';
    if (x > window.innerWidth - SNAP_THRESHOLD) return 'right';
    return null;
  }, []);

  const handleDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    onFocus();
    if (isMaximized) {
      const ratio = e.clientX / window.innerWidth;
      preSnapPos.current = {
        x: e.clientX - initialWidth * ratio,
        y: e.clientY - 18,
        w: initialWidth,
        h: initialHeight,
      };
      setPos({ x: e.clientX - initialWidth * ratio, y: e.clientY - 18 });
      setSize({ w: initialWidth, h: initialHeight });
      dragOffset.current = { x: initialWidth * ratio, y: 18 };
    } else {
      preSnapPos.current = { x: pos.x, y: pos.y, w: size.w, h: size.h };
      dragOffset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
    }
    setIsDragging(true);
  }, [isMaximized, pos.x, pos.y, size.w, size.h, onFocus, initialWidth, initialHeight]);

  const handleTouchDragStart = useCallback((e: React.TouchEvent) => {
    onFocus();
    const touch = e.touches[0];
    if (isMaximized) {
      const ratio = touch.clientX / window.innerWidth;
      preSnapPos.current = {
        x: touch.clientX - initialWidth * ratio,
        y: touch.clientY - 18,
        w: initialWidth,
        h: initialHeight,
      };
      setPos({ x: touch.clientX - initialWidth * ratio, y: touch.clientY - 18 });
      setSize({ w: initialWidth, h: initialHeight });
      dragOffset.current = { x: initialWidth * ratio, y: 18 };
    } else {
      preSnapPos.current = { x: pos.x, y: pos.y, w: size.w, h: size.h };
      dragOffset.current = { x: touch.clientX - pos.x, y: touch.clientY - pos.y };
    }
    setIsDragging(true);
  }, [isMaximized, pos.x, pos.y, size.w, size.h, onFocus, initialWidth, initialHeight]);

  useEffect(() => {
    if (!isDragging && !isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const newX = e.clientX - dragOffset.current.x;
        const newY = e.clientY - dragOffset.current.y;
        setPos({
          x: Math.max(0, Math.min(newX, window.innerWidth - 100)),
          y: Math.max(0, Math.min(newY, window.innerHeight - 100)),
        });
        setSnapPreview(getSnapPosition(e.clientX, e.clientY));
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
        const newX = touch.clientX - dragOffset.current.x;
        const newY = touch.clientY - dragOffset.current.y;
        setPos({
          x: Math.max(0, Math.min(newX, window.innerWidth - 100)),
          y: Math.max(0, Math.min(newY, window.innerHeight - 100)),
        });
        setSnapPreview(getSnapPosition(touch.clientX, touch.clientY));
      }
    };

    const handleUp = (e: MouseEvent | TouchEvent) => {
      if (isDragging && snapPreview) {
        const clientX = 'clientX' in e ? e.clientX : e.touches[0].clientX;
        const clientY = 'clientY' in e ? e.clientY : e.touches[0].clientY;
        const finalSnap = getSnapPosition(clientX, clientY);

        if (finalSnap === 'maximized') {
          onMaximize();
        } else if (finalSnap === 'left') {
          setPos({ x: 0, y: 0 });
          setSize({ w: window.innerWidth / 2, h: window.innerHeight - 48 });
        } else if (finalSnap === 'right') {
          setPos({ x: window.innerWidth / 2, y: 0 });
          setSize({ w: window.innerWidth / 2, h: window.innerHeight - 48 });
        }
      }
      setSnapPreview(null);
      setIsDragging(false);
      setIsResizing(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleUp);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleUp as EventListener);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleUp as EventListener);
    };
  }, [isDragging, isResizing, snapPreview, getSnapPosition, onMaximize]);

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

  const windowStyle: React.CSSProperties = isMaximized
    ? { position: 'fixed', top: 0, left: 0, width: '100%', height: 'calc(100% - 48px)', zIndex }
    : { position: 'fixed', top: pos.y, left: pos.x, width: size.w, height: size.h, zIndex };

  return (
    <>
      {/* Snap preview overlay */}
      {isDragging && snapPreview && snapPreview !== 'maximized' && (
        <div
          className="os-window__snap-preview"
          style={{
            position: 'fixed',
            top: 0,
            left: snapPreview === 'left' ? 0 : '50%',
            width: '50%',
            height: 'calc(100% - 48px)',
            zIndex: zIndex - 1,
          }}
        />
      )}

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
    </>
  );
}
