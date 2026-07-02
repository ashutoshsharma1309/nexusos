export type Cell = 'X' | 'O' | null;
export type Board = Cell[];

export const LINES: readonly [number, number, number][] = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // cols
  [0, 4, 8], [2, 4, 6], // diagonals
];

export interface Outcome {
  winner: 'X' | 'O' | null;
  line: [number, number, number] | null;
  draw: boolean;
}

/** Determine the current game outcome and the winning line, if any. */
export function evaluate(board: Board): Outcome {
  for (const line of LINES) {
    const [a, b, c] = line;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a]!, line, draw: false };
    }
  }
  return { winner: null, line: null, draw: board.every(Boolean) };
}

/** Minimax with depth-preferring scores, so the AI wins fastest and stalls losses. */
function minimax(board: Board, ai: 'X' | 'O', current: 'X' | 'O', depth: number): number {
  const { winner, draw } = evaluate(board);
  if (winner) return winner === ai ? 10 - depth : depth - 10;
  if (draw) return 0;

  const scores: number[] = [];
  for (let i = 0; i < 9; i++) {
    if (board[i]) continue;
    board[i] = current;
    scores.push(minimax(board, ai, current === 'X' ? 'O' : 'X', depth + 1));
    board[i] = null;
  }
  return current === ai ? Math.max(...scores) : Math.min(...scores);
}

/** The optimal move for `ai`. Returns -1 when the board is full. */
export function bestMove(board: Board, ai: 'X' | 'O'): number {
  let best = -Infinity;
  let move = -1;
  for (let i = 0; i < 9; i++) {
    if (board[i]) continue;
    board[i] = ai;
    const score = minimax(board, ai, ai === 'X' ? 'O' : 'X', 0);
    board[i] = null;
    if (score > best) {
      best = score;
      move = i;
    }
  }
  return move;
}

/** A random legal move, used for the "casual" difficulty. */
export function randomMove(board: Board): number {
  const open = board.map((c, i) => (c ? -1 : i)).filter((i) => i >= 0);
  return open.length ? open[Math.floor(Math.random() * open.length)]! : -1;
}
