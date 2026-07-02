'use client';

import { useCallback, useReducer } from 'react';

type Op = '+' | '−' | '×' | '÷';

interface State {
  /** The string currently shown on the display. */
  display: string;
  /** The stored operand awaiting an operator's second argument. */
  accumulator: number | null;
  operator: Op | null;
  /** True right after an operator press, so the next digit starts fresh. */
  overwrite: boolean;
}

export type Action =
  | { type: 'digit'; value: string }
  | { type: 'dot' }
  | { type: 'op'; value: Op }
  | { type: 'equals' }
  | { type: 'clear' }
  | { type: 'negate' }
  | { type: 'percent' }
  | { type: 'backspace' };

const initial: State = { display: '0', accumulator: null, operator: null, overwrite: false };

const apply = (a: number, b: number, op: Op): number => {
  switch (op) {
    case '+': return a + b;
    case '−': return a - b;
    case '×': return a * b;
    case '÷': return b === 0 ? NaN : a / b;
  }
};

/** Format a number for the display, trimming float noise. */
const fmt = (n: number): string => {
  if (!Number.isFinite(n)) return 'Error';
  const rounded = Math.round(n * 1e10) / 1e10;
  return String(rounded);
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'digit': {
      if (state.display === 'Error') return { ...initial, display: action.value };
      if (state.overwrite) return { ...state, display: action.value, overwrite: false };
      if (state.display === '0') return { ...state, display: action.value };
      if (state.display.replace('-', '').length >= 12) return state;
      return { ...state, display: state.display + action.value };
    }
    case 'dot':
      if (state.overwrite) return { ...state, display: '0.', overwrite: false };
      return state.display.includes('.') ? state : { ...state, display: state.display + '.' };
    case 'negate':
      return { ...state, display: fmt(parseFloat(state.display) * -1) };
    case 'percent':
      return { ...state, display: fmt(parseFloat(state.display) / 100) };
    case 'backspace':
      if (state.overwrite || state.display === 'Error') return state;
      return { ...state, display: state.display.length > 1 ? state.display.slice(0, -1) : '0' };
    case 'clear':
      return initial;
    case 'op': {
      const current = parseFloat(state.display);
      if (state.accumulator !== null && state.operator && !state.overwrite) {
        const result = apply(state.accumulator, current, state.operator);
        return { display: fmt(result), accumulator: result, operator: action.value, overwrite: true };
      }
      return { ...state, accumulator: current, operator: action.value, overwrite: true };
    }
    case 'equals': {
      if (state.operator === null || state.accumulator === null) return state;
      const result = apply(state.accumulator, parseFloat(state.display), state.operator);
      return { display: fmt(result), accumulator: null, operator: null, overwrite: true };
    }
  }
}

export function useCalculator() {
  const [state, dispatch] = useReducer(reducer, initial);
  const expr =
    state.operator && state.accumulator !== null ? `${fmt(state.accumulator)} ${state.operator}` : '';
  const onKey = useCallback((key: string) => {
    if (/^[0-9]$/.test(key)) dispatch({ type: 'digit', value: key });
    else if (key === '.') dispatch({ type: 'dot' });
    else if (key === '+') dispatch({ type: 'op', value: '+' });
    else if (key === '-') dispatch({ type: 'op', value: '−' });
    else if (key === '*') dispatch({ type: 'op', value: '×' });
    else if (key === '/') dispatch({ type: 'op', value: '÷' });
    else if (key === 'Enter' || key === '=') dispatch({ type: 'equals' });
    else if (key === 'Backspace') dispatch({ type: 'backspace' });
    else if (key === 'Escape') dispatch({ type: 'clear' });
    else if (key === '%') dispatch({ type: 'percent' });
  }, []);
  return { state, expr, dispatch, onKey };
}
