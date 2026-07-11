import { evaluate, str, type Builtins, type Scope, type Value } from './expr';
import { STEP_LIMIT, type RunLine } from './types';

/** Control-flow signals thrown through the block executor. */
class Return {
  constructor(readonly value: Value) {}
}
class Break {}
class Continue {}

interface Line {
  indent: number;
  text: string;
}

const truthy = (v: Value): boolean => v !== 0 && v !== '' && v !== false;

function stripComment(raw: string): string {
  let inStr: string | null = null;
  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i]!;
    if (inStr) {
      if (ch === inStr) inStr = null;
    } else if (ch === '"' || ch === "'") inStr = ch;
    else if (ch === '#') return raw.slice(0, i);
  }
  return raw;
}

/** Split a comma-separated argument list, respecting strings and nested parens. */
function splitArgs(src: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let inStr: string | null = null;
  let current = '';
  for (const ch of src) {
    if (inStr) {
      current += ch;
      if (ch === inStr) inStr = null;
    } else if (ch === '"' || ch === "'") {
      inStr = ch;
      current += ch;
    } else if (ch === '(') {
      depth++;
      current += ch;
    } else if (ch === ')') {
      depth--;
      current += ch;
    } else if (ch === ',' && depth === 0) {
      parts.push(current.trim());
      current = '';
    } else current += ch;
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
}

function makeBuiltins(out: RunLine[], readLine: () => string): Builtins {
  const n = (v: Value) => (typeof v === 'number' ? v : Number(v));
  return {
    print: (args) => {
      out.push({ stream: 'stdout', text: args.map(str).join(' ') });
      return 0;
    },
    input: (args) => {
      if (args[0] !== undefined) out.push({ stream: 'stdout', text: str(args[0]) });
      return readLine();
    },
    len: (a) => (typeof a[0] === 'string' ? a[0].length : 0),
    str: (a) => str(a[0] ?? ''),
    int: (a) => Math.trunc(n(a[0] ?? 0)),
    float: (a) => n(a[0] ?? 0),
    abs: (a) => Math.abs(n(a[0] ?? 0)),
    round: (a) => Math.round(n(a[0] ?? 0)),
    min: (a) => Math.min(...a.map(n)),
    max: (a) => Math.max(...a.map(n)),
    bool: (a) => truthy(a[0] ?? 0),
  };
}

/** The index range [start, endExclusive) of the body indented under `header`. */
function blockRange(lines: Line[], header: number, end: number): [number, number] {
  const base = lines[header]!.indent;
  let j = header + 1;
  while (j < end && lines[j]!.indent > base) j++;
  return [header + 1, j];
}

const ASSIGN = /^([A-Za-z_]\w*)\s*((?:\/\/|\*\*|[+\-*/%])?)=(?!=)\s*(.+)$/;

export function runPython(code: string, stdin = ''): { lines: RunLine[]; exitCode: number } {
  const lines: Line[] = [];
  for (const raw of code.replace(/\r/g, '').replace(/\t/g, '    ').split('\n')) {
    const noComment = stripComment(raw);
    if (!noComment.trim()) continue;
    lines.push({ indent: noComment.length - noComment.trimStart().length, text: noComment.trim() });
  }

  const out: RunLine[] = [];
  const inputLines = stdin.split('\n');
  let linePos = 0;
  const builtins = makeBuiltins(out, () => inputLines[linePos++] ?? '');
  const steps = { n: 0 };
  const tick = () => {
    if (++steps.n > STEP_LIMIT) throw new Error('RuntimeError: step limit exceeded (possible infinite loop)');
  };

  function exec(start: number, end: number, scope: Scope): void {
    let i = start;
    while (i < end) {
      const { text, indent } = lines[i]!;
      tick();

      if (text.startsWith('def ')) {
        const m = text.slice(4).match(/^([A-Za-z_]\w*)\s*\(([^)]*)\)\s*:$/);
        if (!m) throw new Error('SyntaxError: invalid function definition');
        const [bodyStart, bodyEnd] = blockRange(lines, i, end);
        const params = splitArgs(m[2]!);
        builtins[m[1]!] = (args) => {
          const local: Scope = new Map(scope);
          params.forEach((p, idx) => local.set(p, args[idx] ?? 0));
          try {
            exec(bodyStart, bodyEnd, local);
          } catch (e) {
            if (e instanceof Return) return e.value;
            throw e;
          }
          return 0;
        };
        i = bodyEnd;
        continue;
      }

      if (text.startsWith('for ')) {
        const m = text.match(/^for\s+([A-Za-z_]\w*)\s+in\s+range\((.*)\)\s*:$/);
        if (!m) throw new Error('SyntaxError: only "for x in range(...)" loops are supported');
        const bounds = splitArgs(m[2]!).map((a) => Number(evaluate(a, scope, builtins)));
        const [s0, e0, step] =
          bounds.length === 1 ? [0, bounds[0]!, 1] : bounds.length === 2 ? [bounds[0]!, bounds[1]!, 1] : [bounds[0]!, bounds[1]!, bounds[2]!];
        const [bodyStart, bodyEnd] = blockRange(lines, i, end);
        for (let v = s0; step > 0 ? v < e0 : v > e0; v += step) {
          scope.set(m[1]!, v);
          tick();
          try {
            exec(bodyStart, bodyEnd, scope);
          } catch (e) {
            if (e instanceof Break) break;
            if (e instanceof Continue) continue;
            throw e;
          }
        }
        i = bodyEnd;
        continue;
      }

      if (text.startsWith('while ')) {
        const cond = text.slice(6, -1);
        const [bodyStart, bodyEnd] = blockRange(lines, i, end);
        while (truthy(evaluate(cond, scope, builtins))) {
          tick();
          try {
            exec(bodyStart, bodyEnd, scope);
          } catch (e) {
            if (e instanceof Break) break;
            if (e instanceof Continue) continue;
            throw e;
          }
        }
        i = bodyEnd;
        continue;
      }

      if (text.startsWith('if ')) {
        let clause = i;
        let done = false;
        while (clause < end && lines[clause]!.indent === indent) {
          const t = lines[clause]!.text;
          const isIf = t.startsWith('if ');
          const isElif = t.startsWith('elif ');
          const isElse = t === 'else:';
          if (!isIf && !isElif && !isElse) break;
          const [bStart, bEnd] = blockRange(lines, clause, end);
          const cond = isElse ? true : truthy(evaluate(t.slice(isIf ? 3 : 5, -1), scope, builtins));
          if (!done && cond) {
            exec(bStart, bEnd, scope);
            done = true;
          }
          clause = bEnd;
          if (isElse) break;
        }
        i = clause;
        continue;
      }

      if (text === 'break') throw new Break();
      if (text === 'continue') throw new Continue();
      if (text.startsWith('return')) {
        const expr = text.slice(6).trim();
        throw new Return(expr ? evaluate(expr, scope, builtins) : 0);
      }

      const asg = text.match(ASSIGN);
      if (asg) {
        const [, name, op, rhs] = asg;
        const value = evaluate(rhs!, scope, builtins);
        if (op) {
          const cur = scope.get(name!) ?? 0;
          scope.set(name!, evaluate(`__a ${op} __b`, new Map([['__a', cur], ['__b', value]]), builtins));
        } else scope.set(name!, value);
        i++;
        continue;
      }

      evaluate(text, scope, builtins);
      i++;
    }
  }

  try {
    exec(0, lines.length, new Map());
  } catch (e) {
    out.push({ stream: 'stderr', text: e instanceof Error ? e.message : String(e) });
    return { lines: out, exitCode: 1 };
  }
  return { lines: out, exitCode: 0 };
}
