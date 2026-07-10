'use client';

import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { BellOff, Trash2, X } from 'lucide-react';
import { spring } from '@/lib/motion';
import { cn } from '@/lib/cn';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { IconButton } from '@/components/ui/IconButton';
import { useNotificationStore } from './store';
import { TONE_COLOR, TONE_ICON } from './toneStyles';

function relativeTime(ts: number): string {
  const diff = Math.round((Date.now() - ts) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

/** Slide-in notification center anchored to the top-right of the desktop. */
export function NotificationCenter() {
  const open = useNotificationStore((s) => s.panelOpen);
  const close = useNotificationStore((s) => s.closePanel);
  const items = useNotificationStore((s) => s.items);
  const remove = useNotificationStore((s) => s.remove);
  const clearAll = useNotificationStore((s) => s.clearAll);
  const trapRef = useFocusTrap<HTMLElement>(open);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, close]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onPointerDown={close}
          />
          <motion.aside
            ref={trapRef}
            role="dialog"
            aria-modal="true"
            aria-label="Notification center"
            initial={{ x: 360, opacity: 0.4 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 360, opacity: 0 }}
            transition={spring.glide}
            className="glass-strong fixed right-2 top-10 z-popover flex max-h-[80vh] w-[340px] flex-col overflow-hidden rounded-2xl shadow-popover"
          >
            <div className="flex items-center justify-between border-b border-border/10 px-4 py-3">
              <h2 className="text-sm font-semibold text-fg">Notifications</h2>
              <div className="flex items-center gap-1">
                <IconButton
                  icon={Trash2}
                  label="Clear all notifications"
                  onClick={clearAll}
                  disabled={items.length === 0}
                />
                <IconButton icon={X} label="Close notification center" size="md" onClick={close} />
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-2">
              {items.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-16 text-fg-muted">
                  <BellOff className="h-6 w-6" />
                  <p className="text-sm">You&apos;re all caught up</p>
                </div>
              ) : (
                items.map((item) => {
                  const Icon = TONE_ICON[item.tone];
                  return (
                    <div
                      key={item.id}
                      className="group flex items-start gap-3 rounded-xl p-3 transition-colors hover:bg-fg/5"
                    >
                      <Icon className={cn('mt-0.5 h-4 w-4 shrink-0', TONE_COLOR[item.tone])} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-fg">{item.title}</p>
                        {item.body && <p className="mt-0.5 text-xs text-fg-muted">{item.body}</p>}
                        <p className="mt-1 text-[10px] uppercase tracking-wide text-fg-muted">
                          {relativeTime(item.createdAt)}
                        </p>
                      </div>
                      <button
                        type="button"
                        aria-label="Remove notification"
                        onClick={() => remove(item.id)}
                        className="rounded p-0.5 text-fg-muted opacity-0 transition-opacity hover:text-fg focus-visible:opacity-100 group-hover:opacity-100"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
