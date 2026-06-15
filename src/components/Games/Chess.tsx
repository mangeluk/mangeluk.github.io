'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';

type PieceType = 'K' | 'Q' | 'R' | 'B' | 'N' | 'P';
type Color = 'w' | 'b';

interface Piece {
  type: PieceType;
  color: Color;
}

interface Position {
  row: number;
  col: number;
}

interface Move {
  from: Position;
  to: Position;
  piece: Piece;
  captured?: Piece;
  promotion?: PieceType;
  castling?: 'kingside' | 'queenside';
  enPassant?: boolean;
  notation: string;
}

type Board = (Piece | null)[][];

const UNICODE_PIECES: Record<string, string> = {
  wK: '♔', wQ: '♕', wR: '♖', wB: '♗', wN: '♘', wP: '♙',
  bK: '♚', bQ: '♛', bR: '♜', bB: '♝', bN: '♞', bP: '♟',
};

function createInitialBoard(): Board {
  const board: Board = Array.from({ length: 8 }, () => Array(8).fill(null));
  const backRow: PieceType[] = ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R'];
  for (let c = 0; c < 8; c++) {
    board[0][c] = { type: backRow[c], color: 'b' };
    board[1][c] = { type: 'P', color: 'b' };
    board[6][c] = { type: 'P', color: 'w' };
    board[7][c] = { type: backRow[c], color: 'w' };
  }
  return board;
}

function cloneBoard(board: Board): Board {
  return board.map((row) => row.map((cell) => (cell ? { ...cell } : null)));
}

function inBounds(r: number, c: number): boolean {
  return r >= 0 && r < 8 && c >= 0 && c < 8;
}

function findKing(board: Board, color: Color): Position | null {
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (p && p.type === 'K' && p.color === color) return { row: r, col: c };
    }
  }
  return null;
}

function isSquareAttacked(board: Board, row: number, col: number, byColor: Color): boolean {
  // Knight attacks
  const knightMoves = [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];
  for (const [dr, dc] of knightMoves) {
    const r = row + dr, c = col + dc;
    if (inBounds(r, c)) {
      const p = board[r][c];
      if (p && p.color === byColor && p.type === 'N') return true;
    }
  }
  // King attacks
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const r = row + dr, c = col + dc;
      if (inBounds(r, c)) {
        const p = board[r][c];
        if (p && p.color === byColor && p.type === 'K') return true;
      }
    }
  }
  // Pawn attacks
  const pawnDir = byColor === 'w' ? 1 : -1;
  for (const dc of [-1, 1]) {
    const r = row + pawnDir, c = col + dc;
    if (inBounds(r, c)) {
      const p = board[r][c];
      if (p && p.color === byColor && p.type === 'P') return true;
    }
  }
  // Sliding attacks (Rook/Queen straight, Bishop/Queen diagonal)
  const directions = [
    { dr: -1, dc: 0, types: ['R', 'Q'] },
    { dr: 1, dc: 0, types: ['R', 'Q'] },
    { dr: 0, dc: -1, types: ['R', 'Q'] },
    { dr: 0, dc: 1, types: ['R', 'Q'] },
    { dr: -1, dc: -1, types: ['B', 'Q'] },
    { dr: -1, dc: 1, types: ['B', 'Q'] },
    { dr: 1, dc: -1, types: ['B', 'Q'] },
    { dr: 1, dc: 1, types: ['B', 'Q'] },
  ];
  for (const { dr, dc, types } of directions) {
    let r = row + dr, c = col + dc;
    while (inBounds(r, c)) {
      const p = board[r][c];
      if (p) {
        if (p.color === byColor && types.includes(p.type)) return true;
        break;
      }
      r += dr;
      c += dc;
    }
  }
  return false;
}

function isInCheck(board: Board, color: Color): boolean {
  const king = findKing(board, color);
  if (!king) return false;
  return isSquareAttacked(board, king.row, king.col, color === 'w' ? 'b' : 'w');
}

interface CastlingRights {
  wKingside: boolean;
  wQueenside: boolean;
  bKingside: boolean;
  bQueenside: boolean;
}

