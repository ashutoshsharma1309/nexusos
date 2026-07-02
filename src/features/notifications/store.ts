import { create } from 'zustand';
import { nanoid } from 'nanoid';

export type NotificationTone = 'info' | 'success' | 'warning' | 'danger';

export interface NotificationItem {
  id: string;
  title: string;
  body?: string;
  tone: NotificationTone;
  /** Optional owning app, used to badge its dock icon. */
  appId?: string;
  createdAt: number;
  read: boolean;
  /** Whether this item is still showing as a transient toast. */
  toast: boolean;
}

interface NotificationStore {
  items: NotificationItem[];
  panelOpen: boolean;
  push: (input: Omit<NotificationItem, 'id' | 'createdAt' | 'read' | 'toast'>) => string;
  dismissToast: (id: string) => void;
  remove: (id: string) => void;
  markAllRead: () => void;
  clearAll: () => void;
  togglePanel: () => void;
  closePanel: () => void;
}

export const useNotificationStore = create<NotificationStore>((set) => ({
  items: [],
  panelOpen: false,

  push: (input) => {
    const id = nanoid();
    const item: NotificationItem = {
      ...input,
      id,
      createdAt: Date.now(),
      read: false,
      toast: true,
    };
    set((s) => ({ items: [item, ...s.items].slice(0, 50) }));
    return id;
  },

  dismissToast: (id) =>
    set((s) => ({
      items: s.items.map((i) => (i.id === id ? { ...i, toast: false } : i)),
    })),

  remove: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
  markAllRead: () => set((s) => ({ items: s.items.map((i) => ({ ...i, read: true })) })),
  clearAll: () => set({ items: [] }),
  togglePanel: () =>
    set((s) => ({
      panelOpen: !s.panelOpen,
      items: s.panelOpen ? s.items : s.items.map((i) => ({ ...i, read: true })),
    })),
  closePanel: () => set({ panelOpen: false }),
}));

/** Convenience helper usable outside React (services, terminal commands…). */
export const notify = (input: Parameters<NotificationStore['push']>[0]) =>
  useNotificationStore.getState().push(input);
