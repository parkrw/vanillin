# task20: scroll-area

**Goal:** Overlay scrollbars with a JS-synced thumb over a native scroller.
**Branch:** feat/scroll-area (stacked on feat/input-otp — shared registry.js)
**Deps:** none

## Design decisions

- **Live anatomy verified 2026-07-25:** upstream's scroll-area is **Base UI**
  (`ScrollArea.Root/Viewport/Scrollbar/Thumb/Corner`) and exports exactly
  two components: `ScrollArea` (root + viewport + a default vertical
  `ScrollBar` + corner) and `ScrollBar` (`orientation`, default
  `"vertical"`). Horizontal usage passes `<ScrollBar orientation="horizontal" />`
  as a **child of ScrollArea**, i.e. inside the viewport.
- **Native scroller, hidden native bars:** the viewport is a plain
  `overflow: auto` div with `scrollbar-width: none`; our scrollbars are
  `position: absolute` in the root and overlay the content (no layout
  shift). `role="presentation"` on root/viewport/content like Base UI;
  viewport `tabIndex` flips 0/-1 with overflow so keyboard scrolling works
  only when there is something to scroll.
- **Per-frame work is imperative:** thumb size lands on the scrollbar as
  `--scroll-area-thumb-height`/`-width` and the offset as a `translate3d`
  on the thumb, so scrolling never re-renders React. State is only the
  booleans that gate rendering/attributes (overflow per axis, scrolling per
  axis, hovering).
- **Children are wrapped in an internal content div** (Base UI's Content
  part) so one ResizeObserver on it catches content growth; `min-inline-size:
  fit-content` keeps horizontal content measurable. A `ScrollBar` passed as a
  child therefore lands inside the content div — it stays put anyway because
  it is absolutely positioned against the root, which is outside the
  scroller.
- **Base UI parity kept:** `SCROLL_TIMEOUT` 500ms before `data-scrolling`
  drops, `MIN_THUMB_SIZE` 16, thumb drag via pointer capture, track click
  jumps (thumb centred on the pointer), wheel over a scrollbar scrolls the
  viewport (a native non-passive listener — React's `onWheel` is passive),
  `keepMounted`, corner sized from the two bars into
  `--scroll-area-corner-width/height`.
- **RTL:** vertical bar sits at `inset-inline-end`; horizontal thumb offset
  is negated (flex start is the right edge) and Chrome's negative rtl
  `scrollLeft` is normalized for the progress math. Drag needs no rtl branch
  — pointer delta and negative `scrollLeft` move together.
- **Deviations:** no `overflowEdgeThreshold` / `data-overflow-*-start|end`
  (edge-fade hooks — attachment/message-scroller do fades their own way), no
  overscroll thumb squish, no thumb-margin compensation (padding only), no
  scroll-snap suspension during drag (nothing in the kit snaps inside a
  scroll area yet).

## Sub-tasks

- [x] 1. scroll-area — test: bar mounts only on overflow (+ `keepMounted`),
  thumb size tracks the viewport/content ratio, scrolling moves the thumb and
  parks it at the track end, `data-scrolling` appears then clears,
  `data-hovering` on pointer over the root, thumb drag scrolls, track click
  jumps, wheel over the bar scrolls, horizontal bar passed as a child does
  not scroll with the content, corner vars set when both axes overflow, rtl
  thumb starts at the inline end, viewport `tabIndex` follows overflow;
  files: `ui/scroll-area/scroll-area.jsx` + `.css`,
  `tests/scroll-area.test.mjs`, `playground/pages/scroll-area.jsx`,
  `playground/registry.js`.

## Verify / done

- `node tests/run.mjs` green; `npm run build` clean.
- Manual :5173 `#scroll-area` light/dark: bars overlay without shifting
  content, thumb never smaller than 16px, corner square when both axes
  scroll, rtl demo's vertical bar on the left.
