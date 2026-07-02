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
  hydrated: boolean;

  hydrate: () => Promise<void>;
  setTheme: (theme: ThemeId) => void;
  setAccent: (accent: string | null) => void;
  setMotion: (motion: MotionPref) => void;
  setContrast: (contrast: ContrastPref) => void;
  setReduceTransparency: (value: boolean) => void;
}

const PERSIST_KEY = 'settings/appearance';

interface PersistedShape {
  theme: ThemeId;
  accent: string | null;
  motion: MotionPref;
  contrast: ContrastPref;
  reduceTransparency: boolean;
}

function persist(state: SettingsState): void {
  const payload: PersistedShape = {
    theme: state.theme,
    accent: state.accent,
    motion: state.motion,
    contrast: state.contrast,
    reduceTransparency: state.reduceTransparency,
  };
  void kv.set(PERSIST_KEY, payload);
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  theme: 'dark',
  accent: null,
  motion: 'full',
  contrast: 'normal',
  reduceTransparency: false,
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
}));
