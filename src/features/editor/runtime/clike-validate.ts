/**
 * A conservative "compile" pass for C/C++ that rejects the syntax errors a real
 * compiler would — before any code runs — so bad programs no longer produce
 * output. It reports:
 *   - a missing `;` (a statement not terminated before `return`/`if`/`}`/…)
 *   - a `:` used where `;` was meant
 *   - unbalanced `()[]{}`
 *   - unterminated string/char/comment literals
 *
 * It is a heuristic, not a full parser, and errs toward silence: it only flags
 * cases it can be confident about, so valid code (control flow without braces,
 * aggregate initializers, ternaries, labels, `switch`, multi-word types, …) is
 * never rejected. Positions are 1-based for clang-style diagnostics.
 */
export interface Diagnostic {
  line: number;
  col: number;
  message: string;
}

// Keywords that begin a new statement — seeing one mid-statement means a `;`
// was missing (unless we're right after a control header / `else` / `do`).
const STATEMENT_STARTERS = new Set([
  'return', 'if', 'for', 'while', 'do', 'switch', 'break', 'continue', 'goto', 'else',
]);
const CONTROL_KEYWORDS = new Set(['if', 'for', 'while', 'switch']);
const COLON_KEYWORDS = new Set(['case', 'default', 'public', 'private', 'protected']);
// Type keywords begin a declaration. Flagged as a missing `;` only when they
// follow a completed value (not another type word — so `unsigned int` is fine).
const TYPE_KEYWORDS = new Set([
  'int', 'char', 'float', 'double', 'void', 'long', 'short', 'unsigned', 'signed',
  'bool', 'struct', 'enum', 'union', 'auto', 'size_t', 'string',
]);
const VALUE_ONLY_END = new Set(['value', 'closeParen', 'closeBracket']);

/** Token kinds that end a value (so a following statement-starter needs a `;`). */
const VALUE_END = new Set(['closeParen', 'closeBracket', 'value', 'word']);

interface Brace {
  ch: string;
  line: number;
  col: number;
  block: boolean;
}
interface Paren {
  ch: string;
  line: number;
  col: number;
  control: boolean;
}

