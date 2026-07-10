'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, ChevronRight, Copy } from 'lucide-react';
import { cn } from '@/lib/cn';
import { spring } from '@/lib/motion';
import { FS_ROOT_ID } from '@/services/filesystem';
import { KNOWN_COMMANDS, runCommand } from './engine';
import type { Block, OutLine, OutTone, ShellContext } from './types';

const TONE: Record<OutTone, string> = {
  default: 'text-fg/90',
  muted: 'text-fg-muted',
  accent: 'text-accent',
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-danger',
};

function OutputLine({ line }: { line: OutLine }) {
  const tone = TONE[line.tone ?? 'default'];
  if (line.accentSpan) {
    const [a, b] = line.accentSpan;
    return (
      <div className="whitespace-pre-wrap break-words">
        <span className={tone}>{line.text.slice(0, a)}</span>
        <span className="text-fg">{line.text.slice(a, b)}</span>
        <span className={tone}>{line.text.slice(b)}</span>
      </div>
    );
  }
  return <div className={cn('whitespace-pre-wrap break-words', tone)}>{line.text || ' '}</div>;
}

function CommandBlock({ block }: { block: Block }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard?.writeText(block.command).catch(() => undefined);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  };
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={spring.snappy}
      className="group overflow-hidden rounded-xl border border-border/[0.06] bg-fg/[0.02]"
    >
      <div className="flex items-center gap-2 border-b border-border/[0.05] px-3 py-1.5">
        <span className={cn('h-1.5 w-1.5 rounded-full', block.status === 'ok' ? 'bg-success' : 'bg-danger')} />
        <span className="text-2xs text-fg-muted">{block.path}</span>
        <ChevronRight className="h-3 w-3 text-fg-muted" />
        <span className="truncate text-[12px] font-medium text-fg">{block.command}</span>
        <button
          type="button"
          onClick={copy}
          aria-label="Copy command"
          className="ml-auto rounded p-1 text-fg-muted opacity-0 transition-opacity hover:bg-fg/10 hover:text-fg group-hover:opacity-100"
        >
          {copied ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
        </button>
      </div>
      {block.lines.length > 0 && (
        <div className="px-3 py-2">
          {block.lines.map((line, i) => (
            <OutputLine key={i} line={line} />
          ))}
        </div>
      )}
    </motion.div>
  );
}

/** A Warp-inspired shell: output grouped into copyable blocks, an animated caret,
 *  ghost autocompletion and tone-based syntax coloring. */
export default function Terminal() {
  const [ctx, setCtx] = useState<ShellContext>({ cwd: FS_ROOT_ID, path: '/' });
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState<number | null>(null);
  const blockId = useRef(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [blocks]);

  // Ghost suggestion: the first known command that starts with the current token.
  const suggestion = useMemo(() => {
    const token = input.trimStart();
    if (!token || token.includes(' ')) return '';
    const match = KNOWN_COMMANDS.find((c) => c.startsWith(token) && c !== token);
    return match ? match.slice(token.length) : '';
  }, [input]);

  const submit = async () => {
    const raw = input;
    setInput('');
    setHistoryIdx(null);
    if (raw.trim()) setHistory((h) => [...h, raw]);

    const result = await runCommand(raw, ctx, history);
    if (result.clear) {
      setBlocks([]);
    } else if (raw.trim()) {
      const hasError = result.lines.some((l) => l.tone === 'danger');
      setBlocks((b) => [
        ...b,
        { id: blockId.current++, path: ctx.path, command: raw, lines: result.lines, status: hasError ? 'error' : 'ok' },
      ]);
    }
    if (result.cwd) setCtx(result.cwd);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      void submit();
    } else if (e.key === 'Tab') {
      e.preventDefault();
      if (suggestion) setInput((v) => v + suggestion);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!history.length) return;
      const idx = historyIdx === null ? history.length - 1 : Math.max(0, historyIdx - 1);
      setHistoryIdx(idx);
      setInput(history[idx] ?? '');
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIdx === null) return;
      const idx = historyIdx + 1;
      if (idx >= history.length) {
        setHistoryIdx(null);
        setInput('');
      } else {
        setHistoryIdx(idx);
        setInput(history[idx] ?? '');
      }
    }
  };

  const firstToken = input.trimStart().split(' ')[0] ?? '';
  const known = (KNOWN_COMMANDS as readonly string[]).includes(firstToken);

  return (
    <div
      className="flex h-full flex-col bg-[rgb(var(--color-bg)/0.55)] font-mono text-[13px] leading-relaxed"
      onClick={() => inputRef.current?.focus()}
    >
      <div ref={scrollRef} className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-3">
        {blocks.length === 0 && (
          <p className="px-1 text-fg-muted">
            Welcome to <span className="text-accent">nexus-sh</span>. Type{' '}
            <span className="text-fg">neofetch</span> or <span className="text-fg">help</span> to begin.
          </p>
        )}
        <AnimatePresence initial={false}>
          {blocks.map((block) => (
            <CommandBlock key={block.id} block={block} />
          ))}
        </AnimatePresence>

        {/* Active prompt */}
        <div className="flex items-center gap-1.5 px-1 pt-1">
          <span className="shrink-0 font-semibold text-accent">nexus</span>
          <span className="shrink-0 text-fg-muted">{ctx.path}</span>
          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-success" />
          <div className="relative flex-1">
            <div className="pointer-events-none absolute inset-0 flex items-center whitespace-pre">
              <span className={known ? 'text-accent' : 'text-fg'}>{firstToken}</span>
              <span className="text-fg">{input.slice(firstToken.length)}</span>
              <span className="text-fg-muted/60">{suggestion}</span>
              <motion.span
                aria-hidden
                className="ml-px inline-block h-4 w-[7px] translate-y-[1px] bg-accent"
                animate={{ opacity: [1, 1, 0, 0] }}
                transition={{ duration: 1, repeat: Infinity, times: [0, 0.5, 0.5, 1] }}
              />
            </div>
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              aria-label="Terminal input"
              spellCheck={false}
              autoComplete="off"
              autoFocus
              className="w-full bg-transparent text-transparent caret-transparent outline-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
