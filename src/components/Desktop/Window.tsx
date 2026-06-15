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

type SnapPosition = 'left' | 'right' | 'maximized' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | null;

type ResizeDirection = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

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
  const [minimizeState, setMinimizeState] = useState<'none' | 'minimizing' | 'minimized' | 'restoring'>('none');
  const [isSnapping, setIsSnapping] = useState(false);
  const [isMaxAnimating, setIsMaxAnimating] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const resizeStart = useRef({ x: 0, y: 0, w: 0, h: 0, pos: { x: 0, y: 0 } });
  const resizeDir = useRef<ResizeDirection>('se');
  const preSnapPos = useRef({ x: 0, y: 0, w: 0, h: 0 });
  const prevMinimized = useRef(false);
  const prevIsMaximized = useRef(isMaximized);

  const EDGE_THRESHOLD = 20;
  const CORNER_THRESHOLD = 40;

  const getSnapPosition = useCallback((x: number, y: number): SnapPosition => {
    const atTop = y < EDGE_THRESHOLD;
    const atLeft = x < EDGE_THRESHOLD;
    const atRight = x > window.innerWidth - EDGE_THRESHOLD;
    const atBottom = y > window.innerHeight - 48 - EDGE_THRESHOLD;

    // Corners (larger threshold, checked first)
    if (atTop && atLeft && x < CORNER_THRESHOLD && y < CORNER_THRESHOLD) return 'top-left';
    if (atTop && atRight && x > window.innerWidth - CORNER_THRESHOLD && y < CORNER_THRESHOLD) return 'top-right';
    if (atBottom && atLeft && x < CORNER_THRESHOLD && y > window.innerHeight - 48 - CORNER_THRESHOLD) return 'bottom-left';
    if (atBottom && atRight && x > window.innerWidth - CORNER_THRESHOLD && y > window.innerHeight - 48 - CORNER_THRESHOLD) return 'bottom-right';

    // Edges
    if (atTop) return 'maximized';
    if (atLeft) return 'left';
    if (atRight) return 'right';

    return null;
  }, []);

  const applySnap = useCallback((snap: SnapPosition) => {
    const taskbarH = 48;
    if (snap === 'maximized') {
      onMaximize();
    } else if (snap === 'left') {
      setPos({ x: 0, y: 0 });
      setSize({ w: window.innerWidth / 2, h: window.innerHeight - taskbarH });
    } else if (snap === 'right') {
      setPos({ x: window.innerWidth / 2, y: 0 });
      setSize({ w: window.innerWidth / 2, h: window.innerHeight - taskbarH });
    } else if (snap === 'top-left') {
      setPos({ x: 0, y: 0 });
      setSize({ w: window.innerWidth / 2, h: (window.innerHeight - taskbarH) / 2 });
    } else if (snap === 'top-right') {
      setPos({ x: window.innerWidth / 2, y: 0 });
      setSize({ w: window.innerWidth / 2, h: (window.innerHeight - taskbarH) / 2 });
    } else if (snap === 'bottom-left') {
      setPos({ x: 0, y: (window.innerHeight - taskbarH) / 2 });
      setSize({ w: window.innerWidth / 2, h: (window.innerHeight - taskbarH) / 2 });
    } else if (snap === 'bottom-right') {
      setPos({ x: window.innerWidth / 2, y: (window.innerHeight - taskbarH) / 2 });
      setSize({ w: window.innerWidth / 2, h: (window.innerHeight - taskbarH) / 2 });
    }
  }, [onMaximize]);

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
        const dir = resizeDir.current;
        let newW = size.w;
        let newH = size.h;
        let newX = pos.x;
        let newY = pos.y;

        if (dir.includes('e')) {
          newW = Math.max(400, resizeStart.current.w + dx);
        }
        if (dir.includes('w')) {
          newW = Math.max(400, resizeStart.current.w - dx);
          newX = resizeStart.current.pos.x + (resizeStart.current.w - newW);
        }
        if (dir.includes('s')) {
          newH = Math.max(300, resizeStart.current.h + dy);
        }
        if (dir.includes('n')) {
          newH = Math.max(300, resizeStart.current.h - dy);
          newY = resizeStart.current.pos.y + (resizeStart.current.h - newH);
        }

        setSize({ w: newW, h: newH });
        setPos({ x: newX, y: newY });
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (isDragging) {
        const newX = touch.clientX - dragOffset.current.x;
        const newY = touch.clientY - dragOffset.current.y;
        setPos({
          x: Math.max(0, Math.min(newX, window.innerWidth - 100)),
          y: Math.max(0, Math.min(newY, window.innerHeight - 100)),
        });
        setSnapPreview(getSnapPosition(touch.clientX, touch.clientY));
      }
      if (isResizing) {
        const dx = touch.clientX - resizeStart.current.x;
        const dy = touch.clientY - resizeStart.current.y;
        const dir = resizeDir.current;
        let newW = size.w;
        let newH = size.h;
        let newX = pos.x;
        let newY = pos.y;

        if (dir.includes('e')) {
          newW = Math.max(400, resizeStart.current.w + dx);
        }
        if (dir.includes('w')) {
          newW = Math.max(400, resizeStart.current.w - dx);
          newX = resizeStart.current.pos.x + (resizeStart.current.w - newW);
        }
        if (dir.includes('s')) {
          newH = Math.max(300, resizeStart.current.h + dy);
        }
        if (dir.includes('n')) {
          newH = Math.max(300, resizeStart.current.h - dy);
          newY = resizeStart.current.pos.y + (resizeStart.current.h - newH);
        }

        setSize({ w: newW, h: newH });
        setPos({ x: newX, y: newY });
      }
    };

    const handleUp = (e: MouseEvent | TouchEvent) => {
      if (isDragging && snapPreview) {
        const clientX = 'clientX' in e ? e.clientX : e.changedTouches[0].clientX;
        const clientY = 'clientY' in e ? e.clientY : e.changedTouches[0].clientY;
        const finalSnap = getSnapPosition(clientX, clientY);
        applySnap(finalSnap);
        setIsSnapping(true);
        setTimeout(() => setIsSnapping(false), 150);
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
  }, [isDragging, isResizing, snapPreview, getSnapPosition, applySnap, size, pos]);

  // Maximize/restore animation
  useEffect(() => {
    if (prevIsMaximized.current !== isMaximized) {
      setIsMaxAnimating(true);
      const timer = setTimeout(() => setIsMaxAnimating(false), 220);
      prevIsMaximized.current = isMaximized;
      return () => clearTimeout(timer);
    }
  }, [isMaximized]);

  // Minimize/restore animation
  useEffect(() => {
    if (isMinimized && !prevMinimized.current) {
      setMinimizeState('minimizing');
      const timer = setTimeout(() => setMinimizeState('minimized'), 250);
      return () => clearTimeout(timer);
    } else if (!isMinimized && prevMinimized.current) {
      setMinimizeState('restoring');
      const timer = setTimeout(() => setMinimizeState('none'), 200);
      return () => clearTimeout(timer);
    }
    prevMinimized.current = isMinimized;
  }, [isMinimized]);

  const handleResizeStart = useCallback((e: React.MouseEvent, dir: ResizeDirection) => {
    e.preventDefault();
    e.stopPropagation();
    onFocus();
    setIsResizing(true);
    resizeDir.current = dir;
    resizeStart.current = {
      x: e.clientX,
      y: e.clientY,
      w: size.w,
      h: size.h,
      pos: { x: pos.x, y: pos.y },
    };
  }, [size.w, size.h, pos.x, pos.y, onFocus]);

  const handleTouchResizeStart = useCallback((e: React.TouchEvent, dir: ResizeDirection) => {
    e.preventDefault();
    e.stopPropagation();
    onFocus();
    const touch = e.touches[0];
    setIsResizing(true);
    resizeDir.current = dir;
    resizeStart.current = {
      x: touch.clientX,
      y: touch.clientY,
      w: size.w,
      h: size.h,
      pos: { x: pos.x, y: pos.y },
    };
  }, [size.w, size.h, pos.x, pos.y, onFocus]);

  const isFullyMinimized = minimizeState === 'minimized';

  if (!isOpen && minimizeState !== 'minimizing' && minimizeState !== 'restoring') return null;

  const isAnimatingTransition = isMaxAnimating && !isDragging && !isResizing;
  const snapTransition = isSnapping
    ? 'all 150ms ease-out'
    : isAnimatingTransition
      ? 'width 0.2s ease-out, height 0.2s ease-out, top 0.2s ease-out, left 0.2s ease-out'
      : 'none';

  const windowStyle: React.CSSProperties = isMaximized
    ? { position: 'fixed', top: 0, left: 0, width: '100%', height: 'calc(100% - 48px)', zIndex, transition: snapTransition }
    : { position: 'fixed', top: pos.y, left: pos.x, width: size.w, height: size.h, zIndex, transition: snapTransition };

  const animClass = minimizeState === 'minimizing' ? 'os-window--minimizing'
    : minimizeState === 'restoring' ? 'os-window--restoring'
    : '';

  return (
    <>
      {/* Snap preview overlay */}
      {isDragging && snapPreview && snapPreview !== 'maximized' && (
        <div
          className="os-window__snap-preview"
          style={{
            position: 'fixed',
            left: (snapPreview === 'left' || snapPreview === 'top-left' || snapPreview === 'bottom-left') ? 0
              : (snapPreview === 'right' || snapPreview === 'top-right' || snapPreview === 'bottom-right') ? '50%' : 0,
            top: (snapPreview === 'top-left' || snapPreview === 'top-right') ? 0
              : (snapPreview === 'bottom-left' || snapPreview === 'bottom-right') ? 'calc(50% - 24px)' : 0,
            width: (snapPreview === 'left' || snapPreview === 'right') ? '50%' : '50%',
            height: (snapPreview === 'top-left' || snapPreview === 'top-right' || snapPreview === 'bottom-left' || snapPreview === 'bottom-right')
              ? 'calc(50% - 24px)'
              : 'calc(100% - 48px)',
            zIndex: zIndex - 1,
          }}
        />
      )}

      <div
        className={`os-window ${isFullyMinimized ? 'os-window--minimized' : ''} ${animClass}`}
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

        {/* Resize handles (8 directions) */}
        {!isMaximized && (
          <>
            <div className="os-resize-handle os-resize-n" onMouseDown={(e) => handleResizeStart(e, 'n')} onTouchStart={(e) => handleTouchResizeStart(e, 'n')} />
            <div className="os-resize-handle os-resize-s" onMouseDown={(e) => handleResizeStart(e, 's')} onTouchStart={(e) => handleTouchResizeStart(e, 's')} />
            <div className="os-resize-handle os-resize-e" onMouseDown={(e) => handleResizeStart(e, 'e')} onTouchStart={(e) => handleTouchResizeStart(e, 'e')} />
            <div className="os-resize-handle os-resize-w" onMouseDown={(e) => handleResizeStart(e, 'w')} onTouchStart={(e) => handleTouchResizeStart(e, 'w')} />
            <div className="os-resize-handle os-resize-ne" onMouseDown={(e) => handleResizeStart(e, 'ne')} onTouchStart={(e) => handleTouchResizeStart(e, 'ne')} />
            <div className="os-resize-handle os-resize-nw" onMouseDown={(e) => handleResizeStart(e, 'nw')} onTouchStart={(e) => handleTouchResizeStart(e, 'nw')} />
            <div className="os-resize-handle os-resize-se" onMouseDown={(e) => handleResizeStart(e, 'se')} onTouchStart={(e) => handleTouchResizeStart(e, 'se')} />
            <div className="os-resize-handle os-resize-sw" onMouseDown={(e) => handleResizeStart(e, 'sw')} onTouchStart={(e) => handleTouchResizeStart(e, 'sw')} />
          </>
        )}
      </div>
    </>
  );
}
