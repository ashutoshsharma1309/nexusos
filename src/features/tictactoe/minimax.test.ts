import { describe, expect, it } from 'vitest';
import { bestMove, evaluate, type Board, type Cell } from './minimax';

const b = (s: string): Board => s.split('').map((c) => (c === '.' ? null : (c as Cell)));

describe('evaluate', () => {
  it('detects a row win and reports the line', () => {
    const result = evaluate(b('XXX' + 'OO.' + '...'));
    expect(result.winner).toBe('X');
    expect(result.line).toEqual([0, 1, 2]);
  });

  it('detects a diagonal win', () => {
    expect(evaluate(b('X.O' + '.X.' + 'O.X')).winner).toBe('X');
  });

  it('detects a draw on a full board', () => {
    const result = evaluate(b('XXO' + 'OOX' + 'XXO'));
    expect(result.winner).toBeNull();
    expect(result.draw).toBe(true);
  });

  it('reports no result on an open board', () => {
    expect(evaluate(b('X.......O'))).toEqual({ winner: null, line: null, draw: false });
  });
});

describe('bestMove', () => {
  it('takes an immediate winning move', () => {
    expect(bestMove(b('OO.' + 'XX.' + '...'), 'O')).toBe(2);
  });

  it('blocks the opponent from winning', () => {
    expect(bestMove(b('XX.' + 'O..' + '...'), 'O')).toBe(2);
  });

  it('is unbeatable: optimal play always draws', () => {
    // Play a full game with both sides using minimax; it must end in a draw.
    const board: Board = Array<Cell>(9).fill(null);
    let turn: 'X' | 'O' = 'X';
    for (let move = 0; move < 9; move++) {
      const outcome = evaluate(board);
      if (outcome.winner || outcome.draw) break;
      board[bestMove(board, turn)] = turn;
      turn = turn === 'X' ? 'O' : 'X';
    }
    expect(evaluate(board).winner).toBeNull();
  });
});
