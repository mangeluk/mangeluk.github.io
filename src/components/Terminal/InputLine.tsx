'use client';

// src/components/Terminal/InputLine.tsx
// Input field with blinking cursor, keyboard navigation, and autocomplete.
// Requirements: 1.1, 1.4, 19.4, 22.1

import React, { useRef, useEffect, forwardRef, useState } from 'react';
import { getAvailableCommands } from '@/lib/commands/index';
import { resolvePath, listDir } from '@/lib/commands/filesystem';

interface InputLineProps {
  value: string;
  onChange: (val: string) => void;
  onSubmit: (val: string) => void;
  onArrowUp: () => void;
  onArrowDown: () => void;
  disabled: boolean;
  prompt: string;
  commandHistory?: string[];
}

const InputLine = forwardRef<HTMLInputElement, InputLineProps>(function InputLine(
  { value, onChange, onSubmit, onArrowUp, onArrowDown, disabled, prompt, commandHistory = [] },
  ref
) {
  const localRef = useRef<HTMLInputElement>(null);
  const inputRef = (ref as React.RefObject<HTMLInputElement>) ?? localRef;
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [reverseSearch, setReverseSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchIndex, setSearchIndex] = useState(-1);
  const [savedValue, setSavedValue] = useState('');

  // Auto-focus on mount (Req. 1.1)
  useEffect(() => {
    inputRef.current?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update suggestions when input changes
  useEffect(() => {
    const commands = getAvailableCommands();
    const trimmedValue = value.trim().toLowerCase();
    if (trimmedValue === '') {
      setSuggestions([]);
      setSelectedIndex(-1);
      return;
    }

    // Collect matches from commands and history, remove duplicates
    const commandMatches = commands.filter(cmd => cmd.startsWith(trimmedValue));
    const historyMatches = commandHistory.filter(cmd => 
      cmd.toLowerCase().startsWith(trimmedValue) && !commandMatches.includes(cmd)
    );

    // Combine and deduplicate
    const allMatches = [...new Set([...commandMatches, ...historyMatches])];
    setSuggestions(allMatches);
    setSelectedIndex(-1);
  }, [value, commandHistory]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    // Ctrl+C — cancel current input (like real terminal)
    if (e.key === 'c' && e.ctrlKey) {
      e.preventDefault();
      if (value) {
        // Show the cancelled input in history then clear
        onSubmit(`^C`);
        onChange('');
      }
      return;
    }

    // Ctrl+L — clear screen
    if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault();
      onSubmit('clear');
      onChange('');
      return;
    }

    // Ctrl+D — exit/end of input
    if (e.key === 'd' && e.ctrlKey) {
      e.preventDefault();
      onSubmit('exit');
      return;
    }

    // Ctrl+U — clear line
    if (e.key === 'u' && e.ctrlKey) {
      e.preventDefault();
      onChange('');
      return;
    }

    // Ctrl+W — delete previous word
    if (e.key === 'w' && e.ctrlKey) {
      e.preventDefault();
      const val = inputRef.current?.value || '';
      const pos = inputRef.current?.selectionStart || val.length;
      const before = val.substring(0, pos);
      const after = val.substring(pos);
      const newBefore = before.replace(/\S+\s*$/, '');
      const newVal = newBefore + after;
      onChange(newVal);
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.selectionStart = inputRef.current.selectionEnd = newBefore.length;
        }
      }, 0);
      return;
    }

    // Ctrl+K — delete to end of line
    if (e.key === 'k' && e.ctrlKey) {
      e.preventDefault();
      const val = inputRef.current?.value || '';
      const pos = inputRef.current?.selectionStart || val.length;
      onChange(val.substring(0, pos));
      return;
    }

    // Ctrl+R — reverse history search
    if (e.key === 'r' && e.ctrlKey) {
      e.preventDefault();
      if (reverseSearch) {
        // Find next match going further back
        findNextSearchMatch(searchQuery, searchIndex + 1);
      } else {
        setSavedValue(value);
        setReverseSearch(true);
        setSearchQuery('');
        setSearchIndex(-1);
      }
      return;
    }

    // Ctrl+A — move to beginning (Home)
    if (e.key === 'a' && e.ctrlKey) {
      e.preventDefault();
      inputRef.current?.setSelectionRange(0, 0);
      return;
    }

    // Ctrl+E — move to end (End)
    if (e.key === 'e' && e.ctrlKey) {
      e.preventDefault();
      const len = inputRef.current?.value.length || 0;
      inputRef.current?.setSelectionRange(len, len);
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      if (reverseSearch) {
        setReverseSearch(false);
        setSearchQuery('');
        setSearchIndex(-1);
        if (value) {
          onSubmit(value);
        }
        return;
      }
      if (selectedIndex >= 0 && suggestions[selectedIndex]) {
        onChange(suggestions[selectedIndex]);
        setSuggestions([]);
        setSelectedIndex(-1);
      } else {
        onSubmit(value);
        setSuggestions([]);
        setSelectedIndex(-1);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (suggestions.length > 0) {
        setSelectedIndex(prev => prev === 0 ? suggestions.length - 1 : prev - 1);
      } else {
        onArrowUp();
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (suggestions.length > 0) {
        setSelectedIndex(prev => prev === suggestions.length - 1 ? 0 : prev + 1);
      } else {
        onArrowDown();
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      handleAutocomplete();
    } else if (e.key === 'Escape') {
      if (reverseSearch) {
        setReverseSearch(false);
        setSearchQuery('');
        setSearchIndex(-1);
        onChange(savedValue);
        return;
      }
      setSuggestions([]);
      setSelectedIndex(-1);
    }
  }

  function findNextSearchMatch(query: string, startIdx: number) {
    if (!query) return;
    const lowerQuery = query.toLowerCase();
    for (let i = startIdx; i < commandHistory.length; i++) {
      if (commandHistory[i].toLowerCase().includes(lowerQuery)) {
        setSearchIndex(i);
        onChange(commandHistory[i]);
        return;
      }
    }
    // No more matches — keep current state
  }

  function handleAutocomplete() {
    const commands = getAvailableCommands();
    const trimmedValue = value.trim();
    if (trimmedValue === '') return;

    // If a suggestion is selected, use it
    if (selectedIndex >= 0 && suggestions[selectedIndex]) {
      onChange(suggestions[selectedIndex]);
      setSuggestions([]);
      setSelectedIndex(-1);
      return;
    }

    // Split input into parts to detect if we're completing a path
    const parts = trimmedValue.split(' ');
    const isFirstWord = parts.length <= 1;

    if (isFirstWord) {
      // Command completion
      const cmdLower = trimmedValue.toLowerCase();
      const matches = commands.filter(cmd => cmd.startsWith(cmdLower));
      if (matches.length === 0) return;

      if (matches.length === 1) {
        onChange(matches[0] + ' ');
        setSuggestions([]);
      } else {
        let prefix = matches[0];
        for (let i = 1; i < matches.length; i++) {
          while (!matches[i].startsWith(prefix)) {
            prefix = prefix.slice(0, -1);
          }
          if (prefix === '') break;
        }
        if (prefix.length > cmdLower.length) {
          onChange(prefix);
        }
      }
    } else {
      // Path completion
      const currentDir = '~';
      const pathPart = parts[parts.length - 1];
      const dirSeparator = pathPart.lastIndexOf('/');
      let dirPath: string;
      let prefix: string;

      if (dirSeparator >= 0) {
        dirPath = resolvePath(pathPart.slice(0, dirSeparator + 1) || '~', currentDir);
        prefix = pathPart.slice(dirSeparator + 1);
      } else {
        dirPath = currentDir;
        prefix = pathPart;
      }

      const entries = listDir(dirPath);
      const matches = entries.filter(e => e.toLowerCase().startsWith(prefix.toLowerCase()));

      if (matches.length === 0) return;

      if (matches.length === 1) {
        const completed = matches[0];
        const newParts = [...parts.slice(0, -1)];
        if (dirSeparator >= 0) {
          newParts.push(pathPart.slice(0, dirSeparator + 1) + completed);
        } else {
          newParts.push(completed);
        }
        onChange(newParts.join(' '));
        setSuggestions([]);
      } else {
        // Find common prefix
        let commonPrefix = matches[0];
        for (let i = 1; i < matches.length; i++) {
          while (!matches[i].startsWith(commonPrefix)) {
            commonPrefix = commonPrefix.slice(0, -1);
          }
          if (commonPrefix === '') break;
        }
        if (commonPrefix.length > prefix.length) {
          const newParts = [...parts.slice(0, -1)];
          if (dirSeparator >= 0) {
            newParts.push(pathPart.slice(0, dirSeparator + 1) + commonPrefix);
          } else {
            newParts.push(commonPrefix);
          }
          onChange(newParts.join(' '));
        }
      }
    }
  }

  return (
    <div className="w-full">
      <div className="flex items-center gap-2 py-1">
        {/* Prompt with colored segments */}
        {reverseSearch ? (
          <span
            style={{ whiteSpace: 'nowrap', userSelect: 'none' }}
            aria-hidden="true"
          >
            <span style={{ color: 'var(--text-secondary)' }}>(reverse-i-search)&apos;{searchQuery}&apos;: </span>
          </span>
        ) : (
          <span
            style={{ whiteSpace: 'nowrap', userSelect: 'none' }}
            aria-hidden="true"
          >
            <span style={{ color: 'var(--prompt-user)' }}>visitor@portfolio</span>
            <span style={{ color: 'var(--text-secondary)' }}>:</span>
          <span style={{ color: 'var(--prompt-path)' }}>{prompt.split(':')[1]?.replace(' $', '') || '~'}</span>
          <span style={{ color: 'var(--text-secondary)' }}>$ </span>
          </span>
        )}

        {/* Input */}
        <input
          ref={inputRef}
          type="text"
          value={reverseSearch ? (commandHistory[searchIndex] || '') : value}
          onChange={(e) => {
            if (reverseSearch) {
              const newQuery = e.target.value;
              setSearchQuery(newQuery);
              // Search from beginning
              for (let i = 0; i < commandHistory.length; i++) {
                if (commandHistory[i].toLowerCase().includes(newQuery.toLowerCase())) {
                  setSearchIndex(i);
                  onChange(commandHistory[i]);
                  return;
                }
              }
              // No match found
              setSearchIndex(-1);
              onChange('');
            } else {
              onChange(e.target.value);
            }
          }}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          aria-label="Entrada de comandos de la terminal"
          className="bg-transparent border-none outline-none flex-1"
          style={{
            color: 'var(--text-input)',
            fontFamily: 'inherit',
            fontSize: 'max(14px, 1em)',
            caretColor: 'var(--cursor)',
          }}
        />
      </div>

      {/* Suggestions dropdown */}
      {suggestions.length > 0 && (
        <div
          className="mt-1 p-1 rounded"
          style={{
            backgroundColor: 'var(--bg-terminal)',
            border: '1px solid var(--text-secondary)',
            maxHeight: '150px',
            overflowY: 'auto',
          }}
        >
          {suggestions.map((suggestion, index) => (
            <div
              key={suggestion}
              className="px-2 py-1 cursor-pointer rounded"
              style={{
                backgroundColor: index === selectedIndex ? 'var(--text-secondary)' : 'transparent',
                color: index === selectedIndex ? 'var(--bg-terminal)' : 'var(--text-primary)',
              }}
              onClick={() => {
                onChange(suggestion);
                setSuggestions([]);
                setSelectedIndex(-1);
                inputRef.current?.focus();
              }}
            >
              {suggestion}
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

export default InputLine;
