'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, ChevronDown, Loader2, Trash2, XCircle } from 'lucide-react';
import { cn } from '@/lib/cn';
import { spring } from '@/lib/motion';
import type { RunResult } from './runtime';

interface Props {
  command: string;
  running: boolean;
  result: RunResult | null;
  onClear: () => void;
  onClose: () => void;
}

/** VS Code-style integrated terminal panel showing a run's echoed command,
 *  streamed output and an exit-status footer. */
export function RunPanel({ command, running, result, onClear, onClose }: Props) {
  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 200, opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={spring.snappy}
      className="flex shrink-0 flex-col overflow-hidden border-t border-white/10 bg-black/40"
    >
      <div className="flex items-center gap-2 border-b border-white/5 px-3 py-1.5">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-fg">Terminal</span>
        <span className="text-[11px] text-fg-muted">nexus-run</span>
        <div className="ml-auto flex items-center gap-1">
          <button type="button" onClick={onClear} aria-label="Clear terminal" className="rounded p-1 text-fg-muted hover:bg-white/10 hover:text-fg">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
          <button type="button" onClick={onClose} aria-label="Close panel" className="rounded p-1 text-fg-muted hover:bg-white/10 hover:text-fg">
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-3 font-mono text-[12.5px] leading-relaxed">
        <div className="flex items-center gap-2 text-fg-muted">
          <span className="text-success">❯</span>
          <span className="text-fg">{command}</span>
        </div>

        {running && (
          <div className="mt-1 flex items-center gap-2 text-fg-muted">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> running…
          </div>
        )}

        <AnimatePresence>
          {result && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-1">
              {result.lines.length === 0 && !result.exitCode && (
                <p className="text-fg-muted italic">Process finished with no output.</p>
              )}
              {result.lines.map((line, i) => (
                <div
                  key={i}
                  className={cn('whitespace-pre-wrap break-words', line.stream === 'stderr' ? 'text-danger' : 'text-fg/90')}
                >
                  {line.text || ' '}
                </div>
              ))}
              <div className="mt-2 flex items-center gap-2 text-[11px]">
                {result.exitCode === 0 ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                ) : (
                  <XCircle className="h-3.5 w-3.5 text-danger" />
                )}
                <span className={result.exitCode === 0 ? 'text-success' : 'text-danger'}>
                  Exited with code {result.exitCode}
                </span>
                <span className="text-fg-muted">· {result.durationMs}ms</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
