import { create } from 'zustand';

interface LaunchpadStore {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

/** Controls the full-screen Launchpad app grid. */
export const useLaunchpadStore = create<LaunchpadStore>((set, get) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  toggle: () => set({ isOpen: !get().isOpen }),
}));
