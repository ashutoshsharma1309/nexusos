'use client';

import { useMemo } from 'react';
import { motion, useMotionValue } from 'framer-motion';
import { LayoutGrid } from 'lucide-react';
import { spring } from '@/lib/motion';
import { DOCK_APPS } from '@/features/apps/registry';
import { useWindowStore } from '@/features/window-manager/store';
import { useLauncherStore } from '@/features/launcher/store';
import { useNotificationStore } from '@/features/notifications/store';
import { DockIcon } from './DockIcon';

/** The bottom dock: magnified app launchers with running/focus state, notification
 *  badges and a Launchpad trigger. */
export function Dock() {
  const mouseX = useMotionValue(-1);
  const open = useWindowStore((s) => s.open);
  const windows = useWindowStore((s) => s.windows);
  const openLauncher = useLauncherStore((s) => s.open);
  const items = useNotificationStore((s) => s.items);

  const runningAppIds = useMemo(() => new Set(windows.map((w) => w.appId)), [windows]);
  const focusedAppId = windows.find((w) => w.focused && w.state !== 'minimized')?.appId ?? null;

  const badges = useMemo(() => {
    const map = new Map<string, number>();
    for (const n of items) {
      if (n.appId && !n.read) map.set(n.appId, (map.get(n.appId) ?? 0) + 1);
    }
    return map;
  }, [items]);

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-2.5 z-[9999] flex justify-center">
      <motion.nav
        aria-label="Dock"
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ ...spring.glide, delay: 0.15 }}
        onPointerMove={(e) => mouseX.set(e.clientX)}
        onPointerLeave={() => mouseX.set(-1)}
        className="glass-strong pointer-events-auto flex items-end gap-1.5 rounded-[26px] px-2.5 pb-2 pt-2 shadow-dock"
      >
        <DockIcon
          icon={LayoutGrid}
          label="Launchpad"
          tint="120 130 160"
          running={false}
          mouseX={mouseX}
          onClick={openLauncher}
        />
        <span className="mx-0.5 h-11 w-px self-center bg-white/10" aria-hidden />
        {DOCK_APPS.map((app) => (
          <DockIcon
            key={app.id}
            icon={app.icon}
            label={app.title}
            tint={app.tint}
            running={runningAppIds.has(app.id)}
            focused={focusedAppId === app.id}
            badge={badges.get(app.id)}
            mouseX={mouseX}
            onClick={() => open({ appId: app.id, singleton: true })}
          />
        ))}
      </motion.nav>
    </div>
  );
}
