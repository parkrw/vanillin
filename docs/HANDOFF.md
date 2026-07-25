# HANDOFF

## What landed (session of 2026-07-25, fan-out session)
Tasks 22–27 + the combobox flake fix — **merged to main** (`287b696a`,
16 linear commits; suite 281/281 on the merged tree). Built by six
concurrent worktree agents (4 at a time); every branch passed convention
checks, coordinator suite reruns, and an independent review pass (findings
fixed on-branch before sign-off). A first merge attempt without rebasing
was reset and redone as one cherry-picked integration branch fast-forwarded
into main; the per-branch refs are deleted.

1. combobox Escape fix — Escape checks `:popover-open`
   as well as state, hides a stale-open popup itself, calls a shared
   `revertInput()` directly (transition-keyed revert raced queued native
   toggles). Fixes the suite's one recurring flake.
2. date-picker (~358 net) — composition pattern only (no DatePicker
   root): pattern CSS + demo + 6 tests.
3. toast (~1359 net, 5 commits) — sonner-shaped imperative API;
   queue/stacking/hover-pause/swipe; new `--success/--warning/--info` token
   families in globals.css (both modes). Review caught two timer bugs
   (pause banking; effect-order instant dismiss of resolved promise toasts).
4. carousel (~830 net) — scroll-snap + deferred-capture swipe (5px
   dead zone so slide-content clicks fire; `e.buttons===0` stale-drag guard).
5. resizable (~1145 net) — react-resizable-panels v4 anatomy
   (`data-separator`, opposite `aria-orientation`, 5% keyboard step).
6. data-table (~1100 net, 2 commits) — zero-dep `lib/use-data-table.js`
   over ui/table; ui/checkbox grew tri-state (`aria-checked=mixed`).
7. sidebar (~1786 net) — all 24 shadcn exports real; mobile = sheet;
   Cmd/Ctrl+B; `sidebar_state` cookie.

Details + per-task gotchas: Adjustments log in `docs/TODO/README.md`.

## Next step
`/cycle 28` — dark-mode-pass (~M): visual QA every component in `.dark`
(deps: all of the above merged). Then 29 docs-shell, 30 docs-content.

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
