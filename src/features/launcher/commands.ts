import type { LucideIcon } from 'lucide-react';
import { Palette, Power, Sparkles } from 'lucide-react';
import { APP_LIST } from '@/features/apps/registry';
import { useWindowStore } from '@/features/window-manager/store';
import { useSettingsStore, THEMES, THEME_LABELS } from '@/features/settings/store';

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
