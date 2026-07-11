import { describe, expect, it } from 'vitest';
import { runFile } from './index';
import { validateClike } from './clike-validate';

/** Collect stdout lines for concise assertions. */
const out = (name: string, code: string) => {
  const r = runFile(name, code);
  return { r, stdout: r.lines.filter((l) => l.stream === 'stdout').map((l) => l.text) };
};

/** As `out`, but feeding stdin. */
const out2 = (name: string, code: string, stdin: string) => {
  const r = runFile(name, code, stdin);
  return { r, stdout: r.lines.filter((l) => l.stream === 'stdout').map((l) => l.text) };
};

describe('python runtime', () => {
  it('prints, assigns and does arithmetic', () => {
    const { r, stdout } = out('a.py', 'x = 5\ny = 3\nprint("sum:", x + y)');
    expect(stdout).toEqual(['sum: 8']);
    expect(r.exitCode).toBe(0);
  });

  it('runs range loops and functions', () => {
    const code = 'def sq(n):\n    return n * n\nfor i in range(3):\n    print(sq(i))';
    expect(out('a.py', code).stdout).toEqual(['0', '1', '4']);
  });

  it('handles conditionals', () => {
    expect(out('a.py', 'x = 7\nif x > 5:\n    print("big")\nelse:\n    print("small")').stdout).toEqual(['big']);
  });

  it('reports NameError with a non-zero exit', () => {
    const r = runFile('a.py', 'print(missing)');
    expect(r.exitCode).toBe(1);
    expect(r.lines[0]?.stream).toBe('stderr');
  });
});

describe('c runtime', () => {
  it('formats printf specifiers', () => {
    const code = '#include <stdio.h>\nint main(){ int n=5; printf("n=%d half=%.2f\\n", n, n/2.0); return 0; }';
    expect(out('a.c', code).stdout).toEqual(['n=5 half=2.50']);
  });

  it('runs classic for loops', () => {
    const code = 'int main(){ for(int i=0;i<3;i++){ printf("row %d\\n", i); } }';
    expect(out('a.c', code).stdout).toEqual(['row 0', 'row 1', 'row 2']);
  });
});

describe('c runtime — functions, stdin, formatting', () => {
  it('calls user-defined functions and recurses', () => {
    const code = 'int fact(int n){ if(n<=1) return 1; return n*fact(n-1); } int main(){ printf("%d\\n", fact(5)); }';
    expect(out('a.c', code).stdout).toEqual(['120']);
  });

  it('reads stdin with scanf', () => {
    const code = 'int main(){ int n; scanf("%d", &n); printf("got %d\\n", n*2); }';
    expect(out2('a.c', code, '21').stdout).toEqual(['got 42']);
  });

  it('uses C integer division and float division correctly', () => {
    expect(out('a.c', 'int main(){ int a=5; printf("%d %.2f\\n", a/2, a/2.0); }').stdout).toEqual(['2 2.50']);
  });

  it('honors printf width and zero-padding', () => {
    expect(out('a.c', 'int main(){ printf("%02d:%3d\\n", 5, 7); }').stdout).toEqual(['05:  7']);
  });

  it('runs the binary-watch program end to end', () => {
    const code = `int bits(int n){ int c=0; while(n){ c+=n%2; n/=2; } return c; }
      int main(){ int n; scanf("%d",&n);
        for(int h=0;h<12;h++) for(int m=0;m<60;m++) if(bits(h)+bits(m)==n) printf("%d:%02d\\n",h,m);
      }`;
    expect(out2('a.c', code, '1').stdout).toEqual(['0:01', '0:02', '0:04', '0:08', '0:16', '0:32', '1:00', '2:00', '4:00', '8:00']);
  });
});

describe('python stdin', () => {
  it('reads input()', () => {
    expect(out2('a.py', 'n = int(input())\nprint(n * n)', '6').stdout).toEqual(['36']);
  });
});

describe('c++ runtime', () => {
  it('streams cout with endl and expressions', () => {
    const code = 'using namespace std;\nint main(){ int a=7,b=2; cout << "a+b=" << a+b << endl; }';
    expect(out('a.cpp', code).stdout).toEqual(['a+b=9']);
  });
});

