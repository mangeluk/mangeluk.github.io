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
  icons: {
    icon: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${jetbrainsMono.variable} h-full`} suppressHydrationWarning>
      <head>
        <meta name="color-scheme" content="dark" />
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
        <a href="#desktop-main" className="skip-link">
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  );
}
