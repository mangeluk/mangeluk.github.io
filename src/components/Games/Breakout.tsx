'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';

const CANVAS_WIDTH = 480;
const CANVAS_HEIGHT = 400;
const PADDLE_WIDTH = 80;
const PADDLE_HEIGHT = 12;
const BALL_RADIUS = 6;
const BRICK_ROWS = 5;
const BRICK_COLS = 10;
const BRICK_WIDTH = 44;
const BRICK_HEIGHT = 18;
const BRICK_PADDING = 4;
const BRICK_OFFSET_TOP = 40;
const BRICK_OFFSET_LEFT = 12;

const ROW_COLORS = ['#ff4444', '#ff8844', '#ffcc00', '#44cc44', '#4488ff'];
const ROW_POINTS = [50, 40, 30, 20, 10];

interface Ball {
  x: number;
  y: number;
  dx: number;
  dy: number;
}

interface Brick {
  x: number;
  y: number;
  alive: boolean;
  points: number;
  color: string;
}

interface GameState {
  ball: Ball;
  paddleX: number;
  bricks: Brick[];
  score: number;
  lives: number;
  gameOver: boolean;
  gameWon: boolean;
  started: boolean;
}

function createBricks(): Brick[] {
  const bricks: Brick[] = [];
  for (let r = 0; r < BRICK_ROWS; r++) {
    for (let c = 0; c < BRICK_COLS; c++) {
      bricks.push({
        x: BRICK_OFFSET_LEFT + c * (BRICK_WIDTH + BRICK_PADDING),
        y: BRICK_OFFSET_TOP + r * (BRICK_HEIGHT + BRICK_PADDING),
        alive: true,
        points: ROW_POINTS[r],
        color: ROW_COLORS[r],
      });
    }
  }
  return bricks;
}

function createBall(): Ball {
  return {
    x: CANVAS_WIDTH / 2,
    y: CANVAS_HEIGHT - 40,
    dx: 3,
    dy: -3,
  };
}

function initGameState(): GameState {
  return {
    ball: createBall(),
    paddleX: (CANVAS_WIDTH - PADDLE_WIDTH) / 2,
    bricks: createBricks(),
    score: 0,
    lives: 3,
    gameOver: false,
    gameWon: false,
    started: false,
  };
}

function tick(state: GameState, paddleX: number): GameState {
  if (state.gameOver || state.gameWon || !state.started) return state;

  let { x, y, dx, dy } = state.ball;
  x += dx;
  y += dy;

  // Wall collisions
  if (x - BALL_RADIUS <= 0 || x + BALL_RADIUS >= CANVAS_WIDTH) {
    dx = -dx;
    x = Math.max(BALL_RADIUS, Math.min(CANVAS_WIDTH - BALL_RADIUS, x));
  }
  if (y - BALL_RADIUS <= 0) {
    dy = -dy;
    y = BALL_RADIUS;
  }

  // Bottom - lose life
  if (y + BALL_RADIUS >= CANVAS_HEIGHT) {
    const lives = state.lives - 1;
    if (lives <= 0) {
      return { ...state, lives: 0, gameOver: true, ball: { x, y, dx, dy } };
    }
    const ball = createBall();
    return { ...state, ball, lives, paddleX };
  }

  // Paddle collision
  const pX = paddleX;
  if (
    y + BALL_RADIUS >= CANVAS_HEIGHT - PADDLE_HEIGHT - 4 &&
    y + BALL_RADIUS <= CANVAS_HEIGHT - 4 &&
    x >= pX &&
    x <= pX + PADDLE_WIDTH
  ) {
    const hitPos = (x - pX) / PADDLE_WIDTH;
    const angle = (hitPos - 0.5) * Math.PI * 0.7;
    const speed = Math.sqrt(dx * dx + dy * dy);
    dx = speed * Math.sin(angle);
    dy = -Math.abs(speed * Math.cos(angle));
    y = CANVAS_HEIGHT - PADDLE_HEIGHT - BALL_RADIUS - 4;
  }

  // Brick collisions
  let score = state.score;
  let bricksBroken = 0;
  const bricks = state.bricks.map((brick) => {
    if (!brick.alive) return brick;
    if (
      x + BALL_RADIUS > brick.x &&
      x - BALL_RADIUS < brick.x + BRICK_WIDTH &&
      y + BALL_RADIUS > brick.y &&
      y - BALL_RADIUS < brick.y + BRICK_HEIGHT
    ) {
      score += brick.points;
      bricksBroken++;
      return { ...brick, alive: false };
    }
    return brick;
  });

  // Determine bounce direction for bricks
  if (bricksBroken > 0) {
    const ballAbove = y - BALL_RADIUS < BRICK_OFFSET_TOP + BRICK_ROWS * (BRICK_HEIGHT + BRICK_PADDING);
    const ballRight = x > CANVAS_WIDTH / 2;
    if (ballAbove || y + BALL_RADIUS < CANVAS_HEIGHT / 2) {
      dy = Math.abs(dy);
    } else if (ballRight) {
      dx = -Math.abs(dx);
    } else {
      dx = Math.abs(dx);
    }
  }

  // Speed increase based on bricks broken
  const brokenCount = BRICK_ROWS * BRICK_COLS - bricks.filter((b) => b.alive).length;
  const targetSpeed = 3 + brokenCount * 0.08;
  const currentSpeed = Math.sqrt(dx * dx + dy * dy);
  if (currentSpeed > 0) {
    const scale = targetSpeed / currentSpeed;
    dx *= scale;
    dy *= scale;
  }

  const gameWon = bricks.every((b) => !b.alive);

  return {
    ball: { x, y, dx, dy },
    paddleX,
    bricks,
    score,
    lives: state.lives,
    gameOver: false,
    gameWon,
    started: state.started,
  };
}

