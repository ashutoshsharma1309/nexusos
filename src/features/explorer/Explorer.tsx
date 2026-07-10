'use client';

import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { nanoid } from 'nanoid';
import { File, FilePlus, Folder, FolderPlus, Pencil, Trash2 } from 'lucide-react';
import { db, type FsNode } from '@/services/db';
import { FS_ROOT_ID, listChildren } from '@/services/filesystem';
import { ContextMenu, type ContextMenuState } from '@/components/ui/ContextMenu';
import { useWindowStore } from '@/features/window-manager/store';
import { languageFor } from '@/features/editor/languages';
import { FileTree } from './FileTree';

async function create(parentId: string, kind: FsNode['kind']): Promise<string> {
  const id = nanoid();
  const base = kind === 'dir' ? 'New Folder' : 'untitled.txt';
  await db.fs.add({ id, parentId, name: base, kind, content: '', updatedAt: Date.now() });
  return id;
}

async function removeRecursive(id: string): Promise<void> {
  const kids = await db.fs.where('parentId').equals(id).toArray();
  await Promise.all(kids.map((k) => removeRecursive(k.id)));
  await db.fs.delete(id);
}

/** Two-pane file explorer over the virtual filesystem with CRUD + context menu. */
export default function Explorer() {
  const [currentId, setCurrentId] = useState(FS_ROOT_ID);
  const [renaming, setRenaming] = useState<string | null>(null);
  const [menu, setMenu] = useState<ContextMenuState | null>(null);
  const open = useWindowStore((s) => s.open);

  const entries = useLiveQuery(() => listChildren(currentId), [currentId], []);
  const current = useLiveQuery(() => db.fs.get(currentId), [currentId]);

  const openNode = (node: FsNode) => {
    if (node.kind === 'dir') setCurrentId(node.id);
    else open({ appId: 'editor', title: node.name, meta: { fileId: node.id } });
  };

  /** Create a node and immediately drop the new file into rename mode, so you can
   *  type a language-specific name like `main.py` without an extra click. */
  const createAndEdit = async (parentId: string, kind: FsNode['kind']) => {
    const id = await create(parentId, kind);
    if (parentId === currentId) setRenaming(id);
  };

  const contextFor = (e: React.MouseEvent, node: FsNode | null) => {
    e.preventDefault();
    e.stopPropagation();
    const parentId = node?.kind === 'dir' ? node.id : currentId;
    setMenu({
      x: e.clientX,
      y: e.clientY,
      actions: [
        { id: 'nf', label: 'New Folder', icon: FolderPlus, onSelect: () => void createAndEdit(parentId, 'dir') },
        { id: 'nfile', label: 'New File', icon: FilePlus, onSelect: () => void createAndEdit(parentId, 'file') },
        ...(node
          ? [
              { id: 'rename', label: 'Rename', icon: Pencil, onSelect: () => setRenaming(node.id) },
              {
                id: 'delete',
                label: 'Delete',
                icon: Trash2,
                danger: true,
                onSelect: () => void removeRecursive(node.id),
              },
            ]
          : []),
      ],
    });
  };

  return (
    <div className="flex h-full">
      <aside className="w-52 shrink-0 overflow-y-auto border-r border-border/5 p-2">
        <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-fg-muted">Favorites</p>
        <FileTree nodeId={FS_ROOT_ID} name="Home" depth={0} currentId={currentId} onSelect={setCurrentId} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col" onContextMenu={(e) => contextFor(e, null)}>
        <div className="flex items-center gap-1 border-b border-border/5 px-3 py-2 text-xs text-fg-muted">
          {(current?.name === '/' ? 'Home' : current?.name ?? 'Home')}
          <span className="ml-auto flex gap-1">
            <button type="button" aria-label="New folder" onClick={() => void createAndEdit(currentId, 'dir')} className="rounded p-1 hover:bg-fg/5 hover:text-fg">
              <FolderPlus className="h-3.5 w-3.5" />
            </button>
            <button type="button" aria-label="New file" onClick={() => void createAndEdit(currentId, 'file')} className="rounded p-1 hover:bg-fg/5 hover:text-fg">
              <FilePlus className="h-3.5 w-3.5" />
            </button>
          </span>
        </div>

        <div className="grid min-h-0 flex-1 auto-rows-min grid-cols-[repeat(auto-fill,minmax(88px,1fr))] gap-1 overflow-y-auto p-3">
          {entries.length === 0 && (
            <p className="col-span-full py-10 text-center text-xs text-fg-muted">This folder is empty.</p>
          )}
          {entries.map((node) => (
            <button
              key={node.id}
              type="button"
              onDoubleClick={() => openNode(node)}
              onContextMenu={(e) => contextFor(e, node)}
              className="group flex flex-col items-center gap-1.5 rounded-xl p-2.5 transition-colors hover:bg-fg/5"
            >
              {node.kind === 'dir' ? (
                <Folder className="h-9 w-9 text-accent" />
              ) : (
                <span className="relative grid h-9 w-9 place-items-center">
                  <File className="h-9 w-9" style={{ color: `rgb(${languageFor(node.name).tint})` }} />
                  <span className="absolute bottom-1 text-[7px] font-bold uppercase text-black/70">
                    {languageFor(node.name).label.slice(0, 3)}
                  </span>
                </span>
              )}
              {renaming === node.id ? (
                <input
                  autoFocus
                  defaultValue={node.name}
                  aria-label="Rename"
                  onFocus={(e) => e.target.select()}
                  onClick={(e) => e.stopPropagation()}
                  onBlur={(e) => {
                    void db.fs.update(node.id, { name: e.target.value || node.name });
                    setRenaming(null);
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
                  className="w-full rounded bg-fg/10 px-1 text-center text-2xs text-fg outline-none"
                />
              ) : (
                <span className="line-clamp-2 text-center text-2xs text-fg">{node.name}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      <ContextMenu state={menu} onClose={() => setMenu(null)} />
    </div>
  );
}
