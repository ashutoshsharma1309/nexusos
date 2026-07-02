import dynamic from 'next/dynamic';
import type { ComponentType } from 'react';
import {
  FolderTree,
  Info,
  NotebookPen,
  Settings2,
  SquareTerminal,
  Code2,
  Gauge,
  Calculator as CalculatorIcon,
  Grid3x3,
  type LucideIcon,
} from 'lucide-react';
import type { Size } from '@/lib/geometry';
import type { WindowInstance } from '@/features/window-manager/types';

/** Props every app window body receives. */
export interface AppComponentProps {
  window: WindowInstance;
}

export interface AppDefinition {
  id: string;
  title: string;
  icon: LucideIcon;
  /** Accent tint (RGB triple) used for the dock/launcher glyph background. */
  tint: string;
  defaultSize?: Size;
  /** Shown in the dock by default. */
  dock: boolean;
  component: ComponentType<AppComponentProps>;
}

const loading = () => (
  <div className="flex h-full items-center justify-center text-sm text-fg-muted">Loading…</div>
);

/**
 * Apps are code-split via next/dynamic so each app's bundle only loads when first opened.
 * This keeps the desktop shell's initial payload small.
 */
export const APPS: Record<string, AppDefinition> = {
  files: {
    id: 'files',
    title: 'Explorer',
    icon: FolderTree,
    tint: '99 132 255',
    defaultSize: { width: 860, height: 560 },
    dock: true,
    component: dynamic(() => import('@/features/explorer/Explorer'), { loading }),
  },
  terminal: {
    id: 'terminal',
    title: 'Terminal',
    icon: SquareTerminal,
    tint: '74 210 149',
    defaultSize: { width: 720, height: 460 },
    dock: true,
    component: dynamic(() => import('@/features/terminal/Terminal'), { loading }),
  },
  notes: {
    id: 'notes',
    title: 'Notes',
    icon: NotebookPen,
    tint: '240 189 82',
    defaultSize: { width: 900, height: 600 },
    dock: true,
    component: dynamic(() => import('@/features/notes/Notes'), { loading }),
  },
  editor: {
    id: 'editor',
    title: 'Code',
    icon: Code2,
    tint: '122 162 255',
    defaultSize: { width: 940, height: 620 },
    dock: true,
    component: dynamic(() => import('@/features/editor/Editor'), { loading }),
  },
  calculator: {
    id: 'calculator',
    title: 'Calculator',
    icon: CalculatorIcon,
    tint: '251 146 60',
    defaultSize: { width: 320, height: 460 },
    dock: true,
    component: dynamic(() => import('@/features/calculator/Calculator'), { loading }),
  },
  tictactoe: {
    id: 'tictactoe',
    title: 'Tic-Tac-Toe',
    icon: Grid3x3,
    tint: '52 211 153',
    defaultSize: { width: 360, height: 520 },
    dock: true,
    component: dynamic(() => import('@/features/tictactoe/TicTacToe'), { loading }),
  },
  monitor: {
    id: 'monitor',
    title: 'System Monitor',
    icon: Gauge,
    tint: '244 105 112',
    defaultSize: { width: 720, height: 520 },
    dock: true,
    component: dynamic(() => import('@/features/monitor/Monitor'), { loading }),
  },
  settings: {
    id: 'settings',
    title: 'Settings',
    icon: Settings2,
    tint: '148 154 176',
    defaultSize: { width: 820, height: 580 },
    dock: true,
    component: dynamic(() => import('@/features/settings/Settings'), { loading }),
  },
  about: {
    id: 'about',
    title: 'About Nexus OS',
    icon: Info,
    tint: '203 166 247',
    defaultSize: { width: 560, height: 460 },
    dock: false,
    component: dynamic(() => import('@/features/about/About'), { loading }),
  },
};

export function getApp(id: string): AppDefinition {
  const app = APPS[id];
  if (!app) throw new Error(`Unknown app: ${id}`);
  return app;
}

export const APP_LIST: AppDefinition[] = Object.values(APPS);
export const DOCK_APPS: AppDefinition[] = APP_LIST.filter((a) => a.dock);
