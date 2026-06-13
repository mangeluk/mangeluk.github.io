import type { Metadata } from 'next';
import { JetBrains_Mono } from 'next/font/google';
import './globals.css';

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Terminal Portfolio — Mangeluk',
  description:
    'Portfolio profesional interactivo con interfaz de terminal de comandos. Desarrollador Fullstack: React, Next.js, TypeScript, Node.js.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${jetbrainsMono.variable} h-full`} suppressHydrationWarning>
      <head>
        {/*
          Inline script: reads localStorage before hydration and sets data-theme on <html>
          to prevent flash of wrong theme (Req. 14.6).
          Must run synchronously before React renders.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
(function(){
  try {
    var t = localStorage.getItem('terminal-theme');
    if (t === 'dark' || t === 'light' || t === 'matrix') {
      document.documentElement.setAttribute('data-theme', t);
    } else {
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  } catch(e) {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
})();
            `.trim(),
          }}
        />
      </head>
      <body
        className="min-h-full"
        style={{
          fontFamily:
            "var(--font-mono), 'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
          // Fallback background if bg.jpg fails to load (Req. 17.4)
          backgroundColor: '#0a0a0a',
        }}
      >
        {children}
      </body>
    </html>
  );
}
