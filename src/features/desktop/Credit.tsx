'use client';

import { Linkedin } from 'lucide-react';

const PROFILE_URL = 'https://www.linkedin.com/in/ashutoshsharma1309/';

/** A subtle author credit anchored to the bottom-left of the desktop. */
export function Credit() {
  return (
    <a
      href={PROFILE_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Made by Ashutosh Sharma — open LinkedIn profile"
      className="glass-strong pressable group absolute bottom-3 left-3 z-chrome flex items-center gap-2 rounded-full py-1.5 pl-3 pr-3.5 text-xs text-fg-muted opacity-70 shadow-popover transition-opacity hover:opacity-100"
    >
      <Linkedin className="h-3.5 w-3.5 text-accent" />
      <span>
        Made by <span className="font-medium text-fg">Ashutosh Sharma</span>
      </span>
    </a>
  );
}
