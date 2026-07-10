'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Fuse from 'fuse.js';
import { spring } from '@/lib/motion';
import { Search, CornerDownLeft } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useLauncherStore } from './store';
import { buildCommands, type Command } from './commands';

export function CommandPalette() {
  const isOpen = useLauncherStore((s) => s.isOpen);
  const close = useLauncherStore((s) => s.close);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const commands = useMemo(() => (isOpen ? buildCommands() : []), [isOpen]);
  const fuse = useMemo(
    () => new Fuse(commands, { keys: ['title', 'keywords', 'subtitle'], threshold: 0.4 }),
    [commands],
  );

  const results: Command[] = useMemo(() => {
    if (!query.trim()) return commands;
    return fuse.search(query).map((r) => r.item);
  }, [query, fuse, commands]);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setActive(0);
      // Focus after the enter animation begins.
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [isOpen]);

  useEffect(() => setActive(0), [query]);

  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  const runAt = (index: number) => {
    const cmd = results[index];
    if (!cmd) return;
    close();
    cmd.run();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      runAt(active);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      close();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-modal flex items-start justify-center pt-[14vh]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onPointerDown={close}
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" aria-hidden />
          <motion.div
            role="dialog"
            aria-label="Command palette"
            initial={{ opacity: 0, scale: 0.97, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -8 }}
            transition={spring.snappy}
            onPointerDown={(e) => e.stopPropagation()}
            className="glass-strong relative w-[min(640px,92vw)] overflow-hidden rounded-2xl shadow-popover"
          >
            <div className="flex items-center gap-3 border-b border-border/10 px-4">
              <Search className="h-4 w-4 shrink-0 text-fg-muted" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Search apps, themes and commands…"
                aria-label="Command search"
                className="h-12 flex-1 bg-transparent text-sm text-fg outline-none placeholder:text-fg-muted"
              />
              <kbd className="rounded bg-fg/5 px-1.5 py-0.5 text-[10px] text-fg-muted">ESC</kbd>
            </div>

            <div ref={listRef} className="max-h-[46vh] overflow-y-auto p-2">
              {results.length === 0 ? (
                <p className="px-3 py-8 text-center text-sm text-fg-muted">No results.</p>
              ) : (
                results.map((cmd, index) => {
                  const Icon = cmd.icon;
                  return (
                    <button
                      key={cmd.id}
                      type="button"
                      data-index={index}
                      onPointerEnter={() => setActive(index)}
                      onClick={() => runAt(index)}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors',
                        index === active ? 'bg-accent/20' : 'hover:bg-fg/5',
                      )}
                    >
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-fg/5">
                        <Icon className="h-4 w-4 text-fg" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm text-fg">{cmd.title}</span>
                        <span className="block truncate text-xs text-fg-muted">{cmd.subtitle}</span>
                      </span>
                      {index === active && (
                        <CornerDownLeft className="h-3.5 w-3.5 shrink-0 text-fg-muted" />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
