import { nanoid } from 'nanoid';
import { db, type FsNode } from './db';

/** Root node id is stable so paths can be resolved deterministically. */
export const FS_ROOT_ID = 'root';

interface SeedNode {
  name: string;
  kind: FsNode['kind'];
  content?: string;
  children?: SeedNode[];
}

const SEED: SeedNode[] = [
  {
    name: 'Documents',
    kind: 'dir',
    children: [
      { name: 'welcome.md', kind: 'file', content: '# Welcome to Nexus OS\n\nEverything here runs locally in your browser.' },
      { name: 'roadmap.md', kind: 'file', content: '- [x] Boot\n- [ ] Conquer the desktop' },
    ],
  },
  {
    name: 'Projects',
    kind: 'dir',
    children: [
      { name: 'hello.ts', kind: 'file', content: "export const hello = () => console.log('hi from nexus');\n" },
      { name: 'README.md', kind: 'file', content: '# Projects\n\nDrop your code here.' },
    ],
  },
  { name: 'Pictures', kind: 'dir', children: [] },
  { name: 'notes.txt', kind: 'file', content: 'Scratch space.\n' },
];

async function insertTree(nodes: SeedNode[], parentId: string): Promise<void> {
  for (const node of nodes) {
    const id = nanoid();
    await db.fs.add({
      id,
      parentId,
      name: node.name,
      kind: node.kind,
      content: node.content ?? '',
      updatedAt: Date.now(),
    });
    if (node.children?.length) await insertTree(node.children, id);
  }
}

/** Seed the virtual filesystem exactly once (idempotent on the root marker). */
export async function ensureFilesystem(): Promise<void> {
  const root = await db.fs.get(FS_ROOT_ID);
  if (root) return;
  await db.fs.add({
    id: FS_ROOT_ID,
    parentId: null,
    name: '/',
    kind: 'dir',
    content: '',
    updatedAt: Date.now(),
  });
  await insertTree(SEED, FS_ROOT_ID);
}

export async function listChildren(parentId: string): Promise<FsNode[]> {
  const rows = await db.fs.where('parentId').equals(parentId).toArray();
  return rows.sort((a, b) => {
    if (a.kind !== b.kind) return a.kind === 'dir' ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}

export async function resolvePath(node: FsNode): Promise<string> {
  const segments: string[] = [];
  let current: FsNode | undefined = node;
  while (current && current.id !== FS_ROOT_ID) {
    segments.unshift(current.name);
    current = current.parentId ? await db.fs.get(current.parentId) : undefined;
  }
  return '/' + segments.join('/');
}
