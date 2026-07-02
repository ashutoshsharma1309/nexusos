import type { OutLine } from './types';

const line = (text: string, tone?: OutLine['tone']): OutLine => ({ text, tone });

/** `neofetch` — system splash with an ASCII logo, themed via tones. */
export function neofetch(): OutLine[] {
  const logo = [
    '   ▄▄▄▄▄▄▄   ',
    '  █ ▄▄▄ █ █  ',
    '  █ ███ █ █  ',
    '  █▄▄▄▄▄█ █  ',
    '  ▄▄▄▄▄▄▄ █  ',
    '  █▄█▄█▄█▄█  ',
  ];
  const info: [string, string][] = [
    ['nexus', '@ web'],
    ['OS', 'Nexus OS 0.1.0 “Aurora”'],
    ['Kernel', 'react-19.1.0'],
    ['Shell', 'nexus-sh 1.0'],
    ['DE', 'Nexus Desktop'],
    ['WM', 'Composited (Framer)'],
    ['Terminal', 'nexus-term'],
    ['CPU', 'V8 JavaScript (∞ cores)'],
    ['Memory', 'Managed heap'],
  ];
  const rows = Math.max(logo.length, info.length);
  const out: OutLine[] = [];
  for (let i = 0; i < rows; i++) {
    const art = (logo[i] ?? '            ').padEnd(14);
    const kv = info[i];
    out.push({
      text: kv ? `${art}${kv[0].padEnd(9)} ${kv[1]}` : art,
      tone: 'accent',
      accentSpan: kv ? [14, 14 + kv[0].length] : undefined,
    });
  }
  out.push(line(''));
  out.push(line('   ●●●●●●●   themes: dark · glass · tokyo-night · nord · …', 'muted'));
  return out;
}

/** `htop` — a compact live-looking process monitor snapshot. */
export function htop(): OutLine[] {
  const bar = (pct: number, tone: OutLine['tone']): OutLine => {
    const width = 24;
    const filled = Math.round((pct / 100) * width);
    return { text: `  [${'|'.repeat(filled)}${' '.repeat(width - filled)}] ${pct.toFixed(0)}%`, tone };
  };
  const procs: [number, string, number, number][] = [
    [1, 'nexus-compositor', 4.2, 128],
    [42, 'window-manager', 2.1, 96],
    [108, 'dexie-worker', 0.8, 64],
    [256, 'framer-motion', 1.4, 48],
    [512, 'terminal', 0.3, 22],
  ];
  return [
    bar(Math.round(20 + Math.random() * 40), 'success'),
    bar(Math.round(40 + Math.random() * 25), 'accent'),
    line(''),
    line('  PID    COMMAND            CPU%   MEM(MB)', 'muted'),
    ...procs.map(([pid, cmd, cpu, mem]) =>
      line(`  ${String(pid).padEnd(6)} ${cmd.padEnd(18)} ${cpu.toFixed(1).padStart(4)}   ${mem}`),
    ),
    line(''),
    line('  F10 Quit', 'muted'),
  ];
}

/** `git <sub>` — believable status/log output. */
export function git(args: string[]): OutLine[] {
  const sub = args[0];
  if (sub === 'status') {
    return [
      line('On branch main', 'accent'),
      line("Your branch is up to date with 'origin/main'."),
      line(''),
      line('Changes not staged for commit:', 'warning'),
      line('  modified:   src/features/window-manager/store.ts', 'danger'),
      line('  modified:   src/styles/themes.css', 'danger'),
      line(''),
      line('no changes added to commit (use "git add")', 'muted'),
    ];
  }
  if (sub === 'log') {
    return [
      line('a1f3c9d', 'warning'),
      line('  feat(dock): magnification + launch bounce'),
      line('7b2e001', 'warning'),
      line('  feat(wm): minimize-to-dock genie animation'),
      line('c0ffee0', 'warning'),
      line('  chore: elevation + surface token system'),
    ];
  }
  if (sub === 'branch') return [line('* main', 'success'), line('  feat/whiteboard'), line('  feat/browser')];
  return [line(`git: '${sub ?? ''}' — try: status, log, branch`, 'muted')];
}

/** Package managers — a fake, instant, believable install. */
export function pkg(manager: string, args: string[]): OutLine[] {
  const action = args[0] ?? 'install';
  if (['install', 'add', 'i'].includes(action)) {
    const name = args[1] ?? 'dependencies';
    return [
      line(`${manager} ${action} ${name}`, 'muted'),
      line('Resolving packages...', 'muted'),
      line('Fetching packages...', 'muted'),
      line('Linking dependencies...', 'muted'),
      line(`✓ done in ${(0.3 + Math.random()).toFixed(1)}s`, 'success'),
      line(`+ ${name}  (0 vulnerabilities)`, 'accent'),
    ];
  }
  if (action === 'run' || action === 'dev') return [line(`> nexus@0.1.0 ${action}`, 'muted'), line('ready — nothing to do here 🙂', 'success')];
  return [line(`${manager}: unknown command '${action}'`, 'muted')];
}

const VERSIONS: Record<string, string> = {
  node: 'v22.20.0',
  python: 'Python 3.12.4',
  rustc: 'rustc 1.82.0 (nexus)',
  cargo: 'cargo 1.82.0 (nexus)',
  deno: 'deno 2.0.0',
};

export function version(cmd: string): OutLine[] {
  return [line(VERSIONS[cmd] ?? `${cmd}: version unknown`, 'accent')];
}

export function docker(): OutLine[] {
  return [
    line('CONTAINER   IMAGE            STATUS         PORTS', 'muted'),
    line('a1b2c3d4    nexus/web        Up 3 minutes   0.0.0.0:3000->3000'),
    line('e5f6g7h8    nexus/dexie      Up 3 minutes'),
  ];
}

export function kubectl(): OutLine[] {
  return [
    line('NAME                       READY   STATUS    RESTARTS   AGE', 'muted'),
    line('nexus-web-7d9f            1/1     Running   0          3m'),
    line('nexus-worker-2c4a        1/1     Running   0          3m'),
  ];
}

export function ssh(args: string[]): OutLine[] {
  const host = args[0] ?? 'localhost';
  return [
    line(`Connecting to ${host}...`, 'muted'),
    line('The authenticity of host cannot be established (this is a simulation).', 'warning'),
    line(`Welcome to Nexus Cloud. You are now "connected" to ${host}.`, 'success'),
  ];
}
