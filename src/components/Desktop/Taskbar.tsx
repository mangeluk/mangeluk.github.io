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
  const [mounted, setMounted] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  const [isCharging, setIsCharging] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      setMounted(true);
      setIsOnline(navigator.onLine);
    });
    return () => cancelAnimationFrame(raf);
  }, []);

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

  // Online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Battery status
  useEffect(() => {
    let mounted = true;

    interface BatteryLike {
      level: number;
      charging: boolean;
      addEventListener: (type: string, listener: () => void) => void;
      removeEventListener: (type: string, listener: () => void) => void;
    }

    const updateBattery = (b: BatteryLike) => {
      if (!mounted) return;
      setBatteryLevel(Math.round(b.level * 100));
      setIsCharging(b.charging);
    };

    if (typeof navigator !== 'undefined' && 'getBattery' in navigator) {
      void (navigator as Record<string, unknown> as { getBattery: () => Promise<BatteryLike> }).getBattery().then((b) => {
        if (!mounted) return;
        updateBattery(b);
        b.addEventListener('levelchange', () => updateBattery(b));
        b.addEventListener('chargingchange', () => updateBattery(b));
      }).catch(() => { /* battery API not available */ });
    }

    return () => {
      mounted = false;
    };
  }, []);

  // Periodic simulated notifications
  useEffect(() => {
    const pool: Omit<Notification, 'id' | 'timestamp'>[] = [
      { icon: '📧', title: 'New email', message: 'New email from recruiter@tech.com' },
      { icon: '⭐', title: 'GitHub', message: 'Your repo got 5 new stars' },
      { icon: '🌤️', title: 'Weather update', message: '18°C Partly cloudy' },
      { icon: '💻', title: 'System monitor', message: 'Memory usage: 78% — consider closing some apps' },
      { icon: '⬆️', title: 'System update', message: 'System update available: v2.0' },
      { icon: '💼', title: 'LinkedIn', message: 'New follower on LinkedIn' },
      { icon: '✅', title: 'Build status', message: 'Build completed successfully' },
    ];

    const addNotification = () => {
      const template = pool[Math.floor(Math.random() * pool.length)];
      const newNotif: Notification = {
        ...template,
        id: `sim-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        timestamp: 'Just now',
      };
      setNotifications(prev => {
        const updated = [newNotif, ...prev];
        return updated.length > 10 ? updated.slice(0, 10) : updated;
      });
    };

    const interval = setInterval(addNotification, 30000 + Math.random() * 30000);
    return () => clearInterval(interval);
  }, []);

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
        {mounted && (
        <div className="os-taskbar__system-icons">
          <span
            className="os-taskbar__sys-icon"
            title={isOnline ? 'WiFi: Connected' : 'WiFi: Disconnected'}
          >
            {isOnline ? '📡' : '🚫'}
          </span>
          <span className="os-taskbar__sys-icon" title="Volume: 80%">🔊</span>
          <span
            className="os-taskbar__sys-icon"
            title={batteryLevel !== null ? `Battery: ${batteryLevel}%${isCharging ? ' (Charging)' : ''}` : 'Battery: N/A'}
          >
            {batteryLevel !== null
              ? `${batteryLevel}%${isCharging ? ' ⚡' : ''}`
              : '🔋'}
          </span>
        </div>
        )}

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
