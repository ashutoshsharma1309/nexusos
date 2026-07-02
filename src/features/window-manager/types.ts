import type { Rect } from '@/lib/geometry';

export type WindowState = 'normal' | 'minimized' | 'maximized';

export interface WindowInstance {
  /** Unique instance id (an app may have several open windows). */
  id: string;
  /** The app that owns this window; keyed into the app registry. */
  appId: string;
  title: string;
  /** Current on-screen rectangle when in the `normal` state. */
  rect: Rect;
  /** Rect to restore to when un-maximizing; captured on maximize/snap. */
  restoreRect: Rect | null;
  state: WindowState;
  zIndex: number;
  focused: boolean;
  /** Opaque per-instance payload (e.g. a file path the window opened with). */
  meta?: Record<string, unknown>;
}

export interface OpenWindowOptions {
  appId: string;
  title?: string;
  rect?: Partial<Rect>;
  meta?: Record<string, unknown>;
  /** When true, focus an existing window of the same app instead of opening a new one. */
  singleton?: boolean;
}
