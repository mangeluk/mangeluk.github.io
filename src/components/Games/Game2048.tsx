'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';

const GRID_SIZE = 4;

function createEmptyGrid(): number[][] {
  return Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(0));
}

function addRandomTile(grid: number[][]): number[][] {
  const empty: [number, number][] = [];
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (grid[r][c] === 0) empty.push([r, c]);
    }
  }
  if (empty.length === 0) return grid;
  const [r, c] = empty[Math.floor(Math.random() * empty.length)];
  const newGrid = grid.map((row) => [...row]);
  newGrid[r][c] = Math.random() < 0.9 ? 2 : 4;
  return newGrid;
}

function slideLeft(row: number[]): { row: number[]; score: number; moved: boolean } {
  const filtered = row.filter((v) => v !== 0);
  let score = 0;
  for (let i = 0; i < filtered.length - 1; i++) {
    if (filtered[i] === filtered[i + 1]) {
      filtered[i] *= 2;
      score += filtered[i];
      filtered.splice(i + 1, 1);
    }
  }
  while (filtered.length < GRID_SIZE) filtered.push(0);
  const moved = JSON.stringify(filtered) !== JSON.stringify(row);
  return { row: filtered, score, moved };
}

function rotateGridCW(grid: number[][]): number[][] {
  const newGrid: number[][] = createEmptyGrid();
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      newGrid[c][GRID_SIZE - 1 - r] = grid[r][c];
    }
  }
  return newGrid;
}

function rotateGridCCW(grid: number[][]): number[][] {
  const newGrid: number[][] = createEmptyGrid();
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      newGrid[GRID_SIZE - 1 - c][r] = grid[r][c];
    }
  }
  return newGrid;
}

function applyMove(grid: number[][], direction: 'left' | 'right' | 'up' | 'down'): { grid: number[][]; score: number; moved: boolean } {
  let working = grid.map((r) => [...r]);

  // Rotate so the target direction becomes "left"
  if (direction === 'right') {
    working = rotateGridCW(working);
    working = rotateGridCW(working);
  } else if (direction === 'down') {
    working = rotateGridCW(working);
  } else if (direction === 'up') {
    working = rotateGridCCW(working);
  }

  // Slide left
  let totalScore = 0;
  let moved = false;
  const newGrid = working.map((row) => {
    const result = slideLeft(row);
    totalScore += result.score;
    if (result.moved) moved = true;
    return result.row;
  });

  // Rotate back
  if (direction === 'right') {
    working = rotateGridCW(newGrid);
    working = rotateGridCW(working);
  } else if (direction === 'down') {
    working = rotateGridCCW(newGrid);
  } else if (direction === 'up') {
    working = rotateGridCW(newGrid);
  } else {
    working = newGrid;
  }

  return { grid: working, score: totalScore, moved };
}

function canMove(grid: number[][]): boolean {
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (grid[r][c] === 0) return true;
      if (c < GRID_SIZE - 1 && grid[r][c] === grid[r][c + 1]) return true;
      if (r < GRID_SIZE - 1 && grid[r][c] === grid[r + 1][c]) return true;
    }
  }
  return false;
}

function hasWon(grid: number[][]): boolean {
  return grid.some((row) => row.some((cell) => cell === 2048));
}

interface GameSnapshot {
  grid: number[][];
  score: number;
  gameOver: boolean;
  won: boolean;
  keepPlaying: boolean;
  bestScore: number;
}

function processMove(state: GameSnapshot, direction: 'left' | 'right' | 'up' | 'down'): GameSnapshot {
  if (state.gameOver) return state;
  if (state.won && !state.keepPlaying) return state;

  const { grid: newGrid, score: moveScore, moved } = applyMove(state.grid, direction);
  if (!moved) return state;

  const gridAfterRandom = addRandomTile(newGrid);
  const newScore = state.score + moveScore;
  const newBest = Math.max(newScore, state.bestScore);
  const justWon = !state.keepPlaying && !state.won && hasWon(gridAfterRandom);
  const isGameOver = !canMove(gridAfterRandom);

  return {
    grid: gridAfterRandom,
    score: newScore,
    gameOver: isGameOver,
    won: justWon ? true : state.won,
    keepPlaying: state.keepPlaying,
    bestScore: newBest,
  };
}

function saveBestScore(score: number) {
  try { localStorage.setItem('2048-best', String(score)); } catch {}
}

function loadBestScore(): number {
  try { return parseInt(localStorage.getItem('2048-best') || '0', 10); } catch { return 0; }
}

function initGrid(): number[][] {
  return addRandomTile(addRandomTile(createEmptyGrid()));
}

export default function Game2048() {
  const [grid, setGrid] = useState(initGrid);
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(loadBestScore);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [keepPlaying, setKeepPlaying] = useState(false);

  const stateRef = useRef({ grid, score, gameOver, won, keepPlaying, bestScore });

  useEffect(() => {
    stateRef.current = { grid, score, gameOver, won, keepPlaying, bestScore };
  });

  const move = useCallback((direction: 'left' | 'right' | 'up' | 'down') => {
    const s = stateRef.current;
    const result = processMove(s, direction);
    if (result === s) return;

    setGrid(result.grid);
    setScore(result.score);
    setGameOver(result.gameOver);
    if (result.won) setWon(true);
    if (result.bestScore > s.bestScore) {
      setBestScore(result.bestScore);
      saveBestScore(result.bestScore);
    }
  }, []);

  const resetGame = useCallback(() => {
    setGrid(initGrid());
    setScore(0);
    setGameOver(false);
    setWon(false);
    setKeepPlaying(false);
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const s = stateRef.current;
    if (s.gameOver || (s.won && !s.keepPlaying)) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); resetGame(); }
      return;
    }

    const keyMap: Record<string, 'left' | 'right' | 'up' | 'down'> = {
      ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down',
      a: 'left', d: 'right', w: 'up', s: 'down',
    };
    const dir = keyMap[e.key];
    if (dir) { e.preventDefault(); move(dir); }
  }, [move, resetGame]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Touch
  const touchRef = useRef<{ x: number; y: number } | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchRef.current) return;
    const dx = e.changedTouches[0].clientX - touchRef.current.x;
    const dy = e.changedTouches[0].clientY - touchRef.current.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 30) return;
    if (Math.abs(dx) > Math.abs(dy)) {
      move(dx > 0 ? 'right' : 'left');
    } else {
      move(dy > 0 ? 'down' : 'up');
    }
  }, [move]);

  return (
    <div className="game-container game-2048" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      <div className="game-header">
        <span className="game-score">Score: {score}</span>
        <span className="game-score">Best: {bestScore}</span>
        <button className="game-btn" onClick={resetGame}>New Game</button>
      </div>

      <div className="grid-2048">
        {grid.map((row, r) =>
          row.map((cell, c) => (
            <div key={`${r}-${c}`} className={`tile-2048 tile-${cell || 'empty'}`}>
              {cell || ''}
            </div>
          ))
        )}
      </div>

      {(gameOver || (won && !keepPlaying)) && (
        <div className="game-overlay">
          <div className="game-overlay-text">
            <div className="game-over-title">{won ? 'YOU WIN!' : 'GAME OVER'}</div>
            <div className="game-over-score">Score: {score}</div>
            {won && (
              <button className="game-btn" onClick={() => { setKeepPlaying(true); setWon(false); }}>
                Keep Playing
              </button>
            )}
            <div className="game-over-hint">Press ENTER to restart</div>
          </div>
        </div>
      )}

      <div className="game-footer">
        <span>Arrow keys / WASD to move</span>
        <span>Swipe on mobile</span>
      </div>
    </div>
  );
}
