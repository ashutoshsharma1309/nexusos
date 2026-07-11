'use client';

import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Fuse from 'fuse.js';
import { Search } from 'lucide-react';
import { cn } from '@/lib/cn';
import { duration, ease } from '@/lib/motion';
import { APP_LIST, type AppDefinition } from '@/features/apps/registry';
import { useWindowStore } from '@/features/window-manager/store';
import { useLaunchpadStore } from './store';

const COLUMNS = 5;

/** A full-screen, macOS-style app grid with fuzzy search and keyboard navigation. */
export function Launchpad() {
  const isOpen = useLaunchpadStore((s) => s.isOpen);
  const close = useLaunchpadStore((s) => s.close);
  const open = useWindowStore((s) => s.open);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);

  const fuse = useMemo(() => new Fuse(APP_LIST, { keys: ['title'], threshold: 0.4 }), []);
  const apps: AppDefinition[] = useMemo(
    () => (query.trim() ? fuse.search(query).map((r) => r.item) : APP_LIST),
    [query, fuse],
  );

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setActive(0);
    }
  }, [isOpen]);

  useEffect(() => setActive(0), [query]);

  const launch = (app: AppDefinition | undefined) => {
    if (!app) return;
    close();
    open({ appId: app.id, singleton: true });
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') return close();
    if (e.key === 'Enter') return launch(apps[active]);
    const moves: Record<string, number> = {
      ArrowRight: 1,
      ArrowLeft: -1,
      ArrowDown: COLUMNS,
      ArrowUp: -COLUMNS,
    };
    if (e.key in moves) {
      e.preventDefault();
      setActive((i) => Math.max(0, Math.min(apps.length - 1, i + moves[e.key]!)));
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="glass-heavy fixed inset-0 z-modal flex flex-col items-center px-6 pt-[12vh]"
          initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: duration.base, ease: ease.out }}
          onPointerDown={close}
          onKeyDown={onKeyDown}
          role="dialog"
          aria-label="Launchpad"
        >
          <div
            className="mb-10 flex w-full max-w-sm items-center gap-2.5 rounded-full bg-fg/10 px-4 py-2.5"
            onPointerDown={(e) => e.stopPropagation()}
          >
            <Search className="h-4 w-4 text-fg-muted" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search apps…"
              aria-label="Search apps"
              className="w-full bg-transparent text-sm text-fg outline-none placeholder:text-fg-muted"
            />
          </div>

          <motion.div
            className="grid w-full max-w-3xl grid-cols-4 gap-x-6 gap-y-8 sm:grid-cols-5"
            onPointerDown={(e) => e.stopPropagation()}
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.02 } } }}
          >
            {apps.map((app, index) => {
              const Icon = app.icon;
              return (
                <motion.button
                  key={app.id}
                  type="button"
                  onClick={() => launch(app)}
                  onPointerEnter={() => setActive(index)}
                  variants={{
                    hidden: { opacity: 0, scale: 0.8 },
                    visible: { opacity: 1, scale: 1 },
                  }}
                  className="group flex flex-col items-center gap-2"
                >
                  <span
                    className={cn(
                      'grid h-16 w-16 place-items-center rounded-[22px] border border-white/15 shadow-lg transition-transform',
                      'group-hover:scale-105 group-active:scale-95',
                      index === active && 'ring-2 ring-accent ring-offset-2 ring-offset-transparent',
                    )}
                    style={{ background: `linear-gradient(155deg, rgb(${app.tint} / 0.95), rgb(${app.tint} / 0.5))` }}
                  >
                    <Icon className="h-8 w-8 text-white drop-shadow" />
                  </span>
                  <span className="max-w-[5.5rem] truncate text-xs font-medium text-fg drop-shadow">
                    {app.title}
                  </span>
                </motion.button>
              );
            })}
            {apps.length === 0 && (
              <p className="col-span-full pt-8 text-center text-sm text-fg-muted">No apps found.</p>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
