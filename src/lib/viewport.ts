/** The breakpoint below which the desktop metaphor switches to a touch layout. */
export const MOBILE_MAX = 768;

/** True when the current viewport is phone/tablet sized. SSR-safe (false on server). */
export function isMobileViewport(): boolean {
  return typeof window !== 'undefined' && window.innerWidth <= MOBILE_MAX;
}
