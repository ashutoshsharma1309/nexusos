export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Size {
  width: number;
  height: number;
}

export const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);

/** Snap-zone geometry for a viewport, mirroring Windows 11 / macOS tiling affordances. */
export type SnapZone = 'left' | 'right' | 'top' | 'maximize' | null;

export function rectForSnapZone(zone: Exclude<SnapZone, null>, vw: number, vh: number): Rect {
  const half = Math.floor(vw / 2);
  switch (zone) {
    case 'left':
      return { x: 0, y: 0, width: half, height: vh };
    case 'right':
      return { x: half, y: 0, width: vw - half, height: vh };
    case 'top':
    case 'maximize':
      return { x: 0, y: 0, width: vw, height: vh };
  }
}

/** Detect which snap zone a pointer position implies, using edge thresholds. */
export function detectSnapZone(px: number, py: number, vw: number, threshold = 12): SnapZone {
  if (py <= threshold) return 'maximize';
  if (px <= threshold) return 'left';
  if (px >= vw - threshold) return 'right';
  return null;
}
