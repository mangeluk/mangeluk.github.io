'use client';

import type { Lang } from '@/types/terminal';
import React, { useState, useEffect } from 'react';

interface WelcomeBannerProps {
  lang: Lang;
  onComplete?: () => void;
}

const ASCII_LOGO = `
███╗   ███╗ █████╗ ███████╗████████╗███████╗██████╗ ███╗   ███╗
████╗ ████║██╔══██╗██╔════╝╚══██╔══╝██╔════╝██╔══██╗████╗ ████║
██╔████╔██║███████║███████╗   ██║   █████╗  ██████╔╝██╔████╔██║
██║╚██╔╝██║██╔══██║╚════██║   ██║   ██╔══╝  ██╔══██╗██║╚██╔╝██║
██║ ╚═╝ ██║██║  ██║███████║   ██║   ███████╗██║  ██║██║ ╚═╝ ██║
╚═╝     ╚═╝╚═╝  ╚═╝╚══════╝   ╚═╝   ╚══════╝╚═╝  ╚═╝╚═╝     ╚═╝`.trimStart();

const BOOT_MESSAGES_ES = [
  { ts: 0, text: '[    0.000000] Linux version 6.8.0-mangeluk (gcc 13.2.0) #1 SMP PREEMPT_DYNAMIC x86_64', type: 'kernel' as const },
  { ts: 80, text: '[    0.000000] Command line: BOOT_IMAGE=/boot/vmlinuz-6.8.0-mangeluk root=/dev/sda1', type: 'kernel' as const },
  { ts: 150, text: '[    0.042891] BIOS-provided physical RAM map:', type: 'kernel' as const },
  { ts: 200, text: '[    0.042893] BIOS-e820: [mem 0x0000000000000000-0x000000000009fbff] usable', type: 'kernel' as const },
  { ts: 280, text: '[    0.156012] tsc: Fast TSC calibration using PMI', type: 'kernel' as const },
  { ts: 350, text: '[    0.298145] Calibrating delay loop (skipped), value calculated using timer frequency.. 4800.00 BogoMIPS (lpj=2400000)', type: 'kernel' as const },
  { ts: 450, text: '[    0.301201] Memory: 16384088k/16777216k available (8192k kernel code, 393208k rwdata, 2621440k rodata, 1310720k init)', type: 'kernel' as const },
  { ts: 550, text: '[    0.451023] CPU: Intel Core i7-12700K @ 3.60GHz (family: 0x6, model: 0x97, stepping: 0x2)', type: 'kernel' as const },
  { ts: 650, text: '[    0.582341] EXT4-fs (sda1): mounted filesystem with ordered data mode. Opts: (null)', type: 'kernel' as const },
  { ts: 750, text: '[    0.721098] systemd[1]: Detected architecture x86-64.', type: 'systemd' as const },
  { ts: 850, text: '[    0.890234] systemd[1]: Hostname set to <portfolio>.', type: 'systemd' as const },
  { ts: 950, text: '[    1.012567] systemd[1]: Set up automount Arbitrary Executable File Formats.', type: 'systemd' as const },
  { ts: 1050, text: '', type: 'ok' as const, service: 'Network Manager' },
  { ts: 1120, text: '', type: 'ok' as const, service: 'systemd-logind' },
  { ts: 1190, text: '', type: 'ok' as const, service: 'SSH daemon' },
  { ts: 1260, text: '', type: 'ok' as const, service: 'Portfolio Terminal' },
  { ts: 1330, text: '', type: 'ok' as const, service: 'Nginx Web Server' },
  { ts: 1400, text: '', type: 'ok' as const, service: 'Gemini AI Service' },
  { ts: 1500, text: '', type: 'ok' as const, service: 'Multi-user.target' },
  { ts: 1650, text: '', type: 'separator' as const },
  { ts: 1700, text: 'Debian GNU/Linux 12 (bookworm) / Mangeluk OS 1.0', type: 'banner' as const },
  { ts: 1800, text: '', type: 'separator' as const },
  { ts: 1900, text: "Bienvenido a Mangeluk OS. Escribe 'help' para ver los comandos disponibles.", type: 'welcome' as const },
  { ts: 2000, text: '', type: 'done' as const },
];

