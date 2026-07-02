'use client';

import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { ChevronRight, Folder, FolderOpen } from 'lucide-react';
import { cn } from '@/lib/cn';
import { listChildren } from '@/services/filesystem';

interface Props {
  nodeId: string;
  name: string;
  depth: number;
  currentId: string;
  onSelect: (id: string) => void;
}

/** A recursively-expandable directory row for the Explorer sidebar. */
export function FileTree({ nodeId, name, depth, currentId, onSelect }: Props) {
  const [open, setOpen] = useState(depth === 0);
  const children = useLiveQuery(() => listChildren(nodeId), [nodeId], []);
  const dirs = children.filter((c) => c.kind === 'dir');

  return (
    <div>
      <button
        type="button"
        onClick={() => {
          setOpen((o) => !o);
          onSelect(nodeId);
        }}
        style={{ paddingLeft: depth * 12 + 8 }}
        className={cn(
          'flex w-full items-center gap-1 rounded-md py-1 pr-2 text-left text-xs transition-colors',
          currentId === nodeId ? 'bg-accent/20 text-fg' : 'text-fg-muted hover:bg-white/5',
        )}
      >
        <ChevronRight className={cn('h-3 w-3 shrink-0 transition-transform', open && 'rotate-90')} />
        {open ? <FolderOpen className="h-3.5 w-3.5 shrink-0 text-accent" /> : <Folder className="h-3.5 w-3.5 shrink-0" />}
        <span className="truncate">{name}</span>
      </button>
      {open &&
        dirs.map((dir) => (
          <FileTree
            key={dir.id}
            nodeId={dir.id}
            name={dir.name}
            depth={depth + 1}
            currentId={currentId}
            onSelect={onSelect}
          />
        ))}
    </div>
  );
}
