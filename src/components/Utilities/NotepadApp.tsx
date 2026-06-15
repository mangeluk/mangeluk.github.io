'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';

export default function NotepadApp() {
  const [content, setContent] = useState('');
  const [fileName, setFileName] = useState('untitled.txt');
  const [isEditingName, setIsEditingName] = useState(false);
  const [wordWrap, setWordWrap] = useState(true);
  const [saved, setSaved] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const lineCount = content.split('\n').length;

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    setSaved(false);
  }, []);

  const handleSave = useCallback(() => {
    try {
      localStorage.setItem(`notepad-${fileName}`, content);
      setSaved(true);
    } catch {}
  }, [content, fileName]);

  const handleNew = useCallback(() => {
    setContent('');
    setFileName('untitled.txt');
    setSaved(true);
  }, []);

  const handleDownload = useCallback(() => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  }, [content, fileName]);

  const handleNameSubmit = useCallback(() => {
    setIsEditingName(false);
    if (!fileName.trim()) setFileName('untitled.txt');
  }, [fileName]);

  useEffect(() => {
    if (isEditingName && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [isEditingName]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); handleSave(); }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleSave]);

  return (
    <div className="notepad-container">
      <div className="notepad-toolbar">
        <button className="notepad-btn" onClick={handleNew} title="New">New</button>
        <button className="notepad-btn" onClick={handleSave} title="Save (Ctrl+S)">Save</button>
        <button className="notepad-btn" onClick={handleDownload} title="Download">Download</button>
        <div className="notepad-spacer" />
        <label className="notepad-toggle">
          <input type="checkbox" checked={wordWrap} onChange={(e) => setWordWrap(e.target.checked)} />
          Wrap
        </label>
      </div>
      <div className="notepad-filename" onClick={() => setIsEditingName(true)}>
        {isEditingName ? (
          <input
            ref={nameInputRef}
            className="notepad-filename-input"
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
            onBlur={handleNameSubmit}
            onKeyDown={(e) => { if (e.key === 'Enter') handleNameSubmit(); }}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span>{fileName}{!saved ? ' *' : ''}</span>
        )}
      </div>
      <div className="notepad-editor">
        <div className="notepad-line-numbers">
          {Array.from({ length: lineCount }, (_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>
        <textarea
          ref={textareaRef}
          className="notepad-textarea"
          value={content}
          onChange={handleChange}
          wrap={wordWrap ? 'soft' : 'off'}
          spellCheck={false}
          placeholder="Start typing..."
        />
      </div>
    </div>
  );
}
