# Future Roadmap

Nexus OS ships as a complete, running desktop shell with a set of real applications.
The architecture is deliberately extensible; the items below are the planned next
slices, each of which drops into the existing feature-sliced structure without
touching the core.

## Delivered

- ✅ Project foundation (Next.js 15 · React 19 · strict TS · Tailwind · feature-sliced)
- ✅ Design system + 8 themes + accent engine (CSS-variable driven)
- ✅ Window manager (drag · 8-way resize · snap · min/max/restore · z-index · keyboard)
- ✅ Dock with cursor magnification + running indicators
- ✅ Desktop (animated wallpaper · icons · selection box · context menu)
- ✅ Command palette (Fuse.js fuzzy search · keyboard nav)
- ✅ Notification center + toasts
- ✅ Persistence via Dexie/IndexedDB (virtual FS · notes · settings)
- ✅ Apps: Explorer · Terminal · Notes · Code editor · Calculator · Tic-Tac-Toe · System Monitor · Settings · About
- ✅ Local code execution (real JS/TS · Python/C/C++ interpreters) with a VS Code-style run panel
- ✅ Accessibility pass (reduced-motion honored in JS, focus trapping, skip link, keyboard menus)
- ✅ Responsive/touch layer (full-bleed windows + scrollable dock on small screens)
- ✅ Vitest unit suite (interpreters · game AI · calculator · geometry) + GitHub Actions CI

## Planned application slices

Each maps to a new folder under `src/features/<app>` plus an entry in
`features/apps/registry.tsx`.

| App | Scope | Notes |
| --- | --- | --- |
| **Browser** | Tabbed shell, bookmarks, history, fake internal sites via internal routing | Uses the History API pattern already established |
| **Whiteboard** | Infinite canvas, pan/zoom, sticky notes, shapes, connectors | `<canvas>` + pointer transforms; persists to a new Dexie table |
| **Editor → Monaco** | Swap the lightweight editor for Monaco with minimap + themes | `@monaco-editor/react`, loaded via `next/dynamic` (kept out of the initial bundle) |
| **Widgets** | Clock, calendar, calculator, weather placeholder | Desktop widget layer above the wallpaper |
| **AI Assistant** | Chat UI with streamed/typing animation, conversation history | UI-only, structured for a future streaming backend |

## Planned platform work

- **Browser APIs**: BroadcastChannel (multi-tab sync), File System Access API
  (import/export the virtual FS), Web Workers (offload search/telemetry),
  Service Worker + manifest (installable PWA / offline), Fullscreen, Clipboard.
- **Virtualization**: TanStack Virtual for large Explorer/Notes lists.
- **Testing**: Vitest unit tests (stores, geometry, terminal engine) + Playwright
  E2E for the open→drag→snap→close and command-palette flows.
- **Persistence of layout**: snapshot open windows to `kv` and restore on boot.
- **Theme editor**: live token editing UI writing custom themes to IndexedDB.

## Extension points

- **Add an app** → create `features/<app>/<App>.tsx` (default export taking
  `AppComponentProps`) and register it in the app registry. It automatically gains
  a dock icon, command-palette entry, and window lifecycle.
- **Add a theme** → append a `[data-theme='…']` block in `styles/themes.css` and an
  id in `settings/store.ts`. It appears everywhere themes are listed.
- **Add a terminal command** → extend the `switch` in `terminal/engine.ts`.
