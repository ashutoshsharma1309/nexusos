/**
 * A small, dependency-free expression evaluator shared by the Python/C/C++
 * interpreters. It supports numbers, strings, booleans, identifiers, function
 * calls, arithmetic (+ - * / // % **), comparison and boolean operators, plus
 * Python-flavoured semantics (`+`/`*` on strings, float `/`, floor `//`).
 *
 * It is intentionally a subset — enough to run the programs a learner actually
 * writes — and throws a descriptive Error on anything it cannot handle.
 */
export type Value = number | string | boolean;
export type Scope = Map<string, Value>;
export type Builtins = Record<string, (args: Value[]) => Value>;

interface Token {
  kind: 'num' | 'str' | 'id' | 'op' | 'punc';
  value: string;
}

const OPS = ['**', '//', '==', '!=', '<=', '>=', '&&', '||', '+', '-', '*', '/', '%', '<', '>', '!'];

function tokenize(src: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < src.length) {
    const ch = src[i]!;
    if (ch === ' ' || ch === '\t') {
      i++;
      continue;
    }
    if (ch === '"' || ch === "'") {
      let str = '';
      i++;
      while (i < src.length && src[i] !== ch) {
        if (src[i] === '\\') {
          const next = src[i + 1];
          str += next === 'n' ? '\n' : next === 't' ? '\t' : next === '\\' ? '\\' : (next ?? '');
          i += 2;
        } else {
          str += src[i];
          i++;
        }
      }
      i++;
      tokens.push({ kind: 'str', value: str });
      continue;
    }
    if (/[0-9]/.test(ch) || (ch === '.' && /[0-9]/.test(src[i + 1] ?? ''))) {
      let num = '';
      while (i < src.length && /[0-9.]/.test(src[i]!)) num += src[i++];
      tokens.push({ kind: 'num', value: num });
      continue;
    }
    if (/[A-Za-z_]/.test(ch)) {
      let id = '';
      while (i < src.length && /[A-Za-z0-9_]/.test(src[i]!)) id += src[i++];
      tokens.push({ kind: 'id', value: id });
      continue;
    }
    const two = src.slice(i, i + 2);
    const op = OPS.find((o) => o.length === 2 && o === two) ?? OPS.find((o) => o.length === 1 && o === ch);
    if (op) {
      tokens.push({ kind: 'op', value: op });
      i += op.length;
      continue;
    }
    if ('(),?:'.includes(ch)) {
      tokens.push({ kind: 'punc', value: ch });
      i++;
      continue;
    }
    throw new Error(`Unexpected token '${ch}'`);
  }
  return tokens;
}

const num = (v: Value): number => (typeof v === 'number' ? v : Number(v));

/** Truthiness for conditional expressions: 0 / '' / false are falsy. */
const truthy = (v: Value): boolean => v !== 0 && v !== '' && v !== false;

/**
 * Evaluate a single expression against a variable scope + builtins.
 * `cIntDiv` selects C semantics for `/` (integer division when both operands are
 * integers and no float literal appears); Python leaves it false (true division).
 */
