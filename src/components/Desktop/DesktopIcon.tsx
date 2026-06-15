'use client';

// src/components/Desktop/DesktopIcon.tsx
// Clickable desktop icon with emoji image and label.

import React from 'react';

interface DesktopIconProps {
  icon: string;
  label: string;
  onClick: () => void;
}

export default function DesktopIcon({ icon, label, onClick }: DesktopIconProps) {
  return (
    <button
      className="desktop-icon"
      onClick={onClick}
      aria-label={`Open ${label}`}
    >
      <div className="desktop-icon__image">
        <span className="desktop-icon__emoji">{icon}</span>
      </div>
      <span className="desktop-icon__label">{label}</span>
    </button>
  );
}
