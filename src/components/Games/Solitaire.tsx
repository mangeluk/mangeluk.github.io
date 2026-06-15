'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';

type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';

interface Card {
  suit: Suit;
  rank: Rank;
  faceUp: boolean;
  id: string;
}

type Pile = Card[];
type Foundation = Pile[];
type Tableau = Pile[];

interface DragInfo {
  cardId: string;
  sourceType: 'tableau' | 'stock' | 'waste';
  sourceIndex: number;
  cardIndex: number;
}

interface DragState {
  cards: Card[];
  sourceType: 'tableau' | 'waste';
  sourceIndex: number;
  cardIndex: number;
  offsetX: number;
  offsetY: number;
  x: number;
  y: number;
}

interface GameState {
  stock: Pile;
  waste: Pile;
  foundations: Foundation;
  tableau: Tableau;
  score: number;
  moves: number;
  won: boolean;
}

const SUITS: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
const RANKS: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const SUIT_SYMBOLS: Record<Suit, string> = { hearts: '\u2665', diamonds: '\u2666', clubs: '\u2663', spades: '\u2660' };
const RANK_VALUES: Record<Rank, number> = { A: 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, J: 11, Q: 12, K: 13 };

function createDeck(): Pile {
  const deck: Pile = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ suit, rank, faceUp: false, id: `${rank}-${suit}` });
    }
  }
  return shuffle(deck);
}

function shuffle(deck: Pile): Pile {
  const d = [...deck];
  for (let i = d.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [d[i], d[j]] = [d[j], d[i]];
  }
  return d;
}

function isRed(suit: Suit): boolean {
  return suit === 'hearts' || suit === 'diamonds';
}

function canPlaceOnFoundation(foundation: Pile, card: Card): boolean {
  if (foundation.length === 0) return card.rank === 'A';
  const top = foundation[foundation.length - 1];
  return top.suit === card.suit && RANK_VALUES[card.rank] === RANK_VALUES[top.rank] + 1;
}

function canPlaceOnTableau(pile: Pile, card: Card): boolean {
  if (pile.length === 0) return card.rank === 'K';
  const top = pile[pile.length - 1];
  return top.faceUp && top.suit !== card.suit && RANK_VALUES[card.rank] === RANK_VALUES[top.rank] - 1;
}

function initGame(): GameState {
  const deck = createDeck();
  const tableau: Tableau = [[], [], [], [], [], [], []];

  let idx = 0;
  for (let col = 0; col < 7; col++) {
    for (let row = 0; row <= col; row++) {
      const card = { ...deck[idx], faceUp: row === col };
      tableau[col].push(card);
      idx++;
    }
  }

  const stock = deck.slice(idx).map((c) => ({ ...c, faceUp: false }));

  return {
    stock,
    waste: [],
    foundations: [[], [], [], []],
    tableau,
    score: 0,
    moves: 0,
    won: false,
  };
}

function scoreForMove(destType: string): number {
  if (destType === 'foundation') return 10;
  if (destType === 'waste-to-tableau') return 5;
  if (destType === 'turn-over') return 5;
  return 0;
}