export function validateClike(code: string): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  const braceStack: Brace[] = [];
  const parenStack: Paren[] = [];
  let bracketDepth = 0;
  const n = code.length;

  let i = 0;
  let line = 1;
  let col = 1;
  let atLineStart = true;

  // Statement state.
  let prevKind = 'semi'; // acts like we're at the start of a fresh statement
  let prevWord = '';
  let boundaryOk = true; // a new statement may begin here without a preceding `;`
  let pendingTernary = 0;
  let stmtTokens = 0;
  let stmtStartWord: string | null = null;

  const step = () => {
    if (code[i] === '\n') {
      line += 1;
      col = 1;
      atLineStart = true;
    } else {
      col += 1;
    }
    i += 1;
  };

  const startStatement = () => {
    stmtTokens = 0;
    stmtStartWord = null;
    pendingTernary = 0;
  };

  const inStatementContext = () =>
    parenStack.length === 0 &&
    bracketDepth === 0 &&
    braceStack.length > 0 &&
    braceStack[braceStack.length - 1]!.block;

  // Called for every "content" token (word/number/literal/operator/opener) so a
  // fresh statement is recognised the moment its first token appears.
  const beginStatementIfNeeded = () => {
    if (boundaryOk) {
      startStatement();
      boundaryOk = false;
    }
  };

  while (i < n) {
    const ch = code[i]!;

    if (ch === ' ' || ch === '\t' || ch === '\r' || ch === '\n') {
      step();
      continue;
    }

    if (ch === '#' && atLineStart) {
      while (i < n && code[i] !== '\n') step();
      continue;
    }
    atLineStart = false;

    if (ch === '/' && code[i + 1] === '/') {
      while (i < n && code[i] !== '\n') step();
      continue;
    }
    if (ch === '/' && code[i + 1] === '*') {
      const sl = line;
      const sc = col;
      step();
      step();
      while (i < n && !(code[i] === '*' && code[i + 1] === '/')) step();
      if (i >= n) {
        diagnostics.push({ line: sl, col: sc, message: 'unterminated comment' });
        break;
      }
      step();
      step();
      continue;
    }

    // String / char literal — one value token.
    if (ch === '"' || ch === "'") {
      const sl = line;
      const sc = col;
      step();
      while (i < n && code[i] !== ch && code[i] !== '\n') {
        if (code[i] === '\\') step();
        step();
      }
      if (i >= n || code[i] !== ch) {
        diagnostics.push({ line: sl, col: sc, message: `missing terminating ${ch} character` });
      } else {
        step();
      }
      beginStatementIfNeeded();
      stmtTokens += 1;
      prevKind = 'value';
      continue;
    }

    if (ch === '(') {
      beginStatementIfNeeded();
      const control = parenStack.length === 0 && stmtStartWord !== null && CONTROL_KEYWORDS.has(stmtStartWord);
      parenStack.push({ ch, line, col, control });
      stmtTokens += 1;
      prevKind = 'openParen';
      step();
      continue;
    }
    if (ch === '[') {
      beginStatementIfNeeded();
      bracketDepth += 1;
      stmtTokens += 1;
      prevKind = 'openBracket';
      step();
      continue;
    }
    if (ch === '{') {
      const block =
        prevKind === 'closeParen' ||
        prevKind === 'closeBrace' ||
        prevKind === 'openBrace' ||
        prevKind === 'semi' ||
        prevKind === 'colon' ||
        (prevKind === 'word' && (prevWord === 'else' || prevWord === 'do'));
      braceStack.push({ ch, line, col, block });
      prevKind = 'openBrace';
      if (block) {
        startStatement();
        boundaryOk = true;
      } else {
        boundaryOk = false;
      }
      step();
      continue;
    }

    if (ch === ')' || ch === ']' || ch === '}') {
      if (ch === ')') {
        const top = parenStack.pop();
        if (!top) diagnostics.push({ line, col, message: `unexpected '${ch}'` });
        else if (top.control && parenStack.length === 0) boundaryOk = true;
        prevKind = 'closeParen';
      } else if (ch === ']') {
        bracketDepth = Math.max(0, bracketDepth - 1);
        prevKind = 'closeBracket';
      } else {
        const top = braceStack[braceStack.length - 1];
        if (top?.block && parenStack.length === 0 && bracketDepth === 0 && !boundaryOk && VALUE_END.has(prevKind)) {
          diagnostics.push({ line, col, message: "expected ';' before '}' token" });
        }
        if (!top) {
          diagnostics.push({ line, col, message: `unexpected '${ch}'` });
          prevKind = 'closeBrace';
        } else {
          braceStack.pop();
          if (top.block) {
            startStatement();
            boundaryOk = true;
            prevKind = 'closeBrace';
          } else {
            prevKind = 'value'; // an initializer `}` is a value
          }
        }
      }
      step();
      continue;
    }

    if (ch === ':' && code[i + 1] === ':') {
      step();
      step();
      stmtTokens += 1;
      prevKind = 'word';
      continue;
    }

    if (ch === '?') {
      beginStatementIfNeeded();
      if (parenStack.length === 0 && bracketDepth === 0) pendingTernary += 1;
      stmtTokens += 1;
      prevKind = 'op';
      step();
      continue;
    }

    if (ch === ':') {
      const labelLike = stmtTokens <= 1 || (stmtStartWord !== null && COLON_KEYWORDS.has(stmtStartWord));
      if (parenStack.length > 0 || bracketDepth > 0) {
        // range-based for, bitfields — not a terminator
      } else if (pendingTernary > 0) {
        pendingTernary -= 1;
      } else if (labelLike) {
        startStatement();
        boundaryOk = true;
      } else {
        diagnostics.push({ line, col, message: "expected ';' before ':' token" });
      }
      prevKind = 'colon';
      step();
      continue;
    }

    if (ch === ';') {
      startStatement();
      boundaryOk = true;
      prevKind = 'semi';
      step();
      continue;
    }

    // Identifier / keyword.
    if (/[A-Za-z_]/.test(ch)) {
      const wl = line;
      const wc = col;
      let word = '';
      while (i < n && /[A-Za-z0-9_]/.test(code[i]!)) {
        word += code[i];
        step();
      }
      const missingBeforeStarter =
        STATEMENT_STARTERS.has(word) && !boundaryOk && VALUE_END.has(prevKind);
      // A declaration after a value (e.g. `int x = 5 int y;`) is a missing `;`,
      // but only when the previous token is a value — never another type word.
      const missingBeforeDecl = TYPE_KEYWORDS.has(word) && !boundaryOk && VALUE_ONLY_END.has(prevKind);
      if ((missingBeforeStarter || missingBeforeDecl) && inStatementContext()) {
        diagnostics.push({ line: wl, col: wc, message: `expected ';' before '${word}' token` });
      }
      beginStatementIfNeeded();
      if (stmtTokens === 0) stmtStartWord = word;
      stmtTokens += 1;
      if (word === 'else' || word === 'do') boundaryOk = true;
      prevKind = 'word';
      prevWord = word;
      continue;
    }

    // Numbers.
    if (/[0-9]/.test(ch)) {
      beginStatementIfNeeded();
      while (i < n && /[0-9.xXa-fA-F]/.test(code[i]!)) step();
      stmtTokens += 1;
      prevKind = 'value';
      continue;
    }

    // Comma.
    if (ch === ',') {
      stmtTokens += 1;
      prevKind = 'comma';
      step();
      continue;
    }

    // Any other operator / punctuation.
    beginStatementIfNeeded();
    stmtTokens += 1;
    prevKind = 'op';
    step();
  }

  for (const unclosed of [...parenStack, ...braceStack]) {
    const close = unclosed.ch === '(' ? ')' : '}';
    diagnostics.push({ line: unclosed.line, col: unclosed.col, message: `expected '${close}'` });
  }

  return diagnostics;
}
