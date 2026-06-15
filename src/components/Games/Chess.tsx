'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';

type PieceType = 'K' | 'Q' | 'R' | 'B' | 'N' | 'P';
type Color = 'w' | 'b';

interface Piece { type: PieceType; color: Color; }
interface Position { row: number; col: number; }
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

const UNICODE: Record<string, string> = {
  wK: '\u2654', wQ: '\u2655', wR: '\u2656', wB: '\u2657', wN: '\u2658', wP: '\u2659',
  bK: '\u265A', bQ: '\u265B', bR: '\u265C', bB: '\u265D', bN: '\u265E', bP: '\u265F',
};

const COL_LABELS = 'abcdefgh';

function createInitialBoard(): Board {
  const board: Board = Array.from({ length: 8 }, () => Array(8).fill(null));
  const back: PieceType[] = ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R'];
  for (let c = 0; c < 8; c++) {
    board[0][c] = { type: back[c], color: 'b' };
    board[1][c] = { type: 'P', color: 'b' };
    board[6][c] = { type: 'P', color: 'w' };
    board[7][c] = { type: back[c], color: 'w' };
  }
  return board;
}

function cloneBoard(b: Board): Board { return b.map((r) => r.map((c) => c ? { ...c } : null)); }
function inBounds(r: number, c: number): boolean { return r >= 0 && r < 8 && c >= 0 && c < 8; }

function findKing(board: Board, color: Color): Position | null {
  for (let r = 0; r < 8; r++)
    for (let c = 0; c < 8; c++)
      if (board[r][c]?.type === 'K' && board[r][c]?.color === color) return { row: r, col: c };
  return null;
}

function isSquareAttacked(board: Board, row: number, col: number, byColor: Color): boolean {
  const knight = [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];
  for (const [dr, dc] of knight) {
    const r = row + dr, c = col + dc;
    if (inBounds(r, c) && board[r][c]?.color === byColor && board[r][c]?.type === 'N') return true;
  }
  for (let dr = -1; dr <= 1; dr++)
    for (let dc = -1; dc <= 1; dc++) {
      if (!dr && !dc) continue;
      const r = row + dr, c = col + dc;
      if (inBounds(r, c) && board[r][c]?.color === byColor && board[r][c]?.type === 'K') return true;
    }
  const pawnDir = byColor === 'w' ? 1 : -1;
  for (const dc of [-1, 1]) {
    const r = row + pawnDir, c = col + dc;
    if (inBounds(r, c) && board[r][c]?.color === byColor && board[r][c]?.type === 'P') return true;
  }
  const dirs = [
    { dr: -1, dc: 0, t: ['R', 'Q'] }, { dr: 1, dc: 0, t: ['R', 'Q'] },
    { dr: 0, dc: -1, t: ['R', 'Q'] }, { dr: 0, dc: 1, t: ['R', 'Q'] },
    { dr: -1, dc: -1, t: ['B', 'Q'] }, { dr: -1, dc: 1, t: ['B', 'Q'] },
    { dr: 1, dc: -1, t: ['B', 'Q'] }, { dr: 1, dc: 1, t: ['B', 'Q'] },
  ];
  for (const { dr, dc, t } of dirs) {
    let r = row + dr, c = col + dc;
    while (inBounds(r, c)) {
      const p = board[r][c];
      if (p) { if (p.color === byColor && t.includes(p.type)) return true; break; }
      r += dr; c += dc;
    }
  }
  return false;
}

function isInCheck(board: Board, color: Color): boolean {
  const k = findKing(board, color);
  return k ? isSquareAttacked(board, k.row, k.col, color === 'w' ? 'b' : 'w') : false;
}

interface CastlingRights { wK: boolean; wQ: boolean; bK: boolean; bQ: boolean; }

