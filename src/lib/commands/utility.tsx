// src/lib/commands/utility.tsx
// Utility commands: clear, banner, download cv, theme, lang, export, matrix
// Requirements: 8.1–8.3, 9.1, 12.1–12.3, 14.1–14.6, 15.1–15.5

import React from 'react';
import { registerCommand } from './index';
import { isValidTheme, isValidLang } from '@/lib/theme';
import { profile } from '@/data/profile';
import MatrixRain from '@/components/Terminal/MatrixRain';
import Neofetch from '@/components/Terminal/Neofetch';

// ---------------------------------------------------------------------------
// `clear` — clears history (Req. 8.1–8.3)
// ---------------------------------------------------------------------------

// Clear command
registerCommand({
  name: 'clear',
  description: 'clear [history] — Limpia la terminal o el historial de comandos / Clear the terminal or command history',
  execute(args, ctx) {
    if (args[0]?.toLowerCase() === 'history') {
      // Clear command history will be handled in Terminal.tsx
      return { type: 'text', content: ctx.lang === 'en' ? 'Command history cleared.' : 'Historial de comandos borrado.' };
    }
    return { type: 'clear' };
  },
});

// ---------------------------------------------------------------------------
// `banner` — show welcome banner (Req. 9.1)
// ---------------------------------------------------------------------------

registerCommand({
  name: 'banner',
  description: 'Muestra el banner de bienvenida / Show welcome banner',
  execute(_args, _ctx) {
    // Terminal.tsx checks result.content === '__BANNER__' to add a banner history entry.
    return { type: 'text', content: '__BANNER__' };
  },
});

// ---------------------------------------------------------------------------
// `download cv` — download CV PDF (Req. 12.1–12.3)
// ---------------------------------------------------------------------------

registerCommand({
  name: 'download',
  description: 'download cv — Descarga el CV en PDF / Download CV as PDF',
  execute(args, ctx) {
    // Must be called as "download cv"
    if (args[0]?.toLowerCase() !== 'cv') {
      return {
        type: 'error',
        content: ctx.lang === 'en'
          ? "Unknown subcommand. Did you mean 'download cv'?"
          : "Subcomando desconocido. ¿Quisiste decir 'download cv'?",
      };
    }

    const cvUrl = profile[ctx.lang]?.cvUrl || profile['es']?.cvUrl || '';

    if (!cvUrl) {
      return {
        type: 'error',
        content: ctx.lang === 'en'
          ? 'CV is not available at this time.'
          : 'El CV no está disponible actualmente.',
      };
    }

    // Trigger download via JSX anchor with `download` attribute (Req. 12.1)
    const content = (
      <span>
        {ctx.lang === 'en' ? 'Starting download... ' : 'Iniciando descarga... '}
        <a
          href={cvUrl}
          download
          className="underline hover:opacity-80"
          onClick={(e) => {
            // Programmatically click to trigger download immediately
            e.currentTarget.click();
          }}
        >
          {ctx.lang === 'en' ? 'Click here if it does not start automatically.' : 'Haz clic aquí si no inicia automáticamente.'}
        </a>
      </span>
    );

    return { type: 'jsx', content };
  },
});

// ---------------------------------------------------------------------------
// `theme <dark|light|matrix>` — change visual theme (Req. 14.1–14.6)
// ---------------------------------------------------------------------------

registerCommand({
  name: 'theme',
  description: 'theme <dark|light|matrix|dracula|nord|monokai|current> — Cambia o muestra el tema / Change or show current theme',
  execute(args, ctx) {
    const value = args[0]?.toLowerCase();

    if (value === 'current') {
      return {
        type: 'text',
        content: ctx.lang === 'en'
          ? `Current theme: ${ctx.theme}`
          : `Tema actual: ${ctx.theme}`,
      };
    }

    if (!value || !isValidTheme(value)) {
      return {
        type: 'error',
        content: ctx.lang === 'en'
          ? `Invalid theme. Valid options: dark, light, matrix, dracula, nord, monokai, current. Current: ${ctx.theme}`
          : `Tema inválido. Opciones válidas: dark, light, matrix, dracula, nord, monokai, current. Actual: ${ctx.theme}`,
      };
    }

    ctx.setTheme(value);
    // Persist to localStorage (Req. 14.5)
    try {
      localStorage.setItem('terminal-theme', value);
    } catch {
      // localStorage unavailable (private browsing) — ignore
    }

    return {
      type: 'text',
      content: ctx.lang === 'en'
        ? `Theme changed to: ${value}`
        : `Tema cambiado a: ${value}`,
    };
  },
});

