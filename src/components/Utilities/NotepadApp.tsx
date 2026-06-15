'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';

export default function NotepadApp() {
  const [content, setContent] = useState('');
  const [fileName, setFileName] = useState('untitled.txt');
  const [isEditingName, setIsEditingName] = useState(false);
  const [wordWrap, setWordWrap] = useState(true);
  const [saved, setSaved] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);
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

  const handleExportPdf = useCallback(() => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${fileName}</title>
  <style>
    body {
      font-family: 'Courier New', Courier, monospace;
      margin: 2.5cm;
      white-space: pre-wrap;
      word-wrap: break-word;
      font-size: 12px;
      line-height: 1.5;
      color: #000;
    }
  </style>
</head>
<body>${content.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</body>
</html>`);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  }, [content, fileName]);

  const handleNameSubmit = useCallback(() => {
    setIsEditingName(false);
    if (!fileName.trim()) setFileName('untitled.txt');
  }, [fileName]);

  const handleScroll = useCallback(() => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  }, []);

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
        <button className="notepad-btn" onClick={handleExportPdf} title="Export PDF">Export PDF</button>
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
        <div className="notepad-line-numbers" ref={lineNumbersRef}>
          {Array.from({ length: lineCount }, (_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>
        <textarea
          ref={textareaRef}
          className="notepad-textarea"
          value={content}
          onChange={handleChange}
          onScroll={handleScroll}
          wrap={wordWrap ? 'soft' : 'off'}
          spellCheck={false}
          placeholder="Start typing..."
        />
      </div>
    </div>
  );
}
