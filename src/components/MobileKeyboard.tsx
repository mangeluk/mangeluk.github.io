'use client';

// src/components/MobileKeyboard.tsx
// Quick-command buttons shown on mobile viewports.
// Requirements: 19.2, 19.3, 22.4

import React from 'react';

interface MobileKeyboardProps {
  onCommand: (cmd: string) => void;
  disabled: boolean;
}

const SHORTCUTS = [
  { cmd: 'help', label: 'help', ariaLabel: 'Ejecutar comando help' },
  { cmd: 'about', label: 'about', ariaLabel: 'Ejecutar comando about' },
  { cmd: 'projects', label: 'projects', ariaLabel: 'Ejecutar comando projects' },
  { cmd: 'contact', label: 'contact', ariaLabel: 'Ejecutar comando contact' },
  { cmd: 'clear', label: 'clear', ariaLabel: 'Ejecutar comando clear' },
] as const;

export default function MobileKeyboard({ onCommand, disabled }: MobileKeyboardProps) {
  return (
    // Hidden on ≥768px (Req. 19.2)
    <div
      className="md:hidden flex gap-2 px-2 py-1 overflow-x-auto"
      style={{ backgroundColor: 'var(--bg-terminal)' }}
    >
      {SHORTCUTS.map(({ cmd, label, ariaLabel }) => (
        <button
          key={cmd}
          role="button"
          aria-label={ariaLabel}
          disabled={disabled}
          onClick={() => onCommand(cmd)}
          className="shrink-0 px-3 py-1 rounded border text-xs"
          style={{
            borderColor: 'var(--text-secondary)',
            color: 'var(--text-primary)',
            backgroundColor: 'transparent',
            fontFamily: 'inherit',
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.5 : 1,
          }}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
