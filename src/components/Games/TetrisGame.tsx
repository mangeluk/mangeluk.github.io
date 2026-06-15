'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';

const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const CELL_SIZE = 24;

type Board = (string | null)[][];

const TETROMINOS = {
  I: { shape: [[1, 1, 1, 1]], color: '#00f0f0' },
  O: { shape: [[1, 1], [1, 1]], color: '#f0f000' },
  T: { shape: [[0, 1, 0], [1, 1, 1]], color: '#a000f0' },
  S: { shape: [[0, 1, 1], [1, 1, 0]], color: '#00f000' },
  Z: { shape: [[1, 1, 0], [0, 1, 1]], color: '#f00000' },
  J: { shape: [[1, 0, 0], [1, 1, 1]], color: '#0000f0' },
  L: { shape: [[0, 0, 1], [1, 1, 1]], color: '#f0a000' },
};

type TetrominoKey = keyof typeof TETROMINOS;
type Piece = { shape: number[][]; color: string; key: TetrominoKey };

function createEmptyBoard(): Board {
  return Array.from({ length: BOARD_HEIGHT }, () => Array(BOARD_WIDTH).fill(null));
}

function rotateShape(shape: number[][]): number[][] {
  const rows = shape.length;
  const cols = shape[0].length;
  const rotated: number[][] = [];
  for (let c = 0; c < cols; c++) {
    rotated.push([]);
    for (let r = rows - 1; r >= 0; r--) {
      rotated[c].push(shape[r][c]);
    }
  }
  return rotated;
}

function isValid(board: Board, shape: number[][], pos: { x: number; y: number }): boolean {
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (shape[r][c]) {
        const newX = pos.x + c;
        const newY = pos.y + r;
        if (newX < 0 || newX >= BOARD_WIDTH || newY >= BOARD_HEIGHT) return false;
        if (newY >= 0 && board[newY][newX]) return false;
      }
    }
  }
  return true;
}

function placePiece(board: Board, shape: number[][], color: string, pos: { x: number; y: number }): Board {
  const newBoard = board.map((row) => [...row]);
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (shape[r][c]) {
        const newY = pos.y + r;
        const newX = pos.x + c;
        if (newY >= 0 && newY < BOARD_HEIGHT && newX >= 0 && newX < BOARD_WIDTH) {
          newBoard[newY][newX] = color;
        }
      }
    }
  }
  return newBoard;
}

function clearFullLines(board: Board): { board: Board; cleared: number } {
  let cleared = 0;
  const newBoard = board.filter((row) => {
    const full = row.every((cell) => cell !== null);
    if (full) cleared++;
    return !full;
  });
  while (newBoard.length < BOARD_HEIGHT) {
    newBoard.unshift(Array(BOARD_WIDTH).fill(null));
  }
  return { board: newBoard, cleared };
}

function randomPiece(): Piece {
  const keys = Object.keys(TETROMINOS) as TetrominoKey[];
  const key = keys[Math.floor(Math.random() * keys.length)];
  return { ...TETROMINOS[key], key };
}

function ghostY(board: Board, shape: number[][], pos: { x: number; y: number }): number {
  let gy = pos.y;
  while (isValid(board, shape, { x: pos.x, y: gy + 1 })) gy++;
  return gy;
}

interface GameState {
  board: Board;
  piece: Piece;
  pos: { x: number; y: number };
  score: number;
  lines: number;
  level: number;
  gameOver: boolean;
  paused: boolean;
}

function tick(state: GameState): GameState {
  if (state.gameOver || state.paused) return state;

  const newPos = { ...state.pos, y: state.pos.y + 1 };
  if (isValid(state.board, state.piece.shape, newPos)) {
    return { ...state, pos: newPos };
  }

  // Place piece
  const newBoard = placePiece(state.board, state.piece.shape, state.piece.color, state.pos);
  const { board: clearedBoard, cleared } = clearFullLines(newBoard);

  const points = [0, 100, 300, 500, 800];
  const newScore = state.score + (cleared > 0 ? points[cleared] * state.level : 0);
  const newLines = state.lines + cleared;
  const newLevel = Math.floor(newLines / 10) + 1;

  // Spawn new piece
  const piece = randomPiece();
  const startPos = { x: 3, y: 0 };
  if (!isValid(clearedBoard, piece.shape, startPos)) {
    return { ...state, board: clearedBoard, score: newScore, lines: newLines, level: newLevel, gameOver: true };
  }

  return { board: clearedBoard, piece, pos: startPos, score: newScore, lines: newLines, level: newLevel, gameOver: false, paused: false };
}

function getSpeed(level: number): number {
  return Math.max(100, 1000 - (level - 1) * 100);
}

