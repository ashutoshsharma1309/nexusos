import type { Transition, Variants } from 'framer-motion';

/**
 * The single source of truth for Nexus motion. Every surface pulls its physics
 * from here so the whole system shares one "hand". Springs are tuned by feel:
 * heavier surfaces (windows) settle slower than transient ones (menus, toasts).
 */
export const spring = {
  /** Windows: weighty, a hint of overshoot, never bouncy. */
  window: { type: 'spring', stiffness: 380, damping: 34, mass: 0.9 },
  /** Snappy UI — popovers, palette, sheets. */
  snappy: { type: 'spring', stiffness: 520, damping: 38, mass: 0.6 },
  /** Playful — dock bounce, reactions. */
  bouncy: { type: 'spring', stiffness: 600, damping: 18, mass: 0.7 },
  /** Gentle glide for large travel (notification center, minimize). */
  glide: { type: 'spring', stiffness: 300, damping: 36, mass: 1 },
} satisfies Record<string, Transition>;

export const ease = {
  /** Standard product ease — calm entrances/exits. */
  standard: [0.22, 1, 0.36, 1],
  /** Decelerate — things arriving from off-screen. */
  out: [0.16, 1, 0.3, 1],
  /** Accelerate — things leaving. */
  in: [0.4, 0, 1, 1],
} as const;

export const duration = {
  instant: 0.12,
  fast: 0.18,
  base: 0.24,
  slow: 0.36,
} as const;

/** Shared entrance/exit for floating surfaces (menus, palette, popovers). */
export const popVariants: Variants = {
  hidden: { opacity: 0, scale: 0.96, y: -6 },
  visible: { opacity: 1, scale: 1, y: 0, transition: spring.snappy },
  exit: { opacity: 0, scale: 0.97, y: -4, transition: { duration: duration.fast, ease: ease.in } },
};

/** Staggered list reveal used by menus and command results. */
export const staggerParent: Variants = {
  visible: { transition: { staggerChildren: 0.022, delayChildren: 0.02 } },
};

export const staggerChild: Variants = {
  hidden: { opacity: 0, y: 4 },
  visible: { opacity: 1, y: 0, transition: { duration: duration.base, ease: ease.out } },
};
