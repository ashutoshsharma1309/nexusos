import { memo } from 'react';
import { Minus, Square, X, Copy } from 'lucide-react';
import { cn } from '@/lib/cn';
import { getApp } from '@/features/apps/registry';
import { useWindowStore } from '../store';
import type { WindowInstance } from '../types';

interface Props {
  win: WindowInstance;
  onPointerDown: (event: React.PointerEvent) => void;
}

/** macOS-style traffic-light control. */
function TrafficLight({
  color,
  label,
  onClick,
  children,
}: {
  color: string;
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      data-no-drag
      aria-label={label}
      onClick={onClick}
      className="group grid h-3.5 w-3.5 place-items-center rounded-full transition-transform active:scale-90"
      style={{ backgroundColor: color }}
    >
      <span className="opacity-0 transition-opacity group-hover:opacity-100">{children}</span>
    </button>
  );
}

function TitleBarImpl({ win, onPointerDown }: Props) {
  const close = useWindowStore((s) => s.close);
  const minimize = useWindowStore((s) => s.minimize);
  const toggleMaximize = useWindowStore((s) => s.toggleMaximize);
  const app = getApp(win.appId);
  const Icon = app.icon;

  return (
    <div
      onPointerDown={onPointerDown}
      onDoubleClick={() => toggleMaximize(win.id)}
      className={cn(
        'flex h-10 shrink-0 items-center gap-3 px-3 select-none',
        'border-b border-white/5',
      )}
    >
      <div className="flex items-center gap-2" data-no-drag>
        <TrafficLight color="#ff5f57" label="Close window" onClick={() => close(win.id)}>
          <X className="h-2 w-2 text-black/60" strokeWidth={3} />
        </TrafficLight>
        <TrafficLight color="#febc2e" label="Minimize window" onClick={() => minimize(win.id)}>
          <Minus className="h-2 w-2 text-black/60" strokeWidth={3} />
        </TrafficLight>
        <TrafficLight color="#28c840" label="Maximize window" onClick={() => toggleMaximize(win.id)}>
          {win.state === 'maximized' ? (
            <Copy className="h-2 w-2 text-black/60" strokeWidth={3} />
          ) : (
            <Square className="h-2 w-2 text-black/60" strokeWidth={3} />
          )}
        </TrafficLight>
      </div>

      <div className="pointer-events-none flex flex-1 items-center justify-center gap-2 truncate">
        <Icon className="h-3.5 w-3.5 text-fg-muted" />
        <span className="truncate text-xs font-medium text-fg-muted">{win.title}</span>
      </div>

      <div className="w-[54px]" aria-hidden />
    </div>
  );
}

export const TitleBar = memo(TitleBarImpl);
