// src/lib/commands/content.tsx
// Content commands: about, whoami, experience, skills, projects, contact, social
// Requirements: 3.1–3.3, 4.1–4.3, 5.1–5.3, 6.1–6.3, 7.1–7.3, 10.1–10.2, 11.1–11.2, 20.2–20.4

import React from 'react';
import { registerCommand } from './index';
import type { Lang } from '@/types/terminal';
import { profile } from '@/data/profile';
import type { LangProfile } from '@/data/profile';

// ---------------------------------------------------------------------------
// Helper: resolve profile data for active lang with 'es' fallback (Req. 20.4)
// ---------------------------------------------------------------------------

function getLangProfile(lang: Lang): LangProfile | null {
  if (profile[lang]) return profile[lang];
  if (profile['es']) return profile['es'];
  return null;
}

const DIVIDER = '──────────────────────────────────────────────────';

// ---------------------------------------------------------------------------
// `about` — professional bio (Req. 3.1–3.3)
// ---------------------------------------------------------------------------

registerCommand({
  name: 'about',
  description: 'Descripción profesional / Professional bio',
  execute(args, ctx) {
    const p = getLangProfile(ctx.lang);
    if (!p || !p.bio) {
      return { type: 'error', content: 'Contenido no disponible.' };
    }
    const detailed = args.includes('--detailed') || args.includes('-d');
    if (detailed) {
      const extra = ctx.lang === 'en' 
        ? '\n\nExtra info:\n- Based in: Your Location\n- Favorite tech: React, Next.js\n- Hobbies: Coding, Reading, Gaming'
        : '\n\nInfo extra:\n- Ubicación: Tu ubicación\n- Tech favorito: React, Next.js\n- Hobbies: Programar, Leer, Gaming';
      return { type: 'text', content: p.bio + extra };
    }
    return { type: 'text', content: p.bio };
  },
});

// ---------------------------------------------------------------------------
// `whoami` — one-liner (Req. 10.1–10.2)
// ---------------------------------------------------------------------------

registerCommand({
  name: 'whoami',
  description: 'One-liner profesional estilo unix / Unix-style one-liner',
  execute(_args, ctx) {
    const p = getLangProfile(ctx.lang);
    if (!p || !p.whoami) {
      return { type: 'error', content: 'Contenido no disponible.' };
    }
    return { type: 'text', content: p.whoami };
  },
});

// ---------------------------------------------------------------------------
// `experience` — work history (Req. 4.1–4.3)
// ---------------------------------------------------------------------------

registerCommand({
  name: 'experience',
  description: 'Historial laboral / Work history',
  execute(_args, ctx) {
    const p = getLangProfile(ctx.lang);
    if (!p || !p.experience || p.experience.length === 0) {
      return { type: 'error', content: ctx.lang === 'en' ? 'No experience available.' : 'No hay experiencia disponible.' };
    }

    const lines: string[] = [];
    p.experience.forEach((entry, i) => {
      if (i > 0) lines.push(DIVIDER);
      lines.push(`${entry.company}  |  ${entry.role}  |  ${entry.from}–${entry.to}`);
      lines.push(entry.description);
    });

    return { type: 'text', content: lines.join('\n') };
  },
});

// ---------------------------------------------------------------------------
// `skills` — tech stack by category (Req. 6.1–6.3)
// ---------------------------------------------------------------------------

registerCommand({
  name: 'skills',
  description: 'Stack técnico por categorías / Tech stack by category',
  execute(_args, ctx) {
    const p = getLangProfile(ctx.lang);
    if (!p || !p.skills || p.skills.length === 0) {
      return { type: 'error', content: ctx.lang === 'en' ? 'No skills available.' : 'No hay habilidades disponibles.' };
    }

    const lines = p.skills.map(
      (cat) => `▶ ${cat.name.toUpperCase()}\n  ${cat.skills.join(' · ')}`
    );

    return { type: 'text', content: lines.join('\n\n') };
  },
});

// ---------------------------------------------------------------------------
// `projects` — highlighted projects with links (Req. 5.1–5.3)
// ---------------------------------------------------------------------------

registerCommand({
  name: 'projects',
  description: 'Proyectos destacados / Featured projects',
  execute(args, ctx) {
    const p = getLangProfile(ctx.lang);
    if (!p || !p.projects || p.projects.length === 0) {
      return { type: 'error', content: ctx.lang === 'en' ? 'No projects available.' : 'No hay proyectos disponibles.' };
    }

    const detailed = args.includes('--detailed') || args.includes('-d') || args.includes('--verbose') || args.includes('-v');

    const content = (
      <div className="space-y-4">
        {p.projects.map((proj) => (
          <div key={proj.name}>
            <span className="font-bold text-lg">{proj.name}</span>
            <br />
            <span>{proj.description}</span>
            {detailed && (
              <div className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                Stack: React, Next.js, TypeScript, Tailwind CSS
                <br />
                Status: Active
              </div>
            )}
            <br />
            <a
              href={proj.url}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:opacity-80"
            >
              {proj.url}
            </a>
          </div>
        ))}
      </div>
    );

    return { type: 'jsx', content };
  },
});

// ---------------------------------------------------------------------------
// `contact` — contact channels (Req. 7.1–7.3)
// ---------------------------------------------------------------------------

registerCommand({
  name: 'contact',
  description: 'Información de contacto / Contact info',
  execute(_args, ctx) {
    const p = getLangProfile(ctx.lang);
    if (!p || !p.contact || p.contact.length === 0) {
      return { type: 'error', content: ctx.lang === 'en' ? 'Contact information not available.' : 'Información de contacto no disponible.' };
    }

    const content = (
      <div className="space-y-1">
        {p.contact.map((ch) => (
          <div key={ch.label}>
            <span className="font-bold">{ch.label}:</span>{' '}
            {ch.isUrl ? (
              <a
                href={ch.value}
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:opacity-80"
              >
                {ch.value.replace('mailto:', '')}
              </a>
            ) : (
              <span>{ch.value}</span>
            )}
          </div>
        ))}
      </div>
    );

    return { type: 'jsx', content };
  },
});

// ---------------------------------------------------------------------------
// `social` — social links with ASCII icons (Req. 11.1–11.2)
// ---------------------------------------------------------------------------

registerCommand({
  name: 'social',
  description: 'Redes sociales / Social links',
  execute(_args, ctx) {
    const p = getLangProfile(ctx.lang);
    if (!p || !p.social || p.social.length === 0) {
      return { type: 'error', content: ctx.lang === 'en' ? 'No social profiles available.' : 'No hay perfiles sociales disponibles.' };
    }

    const content = (
      <div className="space-y-1">
        {p.social.map((link) => (
          <div key={link.name}>
            <span>{link.icon} {link.name}: </span>
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:opacity-80"
            >
              {link.url}
            </a>
          </div>
        ))}
      </div>
    );

    return { type: 'jsx', content };
  },
});
