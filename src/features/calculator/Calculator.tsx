'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/cn';
import type { Action } from './useCalculator';
import { useCalculator } from './useCalculator';

interface Key {
  label: string;
  action: Action;
  variant?: 'op' | 'fn' | 'wide';
}

const KEYS: Key[] = [
  { label: 'AC', action: { type: 'clear' }, variant: 'fn' },
  { label: '±', action: { type: 'negate' }, variant: 'fn' },
  { label: '%', action: { type: 'percent' }, variant: 'fn' },
  { label: '÷', action: { type: 'op', value: '÷' }, variant: 'op' },
  { label: '7', action: { type: 'digit', value: '7' } },
  { label: '8', action: { type: 'digit', value: '8' } },
  { label: '9', action: { type: 'digit', value: '9' } },
  { label: '×', action: { type: 'op', value: '×' }, variant: 'op' },
  { label: '4', action: { type: 'digit', value: '4' } },
  { label: '5', action: { type: 'digit', value: '5' } },
  { label: '6', action: { type: 'digit', value: '6' } },
  { label: '−', action: { type: 'op', value: '−' }, variant: 'op' },
  { label: '1', action: { type: 'digit', value: '1' } },
  { label: '2', action: { type: 'digit', value: '2' } },
  { label: '3', action: { type: 'digit', value: '3' } },
  { label: '+', action: { type: 'op', value: '+' }, variant: 'op' },
  { label: '0', action: { type: 'digit', value: '0' }, variant: 'wide' },
  { label: '.', action: { type: 'dot' } },
  { label: '=', action: { type: 'equals' }, variant: 'op' },
];

/** A tactile calculator with full keyboard support and a running expression line. */
export default function Calculator() {
  const { state, expr, dispatch, onKey } = useCalculator();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (['Enter', 'Backspace', '/', '*', '-', '+', '=', '%', 'Escape', '.'].includes(e.key) || /[0-9]/.test(e.key)) {
        e.preventDefault();
        onKey(e.key);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onKey]);

  return (
    <div className="flex h-full flex-col p-4">
      <div className="flex flex-1 flex-col justify-end px-2 pb-3 text-right">
        <span className="min-h-4 text-sm text-fg-muted tabular-nums">{expr}</span>
        <span className="truncate text-5xl font-light tabular-nums text-fg">{state.display}</span>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {KEYS.map((key) => (
          <motion.button
            key={key.label}
            type="button"
            whileTap={{ scale: 0.92 }}
            transition={{ duration: 0.08 }}
            onClick={() => dispatch(key.action)}
            className={cn(
              'flex h-14 items-center justify-center rounded-2xl text-lg font-medium transition-colors',
              key.variant === 'wide' && 'col-span-2',
              key.variant === 'op'
                ? 'bg-accent text-accent-fg hover:brightness-110'
                : key.variant === 'fn'
                  ? 'bg-fg/10 text-fg hover:bg-fg/15'
                  : 'bg-fg/[0.06] text-fg hover:bg-fg/[0.1]',
            )}
          >
            {key.label}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