// ---------------------------------------------------------------------------
// `lang <es|en>` — change content language (Req. 15.1–15.5)
// ---------------------------------------------------------------------------

registerCommand({
  name: 'lang',
  description: 'lang <es|en|current> — Cambia o muestra el idioma / Change or show current language',
  execute(args, ctx) {
    const value = args[0]?.toLowerCase();

    if (value === 'current') {
      return {
        type: 'text',
        content: ctx.lang === 'en'
          ? `Current language: ${ctx.lang}`
          : `Idioma actual: ${ctx.lang}`,
      };
    }

    if (!value || !isValidLang(value)) {
      return {
        type: 'error',
        content: ctx.lang === 'en'
          ? `Invalid language code. Valid codes: es, en, current. Current: ${ctx.lang}`
          : `Código de idioma inválido. Códigos válidos: es, en, current. Actual: ${ctx.lang}`,
      };
    }

    ctx.setLang(value);
    // Persist to localStorage (Req. 15.4)
    try {
      localStorage.setItem('terminal-lang', value);
    } catch {
      // localStorage unavailable — ignore
    }

    return {
      type: 'text',
      content: value === 'en'
        ? `Language changed to: English`
        : `Idioma cambiado a: Español`,
    };
  },
});

// Export terminal history to a text file
registerCommand({
  name: 'export-history',
  description: 'export-history — Descarga el historial de la terminal como archivo .txt / Export terminal history to a .txt file',
  execute(_args, ctx) {
    const history = ctx.getHistory();
    
    // Generate text content from history
    const content = history.map(entry => {
      if (entry.type === 'input') {
        return `> ${typeof entry.content === 'string' ? entry.content : ''}`;
      } else if (entry.type === 'banner') {
        return '--- WELCOME BANNER ---';
      } else if (entry.type === 'loader') {
        return `[LOADING] ${typeof entry.content === 'string' ? entry.content : ''}`;
      } else if (entry.type === 'error') {
        return `[ERROR] ${typeof entry.content === 'string' ? entry.content : ''}`;
      } else {
        return typeof entry.content === 'string' ? entry.content : '[JSX Content]';
      }
    }).join('\n\n');

    // Create and trigger download
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const filename = `terminal-history-${new Date().toISOString().split('T')[0]}.txt`;
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    return {
      type: 'text',
      content: ctx.lang === 'en'
        ? `History downloaded successfully as ${filename}!`
        : `Historial descargado con éxito como ${filename}!`,
    };
  },
});

// History command
registerCommand({
  name: 'history',
  description: 'history — Lista comandos anteriores / List previous commands',
  execute(_args, ctx) {
    const cmdHistory = ctx.getCommandHistory();
    if (cmdHistory.length === 0) {
      return {
        type: 'text',
        content: ctx.lang === 'en' 
          ? 'No commands in history yet.'
          : 'Aún no hay comandos en el historial.'
      };
    }
    const lines = cmdHistory.map((cmd, i) => `${i + 1}. ${cmd}`);
    return { type: 'text', content: lines.join('\n') };
  },
});

