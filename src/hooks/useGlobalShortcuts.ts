'use client';

import { useEffect } from 'react';
import { useWindowStore } from '@/features/window-manager/store';
import { useLauncherStore } from '@/features/launcher/store';
import { useShortcutsStore } from '@/components/ShortcutsOverlay';

/**
 * System-wide keyboard shortcuts:
 *  - ⌘K / Ctrl+K   toggle command palette
 *  - ⌘/ / Ctrl+/   toggle the shortcuts cheat sheet
 *  - ⌘W / Ctrl+W   close the focused window
 *  - ⌘M / Ctrl+M   minimize the focused window
 *  - Ctrl+`        cycle window focus
 */
export function useGlobalShortcuts(): void {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;

      if (mod && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        useLauncherStore.getState().toggle();
        return;
      }

      if (mod && e.key === '/') {
        e.preventDefault();
        useShortcutsStore.getState().toggle();
        return;
      }

      if (e.ctrlKey && e.key === '`') {
        e.preventDefault();
        useWindowStore.getState().cycleFocus(e.shiftKey ? -1 : 1);
        return;
      }

      const focused = useWindowStore.getState().windows.find((w) => w.focused && w.state !== 'minimized');
      if (!focused) return;

      if (mod && e.key.toLowerCase() === 'w') {
        e.preventDefault();
        useWindowStore.getState().close(focused.id);
      } else if (mod && e.key.toLowerCase() === 'm') {
        e.preventDefault();
        useWindowStore.getState().minimize(focused.id);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);
}
