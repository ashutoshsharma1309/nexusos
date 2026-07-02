import { useEffect, useRef } from 'react';
import {
  motion,
  useAnimationControls,
  useSpring,
  useTransform,
  type MotionValue,
} from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';
import { spring } from '@/lib/motion';

interface Props {
  icon: LucideIcon;
  label: string;
  tint: string;
  running: boolean;
  focused?: boolean;
  badge?: number;
  /** Shared pointer x within the dock; -1 when the pointer has left. */
  mouseX: MotionValue<number>;
  onClick: () => void;
  onContextMenu?: (event: React.MouseEvent) => void;
}

const BASE = 46;
const MAX = 78;
const INFLUENCE = 130;

/** A single dock item: magnifies toward the cursor, bounces on launch, and shows
 *  running + notification state. */
export function DockIcon({
  icon: Icon,
  label,
  tint,
  running,
  focused,
  badge,
  mouseX,
  onClick,
  onContextMenu,
}: Props) {
  const ref = useRef<HTMLButtonElement>(null);
  const controls = useAnimationControls();
  const prevRunning = useRef(running);

  // Distance from cursor → magnified size, smoothed by a spring.
  const distance = useTransform(mouseX, (x) => {
    if (x < 0 || !ref.current) return INFLUENCE * 2;
    const bounds = ref.current.getBoundingClientRect();
    return x - (bounds.left + bounds.width / 2);
  });
  const sizeTarget = useTransform(distance, [-INFLUENCE, 0, INFLUENCE], [BASE, MAX, BASE]);
  const size = useSpring(sizeTarget, { mass: 0.1, stiffness: 220, damping: 15 });

  // Bounce once when the app transitions from not-running to running.
  useEffect(() => {
    if (running && !prevRunning.current) {
      void controls.start({ y: [0, -18, 0, -7, 0], transition: { duration: 0.7, times: [0, 0.3, 0.55, 0.78, 1] } });
    }
    prevRunning.current = running;
  }, [running, controls]);

  return (
    <motion.button
      ref={ref}
      type="button"
      aria-label={running ? `${label} (running)` : label}
      onClick={onClick}
      onContextMenu={onContextMenu}
      animate={controls}
      style={{ width: size, height: size }}
      whileTap={{ scale: 0.84 }}
      className="group relative grid shrink-0 place-items-center"
    >
      <span
        className="grid h-full w-full place-items-center rounded-[30%] border border-white/15 shadow-[0_6px_16px_-6px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.25)]"
        style={{ background: `linear-gradient(155deg, rgb(${tint} / 0.95), rgb(${tint} / 0.5))` }}
      >
        <Icon className="h-[46%] w-[46%] text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]" />
      </span>

      {badge ? (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={spring.bouncy}
          className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-danger px-1 text-[9px] font-bold text-white shadow ring-2 ring-black/30"
        >
          {badge > 9 ? '9+' : badge}
        </motion.span>
      ) : null}

      <span
        className={cn(
          'pointer-events-none absolute -top-10 whitespace-nowrap rounded-lg px-2.5 py-1',
          'glass-strong text-xs font-medium text-fg opacity-0 shadow-popover',
          'translate-y-1 transition-all duration-150 group-hover:-translate-y-0 group-hover:opacity-100',
        )}
      >
        {label}
      </span>

      {/* Running indicator: a dot that stretches into a pill when focused. */}
      <span
        className={cn(
          'absolute -bottom-1 h-1 rounded-full bg-fg transition-all duration-300',
          running ? 'opacity-90' : 'opacity-0',
          focused ? 'w-4' : 'w-1',
        )}
      />
    </motion.button>
  );
}
