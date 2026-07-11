import { describe, expect, it } from 'vitest';
import { clamp, detectSnapZone, rectForSnapZone } from './geometry';

describe('clamp', () => {
  it('keeps values inside the range', () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-3, 0, 10)).toBe(0);
    expect(clamp(42, 0, 10)).toBe(10);
  });
});

describe('rectForSnapZone', () => {
  it('splits the viewport in half for left/right', () => {
    expect(rectForSnapZone('left', 1000, 800)).toEqual({ x: 0, y: 0, width: 500, height: 800 });
    expect(rectForSnapZone('right', 1000, 800)).toEqual({ x: 500, y: 0, width: 500, height: 800 });
  });

  it('fills the viewport for maximize', () => {
    expect(rectForSnapZone('maximize', 1000, 800)).toEqual({ x: 0, y: 0, width: 1000, height: 800 });
  });

  it('handles odd widths without losing a pixel', () => {
    const left = rectForSnapZone('left', 1001, 800);
    const right = rectForSnapZone('right', 1001, 800);
    expect(left.width + right.width).toBe(1001);
  });
});

describe('detectSnapZone', () => {
  const vw = 1200;
  it('detects each edge within the threshold', () => {
    expect(detectSnapZone(5, 400, vw)).toBe('left');
    expect(detectSnapZone(vw - 5, 400, vw)).toBe('right');
    expect(detectSnapZone(600, 4, vw)).toBe('maximize');
  });

  it('returns null away from the edges', () => {
    expect(detectSnapZone(600, 400, vw)).toBeNull();
  });
});
