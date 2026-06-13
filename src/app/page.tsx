// src/app/page.tsx
// Full-page background with terminal panel.
// Requirements: 17.1, 17.2, 17.4, 18.1, 19.1

import React from 'react';
import Terminal from '@/components/Terminal/Terminal';

export default function Page() {
  return (
    <main className="relative min-h-screen flex items-center justify-center">
      {/* Full-viewport background image (Req. 17.1) */}
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/bg.jpg')" }}
        aria-hidden="true"
      >
        {/* Dark overlay for contrast (Req. 17.2) */}
        <div className="absolute inset-0 bg-black/75" />
      </div>

      {/* Terminal panel — desktop: centered max-900px 80vh; mobile: full screen (Req. 18.1, 19.1) */}
      <div className="relative z-10 w-full h-[100dvh] md:h-[80vh] md:max-w-[900px] md:px-4">
        <Terminal />
      </div>
    </main>
  );
}