function getRawMoves(board: Board, row: number, col: number, rights: CastlingRights, enPassantTarget: Position | null): Move[] {
  const piece = board[row][col];
  if (!piece) return [];
  const moves: Move[] = [];
  const color = piece.color;
  const enemy = color === 'w' ? 'b' : 'w';

  const addMove = (toR: number, toC: number, extra?: Partial<Move>) => {
    if (!inBounds(toR, toC)) return;
    const target = board[toR][toC];
    if (target && target.color === color) return;
    const move: Move = {
      from: { row, col },
      to: { row: toR, col: toC },
      piece,
      captured: target || undefined,
      notation: '',
    };
    if (extra) Object.assign(move, extra);
    moves.push(move);
  };

  const addSliding = (dirs: number[][]) => {
    for (const [dr, dc] of dirs) {
      let r = row + dr, c = col + dc;
      while (inBounds(r, c)) {
        const target = board[r][c];
        if (target) {
          if (target.color === enemy) addMove(r, c);
          break;
        }
        addMove(r, c);
        r += dr;
        c += dc;
      }
    }
  };

  switch (piece.type) {
    case 'P': {
      const dir = color === 'w' ? -1 : 1;
      const startRow = color === 'w' ? 6 : 1;
      const promoRow = color === 'w' ? 0 : 7;
      // Forward
      if (inBounds(row + dir, col) && !board[row + dir][col]) {
        if (row + dir === promoRow) {
          for (const promo of ['Q', 'R', 'B', 'N'] as PieceType[]) {
            moves.push({
              from: { row, col }, to: { row: row + dir, col }, piece, promotion: promo,
              notation: '',
            });
          }
        } else {
          addMove(row + dir, col);
        }
        // Double push
        if (row === startRow && !board[row + 2 * dir][col]) {
          addMove(row + 2 * dir, col);
        }
      }
      // Captures
      for (const dc of [-1, 1]) {
        const tr = row + dir, tc = col + dc;
        if (!inBounds(tr, tc)) continue;
        const target = board[tr][tc];
        if (target && target.color === enemy) {
          if (tr === promoRow) {
            for (const promo of ['Q', 'R', 'B', 'N'] as PieceType[]) {
              moves.push({
                from: { row, col }, to: { row: tr, col: tc }, piece, captured: target, promotion: promo,
                notation: '',
              });
            }
          } else {
            addMove(tr, tc);
          }
        }
        // En passant
        if (enPassantTarget && tr === enPassantTarget.row && tc === enPassantTarget.col) {
          moves.push({
            from: { row, col }, to: { row: tr, col: tc }, piece,
            captured: board[row][tc] || undefined,
            enPassant: true,
            notation: '',
          });
        }
      }
      break;
    }
    case 'N':
      for (const [dr, dc] of [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]]) {
        addMove(row + dr, col + dc);
      }
      break;
    case 'B':
      addSliding([[-1,-1],[-1,1],[1,-1],[1,1]]);
      break;
    case 'R':
      addSliding([[-1,0],[1,0],[0,-1],[0,1]]);
      break;
    case 'Q':
      addSliding([[-1,-1],[-1,1],[1,-1],[1,1],[-1,0],[1,0],[0,-1],[0,1]]);
      break;
    case 'K':
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          addMove(row + dr, col + dc);
        }
      }
      // Castling
      if (color === 'w' && row === 7 && col === 4) {
        if (rights.wKingside && !board[7][5] && !board[7][6] && board[7][7]?.type === 'R') {
          if (!isSquareAttacked(board, 7, 4, 'b') && !isSquareAttacked(board, 7, 5, 'b') && !isSquareAttacked(board, 7, 6, 'b')) {
            moves.push({ from: { row: 7, col: 4 }, to: { row: 7, col: 6 }, piece, castling: 'kingside', notation: 'O-O' });
          }
        }
        if (rights.wQueenside && !board[7][3] && !board[7][2] && !board[7][1] && board[7][0]?.type === 'R') {
          if (!isSquareAttacked(board, 7, 4, 'b') && !isSquareAttacked(board, 7, 3, 'b') && !isSquareAttacked(board, 7, 2, 'b')) {
            moves.push({ from: { row: 7, col: 4 }, to: { row: 7, col: 2 }, piece, castling: 'queenside', notation: 'O-O-O' });
          }
        }
      }
      if (color === 'b' && row === 0 && col === 4) {
        if (rights.bKingside && !board[0][5] && !board[0][6] && board[0][7]?.type === 'R') {
          if (!isSquareAttacked(board, 0, 4, 'w') && !isSquareAttacked(board, 0, 5, 'w') && !isSquareAttacked(board, 0, 6, 'w')) {
            moves.push({ from: { row: 0, col: 4 }, to: { row: 0, col: 6 }, piece, castling: 'kingside', notation: 'O-O' });
          }
        }
        if (rights.bQueenside && !board[0][3] && !board[0][2] && !board[0][1] && board[0][0]?.type === 'R') {
          if (!isSquareAttacked(board, 0, 4, 'w') && !isSquareAttacked(board, 0, 3, 'w') && !isSquareAttacked(board, 0, 2, 'w')) {
            moves.push({ from: { row: 0, col: 4 }, to: { row: 0, col: 2 }, piece, castling: 'queenside', notation: 'O-O-O' });
          }
        }
      }
      break;
  }
  return moves;
}

