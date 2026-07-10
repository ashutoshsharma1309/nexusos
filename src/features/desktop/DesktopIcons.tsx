'use client';

import { useState } from 'react';
import { cn } from '@/lib/cn';
import { getApp } from '@/features/apps/registry';
import { useWindowStore } from '@/features/window-manager/store';

/** Apps pinned to the desktop, in display order. */
const DESKTOP_APP_IDS = ['files', 'terminal', 'editor', 'notes', 'tictactoe', 'calculator'] as const;

/** Desktop shortcut grid. Single click selects, double click launches. */
export function DesktopIcons({ selectedIds }: { selectedIds: Set<string> }) {
  const open = useWindowStore((s) => s.open);
  const [manualSelect, setManualSelect] = useState<string | null>(null);

  return (
    <div className="absolute left-4 top-12 grid w-24 auto-rows-min gap-2">
      {DESKTOP_APP_IDS.map((id) => getApp(id)).map((app) => {
        const Icon = app.icon;
        const selected = selectedIds.has(app.id) || manualSelect === app.id;
        return (
          <button
            key={app.id}
            type="button"
            data-desktop-icon={app.id}
            onClick={() => setManualSelect(app.id)}
            onDoubleClick={() => open({ appId: app.id, singleton: true })}
            className={cn(
              'flex flex-col items-center gap-1 rounded-xl p-2 text-center transition-colors',
              selected ? 'bg-accent/25' : 'hover:bg-fg/5',
            )}
          >
            <span
              className="grid h-11 w-11 place-items-center rounded-xl border border-border/10 shadow-lg"
              style={{ background: `linear-gradient(160deg, rgb(${app.tint} / 0.9), rgb(${app.tint} / 0.5))` }}
            >
              <Icon className="h-6 w-6 text-white" />
            </span>
            <span className="line-clamp-1 text-2xs font-medium text-fg drop-shadow">
              {app.title}
            </span>
          </button>
        );
      })}
    </div>
  );
}
