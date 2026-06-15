'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';

const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 400;
const PADDLE_WIDTH = 12;
const PADDLE_HEIGHT = 80;
const BALL_SIZE = 10;
const PADDLE_SPEED = 6;
const BALL_SPEED_INITIAL = 5;
const BALL_SPEED_MAX = BALL_SPEED_INITIAL * 2;
const AI_SPEED_MAP = { easy: 2, medium: 4, hard: 6 } as const;
type Difficulty = keyof typeof AI_SPEED_MAP;

function loadHighScore(): number {
  try { return parseInt(localStorage.getItem('pong-highscore') || '0', 10); } catch { return 0; }
}

function saveHighScore(score: number) {
  try { localStorage.setItem('pong-highscore', String(score)); } catch {}
}

export default function PongGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState({ player: 0, ai: 0 });
  const [highScore, setHighScore] = useState(loadHighScore);
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'paused' | 'gameover'>('idle');
  const [winner, setWinner] = useState<'player' | 'ai' | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');

  const gameStateRef = useRef({
    playerY: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2,
    aiY: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2,
    ballX: CANVAS_WIDTH / 2,
    ballY: CANVAS_HEIGHT / 2,
    ballVx: BALL_SPEED_INITIAL,
    ballVy: BALL_SPEED_INITIAL,
    score: { player: 0, ai: 0 },
  });

  const keysRef = useRef<Set<string>>(new Set());
  const animRef = useRef<number | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const gameLoopRef = useRef<(() => void) | null>(null);

  const resetBall = useCallback(() => {
    const gs = gameStateRef.current;
    gs.ballX = CANVAS_WIDTH / 2;
    gs.ballY = CANVAS_HEIGHT / 2;
    const angle = (Math.random() - 0.5) * Math.PI / 3;
    const dir = Math.random() > 0.5 ? 1 : -1;
    gs.ballVx = Math.cos(angle) * BALL_SPEED_INITIAL * dir;
    gs.ballVy = Math.sin(angle) * BALL_SPEED_INITIAL;
  }, []);

  const resetGame = useCallback(() => {
    const gs = gameStateRef.current;
    gs.playerY = CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2;
    gs.aiY = CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2;
    gs.score = { player: 0, ai: 0 };
    setScore({ player: 0, ai: 0 });
    setWinner(null);
    resetBall();
    setGameState('playing');
  }, [resetBall]);

  const gameLoop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const gs = gameStateRef.current;

    // Player movement
    if (keysRef.current.has('ArrowUp') || keysRef.current.has('w')) {
      gs.playerY = Math.max(0, gs.playerY - PADDLE_SPEED);
    }
    if (keysRef.current.has('ArrowDown') || keysRef.current.has('s')) {
      gs.playerY = Math.min(CANVAS_HEIGHT - PADDLE_HEIGHT, gs.playerY + PADDLE_SPEED);
    }

    // AI movement
    const aiSpeed = AI_SPEED_MAP[difficulty];
    const aiCenter = gs.aiY + PADDLE_HEIGHT / 2;
    if (aiCenter < gs.ballY - 10) {
      gs.aiY = Math.min(CANVAS_HEIGHT - PADDLE_HEIGHT, gs.aiY + aiSpeed);
    } else if (aiCenter > gs.ballY + 10) {
      gs.aiY = Math.max(0, gs.aiY - aiSpeed);
    }

    // Ball movement
    gs.ballX += gs.ballVx;
    gs.ballY += gs.ballVy;

    // Top/bottom bounce
    if (gs.ballY <= 0 || gs.ballY >= CANVAS_HEIGHT - BALL_SIZE) {
      gs.ballVy = -gs.ballVy;
      gs.ballY = Math.max(0, Math.min(CANVAS_HEIGHT - BALL_SIZE, gs.ballY));
    }

    // Paddle collision (player - left)
    if (
      gs.ballX <= PADDLE_WIDTH + 10 &&
      gs.ballY + BALL_SIZE >= gs.playerY &&
      gs.ballY <= gs.playerY + PADDLE_HEIGHT &&
      gs.ballVx < 0
    ) {
      gs.ballVx = Math.min(BALL_SPEED_MAX, Math.abs(gs.ballVx * 1.05)) * (gs.ballVx > 0 ? -1 : 1);
      const hitPos = (gs.ballY - gs.playerY) / PADDLE_HEIGHT;
      gs.ballVy = (hitPos - 0.5) * 8;
    }

    // Paddle collision (AI - right)
    if (
      gs.ballX >= CANVAS_WIDTH - PADDLE_WIDTH - 10 - BALL_SIZE &&
      gs.ballY + BALL_SIZE >= gs.aiY &&
      gs.ballY <= gs.aiY + PADDLE_HEIGHT &&
      gs.ballVx > 0
    ) {
      gs.ballVx = -Math.min(BALL_SPEED_MAX, Math.abs(gs.ballVx * 1.05));
      const hitPos = (gs.ballY - gs.aiY) / PADDLE_HEIGHT;
      gs.ballVy = (hitPos - 0.5) * 8;
    }

    // Score
    if (gs.ballX < 0) {
      gs.score.ai++;
      setScore({ ...gs.score });
      if (gs.score.ai >= 5) {
        setWinner('ai');
        setGameState('gameover');
        return;
      }
      resetBall();
    }
    if (gs.ballX > CANVAS_WIDTH) {
      gs.score.player++;
      setScore({ ...gs.score });
      if (gs.score.player >= 5) {
        setWinner('player');
        setGameState('gameover');
        return;
      }
      resetBall();
    }

    // Draw
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Center line
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(CANVAS_WIDTH / 2, 0);
    ctx.lineTo(CANVAS_WIDTH / 2, CANVAS_HEIGHT);
    ctx.stroke();
    ctx.setLineDash([]);

    // Paddles
    ctx.fillStyle = '#00ff9f';
    ctx.fillRect(10, gs.playerY, PADDLE_WIDTH, PADDLE_HEIGHT);
    ctx.fillStyle = '#ff5555';
    ctx.fillRect(CANVAS_WIDTH - PADDLE_WIDTH - 10, gs.aiY, PADDLE_WIDTH, PADDLE_HEIGHT);

    // Ball
    ctx.fillStyle = '#fff';
    ctx.fillRect(gs.ballX, gs.ballY, BALL_SIZE, BALL_SIZE);

    // Scores
    ctx.fillStyle = '#00ff9f';
    ctx.font = '32px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(String(gs.score.player), CANVAS_WIDTH / 4, 40);
    ctx.fillStyle = '#ff5555';
    ctx.fillText(String(gs.score.ai), (CANVAS_WIDTH * 3) / 4, 40);

    if (mountedRef.current) {
      animRef.current = requestAnimationFrame(gameLoopRef.current!);
    }
  }, [resetBall, difficulty]);

  useEffect(() => {
    gameLoopRef.current = gameLoop;
  }, [gameLoop]);

  useEffect(() => {
    if (gameState === 'playing') {
      animRef.current = requestAnimationFrame(gameLoop);
    }
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [gameState, gameLoop]);

  useEffect(() => {
    if (gameState === 'gameover' && winner === 'player' && score.player > highScore) {
      setHighScore(score.player);
      saveHighScore(score.player);
    }
  }, [gameState, winner, score.player, highScore]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    keysRef.current.add(e.key);

    if (e.key === ' ' || e.key === 'Escape') {
      if (gameState === 'playing') {
        setGameState('paused');
      } else if (gameState === 'paused') {
        setGameState('playing');
      }
    }

    if ((gameState === 'idle' || gameState === 'gameover') && (e.key === 'Enter' || e.key === ' ')) {
      resetGame();
    }
  }, [gameState, resetGame]);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    keysRef.current.delete(e.key);
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  return (
    <div className="game-container game-pong">
      <div className="game-header">
        <span className="game-score" style={{ color: '#00ff9f' }}>You: {score.player} | High: {highScore}</span>
        <span className="game-controls">First to 5 wins</span>
        <span className="game-score" style={{ color: '#ff5555' }}>AI: {score.ai}</span>
      </div>

      <div className="pong-canvas-wrapper">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="pong-canvas"
        />
      </div>

      {gameState === 'idle' && (
        <div className="game-overlay">
          <div className="game-overlay-text">
            <div className="game-over-title">PONG</div>
            <div className="difficulty-selector">
              {(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => (
                <button
                  key={d}
                  className={`difficulty-btn ${difficulty === d ? 'difficulty-btn--active' : ''}`}
                  onClick={() => setDifficulty(d)}
                >
                  {d.charAt(0).toUpperCase() + d.slice(1)}
                </button>
              ))}
            </div>
            <div className="game-over-hint">Press ENTER to start</div>
          </div>
        </div>
      )}

      {gameState === 'paused' && (
        <div className="game-overlay">
          <div className="game-overlay-text">
            <div className="game-over-title">PAUSED</div>
            <div className="game-over-hint">Press SPACE to resume</div>
          </div>
        </div>
      )}

      {gameState === 'gameover' && (
        <div className="game-overlay">
          <div className="game-overlay-text">
            <div className="game-over-title">{winner === 'player' ? 'YOU WIN!' : 'AI WINS!'}</div>
            <div className="game-over-hint">Press ENTER to play again</div>
          </div>
        </div>
      )}

      <div className="game-footer">
        <span>W/S or Arrow Up/Down to move</span>
        <span>SPACE to pause</span>
      </div>
    </div>
  );
}
