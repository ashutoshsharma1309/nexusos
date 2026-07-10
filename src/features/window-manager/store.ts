import { create } from 'zustand';
import { nanoid } from 'nanoid';
import type { Rect } from '@/lib/geometry';
import { clamp } from '@/lib/geometry';
import { isMobileViewport } from '@/lib/viewport';
import { getApp } from '@/features/apps/registry';
import type { OpenWindowOptions, WindowInstance, WindowState } from './types';

const BASE_Z = 10;
const CASCADE_STEP = 28;

interface WindowStore {
  windows: WindowInstance[];
  topZ: number;
  /** Monotonic focus counter used to cascade new windows. */
  spawnCount: number;

  open: (options: OpenWindowOptions) => string;
  close: (id: string) => void;
  focus: (id: string) => void;
  setRect: (id: string, rect: Rect) => void;
  setState: (id: string, state: WindowState) => void;
  minimize: (id: string) => void;
  toggleMaximize: (id: string) => void;
  restore: (id: string) => void;
  snap: (id: string, rect: Rect) => void;
  cycleFocus: (direction: 1 | -1) => void;
}

function viewport(): { vw: number; vh: number } {
  if (typeof window === 'undefined') return { vw: 1440, vh: 900 };
  return { vw: window.innerWidth, vh: window.innerHeight };
}

/** Reassign contiguous z-indices, raising `focusId` to the top and marking focus. */
function reorder(windows: WindowInstance[], focusId: string | null): WindowInstance[] {
  const ordered = [...windows].sort((a, b) => a.zIndex - b.zIndex);
  const withoutFocus = ordered.filter((w) => w.id !== focusId);
  const focused = ordered.find((w) => w.id === focusId);
  const finalOrder = focused ? [...withoutFocus, focused] : withoutFocus;
  return windows.map((w) => {
    const idx = finalOrder.findIndex((f) => f.id === w.id);
    return { ...w, zIndex: BASE_Z + idx, focused: w.id === focusId };
  });
}

export const useWindowStore = create<WindowStore>((set, get) => ({
  windows: [],
  topZ: BASE_Z,
  spawnCount: 0,

  open: (options) => {
    const { appId, singleton } = options;
    const app = getApp(appId);

    if (singleton) {
      const existing = get().windows.find((w) => w.appId === appId);
      if (existing) {
        if (existing.state === 'minimized') get().setState(existing.id, 'normal');
        get().focus(existing.id);
        return existing.id;
      }
    }

    const { vw, vh } = viewport();
    const defaults = app.defaultSize ?? { width: 880, height: 560 };
    const width = clamp(options.rect?.width ?? defaults.width, 360, vw);
    const height = clamp(options.rect?.height ?? defaults.height, 240, vh - 48);
    const cascade = (get().spawnCount % 6) * CASCADE_STEP;
    const rect: Rect = {
      x: options.rect?.x ?? clamp((vw - width) / 2 + cascade - 70, 8, Math.max(8, vw - width - 8)),
      y: options.rect?.y ?? clamp((vh - height) / 2 + cascade - 90, 40, Math.max(40, vh - height - 8)),
      width,
      height,
    };

    // On phones the floating-window model doesn't work: open apps full-bleed and
    // keep a sensible rect to restore to if the viewport later grows.
    const mobile = isMobileViewport();
    const id = nanoid();
    const instance: WindowInstance = {
      id,
      appId,
      title: options.title ?? app.title,
      rect: mobile ? { x: 0, y: 0, width: vw, height: vh } : rect,
      restoreRect: mobile ? rect : null,
      state: mobile ? 'maximized' : 'normal',
      zIndex: get().topZ + 1,
      focused: true,
      meta: options.meta,
    };

    set((s) => ({
      windows: reorder([...s.windows, instance], id),
      spawnCount: s.spawnCount + 1,
      topZ: s.topZ + 1,
    }));
    return id;
  },

  close: (id) =>
    set((s) => {
      const remaining = s.windows.filter((w) => w.id !== id);
      const nextFocus = remaining
        .filter((w) => w.state !== 'minimized')
        .sort((a, b) => b.zIndex - a.zIndex)[0];
      return { windows: reorder(remaining, nextFocus?.id ?? null) };
    }),

  focus: (id) =>
    set((s) => ({ windows: reorder(s.windows, id), topZ: s.topZ + 1 })),

  setRect: (id, rect) =>
    set((s) => ({
      windows: s.windows.map((w) => (w.id === id ? { ...w, rect } : w)),
    })),

  setState: (id, state) =>
    set((s) => ({
      windows: s.windows.map((w) => (w.id === id ? { ...w, state } : w)),
    })),

  minimize: (id) =>
    set((s) => {
      const windows = s.windows.map((w) =>
        w.id === id ? { ...w, state: 'minimized' as const } : w,
      );
      const nextFocus = windows
        .filter((w) => w.state !== 'minimized')
        .sort((a, b) => b.zIndex - a.zIndex)[0];
      return { windows: reorder(windows, nextFocus?.id ?? null) };
    }),

  toggleMaximize: (id) => {
    const win = get().windows.find((w) => w.id === id);
    if (!win) return;
    if (win.state === 'maximized') {
      get().restore(id);
      return;
    }
    const { vw, vh } = viewport();
    set((s) => ({
      windows: reorder(
        s.windows.map((w) =>
          w.id === id
            ? {
                ...w,
                state: 'maximized',
                restoreRect: w.rect,
                rect: { x: 0, y: 0, width: vw, height: vh },
              }
            : w,
        ),
        id,
      ),
    }));
  },

  restore: (id) =>
    set((s) => ({
      windows: reorder(
        s.windows.map((w) =>
          w.id === id
            ? { ...w, state: 'normal', rect: w.restoreRect ?? w.rect, restoreRect: null }
            : w,
        ),
        id,
      ),
    })),

  snap: (id, rect) =>
    set((s) => ({
      windows: reorder(
        s.windows.map((w) =>
          w.id === id
            ? { ...w, state: 'normal', restoreRect: w.restoreRect ?? w.rect, rect }
            : w,
        ),
        id,
      ),
    })),

  cycleFocus: (direction) => {
    const visible = get()
      .windows.filter((w) => w.state !== 'minimized')
      .sort((a, b) => a.zIndex - b.zIndex);
    if (visible.length < 2) return;
    const focusedIdx = visible.findIndex((w) => w.focused);
    const nextIdx = (focusedIdx + direction + visible.length) % visible.length;
    const next = visible[nextIdx];
    if (next) get().focus(next.id);
  },
}));
