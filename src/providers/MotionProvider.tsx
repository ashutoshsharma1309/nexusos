'use client';

import { MotionConfig } from 'framer-motion';
import { useSettingsStore } from '@/features/settings/store';

/**
 * Bridges the reduced-motion preference into Framer Motion. Without this, only
 * CSS transitions honor the setting — every spring/keyframe animation (windows,
 * dock, toasts, wallpaper) would keep moving. `reducedMotion="user"` respects the
 * OS setting; the in-app Settings toggle escalates it to "always".
 */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  const motion = useSettingsStore((s) => s.motion);
  return (
    <MotionConfig reducedMotion={motion === 'reduced' ? 'always' : 'user'}>{children}</MotionConfig>
  );
}
