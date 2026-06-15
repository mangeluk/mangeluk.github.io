'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';

export default function DoomGame() {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
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
            Click inside the game to play | WASD: Move | Mouse: Look | Ctrl: Shoot | Space: Open doors
          </span>
          <button className="doom-fullscreen-btn" onClick={requestFullscreen}>
            Fullscreen (F)
          </button>
        </div>
      )}
    </div>
  );
}
