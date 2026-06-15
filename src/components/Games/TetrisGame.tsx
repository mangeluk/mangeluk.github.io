'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';

const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const CELL_SIZE = 28;

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

function createEmptyBoard(): Board {
  return Array.from({ length: BOARD_HEIGHT }, () => Array(BOARD_WIDTH).fill(null));
}

function rotate(shape: number[][]): number[][] {
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

function isValidPosition(board: Board, shape: number[][], pos: { x: number; y: number }): boolean {
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

function placeOnBoard(board: Board, shape: number[][], color: string, pos: { x: number; y: number }): Board {
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

function clearLines(board: Board): { board: Board; linesCleared: number } {
  let linesCleared = 0;
  const newBoard = board.filter((row) => {
    const full = row.every((cell) => cell !== null);
    if (full) linesCleared++;
    return !full;
  });
  while (newBoard.length < BOARD_HEIGHT) {
    newBoard.unshift(Array(BOARD_WIDTH).fill(null));
  }
  return { board: newBoard, linesCleared };
}

function randomTetromino(): { shape: number[][]; color: string; key: TetrominoKey } {
  const keys = Object.keys(TETROMINOS) as TetrominoKey[];
  const key = keys[Math.floor(Math.random() * keys.length)];
  return { ...TETROMINOS[key], key };
}

export default function TetrisGame() {
  const [board, setBoard] = useState<Board>(createEmptyBoard());
  const [currentPiece, setCurrentPiece] = useState(() => randomTetromino());
  const [position, setPosition] = useState({ x: 3, y: 0 });
  const [score, setScore] = useState(0);
  const [lines, setLines] = useState(0);
  const [level, setLevel] = useState(1);
  const [gameOver, setGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const dropRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const drop = useCallback(() => {
    if (gameOver || isPaused) return;

    const newPos = { ...position, y: position.y + 1 };
    if (isValidPosition(board, currentPiece.shape, newPos)) {
      setPosition(newPos);
    } else {
      // Place piece
      const newBoard = placeOnBoard(board, currentPiece.shape, currentPiece.color, position);
      const { board: clearedBoard, linesCleared } = clearLines(newBoard);

      if (linesCleared > 0) {
        const points = [0, 100, 300, 500, 800];
        setScore((s) => s + points[linesCleared] * level);
        setLines((l) => {
          const newLines = l + linesCleared;
          setLevel(Math.floor(newLines / 10) + 1);
          return newLines;
        });
      }

      setBoard(clearedBoard);

      // New piece
      const piece = randomTetromino();
      const startPos = { x: 3, y: 0 };
      if (!isValidPosition(clearedBoard, piece.shape, startPos)) {
        setGameOver(true);
        return;
      }
      setCurrentPiece(piece);
      setPosition(startPos);
    }
  }, [board, currentPiece, position, gameOver, isPaused, level]);

  useEffect(() => {
    const speed = Math.max(100, 1000 - (level - 1) * 100);
    dropRef.current = setInterval(drop, speed);
    return () => {
      if (dropRef.current) clearInterval(dropRef.current);
    };
  }, [drop, level]);

  const move = useCallback((dx: number) => {
    if (gameOver || isPaused) return;
    const newPos = { ...position, x: position.x + dx };
    if (isValidPosition(board, currentPiece.shape, newPos)) {
      setPosition(newPos);
    }
  }, [board, currentPiece, position, gameOver, isPaused]);

  const rotatePiece = useCallback(() => {
    if (gameOver || isPaused) return;
    const rotated = rotate(currentPiece.shape);
    if (isValidPosition(board, rotated, position)) {
      setCurrentPiece((p) => ({ ...p, shape: rotated }));
    }
  }, [board, currentPiece, position, gameOver, isPaused]);

  const hardDrop = useCallback(() => {
    if (gameOver || isPaused) return;
    const newPos = { ...position };
    while (isValidPosition(board, currentPiece.shape, { ...newPos, y: newPos.y + 1 })) {
      newPos.y += 1;
    }
    setPosition(newPos);
    // Force drop immediately
    setTimeout(drop, 0);
  }, [board, currentPiece, position, gameOver, isPaused, drop]);

  const resetGame = useCallback(() => {
    setBoard(createEmptyBoard());
    setCurrentPiece(randomTetromino());
    setPosition({ x: 3, y: 0 });
    setScore(0);
    setLines(0);
    setLevel(1);
    setGameOver(false);
    setIsPaused(false);
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (gameOver) {
      if (e.key === 'Enter' || e.key === ' ') resetGame();
      return;
    }

    if (e.key === ' ' || e.key === 'Escape') {
      setIsPaused((p) => !p);
      return;
    }

    const keyMap: Record<string, () => void> = {
      ArrowLeft: () => move(-1),
      ArrowRight: () => move(1),
      ArrowDown: drop,
      ArrowUp: rotatePiece,
      z: rotatePiece,
      x: rotatePiece,
      ' ': hardDrop,
    };

    const action = keyMap[e.key];
    if (action) {
      e.preventDefault();
      action();
    }
  }, [gameOver, move, drop, rotatePiece, hardDrop, resetGame]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Build display board with current piece
  const displayBoard = board.map((row) => [...row]);
  if (!gameOver) {
    for (let r = 0; r < currentPiece.shape.length; r++) {
      for (let c = 0; c < currentPiece.shape[r].length; c++) {
        if (currentPiece.shape[r][c]) {
          const y = position.y + r;
          const x = position.x + c;
          if (y >= 0 && y < BOARD_HEIGHT && x >= 0 && x < BOARD_WIDTH) {
            displayBoard[y][x] = currentPiece.color;
          }
        }
      }
    }
  }

  // Ghost piece
  let ghostY = position.y;
  while (isValidPosition(board, currentPiece.shape, { x: position.x, y: ghostY + 1 })) {
    ghostY++;
  }

  return (
    <div className="game-container">
      <div className="game-header">
        <span className="game-score">Score: {score}</span>
        <span className="game-controls">Level: {level}</span>
        <span className="game-controls">Lines: {lines}</span>
      </div>

      <div className="tetris-board" style={{ width: BOARD_WIDTH * CELL_SIZE, height: BOARD_HEIGHT * CELL_SIZE }}>
        {displayBoard.map((row, y) =>
          row.map((cell, x) => {
            const isGhost = !cell && y === ghostY && x >= position.x && x < position.x + currentPiece.shape[0].length;
            return (
              <div
                key={`${y}-${x}`}
                className={`tetris-cell ${cell ? 'tetris-cell--filled' : ''} ${isGhost ? 'tetris-cell--ghost' : ''}`}
                style={{
                  width: CELL_SIZE - 1,
                  height: CELL_SIZE - 1,
                  left: x * CELL_SIZE,
                  top: y * CELL_SIZE,
                  backgroundColor: cell || undefined,
                }}
              />
            );
          })
        )}
      </div>

      {gameOver && (
        <div className="game-overlay">
          <div className="game-overlay-text">
            <div className="game-over-title">GAME OVER</div>
            <div className="game-over-score">Score: {score}</div>
            <div className="game-over-hint">Press ENTER to restart</div>
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
        <span>Arrow keys to move</span>
        <span>UP/Z to rotate</span>
        <span>SPACE hard drop</span>
      </div>
    </div>
  );
}
