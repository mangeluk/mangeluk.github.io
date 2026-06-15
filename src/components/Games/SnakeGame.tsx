'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';

const GRID_SIZE = 20;
const CELL_SIZE = 20;
const INITIAL_SPEED = 150;

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
type Point = { x: number; y: number };

export default function SnakeGame() {
  const [snake, setSnake] = useState<Point[]>([{ x: 10, y: 10 }]);
  const [food, setFood] = useState<Point>({ x: 15, y: 15 });
  const [, setDirection] = useState<Direction>('RIGHT');
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [speed, setSpeed] = useState(INITIAL_SPEED);

  useEffect(() => {
    const saved = localStorage.getItem('snake-highscore');
    if (saved) setHighScore(Number(saved));
  }, []);
  const directionRef = useRef<Direction>('RIGHT');
  const gameLoopRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const generateFood = useCallback((currentSnake: Point[]): Point => {
    let newFood: Point;
    do {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
    } while (currentSnake.some((seg) => seg.x === newFood.x && seg.y === newFood.y));
    return newFood;
  }, []);

  const resetGame = useCallback(() => {
    const initialSnake = [{ x: 10, y: 10 }];
    setSnake(initialSnake);
    setFood(generateFood(initialSnake));
    setDirection('RIGHT');
    directionRef.current = 'RIGHT';
    setGameOver(false);
    setScore(0);
    setIsPaused(false);
    setSpeed(INITIAL_SPEED);
  }, [generateFood]);

  const moveSnake = useCallback(() => {
    if (gameOver || isPaused) return;

    setSnake((prev) => {
      const head = { ...prev[0] };
      const dir = directionRef.current;

      if (dir === 'UP') head.y -= 1;
      if (dir === 'DOWN') head.y += 1;
      if (dir === 'LEFT') head.x -= 1;
      if (dir === 'RIGHT') head.x += 1;

      // Wrap around
      if (head.x < 0) head.x = GRID_SIZE - 1;
      if (head.x >= GRID_SIZE) head.x = 0;
      if (head.y < 0) head.y = GRID_SIZE - 1;
      if (head.y >= GRID_SIZE) head.y = 0;

      // Check self collision
      if (prev.some((seg) => seg.x === head.x && seg.y === head.y)) {
        setGameOver(true);
        return prev;
      }

      const newSnake = [head, ...prev];

      // Check food
      if (head.x === food.x && head.y === food.y) {
        setScore((s) => {
          const newScore = s + 10;
          setHighScore((prev) => {
            const newHigh = Math.max(prev, newScore);
            if (newHigh > prev) localStorage.setItem('snake-highscore', String(newHigh));
            return newHigh;
          });
          return newScore;
        });
        setFood(generateFood(newSnake));
        setSpeed((s) => Math.max(50, s - 5));
      } else {
        newSnake.pop();
      }

      return newSnake;
    });
  }, [gameOver, isPaused, food, generateFood]);

  useEffect(() => {
    gameLoopRef.current = setInterval(moveSnake, speed);
    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    };
  }, [moveSnake, speed]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (gameOver) {
      if (e.key === 'Enter' || e.key === ' ') {
        resetGame();
      }
      return;
    }

    if (e.key === ' ' || e.key === 'Escape') {
      setIsPaused((p) => !p);
      return;
    }

    const keyMap: Record<string, Direction> = {
      ArrowUp: 'UP',
      ArrowDown: 'DOWN',
      ArrowLeft: 'LEFT',
      ArrowRight: 'RIGHT',
      w: 'UP',
      s: 'DOWN',
      a: 'LEFT',
      d: 'RIGHT',
    };

    const newDir = keyMap[e.key];
    if (newDir) {
      e.preventDefault();
      const opposites: Record<Direction, Direction> = {
        UP: 'DOWN',
        DOWN: 'UP',
        LEFT: 'RIGHT',
        RIGHT: 'LEFT',
      };
      if (opposites[newDir] !== directionRef.current) {
        directionRef.current = newDir;
        setDirection(newDir);
      }
    }
  }, [gameOver, resetGame]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Touch controls
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStart.current) return;
    const dx = e.changedTouches[0].clientX - touchStart.current.x;
    const dy = e.changedTouches[0].clientY - touchStart.current.y;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    if (Math.max(absDx, absDy) < 20) return;

    let newDir: Direction;
    if (absDx > absDy) {
      newDir = dx > 0 ? 'RIGHT' : 'LEFT';
    } else {
      newDir = dy > 0 ? 'DOWN' : 'UP';
    }

    const opposites: Record<Direction, Direction> = {
      UP: 'DOWN', DOWN: 'UP', LEFT: 'RIGHT', RIGHT: 'LEFT',
    };
    if (opposites[newDir] !== directionRef.current) {
      directionRef.current = newDir;
      setDirection(newDir);
    }
  }, []);

  return (
    <div
      className="game-container"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="game-header">
        <span className="game-score">Score: {score} | High: {highScore}</span>
        <span className="game-controls">
          {isPaused ? 'PAUSED' : gameOver ? 'GAME OVER' : `Speed: ${Math.round((INITIAL_SPEED - speed) / 5 + 1)}`}
        </span>
      </div>

      <div className="game-board" style={{ width: GRID_SIZE * CELL_SIZE, height: GRID_SIZE * CELL_SIZE }}>
        {snake.map((seg, i) => (
          <div
            key={i}
            className={`snake-cell ${i === 0 ? 'snake-head' : ''}`}
            style={{
              left: seg.x * CELL_SIZE,
              top: seg.y * CELL_SIZE,
              width: CELL_SIZE - 1,
              height: CELL_SIZE - 1,
            }}
          />
        ))}
        <div
          className="food-cell"
          style={{
            left: food.x * CELL_SIZE,
            top: food.y * CELL_SIZE,
            width: CELL_SIZE - 1,
            height: CELL_SIZE - 1,
          }}
        />
      </div>

      {gameOver && (
        <div className="game-overlay">
          <div className="game-overlay-text">
            <div className="game-over-title">GAME OVER</div>
            <div className="game-over-score">Score: {score}</div>
            <div className="game-over-hint">Press ENTER or tap to restart</div>
          </div>
        </div>
      )}

      {isPaused && !gameOver && (
        <div className="game-overlay">
          <div className="game-overlay-text">
            <div className="game-over-title">PAUSED</div>
            <div className="game-over-hint">Press SPACE to resume</div>
          </div>
        </div>
      )}

      <div className="game-footer">
        <span>Arrow keys / WASD to move</span>
        <span>SPACE to pause</span>
      </div>
    </div>
  );
}
