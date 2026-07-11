import { evaluate, str, type Builtins, type Scope, type Value } from './expr';
import { NeedInput, STEP_LIMIT, type RunLine, type Stream } from './types';

/**
 * A focused interpreter for the imperative core of C and C++: variable
 * declarations, assignments, arithmetic (with C integer division), user-defined
 * functions with recursion, `printf`/`puts`/`cout` output with width/precision,
 * `scanf` reading real stdin, and `for`/`while`/`if`. It runs the programs a
 * learner writes without a compiler — output is byte-accurate for common cases.
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

interface FunctionDef {
  params: string[];
  body: Node[];
}

class Break {}
class Continue {}
class ReturnSignal {
  constructor(readonly value: Value) {}
}

const MATH_BUILTINS: Builtins = {
  sqrt: (a) => Math.sqrt(Number(a[0] ?? 0)),
  pow: (a) => Number(a[0] ?? 0) ** Number(a[1] ?? 0),
  abs: (a) => Math.abs(Number(a[0] ?? 0)),
  fabs: (a) => Math.abs(Number(a[0] ?? 0)),
  floor: (a) => Math.floor(Number(a[0] ?? 0)),
  ceil: (a) => Math.ceil(Number(a[0] ?? 0)),
  round: (a) => Math.round(Number(a[0] ?? 0)),
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
    .replace(/std::(cout|cerr|cin|endl|string)/g, '$1');
}

function matching(src: string, open: number, o: string, c: string): number {
  let depth = 0;
  for (let i = open; i < src.length; i++) {
    if (src[i] === o) depth++;
    else if (src[i] === c && --depth === 0) return i;
  }
  return src.length;
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

function skipWs(src: string, i: number): number {
  while (i < src.length && /\s/.test(src[i]!)) i++;
  return i;
}

/** Find the end of a top-level simple statement (the `;`), respecting nesting. */
function statementEnd(src: string, from: number): number {
  let depth = 0;
  let inStr: string | null = null;
  for (let i = from; i < src.length; i++) {
    const ch = src[i]!;
    if (inStr) {
      if (ch === inStr && src[i - 1] !== '\\') inStr = null;
    } else if (ch === '"' || ch === "'") inStr = ch;
    else if (ch === '(' || ch === '{' || ch === '[') depth++;
    else if (ch === ')' || ch === '}' || ch === ']') depth--;
    else if (ch === ';' && depth === 0) return i;
  }
  return src.length;
}

/** Parse a single statement (simple, or a for/while/if with a possibly-braceless
 *  body that is itself one statement). Returns the node and the next index. */
function parseStatement(src: string, start: number): { node: Node | null; next: number } {
  const i = skipWs(src, start);
  if (i >= src.length || src[i] === '}') return { node: null, next: src.length };

  const kw = src.slice(i).match(/^(for|while|if)\b/);
  if (kw) {
    const parenOpen = src.indexOf('(', i);
    const parenClose = matching(src, parenOpen, '(', ')');
    const head = src.slice(parenOpen + 1, parenClose);
    const bodyStart = skipWs(src, parenClose + 1);

    const readBody = (at: number): { body: Node[]; next: number } => {
      if (src[at] === '{') {
        const close = matching(src, at, '{', '}');
        return { body: parse(src.slice(at + 1, close)), next: close + 1 };
      }
      const one = parseStatement(src, at);
      return { body: one.node ? [one.node] : [], next: one.next };
    };

    const { body, next } = readBody(bodyStart);
    if (kw[1] === 'for') {
      const [init, cond, incr] = splitTop(head, ';');
      return { node: { kind: 'for', init: init?.trim(), cond: cond?.trim(), incr: incr?.trim(), body }, next };
    }
    if (kw[1] === 'while') {
      return { node: { kind: 'while', cond: head.trim(), body }, next };
    }
    const node: Node = { kind: 'if', cond: head.trim(), body };
    const afterIf = skipWs(src, next);
    if (src.slice(afterIf).match(/^else\b/)) {
      const elseParts = readBody(skipWs(src, afterIf + 4));
      node.elseBody = elseParts.body;
      return { node, next: elseParts.next };
    }
    return { node, next };
  }

  const semi = statementEnd(src, i);
  const text = src.slice(i, semi).trim();
  return { node: text ? { kind: 'simple', text } : null, next: semi + 1 };
}

