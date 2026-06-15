'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';

function DoomHelp({ onClose }: { onClose: () => void }) {
  return (
    <div className="game-overlay" onClick={onClose}>
      <div className="game-overlay-text" style={{ maxWidth: 400, textAlign: 'left' }} onClick={(e) => e.stopPropagation()}>
        <div className="game-over-title" style={{ textAlign: 'center' }}>DOOM Controls</div>
        <div style={{ fontSize: 12, lineHeight: 1.6, color: '#ccc' }}>
          <p><b style={{ color: '#00ff9f' }}>Movement:</b></p>
          <p>W = Forward &nbsp; S = Backward &nbsp; A = Strafe left &nbsp; D = Strafe right</p>
          <p><b style={{ color: '#00ff9f' }}>Actions:</b></p>
          <p>Mouse = Look around &nbsp; Ctrl = Shoot &nbsp; Space = Open doors/switches</p>
          <p><b style={{ color: '#00ff9f' }}>Keys:</b></p>
          <p>1-7 = Select weapon &nbsp; Shift = Run &nbsp; F = Toggle fullscreen</p>
          <p><b style={{ color: '#00ff9f' }}>General:</b></p>
          <p>Click inside the game to capture mouse. Press Esc to release.</p>
        </div>
        <div style={{ textAlign: 'center', marginTop: 12 }}>
          <button className="game-btn" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

export default function DoomGame() {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handleLoad = useCallback(() => {
    setLoaded(true);
  }, []);

  const handleError = useCallback(() => {
    setError(true);
  }, []);

  const requestFullscreen = useCallback(() => {
    const iframe = iframeRef.current;
    if (iframe) {
      try {
        iframe.requestFullscreen?.();
      } catch {}
    }
  }, []);

  const handleClick = useCallback(() => {
    iframeRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'f' || e.key === 'F') {
        requestFullscreen();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [requestFullscreen]);

  return (
    <div className="game-container game-doom" onClick={handleClick}>
      {showHelp && <DoomHelp onClose={() => setShowHelp(false)} />}

      {!loaded && !error && (
        <div className="doom-loading">
          <div className="doom-loading-text">Loading DOOM...</div>
          <div className="doom-loading-bar">
            <div className="doom-loading-bar-fill" />
          </div>
          <div className="doom-loading-hint">The original MS-DOS DOOM (1993) via WebAssembly</div>
        </div>
      )}

      {error && (
        <div className="doom-loading">
          <div className="doom-loading-text" style={{ color: '#ff4444' }}>
            Failed to load DOOM
          </div>
          <div className="doom-loading-hint">
            Try refreshing the page or check your connection
          </div>
        </div>
      )}

      <div className={`doom-iframe-wrapper ${loaded ? 'doom-iframe-wrapper--loaded' : ''}`}>
        <iframe
          ref={iframeRef}
          src="/doom/index.html"
          className="doom-iframe"
          onLoad={handleLoad}
          onError={handleError}
          allow="fullscreen; gamepad; keyboard"
          title="DOOM - Original MS-DOS Game"
        />
      </div>

      {loaded && (
        <div className="doom-controls-bar">
          <span className="doom-controls-text">
            Click inside to play | WASD: Move | Mouse: Look | Ctrl: Shoot | Space: Open doors
          </span>
          <button className="doom-fullscreen-btn" onClick={(e) => { e.stopPropagation(); setShowHelp(true); }} title="Help">?</button>
          <button className="doom-fullscreen-btn" onClick={requestFullscreen}>
            Fullscreen (F)
          </button>
        </div>
      )}
    </div>
  );
}
