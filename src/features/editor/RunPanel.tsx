'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, ChevronDown, Loader2, Trash2, XCircle } from 'lucide-react';
import { cn } from '@/lib/cn';
import { spring } from '@/lib/motion';
import { IconButton } from '@/components/ui/IconButton';
import type { RunResult } from './runtime';

interface Props {
  command: string;
  running: boolean;
  result: RunResult | null;
  onClear: () => void;
  onClose: () => void;
  /** Called with a line the user typed while the program awaits input. */
  onSubmitInput: (value: string) => void;
}

/** VS Code-style integrated terminal: echoed command, streamed output, an
 *  interactive prompt when the program reads stdin, and an exit-status footer. */
export function RunPanel({ command, running, result, onClear, onClose, onSubmitInput }: Props) {
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const waiting = Boolean(result?.waitingForInput) && !running;

  // Focus the prompt as soon as the program asks for input, and keep the view pinned.
  useEffect(() => {
    if (waiting) inputRef.current?.focus();
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [waiting, result]);

  const submit = () => {
    onSubmitInput(input);
    setInput('');
  };

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 220, opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={spring.snappy}
      className="flex shrink-0 flex-col overflow-hidden border-t border-border/10 bg-black/40"
    >
      <div className="flex items-center gap-2 border-b border-border/5 px-3 py-1.5">
        <span className="text-2xs font-semibold uppercase tracking-wide text-fg">Terminal</span>
        <span className="text-2xs text-fg-muted">nexus-run</span>
        <div className="ml-auto flex items-center gap-1">
          <IconButton icon={Trash2} label="Clear terminal" onClick={onClear} />
          <IconButton icon={ChevronDown} label="Close panel" size="md" onClick={onClose} />
        </div>
      </div>

      <div
        ref={scrollRef}
        className="min-h-0 flex-1 overflow-y-auto p-3 font-mono text-[12.5px] leading-relaxed"
        onClick={() => waiting && inputRef.current?.focus()}
      >
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
              {result.lines.length === 0 && result.exitCode === 0 && !waiting && (
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

              {waiting ? (
                <div className="flex items-center gap-1.5">
                  <span className="text-success">❯</span>
                  <input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && submit()}
                    aria-label="Program input"
                    spellCheck={false}
                    autoComplete="off"
                    className="flex-1 bg-transparent text-fg caret-success outline-none"
                  />
                </div>
              ) : (
                <div className="mt-2 flex items-center gap-2 text-2xs">
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
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
