'use client';

// src/components/Desktop/NotificationCenter.tsx
// Notification dropdown panel accessible from the taskbar bell icon.

import React, { useEffect, useRef } from 'react';

export interface Notification {
  id: string;
  icon: string;
  title: string;
  message: string;
  timestamp: string;
}

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
  onClearAll: () => void;
}

export default function NotificationCenter({ isOpen, onClose, notifications, onClearAll }: NotificationCenterProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
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
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={panelRef}
      className="os-notification-center"
      role="dialog"
      aria-label="Notification center"
    >
      <div className="os-notification-center__header">
        <span className="os-notification-center__title">Notifications</span>
        {notifications.length > 0 && (
          <button
            className="os-notification-center__clear"
            onClick={onClearAll}
          >
            Clear all
          </button>
        )}
      </div>

      <div className="os-notification-center__list">
        {notifications.length === 0 ? (
          <div className="os-notification-center__empty">
            No new notifications
          </div>
        ) : (
          notifications.map((n) => (
            <div key={n.id} className="os-notification-center__item">
              <span className="os-notification-center__item-icon">{n.icon}</span>
              <div className="os-notification-center__item-content">
                <div className="os-notification-center__item-title">{n.title}</div>
                <div className="os-notification-center__item-message">{n.message}</div>
                <div className="os-notification-center__item-time">{n.timestamp}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
