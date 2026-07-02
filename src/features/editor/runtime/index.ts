import { extensionOf } from '../languages';
import { runClike } from './clike';
import { runJs } from './js';
import { runPython } from './python';
import type { RunResult } from './types';

export type { RunResult, RunLine } from './types';

/**
 * Execute a source file with the local runtime that matches its extension.
 * JavaScript/TypeScript run for real in-page; Python/C/C++ run through the
 * bundled interpreters. Wall-clock time is measured so the UI can show it.
 */
export function runFile(name: string, code: string): RunResult {
  const ext = extensionOf(name);
  const started = performance.now();

  let result: { lines: RunResult['lines']; exitCode: number };
  switch (ext) {
    case 'js':
    case 'mjs':
      result = runJs(code, false);
      break;
    case 'ts':
      result = runJs(code, true);
      break;
    case 'py':
      result = runPython(code);
      break;
    case 'c':
    case 'cpp':
    case 'cc':
      result = runClike(code);
      break;
    default:
      result = { lines: [{ stream: 'stderr', text: `Cannot run .${ext} files.` }], exitCode: 1 };
  }

  return { ...result, durationMs: Math.round((performance.now() - started) * 100) / 100 };
}
