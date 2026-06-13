'use client';

import type { Lang } from '@/types/terminal';

interface NeofetchProps {
  lang: Lang;
}

const Neofetch: React.FC<NeofetchProps> = ({ lang }) => {
  const asciiArt = `
   ██████╗ ███████╗██╗   ██╗
  ██╔════╝ ██╔════╝██║   ██║
  ██║  ███╗█████╗  ██║   ██║
  ██║   ██║██╔══╝  ╚██╗ ██╔╝
  ╚██████╔╝███████╗ ╚████╔╝ 
   ╚═════╝ ╚══════╝  ╚═══╝  
  `.trimStart();

  const infoEs = [
    'visitor@portfolio',
    '----------------',
    'OS: Terminal Portfolio v1.0',
    'Host: GitHub Pages',
    'Kernel: Next.js Static Export',
    'Uptime: Since you opened the tab',
    'Packages: React, TypeScript, Tailwind',
    'Shell: Custom Terminal',
    'Theme: Dark (default)',
    'Icons: None',
    'Terminal: This one!',
    'CPU: Your Brain',
    'Memory: Your RAM',
  ];

  const infoEn = [
    'visitor@portfolio',
    '----------------',
    'OS: Terminal Portfolio v1.0',
    'Host: GitHub Pages',
    'Kernel: Next.js Static Export',
    'Uptime: Since you opened the tab',
    'Packages: React, TypeScript, Tailwind',
    'Shell: Custom Terminal',
    'Theme: Dark (default)',
    'Icons: None',
    'Terminal: This one!',
    'CPU: Your Brain',
    'Memory: Your RAM',
  ];

  const info = lang === 'es' ? infoEs : infoEn;

  return (
    <div className="flex gap-4">
      <pre
        style={{
          color: 'var(--text-primary)',
          fontSize: '12px',
          lineHeight: 1.2,
          margin: 0,
        }}
      >
        {asciiArt}
      </pre>
      <div className="text-sm" style={{ lineHeight: 1.4 }}>
        {info.map((line, i) => (
          <div
            key={i}
            style={{
              color: i === 0 ? 'var(--text-primary)' : i === 1 ? 'var(--text-secondary)' : 'var(--text-primary)',
            }}
          >
            {line}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Neofetch;