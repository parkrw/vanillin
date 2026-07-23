# task13: context-menu

**Goal:** ContextMenu opening at pointer coordinates on right-click (+ touch long-press), reusing the task-12 menu wholesale via re-exports.
**Branch:** feat/context-menu  **Deps:** 12

## Design decisions

- **Live anatomy verified 2026-07-23 (Base UI variant):** ContextMenu,
  ContextMenuTrigger, ContextMenuContent, ContextMenuGroup, ContextMenuLabel,
  ContextMenuItem, ContextMenuSeparator, ContextMenuCheckboxItem,
  ContextMenuRadioGroup, ContextMenuRadioItem, ContextMenuSub,
  ContextMenuSubTrigger, ContextMenuSubContent, ContextMenuShortcut — exact
  1:1 with dropdown-menu parts.
- **Reuse = alert-dialog precedent:** ContextMenu root renders `DropdownMenu`
  internally (so DropdownMenuContext feeds every part) plus its own context
  carrying the pointer-coord anchor. Item/CheckboxItem/RadioGroup/RadioItem/
  Sub/SubTrigger/SubContent/Group/Label/Separator/Shortcut are direct
  re-exports of the DropdownMenu parts. `context-menu.css` `@import`s
  dropdown-menu.css; ContextMenuContent adds the `context-menu` class on top
  of `dropdown-menu` (compound classes).
- **Pointer-coord anchor (the one new mechanism):** trigger stores a virtual
  anchor `{ getBoundingClientRect: () => DOMRect(x, y, 0, 0) }` in a ref at
  `contextmenu` time. `DropdownMenuContent` grows an optional `anchorRef`
  prop (falls back to `triggerRef`); `useAnchorPosition` gets an
  `anchor instanceof Element` guard around `ResizeObserver.observe(anchor)`
  (`positionAnchored` itself only calls `getBoundingClientRect()`).
  Radix placement kept: `side="right" align="start" sideOffset={2}` — flip
  near viewport edges comes free from `positionAnchored`.
- **Trigger:** renders a `<span>` area (`as` prop honored) with `data-state`
  only — no aria-haspopup/expanded (it's a surface, not a button; Radix
  stance). `onContextMenu`: `preventDefault()`, record coords, open.
  `disabled` prop lets the native menu through untouched.
- **Chrome contextmenu vs popovers (found in sub-task 1):** Chrome hides all
  auto popovers while processing a `contextmenu` event even when it's
  prevented — so (a) open in a `setTimeout(0)`, never synchronously; (b) the
  cursor must land 2px INSIDE the menu corner (`sideOffset/alignOffset -2`,
  Windows-style) or the gesture-ending pointerup light-dismisses it; (c) on
  right-click-while-open, state never leaves "open" (the native hide's toggle
  is queued) — the timer re-shows the hidden popover directly, and the
  hide+show toggles coalesce to open→open which the state sync ignores.
  Also fixed: `useControllableState` now syncs its ref on uncontrolled
  writes so two setter calls in one task see each other.
- **Touch long-press:** pointerdown (`touch`/`pen`) starts a 700ms timer that
  opens at the press point; pointermove/pointerup/pointercancel/pointerleave
  clears it (Radix behavior).
- **Focus:** DropdownMenuContent's focus-first-item on open is kept.
  Close-time `triggerRef.current?.focus()` is a no-op on the non-focusable
  trigger span — focus falls to body, matching Radix context-menu.
- **Non-goals:** keyboard invocation (Shift+F10/Menu key — trigger isn't
  focusable), text-selection suppression during long-press, typeahead,
  modality. Root direction context already flips submenus (task 12).

## Sub-tasks

- [x] 1. core context menu — test: right-click on trigger area opens
  `role="menu"` at ~pointer coords (right of + below the point); default
  contextmenu suppressed on the area but native menu allowed when `disabled`;
  right-click at a second spot repositions; arrow nav + Enter select (readout
  updates, menu closes); Esc and outside click close; near right viewport
  edge the menu flips left of the pointer; files: `lib/use-anchor-position.js`
  (Element guard), `ui/dropdown-menu/dropdown-menu.jsx` (`anchorRef` prop),
  `ui/context-menu/context-menu.jsx` + `.css`, `tests/context-menu.test.mjs`,
  `playground/pages/context-menu.jsx`, `playground/registry.js`.
- [x] 2. long-press + re-export coverage — test: synthetic touch pointerdown
  held 700ms opens at press point, early pointerup/move cancels; checkbox item
  toggles `aria-checked` and persists on reopen; submenu opens via ArrowRight
  and safe-triangle hover path still works inside a context menu (proves the
  context wiring end-to-end); files: `ui/context-menu/context-menu.jsx`,
  test + demo page.

## Verify / done

- `node tests/run.mjs` green (incl. dropdown-menu suite — no regression from
  the `anchorRef`/guard edits); `npm run build` clean.
- Manual :5173 `#context-menu` light/dark: right-click open feels native,
  edge flip works, submenu grace OK, RTL demo mirrors submenu.
