'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';

type Difficulty = 'easy' | 'medium' | 'hard';

const DIFFICULTIES: Record<Difficulty, { rows: number; cols: number; mines: number }> = {
  easy: { rows: 9, cols: 9, mines: 10 },
  medium: { rows: 16, cols: 16, mines: 40 },
  hard: { rows: 16, cols: 30, mines: 99 },
};

const CELL_SIZE = 28;

type CellState = {
  isMine: boolean;
  isRevealed: boolean;
  isFlagged: boolean;
  adjacentMines: number;
};

function createEmptyBoard(rows: number, cols: number): CellState[][] {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({
      isMine: false,
      isRevealed: false,
      isFlagged: false,
      adjacentMines: 0,
    }))
  );
}

function placeMines(board: CellState[][], safeRow: number, safeCol: number, mines: number): CellState[][] {
  const rows = board.length;
  const cols = board[0].length;
  const newBoard = board.map((row) => row.map((cell) => ({ ...cell })));
  let placed = 0;
  while (placed < mines) {
    const r = Math.floor(Math.random() * rows);
    const c = Math.floor(Math.random() * cols);
    if (newBoard[r][c].isMine) continue;
    if (Math.abs(r - safeRow) <= 1 && Math.abs(c - safeCol) <= 1) continue;
    newBoard[r][c].isMine = true;
    placed++;
  }
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (newBoard[r][c].isMine) continue;
      let count = 0;
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const nr = r + dr;
          const nc = c + dc;
          if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && newBoard[nr][nc].isMine) {
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
  const rows = board.length;
  const cols = board[0].length;
  if (r < 0 || r >= rows || c < 0 || c >= cols) return;
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
  for (let r = 0; r < board.length; r++) {
    for (let c = 0; c < board[0].length; c++) {
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
  rows: number;
  cols: number;
  mines: number;
}

function handleClick(state: GameSnapshot, r: number, c: number): GameSnapshot {
  if (state.gameOver || state.gameWon) return state;
  if (state.board[r][c].isFlagged || state.board[r][c].isRevealed) return state;

  let board = state.board;
  if (state.firstClick) {
    board = placeMines(board, r, c, state.mines);
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
    ...state,
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

function resetState(difficulty: Difficulty = 'medium'): GameSnapshot {
  const { rows, cols, mines } = DIFFICULTIES[difficulty];
  return {
    board: createEmptyBoard(rows, cols),
    gameOver: false,
    gameWon: false,
    firstClick: true,
    flagCount: 0,
    rows,
    cols,
    mines,
  };
}

const NUMBER_COLORS: Record<number, string> = {
  1: '#1976D2',
  2: '#388E3C',
  3: '#D32F2F',
  4: '#7B1FA2',
  5: '#FF8F00',
  6: '#00838F',
  7: '#424242',
  8: '#78909C',
};

export default function Minesweeper() {
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [gs, setGs] = useState<GameSnapshot>(() => resetState('medium'));
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
    setGs(resetState(difficulty));
    setTimer(0);
  }, [difficulty]);

  const handleDifficultyChange = useCallback((d: Difficulty) => {
    setDifficulty(d);
    setGs(resetState(d));
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
    e.stopPropagation();
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
    <div className="game-container minesweeper-game" onContextMenu={handleContextMenu}>
      <div className="difficulty-selector">
        {(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => (
          <button
            key={d}
            className={`game-btn difficulty-btn ${difficulty === d ? 'difficulty-active' : ''}`}
            onClick={() => handleDifficultyChange(d)}
          >
            {d === 'easy' ? 'Easy (9x9)' : d === 'medium' ? 'Medium (16x16)' : 'Hard (16x30)'}
          </button>
        ))}
      </div>

      <div className="game-header">
        <span className="game-score">{'\u{1F4A3}'} {gs.mines - gs.flagCount}</span>
        <span className="game-controls">{formatTime(timer)}</span>
        <button className="game-btn" onClick={resetGame}>New Game</button>
      </div>

      <div className="minesweeper-board" style={{ gridTemplateColumns: `repeat(${gs.cols}, ${CELL_SIZE}px)` }}>
        {gs.board.map((row, r) =>
          row.map((cell, c) => {
            const numColor = cell.adjacentMines > 0 ? NUMBER_COLORS[cell.adjacentMines] : undefined;
            return (
              <div
                key={`${r}-${c}`}
                className={`ms-cell ${cell.isRevealed ? 'ms-revealed' : 'ms-hidden'} ${cell.isFlagged ? 'ms-flagged' : ''} ${cell.isRevealed && cell.isMine ? 'ms-mine' : ''}`}
                style={{ width: CELL_SIZE, height: CELL_SIZE }}
                onClick={() => handleCellClick(r, c)}
                onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); handleCellRightClick(r, c); }}
                onTouchStart={() => handleTouchStartCell(r, c)}
                onTouchEnd={() => handleTouchEndCell(r, c)}
              >
                {cell.isFlagged && !cell.isRevealed && '\u{1F6A9}'}
                {cell.isRevealed && cell.isMine && '\u{1F4A3}'}
                {cell.isRevealed && !cell.isMine && cell.adjacentMines > 0 && (
                  <span style={{ color: numColor, fontWeight: 800 }}>{cell.adjacentMines}</span>
                )}
              </div>
            );
          })
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
