'use client';

// src/components/Terminal/OutputLine.tsx
// Renders a single history entry with correct color and formatting.
// Requirements: 2.2, 4.2, 6.2, 13.2, 16.1

import React, { useEffect, useState } from 'react';
import type { HistoryEntry, Theme } from '@/types/terminal';

interface OutputLineProps {
  entry: HistoryEntry;
  /** Active theme. The component relies on CSS custom properties (var(--text-*))
   *  set by the data-theme attribute on the Terminal wrapper, so this prop is
   *  accepted for API compatibility but does not need to be used directly. */
  theme?: Theme;
}

// Spinner frames for loader animation (Req. 13.2)
const SPINNER_FRAMES = ['⣾', '⣽', '⣻', '⢿', '⡿', '⣟', '⣯', '⣷'];

function LoaderOutput({ content }: { content: string }) {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setFrame((f) => (f + 1) % SPINNER_FRAMES.length);
    }, 100);
    return () => clearInterval(id);
  }, []);

  return (
    <span style={{ color: 'var(--text-warning)' }}>
      {SPINNER_FRAMES[frame]} {content}
    </span>
  );
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function OutputLine({ entry, theme }: OutputLineProps) {
  const colorMap: Record<string, string> = {
    output: 'var(--text-primary)',
    error: 'var(--text-error)',
    input: 'var(--text-secondary)',
    banner: 'var(--text-primary)',
    loader: 'var(--text-warning)',
  };

  const color = colorMap[entry.type] ?? 'var(--text-primary)';

  if (entry.type === 'loader') {
    return (
      <div className="py-0.5" role="status" aria-live="polite">
        <LoaderOutput content={typeof entry.content === 'string' ? entry.content : ''} />
      </div>
    );
  }

  if (typeof entry.content !== 'string') {
    // JSX content (projects, contact, social, download cv)
    return (
      <div className="py-0.5" style={{ color }}>
        {entry.content}
      </div>
    );
  }

  // String content — preserve whitespace with <pre>
  return (
    <div className="py-0.5">
      <pre
        style={{ color, whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontFamily: 'inherit', margin: 0 }}
      >
        {entry.content}
      </pre>
    </div>
  );
}