/** Parse a block of source into statement nodes (recursive for control flow). */
function parse(src: string): Node[] {
  const nodes: Node[] = [];
  let i = 0;
  while (i < src.length) {
    i = skipWs(src, i);
    if (i >= src.length || src[i] === '}') break;
    const { node, next } = parseStatement(src, i);
    if (node) nodes.push(node);
    i = next > i ? next : i + 1; // guarantee forward progress
  }
  return nodes;
}

/** The declared name of a parameter or declarator: the last identifier. */
function lastName(decl: string): string {
  const ids = decl.replace(/\[[^\]]*\]/g, '').match(/[A-Za-z_]\w*/g);
  const KEYWORDS = new Set(['const', 'unsigned', 'signed', 'long', 'short', 'int', 'char', 'float', 'double', 'void', 'bool', 'size_t', 'string', 'auto', 'struct']);
  const names = ids?.filter((id) => !KEYWORDS.has(id)) ?? [];
  return names[names.length - 1] ?? '';
}

/** Split a translation unit into functions and top-level statements. */
function parseProgram(code: string): { functions: Map<string, FunctionDef>; globals: Node[]; main: Node[] | null } {
  const functions = new Map<string, FunctionDef>();
  const globals: Node[] = [];
  let main: Node[] | null = null;
  const n = code.length;
  let i = 0;

  while (i < n) {
    while (i < n && /\s/.test(code[i]!)) i++;
    if (i >= n) break;

    let depth = 0;
    let inStr: string | null = null;
    let brace = -1;
    let semi = -1;
    for (let j = i; j < n; j++) {
      const ch = code[j]!;
      if (inStr) {
        if (ch === inStr && code[j - 1] !== '\\') inStr = null;
      } else if (ch === '"' || ch === "'") inStr = ch;
      else if (ch === '(' || ch === '[') depth++;
      else if (ch === ')' || ch === ']') depth--;
      else if (depth === 0 && ch === '{') { brace = j; break; }
      else if (depth === 0 && ch === ';') { semi = j; break; }
    }
    if (brace === -1 && semi === -1) break;

    if (semi !== -1 && (brace === -1 || semi < brace)) {
      const stmt = code.slice(i, semi).trim();
      // A prototype (has `()` but no initializer) is skipped; real globals run.
      if (stmt && !(/\(/.test(stmt) && !/=/.test(stmt))) globals.push({ kind: 'simple', text: stmt });
      i = semi + 1;
      continue;
    }

    const header = code.slice(i, brace).trim();
    const close = matching(code, brace, '{', '}');
    const inner = code.slice(brace + 1, close);
    const sig = header.match(/([A-Za-z_]\w*)\s*\(([^)]*)\)\s*$/);
    if (sig) {
      const name = sig[1]!;
      const params = splitTop(sig[2]!, ',')
        .map((p) => lastName(p))
        .filter(Boolean);
      const body = parse(inner);
      if (name === 'main') main = body;
      else functions.set(name, { params, body });
    }
    i = close + 1;
  }

  return { functions, globals, main };
}

