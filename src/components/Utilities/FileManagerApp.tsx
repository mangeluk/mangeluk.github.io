'use client';

import React, { useState, useCallback } from 'react';

interface FSNode {
  type: 'file' | 'dir';
  content?: string;
  children?: Record<string, FSNode>;
}

const fileSystem: Record<string, FSNode> = {
  '~': {
    type: 'dir',
    children: {
      'about.txt': { type: 'file', content: 'Full Stack Developer from Argentina. Passionate about building great software.' },
      'experience': {
        type: 'dir',
        children: {
          'libgot.txt': { type: 'file', content: 'Libgot - Backend Engineering Lead (Mar 2026 - Present)\n- Technical leadership\n- Scalable systems design\n- AI integration' },
          'bamboo.txt': { type: 'file', content: 'Bamboo - Full Stack Developer (Nov 2023 - May 2024)\n- eComEngine payments system\n- Laravel, Vue.js, MySQL' },
        },
      },
      'projects': {
        type: 'dir',
        children: {
          'agendita.txt': { type: 'file', content: 'Agendita - Offline-First Agenda\nNext.js + Godot 4 for Android' },
          'cuandonosjuntamos.txt': { type: 'file', content: 'Meeting organizer\nNode.js + Express + Cloudflare' },
          'randomath.txt': { type: 'file', content: 'Math game built with Godot 4\nAvailable on Google Play' },
        },
      },
      'skills.txt': { type: 'file', content: 'TypeScript, React, Next.js, Node.js, Python, Godot, Laravel, Vue.js, Docker, AWS' },
      'contact.txt': { type: 'file', content: 'GitHub: github.com/mangeluk\nLinkedIn: linkedin.com/in/mangeluk' },
    },
  },
};

const FAVORITES = [
  { name: 'Home', path: '~' },
  { name: 'Desktop', path: '~/Desktop' },
  { name: 'Documents', path: '~/Documents' },
  { name: 'Downloads', path: '~/Downloads' },
];

function getEntry(path: string): FSNode | null {
  const parts = path.split('/').filter(Boolean);
  let current: FSNode | undefined = { type: 'dir', children: fileSystem };
  for (const part of parts) {
    if (!current?.children?.[part]) return null;
    current = current.children[part];
  }
  return current || null;
}

function getFileIcon(name: string, isDir: boolean): string {
  if (isDir) return '\uD83D\uDCC1';
  if (name.endsWith('.txt')) return '\uD83D\uDCC4';
  if (name.endsWith('.js')) return '\uD83D\uDFE1';
  if (name.endsWith('.ts')) return '\uD83D\uDD35';
  if (name.endsWith('.json')) return '\u2699\uFE0F';
  return '\uD83D\uDCC3';
}

export default function FileManagerApp() {
  const [currentPath, setCurrentPath] = useState('~');
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState('');

  const currentEntry = getEntry(currentPath);
  const children = currentEntry?.children || {};

  const pathParts = currentPath.split('/').filter(Boolean);

  const navigateTo = useCallback((path: string) => {
    setCurrentPath(path);
    setSelectedFile(null);
    setFileContent('');
  }, []);

  const handleBreadcrumbClick = useCallback((index: number) => {
    const path = pathParts.slice(0, index + 1).join('/');
    navigateTo(path);
  }, [pathParts, navigateTo]);

  const handleItemClick = useCallback((name: string, entry: FSNode) => {
    if (entry.type === 'dir') {
      navigateTo(currentPath === '~' ? `~/${name}` : `${currentPath}/${name}`);
    } else {
      setSelectedFile(name);
      setFileContent(entry.content || '(empty file)');
    }
  }, [currentPath, navigateTo]);

  const handleFavoriteClick = useCallback((path: string) => {
    const entry = getEntry(path);
    if (entry) navigateTo(path);
  }, [navigateTo]);

  return (
    <div className="fm-container">
      <div className="fm-sidebar">
        <div className="fm-sidebar-title">Favorites</div>
        {FAVORITES.map((fav) => (
          <button
            key={fav.name}
            className="fm-favorite-btn"
            onClick={() => handleFavoriteClick(fav.path)}
          >
            {fav.name === 'Home' ? '\uD83C\uDFE0' : fav.name === 'Desktop' ? '\uD83D\uDDA5\uFE0F' : fav.name === 'Documents' ? '\uD83D\uDCC1' : '\u2B07\uFE0F'}
            {' '}{fav.name}
          </button>
        ))}
      </div>
      <div className="fm-main">
        <div className="fm-breadcrumb">
          {pathParts.map((part, i) => (
            <React.Fragment key={i}>
              {i > 0 && <span className="fm-breadcrumb-sep">/</span>}
              <button className="fm-breadcrumb-item" onClick={() => handleBreadcrumbClick(i)}>
                {part}
              </button>
            </React.Fragment>
          ))}
        </div>
        <div className="fm-content">
          <div className="fm-file-list">
            {Object.entries(children).length === 0 ? (
              <div className="fm-empty">Empty folder</div>
            ) : (
              Object.entries(children).map(([name, entry]) => (
                <button
                  key={name}
                  className={`fm-file-item ${selectedFile === name ? 'fm-file-item--selected' : ''}`}
                  onClick={() => handleItemClick(name, entry)}
                >
                  <span className="fm-file-icon">{getFileIcon(name, entry.type === 'dir')}</span>
                  <span className="fm-file-name">{name}</span>
                  <span className="fm-file-type">{entry.type === 'dir' ? 'folder' : 'file'}</span>
                </button>
              ))
            )}
          </div>
          {selectedFile && (
            <div className="fm-preview">
              <div className="fm-preview-header">{selectedFile}</div>
              <pre className="fm-preview-content">{fileContent}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
