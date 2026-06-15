'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { playMerge, playClick } from '@/lib/sound';

const GRID_SIZE = 4;
const CELL_PX = 64;
const GAP_PX = 6;

interface AnimatedTile {
  id: number;
  value: number;
  row: number;
  col: number;
  className: string;
}

let nextTileId = 1;

function createEmptyGrid(): number[][] {
  return Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(0));
}

function addRandomTile(grid: number[][]): [number[][], boolean] {
  const empty: [number, number][] = [];
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (grid[r][c] === 0) empty.push([r, c]);
    }
  }
  if (empty.length === 0) return [grid, false];
  const [r, c] = empty[Math.floor(Math.random() * empty.length)];
  const newGrid = grid.map((row) => [...row]);
  newGrid[r][c] = Math.random() < 0.9 ? 2 : 4;
  return [newGrid, true];
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

function extractTiles(grid: number[][]): { value: number; row: number; col: number }[] {
  const tiles: { value: number; row: number; col: number }[] = [];
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (grid[r][c] !== 0) {
        tiles.push({ value: grid[r][c], row: r, col: c });
      }
    }
  }
  return tiles;
}

function matchTiles(
  oldGrid: number[][],
  newGrid: number[][],
  oldTileMap: Map<number, AnimatedTile>,
): Map<number, AnimatedTile> {
  const oldTiles = extractTiles(oldGrid);
  const newTiles = extractTiles(newGrid);

  const matchedOld = new Set<string>();
  const matchedNew = new Set<string>();
  const result = new Map<number, AnimatedTile>();
  const merges: { pos: string; newTile: { value: number; row: number; col: number } }[] = [];

  // Phase 1: Match tiles at same position with same value (no move)
  for (const nt of newTiles) {
    const posKey = `${nt.row},${nt.col}`;
    const ot = oldTiles.find(
      (t) => t.row === nt.row && t.col === nt.col && t.value === nt.value && !matchedOld.has(`${t.row},${t.col}`),
    );
    if (ot) {
      const oldAnimated = oldTileMap.get(ot.row * GRID_SIZE + ot.col);
      result.set(nt.row * GRID_SIZE + nt.col, {
        id: oldAnimated ? oldAnimated.id : nextTileId++,
        value: nt.value,
        row: nt.row,
        col: nt.col,
        className: '',
      });
      matchedOld.add(`${ot.row},${ot.col}`);
      matchedNew.add(posKey);
    }
  }

  // Phase 2: Detect merges (doubled value at same position)
  for (const nt of newTiles) {
    const posKey = `${nt.row},${nt.col}`;
    if (matchedNew.has(posKey)) continue;
    const doubled = nt.value / 2;
    if (doubled < 2) continue;
    // Find unmatched old tiles that could have merged here
    const candidates = oldTiles.filter(
      (t) => t.value === doubled && !matchedOld.has(`${t.row},${t.col}`),
    );
    // Check if any candidate ended up at this position (moved here)
    const movedHere = candidates.filter((t) => t.row !== nt.row || t.col !== nt.col);
    // Check if any candidate was stationary here
    const stationaryHere = candidates.filter((t) => t.row === nt.row && t.col === nt.col);

    if (stationaryHere.length > 0 || movedHere.length > 0) {
      merges.push({ pos: posKey, newTile: nt });
      matchedNew.add(posKey);
      // Mark consumed candidates
      for (const c of [...stationaryHere, ...movedHere]) {
        matchedOld.add(`${c.row},${c.col}`);
      }
    }
  }

  // Phase 3: Match remaining tiles by value (moved tiles)
  for (const nt of newTiles) {
    const posKey = `${nt.row},${nt.col}`;
    if (matchedNew.has(posKey)) continue;
    const ot = oldTiles.find(
      (t) => t.value === nt.value && !matchedOld.has(`${t.row},${t.col}`),
    );
    if (ot) {
      const oldIdx = ot.row * GRID_SIZE + ot.col;
      const oldAnimated = oldTileMap.get(oldIdx);
      result.set(nt.row * GRID_SIZE + nt.col, {
        id: oldAnimated ? oldAnimated.id : nextTileId++,
        value: nt.value,
        row: nt.row,
        col: nt.col,
        className: 'tile-moved',
      });
      matchedOld.add(`${ot.row},${ot.col}`);
      matchedNew.add(posKey);
    }
  }

  // Phase 4: Process merges
  for (const merge of merges) {
    const { newTile } = merge;
    const key = newTile.row * GRID_SIZE + newTile.col;
    if (result.has(key)) {
      // Stationary tile exists - mark it as merged
      const existing = result.get(key)!;
      result.set(key, { ...existing, className: 'tile-merged' });
    } else {
      // New merge at empty position
      result.set(key, {
        id: nextTileId++,
        value: newTile.value,
        row: newTile.row,
        col: newTile.col,
        className: 'tile-merged',
      });
    }
  }

  // Phase 5: Remaining unmatched old tiles -> moved
  for (const ot of oldTiles) {
    const posKey = `${ot.row},${ot.col}`;
    if (!matchedOld.has(posKey)) {
      const oldIdx = ot.row * GRID_SIZE + ot.col;
      const oldAnimated = oldTileMap.get(oldIdx);
      const newIdx = ot.row * GRID_SIZE + ot.col;
      if (!result.has(newIdx)) {
        result.set(newIdx, {
          id: oldAnimated ? oldAnimated.id : nextTileId++,
          value: ot.value,
          row: ot.row,
          col: ot.col,
          className: 'tile-moved',
        });
      }
    }
  }

  // Phase 6: Any remaining unmatched new tiles -> new
  for (const nt of newTiles) {
    const posKey = `${nt.row},${nt.col}`;
    if (!matchedNew.has(posKey)) {
      const key = nt.row * GRID_SIZE + nt.col;
      if (!result.has(key)) {
        result.set(key, {
          id: nextTileId++,
          value: nt.value,
          row: nt.row,
          col: nt.col,
          className: 'tile-new',
        });
      }
    }
  }

  return result;
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

  if (moveScore > 0) playMerge();

  const [gridAfterRandom] = addRandomTile(newGrid);
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
  const [g1] = addRandomTile(createEmptyGrid());
  const [g2] = addRandomTile(g1);
  return g2;
}

