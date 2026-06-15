'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';

const CANVAS_WIDTH = 320;
const CANVAS_HEIGHT = 480;
const GRAVITY = 0.4;
const FLAP_STRENGTH = -6.5;
const PIPE_WIDTH = 52;
const PIPE_GAP = 130;
const PIPE_SPEED = 2.5;
const PIPE_INTERVAL = 1600;
const BIRD_SIZE = 20;
const GROUND_HEIGHT = 40;

interface Bird {
  y: number;
  velocity: number;
}

interface Pipe {
  x: number;
  gapY: number;
  passed: boolean;
}

interface GameState {
  bird: Bird;
  pipes: Pipe[];
  score: number;
  gameOver: boolean;
  started: boolean;
}

function initGameState(): GameState {
  return {
    bird: { y: CANVAS_HEIGHT / 2, velocity: 0 },
    pipes: [],
    score: 0,
    gameOver: false,
    started: false,
  };
}

function tick(state: GameState): GameState {
  if (state.gameOver || !state.started) return state;

  // Bird physics
  let velocity = state.bird.velocity + GRAVITY;
  let y = state.bird.y + velocity;

  // Ceiling
  if (y < BIRD_SIZE / 2) {
    y = BIRD_SIZE / 2;
    velocity = 0;
  }

  // Ground
  if (y + BIRD_SIZE / 2 >= CANVAS_HEIGHT - GROUND_HEIGHT) {
    return { ...state, bird: { y: CANVAS_HEIGHT - GROUND_HEIGHT - BIRD_SIZE / 2, velocity: 0 }, gameOver: true };
  }

  // Move pipes
  let pipes = state.pipes.map((p) => ({ ...p, x: p.x - PIPE_SPEED }));
  pipes = pipes.filter((p) => p.x + PIPE_WIDTH > -10);

  // Score
  let score = state.score;
  pipes = pipes.map((p) => {
    if (!p.passed && p.x + PIPE_WIDTH < CANVAS_WIDTH / 3) {
      score++;
      return { ...p, passed: true };
    }
    return p;
  });

  // Collision with pipes
  const birdLeft = CANVAS_WIDTH / 3 - BIRD_SIZE / 2;
  const birdRight = CANVAS_WIDTH / 3 + BIRD_SIZE / 2;
  const birdTop = y - BIRD_SIZE / 2;
  const birdBottom = y + BIRD_SIZE / 2;

  for (const pipe of pipes) {
    const pipeLeft = pipe.x;
    const pipeRight = pipe.x + PIPE_WIDTH;
    if (birdRight > pipeLeft && birdLeft < pipeRight) {
      if (birdTop < pipe.gapY || birdBottom > pipe.gapY + PIPE_GAP) {
        return { ...state, bird: { y, velocity }, pipes, score, gameOver: true };
      }
    }
  }

  return { bird: { y, velocity }, pipes, score, gameOver: false, started: true };
}

