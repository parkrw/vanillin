# HANDOFF

## What landed (this session, 2026-07-22)
Plan: `~/.claude/plans/vanillin-zero-dep-shadcn-ui-recreation.md`.

- **Committed prior session's work** on new branch `feat/phase-2-stateful` (a hook now blocks commits on main): `025d0431` phase-1 visual fixes, `d2a86def` toggle/switch/checkbox/radio-group/tabs.
- **Accordion + collapsible** (`9e199a51`): disclosure pattern. AccordionContent uses `lib/use-presence.js` + open/close keyframes against a measured `--accordion-content-height` (set via `useLayoutEffect` on scrollHeight; `scrollHeight` is stable while height animates). shadcn structure mirrored: h3 header wrapper, chevron appended in trigger, user className lands on `.accordion-content-inner` (shadcn's inner padded div). Arrow/Home/End move focus between triggers **without** roving tabindex (all triggers stay tabbable, per Radix) — `useRovingFocus` was wrong for this, hand-rolled keydown on the root. Collapsible unstyled (css file is a comment only, like shadcn); trigger supports `as` (demo: `as={Button}`). `prefers-reduced-motion` disables accordion animation → usePresence unmounts immediately.
- **Smoke test: 21/21 pass** (playwright-core in scratchpad, not repo): single/multiple/collapsible semantics, unmount-on-close, keyboard nav, tabbability, aria-controls/labelledby wiring, disabled item. Light-mode screenshots eyeballed — match shadcn.

## Repo state
- Branch `feat/phase-2-stateful`, 3 commits ahead of main, working tree clean, build green.
- **PR-size gate: branch is ~1335 net lines vs main, cap is 500 — `gh pr create` is BLOCKED.** Commits are atomic so splitting into per-commit branches is easy, but the 5-component commit alone is ~835 lines. User must choose: bypass (needs their explicit direction), merge locally without PR, or split further. **Do not stack more components on this branch until decided.**

## Conventions (must match for new components)
- `ui/<slug>/<slug>.jsx` + `.css`; block class = component name, variants `block--modifier` (default variant on base class), subparts `.block-part`.
- Tokens only (`var(--…)` from globals.css), opacity via `color-mix(in oklab, …)`, no hex. No `--shadow-xs` token — use `--shadow-sm`.
- `cn()` from `lib/cn.js`; `as` prop instead of Radix asChild; shadcn's exact subcomponent export names.
- Stateful pattern (see `ui/toggle/`, `ui/tabs/`): `useControllableState` + `data-state` attrs; compound components share a `createContext` defined in the component file.
- Disclosure pattern (see `ui/accordion/`): `usePresence` + measured-height keyframes for exit animation.
- Demo page per component: `playground/pages/<slug>.jsx` (default export, imports its css, pg-section/pg-row layout), then set `page: lazy(...)` in `playground/registry.js`.

## Gotchas / decisions
- Component inventory verified against live docs 2026-07-22: 64 items incl. chat set (attachment, bubble, message, message-scroller, marker, direction); **chart excluded**. Toast and Sonner are one component (`toast` slug).
- Positioning: always-JS (`lib/use-anchor-position.js`) — intentional deviation from CSS-anchor-first.
- Playground styles must use child combinators (`.pg-section > h3`) — descendant selectors leak into demo markup.
- Roving tabindex (0/-1) is for tabs/radio/toolbars only; accordion triggers all keep tabIndex 0.
- Visual QA loop that works: `npm run dev`, then headless Chrome one-shots — `"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --hide-scrollbars --window-size=1400,1200 --virtual-time-budget=6000 --screenshot=out.png "http://localhost:5173/#<slug>"`. For interactions: playwright-core npm package + `chromium.launch({ channel: "chrome" })` (no browser download).

## Next step
1. **Resolve the PR-size/branch strategy with the user** (see Repo state).
2. Phase 2 remainder: progress, slider, pagination, toggle-group (roving focus), field, direction, chat set (attachment, bubble, message, message-scroller). Then phases 3–7.
3. Dark mode visual pass still pending for everything.
