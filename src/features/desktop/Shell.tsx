'use client';

import { useGlobalShortcuts } from '@/hooks/useGlobalShortcuts';
import { usePointerAmbient } from '@/hooks/usePointerAmbient';
import { Dock } from '@/features/dock/Dock';
import { CommandPalette } from '@/features/launcher/CommandPalette';
import { Launchpad } from '@/features/launchpad/Launchpad';
import { Toaster } from '@/features/notifications/Toaster';
import { NotificationCenter } from '@/features/notifications/NotificationCenter';
import { ShortcutsOverlay } from '@/components/ShortcutsOverlay';
import { Desktop } from './Desktop';
import { MenuBar } from './MenuBar';
import { BrightnessOverlay } from './BrightnessOverlay';

/** Top-level desktop composition: chrome, windows and overlays. */
export function Shell() {
  useGlobalShortcuts();
  usePointerAmbient();

  return (
    <div className="relative h-dvh w-screen overflow-hidden">
      <a
        href="#main-content"
        className="sr-only rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-accent-fg focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-boot"
      >
        Skip to content
      </a>
      <Desktop />
      <MenuBar />
      <Dock />
      <Launchpad />
      <CommandPalette />
      <NotificationCenter />
      <ShortcutsOverlay />
      <Toaster />
      <BrightnessOverlay />
    </div>
  );
}