export default function FlappyBird() {
  const [gs, setGs] = useState<GameState>(initGameState);
  const gsRef = useRef(gs);
  const animRef = useRef<number | null>(null);
  const pipeTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => { gsRef.current = gs; });

  const resetGame = useCallback(() => {
    setGs(initGameState());
  }, []);

  const flap = useCallback(() => {
    const s = gsRef.current;
    if (s.gameOver) {
      resetGame();
      return;
    }
    if (!s.started) {
      setGs((prev) => ({ ...prev, started: true }));
    }
    setGs((prev) => ({
      ...prev,
      bird: { ...prev.bird, velocity: FLAP_STRENGTH },
    }));
  }, [resetGame]);

  // Game loop
  useEffect(() => {
    const loop = () => {
      setGs((prev) => tick(prev));
      animRef.current = requestAnimationFrame(loop);
    };
    animRef.current = requestAnimationFrame(loop);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, []);

  // Pipe spawner
  useEffect(() => {
    if (!gs.started || gs.gameOver) {
      if (pipeTimerRef.current) clearInterval(pipeTimerRef.current);
      return;
    }
    pipeTimerRef.current = setInterval(() => {
      setGs((prev) => {
        if (prev.gameOver || !prev.started) return prev;
        const gapY = Math.random() * (CANVAS_HEIGHT - GROUND_HEIGHT - PIPE_GAP - 80) + 40;
        return {
          ...prev,
          pipes: [...prev.pipes, { x: CANVAS_WIDTH, gapY, passed: false }],
        };
      });
    }, PIPE_INTERVAL);
    return () => {
      if (pipeTimerRef.current) clearInterval(pipeTimerRef.current);
    };
  }, [gs.started, gs.gameOver]);

  // Keyboard
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'ArrowUp') {
      e.preventDefault();
      flap();
    }
  }, [flap]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Draw
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Sky
    ctx.fillStyle = '#4dc9f6';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT - GROUND_HEIGHT);

    // Pipes
    for (const pipe of gs.pipes) {
      // Top pipe
      ctx.fillStyle = '#2d8b2d';
      ctx.fillRect(pipe.x, 0, PIPE_WIDTH, pipe.gapY);
      ctx.fillStyle = '#1a5c1a';
      ctx.fillRect(pipe.x - 4, pipe.gapY - 20, PIPE_WIDTH + 8, 20);

      // Bottom pipe
      ctx.fillStyle = '#2d8b2d';
      ctx.fillRect(pipe.x, pipe.gapY + PIPE_GAP, PIPE_WIDTH, CANVAS_HEIGHT - GROUND_HEIGHT - pipe.gapY - PIPE_GAP);
      ctx.fillStyle = '#1a5c1a';
      ctx.fillRect(pipe.x - 4, pipe.gapY + PIPE_GAP, PIPE_WIDTH + 8, 20);
    }

    // Ground
    ctx.fillStyle = '#ded895';
    ctx.fillRect(0, CANVAS_HEIGHT - GROUND_HEIGHT, CANVAS_WIDTH, GROUND_HEIGHT);
    ctx.fillStyle = '#c4a642';
    ctx.fillRect(0, CANVAS_HEIGHT - GROUND_HEIGHT, CANVAS_WIDTH, 3);

    // Bird
    const birdX = CANVAS_WIDTH / 3;
    const birdY = gs.bird.y;
    const angle = Math.min(Math.max(gs.bird.velocity * 3, -30), 90) * (Math.PI / 180);

    ctx.save();
    ctx.translate(birdX, birdY);
    ctx.rotate(angle);

    // Body
    ctx.fillStyle = '#f7dc6f';
    ctx.beginPath();
    ctx.ellipse(0, 0, BIRD_SIZE / 2, BIRD_SIZE / 2.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Eye
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(6, -4, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(7, -4, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Beak
    ctx.fillStyle = '#e67e22';
    ctx.beginPath();
    ctx.moveTo(BIRD_SIZE / 2, -2);
    ctx.lineTo(BIRD_SIZE / 2 + 8, 0);
    ctx.lineTo(BIRD_SIZE / 2, 4);
    ctx.closePath();
    ctx.fill();

    ctx.restore();

    // Score
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 32px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(String(gs.score), CANVAS_WIDTH / 2, 50);

    if (!gs.started) {
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.fillStyle = '#ffffff';
      ctx.font = '20px monospace';
      ctx.fillText('Click or Press SPACE', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
      ctx.fillText('to Flap', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 10);
    }
  }, [gs]);

  const handleCanvasClick = useCallback(() => {
    flap();
  }, [flap]);

  return (
    <div className="game-container">
      <div className="game-header">
        <span className="game-score">Score: {gs.score}</span>
        <button className="game-btn" onClick={resetGame}>New Game</button>
      </div>

      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        style={{ maxWidth: '100%', cursor: 'pointer' }}
        onClick={handleCanvasClick}
      />

      {gs.gameOver && (
        <div className="game-overlay">
          <div className="game-overlay-text">
            <div className="game-over-title">GAME OVER</div>
            <div className="game-over-score">Score: {gs.score}</div>
            <div className="game-over-hint">Press SPACE to restart</div>
          </div>
        </div>
      )}

      <div className="game-footer">
        <span>SPACE / Click to flap</span>
        <span>Don&apos;t hit the pipes!</span>
      </div>
    </div>
  );
}
