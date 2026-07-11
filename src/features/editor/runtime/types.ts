export type Stream = 'stdout' | 'stderr' | 'system';

export interface RunLine {
  text: string;
  stream: Stream;
}

export interface RunResult {
  lines: RunLine[];
  exitCode: number;
  durationMs: number;
  /** True when the program paused on a read past the end of stdin and is waiting
   *  for the user to type more input in the terminal. */
  waitingForInput?: boolean;
}

/** Guard against runaway loops in the interpreters — total statement budget. */
export const STEP_LIMIT = 200_000;

/**
 * Thrown by a runtime when it reads past the supplied stdin. The caller catches
 * it, shows the output produced so far plus a prompt, and re-runs the (pure,
 * deterministic) program once the user has typed more — an interactive REPL
 * without threading async through the whole interpreter.
 */
export class NeedInput {}
