'use client';

// src/components/Desktop/DesktopIcon.tsx
// Clickable desktop icon with emoji image and label.

import React from 'react';

interface DesktopIconProps {
  icon: string;
  label: string;
  onDoubleClick: () => void;
}

export default function DesktopIcon({ icon, label, onDoubleClick }: DesktopIconProps) {
  return (
    <button
      className="desktop-icon"
      onDoubleClick={(e) => {
        e.stopPropagation();
        onDoubleClick();
      }}
      aria-label={`Open ${label}`}
    >
      <div className="desktop-icon__image">
        <span className="desktop-icon__emoji">{icon}</span>
      </div>
      <span className="desktop-icon__label">{label}</span>
    </button>
  );
}
