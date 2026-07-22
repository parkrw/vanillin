# task07: dialog

**Goal:** Native-`<dialog>` modal with shadcn's exact API — the pattern-setter for all overlays (08 alert-dialog-sheet, 09 drawer).
**Branch:** feat/dialog  **Deps:** none

## Design decisions

- **Native `<dialog>` + `showModal()`** — top layer (no `Portal` needed), native
  focus containment (no `useFocusTrap`), background inert for free.
- **Esc:** native `cancel` event — `preventDefault()` and route through
  `onOpenChange` so the exit animation plays before `close()`.
- **Presence:** `usePresence` + `data-state="open|closed"`; element stays
  mounted (and `open`) through the exit animation; `dialog.close()` fires at
  unmount. `close` event kept in sync (e.g. form `method="dialog"`).
- **Outside dismiss:** pointerdown where `event.target === dialogEl` is a
  backdrop click (content fills the interior) — not `useDismissableLayer`.
- **Overlay = `::backdrop`.** A sibling div can't layer over the top layer.
  `DialogOverlay` and `DialogPortal` exist for API compat: Portal renders
  children as-is, Overlay renders null; overlay styling lives on
  `.dialog::backdrop`.
- **Scroll lock:** `useScrollLock` (native dialog doesn't lock body scroll).
  **Focus return:** `useReturnFocus` (deterministic despite delayed `close()`).
- **Exports (shadcn):** Dialog, DialogTrigger, DialogPortal, DialogOverlay,
  DialogContent (with `showCloseButton` default true), DialogHeader,
  DialogFooter, DialogTitle, DialogDescription, DialogClose.

## Sub-tasks

- [x] 1. Core open/close — test: trigger click opens (`data-state="open"`,
  `:modal` matches), Esc + backdrop click close through the exit animation,
  body scroll locked while open, focus returns to trigger on close; files:
  `ui/dialog/dialog.jsx`, `ui/dialog/dialog.css` (skeleton),
  `tests/dialog.test.mjs`, `playground/pages/dialog.jsx`,
  `playground/registry.js` (add `page:`).
- [ ] 2. Anatomy + aria — test: `aria-labelledby` → DialogTitle id,
  `aria-describedby` → DialogDescription id, X button closes, DialogClose
  closes, controlled mode (`open`/`onOpenChange`) works; files:
  `ui/dialog/dialog.jsx`, `tests/dialog.test.mjs`, demo page (controlled +
  form examples).
- [ ] 3. Motion + visual polish — zoom/fade keyframes on content and
  `::backdrop` via `--motion-fast`/`--motion-ease`, `fill-mode: forwards` on
  close, reduced-motion guard; visual QA light + dark; files:
  `ui/dialog/dialog.css`.

## Verify / done

- `node tests/run.mjs` green (all suites).
- `npm run build` clean.
- Manual: :5173 `#dialog` — open/close animates (DevTools: emulate
  `prefers-reduced-motion: no-preference`), backdrop dims in dark mode, Tab
  cycles inside dialog only, Esc/backdrop/X all close, focus lands back on
  trigger.