function getRawMoves(board: Board, row: number, col: number, rights: CastlingRights, ep: Position | null): Move[] {
  const piece = board[row][col];
  if (!piece) return [];
  const moves: Move[] = [];
  const color = piece.color, enemy = color === 'w' ? 'b' : 'w';

  const add = (toR: number, toC: number, extra?: Partial<Move>) => {
    if (!inBounds(toR, toC)) return;
    const target = board[toR][toC];
    if (target?.color === color) return;
    const m: Move = { from: { row, col }, to: { row: toR, col: toC }, piece, captured: target || undefined, notation: '' };
    if (extra) Object.assign(m, extra);
    moves.push(m);
  };

  const slide = (dirs: number[][]) => {
    for (const [dr, dc] of dirs) {
      let r = row + dr, c = col + dc;
      while (inBounds(r, c)) {
        const t = board[r][c];
        if (t) { if (t.color === enemy) add(r, c); break; }
        add(r, c); r += dr; c += dc;
      }
    }
  };

  switch (piece.type) {
    case 'P': {
      const dir = color === 'w' ? -1 : 1;
      const start = color === 'w' ? 6 : 1;
      const promo = color === 'w' ? 0 : 7;
      if (inBounds(row + dir, col) && !board[row + dir][col]) {
        if (row + dir === promo) {
          for (const p of ['Q', 'R', 'B', 'N'] as PieceType[])
            moves.push({ from: { row, col }, to: { row: row + dir, col }, piece, promotion: p, notation: '' });
        } else {
          add(row + dir, col);
          if (row === start && !board[row + 2 * dir][col]) add(row + 2 * dir, col);
        }
      }
      for (const dc of [-1, 1]) {
        const tr = row + dir, tc = col + dc;
        if (!inBounds(tr, tc)) continue;
        const target = board[tr][tc];
        if (target?.color === enemy) {
          if (tr === promo) {
            for (const p of ['Q', 'R', 'B', 'N'] as PieceType[])
              moves.push({ from: { row, col }, to: { row: tr, col: tc }, piece, captured: target, promotion: p, notation: '' });
          } else add(tr, tc);
        }
        if (ep && tr === ep.row && tc === ep.col)
          moves.push({ from: { row, col }, to: { row: tr, col: tc }, piece, captured: board[row][tc] || undefined, enPassant: true, notation: '' });
      }
      break;
    }
    case 'N': for (const [dr, dc] of [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]]) add(row+dr, col+dc); break;
    case 'B': slide([[-1,-1],[-1,1],[1,-1],[1,1]]); break;
    case 'R': slide([[-1,0],[1,0],[0,-1],[0,1]]); break;
    case 'Q': slide([[-1,-1],[-1,1],[1,-1],[1,1],[-1,0],[1,0],[0,-1],[0,1]]); break;
    case 'K': {
      for (let dr = -1; dr <= 1; dr++)
        for (let dc = -1; dc <= 1; dc++) { if (dr || dc) add(row+dr, col+dc); }
      if (color === 'w' && row === 7 && col === 4) {
        if (rights.wK && !board[7][5] && !board[7][6] && board[7][7]?.type === 'R')
          if (!isSquareAttacked(board,7,4,'b') && !isSquareAttacked(board,7,5,'b') && !isSquareAttacked(board,7,6,'b'))
            moves.push({ from:{row:7,col:4}, to:{row:7,col:6}, piece, castling:'kingside', notation:'O-O' });
        if (rights.wQ && !board[7][3] && !board[7][2] && !board[7][1] && board[7][0]?.type === 'R')
          if (!isSquareAttacked(board,7,4,'b') && !isSquareAttacked(board,7,3,'b') && !isSquareAttacked(board,7,2,'b'))
            moves.push({ from:{row:7,col:4}, to:{row:7,col:2}, piece, castling:'queenside', notation:'O-O-O' });
      }
      if (color === 'b' && row === 0 && col === 4) {
        if (rights.bK && !board[0][5] && !board[0][6] && board[0][7]?.type === 'R')
          if (!isSquareAttacked(board,0,4,'w') && !isSquareAttacked(board,0,5,'w') && !isSquareAttacked(board,0,6,'w'))
            moves.push({ from:{row:0,col:4}, to:{row:0,col:6}, piece, castling:'kingside', notation:'O-O' });
        if (rights.bQ && !board[0][3] && !board[0][2] && !board[0][1] && board[0][0]?.type === 'R')
          if (!isSquareAttacked(board,0,4,'w') && !isSquareAttacked(board,0,3,'w') && !isSquareAttacked(board,0,2,'w'))
            moves.push({ from:{row:0,col:4}, to:{row:0,col:2}, piece, castling:'queenside', notation:'O-O-O' });
      }
      break;
    }
  }
  return moves;
}

