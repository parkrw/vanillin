# task18: command

**Goal:** Command — command palette: search input + filtered listbox, plus
CommandDialog (dialog recipe). Combobox-17 highlight mechanics without a
persisted value or a popup.
**Branch:** feat/command (stacked on feat/combobox — shared registry.js)
**Deps:** 17

## Design decisions

- **Live anatomy verified 2026-07-25:** shadcn's command is still **cmdk**
  (not Base UI): Command, CommandDialog, CommandInput, CommandList,
  CommandEmpty, CommandGroup, CommandItem, CommandSeparator,
  CommandShortcut. cmdk props: root `value`/`onValueChange` (the
  **highlighted** item, not a selection), `filter(value, search, keywords)`,
  `shouldFilter`, `loop`, `label`, `vimBindings`, `disablePointerSelection`;
  item `value`/`keywords`/`onSelect`/`disabled`/`forceMount`; group
  `heading`/`forceMount`; separator `alwaysRender`; input
  `value`/`onValueChange`. cmdk's `Command.Loading` is not a shadcn export —
  skipped.
- **Value is the highlight, not a selection** (delta vs combobox-17): no
  check indicator, `aria-selected` marks the highlighted option, activation
  fires the item's `onSelect(value)` and nothing persists. Root `value` is
  the item value (cmdk), not a DOM id — items derive `data-selected` from it,
  and the input's `aria-activedescendant` maps value → per-item `useId`.
- **Always inline, never anchored:** no popover, no trigger, no
  `useAnchorPosition`. The palette form is CommandDialog = ui/dialog
  (`showModal()` recipe, task-07) wrapping a Command; `command.css`
  `@import`s dialog.css so pages stay single-import (task-08 precedent).
  CommandDialog defaults: `showCloseButton={false}`, sr-only
  title/description (shadcn parity).
- **Filtering (documented deviation):** cmdk's default filter is a fuzzy
  `command-score` that also **re-sorts** items and groups by score. Ours is
  case-insensitive substring over value + keywords + text content, DOM order
  preserved — no score, no reordering. Custom `filter` gets cmdk's
  `(value, search, keywords)` signature and any return > 0 counts as a
  match. `shouldFilter={false}` leaves everything visible (async/server
  filtering).
- **Filtered items stay mounted and toggle `hidden`** (combobox-17): keeps
  registration and DOM-order nav intact. `[hidden] { display: none }` is
  restated in CSS — `display: flex` on the item defeats the UA rule
  (task-17 gotcha). Groups hide via `:has()`; `forceMount` items/groups opt
  out.
- **Auto-highlight is unconditional** (cmdk): the first visible item is
  highlighted on mount and after every search change; a highlight that
  filters out moves to the first match. Empty result set clears it.
- **CommandEmpty renders whenever nothing is visible** (cmdk parity, unlike
  combobox's `query !== ""` rule). Count runs in a layout effect so the
  first paint never flashes the empty state.
- **Keyboard (input):** ArrowDown/Up walk visible enabled options (`loop`
  off by default = clamp at the ends), Home/End jump, Enter activates,
  vim bindings (`vimBindings`, default true) map Ctrl+N/J and Ctrl+P/K.
  Highlight moves `scrollIntoView({ block: "nearest" })`. Esc is the
  dialog's (native `cancel`), not the root's.
- **Pointer:** pointermove highlights, click activates;
  `disablePointerSelection` suppresses the hover highlight (cmdk).
- **CommandSeparator** renders only when the search is empty unless
  `alwaysRender` (cmdk).

## Sub-tasks

- [x] 1. command — test: wiring (roles/aria-activedescendant), search
  filters + empty state + group auto-hide, first-match auto-highlight,
  arrows/Home/End/loop, Enter + click fire onSelect, disabled item skipped,
  keywords match, shouldFilter={false}, separator hides while searching,
  CommandDialog opens/closes (Esc) and traps focus in the input; files:
  `ui/command/command.jsx` + `.css`, `tests/command.test.mjs`,
  `playground/pages/command.jsx`, `playground/registry.js`.

## Verify / done

- `node tests/run.mjs` green; `npm run build` clean.
- Manual :5173 `#command` light/dark: inline palette, dialog palette
  (⌘K), highlight contrast, empty state, group headings, shortcuts.
