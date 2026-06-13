'use client';

// src/components/Terminal/InputLine.tsx
// Input field with blinking cursor, keyboard navigation, and autocomplete.
// Requirements: 1.1, 1.4, 19.4, 22.1

import React, { useRef, useEffect, forwardRef, useState } from 'react';
import { getAvailableCommands } from '@/lib/commands/index';

interface InputLineProps {
  value: string;
  onChange: (val: string) => void;
  onSubmit: (val: string) => void;
  onArrowUp: () => void;
  onArrowDown: () => void;
  disabled: boolean;
  prompt: string;
}

const InputLine = forwardRef<HTMLInputElement, InputLineProps>(function InputLine(
  { value, onChange, onSubmit, onArrowUp, onArrowDown, disabled, prompt },
  ref
) {
  const localRef = useRef<HTMLInputElement>(null);
  const inputRef = (ref as React.RefObject<HTMLInputElement>) ?? localRef;
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);

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

    const matches = commands.filter(cmd => cmd.startsWith(trimmedValue));
    setSuggestions(matches);
    setSelectedIndex(-1);
  }, [value]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
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
      setSuggestions([]);
      setSelectedIndex(-1);
    }
  }

  function handleAutocomplete() {
    const commands = getAvailableCommands();
    const trimmedValue = value.trim().toLowerCase();
    if (trimmedValue === '') return;

    if (selectedIndex >= 0 && suggestions[selectedIndex]) {
      onChange(suggestions[selectedIndex]);
      setSuggestions([]);
      setSelectedIndex(-1);
      return;
    }

    const matches = commands.filter(cmd => cmd.startsWith(trimmedValue));
    if (matches.length === 0) return;

    if (matches.length === 1) {
      onChange(matches[0]);
      setSuggestions([]);
    } else {
      let prefix = matches[0];
      for (let i = 1; i < matches.length; i++) {
        while (!matches[i].startsWith(prefix)) {
          prefix = prefix.slice(0, -1);
        }
        if (prefix === '') break;
      }
      if (prefix.length > trimmedValue.length) {
        onChange(prefix);
      }
    }
  }

  return (
    <div className="w-full">
      <div className="flex items-center gap-2 py-1">
        {/* Prompt */}
        <span
          style={{ color: 'var(--text-secondary)', whiteSpace: 'nowrap', userSelect: 'none' }}
          aria-hidden="true"
        >
          {prompt}
        </span>

        {/* Input */}
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
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
