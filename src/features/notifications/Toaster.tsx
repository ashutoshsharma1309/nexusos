'use client';

import { useEffect, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { spring } from '@/lib/motion';
import { cn } from '@/lib/cn';
import { useNotificationStore } from './store';
import { TONE_COLOR, TONE_ICON } from './toneStyles';

const TOAST_TTL = 5000;

/** Transient stacked toasts in the top-right, auto-dismissed after a TTL. */
export function Toaster() {
  // Select the stable `items` reference; deriving a new array inside the selector
  // would break useSyncExternalStore's snapshot caching and loop.
  const items = useNotificationStore((s) => s.items);
  const dismiss = useNotificationStore((s) => s.dismissToast);
  const toasts = useMemo(() => items.filter((i) => i.toast).slice(0, 4), [items]);

  useEffect(() => {
    const timers = toasts.map((t) => window.setTimeout(() => dismiss(t.id), TOAST_TTL));
    return () => timers.forEach(window.clearTimeout);
  }, [toasts, dismiss]);

  return (
    <div className="pointer-events-none fixed right-3 top-11 z-toast flex w-80 flex-col gap-2">
      <AnimatePresence initial={false}>
        {toasts.map((t) => {
          const Icon = TONE_ICON[t.tone];
          return (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, x: 40, scale: 0.96 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40, scale: 0.96 }}
              transition={spring.snappy}
              className="glass-strong pointer-events-auto flex items-start gap-3 rounded-xl p-3 shadow-popover"
            >
              <Icon className={cn('mt-0.5 h-4 w-4 shrink-0', TONE_COLOR[t.tone])} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-fg">{t.title}</p>
                {t.body && <p className="mt-0.5 text-xs text-fg-muted">{t.body}</p>}
              </div>
              <button
                type="button"
                aria-label="Dismiss notification"
                onClick={() => dismiss(t.id)}
                className="rounded p-0.5 text-fg-muted transition-colors hover:text-fg"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
