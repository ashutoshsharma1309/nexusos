export type Stream = 'stdout' | 'stderr' | 'system';

export interface RunLine {
  text: string;
  stream: Stream;
}

export interface RunResult {
  lines: RunLine[];
  exitCode: number;
  durationMs: number;
}

/** Guard against runaway loops in the interpreters — total statement budget. */
export const STEP_LIMIT = 200_000;
