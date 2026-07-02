'use client';

import { Bell, Command, Search, Sparkles } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useWindowStore } from '@/features/window-manager/store';
import { useLauncherStore } from '@/features/launcher/store';
import { useNotificationStore } from '@/features/notifications/store';
import { Clock } from './Clock';

/** Top system menu bar: brand, focused-app title, search, notifications and clock. */
export function MenuBar() {
  const windows = useWindowStore((s) => s.windows);
  const openLauncher = useLauncherStore((s) => s.open);
  const toggleCenter = useNotificationStore((s) => s.togglePanel);
  const unread = useNotificationStore((s) => s.items.filter((i) => !i.read).length);

  const focused = windows.find((w) => w.focused && w.state !== 'minimized');

  return (
    <header className="absolute inset-x-0 top-0 z-[9998] flex h-8 items-center gap-3 px-3">
      <div className="glass-strong flex h-8 items-center gap-2 rounded-full px-3 shadow-popover">
        <Sparkles className="h-3.5 w-3.5 text-accent" />
        <span className="text-xs font-semibold text-fg">Nexus</span>
        {focused && (
          <>
            <span className="h-3 w-px bg-white/15" aria-hidden />
            <span className="text-xs text-fg-muted">{focused.title}</span>
          </>
        )}
      </div>

      <div className="flex-1" />

      <div className="glass-strong flex h-8 items-center gap-1 rounded-full px-1.5 shadow-popover">
        <button
          type="button"
          onClick={() => openLauncher()}
          aria-label="Open command palette"
          className="flex items-center gap-2 rounded-full px-2.5 py-1 text-fg-muted transition-colors hover:bg-white/5 hover:text-fg"
        >
          <Search className="h-3.5 w-3.5" />
          <span className="hidden text-xs sm:inline">Search</span>
          <kbd className="hidden items-center gap-0.5 rounded bg-white/5 px-1 text-[10px] sm:flex">
            <Command className="h-2.5 w-2.5" />K
          </kbd>
        </button>

        <button
          type="button"
          onClick={toggleCenter}
          aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`}
          className="relative rounded-full p-1.5 text-fg-muted transition-colors hover:bg-white/5 hover:text-fg"
        >
          <Bell className="h-3.5 w-3.5" />
          {unread > 0 && (
            <span
              className={cn(
                'absolute -right-0 -top-0 grid h-3.5 w-3.5 place-items-center',
                'rounded-full bg-danger text-[8px] font-bold text-white',
              )}
            >
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </button>

        <span className="mx-1 h-4 w-px bg-white/10" aria-hidden />
        <div className="px-2">
          <Clock />
        </div>
      </div>
    </header>
  );
}