// Alias command
registerCommand({
  name: 'alias',
  description: 'alias [name] [command] — Crea/ver aliases / Create/list aliases',
  execute(args, ctx) {
    if (args.length === 0) {
      // List aliases
      const aliases = ctx.getAliases();
      const entries = Object.entries(aliases);
      if (entries.length === 0) {
        return {
          type: 'text',
          content: ctx.lang === 'en'
            ? 'No aliases defined yet. Use: alias <name> <command>'
            : 'No hay aliases definidos. Usa: alias <nombre> <comando>'
        };
      }
      return {
        type: 'text',
        content: entries.map(([k, v]) => `${k}='${v}'`).join('\n')
      };
    }
    if (args.length < 2) {
      return {
        type: 'error',
        content: ctx.lang === 'en'
          ? 'Usage: alias <name> <command>'
          : 'Uso: alias <nombre> <comando>'
      };
    }
    const name = args[0];
    const command = args.slice(1).join(' ');
    const newAliases = { ...ctx.getAliases(), [name]: command };
    ctx.setAliases(newAliases);
    return {
      type: 'text',
      content: ctx.lang === 'en'
        ? `Alias created: ${name}='${command}'`
        : `Alias creado: ${name}='${command}'`
    };
  },
});

// Matrix rain easter egg
registerCommand({
  name: 'matrix',
  description: 'matrix — Easter egg: efecto de lluvia de caracteres / Easter egg: character rain effect',
  execute(_args, _ctx) {
    return {
      type: 'jsx',
      content: (
        <div style={{ width: '100%', height: '200px', overflow: 'hidden', borderRadius: '4px', border: '1px solid #0f0' }}>
          <MatrixRain duration={10000} />
        </div>
      ),
    };
  },
});

// Neofetch easter egg
registerCommand({
  name: 'neofetch',
  description: 'neofetch — Easter egg: información del sistema / Easter egg: system info',
  execute(_args, ctx) {
    return {
      type: 'jsx',
      content: <Neofetch lang={ctx.lang} />,
    };
  },
});

// Echo command
registerCommand({
  name: 'echo',
  description: 'echo <texto> — Imprime texto en la terminal / Print text to the terminal',
  execute(args, _ctx) {
    return { type: 'text', content: args.join(' ') };
  },
});

// Date command
registerCommand({
  name: 'date',
  description: 'date — Muestra fecha y hora actual / Show current date and time: date [+format]',
  execute(args, ctx) {
    const now = new Date();

    // Support format strings like date +%Y-%m-%d
    if (args.length > 0 && args[0].startsWith('+')) {
      const fmt = args[0].slice(1);
      let result = fmt;
      result = result.replace(/%Y/g, String(now.getFullYear()));
      result = result.replace(/%m/g, String(now.getMonth() + 1).padStart(2, '0'));
      result = result.replace(/%d/g, String(now.getDate()).padStart(2, '0'));
      result = result.replace(/%H/g, String(now.getHours()).padStart(2, '0'));
      result = result.replace(/%M/g, String(now.getMinutes()).padStart(2, '0'));
      result = result.replace(/%S/g, String(now.getSeconds()).padStart(2, '0'));
      result = result.replace(/%A/g, now.toLocaleDateString(ctx.lang === 'es' ? 'es-ES' : 'en-US', { weekday: 'long' }));
      result = result.replace(/%a/g, now.toLocaleDateString(ctx.lang === 'es' ? 'es-ES' : 'en-US', { weekday: 'short' }));
      result = result.replace(/%B/g, now.toLocaleDateString(ctx.lang === 'es' ? 'es-ES' : 'en-US', { month: 'long' }));
      result = result.replace(/%b/g, now.toLocaleDateString(ctx.lang === 'es' ? 'es-ES' : 'en-US', { month: 'short' }));
      result = result.replace(/%T/g, `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`);
      return { type: 'text', content: result };
    }

    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return { type: 'text', content: now.toLocaleDateString(ctx.lang === 'es' ? 'es-ES' : 'en-US', options) };
  },
});

// Cowsay easter egg
registerCommand({
  name: 'cowsay',
  description: 'cowsay <texto> — Easter egg: vaca que dice cosas / Easter egg: talking cow',
  execute(args, _ctx) {
    const text = args.length > 0 ? args.join(' ') : 'Hello!';
    const bubble = ` ${'_'.repeat(text.length + 2)} 
< ${text} >
 ${'-'.repeat(text.length + 2)} 
        \\   ^__^
         \\  (oo)\\_______
            (__)\\       )\\/\\
                ||----w |
                ||     ||`;
    return { type: 'text', content: bubble };
  },
});
