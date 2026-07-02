import { motion } from 'framer-motion';
import { spring } from '@/lib/motion';
import type { Rect } from '@/lib/geometry';

/** Translucent overlay showing where a window will land when released on a snap
 *  edge. Animates its geometry so moving between zones glides rather than jumps. */
export function SnapPreview({ rect }: { rect: Rect }) {
  return (
    <motion.div
      aria-hidden
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1, left: rect.x, top: rect.y, width: rect.width, height: rect.height }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={spring.snappy}
      style={{ position: 'absolute', zIndex: 5 }}
      className="pointer-events-none rounded-window border-2 border-accent/60 bg-accent/[0.12] shadow-[0_0_40px_-8px_rgb(var(--color-accent)/0.5)] backdrop-blur-sm"
    />
  );
}