/** Format one printf conversion with flags/width/precision. */
function formatSpec(flags: string, width: string | undefined, prec: string | undefined, conv: string, arg: Value): string {
  let s: string;
  switch (conv) {
    case 'd': case 'i': case 'u': s = String(Math.trunc(Number(arg))); break;
    case 'x': s = Math.trunc(Number(arg)).toString(16); break;
    case 'X': s = Math.trunc(Number(arg)).toString(16).toUpperCase(); break;
    case 'f': case 'F': case 'e': case 'E': case 'g': case 'G':
      s = Number(arg).toFixed(prec !== undefined ? Number(prec) : 6); break;
    case 's': s = str(arg ?? ''); break;
    case 'c': s = typeof arg === 'number' ? String.fromCharCode(arg) : String(arg ?? '').slice(0, 1); break;
    default: return '';
  }
  const w = width ? Number(width) : 0;
  if (s.length >= w) return s;
  const left = flags.includes('-');
  const zero = flags.includes('0') && !left && 'diufFeEgGxX'.includes(conv);
  const fill = w - s.length;
  if (left) return s + ' '.repeat(fill);
  if (zero) return s.startsWith('-') ? '-' + '0'.repeat(fill) + s.slice(1) : '0'.repeat(fill) + s;
  return ' '.repeat(fill) + s;
}

