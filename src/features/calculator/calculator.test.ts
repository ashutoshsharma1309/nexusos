import { describe, expect, it } from 'vitest';
import { reducer, initialState, type Action } from './useCalculator';

/** Fold a sequence of actions and return the resulting display. */
const run = (...actions: Action[]) =>
  actions.reduce(reducer, initialState).display;

const digit = (value: string): Action => ({ type: 'digit', value });
const op = (value: '+' | '−' | '×' | '÷'): Action => ({ type: 'op', value });

describe('calculator reducer', () => {
  it('adds two numbers', () => {
    expect(run(digit('2'), op('+'), digit('3'), { type: 'equals' })).toBe('5');
  });

  it('multiplies', () => {
    expect(run(digit('7'), op('×'), digit('8'), { type: 'equals' })).toBe('56');
  });

  it('chains operators, evaluating the pending one', () => {
    // 2 + 3 + → shows the running total 5
    expect(run(digit('2'), op('+'), digit('3'), op('+'))).toBe('5');
  });

  it('guards against divide-by-zero', () => {
    expect(run(digit('5'), op('÷'), digit('0'), { type: 'equals' })).toBe('Error');
  });

  it('negates and takes percentages', () => {
    expect(run(digit('5'), { type: 'negate' })).toBe('-5');
    expect(run(digit('5'), digit('0'), { type: 'percent' })).toBe('0.5');
  });

  it('backspaces and clears', () => {
    expect(run(digit('1'), digit('2'), digit('3'), { type: 'backspace' })).toBe('12');
    expect(run(digit('9'), { type: 'clear' })).toBe('0');
  });

  it('does not accumulate leading zeros', () => {
    expect(run(digit('0'), digit('5'))).toBe('5');
  });

  it('trims floating-point noise', () => {
    // 0.1 + 0.2 should read 0.3, not 0.30000000000000004
    expect(run(digit('0'), { type: 'dot' }, digit('1'), op('+'), digit('0'), { type: 'dot' }, digit('2'), { type: 'equals' })).toBe('0.3');
  });
});
