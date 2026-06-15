'use client';

import React, { useState, useCallback, useMemo } from 'react';

type Size = 'small' | 'medium' | 'large';
type ECLevel = 'L' | 'M' | 'Q' | 'H';

const SIZE_MAP: Record<Size, number> = { small: 200, medium: 300, large: 400 };
const EC_LABELS: Record<ECLevel, string> = { L: 'Low (7%)', M: 'Medium (15%)', Q: 'Quartile (25%)', H: 'High (30%)' };

// ---- GF(256) ----
const EXP = new Uint8Array(512);
const LOG = new Uint8Array(256);
{
  let x = 1;
  for (let i = 0; i < 255; i++) {
    EXP[i] = x;
    LOG[x] = i;
    x = (x << 1) ^ (x & 0x80 ? 0x11d : 0);
  }
  for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255];
}

function rsEncode(data: number[], nsym: number): number[] {
  let gen = [1];
  for (let i = 0; i < nsym; i++) {
    const ng = new Array(gen.length + 1).fill(0);
    for (let j = 0; j < gen.length; j++) {
      ng[j] ^= gen[j];
      ng[j + 1] ^= EXP[LOG[gen[j]] + i];
    }
    gen = ng;
  }
  const res = new Array(data.length + nsym).fill(0);
  for (let i = 0; i < data.length; i++) res[i] = data[i];
  for (let i = 0; i < data.length; i++) {
    const c = res[i];
    if (c !== 0) for (let j = 0; j < gen.length; j++) res[i + j] ^= EXP[LOG[gen[j]] + LOG[c]];
  }
  return res.slice(data.length);
}

// ---- Version tables ----
const TOTALCodewords: Record<number, number> = {
  1: 26, 2: 44, 3: 70, 4: 100, 5: 134, 6: 172, 7: 196, 8: 242, 9: 292, 10: 346,
};
const ECC_PER_BLOCK: Record<number, Record<string, [number, number]>> = {
  1:  { L: [7, 1], M: [10, 1], Q: [13, 1], H: [17, 1] },
  2:  { L: [10, 1], M: [16, 1], Q: [22, 1], H: [28, 1] },
  3:  { L: [15, 1], M: [26, 1], Q: [18, 2], H: [22, 2] },
  4:  { L: [20, 1], M: [18, 2], Q: [26, 2], H: [16, 4] },
  5:  { L: [26, 1], M: [24, 2], Q: [18, 2], H: [22, 2] },
  6:  { L: [18, 2], M: [16, 4], Q: [24, 4], H: [28, 4] },
  7:  { L: [20, 2], M: [18, 4], Q: [18, 6], H: [26, 5] },
  8:  { L: [24, 2], M: [22, 4], Q: [22, 6], H: [26, 6] },
  9:  { L: [30, 2], M: [22, 3], Q: [20, 8], H: [24, 8] },
  10: { L: [18, 2], M: [26, 4], Q: [24, 8], H: [28, 8] },
};
const DATA_CAPACITY: Record<number, Record<string, number>> = {};
for (const v of Object.keys(TOTALCodewords).map(Number)) {
  DATA_CAPACITY[v] = {};
  for (const ec of ['L', 'M', 'Q', 'H']) {
    const [ecPer, numBlocks] = ECC_PER_BLOCK[v][ec];
    const blockTotal = Math.floor(TOTALCodewords[v] / numBlocks);
    DATA_CAPACITY[v][ec] = blockTotal - ecPer;
  }
}

function getVersion(dataBytes: number, ec: string): number {
  for (let v = 1; v <= 10; v++) {
    if (dataBytes <= DATA_CAPACITY[v][ec]) return v;
  }
  return 10;
}