function applyMove(board: Board, move: Move): Board {
  const nb = cloneBoard(board);
  if (move.castling) {
    const row = move.from.row;
    if (move.castling === 'kingside') {
      nb[row][4] = null; nb[row][6] = move.piece; nb[row][5] = nb[row][7]; nb[row][7] = null;
    } else {
      nb[row][4] = null; nb[row][2] = move.piece; nb[row][3] = nb[row][0]; nb[row][0] = null;
    }
    return nb;
  }
  if (move.enPassant) nb[move.from.row][move.to.col] = null;
  nb[move.from.row][move.from.col] = null;
  nb[move.to.row][move.to.col] = move.promotion ? { type: move.promotion, color: move.piece.color } : move.piece;
  return nb;
}

function getLegalMoves(board: Board, row: number, col: number, rights: CastlingRights, ep: Position | null): Move[] {
  const piece = board[row][col];
  if (!piece) return [];
  return getRawMoves(board, row, col, rights, ep).filter((m) => !isInCheck(applyMove(board, m), piece.color));
}

function getAllLegal(board: Board, color: Color, rights: CastlingRights, ep: Position | null): Move[] {
  const moves: Move[] = [];
  for (let r = 0; r < 8; r++)
    for (let c = 0; c < 8; c++)
      if (board[r][c]?.color === color) moves.push(...getLegalMoves(board, r, c, rights, ep));
  return moves;
}

function isCheckmate(board: Board, color: Color, rights: CastlingRights, ep: Position | null): boolean {
  return isInCheck(board, color) && getAllLegal(board, color, rights, ep).length === 0;
}
function isStalemate(board: Board, color: Color, rights: CastlingRights, ep: Position | null): boolean {
  return !isInCheck(board, color) && getAllLegal(board, color, rights, ep).length === 0;
}

function generateSAN(board: Board, move: Move): string {
  if (move.castling === 'kingside') return 'O-O';
  if (move.castling === 'queenside') return 'O-O-O';
  const letters: Record<PieceType, string> = { K: 'K', Q: 'Q', R: 'R', B: 'B', N: 'N', P: '' };
  let san = letters[move.piece.type];
  if (move.piece.type !== 'P') {
    for (let r = 0; r < 8; r++)
      for (let c = 0; c < 8; c++) {
        if (r === move.from.row && c === move.from.col) continue;
        const p = board[r][c];
        if (p?.type === move.piece.type && p?.color === move.piece.color) {
          if (getLegalMoves(board, r, c, { wK: true, wQ: true, bK: true, bQ: true }, null).some((m) => m.to.row === move.to.row && m.to.col === move.to.col)) {
            if (c !== move.from.col) san += COL_LABELS[move.from.col];
            else if (r !== move.from.row) san += String(8 - move.from.row);
            else san += COL_LABELS[move.from.col] + String(8 - move.from.row);
          }
        }
      }
  } else if (move.captured) san += COL_LABELS[move.from.col];
  if (move.captured) san += 'x';
  san += COL_LABELS[move.to.col] + String(8 - move.to.row);
  if (move.promotion) san += '=' + move.promotion;
  return san;
}

interface ChessState {
  board: Board; turn: Color; rights: CastlingRights; ep: Position | null;
  captured: { w: PieceType[]; b: PieceType[] }; history: string[];
  gameOver: boolean; result: string; selected: Position | null; legal: Move[];
  lastMove: { from: Position; to: Position } | null;
}

function init(): ChessState {
  return {
    board: createInitialBoard(), turn: 'w',
    rights: { wK: true, wQ: true, bK: true, bQ: true },
    ep: null, captured: { w: [], b: [] }, history: [],
    gameOver: false, result: '', selected: null, legal: [], lastMove: null,
  };
}

