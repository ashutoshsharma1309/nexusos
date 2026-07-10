'use client';

import { useSyncExternalStore } from 'react';
import { MOBILE_MAX } from '@/lib/viewport';

const QUERY = `(max-width: ${MOBILE_MAX}px)`;

function subscribe(callback: () => void): () => void {
  const mql = window.matchMedia(QUERY);
  mql.addEventListener('change', callback);
  return () => mql.removeEventListener('change', callback);
}

/**
 * Reactive viewport check backed by matchMedia. Uses useSyncExternalStore so it
 * stays correct across resizes/orientation changes and hydrates safely (server
 * snapshot is always false — the desktop layout).
 */
export function useIsMobile(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => false,
  );
}