describe('javascript runtime', () => {
  it('executes real JS and captures console', () => {
    expect(out('a.js', 'console.log([1,2,3].reduce((a,b)=>a+b,0))').stdout).toEqual(['6']);
  });

  it('routes console.error to stderr and reports thrown errors', () => {
    const r = runFile('a.js', 'throw new Error("boom")');
    expect(r.exitCode).toBe(1);
    expect(r.lines.some((l) => l.stream === 'stderr' && l.text.includes('boom'))).toBe(true);
  });
});

describe('c/c++ compile diagnostics', () => {
  it('rejects a statement terminated with a colon instead of a semicolon', () => {
    const r = runFile('main.c', 'int main(void){\n  printf("hi\\n"):\n  return 0;\n}');
    expect(r.exitCode).toBe(1);
    expect(r.lines[0]?.text).toContain("expected ';' before ':'");
    // Nothing should have been printed — a compile error means no run.
    expect(r.lines.some((l) => l.stream === 'stdout')).toBe(false);
  });

  it('rejects a missing semicolon before the next statement', () => {
    const r = runFile('main.c', 'int main(void){\n  printf("hi\\n")\n  return 0;\n}');
    expect(r.exitCode).toBe(1);
    expect(r.lines[0]?.text).toContain("expected ';' before 'return'");
    expect(r.lines.some((l) => l.stream === 'stdout')).toBe(false);
  });

  it('rejects a missing semicolon before a closing brace', () => {
    const r = runFile('main.c', 'int main(){ printf("x") }');
    expect(r.exitCode).toBe(1);
    expect(r.lines[0]?.text).toContain("expected ';' before '}'");
  });

  it('does not flag valid control flow, declarations or initializers', () => {
    const ok = [
      'int main(){ if (x) a(); else b(); }',
      'int main(){ for (int i=0;i<3;i++) printf("%d", i); }',
      'int main(){ unsigned int x = 5; long long y = 10; return 0; }',
      'int main(){ int a[] = {1, 2, 3}; return a[0]; }',
      'struct P { int x; int y; };\nint main(){ return 0; }',
    ];
    for (const src of ok) expect(validateClike(src)).toHaveLength(0);
  });

  it('reports an unbalanced brace', () => {
    const r = runFile('main.c', 'int main(){ printf("x");');
    expect(r.exitCode).toBe(1);
    expect(r.lines.some((l) => l.text.includes("expected '}'"))).toBe(true);
  });

  it('does not flag valid ternaries, and evaluates them', () => {
    const r = runFile('main.c', 'int main(){ int a=3,b=5; printf("%d\\n", a>b?a:b); }');
    expect(r.exitCode).toBe(0);
    expect(r.lines.find((l) => l.stream === 'stdout')?.text).toBe('5');
  });

  it('the validator accepts valid syntax it cannot yet interpret (no false positives)', () => {
    // switch/case, scope resolution, range-for, ternary — all legal C/C++.
    expect(validateClike('int main(){ switch(x){ case 1: default: break; } }')).toHaveLength(0);
    expect(validateClike('int main(){ std::cout << x; foo::bar(); }')).toHaveLength(0);
    expect(validateClike('int main(){ for (int x : items) {} }')).toHaveLength(0);
    expect(validateClike('int main(){ int m = a ? b : c; }')).toHaveLength(0);
    expect(validateClike('loop: goto loop;')).toHaveLength(0);
  });

  it('the validator flags a stray colon and unterminated string', () => {
    expect(validateClike('int main(){ printf("x"): }').length).toBeGreaterThan(0);
    expect(validateClike('int main(){ char* s = "oops; }').length).toBeGreaterThan(0);
  });
});

describe('runFile metadata', () => {
  it('rejects unrunnable extensions', () => {
    expect(runFile('a.md', '# hi').exitCode).toBe(1);
  });

  it('measures a numeric duration', () => {
    expect(typeof runFile('a.py', 'print(1)').durationMs).toBe('number');
  });
});
