'use client';

import React, { useState, useCallback } from 'react';

type Operation = '+' | '-' | '*' | '/' | null;

function CalcButton({ label, onClick, className = '' }: { label: string; onClick: () => void; className?: string }) {
  return (
    <button className={`calc-btn ${className}`} onClick={onClick}>{label}</button>
  );
}

export default function CalculatorApp() {
  const [display, setDisplay] = useState('0');
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [operation, setOperation] = useState<Operation>(null);
  const [resetNext, setResetNext] = useState(false);

  const handleNumber = useCallback((num: string) => {
    setDisplay((prev) => {
      if (resetNext || prev === '0') {
        setResetNext(false);
        return num;
      }
      return prev + num;
    });
  }, [resetNext]);

  const handleDecimal = useCallback(() => {
    setDisplay((prev) => {
      if (resetNext) { setResetNext(false); return '0.'; }
      if (prev.includes('.')) return prev;
      return prev + '.';
    });
  }, [resetNext]);

  const handleOperation = useCallback((op: Operation) => {
    const current = parseFloat(display);
    if (previousValue !== null && operation && !resetNext) {
      let result: number;
      switch (operation) {
        case '+': result = previousValue + current; break;
        case '-': result = previousValue - current; break;
        case '*': result = previousValue * current; break;
        case '/': result = current === 0 ? NaN : previousValue / current; break;
        default: result = current;
      }
      setDisplay(String(result));
      setPreviousValue(result);
    } else {
      setPreviousValue(current);
    }
    setOperation(op);
    setResetNext(true);
  }, [display, previousValue, operation, resetNext]);

  const handleEquals = useCallback(() => {
    if (previousValue === null || !operation) return;
    const current = parseFloat(display);
    let result: number;
    switch (operation) {
      case '+': result = previousValue + current; break;
      case '-': result = previousValue - current; break;
      case '*': result = previousValue * current; break;
      case '/': result = current === 0 ? NaN : previousValue / current; break;
      default: result = current;
    }
    setDisplay(String(result));
    setPreviousValue(null);
    setOperation(null);
    setResetNext(true);
  }, [display, previousValue, operation]);

  const handleClear = useCallback(() => {
    setDisplay('0');
    setPreviousValue(null);
    setOperation(null);
    setResetNext(false);
  }, []);

  const handlePercent = useCallback(() => {
    setDisplay(String(parseFloat(display) / 100));
  }, [display]);

  const handlePlusMinus = useCallback(() => {
    setDisplay((prev) => prev.startsWith('-') ? prev.slice(1) : '-' + prev);
  }, []);

  return (
    <div className="calc-container">
      <div className="calc-display">{display}</div>
      <div className="calc-grid">
        <CalcButton label="C" onClick={handleClear} className="calc-func" />
        <CalcButton label="+/-" onClick={handlePlusMinus} className="calc-func" />
        <CalcButton label="%" onClick={handlePercent} className="calc-func" />
        <CalcButton label="/" onClick={() => handleOperation('/')} className="calc-op" />

        <CalcButton label="7" onClick={() => handleNumber('7')} />
        <CalcButton label="8" onClick={() => handleNumber('8')} />
        <CalcButton label="9" onClick={() => handleNumber('9')} />
        <CalcButton label="*" onClick={() => handleOperation('*')} className="calc-op" />

        <CalcButton label="4" onClick={() => handleNumber('4')} />
        <CalcButton label="5" onClick={() => handleNumber('5')} />
        <CalcButton label="6" onClick={() => handleNumber('6')} />
        <CalcButton label="-" onClick={() => handleOperation('-')} className="calc-op" />

        <CalcButton label="1" onClick={() => handleNumber('1')} />
        <CalcButton label="2" onClick={() => handleNumber('2')} />
        <CalcButton label="3" onClick={() => handleNumber('3')} />
        <CalcButton label="+" onClick={() => handleOperation('+')} className="calc-op" />

        <CalcButton label="0" onClick={() => handleNumber('0')} className="calc-zero" />
        <CalcButton label="." onClick={handleDecimal} />
        <CalcButton label="=" onClick={handleEquals} className="calc-equals" />
      </div>
    </div>
  );
}
