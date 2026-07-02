'use client';

import { useEffect } from 'react';
import { useSettingsStore } from '@/features/settings/store';

/**
 * Reflects the settings store onto the <html> element as data-* attributes and
 * CSS variables. Keeping this in one effect means theme changes are a single,
 * cheap DOM write rather than a React re-render cascade.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const hydrate = useSettingsStore((s) => s.hydrate);
  const { theme, accent, motion, contrast, reduceTransparency } = useSettingsStore();

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = theme;
    root.dataset.motion = motion === 'reduced' ? 'reduced' : 'full';
    root.dataset.contrast = contrast === 'high' ? 'high' : 'normal';
    root.dataset.transparency = reduceTransparency ? 'reduced' : 'full';
    if (accent) root.style.setProperty('--color-accent', accent);
    else root.style.removeProperty('--color-accent');
  }, [theme, accent, motion, contrast, reduceTransparency]);

  return <>{children}</>;
}
