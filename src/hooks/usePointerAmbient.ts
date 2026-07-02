'use client';

import { useEffect } from 'react';

/**
 * Tracks the pointer and writes its position to `--pointer-x/--pointer-y` on the
 * root element (rAF-throttled to one write per frame). Surfaces like the wallpaper
 * glow read these vars, so the lighting follows the cursor without React renders.
 */
export function usePointerAmbient(): void {
  useEffect(() => {
    let frame = 0;
    let px = 50;
    let py = 40;

    const onMove = (e: PointerEvent) => {
      px = (e.clientX / window.innerWidth) * 100;
      py = (e.clientY / window.innerHeight) * 100;
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const root = document.documentElement.style;
        root.setProperty('--pointer-x', `${px}%`);
        root.setProperty('--pointer-y', `${py}%`);
      });
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      window.removeEventListener('pointermove', onMove);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);
}