export function evaluate(src: string, scope: Scope, builtins: Builtins = {}, cIntDiv = false): Value {
  const tokens = tokenize(src);
  // Integer division only when the whole expression is integer-typed.
  const intDivMode = cIntDiv && !tokens.some((t) => t.kind === 'num' && t.value.includes('.'));
  let pos = 0;
  const peek = () => tokens[pos];
  const eat = () => tokens[pos++];

  function binary(next: () => Value, ops: string[]): Value {
    let left = next();
    while (peek()?.kind === 'op' && ops.includes(peek()!.value)) {
      const op = eat()!.value;
      const right = next();
      left = applyOp(op, left, right, intDivMode);
    }
    return left;
  }

  // Ternary sits at the top of the precedence chain and is right-associative.
  function conditional(): Value {
    const cond = or();
    if (peek()?.value === '?') {
      eat();
      const whenTrue = conditional();
      if (peek()?.value !== ':') throw new Error("Expected ':' in conditional expression");
      eat();
      const whenFalse = conditional();
      return truthy(cond) ? whenTrue : whenFalse;
    }
    return cond;
  }

  const or = (): Value => binary(and, ['||']);
  const and = (): Value => binary(equality, ['&&']);
  const equality = (): Value => binary(comparison, ['==', '!=']);
  const comparison = (): Value => binary(additive, ['<', '<=', '>', '>=']);
  const additive = (): Value => binary(multiplicative, ['+', '-']);
  const multiplicative = (): Value => binary(power, ['*', '/', '//', '%']);

  function power(): Value {
    const left = unary();
    if (peek()?.kind === 'op' && peek()!.value === '**') {
      eat();
      return num(left) ** num(power());
    }
    return left;
  }

  function unary(): Value {
    const t = peek();
    if (t?.kind === 'op' && (t.value === '-' || t.value === '+' || t.value === '!')) {
      eat();
      const v = unary();
      if (t.value === '-') return -num(v);
      if (t.value === '!') return !v;
      return num(v);
    }
    return primary();
  }

  function primary(): Value {
    const t = eat();
    if (!t) throw new Error('Unexpected end of expression');
    if (t.kind === 'num') return Number(t.value);
    if (t.kind === 'str') return t.value;
    if (t.kind === 'punc' && t.value === '(') {
      const v = conditional();
      if (peek()?.value !== ')') throw new Error("Expected ')'");
      eat();
      return v;
    }
    if (t.kind === 'id') {
      if (t.value === 'True') return true;
      if (t.value === 'False') return false;
      if (peek()?.value === '(') {
        eat();
        const args: Value[] = [];
        while (peek() && peek()!.value !== ')') {
          args.push(conditional());
          if (peek()?.value === ',') eat();
        }
        eat();
        const fn = builtins[t.value];
        if (!fn) throw new Error(`name '${t.value}' is not defined`);
        return fn(args);
      }
      if (!scope.has(t.value)) throw new Error(`name '${t.value}' is not defined`);
      return scope.get(t.value)!;
    }
    throw new Error(`Unexpected token '${t.value}'`);
  }

  const result = conditional();
  if (pos < tokens.length) throw new Error(`Unexpected token '${peek()!.value}'`);
  return result;
}

function applyOp(op: string, a: Value, b: Value, intDiv = false): Value {
  switch (op) {
    case '+':
      return typeof a === 'string' || typeof b === 'string' ? `${str(a)}${str(b)}` : num(a) + num(b);
    case '-':
      return num(a) - num(b);
    case '*':
      if (typeof a === 'string') return a.repeat(Math.max(0, num(b)));
      if (typeof b === 'string') return b.repeat(Math.max(0, num(a)));
      return num(a) * num(b);
    case '/':
      // C integer division truncates toward zero when both operands are ints.
      return intDiv && Number.isInteger(num(a)) && Number.isInteger(num(b))
        ? Math.trunc(num(a) / num(b))
        : num(a) / num(b);
    case '//':
      return Math.floor(num(a) / num(b));
    case '%':
      return num(a) % num(b);
    case '<':
      return a < b;
    case '<=':
      return a <= b;
    case '>':
      return a > b;
    case '>=':
      return a >= b;
    case '==':
      return a === b;
    case '!=':
      return a !== b;
    case '&&':
      return Boolean(a) && Boolean(b);
    case '||':
      return Boolean(a) || Boolean(b);
    default:
      throw new Error(`Unsupported operator '${op}'`);
  }
}

/** Python-style stringification used by print()/output. */
export function str(v: Value): string {
  if (typeof v === 'boolean') return v ? 'True' : 'False';
  if (typeof v === 'number' && Number.isInteger(v)) return String(v);
  return String(v);
}
