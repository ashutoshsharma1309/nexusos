'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { AnimatePresence } from 'framer-motion';
import { Circle, FilePlus2, Play, Sparkles } from 'lucide-react';
import { db } from '@/services/db';
import type { AppComponentProps } from '@/features/apps/registry';
import { extensionOf, languageFor } from './languages';
import { runFile, type RunResult } from './runtime';
import { RunPanel } from './RunPanel';
import { NewFileScreen } from './NewFileScreen';

const AUTOSAVE_MS = 400;

/** The shell command we pretend to invoke — purely cosmetic, for authenticity. */
function runCommand(name: string): string {
  const ext = extensionOf(name);
  const stem = name.replace(/\.[^.]+$/, '');
  switch (ext) {
    case 'py': return `python ${name}`;
    case 'c': return `cc ${name} -o ${stem} && ./${stem}`;
    case 'cpp': case 'cc': return `c++ ${name} -o ${stem} && ./${stem}`;
    case 'ts': return `npx tsx ${name}`;
    default: return `node ${name}`;
  }
}

/** A self-contained code editor: create a file, write, and run it — all in one
 *  window. Falls back to a friendly start screen when no file is open. */
export default function Editor({ window: win }: AppComponentProps) {
  const initialFileId = typeof win.meta?.fileId === 'string' ? win.meta.fileId : null;
  const [activeFileId, setActiveFileId] = useState<string | null>(initialFileId);
  const [value, setValue] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<RunResult | null>(null);
  const gutterRef = useRef<HTMLDivElement>(null);

  const file = useLiveQuery(() => (activeFileId ? db.fs.get(activeFileId) : undefined), [activeFileId]);
  const lang = languageFor(file?.name ?? '');

  // Load the buffer whenever the active file changes identity.
  useEffect(() => {
    setValue(null);
  }, [activeFileId]);
  useEffect(() => {
    if (file && value === null) setValue(file.content);
  }, [file, value]);

  useEffect(() => {
    if (!activeFileId || value === null || !file || value === file.content) return;
    setDirty(true);
    const id = window.setTimeout(async () => {
      await db.fs.update(activeFileId, { content: value, updatedAt: Date.now() });
      setDirty(false);
    }, AUTOSAVE_MS);
    return () => window.clearTimeout(id);
  }, [value, activeFileId, file]);

  const lineCount = useMemo(() => (value ?? '').split('\n').length, [value]);

  const run = useCallback(() => {
    if (!file || value === null || !lang.runnable) return;
    setPanelOpen(true);
    setRunning(true);
    setResult(null);
    window.setTimeout(() => {
      setResult(runFile(file.name, value));
      setRunning(false);
    }, 120);
  }, [file, value, lang.runnable]);

  const openFile = (id: string) => {
    setPanelOpen(false);
    setResult(null);
    setActiveFileId(id);
  };

  if (!activeFileId || !file) {
    return <NewFileScreen onCreated={openFile} />;
  }

  const empty = (value ?? '').trim() === '';

  return (
    <div
      className="flex h-full flex-col bg-black/25 font-mono text-[13px]"
      onKeyDown={(e) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
          e.preventDefault();
          run();
        }
      }}
    >
      <div className="flex items-center gap-2 border-b border-white/5 px-2.5 py-1.5">
        <button
          type="button"
          onClick={() => setActiveFileId(null)}
          aria-label="New file"
          className="flex items-center gap-1 rounded-md px-1.5 py-1 text-fg-muted transition-colors hover:bg-white/10 hover:text-fg"
        >
          <FilePlus2 className="h-3.5 w-3.5" />
        </button>
        <span className="h-4 w-px bg-white/10" aria-hidden />

        {renaming ? (
          <input
            autoFocus
            defaultValue={file.name}
            aria-label="Rename file"
            onFocus={(e) => e.target.select()}
            onBlur={async (e) => {
              const name = e.target.value.trim();
              if (name && name !== file.name) await db.fs.update(file.id, { name });
              setRenaming(false);
            }}
            onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
            className="w-40 rounded bg-white/10 px-1.5 py-0.5 text-xs text-fg outline-none"
          />
        ) : (
          <button
            type="button"
            onClick={() => setRenaming(true)}
            className="flex items-center gap-1.5 rounded px-1 py-0.5 text-xs text-fg transition-colors hover:bg-white/5"
            title="Click to rename"
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: `rgb(${lang.tint})` }} />
            {file.name}
          </button>
        )}
        {dirty && <Circle className="h-2 w-2 fill-warning text-warning" />}

        <div className="ml-auto flex items-center gap-1.5">
          {empty && lang.template && (
            <button
              type="button"
              onClick={() => setValue(lang.template)}
              className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] text-fg-muted transition-colors hover:bg-white/10 hover:text-fg"
            >
              <Sparkles className="h-3 w-3" /> Insert template
            </button>
          )}
          {lang.runnable && (
            <button
              type="button"
              onClick={run}
              disabled={running}
              className="flex items-center gap-1.5 rounded-md bg-success/15 px-2.5 py-1 text-[11px] font-medium text-success transition-colors hover:bg-success/25 disabled:opacity-50"
            >
              <Play className="h-3 w-3 fill-current" /> Run
              <kbd className="ml-0.5 hidden opacity-70 sm:inline">⌘↵</kbd>
            </button>
          )}
        </div>
      </div>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <div ref={gutterRef} aria-hidden className="select-none overflow-hidden bg-black/20 px-3 py-2 text-right text-fg-muted">
          {Array.from({ length: lineCount }, (_, i) => (
            <div key={i} className="leading-relaxed">{i + 1}</div>
          ))}
        </div>
        <textarea
          value={value ?? ''}
          onChange={(e) => setValue(e.target.value)}
          onScroll={(e) => {
            if (gutterRef.current) gutterRef.current.scrollTop = e.currentTarget.scrollTop;
          }}
          spellCheck={false}
          placeholder={`// Start writing ${lang.label}…`}
          aria-label="Code editor"
          className="min-h-0 flex-1 resize-none bg-transparent p-2 leading-relaxed text-fg outline-none placeholder:text-fg-muted/50"
        />
      </div>

      <AnimatePresence>
        {panelOpen && (
          <RunPanel
            command={runCommand(file.name)}
            running={running}
            result={result}
            onClear={() => setResult(null)}
            onClose={() => setPanelOpen(false)}
          />
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between border-t border-white/5 px-3 py-1 text-[11px] text-fg-muted">
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: `rgb(${lang.tint})` }} />
          {lang.label}
        </span>
        <span>{lineCount} lines · {dirty ? 'Saving…' : 'Saved'}</span>
      </div>
    </div>
  );
}
