'use client';

// src/components/Desktop/Taskbar.tsx
// Bottom taskbar with start button, app shortcuts, system tray, and notification center.

import React, { useState, useEffect, useCallback } from 'react';
import type { Lang } from '@/types/terminal';
import NotificationCenter, { type Notification } from './NotificationCenter';

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

const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: 'welcome',
    icon: '🎉',
    title: 'Welcome to Mangeluk OS!',
    message: 'Explore the desktop by clicking icons or using the start menu.',
    timestamp: '2 min ago',
  },
  {
    id: 'recruiter',
    icon: '💼',
    title: 'New message from recruiter',
    message: 'Someone is interested in your profile. Check your contact info.',
    timestamp: '15 min ago',
  },
  {
    id: 'update',
    icon: '⬆️',
    title: 'System update available',
    message: 'Mangeluk OS v2.0 is ready to install.',
    timestamp: '1 hour ago',
  },
  {
    id: 'weather',
    icon: '🌤️',
    title: 'Weather: 22°C Clear',
    message: 'Perfect weather for a walk outside.',
    timestamp: '3 hours ago',
  },
  {
    id: 'github',
    icon: '⭐',
    title: 'GitHub: 3 new stars today',
    message: 'Your portfolio repo is gaining traction!',
    timestamp: '5 hours ago',
  },
];

export default function Taskbar({ apps, lang, onToggleLang, onStartClick, isStartMenuOpen }: TaskbarProps) {
  const [currentTime, setCurrentTime] = useState('');
  const [notifications, setNotifications] = useState<Notification[]>(INITIAL_NOTIFICATIONS);
  const [notifOpen, setNotifOpen] = useState(false);

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

  const handleClearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const unreadCount = notifications.length;

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

        {/* System tray icons */}
        <div className="os-taskbar__system-icons">
          <span className="os-taskbar__sys-icon" title="WiFi: Connected">📡</span>
          <span className="os-taskbar__sys-icon" title="Volume: 80%">🔊</span>
          <span className="os-taskbar__sys-icon" title="Battery: 92%">🔋</span>
        </div>

        {/* Notification bell */}
        <button
          className="os-taskbar__notif-btn"
          onClick={(e) => {
            e.stopPropagation();
            setNotifOpen((o) => !o);
          }}
          aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
          title="Notifications"
        >
          <span className="os-taskbar__notif-icon">🔔</span>
          {unreadCount > 0 && (
            <span className="os-taskbar__notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
          )}
        </button>

        <div className="os-taskbar__clock">
          {currentTime}
        </div>
      </div>

      {/* Notification Center */}
      <NotificationCenter
        isOpen={notifOpen}
        onClose={() => setNotifOpen(false)}
        notifications={notifications}
        onClearAll={handleClearAll}
      />
    </div>
  );
}
