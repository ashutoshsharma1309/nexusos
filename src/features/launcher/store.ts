import { create } from 'zustand';

interface LauncherStore {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

/** Controls visibility of the command palette / launcher overlay. */
export const useLauncherStore = create<LauncherStore>((set, get) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  toggle: () => set({ isOpen: !get().isOpen }),
}));
