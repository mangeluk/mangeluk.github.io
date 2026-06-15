'use client';

import type { Lang } from '@/types/terminal';
import React, { useState, useEffect } from 'react';

interface WelcomeBannerProps {
  lang: Lang;
  onComplete?: () => void;
}

const BOOT_MESSAGES_ES = [
  { ts: 0, text: '[    0.000000] Linux 6.8.0-mangeluk x86_64 — 16GB RAM, Intel i7-12700K', type: 'kernel' as const },
  { ts: 100, text: '[    0.082341] EXT4-fs (sda1): mounted — ordered data mode', type: 'kernel' as const },
  { ts: 200, text: '', type: 'ok' as const, service: 'Network Manager' },
  { ts: 280, text: '', type: 'ok' as const, service: 'SSH daemon' },
  { ts: 360, text: '', type: 'ok' as const, service: 'Portfolio Terminal' },
  { ts: 440, text: '', type: 'ok' as const, service: 'Gemini AI Service' },
  { ts: 550, text: '', type: 'separator' as const },
  { ts: 600, text: 'Mangeluk OS 1.0 — Debian GNU/Linux 12 (bookworm)', type: 'banner' as const },
  { ts: 700, text: '', type: 'separator' as const },
  { ts: 800, text: "Bienvenido. Escribe 'help' para ver los comandos disponibles.", type: 'welcome' as const },
  { ts: 900, text: '', type: 'done' as const },
];

const BOOT_MESSAGES_EN = [
  { ts: 0, text: '[    0.000000] Linux 6.8.0-mangeluk x86_64 — 16GB RAM, Intel i7-12700K', type: 'kernel' as const },
  { ts: 100, text: '[    0.082341] EXT4-fs (sda1): mounted — ordered data mode', type: 'kernel' as const },
  { ts: 200, text: '', type: 'ok' as const, service: 'Network Manager' },
  { ts: 280, text: '', type: 'ok' as const, service: 'SSH daemon' },
  { ts: 360, text: '', type: 'ok' as const, service: 'Portfolio Terminal' },
  { ts: 440, text: '', type: 'ok' as const, service: 'Gemini AI Service' },
  { ts: 550, text: '', type: 'separator' as const },
  { ts: 600, text: 'Mangeluk OS 1.0 — Debian GNU/Linux 12 (bookworm)', type: 'banner' as const },
  { ts: 700, text: '', type: 'separator' as const },
  { ts: 800, text: "Welcome. Type 'help' to see available commands.", type: 'welcome' as const },
  { ts: 900, text: '', type: 'done' as const },
];

export default function WelcomeBanner({ lang, onComplete }: WelcomeBannerProps) {
  const [visibleLines, setVisibleLines] = useState<number>(0);
  const [bootDone, setBootDone] = useState(false);
  const messages = lang === 'es' ? BOOT_MESSAGES_ES : BOOT_MESSAGES_EN;

  useEffect(() => {
    const timeouts: ReturnType<typeof setTimeout>[] = [];

    messages.forEach((msg, i) => {
      const t = setTimeout(() => {
        setVisibleLines(i + 1);
        if (msg.type === 'done') {
          setBootDone(true);
          onComplete?.();
        }
      }, msg.ts);
      timeouts.push(t);
    });

    return () => timeouts.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="mb-2">
      {/* Boot messages */}
      <div className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
        {messages.slice(0, visibleLines).map((msg, i) => {
          if (msg.type === 'kernel') {
            return (
              <div key={i} className="boot-line" style={{ animationDelay: '0ms' }}>
                <span style={{ color: 'var(--text-secondary)' }}>{msg.text}</span>
              </div>
            );
          }

          if (msg.type === 'ok') {
            return (
              <div key={i} className="boot-line" style={{ animationDelay: '0ms' }}>
                <span className="boot-ok">[  OK  ]</span>{' '}
                <span style={{ color: 'var(--text-primary)' }}>{msg.service}</span>
              </div>
            );
          }

          if (msg.type === 'separator') {
            return (
              <div key={i} className="boot-line" style={{ animationDelay: '0ms' }}>
                <span style={{ color: 'var(--text-secondary)' }}>────────────────────────────────────────────────────────</span>
              </div>
            );
          }

          if (msg.type === 'banner') {
            return (
              <div key={i} className="boot-line" style={{ animationDelay: '0ms' }}>
                <span style={{ color: 'var(--text-success)', fontWeight: 'bold' }}>{msg.text}</span>
              </div>
            );
          }

          if (msg.type === 'welcome') {
            return (
              <div key={i} className="boot-line mt-1" style={{ animationDelay: '0ms' }}>
                <span style={{ color: 'var(--text-primary)' }}>{msg.text}</span>
              </div>
            );
          }

          return null;
        })}
      </div>

      {/* Progress bar during boot */}
      {!bootDone && visibleLines > 0 && (
        <div className="mt-2" style={{ maxWidth: '400px' }}>
          <div className="progress-bar" />
        </div>
      )}
    </div>
  );
}