// ---- QR generation ----
function generateQR(text: string, ecLevel: ECLevel): boolean[][] {
  if (!text) return [];

  // Encode text as UTF-8 bytes
  const bytes: number[] = [];
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    if (c < 0x80) bytes.push(c);
    else if (c < 0x800) { bytes.push(0xc0 | (c >> 6), 0x80 | (c & 0x3f)); }
    else { bytes.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 0x3f), 0x80 | (c & 0x3f)); }
  }

  const version = getVersion(bytes.length, ecLevel);
  const size = version * 4 + 17;
  const [ecPerBlock, numBlocks] = ECC_PER_BLOCK[version][ecLevel];
  const dataCap = DATA_CAPACITY[version][ecLevel];
  const countBits = version <= 9 ? 8 : 16;

  // Build bitstream: mode(4) + count + data + terminator + padding
  const totalBits = (dataCap + ecPerBlock * numBlocks) * 8;
  let bs = '0100'; // byte mode
  bs += bytes.length.toString(2).padStart(countBits, '0');
  for (const b of bytes) bs += b.toString(2).padStart(8, '0');
  bs += '0'.repeat(Math.min(4, totalBits - bs.length));
  while (bs.length % 8) bs += '0';
  const pads = [0xec, 0x11];
  let pi = 0;
  while (bs.length < totalBits) { bs += pads[pi].toString(2).padStart(8, '0'); pi ^= 1; }

  // Convert to bytes
  const allBytes: number[] = [];
  for (let i = 0; i < bs.length; i += 8) allBytes.push(parseInt(bs.substring(i, i + 8), 2));

  // Split into blocks
  const dataBlocks: number[][] = [];
  const ecBlocks: number[][] = [];
  const blockSizes: number[] = [];
  let off = 0;
  const baseSize = Math.floor(dataCap / numBlocks);
  const extra = dataCap % numBlocks;
  for (let i = 0; i < numBlocks; i++) {
    const sz = baseSize + (i < extra ? 1 : 0);
    blockSizes.push(sz);
    const block = allBytes.slice(off, off + sz);
    dataBlocks.push(block);
    ecBlocks.push(rsEncode(block, ecPerBlock));
    off += sz;
  }

  // Interleave
  let bits = '';
  const maxD = Math.max(...blockSizes);
  for (let i = 0; i < maxD; i++) {
    for (let b = 0; b < numBlocks; b++) {
      if (i < dataBlocks[b].length) bits += dataBlocks[b][i].toString(2).padStart(8, '0');
    }
  }
  for (let i = 0; i < ecPerBlock; i++) {
    for (let b = 0; b < numBlocks; b++) {
      bits += ecBlocks[b][i].toString(2).padStart(8, '0');
    }
  }

  // Create matrix
  const m: (0 | 1 | null)[][] = Array.from({ length: size }, () => Array(size).fill(null));
  const set = (r: number, c: number, v: 0 | 1) => { if (r >= 0 && r < size && c >= 0 && c < size) m[r][c] = v; };

  // Finder patterns
  const pf = (row: number, col: number) => {
    for (let dr = -1; dr <= 7; dr++) {
      for (let dc = -1; dc <= 7; dc++) {
        const r = row + dr, c = col + dc;
        if (r < 0 || r >= size || c < 0 || c >= size) continue;
        const border = dr === 0 || dr === 6 || dc === 0 || dc === 6;
        const inner = dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4;
        const sep = dr === -1 || dr === 7 || dc === -1 || dc === 7;
        set(r, c, (border || inner) ? 1 : 0);
        if (sep) set(r, c, 0);
      }
    }
  };
  pf(0, 0);
  pf(0, size - 7);
  pf(size - 7, 0);

  // Timing
  for (let i = 8; i < size - 8; i++) { set(6, i, i % 2 === 0 ? 1 : 0); set(i, 6, i % 2 === 0 ? 1 : 0); }

  // Dark module
  set(size - 8, 8, 1);

  // Reserve format areas
  for (let i = 0; i <= 8; i++) {
    if (m[8][i] === null) set(8, i, 0);
    if (m[i][8] === null) set(i, 8, 0);
  }
  for (let i = 0; i < 7; i++) {
    if (m[8][size - 1 - i] === null) set(8, size - 1 - i, 0);
    if (m[size - 1 - i][8] === null) set(size - 1 - i, 8, 0);
  }

  // Place data in zigzag
  let bi = 0;
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (let vert = 0; vert < size; vert++) {
      for (let j = 0; j < 2; j++) {
        const c = right - j;
        const upward = ((right + 1) & 2) === 0;
        const row = upward ? size - 1 - vert : vert;
        if (c >= 0 && c < size && m[row][c] === null) {
          m[row][c] = bi < bits.length ? parseInt(bits[bi]) as 0 | 1 : 0;
          bi++;
        }
      }
    }
  }

  // Mask functions
  const masks = [
    (r: number, c: number) => (r + c) % 2 === 0,
    (r: number) => r % 2 === 0,
    (r: number, c: number) => c % 3 === 0,
    (r: number, c: number) => (r + c) % 3 === 0,
    (r: number, c: number) => (~~(r / 2) + ~~(c / 3)) % 2 === 0,
    (r: number, c: number) => ((r * c) % 2 + (r * c) % 3) === 0,
    (r: number, c: number) => ((r * c) % 2 + (r * c) % 3) % 2 === 0,
    (r: number, c: number) => ((r + c) % 2 + (r * c) % 3) % 2 === 0,
  ];

  const isReserved = (r: number, c: number) =>
    (r < 9 && c < 9) || (r < 9 && c >= size - 8) || (r >= size - 8 && c < 9) || r === 6 || c === 6;

  function writeFormat(mat: (0 | 1 | null)[][], mask: number) {
    const ecB = { L: 1, M: 0, Q: 3, H: 2 }[ecLevel];
    const d = (ecB << 3) | mask;
    let rem = d;
    for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >> 9) * 0x537);
    const bits = ((d << 10) | rem) ^ 0x5412;
    const pos1 = [[8,0],[8,1],[8,2],[8,3],[8,4],[8,5],[8,7],[8,8],[7,8],[5,8],[4,8],[3,8],[2,8],[1,8],[0,8]];
    const pos2 = [[size-1,8],[size-2,8],[size-3,8],[size-4,8],[size-5,8],[size-6,8],[size-7,8],
                   [8,size-8],[8,size-7],[8,size-6],[8,size-5],[8,size-4],[8,size-3],[8,size-2],[8,size-1]];
    for (let i = 0; i < 15; i++) {
      const b = ((bits >> i) & 1) as 0 | 1;
      mat[pos1[i][0]][pos1[i][1]] = b;
      mat[pos2[i][0]][pos2[i][1]] = b;
    }
  }

  // Choose best mask
  let bestMask = 0;
  let bestScore = Infinity;
  for (let mask = 0; mask < 8; mask++) {
    const t = m.map(r => [...r]);
    for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) {
      if (t[r][c] === null) t[r][c] = masks[mask](r, c) ? 1 : 0;
    }
    writeFormat(t, mask);
    let score = 0;
    for (let r = 0; r < size; r++) { let cnt = 1; for (let c = 1; c < size; c++) { if (t[r][c] === t[r][c-1]) cnt++; else { if (cnt >= 5) score += cnt - 2; cnt = 1; } } if (cnt >= 5) score += cnt - 2; }
    for (let c = 0; c < size; c++) { let cnt = 1; for (let r = 1; r < size; r++) { if (t[r][c] === t[r-1][c]) cnt++; else { if (cnt >= 5) score += cnt - 2; cnt = 1; } } if (cnt >= 5) score += cnt - 2; }
    if (score < bestScore) { bestScore = score; bestMask = mask; }
  }

  // Apply best mask
  for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) {
    if (m[r][c] === null) m[r][c] = masks[bestMask](r, c) ? 1 : 0;
  }
  writeFormat(m, bestMask);

  return m.map(r => r.map(v => v === 1));
}

