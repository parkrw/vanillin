# HANDOFF

## What landed (session of 2026-07-22)
- **task02 pagination** (`71a3b464`) — merged to main by user. `ui/pagination/`, demo page, `tests/pagination.test.mjs`. TODO index marked `[x]`.
- **Playground dark-mode fix** on `fix/playground-dark-mode` (`eb264d5a`, `bd744837`) — **unmerged, unpushed**. Sidebar contrast (foreground vs muted for built/todo, no opacity hack), playground-scoped `--pg-accent` neon teal token (h1, active/hover nav pill, section-h3 left bars, toggle hover). No dots — minimal look. User merges locally themselves.

## Repo state
- On `fix/playground-dark-mode`; main has task02. Merge the fix branch to main before starting task 03.
- Git gates (hooks): no commits on main — `<type>/<kebab>` branch first; PR cap 500 net lines vs main.

## Next step
`/cycle 03` — field-direction (~M): detail `TODO/task03-field-direction.md` (doesn't exist yet), then TDD. Plan + index: `TODO/README.md`.

## Session preferences (user-stated)
- **Do not invoke any skills** (incl. /implementer — irrelevant to this repo). Exception: `handoff` at ~15% context, then prompt user to start a new session.

## Conventions (must match)
- `ui/<slug>/<slug>.jsx` + `.css`; block class = component name, variants `block--modifier`, subparts `.block-part`. Tokens only (`var(--…)` from globals.css), `color-mix(in oklab, …)` for opacity, no hex. No `--shadow-xs` — use `--shadow-sm`.
- `cn()` from `lib/cn.js`; `as` prop instead of asChild; shadcn's exact export names.
- Stateful: `useControllableState` + `data-state` (see `ui/toggle/`, `ui/tabs/`). Disclosure: `usePresence` + measured-height keyframes (see `ui/accordion/`, `ui/collapsible/`).
- Motion: never hard-code durations/easings — `var(--motion-fast)`/`var(--motion-medium)` + `var(--motion-ease)` (globals.css). Applies to all future open/close components (dialog, menus, popover, toast…). Indeterminate loops (spinner, skeleton) stay fixed.
- Tests: `tests/<slug>.test.mjs` per interactive component; `node tests/run.mjs` self-hosts vite on :5199 (no dev server needed). Playwright-core, `channel: "chrome"`.
- Demo page `playground/pages/<slug>.jsx` + `page: lazy(...)` entry in `playground/registry.js`.

## Gotchas
- Playground styles: child combinators only (`.pg-section > h3`) — descendant selectors leak into demos. Playground accent token `--pg-accent` lives in playground.css, not globals.css.
- Roving tabindex only for tabs/radio/toolbars; positioning is always-JS (`lib/use-anchor-position.js`).
- Visual QA: `npm run dev` (:5173) + headless Chrome one-shot screenshot; for dark mode use a playwright script that clicks `.pg-theme-toggle` first.
- Dark-mode component QA is still task 27 — only playground chrome was fixed this session.
