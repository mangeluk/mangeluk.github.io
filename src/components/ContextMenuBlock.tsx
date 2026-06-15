'use client';

import { useEffect } from 'react';

export default function ContextMenuBlock() {
  useEffect(() => {
    const handler = (e: Event) => e.preventDefault();
    document.addEventListener('contextmenu', handler);
    return () => document.removeEventListener('contextmenu', handler);
  }, []);

  return null;
}
