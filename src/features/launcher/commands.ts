import type { LucideIcon } from 'lucide-react';
import { LayoutGrid, Moon, Palette, Power, Keyboard, Sparkles } from 'lucide-react';
import { APP_LIST } from '@/features/apps/registry';
import { useWindowStore } from '@/features/window-manager/store';
import { useSettingsStore, THEMES, THEME_LABELS } from '@/features/settings/store';
import { useNotificationStore } from '@/features/notifications/store';
import { useLaunchpadStore } from '@/features/launchpad/store';
import { useShortcutsStore } from '@/components/ShortcutsOverlay';

export interface Command {
  id: string;
  title: string;
  subtitle: string;
  group: 'Applications' | 'Appearance' | 'System';
  icon: LucideIcon;
  keywords: string;
  run: () => void;
}

/** Build the full command list. Recomputed lazily so it always reflects current apps/themes. */
export function buildCommands(): Command[] {
  const openWindow = useWindowStore.getState().open;
  const setTheme = useSettingsStore.getState().setTheme;

  const appCommands: Command[] = APP_LIST.map((app) => ({
    id: `app:${app.id}`,
    title: `Open ${app.title}`,
    subtitle: 'Application',
    group: 'Applications',
    icon: app.icon,
    keywords: app.title,
    run: () => openWindow({ appId: app.id, singleton: true }),
  }));

  const themeCommands: Command[] = THEMES.map((theme) => ({
    id: `theme:${theme}`,
    title: `Theme: ${THEME_LABELS[theme]}`,
    subtitle: 'Switch appearance',
    group: 'Appearance',
    icon: Palette,
    keywords: `theme ${THEME_LABELS[theme]}`,
    run: () => setTheme(theme),
  }));

  const systemCommands: Command[] = [
    {
      id: 'system:launchpad',
      title: 'Open Launchpad',
      subtitle: 'Browse all apps',
      group: 'System',
      icon: LayoutGrid,
      keywords: 'launchpad apps grid all',
      run: () => useLaunchpadStore.getState().open(),
    },
    {
      id: 'system:dnd',
      title: 'Toggle Do Not Disturb',
      subtitle: 'Silence notifications',
      group: 'System',
      icon: Moon,
      keywords: 'do not disturb dnd silence mute notifications focus',
      run: () => {
        const n = useNotificationStore.getState();
        n.setDnd(!n.dnd);
      },
    },
    {
      id: 'system:shortcuts',
      title: 'Keyboard Shortcuts',
      subtitle: 'Show the cheat sheet',
      group: 'System',
      icon: Keyboard,
      keywords: 'keyboard shortcuts keys help cheat sheet',
      run: () => useShortcutsStore.getState().open(),
    },
    {
      id: 'system:about',
      title: 'About Nexus OS',
      subtitle: 'Version & credits',
      group: 'System',
      icon: Sparkles,
      keywords: 'about version credits nexus',
      run: () => openWindow({ appId: 'about', singleton: true }),
    },
    {
      id: 'system:close-all',
      title: 'Close all windows',
      subtitle: 'Clear the desktop',
      group: 'System',
      icon: Power,
      keywords: 'close all quit windows clear',
      run: () => {
        const { windows, close } = useWindowStore.getState();
        windows.forEach((w) => close(w.id));
      },
    },
  ];

  return [...appCommands, ...themeCommands, ...systemCommands];
}
