'use client';

import { useGlobalShortcuts } from '@/hooks/useGlobalShortcuts';
import { usePointerAmbient } from '@/hooks/usePointerAmbient';
import { Dock } from '@/features/dock/Dock';
import { CommandPalette } from '@/features/launcher/CommandPalette';
import { Toaster } from '@/features/notifications/Toaster';
import { NotificationCenter } from '@/features/notifications/NotificationCenter';
import { Desktop } from './Desktop';
import { MenuBar } from './MenuBar';

/** Top-level desktop composition: chrome, windows and overlays. */
export function Shell() {
  useGlobalShortcuts();
  usePointerAmbient();

  return (
    <div className="relative h-dvh w-screen overflow-hidden">
      <Desktop />
      <MenuBar />
      <Dock />
      <CommandPalette />
      <NotificationCenter />
      <Toaster />
    </div>
  );
}