function updateRights(r: CastlingRights, move: Move): CastlingRights {
  const n = { ...r };
  if (move.piece.type === 'K') {
    if (move.piece.color === 'w') { n.wK = false; n.wQ = false; }
    else { n.bK = false; n.bQ = false; }
  }
  if (move.piece.type === 'R') {
    if (move.from.row === 7 && move.from.col === 0) n.wQ = false;
    if (move.from.row === 7 && move.from.col === 7) n.wK = false;
    if (move.from.row === 0 && move.from.col === 0) n.bQ = false;
    if (move.from.row === 0 && move.from.col === 7) n.bK = false;
  }
  if (move.to.row === 7 && move.to.col === 0) n.wQ = false;
  if (move.to.row === 7 && move.to.col === 7) n.wK = false;
  if (move.to.row === 0 && move.to.col === 0) n.bQ = false;
  if (move.to.row === 0 && move.to.col === 7) n.bK = false;
  return n;
}

function makeMove(state: ChessState, move: Move): ChessState {
  const san = generateSAN(state.board, move);
  const nb = applyMove(state.board, move);
  const nr = updateRights(state.rights, move);
  const next = state.turn === 'w' ? 'b' : 'w';
  const cap = { w: [...state.captured.w], b: [...state.captured.b] };
  if (move.captured) {
    if (move.piece.color === 'w') cap.w.push(move.captured.type);
    else cap.b.push(move.captured.type);
  }
  let ep: Position | null = null;
  if (move.piece.type === 'P' && Math.abs(move.to.row - move.from.row) === 2)
    ep = { row: (move.from.row + move.to.row) / 2, col: move.from.col };
  const hist = [...state.history, san];
  let gameOver = false, result = '';
  if (isCheckmate(nb, next, nr, ep)) { gameOver = true; result = state.turn === 'w' ? '1-0' : '0-1'; }
  else if (isStalemate(nb, next, nr, ep)) { gameOver = true; result = '1/2-1/2'; }
  return { board: nb, turn: next, rights: nr, ep, captured: cap, history: hist, gameOver, result, selected: null, legal: [], lastMove: { from: move.from, to: move.to } };
}

function aiTurn(state: ChessState): ChessState {
  if (state.gameOver || state.turn !== 'b') return state;
  const moves = getAllLegal(state.board, 'b', state.rights, state.ep);
  if (!moves.length) return state;
  const vals: Record<PieceType, number> = { P: 1, N: 3, B: 3, R: 5, Q: 9, K: 100 };
  let best = -Infinity, bests: Move[] = [];
  for (const m of moves) {
    let s = 0;
    if (m.captured) s += vals[m.captured.type];
    if (m.to.row >= 2 && m.to.row <= 5 && m.to.col >= 2 && m.to.col <= 5) s += 0.5;
    s += Math.random() * 0.5;
    if (s > best) { best = s; bests = [m]; } else if (s === best) bests.push(m);
  }
  return makeMove(state, bests[Math.floor(Math.random() * bests.length)]);
}

const PV: Record<PieceType, number> = { P: 1, N: 3, B: 3, R: 5, Q: 9, K: 0 };

