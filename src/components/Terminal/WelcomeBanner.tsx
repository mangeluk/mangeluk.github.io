'use client';

import type { Lang } from '@/types/terminal';
import React, { useState, useEffect, useRef } from 'react';

interface WelcomeBannerProps {
  lang: Lang;
}

const ASCII_ART = `
███╗   ███╗ █████╗ ███╗   ██╗ ██████╗ ███████╗██╗     ██╗   ██╗██╗  ██╗
████╗ ████║██╔══██╗████╗  ██║██╔════╝ ██╔════╝██║     ██║   ██║██║ ██╔╝
██╔████╔██║███████║██╔██╗ ██║██║  ███╗█████╗  ██║     ██║   ██║█████╔╝ 
██║╚██╔╝██║██╔══██║██║╚██╗██║██║   ██║██╔══╝  ██║     ██║   ██║██╔═██╗ 
██║ ╚═╝ ██║██║  ██║██║ ╚████║╚██████╔╝███████╗███████╗╚██████╔╝██║  ██╗
╚═╝     ╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝ ╚═════╝ ╚══════╝╚══════╝ ╚═════╝ ╚═╝  ╚═╝`.trimStart();

const MESSAGES: Record<Lang, string> = {
  es: "Bienvenido a mi portfolio terminal. Escribe 'help' para ver los comandos disponibles.",
  en: "Welcome to my terminal portfolio. Type 'help' to see available commands.",
};

const TAGLINES: Record<Lang, string> = {
  es: 'Portfolio Interactivo v1.0.0 — Desarrollador Full Stack',
  en: 'Interactive Portfolio v1.0.0 — Full Stack Developer',
};

export default function WelcomeBanner({ lang }: WelcomeBannerProps) {
  const [displayText, setDisplayText] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const fullText = MESSAGES[lang];
  const indexRef = useRef(0);

  useEffect(() => {
    if (!isTyping) return;

    if (indexRef.current < fullText.length) {
      const timer = setTimeout(() => {
        setDisplayText(fullText.slice(0, indexRef.current + 1));
        indexRef.current += 1;
      }, 30); // 30ms per character, adjust speed as needed
      return () => clearTimeout(timer);
    } else {
      setIsTyping(false);
    }
  }, [isTyping, fullText]);

  return (
    <div className="mb-4">
      <pre
        className="text-(--text-primary) text-xs leading-tight overflow-x-auto"
        aria-label="ASCII art banner"
      >
        {ASCII_ART}
      </pre>
      <p className="mt-2 text-(--text-secondary) text-sm">
        {TAGLINES[lang]}
      </p>
      <p className="mt-1 text-(--text-primary) text-sm">
        {displayText}
        {isTyping && <span className="animate-pulse">█</span>}
      </p>
    </div>
  );
}
