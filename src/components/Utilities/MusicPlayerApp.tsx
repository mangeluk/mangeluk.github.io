'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';

interface Song {
  id: number;
  title: string;
  artist: string;
  duration: number;
  color: string;
}

const PLAYLIST: Song[] = [
  { id: 1, title: 'Digital Dreams', artist: 'Synthwave Corp', duration: 234, color: '#ff6b6b' },
  { id: 2, title: 'Neon Nights', artist: 'Retro Future', duration: 198, color: '#4ecdc4' },
  { id: 3, title: 'Cyber City', artist: 'Electric Pulse', duration: 267, color: '#45b7d1' },
  { id: 4, title: 'Midnight Run', artist: 'Synthwave Corp', duration: 312, color: '#96ceb4' },
  { id: 5, title: 'Pixel Paradise', artist: 'Chiptune Masters', duration: 189, color: '#ffeaa7' },
  { id: 6, title: 'Starlight Express', artist: 'Cosmic DJ', duration: 245, color: '#dfe6e9' },
  { id: 7, title: 'Voltage', artist: 'Electric Pulse', duration: 278, color: '#fd79a8' },
  { id: 8, title: 'Retro Wave', artist: 'Retro Future', duration: 201, color: '#a29bfe' },
  { id: 9, title: 'Binary Sunset', artist: 'Cosmic DJ', duration: 356, color: '#fab1a0' },
  { id: 10, title: 'Electric Feel', artist: 'Chiptune Masters', duration: 223, color: '#81ecec' },
];

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export default function MusicPlayerApp() {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(75);
  const [visualizerBars] = useState(() => Array.from({ length: 20 }, () => Math.random()));
  const [vizValues, setVizValues] = useState(visualizerBars);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(null);

  const current = PLAYLIST[currentIdx];

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setProgress((prev) => {
          if (prev >= current.duration) {
            setCurrentIdx((i) => (i + 1) % PLAYLIST.length);
            return 0;
          }
          return prev + 1;
        });
        setVizValues(Array.from({ length: 20 }, () => Math.random()));
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, current.duration]);

  const handlePlayPause = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, []);

  const handleNext = useCallback(() => {
    setCurrentIdx((prev) => (prev + 1) % PLAYLIST.length);
    setProgress(0);
  }, []);

  const handlePrev = useCallback(() => {
    setCurrentIdx((prev) => (prev - 1 + PLAYLIST.length) % PLAYLIST.length);
    setProgress(0);
  }, []);

  const handleSongClick = useCallback((idx: number) => {
    setCurrentIdx(idx);
    setProgress(0);
    setIsPlaying(true);
  }, []);

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setVolume(Number(e.target.value));
  }, []);

  const progressPercent = (progress / current.duration) * 100;

  return (
    <div className="music-container">
      <div className="music-now-playing">
        <div className="music-album-art" style={{ background: `linear-gradient(135deg, ${current.color}, ${current.color}88)` }}>
          <div className="music-viz">
            {vizValues.map((v, i) => (
              <div
                key={i}
                className="music-viz-bar"
                style={{
                  height: isPlaying ? `${20 + v * 60}%` : '10%',
                  background: current.color,
                }}
              />
            ))}
          </div>
        </div>
        <div className="music-song-info">
          <div className="music-song-title">{current.title}</div>
          <div className="music-song-artist">{current.artist}</div>
        </div>
      </div>

      <div className="music-progress">
        <span className="music-time">{formatTime(progress)}</span>
        <div className="music-progress-bar" onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const pct = (e.clientX - rect.left) / rect.width;
          setProgress(Math.floor(pct * current.duration));
        }}>
          <div className="music-progress-fill" style={{ width: `${progressPercent}%` }} />
          <div className="music-progress-thumb" style={{ left: `${progressPercent}%` }} />
        </div>
        <span className="music-time">{formatTime(current.duration)}</span>
      </div>

      <div className="music-controls">
        <button className="music-ctrl-btn" onClick={handlePrev}>{'\u23EE'}</button>
        <button className="music-ctrl-btn music-ctrl-btn--play" onClick={handlePlayPause}>
          {isPlaying ? '\u23F8' : '\u25B6'}
        </button>
        <button className="music-ctrl-btn" onClick={handleNext}>{'\u23ED'}</button>
      </div>

      <div className="music-volume">
        <span>{'\uD83D\uDD0A'}</span>
        <input
          type="range"
          min="0"
          max="100"
          value={volume}
          onChange={handleVolumeChange}
          className="music-volume-slider"
        />
        <span>{volume}%</span>
      </div>

      <div className="music-playlist">
        <div className="music-playlist-header">Playlist</div>
        {PLAYLIST.map((song, idx) => (
          <button
            key={song.id}
            className={`music-playlist-item ${idx === currentIdx ? 'music-playlist-item--active' : ''}`}
            onClick={() => handleSongClick(idx)}
          >
            <span className="music-playlist-num">{idx + 1}</span>
            <div className="music-playlist-info">
              <span className="music-playlist-title">{song.title}</span>
              <span className="music-playlist-artist">{song.artist}</span>
            </div>
            <span className="music-playlist-dur">{formatTime(song.duration)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
