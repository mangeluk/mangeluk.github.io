'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';

const ROWS = 16;
const COLS = 16;
const MINES = 40;
const CELL_SIZE = 28;

type CellState = {
  isMine: boolean;
  isRevealed: boolean;
  isFlagged: boolean;
  adjacentMines: number;
};

function createEmptyBoard(): CellState[][] {
  return Array.from({ length: ROWS }, () =>
    Array.from({ length: COLS }, () => ({
      isMine: false,
      isRevealed: false,
      isFlagged: false,
      adjacentMines: 0,
    }))
  );
}

function placeMines(board: CellState[][], safeRow: number, safeCol: number): CellState[][] {
  const newBoard = board.map((row) => row.map((cell) => ({ ...cell })));
  let placed = 0;
  while (placed < MINES) {
    const r = Math.floor(Math.random() * ROWS);
    const c = Math.floor(Math.random() * COLS);
    if (newBoard[r][c].isMine) continue;
    if (Math.abs(r - safeRow) <= 1 && Math.abs(c - safeCol) <= 1) continue;
    newBoard[r][c].isMine = true;
    placed++;
  }
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (newBoard[r][c].isMine) continue;
      let count = 0;
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const nr = r + dr;
          const nc = c + dc;
          if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && newBoard[nr][nc].isMine) {
            count++;
          }
        }
      }
      newBoard[r][c].adjacentMines = count;
    }
  }
  return newBoard;
}

function revealCells(board: CellState[][], r: number, c: number): void {
  if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return;
  if (board[r][c].isRevealed || board[r][c].isFlagged) return;
  board[r][c].isRevealed = true;
  if (board[r][c].adjacentMines === 0 && !board[r][c].isMine) {
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        revealCells(board, r + dr, c + dc);
      }
    }
  }
}

function checkWin(board: CellState[][]): boolean {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (!board[r][c].isMine && !board[r][c].isRevealed) return false;
    }
  }
  return true;
}

function flagCount(board: CellState[][]): number {
  let count = 0;
  for (const row of board) {
    for (const cell of row) {
      if (cell.isFlagged) count++;
    }
  }
  return count;
}

interface GameSnapshot {
  board: CellState[][];
  gameOver: boolean;
  gameWon: boolean;
  firstClick: boolean;
  flagCount: number;
}

function handleClick(state: GameSnapshot, r: number, c: number): GameSnapshot {
  if (state.gameOver || state.gameWon) return state;
  if (state.board[r][c].isFlagged || state.board[r][c].isRevealed) return state;

  let board = state.board;
  if (state.firstClick) {
    board = placeMines(board, r, c);
  }

  if (board[r][c].isMine) {
    const newBoard = board.map((row) =>
      row.map((cell) => ({ ...cell, isRevealed: true }))
    );
    return { ...state, board: newBoard, gameOver: true, firstClick: false };
  }

  const newBoard = board.map((row) => row.map((cell) => ({ ...cell })));
  revealCells(newBoard, r, c);
  const won = checkWin(newBoard);
  return {
    board: newBoard,
    gameOver: false,
    gameWon: won,
    firstClick: false,
    flagCount: flagCount(newBoard),
  };
}

function handleRightClick(state: GameSnapshot, r: number, c: number): GameSnapshot {
  if (state.gameOver || state.gameWon) return state;
  if (state.board[r][c].isRevealed) return state;
  const newBoard = state.board.map((row) => row.map((cell) => ({ ...cell })));
  newBoard[r][c].isFlagged = !newBoard[r][c].isFlagged;
  return { ...state, board: newBoard, flagCount: flagCount(newBoard) };
}

function resetState(): GameSnapshot {
  return {
    board: createEmptyBoard(),
    gameOver: false,
    gameWon: false,
    firstClick: true,
    flagCount: 0,
  };
}

export default function Minesweeper() {
  const [gs, setGs] = useState<GameSnapshot>(resetState);
  const [timer, setTimer] = useState(0);
  const gsRef = useRef(gs);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => { gsRef.current = gs; });
  useEffect(() => {
    if (gs.firstClick || gs.gameOver || gs.gameWon) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => setTimer((t) => t + 1), 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gs.firstClick, gs.gameOver, gs.gameWon]);

  const resetGame = useCallback(() => {
    setGs(resetState());
    setTimer(0);
  }, []);

  const handleCellClick = useCallback((r: number, c: number) => {
    setGs((prev) => handleClick(prev, r, c));
  }, []);

  const handleCellRightClick = useCallback((r: number, c: number) => {
    setGs((prev) => handleRightClick(prev, r, c));
  }, []);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
  }, []);

  const longPressRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressTriggered = useRef(false);

  const handleTouchStartCell = useCallback((r: number, c: number) => {
    longPressTriggered.current = false;
    longPressRef.current = setTimeout(() => {
      longPressTriggered.current = true;
      setGs((prev) => handleRightClick(prev, r, c));
    }, 500);
  }, []);

  const handleTouchEndCell = useCallback((r: number, c: number) => {
    if (longPressRef.current) clearTimeout(longPressRef.current);
    if (!longPressTriggered.current) {
      setGs((prev) => handleClick(prev, r, c));
    }
  }, []);

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

  const formatTime = (t: number): string => {
    const m = Math.floor(t / 60);
    const s = t % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="game-container" onContextMenu={handleContextMenu}>
      <div className="game-header">
        <span className="game-score">Mines: {MINES - gs.flagCount}</span>
        <span className="game-controls">{formatTime(timer)}</span>
        <button className="game-btn" onClick={resetGame}>New Game</button>
      </div>

      <div
        className="minesweeper-board"
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${COLS}, ${CELL_SIZE}px)`,
          gridTemplateRows: `repeat(${ROWS}, ${CELL_SIZE}px)`,
          gap: 1,
        }}
      >
        {gs.board.map((row, r) =>
          row.map((cell, c) => (
            <div
              key={`${r}-${c}`}
              className={`minesweeper-cell ${cell.isRevealed ? 'revealed' : ''} ${cell.isFlagged ? 'flagged' : ''}`}
              style={{
                width: CELL_SIZE,
                height: CELL_SIZE,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 14,
                fontWeight: 'bold',
                cursor: cell.isRevealed ? 'default' : 'pointer',
                userSelect: 'none',
              }}
              onClick={() => handleCellClick(r, c)}
              onContextMenu={(e) => { e.preventDefault(); handleCellRightClick(r, c); }}
              onTouchStart={() => handleTouchStartCell(r, c)}
              onTouchEnd={() => handleTouchEndCell(r, c)}
            >
              {cell.isFlagged && !cell.isRevealed && '🚩'}
              {cell.isRevealed && cell.isMine && '💣'}
              {cell.isRevealed && !cell.isMine && cell.adjacentMines > 0 && cell.adjacentMines}
            </div>
          ))
        )}
      </div>

      {(gs.gameOver || gs.gameWon) && (
        <div className="game-overlay">
          <div className="game-overlay-text">
            <div className="game-over-title">{gs.gameWon ? 'YOU WIN!' : 'GAME OVER'}</div>
            <div className="game-over-score">Time: {formatTime(timer)}</div>
            <div className="game-over-hint">Press ENTER to restart</div>
          </div>
        </div>
      )}

      <div className="game-footer">
        <span>Click to reveal</span>
        <span>Right-click / Long press to flag</span>
      </div>
    </div>
  );
}
