'use client';

import { useEffect, useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { nanoid } from 'nanoid';
import Fuse from 'fuse.js';
import { FileText, Plus, Search, Trash2 } from 'lucide-react';
import { cn } from '@/lib/cn';
import { db, type NoteRecord } from '@/services/db';

const AUTOSAVE_MS = 500;

async function createNote(): Promise<string> {
  const id = nanoid();
  const now = Date.now();
  await db.notes.add({ id, title: 'Untitled', body: '', folder: 'Notes', createdAt: now, updatedAt: now });
  return id;
}

/** Markdown notes with debounced autosave persisted to IndexedDB. */
export default function Notes() {
  const notes = useLiveQuery(() => db.notes.orderBy('updatedAt').reverse().toArray(), [], []);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draft, setDraft] = useState<{ title: string; body: string } | null>(null);
  const [query, setQuery] = useState('');

  const active = notes.find((n) => n.id === activeId) ?? null;

  // Select the first note once data loads.
  useEffect(() => {
    if (!activeId && notes.length > 0) setActiveId(notes[0]!.id);
  }, [notes, activeId]);

  // Sync the draft when the active note changes identity.
  useEffect(() => {
    if (active) setDraft({ title: active.title, body: active.body });
  }, [active?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced autosave.
  useEffect(() => {
    if (!active || !draft) return;
    if (draft.title === active.title && draft.body === active.body) return;
    const id = window.setTimeout(() => {
      void db.notes.update(active.id, { ...draft, updatedAt: Date.now() });
    }, AUTOSAVE_MS);
    return () => window.clearTimeout(id);
  }, [draft, active]);

  const filtered = useMemo(() => {
    if (!query.trim()) return notes;
    return new Fuse(notes, { keys: ['title', 'body'], threshold: 0.4 }).search(query).map((r) => r.item);
  }, [notes, query]);

  const onCreate = async () => setActiveId(await createNote());
  const onDelete = async (note: NoteRecord) => {
    await db.notes.delete(note.id);
    if (activeId === note.id) setActiveId(null);
  };

  return (
    <div className="flex h-full">
      <aside className="flex w-60 shrink-0 flex-col border-r border-white/5">
        <div className="flex items-center gap-2 p-2.5">
          <div className="flex flex-1 items-center gap-2 rounded-lg bg-white/5 px-2.5">
            <Search className="h-3.5 w-3.5 text-fg-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search"
              aria-label="Search notes"
              className="h-8 w-full bg-transparent text-xs text-fg outline-none placeholder:text-fg-muted"
            />
          </div>
          <button
            type="button"
            onClick={onCreate}
            aria-label="New note"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-accent/20 text-accent transition-colors hover:bg-accent/30"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
          {filtered.length === 0 && (
            <p className="px-2 py-8 text-center text-xs text-fg-muted">No notes yet.</p>
          )}
          {filtered.map((note) => (
            <button
              key={note.id}
              type="button"
              onClick={() => setActiveId(note.id)}
              className={cn(
                'group mb-1 flex w-full items-start gap-2 rounded-lg p-2 text-left transition-colors',
                note.id === activeId ? 'bg-accent/20' : 'hover:bg-white/5',
              )}
            >
              <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-fg-muted" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-medium text-fg">{note.title || 'Untitled'}</span>
                <span className="block truncate text-[11px] text-fg-muted">
                  {note.body.slice(0, 40) || 'No content'}
                </span>
              </span>
              <span
                role="button"
                tabIndex={0}
                aria-label="Delete note"
                onClick={(e) => { e.stopPropagation(); void onDelete(note); }}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); void onDelete(note); } }}
                className="rounded p-0.5 text-fg-muted opacity-0 transition-opacity hover:text-danger group-hover:opacity-100"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </span>
            </button>
          ))}
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        {active && draft ? (
          <div className="flex h-full flex-col">
            <input
              value={draft.title}
              onChange={(e) => setDraft((d) => ({ ...d!, title: e.target.value }))}
              placeholder="Title"
              aria-label="Note title"
              className="border-b border-white/5 bg-transparent px-5 py-3.5 text-lg font-semibold text-fg outline-none placeholder:text-fg-muted"
            />
            <textarea
              value={draft.body}
              onChange={(e) => setDraft((d) => ({ ...d!, body: e.target.value }))}
              placeholder="Start writing… markdown supported"
              aria-label="Note body"
              className="min-h-0 flex-1 resize-none bg-transparent p-5 font-mono text-sm leading-relaxed text-fg outline-none placeholder:text-fg-muted"
            />
          </div>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-fg-muted">
            <FileText className="h-8 w-8" />
            <p className="text-sm">Select or create a note</p>
          </div>
        )}
      </div>
    </div>
  );
}
