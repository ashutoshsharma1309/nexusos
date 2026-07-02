export type OutTone = 'default' | 'muted' | 'accent' | 'success' | 'warning' | 'danger';

export interface OutLine {
  text: string;
  tone?: OutTone;
  /** Optional [start,end) character range to render in the accent color. */
  accentSpan?: [number, number];
}

export interface ShellContext {
  cwd: string; // current directory node id
  path: string; // display path e.g. "/Documents"
}

export interface CommandResult {
  lines: OutLine[];
  /** Directory the shell should move to after this command. */
  cwd?: ShellContext;
  clear?: boolean;
}

/** A Warp-style block: one command and its grouped, tone-tagged output. */
export interface Block {
  id: number;
  path: string;
  command: string;
  lines: OutLine[];
  status: 'ok' | 'error';
}
