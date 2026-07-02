import { nanoid } from 'nanoid';
import { db } from '@/services/db';
import { FS_ROOT_ID, listChildren } from '@/services/filesystem';

/** Create a code file at the filesystem root, de-duplicating the name if needed,
 *  and return its id. Files land in the root so they also appear in Explorer. */
export async function createCodeFile(name: string, content: string): Promise<string> {
  const dot = name.lastIndexOf('.');
  const stem = dot > 0 ? name.slice(0, dot) : name;
  const ext = dot > 0 ? name.slice(dot) : '';

  const siblings = await listChildren(FS_ROOT_ID);
  const taken = new Set(siblings.map((s) => s.name));
  let finalName = name;
  let n = 1;
  while (taken.has(finalName)) finalName = `${stem}-${n++}${ext}`;

  const id = nanoid();
  await db.fs.add({ id, parentId: FS_ROOT_ID, name: finalName, kind: 'file', content, updatedAt: Date.now() });
  return id;
}
