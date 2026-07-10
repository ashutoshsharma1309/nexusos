'use client';

import { useCallback, useRef, useState } from 'react';
import { NotebookPen, Palette, SquareTerminal, RefreshCw, LayoutGrid } from 'lucide-react';
import type { Rect } from '@/lib/geometry';
import { ContextMenu, type ContextMenuState } from '@/components/ui/ContextMenu';
import { useWindowStore } from '@/features/window-manager/store';
import { useLauncherStore } from '@/features/launcher/store';
import { useSettingsStore, THEMES } from '@/features/settings/store';
import { WindowManager } from '@/features/window-manager/WindowManager';
import { Wallpaper } from './Wallpaper';
import { DesktopIcons } from './DesktopIcons';

/** Normalize a drag between two points into a positive-size rectangle. */
function boxFrom(ax: number, ay: number, bx: number, by: number): Rect {
  return {
    x: Math.min(ax, bx),
    y: Math.min(ay, by),
    width: Math.abs(ax - bx),
    height: Math.abs(ay - by),
  };
}

/** The desktop root: wallpaper, icons, marquee selection, context menu and windows. */
export function Desktop() {
  const open = useWindowStore((s) => s.open);
  const openLauncher = useLauncherStore((s) => s.open);
  const setTheme = useSettingsStore((s) => s.setTheme);
  const theme = useSettingsStore((s) => s.theme);

  const [menu, setMenu] = useState<ContextMenuState | null>(null);
  const [selection, setSelection] = useState<Rect | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const dragStart = useRef<{ x: number; y: number } | null>(null);

  const cycleTheme = useCallback(() => {
    const next = THEMES[(THEMES.indexOf(theme) + 1) % THEMES.length];
    if (next) setTheme(next);
  }, [theme, setTheme]);

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0 || e.target !== e.currentTarget) return;
    setSelectedIds(new Set());
    dragStart.current = { x: e.clientX, y: e.clientY };

    const onMove = (ev: PointerEvent) => {
      if (!dragStart.current) return;
      const box = boxFrom(dragStart.current.x, dragStart.current.y, ev.clientX, ev.clientY);
      setSelection(box);
      const hits = new Set<string>();
      document.querySelectorAll<HTMLElement>('[data-desktop-icon]').forEach((el) => {
        const r = el.getBoundingClientRect();
        const intersects =
          r.left < box.x + box.width && r.right > box.x && r.top < box.y + box.height && r.bottom > box.y;
        if (intersects) hits.add(el.dataset.desktopIcon ?? '');
      });
      setSelectedIds(hits);
    };
    const onUp = () => {
      dragStart.current = null;
      setSelection(null);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  const onContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setMenu({
      x: e.clientX,
      y: e.clientY,
      actions: [
        { id: 'launchpad', label: 'Open Launchpad', icon: LayoutGrid, shortcut: '⌘K', onSelect: openLauncher },
        { id: 'terminal', label: 'New Terminal', icon: SquareTerminal, onSelect: () => open({ appId: 'terminal' }) },
        { id: 'note', label: 'New Note', icon: NotebookPen, onSelect: () => open({ appId: 'notes', singleton: true }) },
        { id: 'theme', label: 'Cycle Theme', icon: Palette, onSelect: cycleTheme },
        { id: 'refresh', label: 'Reset Selection', icon: RefreshCw, onSelect: () => setSelectedIds(new Set()) },
      ],
    });
  };

  return (
    <main
      id="main-content"
      aria-label="Desktop"
      className="relative h-full w-full overflow-hidden"
      onPointerDown={onPointerDown}
      onContextMenu={onContextMenu}
    >
      <Wallpaper />
      <DesktopIcons selectedIds={selectedIds} />

      {selection && (
        <div
          className="pointer-events-none absolute z-[1] rounded-sm border border-accent/70 bg-accent/15"
          style={{ left: selection.x, top: selection.y, width: selection.width, height: selection.height }}
        />
      )}

      <WindowManager />
      <ContextMenu state={menu} onClose={() => setMenu(null)} />
    </main>
  );
}
