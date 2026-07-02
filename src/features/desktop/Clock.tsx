'use client';

import { useEffect, useState } from 'react';

const TIME_FMT: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit' };
const DATE_FMT: Intl.DateTimeFormatOptions = { weekday: 'short', month: 'short', day: 'numeric' };

/** Live menu-bar clock; updates once per second, hydration-safe. */
export function Clock() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  if (!now) return <span className="w-28" aria-hidden />;

  return (
    <span className="flex items-center gap-2 text-xs font-medium tabular-nums text-fg">
      <span className="text-fg-muted">{now.toLocaleDateString(undefined, DATE_FMT)}</span>
      <span>{now.toLocaleTimeString(undefined, TIME_FMT)}</span>
    </span>
  );
}
