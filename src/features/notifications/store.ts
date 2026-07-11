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
  /** Do Not Disturb: notifications still collect in the center but never toast. */
  dnd: boolean;
  push: (input: Omit<NotificationItem, 'id' | 'createdAt' | 'read' | 'toast'>) => string;
  dismissToast: (id: string) => void;
  remove: (id: string) => void;
  markAllRead: () => void;
  clearAll: () => void;
  togglePanel: () => void;
  closePanel: () => void;
  setDnd: (value: boolean) => void;
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  items: [],
  panelOpen: false,
  dnd: false,

  push: (input) => {
    const id = nanoid();
    const item: NotificationItem = {
      ...input,
      id,
      createdAt: Date.now(),
      read: false,
      // Under Do Not Disturb the item is filed silently, no toast.
      toast: !get().dnd,
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
  setDnd: (dnd) => set({ dnd }),
}));

/** Convenience helper usable outside React (services, terminal commands…). */
export const notify = (input: Parameters<NotificationStore['push']>[0]) =>
  useNotificationStore.getState().push(input);
