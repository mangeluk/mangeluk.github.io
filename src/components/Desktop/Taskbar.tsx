'use client';

// src/components/Desktop/Taskbar.tsx
// Bottom taskbar with start button, app shortcuts, and system tray.

import React, { useState, useEffect } from 'react';
import type { Lang } from '@/types/terminal';

interface TaskbarApp {
  id: string;
  icon: string;
  title: string;
  isActive: boolean;
  isMinimized: boolean;
  onClick: () => void;
}

interface TaskbarProps {
  apps: TaskbarApp[];
  lang: Lang;
  onToggleLang: () => void;
  onStartClick: () => void;
  isStartMenuOpen: boolean;
}

export default function Taskbar({ apps, lang, onToggleLang, onStartClick, isStartMenuOpen }: TaskbarProps) {
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString(lang === 'es' ? 'es-AR' : 'en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
      setCurrentTime(timeStr);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [lang]);

  return (
    <div className="os-taskbar">
      {/* Start button */}
      <button
        className={`os-taskbar__start ${isStartMenuOpen ? 'os-taskbar__start--active' : ''}`}
        onClick={(e) => {
          e.stopPropagation();
          onStartClick();
        }}
        aria-label="Start menu"
      >
        <span className="os-taskbar__start-icon">⬛</span>
        <span className="os-taskbar__start-text">Mangeluk OS</span>
      </button>

      {/* App shortcuts */}
      <div className="os-taskbar__apps">
        {apps.map((app) => (
          <button
            key={app.id}
            className={`os-taskbar__app ${app.isActive ? 'os-taskbar__app--active' : ''} ${app.isMinimized ? 'os-taskbar__app--minimized' : ''}`}
            onClick={app.onClick}
            aria-label={app.title}
          >
            <span>{app.icon}</span>
          </button>
        ))}
      </div>

      {/* System tray */}
      <div className="os-taskbar__tray">
        <button
          className="os-taskbar__tray-btn"
          onClick={onToggleLang}
          title={lang === 'es' ? 'Switch to English' : 'Cambiar a Español'}
        >
          {lang === 'es' ? 'ES' : 'EN'}
        </button>
        <div className="os-taskbar__clock">
          {currentTime}
        </div>
      </div>
    </div>
  );
}