export default function Breakout() {
  const [gs, setGs] = useState<GameState>(initGameState);
  const gsRef = useRef(gs);
  const paddleXRef = useRef((CANVAS_WIDTH - PADDLE_WIDTH) / 2);
  const animRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => { gsRef.current = gs; });

  const resetGame = useCallback(() => {
    const fresh = initGameState();
    setGs(fresh);
    paddleXRef.current = fresh.paddleX;
  }, []);

  const startGame = useCallback(() => {
    setGs((prev) => ({ ...prev, started: true }));
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const x = (e.clientX - rect.left) * scaleX;
    paddleXRef.current = Math.max(0, Math.min(CANVAS_WIDTH - PADDLE_WIDTH, x - PADDLE_WIDTH / 2));
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const x = (e.touches[0].clientX - rect.left) * scaleX;
    paddleXRef.current = Math.max(0, Math.min(CANVAS_WIDTH - PADDLE_WIDTH, x - PADDLE_WIDTH / 2));
  }, []);

  const handleCanvasClick = useCallback(() => {
    if (!gsRef.current.started) {
      startGame();
    }
  }, [startGame]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (gsRef.current.gameOver || gsRef.current.gameWon) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        resetGame();
      }
    }
  }, [resetGame]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Game loop
  useEffect(() => {
    const loop = () => {
      setGs((prev) => tick(prev, paddleXRef.current));
      animRef.current = requestAnimationFrame(loop);
    };
    animRef.current = requestAnimationFrame(loop);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, []);

  // Draw
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Bricks
    for (const brick of gs.bricks) {
      if (!brick.alive) continue;
      ctx.fillStyle = brick.color;
      ctx.fillRect(brick.x, brick.y, BRICK_WIDTH, BRICK_HEIGHT);
    }

    // Paddle
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(gs.paddleX, CANVAS_HEIGHT - PADDLE_HEIGHT - 4, PADDLE_WIDTH, PADDLE_HEIGHT);

    // Ball
    ctx.beginPath();
    ctx.arc(gs.ball.x, gs.ball.y, BALL_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.closePath();

    if (!gs.started) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.fillStyle = '#ffffff';
      ctx.font = '20px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('Click to Start', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    }
  }, [gs]);

  return (
    <div className="game-container">
      <div className="game-header">
        <span className="game-score">Score: {gs.score}</span>
        <span className="game-controls">Lives: {gs.lives}</span>
        <button className="game-btn" onClick={resetGame}>New Game</button>
      </div>

      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        style={{ maxWidth: '100%', cursor: 'none' }}
        onMouseMove={handleMouseMove}
        onTouchMove={handleTouchMove}
        onClick={handleCanvasClick}
        onTouchStart={handleCanvasClick}
      />

      {(gs.gameOver || gs.gameWon) && (
        <div className="game-overlay">
          <div className="game-overlay-text">
            <div className="game-over-title">{gs.gameWon ? 'YOU WIN!' : 'GAME OVER'}</div>
            <div className="game-over-score">Score: {gs.score}</div>
            <div className="game-over-hint">Press ENTER to restart</div>
          </div>
        </div>
      )}

      <div className="game-footer">
        <span>Move mouse to control paddle</span>
        <span>Break all bricks to win</span>
      </div>
    </div>
  );
}
