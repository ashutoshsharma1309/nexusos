import { useCallback, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { clamp, detectSnapZone, rectForSnapZone, type Rect, type SnapZone } from '@/lib/geometry';
import { isMobileViewport } from '@/lib/viewport';
import { useWindowStore } from '../store';
import type { WindowInstance } from '../types';

const TITLEBAR_KEEP = 40;

/**
 * Pointer-driven window dragging with live snap-zone detection. Returns an
 * onPointerDown handler for the title bar plus the currently previewed snap zone
 * so the shell can render a translucent snap overlay.
 */
export function useWindowDrag(win: WindowInstance) {
  const setRect = useWindowStore((s) => s.setRect);
  const snap = useWindowStore((s) => s.snap);
  const restore = useWindowStore((s) => s.restore);
  const focus = useWindowStore((s) => s.focus);
  const [snapZone, setSnapZone] = useState<SnapZone>(null);
  const origin = useRef<{ px: number; py: number; rect: Rect } | null>(null);

  const onPointerDown = useCallback(
    (event: ReactPointerEvent) => {
      if (event.button !== 0) return;
      // Ignore drags that start on interactive controls in the title bar.
      if ((event.target as HTMLElement).closest('[data-no-drag]')) return;
      focus(win.id);
      // On phones windows are full-bleed; dragging/snapping would only misplace them.
      if (isMobileViewport()) return;

      const startRect = win.state === 'maximized' && win.restoreRect ? win.restoreRect : win.rect;
      origin.current = { px: event.clientX, py: event.clientY, rect: startRect };
      (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);

      const vw = window.innerWidth;
      const vh = window.innerHeight;

      const onMove = (e: PointerEvent) => {
        if (!origin.current) return;
        const dx = e.clientX - origin.current.px;
        const dy = e.clientY - origin.current.py;
        const { rect } = origin.current;
        const next: Rect = {
          x: clamp(rect.x + dx, -rect.width + 80, vw - 80),
          y: clamp(rect.y + dy, 0, vh - TITLEBAR_KEEP),
          width: rect.width,
          height: rect.height,
        };
        setRect(win.id, next);
        setSnapZone(detectSnapZone(e.clientX, e.clientY, vw));
      };

      const onUp = (e: PointerEvent) => {
        const zone = detectSnapZone(e.clientX, e.clientY, vw);
        if (zone) snap(win.id, rectForSnapZone(zone, vw, vh));
        else if (win.state === 'maximized') restore(win.id);
        setSnapZone(null);
        origin.current = null;
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
      };

      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
    },
    [win, focus, setRect, snap, restore],
  );

  return { onPointerDown, snapZone };
}
