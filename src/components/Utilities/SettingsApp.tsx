'use client';

import React, { useState, useCallback } from 'react';

interface SettingsAppProps {
  theme: string;
  lang: string;
  setTheme: (t: string) => void;
  setLang: (l: string) => void;
}

const THEMES = [
  { id: 'dark', name: 'Dark', colors: ['#0a0a0a', '#00ff9f', '#16213e'] },
  { id: 'light', name: 'Light', colors: ['#ffffff', '#1a1a2e', '#f0f0f0'] },
  { id: 'matrix', name: 'Matrix', colors: ['#000000', '#00ff41', '#003300'] },
  { id: 'dracula', name: 'Dracula', colors: ['#282a36', '#50fa7b', '#bd93f9'] },
  { id: 'nord', name: 'Nord', colors: ['#2e3440', '#a3be8c', '#81a1c1'] },
  { id: 'monokai', name: 'Monokai', colors: ['#272822', '#a6e22e', '#f92672'] },
];

const FONT_SIZES = [
  { id: 'small', label: 'Small', value: '12px' },
  { id: 'medium', label: 'Medium', value: '14px' },
  { id: 'large', label: 'Large', value: '16px' },
];

function getInitialFontSize(): string {
  if (typeof window === 'undefined') return 'medium';
  return localStorage.getItem('terminal-font-size') || 'medium';
}

export default function SettingsApp({ theme, lang, setTheme, setLang }: SettingsAppProps) {
  const [fontSize, setFontSize] = useState(getInitialFontSize);

  const handleThemeChange = useCallback((t: string) => {
    setTheme(t);
  }, [setTheme]);

  const handleLangChange = useCallback((l: string) => {
    setLang(l);
  }, [setLang]);

  const handleFontSizeChange = useCallback((size: string) => {
    setFontSize(size);
    localStorage.setItem('terminal-font-size', size);
    const px = FONT_SIZES.find((f) => f.id === size)?.value || '14px';
    document.documentElement.style.setProperty('--term-font-size', px);
  }, []);

  const handleReset = useCallback(() => {
    setTheme('dark');
    setLang('es');
    handleFontSizeChange('medium');
    localStorage.removeItem('terminal-theme');
    localStorage.removeItem('terminal-lang');
    localStorage.removeItem('terminal-font-size');
  }, [setTheme, setLang, handleFontSizeChange]);

  return (
    <div className="settings-container">
      <div className="settings-section">
        <h3 className="settings-title">{lang === 'es' ? 'Tema' : 'Theme'}</h3>
        <div className="settings-theme-grid">
          {THEMES.map((t) => (
            <button
              key={t.id}
              className={`settings-theme-card ${theme === t.id ? 'settings-theme-card--active' : ''}`}
              onClick={() => handleThemeChange(t.id)}
            >
              <div className="settings-theme-preview">
                {t.colors.map((c, i) => (
                  <div key={i} className="settings-theme-swatch" style={{ background: c }} />
                ))}
              </div>
              <span className="settings-theme-name">{t.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="settings-section">
        <h3 className="settings-title">{lang === 'es' ? 'Idioma' : 'Language'}</h3>
        <div className="settings-lang-toggle">
          <button
            className={`settings-lang-btn ${lang === 'es' ? 'settings-lang-btn--active' : ''}`}
            onClick={() => handleLangChange('es')}
          >
            ES
          </button>
          <button
            className={`settings-lang-btn ${lang === 'en' ? 'settings-lang-btn--active' : ''}`}
            onClick={() => handleLangChange('en')}
          >
            EN
          </button>
        </div>
      </div>

      <div className="settings-section">
        <h3 className="settings-title">{lang === 'es' ? 'Tamaño de fuente' : 'Font Size'}</h3>
        <div className="settings-font-options">
          {FONT_SIZES.map((f) => (
            <button
              key={f.id}
              className={`settings-font-btn ${fontSize === f.id ? 'settings-font-btn--active' : ''}`}
              onClick={() => handleFontSizeChange(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="settings-section">
        <button className="settings-reset-btn" onClick={handleReset}>
          {lang === 'es' ? 'Restablecer valores predeterminados' : 'Reset to Defaults'}
        </button>
      </div>

      <div className="settings-section">
        <h3 className="settings-title">{lang === 'es' ? 'Sistema' : 'System'}</h3>
        <div className="settings-about">
          <div className="settings-about-row">
            <span>OS</span><span>Portfolio Terminal v1.0</span>
          </div>
          <div className="settings-about-row">
            <span>Kernel</span><span>Next.js + React</span>
          </div>
          <div className="settings-about-row">
            <span>Shell</span><span>TypeScript</span>
          </div>
          <div className="settings-about-row">
            <span>Theme</span><span>{theme}</span>
          </div>
          <div className="settings-about-row">
            <span>Language</span><span>{lang.toUpperCase()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