function applyMove(board: Board, move: Move): Board {
  const newBoard = cloneBoard(board);
  const { from, to } = move;

  if (move.castling) {
    if (move.castling === 'kingside') {
      newBoard[from.row][from.col] = null;
      newBoard[from.row][6] = move.piece;
      newBoard[from.row][5] = newBoard[from.row][7];
      newBoard[from.row][7] = null;
    } else {
      newBoard[from.row][from.col] = null;
      newBoard[from.row][2] = move.piece;
      newBoard[from.row][3] = newBoard[from.row][0];
      newBoard[from.row][0] = null;
    }
    return newBoard;
  }

  if (move.enPassant) {
    newBoard[from.row][to.col] = null;
  }

  newBoard[from.row][from.col] = null;
  if (move.promotion) {
    newBoard[to.row][to.col] = { type: move.promotion, color: move.piece.color };
  } else {
    newBoard[to.row][to.col] = move.piece;
  }
  return newBoard;
}

function generateNotation(board: Board, move: Move): string {
  if (move.castling === 'kingside') return 'O-O';
  if (move.castling === 'queenside') return 'O-O-O';

  const cols = 'abcdefgh';
  const pieceLetters: Record<PieceType, string> = { K: 'K', Q: 'Q', R: 'R', B: 'B', N: 'N', P: '' };
  let notation = pieceLetters[move.piece.type];

  if (move.piece.type !== 'P') {
    // Check for ambiguity
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (r === move.from.row && c === move.from.col) continue;
        const p = board[r][c];
        if (p && p.type === move.piece.type && p.color === move.piece.color) {
          const moves = getRawMoves(board, r, c, { wKingside: true, wQueenside: true, bKingside: true, bQueenside: true }, null);
          if (moves.some((m) => m.to.row === move.to.row && m.to.col === move.to.col)) {
            if (c !== move.from.col) {
              notation += cols[move.from.col];
            } else if (r !== move.from.row) {
              notation += String(8 - move.from.row);
            } else {
              notation += cols[move.from.col] + String(8 - move.from.row);
            }
          }
        }
      }
    }
  } else if (move.captured) {
    notation += cols[move.from.col];
  }

  if (move.captured) notation += 'x';
  notation += cols[move.to.col] + String(8 - move.to.row);
  if (move.promotion) notation += '=' + move.promotion;

  return notation;
}

function getLegalMoves(board: Board, row: number, col: number, rights: CastlingRights, enPassantTarget: Position | null): Move[] {
  const piece = board[row][col];
  if (!piece) return [];
  const rawMoves = getRawMoves(board, row, col, rights, enPassantTarget);
  return rawMoves.filter((move) => {
    const newBoard = applyMove(board, move);
    return !isInCheck(newBoard, piece.color);
  });
}

