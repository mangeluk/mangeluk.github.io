// src/app/page.tsx
// Full-page desktop environment with terminal window.

import React from 'react';
import { Desktop } from '@/components/Desktop';

export default function Page() {
  return (
    <main className="relative min-h-screen">
      <Desktop />
    </main>
  );
}
