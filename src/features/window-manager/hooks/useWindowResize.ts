import { useCallback, useRef } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { clamp, type Rect } from '@/lib/geometry';
import { useWindowStore } from '../store';
import type { WindowInstance } from '../types';

export type ResizeEdge = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

const MIN_W = 320;
const MIN_H = 200;

/** Eight-way pointer resize with per-edge min-size clamping. */
export function useWindowResize(win: WindowInstance) {
  const setRect = useWindowStore((s) => s.setRect);
  const focus = useWindowStore((s) => s.focus);
  const restore = useWindowStore((s) => s.restore);
  const origin = useRef<{ px: number; py: number; rect: Rect } | null>(null);

  const startResize = useCallback(
    (edge: ResizeEdge) => (event: ReactPointerEvent) => {
      if (event.button !== 0) return;
      event.stopPropagation();
      focus(win.id);
      if (win.state === 'maximized') restore(win.id);

      origin.current = { px: event.clientX, py: event.clientY, rect: win.rect };
      (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
      const vh = window.innerHeight;

      const onMove = (e: PointerEvent) => {
        if (!origin.current) return;
        const dx = e.clientX - origin.current.px;
        const dy = e.clientY - origin.current.py;
        const r = origin.current.rect;
        const next: Rect = { ...r };

        if (edge.includes('e')) next.width = Math.max(MIN_W, r.width + dx);
        if (edge.includes('s')) next.height = clamp(r.height + dy, MIN_H, vh - r.y);
        if (edge.includes('w')) {
          const width = Math.max(MIN_W, r.width - dx);
          next.x = r.x + (r.width - width);
          next.width = width;
        }
        if (edge.includes('n')) {
          const height = Math.max(MIN_H, r.height - dy);
          next.y = Math.max(0, r.y + (r.height - height));
          next.height = height;
        }
        setRect(win.id, next);
      };

      const onUp = () => {
        origin.current = null;
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
      };

      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
    },
    [win, focus, restore, setRect],
  );

  return { startResize };
}
