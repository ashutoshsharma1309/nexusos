import { extensionOf } from '../languages';
import { runClike } from './clike';
import { validateClike, type Diagnostic } from './clike-validate';
import { runJs } from './js';
import { runPython } from './python';
import type { RunLine, RunResult } from './types';

export type { RunResult, RunLine } from './types';

/** Render compiler diagnostics in the familiar clang/gcc style, with a caret. */
function formatDiagnostics(name: string, code: string, diagnostics: Diagnostic[]): RunLine[] {
  const sourceLines = code.split('\n');
  const lines: RunLine[] = [];
  for (const d of diagnostics) {
    const source = (sourceLines[d.line - 1] ?? '').replace(/\t/g, ' ');
    lines.push({ stream: 'stderr', text: `${name}:${d.line}:${d.col}: error: ${d.message}` });
    lines.push({ stream: 'stderr', text: source });
    lines.push({ stream: 'stderr', text: `${' '.repeat(Math.max(0, d.col - 1))}^` });
  }
  const count = diagnostics.length;
  lines.push({ stream: 'stderr', text: `${count} error${count === 1 ? '' : 's'} generated.` });
  return lines;
}

/** Compile + run C/C++: reject syntax errors before executing, like a real toolchain. */
function compileAndRun(name: string, code: string, stdin: string): { lines: RunLine[]; exitCode: number; waitingForInput?: boolean } {
  const diagnostics = validateClike(code);
  if (diagnostics.length > 0) {
    return { lines: formatDiagnostics(name, code, diagnostics), exitCode: 1 };
  }
  return runClike(code, stdin);
}

/**
 * Execute a source file with the local runtime that matches its extension.
 * JavaScript/TypeScript run for real in-page; Python/C/C++ run through the
 * bundled interpreters. `stdin` feeds scanf/cin/input(). Wall-clock time is
 * measured so the UI can show it.
 */
export function runFile(name: string, code: string, stdin = ''): RunResult {
  const ext = extensionOf(name);
  const started = performance.now();

  let result: { lines: RunResult['lines']; exitCode: number; waitingForInput?: boolean };
  switch (ext) {
    case 'js':
    case 'mjs':
      result = runJs(code, false);
      break;
    case 'ts':
      result = runJs(code, true);
      break;
    case 'py':
      result = runPython(code, stdin);
      break;
    case 'c':
    case 'cpp':
    case 'cc':
      result = compileAndRun(name, code, stdin);
      break;
    default:
      result = { lines: [{ stream: 'stderr', text: `Cannot run .${ext} files.` }], exitCode: 1 };
  }

  return { ...result, durationMs: Math.round((performance.now() - started) * 100) / 100 };
}
