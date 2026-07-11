'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity,
  BatteryCharging,
  BatteryMedium,
  Cpu,
  Gauge,
  HardDrive,
  MemoryStick,
  MonitorSmartphone,
  Wifi,
  WifiOff,
  Zap,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';
import { popVariants } from '@/lib/motion';
import { useFps, useSystemMetrics } from '@/features/monitor/useSystemMetrics';
import { useDeviceInfo } from './useDeviceInfo';

function Meter({ icon: Icon, label, value, unit, tone }: { icon: LucideIcon; label: string; value: number; unit: string; tone: string }) {
  return (
    <div>
      <div className="mb-1 flex items-center gap-1.5 text-2xs text-fg-muted">
        <Icon className={cn('h-3 w-3', tone)} />
        {label}
        <span className="ml-auto tabular-nums text-fg">{value.toFixed(0)}{unit}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-fg/10">
        <div className={cn('h-full rounded-full transition-[width] duration-500', tone.replace('text-', 'bg-'))} style={{ width: `${Math.min(100, value)}%` }} />
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-1 text-2xs">
      <span className="text-fg-muted">{label}</span>
      <span className="truncate tabular-nums text-fg">{value}</span>
    </div>
  );
}

function formatUptime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m ${String(s).padStart(2, '0')}s`;
}

/** Menu-bar system monitor: a live CPU readout that expands into a panel of
 *  simulated telemetry and real device details (cores, memory, network, battery). */
export function SystemStats() {
  const [open, setOpen] = useState(false);
  const { current } = useSystemMetrics(1200);
  const fps = useFps();
  const device = useDeviceInfo();
  const bootRef = useRef<number>(0);
  const [uptime, setUptime] = useState(0);

  useEffect(() => {
    bootRef.current = performance.now();
    const id = window.setInterval(() => setUptime((performance.now() - bootRef.current) / 1000), 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const BatteryIcon = device.battery?.charging ? BatteryCharging : BatteryMedium;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="System status"
        aria-expanded={open}
        aria-haspopup="dialog"
        className="glass-strong pressable flex h-8 items-center gap-2 rounded-full px-3 shadow-popover"
      >
        <Cpu className="h-3.5 w-3.5 text-accent" />
        <span className="w-9 text-left text-xs font-medium tabular-nums text-fg">{current.cpu.toFixed(0)}%</span>
        <span className="hidden h-3.5 w-10 items-end gap-px sm:flex" aria-hidden>
          {[current.cpu, current.memory, current.gpu].map((v, i) => (
            <span key={i} className="flex-1 rounded-sm bg-fg/15">
              <span className="block w-full rounded-sm bg-accent" style={{ height: `${Math.max(8, v)}%` }} />
            </span>
          ))}
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-overlay" onPointerDown={() => setOpen(false)} />
            <motion.div
              role="dialog"
              aria-label="System status"
              variants={popVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="glass-strong absolute right-0 top-10 z-popover w-64 origin-top-right rounded-2xl p-3 shadow-popover"
            >
              <div className="mb-2 flex items-center gap-2">
                <Gauge className="h-4 w-4 text-accent" />
                <span className="text-sm font-semibold text-fg">System</span>
                <span className="ml-auto text-2xs text-fg-muted">up {formatUptime(uptime)}</span>
              </div>

              <div className="space-y-2.5">
                <Meter icon={Cpu} label="CPU" value={current.cpu} unit="%" tone="text-accent" />
                <Meter icon={MemoryStick} label="Memory" value={current.memory} unit="%" tone="text-success" />
                <Meter icon={Zap} label="GPU" value={current.gpu} unit="%" tone="text-warning" />
                <Meter icon={Wifi} label="Network" value={current.network} unit=" Mb" tone="text-danger" />
              </div>

              <div className="my-2.5 h-px bg-fg/10" />

              <div className="flex items-center gap-1.5 text-2xs">
                <Activity className="h-3 w-3 text-accent" />
                <span className="text-fg-muted">Render</span>
                <span className="ml-auto tabular-nums text-fg">{fps} fps</span>
              </div>

              <div className="my-2.5 h-px bg-fg/10" />

              <Detail label="Platform" value={device.platform} />
              <Detail label="Logical cores" value={device.cores ? `${device.cores}` : '—'} />
              <Detail label="Device memory" value={device.memoryGb ? `${device.memoryGb} GB` : '—'} />
              <div className="flex items-center justify-between gap-4 py-1 text-2xs">
                <span className="flex items-center gap-1.5 text-fg-muted"><MonitorSmartphone className="h-3 w-3" /> Display</span>
                <span className="tabular-nums text-fg">{device.resolution}</span>
              </div>
              <div className="flex items-center justify-between gap-4 py-1 text-2xs">
                <span className="flex items-center gap-1.5 text-fg-muted">
                  {device.online ? <Wifi className="h-3 w-3 text-success" /> : <WifiOff className="h-3 w-3 text-danger" />} Network
                </span>
                <span className="text-fg">{device.online ? 'Online' : 'Offline'}</span>
              </div>
              {device.battery && (
                <div className="flex items-center justify-between gap-4 py-1 text-2xs">
                  <span className="flex items-center gap-1.5 text-fg-muted"><BatteryIcon className="h-3 w-3" /> Battery</span>
                  <span className="tabular-nums text-fg">
                    {Math.round(device.battery.level * 100)}%{device.battery.charging ? ' ⚡' : ''}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between gap-4 py-1 text-2xs">
                <span className="flex items-center gap-1.5 text-fg-muted"><HardDrive className="h-3 w-3" /> Storage</span>
                <span className="tabular-nums text-fg">{current.disk.toFixed(0)}% used</span>
              </div>

              <p className="mt-2 text-center text-[10px] text-fg-muted">Live device data · simulated load</p>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
