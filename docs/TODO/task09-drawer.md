# task09: drawer

**Goal:** Drawer as a dialog-recipe reuse with swipe-to-dismiss — the touch-first sheet.
**Branch:** feat/drawer (stacked on feat/alert-dialog-sheet — shares registry.js/dialog.jsx edits and the message-scroller test fix)  **Deps:** 07

## Design decisions

- **Live anatomy verified 2026-07-22:** shadcn drawer now uses Base UI, not
  vaul. Exports: Drawer, DrawerTrigger, DrawerPortal, DrawerOverlay,
  DrawerContent, DrawerHeader, DrawerFooter, DrawerTitle, DrawerDescription,
  DrawerClose, DrawerSwipeHandle. `swipeDirection` (up|right|down|left,
  default down = bottom drawer) lives on the Drawer root; `showSwipeHandle`
  (default true) renders the handle bar in DrawerContent. shadcn's `render`
  prop → our `as`.
- **Non-goals (~M):** snap points, nested drawers, `modal="trap-focus"`,
  background bleed/scaling.
- **Reuse:** DrawerContent renders DialogContent with compound class
  `dialog drawer drawer--<direction>`; drawer.css `@import`s dialog.css
  (sheet precedent). Direction flows through a DrawerContext from the root.
- **dialog.jsx grows a `useDialog()` hook** (exports the open/setOpen
  context): swipe-dismiss must route through state so the exit animation
  plays. Also: DrawerContent's own `onPointerDown` replaces DialogContent's
  backdrop-click handler (declared before the props spread), so drawer
  re-implements the outside-coordinate check itself.
- **Swipe:** pointerdown on the drawer (ignored when starting on
  interactive elements), setPointerCapture, inline translate along the
  swipe axis only (clamped so it can't drag away from its edge),
  `data-swiping` while dragging. Release: close when offset > 25% of the
  drawer's axis size or flick velocity is high; otherwise transition back.
  Exit keyframes have no `from`, so the close animation picks up from the
  dragged position for free.
- **Look:** bottom drawer full-width, rounded corners + handle on the free
  edge, explicit width/height per edge (UA fit-content gotcha from 08).
  Slide keyframes on the motion tokens with the reduced-motion guard.

## Sub-tasks

- [x] 1. drawer core — test: opens from bottom by default (`drawer--down`,
  flush bottom, `:modal`), direction variants anchor to their edges, handle
  visible by default, aria title/description wired, X/backdrop/Esc close;
  files: `ui/drawer/drawer.jsx` + `.css`, `ui/dialog/dialog.jsx`
  (`useDialog`), `tests/drawer.test.mjs`, `playground/pages/drawer.jsx`,
  `playground/registry.js`.
- [ ] 2. swipe-to-dismiss — test: mouse-drag past 25% closes, short drag
  springs back (stays open, transform cleared), drag sets `data-swiping`,
  drag on a button does not start a swipe; files: `ui/drawer/drawer.jsx`,
  `ui/drawer/drawer.css`, `tests/drawer.test.mjs`.

## Verify / done

- `node tests/run.mjs` green; `npm run build` clean.
- Manual :5173 `#drawer` light/dark: slides from each edge, handle drag
  follows the pointer, flick dismisses (emulate
  `prefers-reduced-motion: no-preference`).
