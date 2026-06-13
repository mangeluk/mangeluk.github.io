'use client';

import React, { useEffect, useRef } from 'react';

interface MatrixRainProps {
  duration?: number; // in milliseconds, default 5000 (5 seconds)
}

const MatrixRain: React.FC<MatrixRainProps> = ({ duration = 5000 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number | null>(null);
  const dropsRef = useRef<number[]>([]);
  const startTimeRef = useRef<number>(Date.now());

  const fontSize = 14;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to match container
    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      const columns = Math.floor(canvas.width / fontSize);
      dropsRef.current = new Array(columns).fill(1);
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const chars = '01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン';

    const draw = () => {
      if (!canvas || !ctx) return;

      // Semi-transparent black to create trail effect
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = '#0f0'; // Matrix green
      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < dropsRef.current.length; i++) {
        const text = chars[Math.floor(Math.random() * chars.length)];
        ctx.fillText(text, i * fontSize, dropsRef.current[i] * fontSize);

        if (dropsRef.current[i] * fontSize > canvas.height && Math.random() > 0.975) {
          dropsRef.current[i] = 0;
        }
        dropsRef.current[i]++;
      }

      requestRef.current = requestAnimationFrame(draw);
    };

    draw();

    const timeout = setTimeout(() => {
      if (requestRef.current !== null) cancelAnimationFrame(requestRef.current);
      window.removeEventListener('resize', resizeCanvas);
    }, duration);

    return () => {
      if (requestRef.current !== null) cancelAnimationFrame(requestRef.current);
      clearTimeout(timeout);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [duration]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: '100%',
        height: '100%',
        display: 'block',
      }}
    />
  );
};

export default MatrixRain;
