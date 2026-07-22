# HANDOFF

## What landed (this session)
Phases 0–1 of the vanillin plan (`~/.claude/plans/i-want-to-recreate-binary-toast.md`): zero-dep shadcn/ui recreation, vanilla React JSX + plain CSS, copy-paste distribution.

- **Foundation:** `styles/globals.css` (all shadcn tokens, `.dark` block), `vite.config.js`, `package.json` (devDeps only), Vite playground (`playground/` — hash router, nav from `playground/registry.js`, dark toggle).
- **Primitives (`lib/`, 13 modules):** cn, compose-refs, portal, use-controllable-state, use-dismissable-layer, use-return-focus, use-focus-trap, scroll-lock, use-roving-focus, anchor-position + use-anchor-position (JS positioning w/ flip+clamp; CSS anchor positioning deliberately not used — single tested path), use-presence, use-swipe, direction.
- **Phase 1 components (22, in `ui/<slug>/`):** button (the style exemplar), badge, kbd, spinner, separator, skeleton, label, input, textarea, native-select, card, alert, avatar, aspect-ratio, breadcrumb, table, button-group, input-group, item, empty, marker, typography (css-only). Each has a demo page in `playground/pages/` wired into `registry.js`.

## Repo state
- Branch: `main`, everything **uncommitted** (README.md modified; all new dirs untracked). No stash, no PR.
- `npm run build` passes clean; `npm run dev` serves the playground.

## Conventions (must match for new components)
- `ui/<slug>/<slug>.jsx` + `.css`; block class = component name, variants `block--modifier` (default variant on base class), subparts `.block-part`.
- Tokens only (`var(--…)` from globals.css), opacity via `color-mix(in oklab, …)`, no hex.
- `cn()` from `lib/cn.js`; `as` prop instead of Radix asChild; shadcn's exact subcomponent export names.
- Demo page per component: `playground/pages/<slug>.jsx` (default export, imports its css, pg-section/pg-row layout), then add `page: lazy(...)` to `playground/registry.js`.

## Gotchas / decisions
- Component inventory verified against live docs 2026-07-22: 64 items incl. new chat set (attachment, bubble, message, message-scroller, marker, direction); **chart excluded** by scope.
- Toast and Sonner are one component here (`toast` registry slug).
- Agent-built Phase 1 code compiles but has had **no visual review** — eyeball each page in the playground against ui.shadcn.com before building on top.
- Positioning: always-JS (`lib/use-anchor-position.js`), plan originally said CSS-anchor-first — intentional deviation, revisit only if needed.

## Next step
Phase 2 (task #3): light-state components — start with `toggle`, `switch`, `checkbox` (simple boolean state via `lib/use-controllable-state.js`), then radio-group + tabs (first consumers of `lib/use-roving-focus.js`). Full list in plan file / task list (#3–#8 pending).
