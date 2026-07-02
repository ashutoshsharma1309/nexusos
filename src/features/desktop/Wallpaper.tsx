'use client';

import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useEffect } from 'react';
import { Particles } from './Particles';

/**
 * Animated wallpaper: a theme-driven base gradient (--wallpaper), slow-drifting
 * blur blobs with subtle pointer parallax, a pointer-tracking ambient glow, a
 * fine grain overlay, and floating particles. All layers are GPU-composited.
 */
export function Wallpaper() {
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const px = useSpring(mx, { stiffness: 40, damping: 20 });
  const py = useSpring(my, { stiffness: 40, damping: 20 });

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      mx.set((e.clientX / window.innerWidth - 0.5) * 2);
      my.set((e.clientY / window.innerHeight - 0.5) * 2);
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, [mx, my]);

  const blobAX = useTransform(px, (v) => v * 40);
  const blobAY = useTransform(py, (v) => v * 40);
  const blobBX = useTransform(px, (v) => v * -30);
  const blobBY = useTransform(py, (v) => v * -30);

  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: 'var(--wallpaper)' }}>
      <motion.div
        style={{ x: blobAX, y: blobAY }}
        className="absolute -left-40 -top-40 h-[42rem] w-[42rem] rounded-full bg-accent/25 blur-[120px]"
      >
        <motion.div
          className="h-full w-full rounded-full"
          animate={{ scale: [1, 1.12, 1] }}
          transition={{ duration: 24, repeat: Infinity, ease: 'easeInOut' }}
        />
      </motion.div>
      <motion.div
        style={{ x: blobBX, y: blobBY }}
        className="absolute -right-52 top-1/4 h-[38rem] w-[38rem] rounded-full bg-fg/[0.08] blur-[130px]"
      >
        <motion.div
          className="h-full w-full rounded-full"
          animate={{ scale: [1, 1.18, 1] }}
          transition={{ duration: 32, repeat: Infinity, ease: 'easeInOut' }}
        />
      </motion.div>

      {/* Pointer-tracking ambient glow. */}
      <div className="ambient-glow absolute inset-0" />

      {/* Fine grain for texture — keeps large gradients from banding. */}
      <div
        className="absolute inset-0 opacity-[0.035] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />

      <Particles />

      {/* Top vignette so the menu bar stays legible on light wallpapers. */}
      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/25 to-transparent" />
    </div>
  );
}
