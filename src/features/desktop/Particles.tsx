'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';

interface Particle {
  id: number;
  x: number;
  size: number;
  duration: number;
  delay: number;
  drift: number;
}

/** Slow ambient motes drifting upward. Purely decorative and GPU-composited;
 *  hidden entirely when the user prefers reduced motion (see globals.css). */
export function Particles({ count = 18 }: { count?: number }) {
  const particles = useMemo<Particle[]>(
    () =>
      Array.from({ length: count }, (_, id) => ({
        id,
        x: Math.random() * 100,
        size: 1 + Math.random() * 2.5,
        duration: 18 + Math.random() * 22,
        delay: Math.random() * -40,
        drift: (Math.random() - 0.5) * 60,
      })),
    [count],
  );

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {particles.map((p) => (
        <motion.span
          key={p.id}
          className="absolute rounded-full bg-fg/40"
          style={{ left: `${p.x}%`, width: p.size, height: p.size, bottom: -10 }}
          animate={{ y: [0, -window.innerHeight - 40], x: [0, p.drift], opacity: [0, 0.7, 0.7, 0] }}
          transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: 'linear' }}
        />
      ))}
    </div>
  );
}
