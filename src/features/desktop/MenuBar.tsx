'use client';

import { Bell, Command, Moon, Search, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { useWindowStore } from '@/features/window-manager/store';
import { useLauncherStore } from '@/features/launcher/store';
import { useNotificationStore } from '@/features/notifications/store';
import { ControlCenter } from '@/features/control-center/ControlCenter';
import { Clock } from './Clock';
import { SystemStats } from './SystemStats';

/** Top system menu bar: brand, focused-app title, search, notifications and clock. */
export function MenuBar() {
  const windows = useWindowStore((s) => s.windows);
  const openLauncher = useLauncherStore((s) => s.open);
  const toggleCenter = useNotificationStore((s) => s.togglePanel);
  const unread = useNotificationStore((s) => s.items.filter((i) => !i.read).length);
  const dnd = useNotificationStore((s) => s.dnd);

  const focused = windows.find((w) => w.focused && w.state !== 'minimized');

  return (
    <header className="absolute inset-x-0 top-0 z-chrome flex h-8 items-center gap-3 px-3">
      <div className="glass-strong flex h-8 items-center gap-2 rounded-full px-3 shadow-popover">
        <Sparkles className="h-3.5 w-3.5 text-accent" />
        <span className="text-xs font-semibold text-fg">Nexus</span>
        {focused && (
          <>
            <span className="h-3 w-px bg-fg/15" aria-hidden />
            <span className="text-xs text-fg-muted">{focused.title}</span>
          </>
        )}
      </div>

      <div className="flex-1" />

      <SystemStats />
      <ControlCenter />

      <div className="glass-strong flex h-8 items-center gap-1 rounded-full px-1.5 shadow-popover">
        {dnd && (
          <span className="pl-1.5 text-fg-muted" title="Do Not Disturb is on" aria-label="Do Not Disturb is on">
            <Moon className="h-3.5 w-3.5" />
          </span>
        )}
        <button
          type="button"
          onClick={() => openLauncher()}
          aria-label="Open command palette"
          className="flex items-center gap-2 rounded-full px-2.5 py-1 text-fg-muted transition-colors hover:bg-fg/5 hover:text-fg"
        >
          <Search className="h-3.5 w-3.5" />
          <span className="hidden text-xs sm:inline">Search</span>
          <kbd className="hidden items-center gap-0.5 rounded bg-fg/5 px-1 text-[10px] sm:flex">
            <Command className="h-2.5 w-2.5" />K
          </kbd>
        </button>

        <button
          type="button"
          onClick={toggleCenter}
          aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`}
          className="relative rounded-full p-1.5 text-fg-muted transition-colors hover:bg-fg/5 hover:text-fg"
        >
          <Bell className="h-3.5 w-3.5" />
          {unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5">
              <Badge count={unread} />
            </span>
          )}
        </button>

        <span className="mx-1 h-4 w-px bg-fg/10" aria-hidden />
        <div className="px-2">
          <Clock />
        </div>
      </div>
    </header>
  );
}
