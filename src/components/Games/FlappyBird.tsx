'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';

const CANVAS_WIDTH = 320;
const CANVAS_HEIGHT = 480;
const GRAVITY = 0.15;
const FLAP_STRENGTH = -4.5;
const PIPE_WIDTH = 52;
const PIPE_GAP = 150;
const PIPE_SPEED = 1.5;
const PIPE_INTERVAL = 2000;
const BIRD_SIZE = 24;
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

  let velocity = state.bird.velocity + GRAVITY;
  let y = state.bird.y + velocity;

  if (y < BIRD_SIZE / 2) {
    y = BIRD_SIZE / 2;
    velocity = 0;
  }

  if (y + BIRD_SIZE / 2 >= CANVAS_HEIGHT - GROUND_HEIGHT) {
    return { ...state, bird: { y: CANVAS_HEIGHT - GROUND_HEIGHT - BIRD_SIZE / 2, velocity: 0 }, gameOver: true };
  }

  let pipes = state.pipes.map((p) => ({ ...p, x: p.x - PIPE_SPEED }));
  pipes = pipes.filter((p) => p.x + PIPE_WIDTH > -10);

  let score = state.score;
  pipes = pipes.map((p) => {
    if (!p.passed && p.x + PIPE_WIDTH < CANVAS_WIDTH / 3) {
      score++;
      return { ...p, passed: true };
    }
    return p;
  });

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

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Sky gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT - GROUND_HEIGHT);
    skyGrad.addColorStop(0, '#70c5ce');
    skyGrad.addColorStop(1, '#87ceeb');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT - GROUND_HEIGHT);

    // Clouds
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    const cloudY = [60, 120, 200];
    for (let i = 0; i < 3; i++) {
      const cx = ((Date.now() / 40 + i * 130) % (CANVAS_WIDTH + 80)) - 40;
      ctx.beginPath();
      ctx.arc(cx, cloudY[i], 20, 0, Math.PI * 2);
      ctx.arc(cx + 15, cloudY[i] - 8, 16, 0, Math.PI * 2);
      ctx.arc(cx + 30, cloudY[i], 18, 0, Math.PI * 2);
      ctx.fill();
    }

    // Pipes with gradient and caps
    for (const pipe of gs.pipes) {
      const topH = pipe.gapY;
      const botY = pipe.gapY + PIPE_GAP;
      const botH = CANVAS_HEIGHT - GROUND_HEIGHT - botY;

      // Top pipe body
      const topGrad = ctx.createLinearGradient(pipe.x, 0, pipe.x + PIPE_WIDTH, 0);
      topGrad.addColorStop(0, '#5cb85c');
      topGrad.addColorStop(0.3, '#73d873');
      topGrad.addColorStop(0.7, '#5cb85c');
      topGrad.addColorStop(1, '#4a9a4a');
      ctx.fillStyle = topGrad;
      ctx.fillRect(pipe.x, 0, PIPE_WIDTH, topH);

      // Top pipe cap
      ctx.fillStyle = '#4a9a4a';
      ctx.fillRect(pipe.x - 4, topH - 24, PIPE_WIDTH + 8, 24);
      ctx.fillStyle = '#5cb85c';
      ctx.fillRect(pipe.x - 2, topH - 22, PIPE_WIDTH + 4, 20);

      // Bottom pipe body
      const botGrad = ctx.createLinearGradient(pipe.x, 0, pipe.x + PIPE_WIDTH, 0);
      botGrad.addColorStop(0, '#5cb85c');
      botGrad.addColorStop(0.3, '#73d873');
      botGrad.addColorStop(0.7, '#5cb85c');
      botGrad.addColorStop(1, '#4a9a4a');
      ctx.fillStyle = botGrad;
      ctx.fillRect(pipe.x, botY, PIPE_WIDTH, botH);

      // Bottom pipe cap
      ctx.fillStyle = '#4a9a4a';
      ctx.fillRect(pipe.x - 4, botY, PIPE_WIDTH + 8, 24);
      ctx.fillStyle = '#5cb85c';
      ctx.fillRect(pipe.x - 2, botY + 2, PIPE_WIDTH + 4, 20);
    }

    // Ground with grass
    const groundGrad = ctx.createLinearGradient(0, CANVAS_HEIGHT - GROUND_HEIGHT, 0, CANVAS_HEIGHT);
    groundGrad.addColorStop(0, '#8B4513');
    groundGrad.addColorStop(0.15, '#8B4513');
    groundGrad.addColorStop(0.15, '#228B22');
    groundGrad.addColorStop(0.3, '#228B22');
    groundGrad.addColorStop(0.3, '#8B4513');
    groundGrad.addColorStop(1, '#654321');
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, CANVAS_HEIGHT - GROUND_HEIGHT, CANVAS_WIDTH, GROUND_HEIGHT);

    // Bird
    const birdX = CANVAS_WIDTH / 3;
    const birdY = gs.bird.y;
    const angle = Math.min(Math.max(gs.bird.velocity * 4, -30), 90) * (Math.PI / 180);

    ctx.save();
    ctx.translate(birdX, birdY);
    ctx.rotate(angle);

    // Body shadow
    ctx.fillStyle = '#d4a017';
    ctx.beginPath();
    ctx.ellipse(1, 2, BIRD_SIZE / 2, BIRD_SIZE / 2.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Body
    ctx.fillStyle = '#f7dc6f';
    ctx.beginPath();
    ctx.ellipse(0, 0, BIRD_SIZE / 2, BIRD_SIZE / 2.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Belly
    ctx.fillStyle = '#fdebd0';
    ctx.beginPath();
    ctx.ellipse(-2, 3, BIRD_SIZE / 3.5, BIRD_SIZE / 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Wing
    ctx.fillStyle = '#e6b800';
    ctx.beginPath();
    ctx.ellipse(-4, -2, 8, 5, -0.3, 0, Math.PI * 2);
    ctx.fill();

    // Eye white
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(7, -4, 6, 0, Math.PI * 2);
    ctx.fill();

    // Eye pupil
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(8, -4, 3, 0, Math.PI * 2);
    ctx.fill();

    // Eye highlight
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(9, -5, 1.2, 0, Math.PI * 2);
    ctx.fill();

    // Beak
    ctx.fillStyle = '#e67e22';
    ctx.beginPath();
    ctx.moveTo(BIRD_SIZE / 2 - 2, -2);
    ctx.lineTo(BIRD_SIZE / 2 + 10, 0);
    ctx.lineTo(BIRD_SIZE / 2 - 2, 4);
    ctx.closePath();
    ctx.fill();

    ctx.restore();

    // Score with outline
    ctx.textAlign = 'center';
    ctx.font = 'bold 36px monospace';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 4;
    ctx.strokeText(String(gs.score), CANVAS_WIDTH / 2, 55);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(String(gs.score), CANVAS_WIDTH / 2, 55);

    if (!gs.started) {
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 22px monospace';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3;
      ctx.strokeText('TAP or SPACE', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 15);
      ctx.fillText('TAP or SPACE', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 15);
      ctx.font = '16px monospace';
      ctx.strokeText('to start', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 15);
      ctx.fillText('to start', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 15);
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
        style={{ maxWidth: '100%', cursor: 'pointer', borderRadius: 8 }}
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
