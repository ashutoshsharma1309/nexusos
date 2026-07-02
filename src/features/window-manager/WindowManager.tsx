'use client';

import { AnimatePresence } from 'framer-motion';
import { useWindowStore } from './store';
import { Window } from './components/Window';

/** Renders every window. Minimized windows stay mounted and animate toward the
 *  dock (handled inside Window) so minimize/restore is a continuous motion rather
 *  than an unmount; only close removes a window, exiting via AnimatePresence. */
export function WindowManager() {
  const windows = useWindowStore((s) => s.windows);

  return (
    <AnimatePresence>
      {windows.map((win) => (
        <Window key={win.id} win={win} />
      ))}
    </AnimatePresence>
  );
}
