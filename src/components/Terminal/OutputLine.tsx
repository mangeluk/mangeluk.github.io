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

// Parse ANSI-like escape sequences: \x1b[31m = red, \x1b[0m = reset, etc.
// Supports: 31-37 (fg colors), 41-47 (bg colors), 0 (reset), 1 (bold), 2 (dim)
function renderColoredText(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const regex = /\x1b\[(\d+)m/g;
  let lastIndex = 0;
  let currentColor: React.CSSProperties = {};
  let key = 0;

  let match;
  while ((match = regex.exec(text)) !== null) {
    // Add text before this escape sequence
    if (match.index > lastIndex) {
      const segment = text.slice(lastIndex, match.index);
      if (segment) {
        parts.push(
          <span key={key++} style={Object.keys(currentColor).length > 0 ? currentColor : undefined}>
            {segment}
          </span>
        );
      }
    }

    const code = parseInt(match[1], 10);
    lastIndex = regex.lastIndex;

    if (code === 0) {
      // Reset
      currentColor = {};
    } else if (code === 1) {
      currentColor = { ...currentColor, fontWeight: 'bold' };
    } else if (code === 2) {
      currentColor = { ...currentColor, opacity: 0.6 };
    } else if (code >= 31 && code <= 37) {
      // Foreground colors
      const colorMap: Record<number, string> = {
        31: '#ff5555', // red
        32: '#50fa7b', // green
        33: '#f1fa8c', // yellow
        34: '#6272a4', // blue
        35: '#ff79c6', // magenta
        36: '#8be9fd', // cyan
        37: '#f8f8f2', // white
      };
      currentColor = { ...currentColor, color: colorMap[code] || '#f8f8f2' };
    } else if (code >= 41 && code <= 47) {
      // Background colors
      const bgColorMap: Record<number, string> = {
        41: '#ff5555',
        42: '#50fa7b',
        43: '#f1fa8c',
        44: '#6272a4',
        45: '#ff79c6',
        46: '#8be9fd',
        47: '#f8f8f2',
      };
      currentColor = { ...currentColor, backgroundColor: bgColorMap[code] || 'transparent' };
    }
  }

  // Add remaining text
  if (lastIndex < text.length) {
    const remaining = text.slice(lastIndex);
    if (remaining) {
      parts.push(
        <span key={key++} style={Object.keys(currentColor).length > 0 ? currentColor : undefined}>
          {remaining}
        </span>
      );
    }
  }

  return parts.length > 0 ? parts : [text];
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

  // Check if content has ANSI-like escape sequences
  const hasEscapes = entry.content.includes('\x1b[');

  if (hasEscapes) {
    return (
      <div className="py-0.5">
        <pre
          style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontFamily: 'inherit', margin: 0 }}
        >
          {renderColoredText(entry.content)}
        </pre>
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