export function runClike(code: string, stdin = ''): { lines: RunLine[]; exitCode: number; waitingForInput?: boolean } {
  const out: RunLine[] = [];
  const steps = { n: 0 };
  let buffer = '';
  let bufferStream: Stream = 'stdout';

  // Real stdin consumed by scanf/cin. Reading past the end throws NeedInput so
  // the caller can prompt the user and resume.
  let cursor = 0;
  const readToken = (): string => {
    while (cursor < stdin.length && /\s/.test(stdin[cursor]!)) cursor++;
    if (cursor >= stdin.length) throw new NeedInput();
    let token = '';
    while (cursor < stdin.length && !/\s/.test(stdin[cursor]!)) token += stdin[cursor++];
    return token;
  };

  const { functions, globals, main } = parseProgram(stripComments(code));
  const B: Builtins = { ...MATH_BUILTINS };
  const globalScope: Scope = new Map();

  const ev = (src: string, scope: Scope): Value => evaluate(src, scope, B, true);

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
    const values = args.slice(1).map((a) => ev(a, scope));
    let ai = 0;
    const text = fmt.replace(
      /%([-+ 0#]*)(\d+)?(?:\.(\d+))?([diufFeEgGsxXc%])/g,
      (_m, flags: string, width: string | undefined, prec: string | undefined, conv: string) =>
        conv === '%' ? '%' : formatSpec(flags, width, prec, conv, values[ai++] ?? 0),
    );
    emit(text);
  }

  function scanf(argSrc: string, scope: Scope): void {
    const args = splitTop(argSrc, ',').map((a) => a.trim());
    const fmt = asString(args[0] ?? '') ?? '';
    const specs = fmt.match(/%l?[dioufgescx]/g) ?? [];
    const targets = args.slice(1);
    specs.forEach((spec, idx) => {
      const target = targets[idx];
      if (target === undefined) return;
      const name = target.replace(/^\s*&\s*/, '').trim();
      const token = readToken();
      if (name.includes('[')) return; // array elements unsupported
      let value: Value;
      if (/[dioux]/.test(spec)) value = parseInt(token, 10) || 0;
      else if (/[fge]/.test(spec)) value = parseFloat(token) || 0;
      else if (spec.includes('c')) value = token.slice(0, 1);
      else value = token; // %s
      scope.set(name, value);
    });
  }

  function cin(rest: string, scope: Scope): void {
    for (const piece of splitTop(rest, '>>')) {
      const name = piece.trim();
      if (!name) continue;
      const token = readToken();
      const asNumber = Number(token);
      scope.set(name, token !== '' && !Number.isNaN(asNumber) ? asNumber : token);
    }
  }

  function cout(rest: string, scope: Scope, stream: Stream): void {
    for (const piece of splitTop(rest, '<<')) {
      const p = piece.trim();
      if (!p) continue;
      if (p === 'endl') emit('\n', stream);
      else {
        const s = asString(p);
        emit(s !== null ? s : str(ev(p, scope)), stream);
      }
    }
  }

  const DECL =
    /^(?:const\s+)?(?:unsigned\s+|signed\s+)?(?:long\s+|short\s+)*(?:int|long|short|float|double|char|bool|auto|size_t|string)\b\s*[*&]?\s*(.+)$/;

  function simple(text: string, scope: Scope): void {
    tick();
    if (/^return\b/.test(text)) {
      const expr = text.slice(6).trim();
      throw new ReturnSignal(expr ? ev(expr, scope) : 0);
    }
    if (/^printf\b/.test(text)) return printf(text.slice(text.indexOf('(') + 1, text.lastIndexOf(')')), scope);
    if (/^scanf\b/.test(text)) return scanf(text.slice(text.indexOf('(') + 1, text.lastIndexOf(')')), scope);
    if (/^puts\b/.test(text)) {
      const arg = text.slice(text.indexOf('(') + 1, text.lastIndexOf(')'));
      return emit((asString(arg) ?? str(ev(arg, scope))) + '\n');
    }
    if (/^cout\b/.test(text)) return cout(text.slice(4), scope, 'stdout');
    if (/^cerr\b/.test(text)) return cout(text.slice(4), scope, 'stderr');
    if (/^cin\b/.test(text)) return cin(text.slice(3), scope);

    const incr = text.match(/^([A-Za-z_]\w*)(\+\+|--)$|^(\+\+|--)([A-Za-z_]\w*)$/);
    if (incr) {
      const name = incr[1] ?? incr[4]!;
      scope.set(name, Number(scope.get(name) ?? 0) + ((incr[2] ?? incr[3]) === '++' ? 1 : -1));
      return;
    }

    const decl = text.match(DECL);
    if (decl) {
      for (const d of splitTop(decl[1]!, ',')) {
        const eq = d.indexOf('=');
        if (eq === -1) scope.set(lastName(d), 0);
        else scope.set(lastName(d.slice(0, eq)), ev(d.slice(eq + 1), scope));
      }
      return;
    }

    const asg = text.match(/^([A-Za-z_]\w*)\s*((?:[+\-*/%])?)=(?!=)\s*(.+)$/);
    if (asg) {
      const [, name, op, rhs] = asg;
      const value = ev(rhs!, scope);
      if (op) scope.set(name!, evaluate('__a ' + op + ' __b', new Map([['__a', scope.get(name!) ?? 0], ['__b', value]]), B, true));
      else scope.set(name!, value);
      return;
    }
    if (text.trim()) ev(text, scope);
  }

  function run(nodes: Node[], scope: Scope): void {
    for (const node of nodes) {
      tick();
      if (node.kind === 'simple') simple(node.text!, scope);
      else if (node.kind === 'if') {
        if (ev(node.cond!, scope)) run(node.body!, scope);
        else if (node.elseBody) run(node.elseBody, scope);
      } else if (node.kind === 'while') {
        while (ev(node.cond!, scope)) {
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
        while (!node.cond || ev(node.cond, scope)) {
          tick();
          try {
            run(node.body!, scope);
          } catch (e) {
            if (e instanceof Break) break;
            if (!(e instanceof Continue)) throw e;
          }
          if (node.incr) simple(node.incr, scope);
        }
      }
    }
  }

  // Register user functions so calls resolve inside expressions (supports recursion).
  for (const [name, def] of functions) {
    B[name] = (args) => {
      const local: Scope = new Map(globalScope);
      def.params.forEach((p, idx) => local.set(p, args[idx] ?? 0));
      try {
        run(def.body, local);
      } catch (e) {
        if (e instanceof ReturnSignal) return e.value;
        throw e;
      }
      return 0;
    };
  }

  try {
    for (const g of globals) simple(g.text!, globalScope);
    if (main) run(main, new Map(globalScope));
    if (buffer) out.push({ stream: bufferStream, text: buffer });
  } catch (e) {
    if (buffer) out.push({ stream: bufferStream, text: buffer });
    if (e instanceof NeedInput) return { lines: out, exitCode: 0, waitingForInput: true };
    if (!(e instanceof ReturnSignal)) {
      out.push({ stream: 'stderr', text: e instanceof Error ? e.message : String(e) });
      return { lines: out, exitCode: 1 };
    }
  }
  return { lines: out, exitCode: 0 };
}
