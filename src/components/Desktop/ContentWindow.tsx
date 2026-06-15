'use client';

// src/components/Desktop/ContentWindow.tsx
// Renders profile content directly from data (About, Projects, Skills, etc.)

import React from 'react';
import { profile, type LangProfile } from '@/data/profile';
import type { Lang } from '@/types/terminal';

interface ContentWindowProps {
  contentType: 'about' | 'projects' | 'skills' | 'experience' | 'contact';
  lang: Lang;
}

function getProfile(lang: Lang): LangProfile {
  return profile[lang] || profile['es'];
}

const DIVIDER = '──────────────────────────────────────────────────';

export default function ContentWindow({ contentType, lang }: ContentWindowProps) {
  const p = getProfile(lang);

  return (
    <div
      className="h-full overflow-y-auto p-5"
      style={{ color: 'var(--text-primary)', backgroundColor: 'rgba(10, 10, 10, 0.88)' }}
    >
      {contentType === 'about' && <AboutContent p={p} lang={lang} />}
      {contentType === 'projects' && <ProjectsContent p={p} lang={lang} />}
      {contentType === 'skills' && <SkillsContent p={p} lang={lang} />}
      {contentType === 'experience' && <ExperienceContent p={p} lang={lang} />}
      {contentType === 'contact' && <ContactContent p={p} lang={lang} />}
    </div>
  );
}

function AboutContent({ p, lang }: { p: LangProfile; lang: Lang }) {
  return (
    <div>
      <h2 className="text-lg font-bold mb-3" style={{ color: 'var(--text-success)' }}>
        {lang === 'es' ? 'Sobre Mí' : 'About Me'}
      </h2>
      <pre className="text-sm whitespace-pre-wrap" style={{ fontFamily: 'inherit', margin: 0 }}>
        {p.bio}
      </pre>
      <pre className="text-sm mt-3" style={{ fontFamily: 'inherit', margin: 0, color: 'var(--text-secondary)' }}>
        {`\n${DIVIDER}\n`}
        {p.whoami}
      </pre>
    </div>
  );
}

function ProjectsContent({ p, lang }: { p: LangProfile; lang: Lang }) {
  return (
    <div>
      <h2 className="text-lg font-bold mb-3" style={{ color: 'var(--text-success)' }}>
        {lang === 'es' ? 'Proyectos Destacados' : 'Featured Projects'}
      </h2>
      <div className="flex flex-col gap-4">
        {p.projects.map((proj, i) => (
          <div key={i} className="border-l-2 pl-3" style={{ borderColor: 'var(--text-accent)' }}>
            <div className="flex items-center gap-2">
              <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{proj.name}</span>
              {proj.url && (
                <a
                  href={proj.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs underline"
                  style={{ color: 'var(--text-info)' }}
                >
                  ↗
                </a>
              )}
            </div>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
              {proj.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function SkillsContent({ p, lang }: { p: LangProfile; lang: Lang }) {
  return (
    <div>
      <h2 className="text-lg font-bold mb-3" style={{ color: 'var(--text-success)' }}>
        {lang === 'es' ? 'Habilidades Técnicas' : 'Technical Skills'}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {p.skills.map((cat, i) => (
          <div key={i}>
            <h3 className="text-sm font-bold mb-1" style={{ color: 'var(--text-info)' }}>
              {cat.name}
            </h3>
            <div className="flex flex-wrap gap-1">
              {cat.skills.map((skill, j) => (
                <span
                  key={j}
                  className="text-xs px-2 py-0.5 rounded"
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: 'var(--text-primary)',
                  }}
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ExperienceContent({ p, lang }: { p: LangProfile; lang: Lang }) {
  return (
    <div>
      <h2 className="text-lg font-bold mb-3" style={{ color: 'var(--text-success)' }}>
        {lang === 'es' ? 'Experiencia Laboral' : 'Work Experience'}
      </h2>
      <div className="flex flex-col gap-4">
        {p.experience.map((exp, i) => (
          <div key={i} className="border-l-2 pl-3" style={{ borderColor: 'var(--text-warning)' }}>
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{exp.role}</span>
              <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                @ {exp.company}
              </span>
            </div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--text-accent)' }}>
              {exp.from} — {exp.to}
            </div>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
              {exp.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ContactContent({ p, lang }: { p: LangProfile; lang: Lang }) {
  return (
    <div>
      <h2 className="text-lg font-bold mb-3" style={{ color: 'var(--text-success)' }}>
        {lang === 'es' ? 'Contacto' : 'Contact'}
      </h2>
      <div className="flex flex-col gap-3">
        {p.contact.map((ch, i) => (
          <div key={i} className="flex items-center gap-3">
            <span className="text-sm font-bold w-20" style={{ color: 'var(--text-info)' }}>
              {ch.label}
            </span>
            {ch.isUrl ? (
              <a
                href={ch.value}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm underline"
                style={{ color: 'var(--text-primary)' }}
              >
                {ch.value.replace('mailto:', '')}
              </a>
            ) : (
              <span className="text-sm" style={{ color: 'var(--text-primary)' }}>{ch.value}</span>
            )}
          </div>
        ))}
      </div>
      {p.cvUrl && (
        <div className="mt-4">
          <a
            href={p.cvUrl}
            download
            className="inline-block text-sm px-4 py-2 rounded border"
            style={{
              borderColor: 'var(--text-primary)',
              color: 'var(--text-primary)',
            }}
          >
            {lang === 'es' ? '📄 Descargar CV' : '📄 Download CV'}
          </a>
        </div>
      )}
    </div>
  );
}
