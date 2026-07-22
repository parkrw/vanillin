# HANDOFF

## What landed (this session, 2026-07-22)
Plan: `~/.claude/plans/vanillin-zero-dep-shadcn-ui-recreation.md`.

- **Progress + slider** (`7cafa23a`) on branch `feat/progress-slider`, merged locally earlier.
- **Playwright smoke tests moved into repo** (`2fff9a1e`): `tests/run.mjs` runner + `tests/progress.test.mjs`, `tests/slider.test.mjs` (playwright-core, `channel: "chrome"`, no browser download).
- **README expansion** (`59ac40ab`) on `docs/readme` — usage conventions, repo layout, test guide. Merged as **PR #1** (`26beb694` on main).

## Repo state
- Switch to `main` (has PR #1 merge commit; `docs/readme` is behind it and can be deleted). Working tree clean, no stash. Remote now exists: `github.com/parkrw/vanillin`.
- **Git gates (hooks):** commits on main blocked — `<type>/<kebab-name>` branch first; PR-size cap 500 net lines vs main.

## Conventions (must match for new components)
- `ui/<slug>/<slug>.jsx` + `.css`; block class = component name, variants `block--modifier` (default variant on base class), subparts `.block-part`.
- Tokens only (`var(--…)` from globals.css), opacity via `color-mix(in oklab, …)`, no hex. No `--shadow-xs` token — use `--shadow-sm`.
- `cn()` from `lib/cn.js`; `as` prop instead of Radix asChild; shadcn's exact subcomponent export names.
- Stateful pattern (see `ui/toggle/`, `ui/tabs/`): `useControllableState` + `data-state` attrs; compound components share a `createContext` defined in the component file.
- Disclosure pattern (see `ui/accordion/`): `usePresence` + measured-height keyframes for exit animation.
- Tests: one `tests/<slug>.test.mjs` per interactive component, run via `node tests/run.mjs` (needs `npm run dev` on :5173) — see README test guide.
- Demo page per component: `playground/pages/<slug>.jsx` (default export, imports its css, pg-section/pg-row layout), then set `page: lazy(...)` in `playground/registry.js`.

## Gotchas / decisions
- Component inventory verified against live docs 2026-07-22: 64 items incl. chat set; **chart excluded**. Toast and Sonner are one component (`toast` slug). 31 done in `ui/`.
- Positioning: always-JS (`lib/use-anchor-position.js`) — intentional deviation from CSS-anchor-first.
- Playground styles must use child combinators (`.pg-section > h3`) — descendant selectors leak into demo markup.
- Roving tabindex (0/-1) is for tabs/radio/toolbars only; accordion triggers all keep tabIndex 0.
- Visual QA: `npm run dev`, then headless Chrome one-shot screenshots (`--headless=new --virtual-time-budget=6000 --screenshot=out.png "http://localhost:5173/#<slug>"`).

## Next step — use /cycle from here on
No `TODO/` exists yet. Run `/cycle` and let it seed the TODO/ index from the plan file above, then continue the rolling loop:
1. Phase 2 remainder, one small branch per batch (≤500 lines): pagination, toggle-group (roving focus), field, direction, chat set (attachment, bubble, message, message-scroller). Start with pagination + toggle-group.
2. Then phases 3–7 (#4–#8 in the plan).
3. Dark mode visual pass still pending for everything.
