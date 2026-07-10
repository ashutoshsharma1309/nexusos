'use client';

import { ThemeProvider } from '@/providers/ThemeProvider';
import { MotionProvider } from '@/providers/MotionProvider';
import { BootProvider } from '@/providers/BootProvider';

/** Client provider tree mounted once at the app root. */
export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <MotionProvider>
        <BootProvider>{children}</BootProvider>
      </MotionProvider>
    </ThemeProvider>
  );
}