function getAllLegalMoves(board: Board, color: Color, rights: CastlingRights, enPassantTarget: Position | null): Move[] {
  const moves: Move[] = [];
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (p && p.color === color) {
        moves.push(...getLegalMoves(board, r, c, rights, enPassantTarget));
      }
    }
  }
  return moves;
}

function isCheckmate(board: Board, color: Color, rights: CastlingRights, enPassantTarget: Position | null): boolean {
  if (!isInCheck(board, color)) return false;
  return getAllLegalMoves(board, color, rights, enPassantTarget).length === 0;
}

function isStalemate(board: Board, color: Color, rights: CastlingRights, enPassantTarget: Position | null): boolean {
  if (isInCheck(board, color)) return false;
  return getAllLegalMoves(board, color, rights, enPassantTarget).length === 0;
}

function notationToSAN(move: Move, board: Board): string {
  let san = generateNotation(board, move);
  const newBoard = applyMove(board, move);
  const nextColor = move.piece.color === 'w' ? 'b' : 'w';
  const rights: CastlingRights = { wKingside: true, wQueenside: true, bKingside: true, bQueenside: true };
  if (isCheckmate(newBoard, nextColor, rights, null)) {
    san += '#';
  } else if (isInCheck(newBoard, nextColor)) {
    san += '+';
  }
  return san;
}

interface ChessState {
  board: Board;
  turn: Color;
  rights: CastlingRights;
  enPassantTarget: Position | null;
  capturedPieces: { w: PieceType[]; b: PieceType[] };
  history: string[];
  gameOver: boolean;
  result: string;
  selectedSquare: Position | null;
  legalMoves: Move[];
}

function initChessState(): ChessState {
  return {
    board: createInitialBoard(),
    turn: 'w',
    rights: { wKingside: true, wQueenside: true, bKingside: true, bQueenside: true },
    enPassantTarget: null,
    capturedPieces: { w: [], b: [] },
    history: [],
    gameOver: false,
    result: '',
    selectedSquare: null,
    legalMoves: [],
  };
}

function updateRights(rights: CastlingRights, move: Move): CastlingRights {
  const newRights = { ...rights };
  if (move.piece.type === 'K') {
    if (move.piece.color === 'w') {
      newRights.wKingside = false;
      newRights.wQueenside = false;
    } else {
      newRights.bKingside = false;
      newRights.bQueenside = false;
    }
  }
  if (move.piece.type === 'R') {
    if (move.from.row === 7 && move.from.col === 0) newRights.wQueenside = false;
    if (move.from.row === 7 && move.from.col === 7) newRights.wKingside = false;
    if (move.from.row === 0 && move.from.col === 0) newRights.bQueenside = false;
    if (move.from.row === 0 && move.from.col === 7) newRights.bKingside = false;
  }
  // If a rook is captured
  if (move.to.row === 7 && move.to.col === 0) newRights.wQueenside = false;
  if (move.to.row === 7 && move.to.col === 7) newRights.wKingside = false;
  if (move.to.row === 0 && move.to.col === 0) newRights.bQueenside = false;
  if (move.to.row === 0 && move.to.col === 7) newRights.bKingside = false;
  return newRights;
}

function makeMove(state: ChessState, move: Move): ChessState {
  const san = notationToSAN(move, state.board);
  const newBoard = applyMove(state.board, move);
  const newRights = updateRights(state.rights, move);
  const nextTurn = state.turn === 'w' ? 'b' : 'w';

  const newCaptured = {
    w: [...state.capturedPieces.w],
    b: [...state.capturedPieces.b],
  };
  if (move.captured) {
    if (move.piece.color === 'w') {
      newCaptured.w.push(move.captured.type);
    } else {
      newCaptured.b.push(move.captured.type);
    }
  }

  let newEnPassantTarget: Position | null = null;
  if (move.piece.type === 'P' && Math.abs(move.to.row - move.from.row) === 2) {
    newEnPassantTarget = { row: (move.from.row + move.to.row) / 2, col: move.from.col };
  }

  const newHistory = [...state.history, san];
  let gameOver = false;
  let result = '';

  if (isCheckmate(newBoard, nextTurn, newRights, newEnPassantTarget)) {
    gameOver = true;
    result = state.turn === 'w' ? '1-0' : '0-1';
  } else if (isStalemate(newBoard, nextTurn, newRights, newEnPassantTarget)) {
    gameOver = true;
    result = '1/2-1/2';
  }

  return {
    board: newBoard,
    turn: nextTurn,
    rights: newRights,
    enPassantTarget: newEnPassantTarget,
    capturedPieces: newCaptured,
    history: newHistory,
    gameOver,
    result,
    selectedSquare: null,
    legalMoves: [],
  };
}

