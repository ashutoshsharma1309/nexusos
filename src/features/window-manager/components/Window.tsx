'use client';

import { memo, Suspense, useMemo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/cn';
import { spring, duration, ease } from '@/lib/motion';
import { getApp } from '@/features/apps/registry';
import { rectForSnapZone } from '@/lib/geometry';
import { useWindowStore } from '../store';
import { useWindowDrag } from '../hooks/useWindowDrag';
import { useWindowResize } from '../hooks/useWindowResize';
import type { WindowInstance } from '../types';
import { TitleBar } from './TitleBar';
import { ResizeHandles } from './ResizeHandles';
import { SnapPreview } from './SnapPreview';
import { AppFallback } from './AppFallback';

/** Where a window flies to when minimized — the dock, bottom-center. */
function dockTarget(win: WindowInstance) {
  if (typeof window === 'undefined') return { x: 0, y: 400 };
  const cx = win.rect.x + win.rect.width / 2;
  const cy = win.rect.y + win.rect.height / 2;
  return { x: window.innerWidth / 2 - cx, y: window.innerHeight - cy };
}

function WindowImpl({ win }: { win: WindowInstance }) {
  const focus = useWindowStore((s) => s.focus);
  const { onPointerDown, snapZone } = useWindowDrag(win);
  const { startResize } = useWindowResize(win);
  const app = getApp(win.appId);
  const Body = app.component;

  const maximized = win.state === 'maximized';
  const minimized = win.state === 'minimized';
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1440;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 900;

  const animate = useMemo(() => {
    if (minimized) {
      const t = dockTarget(win);
      return { opacity: 0, scale: 0.18, x: t.x, y: t.y, filter: 'blur(4px)' };
    }
    return { opacity: 1, scale: 1, x: 0, y: 0, filter: 'blur(0px)' };
  }, [minimized, win]);

  return (
    <>
      {snapZone && <SnapPreview rect={rectForSnapZone(snapZone, vw, vh)} />}
      <motion.div
        role="dialog"
        aria-label={win.title}
        aria-modal={false}
        aria-hidden={minimized}
        initial={{ opacity: 0, scale: 0.9, y: 24 }}
        animate={animate}
        exit={{ opacity: 0, scale: 0.92, y: 8, transition: { duration: duration.fast, ease: ease.in } }}
        transition={minimized ? spring.glide : spring.window}
        onPointerDownCapture={() => !minimized && focus(win.id)}
        style={{
          position: 'absolute',
          left: win.rect.x,
          top: win.rect.y,
          width: win.rect.width,
          height: win.rect.height,
          zIndex: win.zIndex,
          transformOrigin: 'center bottom',
          pointerEvents: minimized ? 'none' : 'auto',
          boxShadow: win.focused ? 'var(--shadow-window-focused)' : 'var(--shadow-window)',
        }}
        className={cn(
          'glass flex flex-col overflow-hidden',
          maximized ? 'rounded-none' : 'rounded-window',
          win.focused ? 'ring-1 ring-white/[0.12]' : 'ring-1 ring-black/20',
          !win.focused && !minimized && 'saturate-[0.92]',
        )}
      >
        <TitleBar win={win} onPointerDown={onPointerDown} />
        <div className="relative min-h-0 flex-1 bg-surface/30">
          <Suspense fallback={<AppFallback />}>
            <Body window={win} />
          </Suspense>
        </div>
        {!maximized && <ResizeHandles onStart={startResize} />}
      </motion.div>
    </>
  );
}

export const Window = memo(WindowImpl);
