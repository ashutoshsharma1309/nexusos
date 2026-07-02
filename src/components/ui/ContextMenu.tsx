'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface MenuAction {
  id: string;
  label: string;
  icon?: LucideIcon;
  shortcut?: string;
  danger?: boolean;
  onSelect: () => void;
}

export interface ContextMenuState {
  x: number;
  y: number;
  actions: MenuAction[];
}

interface Props {
  state: ContextMenuState | null;
  onClose: () => void;
}

/** A floating, keyboard-dismissable context menu positioned within the viewport. */
export function ContextMenu({ state, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });

  useLayoutEffect(() => {
    if (!state || !ref.current) return;
    const { width, height } = ref.current.getBoundingClientRect();
    setPos({
      x: Math.min(state.x, window.innerWidth - width - 8),
      y: Math.min(state.y, window.innerHeight - height - 8),
    });
  }, [state]);

  useEffect(() => {
    if (!state) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [state, onClose]);

  return (
    <AnimatePresence>
      {state && (
        <>
          <div className="fixed inset-0 z-[10030]" onPointerDown={onClose} onContextMenu={(e) => { e.preventDefault(); onClose(); }} />
          <motion.div
            ref={ref}
            role="menu"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.12 }}
            style={{ left: pos.x, top: pos.y }}
            className="glass-strong fixed z-[10031] min-w-[200px] rounded-xl p-1.5 shadow-popover"
          >
            {state.actions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.id}
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    onClose();
                    action.onSelect();
                  }}
                  className={cn(
                    'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-sm transition-colors',
                    action.danger
                      ? 'text-danger hover:bg-danger/15'
                      : 'text-fg hover:bg-accent/20',
                  )}
                >
                  {Icon && <Icon className="h-4 w-4 shrink-0 opacity-80" />}
                  <span className="flex-1">{action.label}</span>
                  {action.shortcut && (
                    <span className="text-xs text-fg-muted">{action.shortcut}</span>
                  )}
                </button>
              );
            })}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
