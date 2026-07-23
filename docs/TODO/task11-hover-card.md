# task11: hover-card
**Goal:** HoverCard/HoverCardTrigger/HoverCardContent — rich link-preview popup on hover/focus, reusing the task-10 manual-popover recipe.  **Branch:** feat/hover-card  **Deps:** 10

Live shadcn anatomy (verified 2026-07-22): `HoverCard`, `HoverCardTrigger`,
`HoverCardContent` only — no Portal/Positioner/Arrow. Open/close delays;
content props side/align/sideOffset. Radix defaults: openDelay 700,
closeDelay 300, sideOffset 4, side bottom.

Design (deltas from ui/tooltip):
- Root owns shared open/close timers in context so Trigger *and* Content
  cancel each other's pending close — pointer may travel into the content
  (the closeDelay grace); tooltip's `pointer-events: none` does not apply.
- Trigger default `as="a"` (link preview); hover opens after openDelay,
  leave schedules close after closeDelay; focus opens instantly, blur
  closes; touch ignored. No role=tooltip / aria-describedby — hover-card is
  a sighted-users preview (Radix stance); keep `data-state` only.
- Content: `popover="manual"` (hover-managed — `auto` light dismiss would
  fight the hover logic), `useAnchorPosition`, showingRef sync effect,
  document-level Esc while open. CSS = popover surface look (popover bg,
  border, shadow-md, 16rem width) + tooltip's @starting-style/allow-discrete
  enter-exit transitions incl. `overlay`, `data-side` transform origins,
  motion tokens.

## Sub-tasks
- [x] 1. ui/hover-card + demo + test — test: tests/hover-card.test.mjs proves
  hover opens after delay / pointer-into-content keeps open (grace) /
  leaving both closes / focus-blur / touch ignored / Esc / controlled
  onOpenChange; files: ui/hover-card/hover-card.jsx, ui/hover-card/hover-card.css,
  playground/pages/hover-card.jsx, playground/registry.js,
  tests/hover-card.test.mjs

## Verify / done
- `node tests/run.mjs` green (hover-card + full suite).
- Demo at `#hover-card`: avatar + text preview card opens on link hover,
  survives pointer move into the card, exits with fade; works in `.dark`.
