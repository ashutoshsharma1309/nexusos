# Nexus OS

A desktop operating system that runs **entirely in the browser**. No backend, no auth, no API keys, no external services — everything works immediately after install.

Nexus OS is built as a demonstration of senior-level frontend engineering: a composited window manager, a magnifying dock, a fuzzy command palette, an eight-theme design engine, a virtual filesystem persisted to IndexedDB, and a set of real applications — all code-split and hydration-safe.

```bash
pnpm install
pnpm dev
# → http://localhost:3000
```

## Highlights

| Area | What's inside |
| --- | --- |
| **Window manager** | Drag, 8-way resize, snap zones (½-tiling + maximize), minimize/maximize/restore, focus & z-index management, spring animations, keyboard cycling |
| **Dock** | macOS-style cursor magnification via Framer Motion spring `MotionValue`s, running-app indicators, tooltips |
| **Desktop** | Animated theme-driven wallpaper, desktop icons, marquee selection box, right-click context menu |
| **Command palette** | Fuse.js fuzzy search across apps, themes and system commands; full keyboard navigation (⌘K) |
| **Theming** | 8 themes (Dark, Light, Glass, Cyberpunk, Tokyo Night, Nord, Gruvbox, Catppuccin) + accent override, driven by CSS variables so a swap is a single DOM write |
| **Apps** | Explorer, Terminal, Notes, Code editor, System Monitor, Settings, About |
| **Persistence** | Virtual filesystem, notes and settings stored in IndexedDB via Dexie with live queries |
| **Notifications** | Toasts + a slide-in notification center |
| **Accessibility** | Reduced-motion (OS-aware + manual), high-contrast, reduce-transparency, focus rings, ARIA roles, keyboard-first |

## Keyboard shortcuts

| Shortcut | Action |
| --- | --- |
| `⌘K` / `Ctrl+K` | Toggle command palette |
| `⌘W` / `Ctrl+W` | Close focused window |
| `⌘M` / `Ctrl+M` | Minimize focused window |
| `Ctrl+` `` ` `` | Cycle window focus (`⇧` to reverse) |
| Double-click title bar | Maximize / restore |
| Drag window to edge | Snap-tile left / right / maximize |

## Terminal

A Linux-like shell backed by the virtual filesystem:
`help · ls · pwd · cd · mkdir · touch · cat · echo · find · grep · tree · theme · whoami · date · history · clear`

## Tech stack

Next.js 15 (App Router) · React 19 · TypeScript (strict) · Tailwind CSS · Zustand · Framer Motion · Dexie/IndexedDB · Fuse.js · Lucide.

## Scripts

```bash
pnpm dev        # start the dev server
pnpm build      # production build
pnpm typecheck  # strict tsc --noEmit
pnpm lint       # eslint
pnpm format     # prettier
```

See [`docs/Architecture.md`](docs/Architecture.md) for the system design and [`docs/FutureRoadmap.md`](docs/FutureRoadmap.md) for what's next.