function SolitaireHelp({ onClose }: { onClose: () => void }) {
  return (
    <div className="game-overlay" onClick={onClose}>
      <div className="game-overlay-text" style={{ maxWidth: 400, textAlign: 'left' }} onClick={(e) => e.stopPropagation()}>
        <div className="game-over-title" style={{ textAlign: 'center' }}>Solitaire Help</div>
        <div style={{ fontSize: 12, lineHeight: 1.6, color: '#ccc' }}>
          <p><b style={{ color: '#00ff9f' }}>Drag:</b> Drag face-up cards to tableau or foundation piles.</p>
          <p><b style={{ color: '#00ff9f' }}>Tableau:</b> Place cards in descending rank, alternating colors (e.g. red 7 on black 8).</p>
          <p><b style={{ color: '#00ff9f' }}>Foundation:</b> Build up by suit from Ace to King.</p>
          <p><b style={{ color: '#00ff9f' }}>Double-click:</b> Auto-places a card to its foundation.</p>
          <p><b style={{ color: '#00ff9f' }}>Stock pile:</b> Click to draw cards to waste. Click empty stock to recycle.</p>
          <p><b style={{ color: '#00ff9f' }}>Auto Complete:</b> Button automatically moves all eligible cards to foundations.</p>
          <p><b style={{ color: '#00ff9f' }}>ESC:</b> Start a new game.</p>
        </div>
        <div style={{ textAlign: 'center', marginTop: 12 }}>
          <button className="game-btn" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

export default function SolitaireGame() {
  const [gs, setGs] = useState<GameState>(initGame);
  const [showHelp, setShowHelp] = useState(false);
  const [dragInfo, setDragInfo] = useState<DragInfo | null>(null);
  const dragRef = useRef<DragInfo | null>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const dragStateRef = useRef<DragState | null>(null);
  const isDraggingRef = useRef(false);

  const handleNewGame = useCallback(() => {
    setGs(initGame());
    setDragState(null);
    dragStateRef.current = null;
    isDraggingRef.current = false;
  }, []);

  const handleDragStart = useCallback((e: React.MouseEvent, cards: Card[], sourceType: 'tableau' | 'waste', sourceIndex: number, cardIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;
    const state: DragState = {
      cards,
      sourceType,
      sourceIndex,
      cardIndex,
      offsetX,
      offsetY,
      x: e.clientX - offsetX,
      y: e.clientY - offsetY,
    };
    dragStateRef.current = state;
    isDraggingRef.current = true;
    setDragState(state);
  }, []);

  const findDropTarget = useCallback((clientX: number, clientY: number): { type: 'foundation' | 'tableau'; index: number } | null => {
    const el = document.elementFromPoint(clientX, clientY);
    if (!el) return null;
    const target = (el as HTMLElement).closest('[data-pile]');
    if (!target) return null;
    const pileType = target.getAttribute('data-pile');
    const pileIndex = parseInt(target.getAttribute('data-pile-index') ?? '-1', 10);
    if (pileType === 'foundation' && pileIndex >= 0 && pileIndex < 4) {
      return { type: 'foundation', index: pileIndex };
    }
    if (pileType === 'tableau' && pileIndex >= 0 && pileIndex < 7) {
      return { type: 'tableau', index: pileIndex };
    }
    return null;
  }, []);

  const handleDragEnd = useCallback((clientX: number, clientY: number) => {
    const ds = dragStateRef.current;
    if (!ds) return;
    isDraggingRef.current = false;
    setDragState(null);
    dragStateRef.current = null;

    const target = findDropTarget(clientX, clientY);
    if (!target) return;

    if (target.type === 'foundation') {
      // Only single cards can go to foundation
      if (ds.cards.length !== 1) return;
      const card = ds.cards[0];
      setGs((prev) => {
        const foundation = [...prev.foundations[target.index]];
        if (!canPlaceOnFoundation(foundation, card)) return prev;
        const s = { ...prev };
        let sourcePile: Card[];
        if (ds.sourceType === 'waste') {
          sourcePile = [...s.waste];
          sourcePile.pop();
          s.waste = sourcePile;
        } else {
          sourcePile = [...s.tableau[ds.sourceIndex]];
          sourcePile.pop();
          s.tableau = s.tableau.map((p, i) => (i === ds.sourceIndex ? sourcePile : p));
        }
        foundation.push({ ...card, faceUp: true });
        s.foundations = s.foundations.map((f, i) => (i === target.index ? foundation : f));
        s.score += scoreForMove('foundation');
        s.moves += 1;
        if (ds.sourceType === 'tableau' && sourcePile.length > 0 && !sourcePile[sourcePile.length - 1].faceUp) {
          sourcePile[sourcePile.length - 1] = { ...sourcePile[sourcePile.length - 1], faceUp: true };
          s.score += scoreForMove('turn-over');
        }
        const allFaceUp = s.foundations.every((f) => f.length === 13);
        s.won = allFaceUp;
        return s;
      });
    } else {
      // Tableau drop
      setGs((prev) => {
        const s = { ...prev };
        let cardsToMove: Card[];
        let sourcePile: Card[];
        if (ds.sourceType === 'waste') {
          const card = s.waste[s.waste.length - 1];
          if (!card) return prev;
          cardsToMove = [card];
          s.waste = s.waste.slice(0, -1);
        } else {
          sourcePile = [...s.tableau[ds.sourceIndex]];
          cardsToMove = sourcePile.slice(ds.cardIndex);
          s.tableau = s.tableau.map((p, i) => (i === ds.sourceIndex ? sourcePile.slice(0, ds.cardIndex) : p));
        }
        const targetPile = [...s.tableau[target.index]];
        const firstCard = cardsToMove[0];
        if (!canPlaceOnTableau(targetPile, firstCard)) {
          if (ds.sourceType === 'waste') {
            s.waste = [...s.waste, firstCard];
          } else {
            const pile = [...s.tableau[ds.sourceIndex], ...cardsToMove];
            s.tableau = s.tableau.map((p, i) => (i === ds.sourceIndex ? pile : p));
          }
          return prev;
        }
        targetPile.push(...cardsToMove.map((c) => ({ ...c, faceUp: true })));
        s.tableau = s.tableau.map((p, i) => (i === target.index ? targetPile : p));
        s.score += cardsToMove.length > 1 ? cardsToMove.length : scoreForMove('waste-to-tableau');
        s.moves += 1;
        if (ds.sourceType === 'tableau') {
          const srcPile = s.tableau[ds.sourceIndex];
          if (srcPile.length > 0 && !srcPile[srcPile.length - 1].faceUp) {
            srcPile[srcPile.length - 1] = { ...srcPile[srcPile.length - 1], faceUp: true };
            s.score += scoreForMove('turn-over');
          }
        }
        return s;
      });
    }
    setDragInfo(null);
    dragRef.current = null;
  }, [findDropTarget]);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      const ds = dragStateRef.current;
      if (!ds) return;
      const updated: DragState = {
        ...ds,
        x: e.clientX - ds.offsetX,
        y: e.clientY - ds.offsetY,
      };
      dragStateRef.current = updated;
      setDragState(updated);
    };
    const onMouseUp = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      handleDragEnd(e.clientX, e.clientY);
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [handleDragEnd]);

  const handleStockClick = useCallback(() => {
    setGs((prev) => {
      if (prev.stock.length === 0) {
        const wasteReversed = [...prev.waste].reverse().map((c) => ({ ...c, faceUp: false }));
        return { ...prev, stock: wasteReversed, waste: [], moves: prev.moves + 1 };
      }
      const card = prev.stock[prev.stock.length - 1];
      return {
        ...prev,
        stock: prev.stock.slice(0, -1),
        waste: [...prev.waste, { ...card, faceUp: true }],
        moves: prev.moves + 1,
      };
    });
  }, []);

  const handleFoundationClick = useCallback((foundationIdx: number) => {
    if (!dragInfo) return;
    setGs((prev) => {
      const s = { ...prev };
      let card: Card | undefined;
      let sourcePile: Card[];

      if (dragInfo.sourceType === 'waste') {
        sourcePile = [...s.waste];
        card = sourcePile.pop();
        s.waste = sourcePile;
      } else if (dragInfo.sourceType === 'tableau') {
        const pile = [...s.tableau[dragInfo.sourceIndex]];
        card = pile.pop();
        s.tableau = s.tableau.map((p, i) => (i === dragInfo.sourceIndex ? pile : p));
      } else {
        return prev;
      }

      if (!card) return prev;
      const foundation = [...s.foundations[foundationIdx]];
      if (!canPlaceOnFoundation(foundation, card)) {
        if (dragInfo.sourceType === 'waste') s.waste = [...s.waste, card];
        else if (dragInfo.sourceType === 'tableau') {
          const pile = [...s.tableau[dragInfo.sourceIndex], card];
          s.tableau = s.tableau.map((p, i) => (i === dragInfo.sourceIndex ? pile : p));
        }
        return prev;
      }

      foundation.push({ ...card, faceUp: true });
      s.foundations = s.foundations.map((f, i) => (i === foundationIdx ? foundation : f));
      s.score += scoreForMove('foundation');
      s.moves += 1;

      if (dragInfo.sourceType === 'tableau') {
        const pile = s.tableau[dragInfo.sourceIndex];
        if (pile.length > 0 && !pile[pile.length - 1].faceUp) {
          pile[pile.length - 1] = { ...pile[pile.length - 1], faceUp: true };
          s.score += scoreForMove('turn-over');
        }
      }

      const allFaceUp = s.foundations.every((f) => f.length === 13);
      s.won = allFaceUp;
      return s;
    });
    setDragInfo(null);
    dragRef.current = null;
  }, [dragInfo]);

  const handleTableauClick = useCallback((colIdx: number, cardIdx?: number) => {
    if (!dragInfo) {
      if (cardIdx !== undefined) {
        const pile = gs.tableau[colIdx];
        if (cardIdx < pile.length) {
          setDragInfo({ cardId: pile[cardIdx].id, sourceType: 'tableau', sourceIndex: colIdx, cardIndex: cardIdx });
          dragRef.current = { cardId: pile[cardIdx].id, sourceType: 'tableau', sourceIndex: colIdx, cardIndex: cardIdx };
        }
      }
      return;
    }

    setGs((prev) => {
      const s = { ...prev };
      let cardsToMove: Card[];
      let sourcePile: Card[];

      if (dragInfo.sourceType === 'waste') {
        const card = s.waste[s.waste.length - 1];
        if (!card) return prev;
        cardsToMove = [card];
        s.waste = s.waste.slice(0, -1);
      } else if (dragInfo.sourceType === 'tableau') {
        sourcePile = [...s.tableau[dragInfo.sourceIndex]];
        cardsToMove = sourcePile.slice(dragInfo.cardIndex);
        s.tableau = s.tableau.map((p, i) => (i === dragInfo.sourceIndex ? sourcePile.slice(0, dragInfo.cardIndex) : p));
      } else {
        return prev;
      }

      const targetPile = [...s.tableau[colIdx]];
      const firstCard = cardsToMove[0];
      if (!canPlaceOnTableau(targetPile, firstCard)) {
        if (dragInfo.sourceType === 'waste') s.waste = [...s.waste, firstCard];
        else {
          const pile = [...s.tableau[dragInfo.sourceIndex], ...cardsToMove];
          s.tableau = s.tableau.map((p, i) => (i === dragInfo.sourceIndex ? pile : p));
        }
        return prev;
      }

      targetPile.push(...cardsToMove.map((c) => ({ ...c, faceUp: true })));
      s.tableau = s.tableau.map((p, i) => (i === colIdx ? targetPile : p));
      s.score += cardsToMove.length > 1 ? cardsToMove.length : scoreForMove('waste-to-tableau');
      s.moves += 1;

      if (dragInfo.sourceType === 'tableau') {
        const srcPile = s.tableau[dragInfo.sourceIndex];
        if (srcPile.length > 0 && !srcPile[srcPile.length - 1].faceUp) {
          srcPile[srcPile.length - 1] = { ...srcPile[srcPile.length - 1], faceUp: true };
          s.score += scoreForMove('turn-over');
        }
      }

      return s;
    });
    setDragInfo(null);
    dragRef.current = null;
  }, [dragInfo, gs.tableau]);

  const handleDoubleClick = useCallback((colIdx: number, cardIdx: number) => {
    const pile = gs.tableau[colIdx];
    if (cardIdx !== pile.length - 1) return;
    const card = pile[cardIdx];
    if (!card.faceUp) return;

    for (let f = 0; f < 4; f++) {
      if (canPlaceOnFoundation(gs.foundations[f], card)) {
        setGs((prev) => {
          const s = { ...prev };
          const sourcePile = [...s.tableau[colIdx]];
          sourcePile.pop();
          s.tableau = s.tableau.map((p, i) => (i === colIdx ? sourcePile : p));
          const foundation = [...s.foundations[f], { ...card, faceUp: true }];
          s.foundations = s.foundations.map((fd, i) => (i === f ? foundation : fd));
          s.score += scoreForMove('foundation');
          s.moves += 1;
          if (sourcePile.length > 0 && !sourcePile[sourcePile.length - 1].faceUp) {
            sourcePile[sourcePile.length - 1] = { ...sourcePile[sourcePile.length - 1], faceUp: true };
            s.score += scoreForMove('turn-over');
          }
          const allFaceUp = s.foundations.every((fd) => fd.length === 13);
          s.won = allFaceUp;
          return s;
        });
        break;
      }
    }
  }, [gs.tableau, gs.foundations]);

  const handleWasteDoubleClick = useCallback(() => {
    if (gs.waste.length === 0) return;
    const card = gs.waste[gs.waste.length - 1];
    for (let f = 0; f < 4; f++) {
      if (canPlaceOnFoundation(gs.foundations[f], card)) {
        setGs((prev) => {
          const s = { ...prev };
          const wastePile = [...s.waste];
          wastePile.pop();
          const foundation = [...s.foundations[f], { ...card, faceUp: true }];
          s.foundations = s.foundations.map((fd, i) => (i === f ? foundation : fd));
          s.waste = wastePile;
          s.score += scoreForMove('foundation');
          s.moves += 1;
          const allFaceUp = s.foundations.every((fd) => fd.length === 13);
          s.won = allFaceUp;
          return s;
        });
        break;
      }
    }
  }, [gs.waste, gs.foundations]);

  const handleAutoComplete = useCallback(() => {
    setGs((prev) => {
      const s = { ...prev };
      let changed = true;
      while (changed) {
        changed = false;
        for (let c = 0; c < 7; c++) {
          const pile = s.tableau[c];
          if (pile.length === 0) continue;
          const card = pile[pile.length - 1];
          if (!card.faceUp) continue;
          for (let f = 0; f < 4; f++) {
            if (canPlaceOnFoundation(s.foundations[f], card)) {
              const newPile = pile.slice(0, -1);
              const newFoundation = [...s.foundations[f], { ...card, faceUp: true }];
              s.tableau = s.tableau.map((p, i) => (i === c ? newPile : p));
              s.foundations = s.foundations.map((fd, i) => (i === f ? newFoundation : fd));
              s.score += scoreForMove('foundation');
              if (newPile.length > 0 && !newPile[newPile.length - 1].faceUp) {
                newPile[newPile.length - 1] = { ...newPile[newPile.length - 1], faceUp: true };
              }
              changed = true;
              break;
            }
          }
        }
        if (s.waste.length > 0) {
          const card = s.waste[s.waste.length - 1];
          for (let f = 0; f < 4; f++) {
            if (canPlaceOnFoundation(s.foundations[f], card)) {
              s.waste = s.waste.slice(0, -1);
              s.foundations = s.foundations.map((fd, i) => (i === f ? [...fd, { ...card, faceUp: true }] : fd));
              s.score += scoreForMove('foundation');
              changed = true;
              break;
            }
          }
        }
      }
      const allFaceUp = s.foundations.every((f) => f.length === 13);
      s.won = allFaceUp;
      return s;
    });
  }, []);

  const cardColor = (suit: Suit) => (isRed(suit) ? 'var(--solitaire-red)' : 'var(--solitaire-black)');

  const renderCard = (card: Card, style?: React.CSSProperties) => {
    if (!card.faceUp) {
      return (
        <div
          className="solitaire-card solitaire-card--back"
          style={style}
        >
          <div className="solitaire-card-back-pattern" />
        </div>
      );
    }
    return (
      <div
        className="solitaire-card solitaire-card--front"
        style={{ ...style, color: cardColor(card.suit) }}
      >
        <div className="solitaire-card-corner solitaire-card-corner--tl">
          <span className="solitaire-card-rank">{card.rank}</span>
          <span className="solitaire-card-suit">{SUIT_SYMBOLS[card.suit]}</span>
        </div>
        <div className="solitaire-card-center">{SUIT_SYMBOLS[card.suit]}</div>
        <div className="solitaire-card-corner solitaire-card-corner--br">
          <span className="solitaire-card-rank">{card.rank}</span>
          <span className="solitaire-card-suit">{SUIT_SYMBOLS[card.suit]}</span>
        </div>
      </div>
    );
  };

  const topWaste = gs.waste[gs.waste.length - 1];

  return (
    <div className="game-container solitaire-container">
      <div className="solitaire-header">
        <span className="game-score">Solitaire</span>
        <button className="game-btn" onClick={() => setShowHelp(true)} title="Help">?</button>
        <span className="game-controls">Moves: {gs.moves}</span>
        <span className="game-controls">Score: {gs.score}</span>
      </div>

      <div className="solitaire-layout">
        <div className="solitaire-top-row">
          <div className="solitaire-top-left">
            <div
              className="solitaire-pile solitaire-stock"
              onClick={handleStockClick}
            >
              {gs.stock.length > 0 ? renderCard({ ...gs.stock[gs.stock.length - 1], faceUp: false }) : <div className="solitaire-empty-pile solitaire-empty-pile--stock" />}
              {gs.stock.length > 0 && <span className="solitaire-pile-count">{gs.stock.length}</span>}
            </div>
            <div
              className="solitaire-pile solitaire-waste"
              onClick={() => { if (!isDraggingRef.current) handleWasteDoubleClick(); }}
              onDoubleClick={handleWasteDoubleClick}
            >
              {topWaste ? (
                <div
                  onMouseDown={(e) => {
                    handleDragStart(e, [topWaste], 'waste', -1, gs.waste.length - 1);
                  }}
                >
                  {renderCard(topWaste)}
                </div>
              ) : <div className="solitaire-empty-pile" />}
            </div>
          </div>
          <div className="solitaire-top-right">
            {[0, 1, 2, 3].map((fIdx) => (
              <div
                key={fIdx}
                className="solitaire-pile solitaire-foundation"
                data-pile="foundation"
                data-pile-index={fIdx}
                onClick={() => handleFoundationClick(fIdx)}
              >
                {gs.foundations[fIdx].length > 0
                  ? renderCard(gs.foundations[fIdx][gs.foundations[fIdx].length - 1])
                  : <div className="solitaire-empty-pile solitaire-empty-pile--foundation" />}
              </div>
            ))}
          </div>
        </div>

        <div className="solitaire-tableau">
          {gs.tableau.map((pile, colIdx) => (
            <div
              key={colIdx}
              className="solitaire-tableau-col"
              data-pile="tableau"
              data-pile-index={colIdx}
              onClick={(e) => {
                if (e.target === e.currentTarget) handleTableauClick(colIdx);
              }}
            >
              {pile.length === 0 && <div className="solitaire-empty-pile solitaire-empty-pile--tableau" />}
              {pile.map((card, cardIdx) => {
                const isDragged = dragState !== null
                  && dragState.sourceType === 'tableau'
                  && dragState.sourceIndex === colIdx
                  && cardIdx >= dragState.cardIndex;
                return (
                  <div
                    key={card.id}
                    className="solitaire-card-wrapper"
                    style={{
                      top: cardIdx * 20,
                      opacity: isDragged ? 0.3 : 1,
                      pointerEvents: isDragged ? 'none' : 'auto',
                    }}
                    onMouseDown={(e) => {
                      if (!card.faceUp) return;
                      handleDragStart(e, pile.slice(cardIdx), 'tableau', colIdx, cardIdx);
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isDraggingRef.current) return;
                      if (card.faceUp) handleTableauClick(colIdx, cardIdx);
                    }}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      handleDoubleClick(colIdx, cardIdx);
                    }}
                  >
                    {renderCard(card)}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="solitaire-controls">
        <button className="game-btn" onClick={handleNewGame}>New Game</button>
        <button className="game-btn" onClick={handleAutoComplete}>Auto Complete</button>
      </div>

      {dragState && (
        <div
          className="solitaire-drag-ghost"
          style={{
            position: 'fixed',
            left: dragState.x,
            top: dragState.y,
            zIndex: 9999,
            pointerEvents: 'none',
          }}
        >
          {dragState.cards.map((card, i) => (
            <div
              key={card.id}
              style={{ position: 'absolute', top: i * 20 }}
            >
              {renderCard(card)}
            </div>
          ))}
        </div>
      )}

      {showHelp && <SolitaireHelp onClose={() => setShowHelp(false)} />}

      {gs.won && (
        <div className="game-overlay">
          <div className="game-overlay-text">
            <div className="game-over-title">YOU WIN!</div>
            <div className="game-over-score">Score: {gs.score}</div>
            <div className="game-over-hint">Moves: {gs.moves}</div>
            <button className="game-btn" style={{ marginTop: 12 }} onClick={handleNewGame}>Play Again</button>
          </div>
        </div>
      )}

      <div className="game-footer">
        <span>Drag cards or click to select</span>
        <span>Double-click for auto-place</span>
        <span>ESC New game</span>
      </div>
    </div>
  );
}
