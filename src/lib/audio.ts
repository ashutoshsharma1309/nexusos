'use client';

let ctx: AudioContext | null = null;

/** Lazily create a shared AudioContext (must follow a user gesture). */
function context(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  return ctx;
}

/**
 * Play a short, soft UI blip at the given volume [0,1]. Used as tactile feedback
 * for the volume slider — no audio assets, generated with the Web Audio API.
 */
export function playBlip(volume: number): void {
  const audio = context();
  if (!audio || volume <= 0) return;
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = 'sine';
  osc.frequency.value = 660;
  const now = audio.currentTime;
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(Math.min(0.2, volume * 0.2), now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);
  osc.connect(gain).connect(audio.destination);
  osc.start(now);
  osc.stop(now + 0.17);
}
