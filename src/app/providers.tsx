'use client';

import { ThemeProvider } from '@/providers/ThemeProvider';
import { BootProvider } from '@/providers/BootProvider';

/** Client provider tree mounted once at the app root. */
export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <BootProvider>{children}</BootProvider>
    </ThemeProvider>
  );
}
