import { create } from 'zustand';
import { kv } from '@/services/db';

export const THEMES = [
  'dark',
  'light',
  'glass',
  'cyberpunk',
  'tokyo-night',
  'nord',
  'gruvbox',
  'catppuccin',
] as const;

export type ThemeId = (typeof THEMES)[number];

export const THEME_LABELS: Record<ThemeId, string> = {
  dark: 'Dark',
  light: 'Light',
  glass: 'Glass',
  cyberpunk: 'Cyberpunk',
  'tokyo-night': 'Tokyo Night',
  nord: 'Nord',
  gruvbox: 'Gruvbox',
  catppuccin: 'Catppuccin',
};

export type MotionPref = 'full' | 'reduced';
export type ContrastPref = 'normal' | 'high';

export interface SettingsState {
  theme: ThemeId;
  /** Accent override as an "R G B" channel triple, or null to use the theme accent. */
  accent: string | null;
  motion: MotionPref;
  contrast: ContrastPref;
  reduceTransparency: boolean;
  /** Display brightness in [0.35, 1]; dims the whole screen via an overlay. */
  brightness: number;
  /** Output volume in [0, 1]; drives the UI feedback blip. */
  volume: number;
  hydrated: boolean;

  hydrate: () => Promise<void>;
  setTheme: (theme: ThemeId) => void;
  setAccent: (accent: string | null) => void;
  setMotion: (motion: MotionPref) => void;
  setContrast: (contrast: ContrastPref) => void;
  setReduceTransparency: (value: boolean) => void;
  setBrightness: (value: number) => void;
  setVolume: (value: number) => void;
}

const PERSIST_KEY = 'settings/appearance';

interface PersistedShape {
  theme: ThemeId;
  accent: string | null;
  motion: MotionPref;
  contrast: ContrastPref;
  reduceTransparency: boolean;
  brightness: number;
  volume: number;
}

function persist(state: SettingsState): void {
  const payload: PersistedShape = {
    theme: state.theme,
    accent: state.accent,
    motion: state.motion,
    contrast: state.contrast,
    reduceTransparency: state.reduceTransparency,
    brightness: state.brightness,
    volume: state.volume,
  };
  void kv.set(PERSIST_KEY, payload);
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  theme: 'dark',
  accent: null,
  motion: 'full',
  contrast: 'normal',
  reduceTransparency: false,
  brightness: 1,
  volume: 0.7,
  hydrated: false,

  hydrate: async () => {
    const saved = await kv.get<PersistedShape | null>(PERSIST_KEY, null);
    if (saved) set({ ...saved, hydrated: true });
    else set({ hydrated: true });
  },

  setTheme: (theme) => {
    set({ theme });
    persist(get());
  },
  setAccent: (accent) => {
    set({ accent });
    persist(get());
  },
  setMotion: (motion) => {
    set({ motion });
    persist(get());
  },
  setContrast: (contrast) => {
    set({ contrast });
    persist(get());
  },
  setReduceTransparency: (reduceTransparency) => {
    set({ reduceTransparency });
    persist(get());
  },
  setBrightness: (brightness) => {
    set({ brightness: Math.min(1, Math.max(0.35, brightness)) });
    persist(get());
  },
  setVolume: (volume) => {
    set({ volume: Math.min(1, Math.max(0, volume)) });
    persist(get());
  },
}));
