# HANDOFF

## What landed (session of 2026-07-22, motion/dark-mode session)
Three stacked branches, **unmerged** — user fast-forwards main themselves:
`feat/motion-tokens` → `feat/collapsible-motion` → `fix/accordion-close-flash` (tip).
- **Motion tokens** (`90512cee`): `--motion-scale` (duration multiplier) + `--motion-ease` + derived `--motion-fast`/`--motion-medium` in globals.css; all component transitions/animations swept onto them (spinner/skeleton loops excluded). README documents the knobs. Playground preset: scale 2.5, `cubic-bezier(0.22, 1, 0.36, 1)`.
- **Dark-mode native controls** (same commit): `color-scheme: light/dark` on `:root`/`.dark` — fixes unreadable UA-styled buttons (primitives page) plus selects/scrollbars.
- **Collapsible open/close animation** (`86aaf4d7`): measured-height keyframes like accordion; `--collapsible-content-height` set in CollapsibleContent.
- **Close-flash fix** (`5192d23f`): `animation-fill-mode: forwards` on closed state (accordion + collapsible) — content flashed at natural height between animationend and unmount.
- TODO: added 28 docs-shell + 29 docs-content (playground → docs app, after 27).

Merge: `git switch main && git merge --ff-only fix/accordion-close-flash && git branch -d fix/accordion-close-flash feat/collapsible-motion feat/motion-tokens`

## Next step
`/cycle 03` — field-direction (~M): detail `docs/TODO/task03-field-direction.md` (doesn't exist yet), then TDD. Plan + index: `docs/TODO/README.md`.

**Docs layout (2026-07-22):** HANDOFF.md and TODO/ now live under `docs/` — tell /cycle and /handoff explicitly, since they default to repo-root `TODO/` and `HANDOFF.md`.

## Session preferences (user-stated)
- **Do not invoke any skills** (incl. /implementer). Exception: `handoff` at ~15% context, then prompt user to start a new session.

## Conventions (must match)
- `ui/<slug>/<slug>.jsx` + `.css`; block class = component name, variants `block--modifier`, subparts `.block-part`. Tokens only (`var(--…)` from globals.css), `color-mix(in oklab, …)` for opacity, no hex. No `--shadow-xs` — use `--shadow-sm`.
- **Motion: never hard-code durations/easings** — `var(--motion-fast)`/`var(--motion-medium)` + `var(--motion-ease)`. All future open/close components (dialog, menus, popover, toast…) animate via these; reduced-motion guard on keyframe animations. Indeterminate loops stay fixed.
- `cn()` from `lib/cn.js`; `as` prop instead of asChild; shadcn's exact export names.
- Stateful: `useControllableState` + `data-state` (see `ui/toggle/`, `ui/tabs/`). Disclosure: `usePresence` + measured-height keyframes + `fill-mode: forwards` on close (see `ui/accordion/`, `ui/collapsible/`).
- Tests: `tests/<slug>.test.mjs` per interactive component; `node tests/run.mjs` self-hosts vite on :5199. Playwright-core, `channel: "chrome"`.
- Demo page `playground/pages/<slug>.jsx` + `page: lazy(...)` entry in `playground/registry.js`; page imports its component CSS.

## Gotchas
- **User's macOS has Reduce Motion ON** — keyframe open/close animations are disabled by the `prefers-reduced-motion` guard in their browser; transitions still run. For motion QA, emulate `no-preference` in DevTools or Playwright (Playwright default already does). Don't "fix" missing animation reports without checking this first.
- Playground styles: child combinators only (`.pg-section > h3`) — descendant selectors leak into demos. `--pg-accent` + motion preset live in playground.css, not globals.css.
- Roving tabindex only for tabs/radio/toolbars; positioning is always-JS (`lib/use-anchor-position.js`).
- Visual QA: `npm run dev` (:5173) + playwright-core one-shot script (import via absolute path to repo node_modules); dark mode = click `.pg-theme-toggle` first. Hash routes are `#<slug>` (no slash).
- Git gates (hooks): no commits on main; merges/rebases never auto-run — user runs them. Hook evaluates the whole command line — don't chain `git switch -c` with `git commit` while on main.
- Dark-mode component QA is still task 27 — only `color-scheme` was fixed this session.
