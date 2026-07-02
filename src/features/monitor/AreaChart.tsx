import { useId } from 'react';

interface Props {
  values: number[];
  /** CSS color for the stroke/fill, e.g. "rgb(var(--color-accent))". */
  color: string;
  height?: number;
}

const W = 300;

/** A lightweight SVG area chart for 0..100 series with a soft gradient fill. */
export function AreaChart({ values, color, height = 72 }: Props) {
  const gid = useId();
  const step = W / Math.max(values.length - 1, 1);
  const line = values
    .map((v, i) => `${i === 0 ? 'M' : 'L'} ${(i * step).toFixed(1)} ${(height - (v / 100) * height).toFixed(1)}`)
    .join(' ');

  return (
    <svg viewBox={`0 0 ${W} ${height}`} preserveAspectRatio="none" className="h-full w-full">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${line} L ${W} ${height} L 0 ${height} Z`} fill={`url(#${gid})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}
