import { evaluate, str, type Builtins, type Scope } from './expr';
import { STEP_LIMIT, type RunLine, type Stream } from './types';

/**
 * A focused interpreter for the imperative core of C and C++: variable
 * declarations, assignments, arithmetic, `printf`/`puts` and `cout <<` output,
 * plus `for`/`while`/`if`. It runs the programs a learner writes without a
 * compiler — output is byte-accurate for the common cases.
 */

interface Node {
  kind: 'simple' | 'for' | 'while' | 'if';
  text?: string;
  init?: string;
  cond?: string;
  incr?: string;
  body?: Node[];
  elseBody?: Node[];
}

class Break {}
class Continue {}

const builtins: Builtins = {
  sqrt: (a) => Math.sqrt(Number(a[0] ?? 0)),
  pow: (a) => Number(a[0] ?? 0) ** Number(a[1] ?? 0),
  abs: (a) => Math.abs(Number(a[0] ?? 0)),
  strlen: (a) => (typeof a[0] === 'string' ? a[0].length : 0),
};

const unescape = (s: string): string =>
  s.replace(/\\(.)/g, (_, c: string) => (c === 'n' ? '\n' : c === 't' ? '\t' : c));

const asString = (token: string): string | null => {
  const t = token.trim();
  if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'")))
    return unescape(t.slice(1, -1));
  return null;
};

function stripComments(code: string): string {
  return code
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/[^\n]*/g, '')
    .replace(/^[ \t]*#.*$/gm, '')
    .replace(/using\s+namespace\s+std\s*;/g, '')
    .replace(/std::(cout|cerr|endl|string)/g, '$1');
}

function matching(src: string, open: number, o: string, c: string): number {
  let depth = 0;
  for (let i = open; i < src.length; i++) {
    if (src[i] === o) depth++;
    else if (src[i] === c && --depth === 0) return i;
  }
  return src.length;
}

/** Extract the body of `main`, or fall back to the whole translation unit. */
function mainBody(code: string): string {
  const m = code.match(/\bmain\s*\([^)]*\)\s*\{/);
  if (!m || m.index === undefined) return code;
  const open = code.indexOf('{', m.index);
  return code.slice(open + 1, matching(code, open, '{', '}'));
}

function splitTop(src: string, sep: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let inStr: string | null = null;
  let cur = '';
  for (let i = 0; i < src.length; i++) {
    const ch = src[i]!;
    if (inStr) {
      cur += ch;
      if (ch === inStr && src[i - 1] !== '\\') inStr = null;
    } else if (ch === '"' || ch === "'") {
      inStr = ch;
      cur += ch;
    } else if (ch === '(' || ch === '{' || ch === '[') {
      depth++;
      cur += ch;
    } else if (ch === ')' || ch === '}' || ch === ']') {
      depth--;
      cur += ch;
    } else if (depth === 0 && src.startsWith(sep, i)) {
      parts.push(cur);
      cur = '';
      i += sep.length - 1;
    } else cur += ch;
  }
  if (cur.trim()) parts.push(cur);
  return parts;
}

/** Parse a block of source into statement nodes (recursive for control flow). */
function parse(src: string): Node[] {
  const nodes: Node[] = [];
  let i = 0;
  const skip = () => {
    while (i < src.length && /\s/.test(src[i]!)) i++;
  };
  while (i < src.length) {
    skip();
    if (i >= src.length || src[i] === '}') break;
    const kw = src.slice(i).match(/^(for|while|if)\b/);
    if (kw) {
      const parenOpen = src.indexOf('(', i);
      const parenClose = matching(src, parenOpen, '(', ')');
      const head = src.slice(parenOpen + 1, parenClose);
      let bodyStart = parenClose + 1;
      while (bodyStart < src.length && /\s/.test(src[bodyStart]!)) bodyStart++;
      let body: string;
      if (src[bodyStart] === '{') {
        const close = matching(src, bodyStart, '{', '}');
        body = src.slice(bodyStart + 1, close);
        i = close + 1;
      } else {
        const semi = src.indexOf(';', bodyStart);
        body = src.slice(bodyStart, semi + 1);
        i = semi + 1;
      }
      if (kw[1] === 'for') {
        const [init, cond, incr] = splitTop(head, ';');
        nodes.push({ kind: 'for', init: init?.trim(), cond: cond?.trim(), incr: incr?.trim(), body: parse(body) });
      } else if (kw[1] === 'while') {
        nodes.push({ kind: 'while', cond: head.trim(), body: parse(body) });
      } else {
        const node: Node = { kind: 'if', cond: head.trim(), body: parse(body) };
        skip();
        if (src.slice(i).match(/^else\b/)) {
          i += 4;
          skip();
          if (src[i] === '{') {
            const close = matching(src, i, '{', '}');
            node.elseBody = parse(src.slice(i + 1, close));
            i = close + 1;
          } else {
            const semi = src.indexOf(';', i);
            node.elseBody = parse(src.slice(i, semi + 1));
            i = semi + 1;
          }
        }
        nodes.push(node);
      }
      continue;
    }
    const semi = src.indexOf(';', i);
    const end = semi === -1 ? src.length : semi;
    const text = src.slice(i, end).trim();
    if (text) nodes.push({ kind: 'simple', text });
    i = end + 1;
  }
  return nodes;
}

const DECL =
  /^(?:const\s+)?(?:unsigned\s+|signed\s+)?(?:long\s+|short\s+)*(?:int|long|short|float|double|char|bool|auto|size_t|string)\b\s*[*&]?\s*(.+)$/;

