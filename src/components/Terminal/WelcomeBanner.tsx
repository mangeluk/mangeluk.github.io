'use client';

import type { Lang } from '@/types/terminal';
import React from 'react';

interface WelcomeBannerProps {
  lang: Lang;
}

const MESSAGES: Record<Lang, string> = {
  es: "Bienvenido a mi portfolio terminal. Escribe 'help' para ver los comandos disponibles.",
  en: "Welcome to my terminal portfolio. Type 'help' to see available commands.",
};

const TAGLINES: Record<Lang, string> = {
  es: 'Portfolio Interactivo v1.0.0 — Desarrollador Full Stack',
  en: 'Interactive Portfolio v1.0.0 — Full Stack Developer',
};

export default function WelcomeBanner({ lang }: WelcomeBannerProps) {
  return (
    <div className="mb-4">
      <h1 className="text-(--text-primary) text-xl font-bold">
        Matias Angeluk
      </h1>
      <p className="mt-2 text-(--text-secondary) text-sm">
        {TAGLINES[lang]}
      </p>
      <p className="mt-1 text-(--text-primary) text-sm">
        {MESSAGES[lang]}
      </p>
    </div>
  );
}
