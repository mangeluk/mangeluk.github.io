'use client';

import React from 'react';

interface WelcomeWindowProps {
  lang: 'es' | 'en';
  onClose: () => void;
  onOpenContact: () => void;
}

const WELCOME_TEXT = {
  es: {
    title: '¡Bienvenido a mi Portfolio!',
    subtitle: 'Un sistema operativo simulado en el navegador',
    description: [
      'Este es mi portfolio interactivo con forma de terminal y escritorio Linux.',
      'Puedes explorar mi información profesional usando la terminal o las aplicaciones del escritorio.',
    ],
    contactTitle: 'Información de contacto y CV',
    contactDesc: 'En la aplicación "Contact" (o comando `contact` en la terminal) encontrarás mi email, LinkedIn, GitHub y la opción de descargar mi CV en PDF.',
    exploreTitle: 'Explora y diviértete',
    exploreItems: [
      '📝 Terminal: Escribe `help` para ver todos los comandos disponibles',
      '🎮 Juegos: Snake, Tetris, 2048, Chess, Solitaire, Minesweeper, Flappy Bird, Breakout, Pong, Quiz y Doom',
      '🛠️ Utilidades: Calculadora, Bloc de notas, Clima, Calendario, Configuración, Gestor de archivos, Monitor de sistema, Pomodoro, QR Code y Music Player',
      '🎨 Temas: Cambia entre 6 temas (dark, light, matrix, dracula, nord, gruvbox) con `theme <nombre>`',
      '🌍 Idiomas: Español e Inglés con `lang es` / `lang en`',
      '🤖 IA: Pregunta sobre mi perfil con `ask <pregunta>`',
    ],
    closeBtn: 'Empezar a explorar',
    contactBtn: 'Ver Contacto',
  },
  en: {
    title: 'Welcome to my Portfolio!',
    subtitle: 'A simulated OS in the browser',
    description: [
      'This is my interactive portfolio shaped as a terminal and Linux desktop.',
      'You can explore my professional info using the terminal or the desktop applications.',
    ],
    contactTitle: 'Contact Info & CV',
    contactDesc: 'In the "Contact" app (or `contact` command in terminal) you\'ll find my email, LinkedIn, GitHub and the option to download my CV as PDF.',
    exploreTitle: 'Explore & Have Fun',
    exploreItems: [
      '📝 Terminal: Type `help` to see all available commands',
      '🎮 Games: Snake, Tetris, 2048, Chess, Solitaire, Minesweeper, Flappy Bird, Breakout, Pong, Quiz & Doom',
      '🛠️ Utilities: Calculator, Notepad, Weather, Calendar, Settings, File Manager, System Monitor, Pomodoro, QR Code & Music Player',
      '🎨 Themes: Switch between 6 themes (dark, light, matrix, dracula, nord, gruvbox) with `theme <name>`',
      '🌍 Languages: Spanish & English with `lang es` / `lang en`',
      '🤖 AI: Ask about my profile with `ask <question>`',
    ],
    closeBtn: 'Start Exploring',
    contactBtn: 'View Contact',
  },
};

export default function WelcomeWindow({ lang, onClose, onOpenContact }: WelcomeWindowProps) {
  const t = WELCOME_TEXT[lang];

  return (
    <div
      style={{
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        height: '100%',
        overflow: 'auto',
        color: 'var(--text-primary)',
        fontFamily: 'inherit',
        lineHeight: 1.6,
      }}
    >
      <div style={{ textAlign: 'center', paddingBottom: '8px' }}>
        <h1
          style={{
            margin: 0,
            fontSize: '28px',
            fontWeight: 700,
            color: 'var(--text-primary)',
            background: 'linear-gradient(90deg, var(--text-primary), var(--text-warning))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          {t.title}
        </h1>
        <p style={{ margin: '8px 0 0', color: 'var(--text-secondary)', fontSize: '14px' }}>
          {t.subtitle}
        </p>
      </div>

      <div style={{ borderTop: '1px solid var(--text-secondary)', opacity: 0.3 }} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px' }}>
        {t.description.map((line, i) => (
          <p key={i} style={{ margin: 0, color: 'var(--text-primary)' }}>
            {line}
          </p>
        ))}
      </div>

      <div style={{ borderTop: '1px solid var(--text-secondary)', opacity: 0.3, margin: '8px 0' }} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ background: 'var(--bg-terminal)', padding: '16px', borderRadius: '8px', border: '1px solid var(--text-secondary)' }}>
          <h3 style={{ margin: '0 0 12px', fontSize: '16px', color: 'var(--text-warning)' }}>
            {t.contactTitle}
          </h3>
          <p style={{ margin: '0 0 12px', fontSize: '13px', color: 'var(--text-secondary)' }}>
            {t.contactDesc}
          </p>
          <button
            onClick={onOpenContact}
            style={{
              width: '100%',
              padding: '10px 16px',
              background: 'var(--text-primary)',
              color: '#0a0a0a',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.85'; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
          >
            {t.contactBtn}
          </button>
        </div>

        <div style={{ background: 'var(--bg-terminal)', padding: '16px', borderRadius: '8px', border: '1px solid var(--text-secondary)' }}>
          <h3 style={{ margin: '0 0 12px', fontSize: '16px', color: 'var(--text-warning)' }}>
            {t.exploreTitle}
          </h3>
          <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: 'var(--text-primary)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {t.exploreItems.map((item, i) => (
              <li key={i} style={{ listStyle: 'none', paddingLeft: '8px', borderLeft: '2px solid var(--text-secondary)', opacity: 0.9 }}>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div style={{ borderTop: '1px solid var(--text-secondary)', opacity: 0.3, marginTop: '8px' }} />

      <button
        onClick={onClose}
        style={{
          alignSelf: 'center',
          padding: '12px 32px',
          background: 'var(--text-primary)',
          color: '#0a0a0a',
          border: 'none',
          borderRadius: '6px',
          fontWeight: 700,
          fontSize: '14px',
          cursor: 'pointer',
          fontFamily: 'inherit',
          transition: 'transform 0.1s, opacity 0.15s',
        }}
        onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.98)'; }}
        onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.opacity = '1'; }}
        onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.85'; }}
      >
        {t.closeBtn}
      </button>
    </div>
  );
}