export function runClike(code: string): { lines: RunLine[]; exitCode: number } {
  const out: RunLine[] = [];
  const steps = { n: 0 };
  let buffer = '';
  let bufferStream: Stream = 'stdout';

  const emit = (text: string, stream: Stream = 'stdout') => {
    if (stream !== bufferStream && buffer) {
      out.push({ stream: bufferStream, text: buffer });
      buffer = '';
    }
    bufferStream = stream;
    buffer += text;
    let nl = buffer.indexOf('\n');
    while (nl !== -1) {
      out.push({ stream, text: buffer.slice(0, nl) });
      buffer = buffer.slice(nl + 1);
      nl = buffer.indexOf('\n');
    }
  };
  const tick = () => {
    if (++steps.n > STEP_LIMIT) throw new Error('runtime error: step limit exceeded (possible infinite loop)');
  };

  function printf(argSrc: string, scope: Scope): void {
    const args = splitTop(argSrc, ',').map((a) => a.trim());
    const fmt = asString(args[0] ?? '') ?? '';
    const values = args.slice(1).map((a) => evaluate(a, scope, builtins));
    let ai = 0;
    const text = fmt.replace(/%[-+ 0#]*(\d+)?(?:\.(\d+))?([diufFeEgGsxXc%])/g, (m, _w, prec, conv) => {
      if (conv === '%') return '%';
      const arg = values[ai++];
      switch (conv) {
        case 'd': case 'i': case 'u': return String(Math.trunc(Number(arg)));
        case 'x': return Math.trunc(Number(arg)).toString(16);
        case 'X': return Math.trunc(Number(arg)).toString(16).toUpperCase();
        case 'f': case 'F': case 'e': case 'E': case 'g': case 'G':
          return Number(arg).toFixed(prec !== undefined ? Number(prec) : 6);
        case 's': return str(arg ?? '');
        case 'c': return typeof arg === 'number' ? String.fromCharCode(arg) : String(arg ?? '').slice(0, 1);
        default: return m;
      }
    });
    emit(text);
  }

  function cout(rest: string, scope: Scope, stream: Stream): void {
    for (const piece of splitTop(rest, '<<')) {
      const p = piece.trim();
      if (!p) continue;
      if (p === 'endl') emit('\n', stream);
      else {
        const s = asString(p);
        emit(s !== null ? s : str(evaluate(p, scope, builtins)), stream);
      }
    }
  }

  function simple(text: string, scope: Scope): void {
    tick();
    if (text.startsWith('return')) return;
    if (text.startsWith('printf')) return printf(text.slice(text.indexOf('(') + 1, text.lastIndexOf(')')), scope);
    if (text.startsWith('puts')) {
      const arg = text.slice(text.indexOf('(') + 1, text.lastIndexOf(')'));
      return emit((asString(arg) ?? str(evaluate(arg, scope, builtins))) + '\n');
    }
    if (text.startsWith('cout')) return cout(text.slice(4), scope, 'stdout');
    if (text.startsWith('cerr')) return cout(text.slice(4), scope, 'stderr');

    const incr = text.match(/^([A-Za-z_]\w*)(\+\+|--)$|^(\+\+|--)([A-Za-z_]\w*)$/);
    if (incr) {
      const name = incr[1] ?? incr[4]!;
      const delta = (incr[2] ?? incr[3]) === '++' ? 1 : -1;
      scope.set(name, Number(scope.get(name) ?? 0) + delta);
      return;
    }

    const decl = text.match(DECL);
    const body = decl ? decl[1]! : text;
    if (decl) {
      for (const d of splitTop(body, ',')) {
        const eq = d.indexOf('=');
        if (eq === -1) scope.set(d.trim(), 0);
        else scope.set(d.slice(0, eq).trim(), evaluate(d.slice(eq + 1), scope, builtins));
      }
      return;
    }

    const asg = text.match(/^([A-Za-z_]\w*)\s*((?:[+\-*/%])?)=(?!=)\s*(.+)$/);
    if (asg) {
      const [, name, op, rhs] = asg;
      const value = evaluate(rhs!, scope, builtins);
      if (op) scope.set(name!, evaluate('__a ' + op + ' __b', new Map([['__a', scope.get(name!) ?? 0], ['__b', value]]), builtins));
      else scope.set(name!, value);
      return;
    }
    if (text.trim()) evaluate(text, scope, builtins);
  }

  function run(nodes: Node[], scope: Scope): void {
    for (const node of nodes) {
      tick();
      if (node.kind === 'simple') simple(node.text!, scope);
      else if (node.kind === 'if') {
        if (evaluate(node.cond!, scope, builtins)) run(node.body!, scope);
        else if (node.elseBody) run(node.elseBody, scope);
      } else if (node.kind === 'while') {
        while (evaluate(node.cond!, scope, builtins)) {
          tick();
          try {
            run(node.body!, scope);
          } catch (e) {
            if (e instanceof Break) break;
            if (e instanceof Continue) continue;
            throw e;
          }
        }
      } else if (node.kind === 'for') {
        if (node.init) simple(node.init, scope);
        while (!node.cond || evaluate(node.cond, scope, builtins)) {
          tick();
          try {
            run(node.body!, scope);
          } catch (e) {
            if (e instanceof Break) break;
            if (e instanceof Continue) {
              /* fall through to increment */
            } else throw e;
          }
          if (node.incr) simple(node.incr, scope);
        }
      }
    }
  }

  try {
    run(parse(mainBody(stripComments(code))), new Map());
    if (buffer) out.push({ stream: bufferStream, text: buffer });
  } catch (e) {
    if (buffer) out.push({ stream: bufferStream, text: buffer });
    out.push({ stream: 'stderr', text: e instanceof Error ? e.message : String(e) });
    return { lines: out, exitCode: 1 };
  }
  return { lines: out, exitCode: 0 };
}