function aiMove(state: ChessState): ChessState {
  if (state.gameOver || state.turn !== 'b') return state;
  const moves = getAllLegalMoves(state.board, 'b', state.rights, state.enPassantTarget);
  if (moves.length === 0) return state;

  // Simple evaluation: prefer captures, checks, and center control
  let bestScore = -Infinity;
  let bestMoves: Move[] = [];
  for (const move of moves) {
    let score = 0;
    if (move.captured) {
      const values: Record<PieceType, number> = { P: 1, N: 3, B: 3, R: 5, Q: 9, K: 100 };
      score += values[move.captured.type];
    }
    // Center control
    if (move.to.row >= 2 && move.to.row <= 5 && move.to.col >= 2 && move.to.col <= 5) {
      score += 0.5;
    }
    // Randomness
    score += Math.random() * 0.5;

    if (score > bestScore) {
      bestScore = score;
      bestMoves = [move];
    } else if (score === bestScore) {
      bestMoves.push(move);
    }
  }

  const chosen = bestMoves[Math.floor(Math.random() * bestMoves.length)];
  return makeMove(state, chosen);
}

const PIECE_VALUES: Record<PieceType, number> = { P: 1, N: 3, B: 3, R: 5, Q: 9, K: 0 };

export default function ChessGame() {
  const [gs, setGs] = useState<ChessState>(initChessState);
  const gsRef = useRef(gs);

  useEffect(() => { gsRef.current = gs; });

  const resetGame = useCallback(() => {
    setGs(initChessState());
  }, []);

  const handleSquareClick = useCallback((row: number, col: number) => {
    setGs((prev) => {
      if (prev.gameOver || prev.turn !== 'w') return prev;

      const piece = prev.board[row][col];

      // If a piece is selected
      if (prev.selectedSquare) {
        // Clicking same square - deselect
        if (prev.selectedSquare.row === row && prev.selectedSquare.col === col) {
          return { ...prev, selectedSquare: null, legalMoves: [] };
        }

        // Clicking own piece - reselect
        if (piece && piece.color === 'w') {
          const moves = getLegalMoves(prev.board, row, col, prev.rights, prev.enPassantTarget);
          return { ...prev, selectedSquare: { row, col }, legalMoves: moves };
        }

        // Try to make a move
        const move = prev.legalMoves.find((m) => m.to.row === row && m.to.col === col);
        if (move) {
          // Pawn promotion - auto promote to queen
          const finalMove = move.promotion ? { ...move, promotion: 'Q' as PieceType } : move;
          const newState = makeMove(prev, finalMove);
          // AI moves after a short delay
          setTimeout(() => {
            setGs((current) => aiMove(current));
          }, 100);
          return newState;
        }

        // Click on empty or enemy with no move - deselect
        return { ...prev, selectedSquare: null, legalMoves: [] };
      }

      // No piece selected - select own piece
      if (piece && piece.color === 'w') {
        const moves = getLegalMoves(prev.board, row, col, prev.rights, prev.enPassantTarget);
        return { ...prev, selectedSquare: { row, col }, legalMoves: moves };
      }

      return prev;
    });
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      if (gsRef.current.gameOver) {
        e.preventDefault();
        resetGame();
      }
    }
  }, [resetGame]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const isHighlighted = useCallback((row: number, col: number): boolean => {
    if (!gs.selectedSquare) return false;
    return gs.legalMoves.some((m) => m.to.row === row && m.to.col === col);
  }, [gs.selectedSquare, gs.legalMoves]);

  const lastMove = gs.history.length > 0 ? gs.history[gs.history.length - 1] : '';

  const statusText = gs.gameOver
    ? gs.result === '1/2-1/2' ? 'Stalemate - Draw' : `${gs.result === '1-0' ? 'White' : 'Black'} wins!`
    : gs.turn === 'w' ? 'White to move' : 'Black is thinking...';

  return (
    <div className="game-container chess-game">
      <div className="game-header">
        <span className="game-score">{statusText}</span>
        <button className="game-btn" onClick={resetGame}>New Game</button>
      </div>

      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap', justifyContent: 'center' }}>
        {/* Captured by white */}
        <div style={{ minWidth: 60, textAlign: 'center' }}>
          <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>Black lost</div>
          <div style={{ fontSize: 18, lineHeight: '22px' }}>
            {gs.capturedPieces.w
              .sort((a, b) => PIECE_VALUES[b] - PIECE_VALUES[a])
              .map((t, i) => (
                <span key={i}>{UNICODE_PIECES[`b${t}`]}</span>
              ))}
          </div>
        </div>

        {/* Board */}
        <div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(8, 48px)',
              gridTemplateRows: 'repeat(8, 48px)',
              border: '2px solid #555',
            }}
          >
            {gs.board.map((row, r) =>
              row.map((cell, c) => {
                const isLight = (r + c) % 2 === 0;
                const isSelected = gs.selectedSquare?.row === r && gs.selectedSquare?.col === c;
                const highlighted = isHighlighted(r, c);
                return (
                  <div
                    key={`${r}-${c}`}
                    onClick={() => handleSquareClick(r, c)}
                    style={{
                      width: 48,
                      height: 48,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 32,
                      cursor: 'pointer',
                      backgroundColor: isSelected ? '#4a9' : highlighted ? '#6b6' : isLight ? '#f0d9b5' : '#b58863',
                      userSelect: 'none',
                      position: 'relative',
                    }}
                  >
                    {highlighted && !cell && (
                      <div style={{
                        width: 14,
                        height: 14,
                        borderRadius: '50%',
                        backgroundColor: 'rgba(0,0,0,0.2)',
                        position: 'absolute',
                      }} />
                    )}
                    {cell && UNICODE_PIECES[`${cell.color}${cell.type}`]}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Captured by black */}
        <div style={{ minWidth: 60, textAlign: 'center' }}>
          <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>White lost</div>
          <div style={{ fontSize: 18, lineHeight: '22px' }}>
            {gs.capturedPieces.b
              .sort((a, b) => PIECE_VALUES[b] - PIECE_VALUES[a])
              .map((t, i) => (
                <span key={i}>{UNICODE_PIECES[`w${t}`]}</span>
              ))}
          </div>
        </div>

        {/* Move history */}
        <div style={{
          minWidth: 120,
          maxHeight: 384,
          overflow: 'auto',
          border: '1px solid #555',
          borderRadius: 4,
          padding: 8,
          fontSize: 13,
          fontFamily: 'monospace',
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: 4 }}>Moves</div>
          {gs.history.map((move, i) => (
            <div key={i}>
              {i % 2 === 0 && <span style={{ color: '#888' }}>{Math.floor(i / 2 + 1)}. </span>}
              {move}
            </div>
          ))}
          {lastMove && (
            <div style={{ marginTop: 8, color: '#4a9' }}>
              Last: {lastMove}
            </div>
          )}
        </div>
      </div>

      {gs.gameOver && (
        <div className="game-overlay">
          <div className="game-overlay-text">
            <div className="game-over-title">
              {gs.result === '1/2-1/2' ? 'DRAW' : 'CHECKMATE'}
            </div>
            <div className="game-over-score">{gs.result}</div>
            <div className="game-over-hint">Press ENTER to play again</div>
          </div>
        </div>
      )}

      <div className="game-footer">
        <span>Click piece then square to move</span>
        <span>Pawns auto-promote to Queen</span>
      </div>
    </div>
  );
}
