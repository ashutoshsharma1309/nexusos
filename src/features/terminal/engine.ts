import { nanoid } from 'nanoid';
import { db, type FsNode } from '@/services/db';
import { FS_ROOT_ID, listChildren } from '@/services/filesystem';
import { THEMES, useSettingsStore, type ThemeId } from '@/features/settings/store';
import type { CommandResult, OutLine, OutTone, ShellContext } from './types';
import { docker, git, htop, kubectl, neofetch, pkg, ssh, version } from './tools';

const L = (text: string, tone?: OutTone): OutLine => ({ text, tone });
const lines = (arr: string[], tone?: OutTone): OutLine[] => arr.map((t) => L(t, tone));

/** Commands offered to the autocomplete/suggestion layer. */
export const KNOWN_COMMANDS = [
  'help', 'ls', 'pwd', 'cd', 'mkdir', 'touch', 'cat', 'echo', 'find', 'grep', 'tree',
  'theme', 'whoami', 'date', 'history', 'clear', 'neofetch', 'htop', 'git', 'npm',
  'pnpm', 'yarn', 'node', 'python', 'rustc', 'cargo', 'deno', 'docker', 'kubectl', 'ssh',
] as const;

async function findChild(parentId: string, name: string): Promise<FsNode | undefined> {
  const kids = await listChildren(parentId);
  return kids.find((k) => k.name === name);
}

async function resolveDir(ctx: ShellContext, arg: string): Promise<{ node: FsNode; path: string } | null> {
  if (arg === '/') {
    const root = await db.fs.get(FS_ROOT_ID);
    return root ? { node: root, path: '/' } : null;
  }
  if (arg === '..') {
    if (ctx.cwd === FS_ROOT_ID) return null;
    const current = await db.fs.get(ctx.cwd);
    const parent = current?.parentId ? await db.fs.get(current.parentId) : await db.fs.get(FS_ROOT_ID);
    if (!parent) return null;
    return { node: parent, path: ctx.path.split('/').slice(0, -1).join('/') || '/' };
  }
  const child = await findChild(ctx.cwd, arg);
  if (!child || child.kind !== 'dir') return null;
  return { node: child, path: ctx.path === '/' ? `/${arg}` : `${ctx.path}/${arg}` };
}

async function treeLines(parentId: string, prefix = ''): Promise<OutLine[]> {
  const kids = await listChildren(parentId);
  const out: OutLine[] = [];
  for (let i = 0; i < kids.length; i++) {
    const kid = kids[i]!;
    const last = i === kids.length - 1;
    out.push(L(`${prefix}${last ? '└── ' : '├── '}${kid.name}`, kid.kind === 'dir' ? 'accent' : 'default'));
    if (kid.kind === 'dir') out.push(...(await treeLines(kid.id, prefix + (last ? '    ' : '│   '))));
  }
  return out;
}

const HELP: OutLine[] = [
  L('Nexus Shell — command reference', 'accent'),
  L(''),
  L('  filesystem   ls  cd  pwd  mkdir  touch  cat  tree  find  grep', 'muted'),
  L('  toolchain    git  npm  pnpm  yarn  node  python  cargo  docker  kubectl  ssh', 'muted'),
  L('  system       neofetch  htop  theme  whoami  date  history  clear', 'muted'),
  L(''),
  L('  Tip: press Tab to complete, ↑/↓ for history.', 'muted'),
];

