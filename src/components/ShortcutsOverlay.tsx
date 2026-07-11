'use client';

import { useEffect } from 'react';
import { create } from 'zustand';
import { AnimatePresence, motion } from 'framer-motion';
import { Keyboard, X } from 'lucide-react';
import { popVariants } from '@/lib/motion';
import { IconButton } from '@/components/ui/IconButton';

interface ShortcutsStore {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

/** Visibility of the keyboard-shortcuts cheat sheet (toggle with ⌘/). */
export const useShortcutsStore = create<ShortcutsStore>((set, get) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  toggle: () => set({ isOpen: !get().isOpen }),
}));

const GROUPS: { title: string; items: [string, string][] }[] = [
  {
    title: 'System',
    items: [
      ['⌘ K', 'Command palette'],
      ['⌘ /', 'This shortcuts panel'],
      ['Esc', 'Close menus & overlays'],
    ],
  },
  {
    title: 'Windows',
    items: [
      ['⌘ W', 'Close focused window'],
      ['⌘ M', 'Minimize focused window'],
      ['Ctrl `', 'Cycle window focus'],
      ['Drag ↦ edge', 'Snap-tile window'],
      ['Double-click bar', 'Maximize / restore'],
    ],
  },
  {
    title: 'Code',
    items: [
      ['⌘ ↵', 'Run the current file'],
      ['Tab', 'Accept terminal suggestion'],
    ],
  },
];

/** A grouped keyboard-shortcuts reference, surfaced with ⌘/ for discoverability. */
export function ShortcutsOverlay() {
  const isOpen = useShortcutsStore((s) => s.isOpen);
  const close = useShortcutsStore((s) => s.close);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, close]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-modal flex items-center justify-center p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onPointerDown={close}
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" aria-hidden />
          <motion.div
            role="dialog"
            aria-label="Keyboard shortcuts"
            variants={popVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onPointerDown={(e) => e.stopPropagation()}
            className="glass-strong relative w-[min(560px,92vw)] rounded-2xl p-5 shadow-popover"
          >
            <div className="mb-4 flex items-center gap-2">
              <Keyboard className="h-4 w-4 text-accent" />
              <h2 className="text-sm font-semibold text-fg">Keyboard Shortcuts</h2>
              <div className="ml-auto">
                <IconButton icon={X} label="Close" size="md" onClick={close} />
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-3">
              {GROUPS.map((group) => (
                <div key={group.title}>
                  <p className="mb-2 text-2xs font-semibold uppercase tracking-wide text-fg-muted">
                    {group.title}
                  </p>
                  <ul className="space-y-2">
                    {group.items.map(([keys, label]) => (
                      <li key={label} className="flex flex-col gap-1">
                        <kbd className="w-fit rounded-md bg-fg/10 px-1.5 py-0.5 font-mono text-[11px] text-fg">
                          {keys}
                        </kbd>
                        <span className="text-xs text-fg-muted">{label}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
