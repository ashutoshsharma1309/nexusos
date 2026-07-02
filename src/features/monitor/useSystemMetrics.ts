'use client';

import { useEffect, useRef, useState } from 'react';

export interface Metrics {
  cpu: number;
  memory: number;
  disk: number;
  gpu: number;
  network: number;
}

export interface Process {
  pid: number;
  name: string;
  cpu: number;
  mem: number;
}

export interface MetricSeries {
  current: Metrics;
  cpuHistory: number[];
  memHistory: number[];
  netHistory: number[];
  processes: Process[];
}

const HISTORY = 56;

const BASE_PROCS: Omit<Process, 'cpu' | 'mem'>[] = [
  { pid: 1, name: 'nexus-compositor' },
  { pid: 42, name: 'window-manager' },
  { pid: 108, name: 'dexie-worker' },
  { pid: 256, name: 'framer-motion' },
  { pid: 384, name: 'command-palette' },
  { pid: 512, name: 'terminal' },
  { pid: 640, name: 'wallpaper-fx' },
];

/** Bounded random walk for believable telemetry. */
function walk(prev: number, volatility: number, min = 2, max = 98): number {
  return Math.min(max, Math.max(min, prev + (Math.random() - 0.5) * volatility));
}

const fill = (n: number, v: number) => Array<number>(n).fill(v);

/**
 * Simulated system telemetry (no backend). CPU/GPU/network jitter more than memory
 * and disk, which drift slowly — the same asymmetry a real machine shows.
 */
export function useSystemMetrics(intervalMs = 900): MetricSeries {
  const [series, setSeries] = useState<MetricSeries>(() => ({
    current: { cpu: 22, memory: 46, disk: 63, gpu: 18, network: 12 },
    cpuHistory: fill(HISTORY, 22),
    memHistory: fill(HISTORY, 46),
    netHistory: fill(HISTORY, 12),
    processes: BASE_PROCS.map((p) => ({ ...p, cpu: 1, mem: 40 })),
  }));
  const ref = useRef(series);
  ref.current = series;

  useEffect(() => {
    const id = window.setInterval(() => {
      const prev = ref.current.current;
      const next: Metrics = {
        cpu: walk(prev.cpu, 28),
        memory: walk(prev.memory, 5),
        disk: walk(prev.disk, 1.2),
        gpu: walk(prev.gpu, 22),
        network: walk(prev.network, 44),
      };
      const processes = ref.current.processes
        .map((p) => ({ ...p, cpu: walk(p.cpu, 6, 0, 40), mem: walk(p.mem, 10, 8, 260) }))
        .sort((a, b) => b.cpu - a.cpu);
      setSeries({
        current: next,
        cpuHistory: [...ref.current.cpuHistory.slice(1), next.cpu],
        memHistory: [...ref.current.memHistory.slice(1), next.memory],
        netHistory: [...ref.current.netHistory.slice(1), next.network],
        processes,
      });
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);

  return series;
}

/** A genuine FPS meter driven by requestAnimationFrame. */
export function useFps(): number {
  const [fps, setFps] = useState(60);
  useEffect(() => {
    let frames = 0;
    let last = performance.now();
    let raf = 0;
    const loop = (t: number) => {
      frames++;
      if (t - last >= 500) {
        setFps(Math.round((frames * 1000) / (t - last)));
        frames = 0;
        last = t;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);
  return fps;
}