export default function ChessGame() {
  const [gs, setGs] = useState<ChessState>(init);
  const gsRef = useRef(gs);
  useEffect(() => { gsRef.current = gs; });

  const resetGame = useCallback(() => setGs(init()), []);

  const handleClick = useCallback((row: number, col: number) => {
    setGs((prev) => {
      if (prev.gameOver || prev.turn !== 'w') return prev;
      const piece = prev.board[row][col];
      if (prev.selected) {
        if (prev.selected.row === row && prev.selected.col === col)
          return { ...prev, selected: null, legal: [] };
        if (piece?.color === 'w') {
          const m = getLegalMoves(prev.board, row, col, prev.rights, prev.ep);
          return { ...prev, selected: { row, col }, legal: m };
        }
        const move = prev.legal.find((m) => m.to.row === row && m.to.col === col);
        if (move) {
          const final = move.promotion ? { ...move, promotion: 'Q' as PieceType } : move;
          const ns = makeMove(prev, final);
          setTimeout(() => setGs((c) => aiTurn(c)), 150);
          return ns;
        }
        return { ...prev, selected: null, legal: [] };
      }
      if (piece?.color === 'w') {
        const m = getLegalMoves(prev.board, row, col, prev.rights, prev.ep);
        return { ...prev, selected: { row, col }, legal: m };
      }
      return prev;
    });
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ' ') && gsRef.current.gameOver) { e.preventDefault(); resetGame(); }
  }, [resetGame]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const isSelected = (r: number, c: number) => gs.selected?.row === r && gs.selected?.col === c;
  const isLegalTarget = (r: number, c: number) => gs.legal.some((m) => m.to.row === r && m.to.col === c);
  const isLastMove = (r: number, c: number) => gs.lastMove && ((gs.lastMove.from.row === r && gs.lastMove.from.col === c) || (gs.lastMove.to.row === r && gs.lastMove.to.col === c));
  const inCheck = gs.turn === 'w' && isInCheck(gs.board, 'w');

  const kingPos = inCheck ? findKing(gs.board, 'w') : null;

  const status = gs.gameOver
    ? gs.result === '1/2-1/2' ? 'Stalemate - Draw' : `${gs.result === '1-0' ? 'White' : 'Black'} wins!`
    : gs.turn === 'w' ? 'Your turn' : 'Black is thinking...';

  return (
    <div className="game-container chess-game">
      <div className="game-header">
        <span className="game-score">{status}</span>
        <button className="game-btn" onClick={resetGame}>New Game</button>
      </div>

      <div className="chess-layout">
        <div>
          {/* Captured by white */}
          <div className="chess-captured" style={{ marginBottom: 6 }}>
            <div className="chess-captured-label">Black captured</div>
            <div className="chess-captured-pieces">
              {gs.captured.w.sort((a, b) => PV[b] - PV[a]).map((t, i) => (
                <span key={i}>{UNICODE[`b${t}`]}</span>
              ))}
            </div>
          </div>

          {/* Board */}
          <div className="chess-board">
            {gs.board.map((row, r) =>
              row.map((cell, c) => {
                const light = (r + c) % 2 === 0;
                const sel = isSelected(r, c);
                const legal = isLegalTarget(r, c);
                const last = isLastMove(r, c);
                const check = kingPos?.row === r && kingPos?.col === c;
                let cls = 'chess-cell ';
                if (sel) cls += 'chess-cell-selected';
                else if (check) cls += 'chess-cell-check';
                else if (last) cls += 'chess-cell-last-move';
                else if (legal) cls += 'chess-cell-highlight';
                else cls += light ? 'chess-cell-light' : 'chess-cell-dark';

                return (
                  <div key={`${r}-${c}`} className={cls} onClick={() => handleClick(r, c)}>
                    {legal && !cell && <div className="chess-move-dot" />}
                    {legal && cell && <div className="chess-capture-dot" />}
                    {cell && <span style={{ position: 'relative', zIndex: 1 }}>{UNICODE[`${cell.color}${cell.type}`]}</span>}
                  </div>
                );
              })
            )}
          </div>

          {/* Column labels */}
          <div className="chess-col-labels">
            {COL_LABELS.split('').map((l) => (
              <div key={l} className="chess-col-label">{l}</div>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="chess-sidebar">
          {/* Captured by black */}
          <div className="chess-captured">
            <div className="chess-captured-label">White captured</div>
            <div className="chess-captured-pieces">
              {gs.captured.b.sort((a, b) => PV[b] - PV[a]).map((t, i) => (
                <span key={i}>{UNICODE[`w${t}`]}</span>
              ))}
            </div>
          </div>

          {/* Move history */}
          <div className="chess-moves-panel">
            <div className="chess-moves-title">Moves</div>
            {gs.history.map((m, i) => (
              <div key={i} className="chess-move-entry">
                {i % 2 === 0 && <span className="chess-move-num">{Math.floor(i / 2 + 1)}.</span>}
                <span className={i % 2 === 0 ? 'chess-move-white' : 'chess-move-black'}>{m}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {gs.gameOver && (
        <div className="game-overlay">
          <div className="game-overlay-text">
            <div className="game-over-title">{gs.result === '1/2-1/2' ? 'DRAW' : 'CHECKMATE'}</div>
            <div className="game-over-score">{gs.result}</div>
            <div className="game-over-hint">Press ENTER to play again</div>
          </div>
        </div>
      )}

      <div className="game-footer">
        <span>Click piece then square</span>
        <span>Pawns auto-promote to Queen</span>
      </div>
    </div>
  );
}
