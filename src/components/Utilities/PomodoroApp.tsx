'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';

type TimerMode = 'work' | 'shortBreak' | 'longBreak';

interface TimerConfig {
  work: number;
  shortBreak: number;
  longBreak: number;
}

const CONFIG: TimerConfig = { work: 25 * 60, shortBreak: 5 * 60, longBreak: 15 * 60 };
const MODE_LABELS: Record<TimerMode, string> = { work: 'Work', shortBreak: 'Short Break', longBreak: 'Long Break' };
const MODE_COLORS: Record<TimerMode, string> = { work: '#00ff9f', shortBreak: '#8be9fd', longBreak: '#bd93f9' };
const RADIUS = 54;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  return audioCtx;
}

function playBeep(): void {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 800;
    osc.type = 'sine';
    gain.gain.value = 0.3;
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc.stop(ctx.currentTime + 0.5);
  } catch {
    // Audio not available
  }
}

export default function PomodoroApp() {
  const [mode, setMode] = useState<TimerMode>('work');
  const [timeLeft, setTimeLeft] = useState(CONFIG.work);
  const [running, setRunning] = useState(false);
  const [sessions, setSessions] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const totalTime = CONFIG[mode];
  const progress = 1 - timeLeft / totalTime;
  const strokeDashoffset = CIRCUMFERENCE * (1 - progress);

  const switchMode = useCallback((newMode: TimerMode) => {
    setMode(newMode);
    setTimeLeft(CONFIG[newMode]);
    setRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  const handleToggle = useCallback(() => {
    setRunning((prev) => !prev);
  }, []);

  const handleReset = useCallback(() => {
    setRunning(false);
    setTimeLeft(CONFIG[mode]);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, [mode]);

  useEffect(() => {
    if (!running) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          playBeep();
          if (mode === 'work') {
            setSessions((s) => {
              const newSessions = s + 1;
              if (newSessions % 4 === 0) {
                setMode('longBreak');
                setTimeLeft(CONFIG.longBreak);
              } else {
                setMode('shortBreak');
                setTimeLeft(CONFIG.shortBreak);
              }
              return newSessions;
            });
          } else {
            setMode('work');
            setTimeLeft(CONFIG.work);
          }
          setRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running, mode]);

  return (
    <div className="pomo-container">
      <div className="pomo-modes">
        {(Object.keys(CONFIG) as TimerMode[]).map((m) => (
          <button
            key={m}
            className={`pomo-mode-btn ${mode === m ? 'pomo-mode-btn--active' : ''}`}
            onClick={() => switchMode(m)}
            style={mode === m ? { color: MODE_COLORS[m], borderColor: MODE_COLORS[m] } : undefined}
          >
            {MODE_LABELS[m]}
          </button>
        ))}
      </div>

      <div className="pomo-ring-wrapper">
        <svg width="140" height="140" viewBox="0 0 120 120">
          <circle
            cx="60"
            cy="60"
            r={RADIUS}
            fill="none"
            stroke="#16213e"
            strokeWidth="6"
          />
          <circle
            cx="60"
            cy="60"
            r={RADIUS}
            fill="none"
            stroke={MODE_COLORS[mode]}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={strokeDashoffset}
            transform="rotate(-90 60 60)"
            style={{ transition: 'stroke-dashoffset 0.5s ease' }}
          />
        </svg>
        <div className="pomo-time-display">
          <span className="pomo-time-text">{formatTime(timeLeft)}</span>
          <span className="pomo-mode-label" style={{ color: MODE_COLORS[mode] }}>{MODE_LABELS[mode]}</span>
        </div>
      </div>

      <div className="pomo-controls">
        <button className="pomo-ctrl-btn" onClick={handleReset}>&#8634;</button>
        <button
          className="pomo-ctrl-btn pomo-ctrl-btn--main"
          onClick={handleToggle}
          style={{ background: MODE_COLORS[mode] }}
        >
          {running ? '\u23F8' : '\u25B6'}
        </button>
        <button className="pomo-ctrl-btn" onClick={() => switchMode(mode)}>&#8635;</button>
      </div>

      <div className="pomo-sessions">
        <span className="pomo-sessions-label">Sessions</span>
        <div className="pomo-sessions-dots">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`pomo-session-dot ${i < sessions % 4 ? 'pomo-session-dot--filled' : ''}`}
              style={i < sessions % 4 ? { background: MODE_COLORS[mode] } : undefined}
            />
          ))}
        </div>
        <span className="pomo-sessions-count">{sessions} completed</span>
      </div>
    </div>
  );
}
