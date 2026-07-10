'use client';

import { Activity, Cpu, Gauge, HardDrive, MemoryStick, Zap } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';
import { AreaChart } from './AreaChart';
import { useFps, useSystemMetrics } from './useSystemMetrics';

function StatTile({ icon: Icon, label, value, unit, tone }: { icon: LucideIcon; label: string; value: number; unit: string; tone: string }) {
  return (
    <div className="rounded-2xl border border-border/[0.06] bg-fg/[0.03] p-3">
      <div className="mb-1 flex items-center gap-1.5">
        <Icon className={cn('h-3.5 w-3.5', tone)} />
        <span className="text-2xs font-medium text-fg-muted">{label}</span>
      </div>
      <div className="flex items-baseline gap-0.5">
        <span className="text-xl font-semibold tabular-nums text-fg">{value.toFixed(0)}</span>
        <span className="text-xs text-fg-muted">{unit}</span>
      </div>
    </div>
  );
}

function Ring({ value }: { value: number }) {
  const r = 30;
  const c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 80 80" className="h-20 w-20 -rotate-90">
      <circle cx="40" cy="40" r={r} fill="none" stroke="rgb(var(--color-fg) / 0.08)" strokeWidth="7" />
      <circle
        cx="40" cy="40" r={r} fill="none" stroke="rgb(var(--color-warning))" strokeWidth="7" strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={c - (value / 100) * c}
        style={{ transition: 'stroke-dashoffset 0.6s var(--ease-smooth)' }}
      />
    </svg>
  );
}

/** System Monitor: live simulated telemetry with area charts, a disk ring, a real
 *  FPS meter and a process table. Everything updates on a shared tick. */
export default function Monitor() {
  const { current, cpuHistory, memHistory, netHistory, processes } = useSystemMetrics();
  const fps = useFps();

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto p-4">
      <div className="grid grid-cols-4 gap-2.5">
        <StatTile icon={Cpu} label="CPU" value={current.cpu} unit="%" tone="text-accent" />
        <StatTile icon={Zap} label="GPU" value={current.gpu} unit="%" tone="text-success" />
        <StatTile icon={MemoryStick} label="Memory" value={current.memory} unit="%" tone="text-warning" />
        <StatTile icon={Activity} label="FPS" value={fps} unit="fps" tone="text-danger" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-border/[0.06] bg-fg/[0.03] p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-medium text-fg-muted">Processor</span>
            <span className="text-sm font-semibold tabular-nums text-accent">{current.cpu.toFixed(0)}%</span>
          </div>
          <div className="h-[72px]">
            <AreaChart values={cpuHistory} color="rgb(var(--color-accent))" />
          </div>
        </div>
        <div className="rounded-2xl border border-border/[0.06] bg-fg/[0.03] p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-medium text-fg-muted">Network</span>
            <span className="text-sm font-semibold tabular-nums text-danger">{current.network.toFixed(0)} Mb/s</span>
          </div>
          <div className="h-[72px]">
            <AreaChart values={netHistory} color="rgb(var(--color-danger))" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-[auto_1fr] items-center gap-4 rounded-2xl border border-border/[0.06] bg-fg/[0.03] p-3">
        <div className="relative grid place-items-center">
          <Ring value={current.disk} />
          <span className="absolute text-sm font-semibold tabular-nums text-fg">{current.disk.toFixed(0)}%</span>
        </div>
        <div>
          <div className="mb-2 flex items-center gap-1.5">
            <HardDrive className="h-3.5 w-3.5 text-warning" />
            <span className="text-xs font-medium text-fg-muted">Disk · Memory pressure</span>
          </div>
          <div className="h-9">
            <AreaChart values={memHistory} color="rgb(var(--color-warning))" height={36} />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border/[0.06] bg-fg/[0.03]">
        <div className="grid grid-cols-[1fr_auto_auto] gap-3 border-b border-border/[0.05] px-3 py-2 text-2xs font-medium uppercase tracking-wide text-fg-muted">
          <span className="flex items-center gap-1.5"><Gauge className="h-3 w-3" /> Process</span>
          <span className="w-14 text-right">CPU %</span>
          <span className="w-16 text-right">MEM MB</span>
        </div>
        <div className="divide-y divide-border/[0.04]">
          {processes.slice(0, 6).map((p) => (
            <div key={p.pid} className="grid grid-cols-[1fr_auto_auto] gap-3 px-3 py-1.5 text-xs">
              <span className="truncate text-fg">
                <span className="mr-2 text-fg-muted tabular-nums">{p.pid}</span>
                {p.name}
              </span>
              <span className="w-14 text-right tabular-nums text-accent">{p.cpu.toFixed(1)}</span>
              <span className="w-16 text-right tabular-nums text-fg-muted">{p.mem.toFixed(0)}</span>
            </div>
          ))}
        </div>
      </div>

      <p className="text-center text-2xs text-fg-muted">Telemetry is simulated locally — FPS is measured live.</p>
    </div>
  );
}
