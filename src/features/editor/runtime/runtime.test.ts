import { describe, expect, it } from 'vitest';
import { runFile } from './index';

/** Collect stdout lines for concise assertions. */
const out = (name: string, code: string) => {
  const r = runFile(name, code);
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

describe('runFile metadata', () => {
  it('rejects unrunnable extensions', () => {
    expect(runFile('a.md', '# hi').exitCode).toBe(1);
  });

  it('measures a numeric duration', () => {
    expect(typeof runFile('a.py', 'print(1)').durationMs).toBe('number');
  });
});
