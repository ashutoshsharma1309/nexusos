import { describe, expect, it } from 'vitest';
import { extensionOf, languageFor } from './languages';

describe('extensionOf', () => {
  it('extracts the lowercased extension', () => {
    expect(extensionOf('main.PY')).toBe('py');
    expect(extensionOf('Component.tsx')).toBe('tsx');
  });

  it('returns empty for extensionless names', () => {
    expect(extensionOf('Makefile')).toBe('');
  });
});

describe('languageFor', () => {
  it('maps known extensions to language metadata', () => {
    expect(languageFor('main.c').label).toBe('C');
    expect(languageFor('main.cpp').label).toBe('C++');
    expect(languageFor('script.py').runnable).toBe(true);
  });

  it('falls back to plain text for unknown extensions', () => {
    expect(languageFor('notes.xyz').label).toBe('Plain Text');
    expect(languageFor('notes.xyz').runnable).toBe(false);
  });
});
