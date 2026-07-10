# Contributing to Nexus OS

Thanks for your interest. This document covers the conventions the codebase follows so a change
lands cleanly.

## Getting started

```bash
pnpm install
pnpm dev
```

Before opening a pull request, make sure the full check suite is green:

```bash
pnpm typecheck && pnpm lint && pnpm test && pnpm build
```

## Project conventions

- **Feature-sliced.** Each feature lives under `src/features/<name>` and owns its components,
  hooks, store, services and types. Features talk to each other only through public stores or the
  app registry — never by reaching into another feature's internals.
- **Strict TypeScript.** `any` is disallowed; `noUncheckedIndexedAccess` is on. Prefer precise types
  over casts.
- **Small components.** Files over ~200 lines are a smell — split them. Extract shared visuals into
  `src/components/ui` rather than duplicating Tailwind strings.
- **Motion tokens.** Pull spring/easing/duration values from `src/lib/motion.ts`. Don't inline
  bespoke transitions.
- **Design tokens.** Colours, radii, shadows and blur come from the CSS custom properties in
  `src/styles`. Add new tokens there instead of hard-coding values.

## Adding an application

1. Create `src/features/<app>/<App>.tsx` with a default export taking `AppComponentProps`.
2. Register it in `src/features/apps/registry.tsx` (icon, tint, default size, `dock` flag).

It automatically gains a dock icon, a command-palette entry and full window lifecycle.

## Adding a theme

Append a `[data-theme='…']` block in `src/styles/themes.css` and its id in
`src/features/settings/store.ts`. It appears everywhere themes are listed.

## Commit messages

This repo follows [Conventional Commits](https://www.conventionalcommits.org)
(`feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`, `ci:`). Keep commits focused and
self-contained.
