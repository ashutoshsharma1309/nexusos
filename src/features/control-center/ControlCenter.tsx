'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Contrast,
  Moon,
  Palette,
  SlidersHorizontal,
  Sun,
  Volume2,
  VolumeX,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { popVariants } from '@/lib/motion';
import { playBlip } from '@/lib/audio';
import { THEMES, useSettingsStore } from '@/features/settings/store';
import { useNotificationStore } from '@/features/notifications/store';

function Tile({ icon: Icon, label, active, onClick }: { icon: LucideIcon; label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'flex flex-col items-start gap-2 rounded-xl p-3 text-left transition-colors',
        active ? 'bg-accent text-accent-fg' : 'bg-fg/[0.06] text-fg hover:bg-fg/10',
      )}
    >
      <Icon className="h-4 w-4" />
      <span className="text-xs font-medium leading-tight">{label}</span>
    </button>
  );
}

function Slider({ icon: Icon, min, value, onChange, ariaLabel }: { icon: LucideIcon; min: LucideIcon; value: number; onChange: (v: number) => void; ariaLabel: string }) {
  const MinIcon = min;
  return (
    <div className="flex items-center gap-2.5 rounded-xl bg-fg/[0.06] px-3 py-2.5">
      <MinIcon className="h-3.5 w-3.5 shrink-0 text-fg-muted" />
      <input
        type="range"
        min={0}
        max={100}
        value={Math.round(value * 100)}
        aria-label={ariaLabel}
        onChange={(e) => onChange(Number(e.target.value) / 100)}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-fg/15 accent-accent"
      />
      <Icon className="h-4 w-4 shrink-0 text-fg" />
    </div>
  );
}

/** macOS-style Control Center: quick toggles + brightness/volume sliders, with
 *  real effects (screen dimming, Do Not Disturb, UI sound). */
export function ControlCenter() {
  const [open, setOpen] = useState(false);
  const s = useSettingsStore();
  const dnd = useNotificationStore((n) => n.dnd);
  const setDnd = useNotificationStore((n) => n.setDnd);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Control center"
        aria-expanded={open}
        className="glass-strong pressable grid h-8 w-8 place-items-center rounded-full text-fg-muted shadow-popover hover:text-fg"
      >
        <SlidersHorizontal className="h-3.5 w-3.5" />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-overlay" onPointerDown={() => setOpen(false)} />
            <motion.div
              role="dialog"
              aria-label="Control center"
              variants={popVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="glass-strong absolute right-0 top-10 z-popover w-72 origin-top-right space-y-2.5 rounded-2xl p-3 shadow-popover"
            >
              <div className="grid grid-cols-3 gap-2">
                <Tile icon={Moon} label="Do Not Disturb" active={dnd} onClick={() => setDnd(!dnd)} />
                <Tile icon={Zap} label="Reduce Motion" active={s.motion === 'reduced'} onClick={() => s.setMotion(s.motion === 'reduced' ? 'full' : 'reduced')} />
                <Tile icon={Contrast} label="High Contrast" active={s.contrast === 'high'} onClick={() => s.setContrast(s.contrast === 'high' ? 'normal' : 'high')} />
              </div>

              <div className="rounded-xl bg-fg/[0.06] p-3">
                <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-fg-muted">
                  <Palette className="h-3.5 w-3.5" /> Theme
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {THEMES.map((t) => (
                    <button
                      key={t}
                      type="button"
                      data-theme={t}
                      aria-label={`Theme ${t}`}
                      onClick={() => s.setTheme(t)}
                      className={cn(
                        'h-6 w-6 rounded-full border transition-transform hover:scale-110',
                        s.theme === t ? 'border-fg ring-2 ring-accent/60' : 'border-white/10',
                      )}
                      // Use the raw per-theme token (data-theme sets it here) rather
                      // than --color-accent, which is resolved once at :root.
                      style={{ background: 'rgb(var(--theme-accent))' }}
                    />
                  ))}
                </div>
              </div>

              <Slider icon={Sun} min={Moon} value={s.brightness} onChange={s.setBrightness} ariaLabel="Brightness" />
              <Slider
                icon={Volume2}
                min={VolumeX}
                value={s.volume}
                onChange={(v) => {
                  s.setVolume(v);
                  playBlip(v);
                }}
                ariaLabel="Volume"
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
