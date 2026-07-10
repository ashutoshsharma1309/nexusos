'use client';

import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { RotateCcw, X, Circle } from 'lucide-react';
import { cn } from '@/lib/cn';
import { spring } from '@/lib/motion';
import { bestMove, evaluate, randomMove, type Board, type Cell } from './minimax';

const EMPTY: Board = Array<Cell>(9).fill(null);
type Difficulty = 'casual' | 'unbeatable';

/** Two-player-vs-AI tic-tac-toe. The player is X; the AI (O) uses minimax on
 *  "unbeatable" and random moves on "casual". Tracks a running scoreline. */
export default function TicTacToe() {
  const [board, setBoard] = useState<Board>(EMPTY);
  const [turn, setTurn] = useState<'X' | 'O'>('X');
  const [difficulty, setDifficulty] = useState<Difficulty>('unbeatable');
  const [score, setScore] = useState({ X: 0, O: 0, draw: 0 });
  const [locked, setLocked] = useState(false);

  const outcome = evaluate(board);
  const over = Boolean(outcome.winner) || outcome.draw;

  const reset = useCallback(() => {
    setBoard(EMPTY);
    setTurn('X');
    setLocked(false);
  }, []);

  // Record the result once when a game ends.
  useEffect(() => {
    if (outcome.winner) setScore((s) => ({ ...s, [outcome.winner!]: s[outcome.winner!] + 1 }));
    else if (outcome.draw) setScore((s) => ({ ...s, draw: s.draw + 1 }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [outcome.winner, outcome.draw]);

  // AI responds after the player.
  useEffect(() => {
    if (turn !== 'O' || over) return;
    setLocked(true);
    const id = window.setTimeout(() => {
      const move = difficulty === 'unbeatable' ? bestMove(board, 'O') : randomMove(board);
      if (move >= 0) {
        setBoard((b) => b.map((c, i) => (i === move ? 'O' : c)));
        setTurn('X');
      }
      setLocked(false);
    }, 380);
    return () => window.clearTimeout(id);
  }, [turn, over, board, difficulty]);

  const play = (i: number) => {
    if (board[i] || over || turn !== 'X' || locked) return;
    setBoard((b) => b.map((c, idx) => (idx === i ? 'X' : c)));
    setTurn('O');
  };

  const status = outcome.winner
    ? outcome.winner === 'X' ? 'You win! 🎉' : 'Nexus wins'
    : outcome.draw ? "It's a draw" : turn === 'X' ? 'Your move' : 'Nexus is thinking…';

  return (
    <div className="flex h-full flex-col items-center gap-4 p-5">
      <div className="flex w-full items-center justify-between">
        <div className="inline-flex rounded-lg bg-fg/5 p-0.5 text-2xs">
          {(['casual', 'unbeatable'] as const).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => { setDifficulty(d); reset(); setScore({ X: 0, O: 0, draw: 0 }); }}
              className={cn('rounded-md px-2.5 py-1 capitalize transition-colors', difficulty === d ? 'bg-accent text-accent-fg' : 'text-fg-muted hover:text-fg')}
            >
              {d}
            </button>
          ))}
        </div>
        <button type="button" onClick={reset} aria-label="New game" className="flex items-center gap-1.5 rounded-lg bg-fg/5 px-2.5 py-1 text-2xs text-fg-muted transition-colors hover:text-fg">
          <RotateCcw className="h-3 w-3" /> New game
        </button>
      </div>

      <p className="text-sm font-medium text-fg" aria-live="polite">{status}</p>

      <div className="grid grid-cols-3 gap-2">
        {board.map((cell, i) => {
          const winning = outcome.line?.includes(i);
          return (
            <button
              key={i}
              type="button"
              onClick={() => play(i)}
              disabled={Boolean(cell) || over || turn !== 'X'}
              aria-label={`Cell ${i + 1}${cell ? `, ${cell}` : ', empty'}`}
              className={cn(
                'grid h-20 w-20 place-items-center rounded-2xl border transition-colors',
                winning ? 'border-success bg-success/15' : 'border-border/10 bg-fg/[0.03] hover:bg-fg/[0.07]',
                !cell && !over && turn === 'X' && 'cursor-pointer',
              )}
            >
              {cell === 'X' && (
                <motion.span initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} transition={spring.bouncy}>
                  <X className="h-9 w-9 text-accent" strokeWidth={2.5} />
                </motion.span>
              )}
              {cell === 'O' && (
                <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={spring.bouncy}>
                  <Circle className="h-8 w-8 text-danger" strokeWidth={2.5} />
                </motion.span>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-auto grid w-full grid-cols-3 gap-2 text-center">
        {[
          { label: 'You (X)', value: score.X, tone: 'text-accent' },
          { label: 'Draws', value: score.draw, tone: 'text-fg-muted' },
          { label: 'Nexus (O)', value: score.O, tone: 'text-danger' },
        ].map((s) => (
          <div key={s.label} className="rounded-xl bg-fg/5 p-2.5">
            <p className={cn('text-xl font-bold tabular-nums', s.tone)}>{s.value}</p>
            <p className="text-2xs text-fg-muted">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