export default function TetrisGame() {
  const [gs, setGs] = useState<GameState>({
    board: createEmptyBoard(),
    piece: randomPiece(),
    pos: { x: 3, y: 0 },
    score: 0,
    lines: 0,
    level: 1,
    gameOver: false,
    paused: false,
  });

  const gsRef = useRef(gs);
  const tickRef = useRef(tick);

  useEffect(() => { gsRef.current = gs; });
  useEffect(() => { tickRef.current = tick; });

  // Game loop
  useEffect(() => {
    if (gs.gameOver || gs.paused) return;
    const id = setInterval(() => {
      setGs((prev) => tickRef.current(prev));
    }, getSpeed(gs.level));
    return () => clearInterval(id);
  }, [gs.gameOver, gs.paused, gs.level]);

  const move = useCallback((dx: number) => {
    setGs((prev) => {
      if (prev.gameOver || prev.paused) return prev;
      const newPos = { ...prev.pos, x: prev.pos.x + dx };
      if (isValid(prev.board, prev.piece.shape, newPos)) {
        return { ...prev, pos: newPos };
      }
      return prev;
    });
  }, []);

  const rotatePiece = useCallback(() => {
    setGs((prev) => {
      if (prev.gameOver || prev.paused) return prev;
      const rotated = rotateShape(prev.piece.shape);
      // Try basic rotation
      if (isValid(prev.board, rotated, prev.pos)) {
        return { ...prev, piece: { ...prev.piece, shape: rotated } };
      }
      // Wall kicks
      for (const dx of [-1, 1, -2, 2]) {
        const kickPos = { ...prev.pos, x: prev.pos.x + dx };
        if (isValid(prev.board, rotated, kickPos)) {
          return { ...prev, piece: { ...prev.piece, shape: rotated }, pos: kickPos };
        }
      }
      return prev;
    });
  }, []);

  const hardDrop = useCallback(() => {
    setGs((prev) => {
      if (prev.gameOver || prev.paused) return prev;
      let y = prev.pos.y;
      while (isValid(prev.board, prev.piece.shape, { x: prev.pos.x, y: y + 1 })) y++;
      return tick({ ...prev, pos: { ...prev.pos, y } });
    });
  }, []);

  const togglePause = useCallback(() => {
    setGs((prev) => {
      if (prev.gameOver) return prev;
      return { ...prev, paused: !prev.paused };
    });
  }, []);

  const resetGame = useCallback(() => {
    setGs({
      board: createEmptyBoard(),
      piece: randomPiece(),
      pos: { x: 3, y: 0 },
      score: 0,
      lines: 0,
      level: 1,
      gameOver: false,
      paused: false,
    });
  }, []);

  // Keyboard
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const current = gsRef.current;
      if (current.gameOver) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); resetGame(); }
        return;
      }
      if (e.key === 'Escape') { e.preventDefault(); togglePause(); return; }

      const actions: Record<string, () => void> = {
        ArrowLeft: () => move(-1),
        ArrowRight: () => move(1),
        ArrowDown: () => hardDrop(),
        ArrowUp: () => rotatePiece(),
        z: () => rotatePiece(),
        x: () => rotatePiece(),
      };
      const action = actions[e.key];
      if (action) { e.preventDefault(); action(); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [move, hardDrop, rotatePiece, resetGame, togglePause]);

  // Touch
  const touchRef = useRef<{ x: number; y: number } | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchRef.current) return;
    const dx = e.changedTouches[0].clientX - touchRef.current.x;
    const dy = e.changedTouches[0].clientY - touchRef.current.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 20) { rotatePiece(); return; }
    if (Math.abs(dx) > Math.abs(dy)) { move(dx > 0 ? 1 : -1); }
    else if (dy > 0) { hardDrop(); }
  }, [move, hardDrop, rotatePiece]);

  // Display
  const displayBoard = gs.board.map((row) => [...row]);
  if (!gs.gameOver) {
    for (let r = 0; r < gs.piece.shape.length; r++) {
      for (let c = 0; c < gs.piece.shape[r].length; c++) {
        if (gs.piece.shape[r][c]) {
          const y = gs.pos.y + r;
          const x = gs.pos.x + c;
          if (y >= 0 && y < BOARD_HEIGHT && x >= 0 && x < BOARD_WIDTH) {
            displayBoard[y][x] = gs.piece.color;
          }
        }
      }
    }
  }

  const ghost = gs.gameOver ? gs.pos.y : ghostY(gs.board, gs.piece.shape, gs.pos);

  return (
    <div className="game-container" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      <div className="game-header">
        <span className="game-score">Score: {gs.score}</span>
        <span className="game-controls">Level: {gs.level}</span>
        <span className="game-controls">Lines: {gs.lines}</span>
      </div>

      <div className="tetris-board" style={{ width: BOARD_WIDTH * CELL_SIZE, height: BOARD_HEIGHT * CELL_SIZE }}>
        {displayBoard.map((row, y) =>
          row.map((cell, x) => {
            let isGhost = false;
            if (!cell && !gs.gameOver) {
              const sr = y - ghost;
              const sc = x - gs.pos.x;
              if (sr >= 0 && sr < gs.piece.shape.length && sc >= 0 && sc < gs.piece.shape[sr].length && gs.piece.shape[sr][sc]) {
                isGhost = true;
              }
            }
            return (
              <div
                key={`${y}-${x}`}
                className={`tetris-cell ${cell ? 'tetris-cell--filled' : ''} ${isGhost ? 'tetris-cell--ghost' : ''}`}
                style={{ width: CELL_SIZE - 1, height: CELL_SIZE - 1, left: x * CELL_SIZE, top: y * CELL_SIZE, backgroundColor: cell || undefined }}
              />
            );
          })
        )}
      </div>

      {gs.gameOver && (
        <div className="game-overlay">
          <div className="game-overlay-text">
            <div className="game-over-title">GAME OVER</div>
            <div className="game-over-score">Score: {gs.score}</div>
            <div className="game-over-hint">Press ENTER to restart</div>
          </div>
        </div>
      )}

      {gs.paused && !gs.gameOver && (
        <div className="game-overlay">
          <div className="game-overlay-text">
            <div className="game-over-title">PAUSED</div>
            <div className="game-over-hint">Press ESC to resume</div>
          </div>
        </div>
      )}

      <div className="game-footer">
        <span>← → Move</span>
        <span>↑ Rotate</span>
        <span>↓ Hard drop</span>
        <span>ESC Pause</span>
      </div>
    </div>
  );
}