// ---- React component ----
export default function QRCodeApp() {
  const [text, setText] = useState('');
  const [size, setSize] = useState<Size>('medium');
  const [ecLevel, setEcLevel] = useState<ECLevel>('M');
  const [hasGenerated, setHasGenerated] = useState(false);

  const qrData = useMemo(() => {
    if (!hasGenerated || !text.trim()) return null;
    return generateQR(text, ecLevel);
  }, [text, ecLevel, hasGenerated]);

  const svgMarkup = useMemo(() => {
    if (!qrData || qrData.length === 0) return '';
    const modules = qrData.length;
    const px = SIZE_MAP[size];
    const cell = Math.floor(px / (modules + 8));
    const off = Math.floor((px - modules * cell) / 2);
    const total = off * 2 + modules * cell;

    let rects = '';
    for (let r = 0; r < modules; r++) {
      for (let c = 0; c < modules; c++) {
        if (qrData[r][c]) {
          rects += `<rect x="${off + c * cell}" y="${off + r * cell}" width="${cell}" height="${cell}" fill="#000"/>`;
        }
      }
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} ${total}" width="${total}" height="${total}"><rect width="${total}" height="${total}" fill="#fff"/>${rects}</svg>`;
  }, [qrData, size]);

  const handleDownload = useCallback(() => {
    if (!svgMarkup) return;
    const blob = new Blob([svgMarkup], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'qr-code.svg';
    a.click();
    URL.revokeObjectURL(url);
  }, [svgMarkup]);

  const handleDownloadPNG = useCallback(() => {
    if (!qrData) return;
    const modules = qrData.length;
    const px = SIZE_MAP[size] * 2;
    const cell = Math.floor(px / (modules + 8));
    const off = Math.floor((px - modules * cell) / 2);
    const total = off * 2 + modules * cell;

    const canvas = document.createElement('canvas');
    canvas.width = total;
    canvas.height = total;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, total, total);
    ctx.fillStyle = '#000';
    for (let r = 0; r < modules; r++) {
      for (let c = 0; c < modules; c++) {
        if (qrData[r][c]) ctx.fillRect(off + c * cell, off + r * cell, cell, cell);
      }
    }
    const a = document.createElement('a');
    a.download = 'qr-code.png';
    a.href = canvas.toDataURL('image/png');
    a.click();
  }, [qrData, size]);

  return (
    <div className="qr-container">
      <div className="qr-input-section">
        <label className="qr-label">Text / URL</label>
        <input
          className="qr-input"
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Enter text or URL..."
          onKeyDown={(e) => { if (e.key === 'Enter') setHasGenerated(true); }}
        />
      </div>

      <div className="qr-options">
        <div className="qr-option-group">
          <label className="qr-label">Size</label>
          <div className="qr-option-btns">
            {(['small', 'medium', 'large'] as Size[]).map((s) => (
              <button key={s} className={`qr-opt-btn ${size === s ? 'qr-opt-btn--active' : ''}`} onClick={() => setSize(s)}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="qr-option-group">
          <label className="qr-label">Error Correction</label>
          <div className="qr-option-btns">
            {(['L', 'M', 'Q', 'H'] as ECLevel[]).map((level) => (
              <button key={level} className={`qr-opt-btn ${ecLevel === level ? 'qr-opt-btn--active' : ''}`}
                onClick={() => setEcLevel(level)} title={EC_LABELS[level]}>
                {level}
              </button>
            ))}
          </div>
        </div>
      </div>

      <button className="qr-generate-btn" onClick={() => setHasGenerated(true)}>Generate QR Code</button>

      {hasGenerated && svgMarkup && (
        <div className="qr-preview">
          <div className="qr-canvas" dangerouslySetInnerHTML={{ __html: svgMarkup }} />
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button className="qr-download-btn" onClick={handleDownloadPNG}>Download PNG</button>
            <button className="qr-download-btn" onClick={handleDownload}>Download SVG</button>
          </div>
        </div>
      )}

      {!hasGenerated && (
        <div className="qr-placeholder">
          <span className="qr-placeholder-icon">&#9641;</span>
          <span className="qr-placeholder-text">Enter text and click Generate</span>
        </div>
      )}
    </div>
  );
}
