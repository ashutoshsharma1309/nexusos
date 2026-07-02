import type { RunLine } from './types';

/** Format a JS value the way a devtools console would. */
function fmt(value: unknown): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'function') return `[Function: ${value.name || 'anonymous'}]`;
  if (value instanceof Error) return `${value.name}: ${value.message}`;
  try {
    return JSON.stringify(value, null, 0) ?? String(value);
  } catch {
    return String(value);
  }
}

/** Strip the TypeScript-only syntax that a light program is likely to use so the
 *  same engine can run `.ts` files. This is a best-effort transform, not a compiler. */
function stripTypes(code: string): string {
  return code
    .replace(/^\s*(import|export)\s+type\s+.*$/gm, '')
    .replace(/^\s*(interface|type)\s+\w[\s\S]*?\}\s*;?$/gm, '')
    .replace(/\bexport\b\s+/g, '')
    .replace(/\bas\s+[A-Za-z_][\w.<>[\]]*/g, '')
    .replace(/:\s*[A-Za-z_][\w.<>[\]|&\s]*(?=[=,)\];{])/g, '')
    .replace(/<[A-Za-z_][\w,\s.<>[\]]*>(?=\()/g, '');
}

/**
 * Runs JavaScript (and best-effort TypeScript) for real inside the page, capturing
 * console output. Execution is synchronous; there is no network or module access.
 */
export function runJs(code: string, isTs: boolean): { lines: RunLine[]; exitCode: number } {
  const lines: RunLine[] = [];
  const record = (stream: RunLine['stream']) => (...args: unknown[]) =>
    lines.push({ stream, text: args.map(fmt).join(' ') });

  const sandbox = {
    log: record('stdout'),
    info: record('stdout'),
    debug: record('stdout'),
    warn: record('stdout'),
    error: record('stderr'),
  };

  const source = isTs ? stripTypes(code) : code;
  try {
    // eslint-disable-next-line no-new-func
    const fn = new Function('console', `"use strict";\n${source}`);
    fn(sandbox);
    return { lines, exitCode: 0 };
  } catch (error) {
    lines.push({
      stream: 'stderr',
      text: error instanceof Error ? `${error.name}: ${error.message}` : String(error),
    });
    return { lines, exitCode: 1 };
  }
}