const BOOT_MESSAGES_EN = [
  { ts: 0, text: '[    0.000000] Linux version 6.8.0-mangeluk (gcc 13.2.0) #1 SMP PREEMPT_DYNAMIC x86_64', type: 'kernel' as const },
  { ts: 80, text: '[    0.000000] Command line: BOOT_IMAGE=/boot/vmlinuz-6.8.0-mangeluk root=/dev/sda1', type: 'kernel' as const },
  { ts: 150, text: '[    0.042891] BIOS-provided physical RAM map:', type: 'kernel' as const },
  { ts: 200, text: '[    0.042893] BIOS-e820: [mem 0x0000000000000000-0x000000000009fbff] usable', type: 'kernel' as const },
  { ts: 280, text: '[    0.156012] tsc: Fast TSC calibration using PMI', type: 'kernel' as const },
  { ts: 350, text: '[    0.298145] Calibrating delay loop (skipped), value calculated using timer frequency.. 4800.00 BogoMIPS (lpj=2400000)', type: 'kernel' as const },
  { ts: 450, text: '[    0.301201] Memory: 16384088k/16777216k available (8192k kernel code, 393208k rwdata, 2621440k rodata, 1310720k init)', type: 'kernel' as const },
  { ts: 550, text: '[    0.451023] CPU: Intel Core i7-12700K @ 3.60GHz (family: 0x6, model: 0x97, stepping: 0x2)', type: 'kernel' as const },
  { ts: 650, text: '[    0.582341] EXT4-fs (sda1): mounted filesystem with ordered data mode. Opts: (null)', type: 'kernel' as const },
  { ts: 750, text: '[    0.721098] systemd[1]: Detected architecture x86-64.', type: 'systemd' as const },
  { ts: 850, text: '[    0.890234] systemd[1]: Hostname set to <portfolio>.', type: 'systemd' as const },
  { ts: 950, text: '[    1.012567] systemd[1]: Set up automount Arbitrary Executable File Formats.', type: 'systemd' as const },
  { ts: 1050, text: '', type: 'ok' as const, service: 'Network Manager' },
  { ts: 1120, text: '', type: 'ok' as const, service: 'systemd-logind' },
  { ts: 1190, text: '', type: 'ok' as const, service: 'SSH daemon' },
  { ts: 1260, text: '', type: 'ok' as const, service: 'Portfolio Terminal' },
  { ts: 1330, text: '', type: 'ok' as const, service: 'Nginx Web Server' },
  { ts: 1400, text: '', type: 'ok' as const, service: 'Gemini AI Service' },
  { ts: 1500, text: '', type: 'ok' as const, service: 'Multi-user.target' },
  { ts: 1650, text: '', type: 'separator' as const },
  { ts: 1700, text: 'Debian GNU/Linux 12 (bookworm) / Mangeluk OS 1.0', type: 'banner' as const },
  { ts: 1800, text: '', type: 'separator' as const },
  { ts: 1900, text: "Welcome to Mangeluk OS. Type 'help' to see available commands.", type: 'welcome' as const },
  { ts: 2000, text: '', type: 'done' as const },
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
      {/* ASCII Logo - always visible */}
      <pre
        className="text-xs md:text-sm leading-none mb-2"
        style={{ color: 'var(--text-success)', fontFamily: 'inherit', margin: 0 }}
      >
        {ASCII_LOGO}
      </pre>

      {/* Kernel / systemd messages */}
      <div className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
        {messages.slice(0, visibleLines).map((msg, i) => {
          if (msg.type === 'kernel' || msg.type === 'systemd') {
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
                <span style={{ color: 'var(--text-primary)' }}>Started {msg.service}.</span>
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
