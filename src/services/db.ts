import Dexie, { type EntityTable } from 'dexie';

/** A single note document (Notes app). */
export interface NoteRecord {
  id: string;
  title: string;
  body: string;
  folder: string;
  updatedAt: number;
  createdAt: number;
}

/** A node in the virtual filesystem shared by Explorer, Terminal and Editor. */
export interface FsNode {
  id: string;
  parentId: string | null;
  name: string;
  kind: 'dir' | 'file';
  content: string;
  updatedAt: number;
}

/** Arbitrary persisted key/value settings (theme, accent, motion, layout snapshots…). */
export interface KvRecord<T = unknown> {
  key: string;
  value: T;
}

class NexusDatabase extends Dexie {
  notes!: EntityTable<NoteRecord, 'id'>;
  fs!: EntityTable<FsNode, 'id'>;
  kv!: EntityTable<KvRecord, 'key'>;

  constructor() {
    super('nexus-os');
    this.version(1).stores({
      notes: 'id, folder, updatedAt',
      fs: 'id, parentId, kind, name',
      kv: 'key',
    });
  }
}

export const db = new NexusDatabase();

/** Typed helpers over the KV table; values are structured-cloned by IndexedDB. */
export const kv = {
  async get<T>(key: string, fallback: T): Promise<T> {
    const row = await db.kv.get(key);
    return row ? (row.value as T) : fallback;
  },
  async set<T>(key: string, value: T): Promise<void> {
    await db.kv.put({ key, value });
  },
};
