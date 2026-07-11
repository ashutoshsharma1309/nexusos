'use client';

import { useSettingsStore } from '@/features/settings/store';

/** Dims the whole screen to match the Control Center brightness setting. Sits above
 *  all chrome but ignores pointer events so it never blocks interaction. */
export function BrightnessOverlay() {
  const brightness = useSettingsStore((s) => s.brightness);
  if (brightness >= 1) return null;
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[95] bg-black transition-opacity duration-200"
      style={{ opacity: 1 - brightness }}
    />
  );
}
