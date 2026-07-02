'use client';

import { Github, Cpu, Layers, Sparkles } from 'lucide-react';

const STACK = [
  'Next.js 15',
  'React 19',
  'TypeScript',
  'Tailwind CSS',
  'Zustand',
  'Framer Motion',
  'Dexie / IndexedDB',
  'Fuse.js',
];

/** The "About this Mac"-style panel. */
export default function About() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-5 overflow-y-auto p-8 text-center">
      <div className="grid h-20 w-20 place-items-center rounded-3xl bg-gradient-to-br from-accent to-accent/40 shadow-lg">
        <Sparkles className="h-10 w-10 text-accent-fg" />
      </div>
      <div>
        <h1 className="text-2xl font-bold text-fg">Nexus OS</h1>
        <p className="text-sm text-fg-muted">A desktop environment for the browser</p>
        <p className="mt-1 text-xs text-fg-muted">Version 0.1.0 · Build “Aurora”</p>
      </div>

      <div className="grid w-full max-w-sm grid-cols-3 gap-2 text-left">
        {[
          { icon: Layers, label: 'Windows', value: 'Composited' },
          { icon: Cpu, label: 'Runtime', value: '100% Local' },
          { icon: Github, label: 'Backend', value: 'None' },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="rounded-xl bg-white/5 p-3">
            <Icon className="mb-1.5 h-4 w-4 text-accent" />
            <p className="text-[10px] uppercase tracking-wide text-fg-muted">{label}</p>
            <p className="text-sm font-medium text-fg">{value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap justify-center gap-1.5">
        {STACK.map((tech) => (
          <span key={tech} className="rounded-full bg-white/5 px-2.5 py-1 text-[11px] text-fg-muted">
            {tech}
          </span>
        ))}
      </div>
    </div>
  );
}
