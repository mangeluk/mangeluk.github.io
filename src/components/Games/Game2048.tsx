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

function slide(row: number[]): { row: number[]; score: number; moved: boolean } {
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

function moveLeft(grid: number[][]): { grid: number[][]; score: number; moved: boolean } {
  let totalScore = 0;
  let moved = false;
  const newGrid = grid.map((row) => {
    const result = slide(row);
    totalScore += result.score;
    if (result.moved) moved = true;
    return result.row;
  });
  return { grid: newGrid, score: totalScore, moved };
}

function rotateGrid(grid: number[][]): number[][] {
  const newGrid: number[][] = createEmptyGrid();
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      newGrid[c][GRID_SIZE - 1 - r] = grid[r][c];
    }
  }
  return newGrid;
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

export default function Game2048() {
  const [grid, setGrid] = useState(() => addRandomTile(addRandomTile(createEmptyGrid())));
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(() => {
    try { return parseInt(localStorage.getItem('2048-best') || '0', 10); } catch { return 0; }
  });
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [keepPlaying, setKeepPlaying] = useState(false);

  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const move = useCallback((direction: 'left' | 'right' | 'up' | 'down') => {
    if (gameOver) return;
    if (won && !keepPlaying) return;

    let rotated = grid.map((r) => [...r]);
    let rotations = 0;
    if (direction === 'right') { rotations = 2; }
    else if (direction === 'down') { rotations = 3; }
    else if (direction === 'up') { rotations = 1; }

    for (let i = 0; i < rotations; i++) rotated = rotateGrid(rotated);

    const { grid: movedGrid, score: moveScore, moved } = moveLeft(rotated);

    let result = movedGrid;
    for (let i = 0; i < (4 - rotations) % 4; i++) result = rotateGrid(result);

    if (moved) {
      const newGrid = addRandomTile(result);
      setGrid(newGrid);
      setScore((s) => {
        const newScore = s + moveScore;
        if (newScore > bestScore) {
          setBestScore(newScore);
          try { localStorage.setItem('2048-best', String(newScore)); } catch {}
        }
        return newScore;
      });
      if (!keepPlaying && hasWon(newGrid)) setWon(true);
      if (!canMove(newGrid)) setGameOver(true);
    }
  }, [grid, gameOver, won, keepPlaying, bestScore]);

  const resetGame = useCallback(() => {
    const newGrid = addRandomTile(addRandomTile(createEmptyGrid()));
    setGrid(newGrid);
    setScore(0);
    setGameOver(false);
    setWon(false);
    setKeepPlaying(false);
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (gameOver || (won && !keepPlaying)) {
      if (e.key === 'Enter' || e.key === ' ') resetGame();
      return;
    }

    const keyMap: Record<string, 'left' | 'right' | 'up' | 'down'> = {
      ArrowLeft: 'left',
      ArrowRight: 'right',
      ArrowUp: 'up',
      ArrowDown: 'down',
      a: 'left',
      d: 'right',
      w: 'up',
      s: 'down',
    };

    const dir = keyMap[e.key];
    if (dir) {
      e.preventDefault();
      move(dir);
    }
  }, [gameOver, won, keepPlaying, move, resetGame]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStart.current) return;
    const dx = e.changedTouches[0].clientX - touchStart.current.x;
    const dy = e.changedTouches[0].clientY - touchStart.current.y;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    if (Math.max(absDx, absDy) < 30) return;

    if (absDx > absDy) {
      move(dx > 0 ? 'right' : 'left');
    } else {
      move(dy > 0 ? 'down' : 'up');
    }
  }, [move]);

  return (
    <div
      className="game-container game-2048"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="game-header">
        <span className="game-score">Score: {score}</span>
        <span className="game-score">Best: {bestScore}</span>
        <button className="game-btn" onClick={resetGame}>New Game</button>
      </div>

      <div className="grid-2048">
        {grid.map((row, r) =>
          row.map((cell, c) => (
            <div
              key={`${r}-${c}`}
              className={`tile-2048 tile-${cell || 'empty'}`}
            >
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
