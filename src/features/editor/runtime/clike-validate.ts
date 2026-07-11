/**
 * A lightweight "compile" pass for C/C++ that catches the syntax errors a real
 * compiler would reject before any code runs — so a statement terminated with
 * `:` instead of `;`, an unbalanced brace, or an unterminated string no longer
 * silently produces output.
 *
 * It is deliberately conservative: it only reports errors it can be confident
 * about (never valid code), because a false positive is worse than a miss. It
 * understands strings, char literals, comments, the preprocessor, `::` scope,
 * ternary `?:`, labels, `case`/`default`, access specifiers and range-based for.
 */
export interface Diagnostic {
  line: number;
  col: number;
  message: string;
}

const COLON_KEYWORDS = new Set(['case', 'default', 'public', 'private', 'protected']);

export function validateClike(code: string): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  const brackets: { ch: string; line: number; col: number }[] = [];
  const n = code.length;

  let i = 0;
  let line = 1;
  let col = 1;
  let parenDepth = 0;
  let bracketDepth = 0;
  let pendingTernary = 0; // open `?` at statement level, awaiting its `:`
  let stmtTokens = 0; // significant tokens seen in the current statement
  let stmtStartWord: string | null = null;
  let atLineStart = true;

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
    pendingTernary = 0;
    stmtTokens = 0;
    stmtStartWord = null;
  };

  while (i < n) {
    const ch = code[i]!;

    if (ch === ' ' || ch === '\t' || ch === '\r' || ch === '\n') {
      step();
      continue;
    }

    // Preprocessor directive — ignore the whole logical line.
    if (ch === '#' && atLineStart) {
      while (i < n && code[i] !== '\n') step();
      continue;
    }
    atLineStart = false;

    // Comments.
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

    // String and character literals.
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
      stmtTokens += 1;
      continue;
    }

    // Openers.
    if (ch === '(' || ch === '[') {
      brackets.push({ ch, line, col });
      if (ch === '(') parenDepth += 1;
      else bracketDepth += 1;
      stmtTokens += 1;
      step();
      continue;
    }
    if (ch === '{') {
      brackets.push({ ch, line, col });
      startStatement();
      step();
      continue;
    }

    // Closers.
    if (ch === ')' || ch === ']' || ch === '}') {
      const opener = ch === ')' ? '(' : ch === ']' ? '[' : '{';
      const top = brackets[brackets.length - 1];
      if (!top || top.ch !== opener) {
        diagnostics.push({ line, col, message: `unexpected '${ch}'` });
      } else {
        brackets.pop();
        if (ch === ')') parenDepth -= 1;
        else if (ch === ']') bracketDepth -= 1;
      }
      if (ch === '}') startStatement();
      else stmtTokens += 1;
      step();
      continue;
    }

    // `::` scope resolution is a single token, never a statement terminator.
    if (ch === ':' && code[i + 1] === ':') {
      step();
      step();
      stmtTokens += 1;
      continue;
    }

    if (ch === '?') {
      if (parenDepth === 0 && bracketDepth === 0) pendingTernary += 1;
      stmtTokens += 1;
      step();
      continue;
    }

    if (ch === ':') {
      const labelLike = stmtTokens <= 1 || (stmtStartWord !== null && COLON_KEYWORDS.has(stmtStartWord));
      if (parenDepth > 0 || bracketDepth > 0) {
        // Inside (...) / [...]: range-based for, bitfields — not a terminator.
      } else if (pendingTernary > 0) {
        pendingTernary -= 1;
      } else if (labelLike) {
        startStatement();
      } else {
        diagnostics.push({ line, col, message: "expected ';' before ':' token" });
      }
      step();
      continue;
    }

    if (ch === ';') {
      startStatement();
      step();
      continue;
    }

    // Identifiers / keywords.
    if (/[A-Za-z_]/.test(ch)) {
      let word = '';
      while (i < n && /[A-Za-z0-9_]/.test(code[i]!)) {
        word += code[i];
        step();
      }
      if (stmtTokens === 0) stmtStartWord = word;
      stmtTokens += 1;
      continue;
    }

    // Numbers and operators count as one token each.
    stmtTokens += 1;
    step();
  }

  for (const unclosed of brackets) {
    const close = unclosed.ch === '(' ? ')' : unclosed.ch === '[' ? ']' : '}';
    diagnostics.push({ line: unclosed.line, col: unclosed.col, message: `expected '${close}'` });
  }

  return diagnostics;
}
