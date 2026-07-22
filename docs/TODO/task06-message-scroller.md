# task06: message-scroller
**Goal:** Add shadcn chat set part 3 — `ui/message-scroller/` stateful stick-to-bottom transcript scroller with hooks, demo page, and test.
**Branch:** `feat/message-scroller`  **Deps:** 04 (done)

Anatomy re-verified against live shadcn docs 2026-07-22:
`MessageScrollerProvider` (headless root; props `autoScroll`,
`defaultScrollPosition: "start" | "end" | "last-anchor"`,
`scrollPreviousItemPeek`), `MessageScroller` (styled frame),
`MessageScrollerViewport` (scrollable; `preserveScrollOnPrepend` default true),
`MessageScrollerContent`, `MessageScrollerItem` (`messageId` required,
`scrollAnchor`), `MessageScrollerButton` (inert until content in its direction;
`data-active="false"` when inactive). Hooks: `useMessageScroller()` →
`{ scrollToMessage, scrollToEnd, scrollToStart }`;
`useMessageScrollerVisibility()` → `{ currentAnchorId, visibleMessageIds }`;
`useMessageScrollerScrollable()` → `{ start, end }`.

Behavior: follow output while at live edge; release on user intent (wheel,
touch/pointer drag, keyboard scroll keys, scrollbar drag, `scrollToMessage`);
re-engage via `scrollToEnd()` / Button press when `autoScroll`.

## Sub-tasks
- [x] 1. Core stick-to-bottom: Provider (context: viewport ref, at-end state,
  follow flag) + frame + Viewport + Content + Item; ResizeObserver/
  MutationObserver-driven follow on appended content; release on user intent;
  `preserveScrollOnPrepend`; `data-state="following|released"` on frame;
  minimal demo page (append-message button, tall transcript) + registry
  `page:` entry — test: appending while at end keeps view pinned to bottom;
  after user scrolls up, appending does NOT move scroll; prepend preserves
  visual position. files: `ui/message-scroller/message-scroller.jsx`,
  `ui/message-scroller/message-scroller.css`,
  `playground/pages/message-scroller.jsx`, `playground/registry.js`,
  `tests/message-scroller.test.mjs`
- [ ] 2. Button + hooks: MessageScrollerButton (`data-active` flips when
  scrolled away from its direction; click = `scrollToEnd` + re-engage follow),
  `useMessageScroller`, `useMessageScrollerVisibility` (IntersectionObserver),
  `useMessageScrollerScrollable`; demo wires button + visibility readout —
  test: button `data-active="false"` at bottom, `"true"` after scroll-up;
  click returns to bottom and re-engages follow; visibility hook reports
  on-screen messageIds. files: same jsx/css/page/test

## Verify / done
- `node tests/run.mjs` green incl. new `tests/message-scroller.test.mjs`.
- `npm run build` clean.
- Playground `#message-scroller` works in light + dark; motion via
  `--motion-*` tokens only (smooth-scroll behavior exempt: native
  `scroll-behavior`); logical properties.
- Net diff vs main ≤ 500 lines (watch: 6 exports + 3 hooks — keep demo lean).
