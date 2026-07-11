'use client';

import { useEffect, useState } from 'react';

export interface DeviceInfo {
  platform: string;
  cores: number | null;
  memoryGb: number | null;
  resolution: string;
  online: boolean;
  battery: { level: number; charging: boolean } | null;
}

/** Non-standard navigator fields, typed narrowly so we avoid `any`. */
interface NavigatorExtended extends Navigator {
  deviceMemory?: number;
  getBattery?: () => Promise<BatteryManagerLike>;
}
interface BatteryManagerLike extends EventTarget {
  level: number;
  charging: boolean;
}

/**
 * Real device/environment details pulled from browser APIs (hardware
 * concurrency, device memory, network status, Battery API, screen). Reactive to
 * connectivity and battery changes.
 */
export function useDeviceInfo(): DeviceInfo {
  const [info, setInfo] = useState<DeviceInfo>({
    platform: 'Nexus',
    cores: null,
    memoryGb: null,
    resolution: '—',
    online: true,
    battery: null,
  });

  useEffect(() => {
    const nav = navigator as NavigatorExtended;
    const uaData = (nav as unknown as { userAgentData?: { platform?: string } }).userAgentData;
    const uaPlatform = uaData?.platform ?? nav.platform ?? 'Unknown';

    const base: DeviceInfo = {
      platform: uaPlatform,
      cores: nav.hardwareConcurrency ?? null,
      memoryGb: nav.deviceMemory ?? null,
      resolution: `${window.screen.width} × ${window.screen.height}`,
      online: nav.onLine,
      battery: null,
    };
    setInfo(base);

    const onOnline = () => setInfo((i) => ({ ...i, online: navigator.onLine }));
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOnline);

    let battery: BatteryManagerLike | null = null;
    const syncBattery = () =>
      battery && setInfo((i) => ({ ...i, battery: { level: battery!.level, charging: battery!.charging } }));
    nav.getBattery?.().then((b) => {
      battery = b;
      syncBattery();
      b.addEventListener('levelchange', syncBattery);
      b.addEventListener('chargingchange', syncBattery);
    });

    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOnline);
      battery?.removeEventListener('levelchange', syncBattery);
      battery?.removeEventListener('chargingchange', syncBattery);
    };
  }, []);

  return info;
}