/** Execute a single command line against the virtual filesystem + fake toolchain. */
export async function runCommand(raw: string, ctx: ShellContext, history: string[]): Promise<CommandResult> {
  const [cmd, ...args] = raw.trim().split(/\s+/);
  const arg = args.join(' ');

  switch (cmd) {
    case '':
      return { lines: [] };
    case 'help':
      return { lines: HELP };
    case 'clear':
      return { lines: [], clear: true };
    case 'pwd':
      return { lines: [L(ctx.path)] };
    case 'whoami':
      return { lines: [L('nexus')] };
    case 'date':
      return { lines: [L(new Date().toString())] };
    case 'echo':
      return { lines: [L(arg)] };
    case 'history':
      return { lines: history.map((h, i) => L(`${String(i + 1).padStart(4)}  ${h}`, 'muted')) };
    case 'neofetch':
      return { lines: neofetch() };
    case 'htop':
      return { lines: htop() };
    case 'git':
      return { lines: git(args) };
    case 'npm':
    case 'pnpm':
    case 'yarn':
      return { lines: pkg(cmd, args) };
    case 'node':
    case 'python':
    case 'rustc':
    case 'cargo':
    case 'deno':
      return { lines: version(cmd) };
    case 'docker':
      return { lines: docker() };
    case 'kubectl':
      return { lines: kubectl() };
    case 'ssh':
      return { lines: ssh(args) };
    case 'ls': {
      const kids = await listChildren(ctx.cwd);
      if (kids.length === 0) return { lines: [L('')] };
      if (args[0] === '-l' || args[0] === '-la') {
        return {
          lines: kids.map((k) =>
            L(`${k.kind === 'dir' ? 'drwxr-xr-x' : '-rw-r--r--'}  nexus  ${k.name}`, k.kind === 'dir' ? 'accent' : 'default'),
          ),
        };
      }
      return {
        lines: kids.map((k) => L(k.kind === 'dir' ? `${k.name}/` : k.name, k.kind === 'dir' ? 'accent' : 'default')),
      };
    }
    case 'cd': {
      if (!arg) return { lines: [], cwd: { cwd: FS_ROOT_ID, path: '/' } };
      const resolved = await resolveDir(ctx, arg);
      if (!resolved) return { lines: [L(`cd: no such directory: ${arg}`, 'danger')] };
      return { lines: [], cwd: { cwd: resolved.node.id, path: resolved.path } };
    }
    case 'mkdir':
    case 'touch': {
      if (!arg) return { lines: [L(`${cmd}: missing operand`, 'danger')] };
      if (await findChild(ctx.cwd, arg)) return { lines: [L(`${cmd}: '${arg}' already exists`, 'warning')] };
      await db.fs.add({ id: nanoid(), parentId: ctx.cwd, name: arg, kind: cmd === 'mkdir' ? 'dir' : 'file', content: '', updatedAt: Date.now() });
      return { lines: [L(`created ${arg}`, 'success')] };
    }
    case 'cat': {
      const file = await findChild(ctx.cwd, arg);
      if (!file) return { lines: [L(`cat: ${arg}: No such file`, 'danger')] };
      if (file.kind === 'dir') return { lines: [L(`cat: ${arg}: Is a directory`, 'danger')] };
      return { lines: file.content ? lines(file.content.split('\n')) : [L('')] };
    }
    case 'find': {
      const all = await db.fs.toArray();
      const hits = all.filter((n) => n.id !== FS_ROOT_ID && n.name.includes(arg));
      return { lines: hits.length ? lines(hits.map((h) => h.name)) : [L(`find: no matches for '${arg}'`, 'muted')] };
    }
    case 'grep': {
      const all = await db.fs.filter((n) => n.kind === 'file' && n.content.includes(arg)).toArray();
      const out = all.flatMap((f) => f.content.split('\n').filter((l) => l.includes(arg)).map((l) => L(`${f.name}: ${l}`)));
      return { lines: out.length ? out : [L(`grep: no matches for '${arg}'`, 'muted')] };
    }
    case 'tree':
      return { lines: [L('.', 'accent'), ...(await treeLines(ctx.cwd))] };
    case 'theme': {
      const { theme, setTheme } = useSettingsStore.getState();
      if (!arg) return { lines: [L(`current theme: ${theme}`, 'accent'), L(`available: ${THEMES.join(', ')}`, 'muted')] };
      if (!THEMES.includes(arg as ThemeId)) return { lines: [L(`theme: unknown theme '${arg}'`, 'danger')] };
      setTheme(arg as ThemeId);
      return { lines: [L(`theme set to ${arg}`, 'success')] };
    }
    default:
      return { lines: [L(`command not found: ${cmd}`, 'danger'), L("Type 'help' for available commands.", 'muted')] };
  }
}