function initTileMap(grid: number[][]): Map<number, AnimatedTile> {
  const map = new Map<number, AnimatedTile>();
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (grid[r][c] !== 0) {
        map.set(r * GRID_SIZE + c, {
          id: nextTileId++,
          value: grid[r][c],
          row: r,
          col: c,
          className: 'tile-new',
        });
      }
    }
  }
  return map;
}

export default function Game2048() {
  const [grid, setGrid] = useState(initGrid);
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(loadBestScore);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [keepPlaying, setKeepPlaying] = useState(false);
  const [tileMap, setTileMap] = useState<Map<number, AnimatedTile>>(() => initTileMap(grid));

  const stateRef = useRef({ grid, score, gameOver, won, keepPlaying, bestScore });
  const prevGridRef = useRef(grid);
  const tileMapRef = useRef(tileMap);

  useEffect(() => {
    stateRef.current = { grid, score, gameOver, won, keepPlaying, bestScore };
  });

  useEffect(() => {
    tileMapRef.current = tileMap;
  }, [tileMap]);

  const move = useCallback((direction: 'left' | 'right' | 'up' | 'down') => {
    const s = stateRef.current;
    if (s.gameOver || (s.won && !s.keepPlaying)) return;
    const result = processMove(s, direction);
    if (result === s) return;

    const oldGrid = prevGridRef.current;
    const newTileMap = matchTiles(oldGrid, result.grid, tileMapRef.current);
    setTileMap(newTileMap);
    prevGridRef.current = result.grid;

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
    const newGrid = initGrid();
    setGrid(newGrid);
    setScore(0);
    setGameOver(false);
    setWon(false);
    setKeepPlaying(false);
    prevGridRef.current = newGrid;
    setTileMap(initTileMap(newGrid));
    playClick();
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

      <div className="grid-2048-wrapper">
        <div className="grid-2048">
          {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => (
            <div key={i} className="tile-2048 tile-empty" />
          ))}
        </div>
        <div className="grid-2048-tiles">
          {Array.from(tileMap.values()).map((tile) => {
            const tx = tile.col * (CELL_PX + GAP_PX);
            const ty = tile.row * (CELL_PX + GAP_PX);
            return (
              <div
                key={tile.id}
                className="tile-2048-pos"
                style={{ transform: `translate(${tx}px, ${ty}px)` }}
              >
                <div className={`tile-2048 tile-${tile.value} ${tile.className}`}>
                  {tile.value}
                </div>
              </div>
            );
          })}
        </div>
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
