# task12: dropdown-menu

**Goal:** DropdownMenu on the popover recipe (task 10) with menu roles, keyboard nav, checkbox/radio items, and hover submenus with a safe-triangle grace area.
**Branch:** feat/dropdown-menu  **Deps:** 10

## Design decisions

- **Live anatomy verified 2026-07-22 (Base UI variant):** DropdownMenu,
  DropdownMenuTrigger, DropdownMenuContent, DropdownMenuGroup,
  DropdownMenuLabel, DropdownMenuItem, DropdownMenuSeparator,
  DropdownMenuCheckboxItem, DropdownMenuRadioGroup, DropdownMenuRadioItem,
  DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent,
  DropdownMenuShortcut. shadcn's `render` prop → our `as`.
- **Overlay = task 10 recipe verbatim:** content is `popover="auto"` +
  `useAnchorPosition`; always mounted; state ↔ native sync via `toggle` event;
  exit motion via `@starting-style` + `allow-discrete` transitions (incl.
  `overlay`). Defaults `side="bottom" align="start" sideOffset=4` (menu
  convention; popover keeps center).
- **Roles/aria:** content `role="menu"`, items `role="menuitem"` /
  `menuitemcheckbox` + `aria-checked` / `menuitemradio` + `aria-checked`;
  group `role="group"`, separator `role="separator"`, label is a plain div
  (id-labelled group is a non-goal). Trigger `aria-haspopup="menu"` +
  `aria-expanded` + `aria-controls`. Shortcut is a styled `<span>`,
  `aria-hidden` (it's a hint, not a hotkey implementation).
- **Focus & keyboard — in-component, NOT `useRovingFocus`:** submenu content is
  DOM-nested inside the parent menu (required — nested `popover="auto"` stays
  open only for DOM-ancestor popovers since we call `showPopover()` manually,
  no invoker relation), so a querySelectorAll-based roving hook would leak
  submenu items into the parent's list. Collect items per-menu via
  `closest('[role="menu"]') === thisMenu`. Open focuses first item (ArrowUp on
  trigger opens focusing last); ArrowDown/Up loop; Home/End; `aria-disabled`
  items skipped, don't activate. Tab closes (focus → trigger). Typeahead:
  non-goal.
- **Select:** click/Enter/Space on an item fires `onSelect(event)`; unless
  `event.defaultPrevented`, menu closes and focus returns to trigger (native
  popover hide restores focus since focus is inside). Checkbox/radio items
  same close-on-select; state via `checked/onCheckedChange` (checkbox) and
  `value/onValueChange` on RadioGroup — both `useControllableState`.
- **Submenu:** Sub has own context (open state, refs, timers). SubContent =
  nested `popover="auto"`, anchored to SubTrigger `side="right" align="start"`
  (flip to `left` in RTL via `useDirection`). Opens on SubTrigger
  pointerenter (100ms delay) or ArrowRight (RTL: ArrowLeft) / Enter — focuses
  first item on keyboard open; ArrowLeft (RTL: ArrowRight) closes back to
  SubTrigger. Pointerenter on a sibling item closes the submenu — **unless the
  pointer is inside the safe triangle**: `lib/use-safe-triangle.js` tracks
  pointermove after leaving SubTrigger; while the pointer stays inside the
  triangle (leave-point → subcontent near-edge top/bottom corners) the close
  is deferred; leaving the triangle or reaching the subcontent resolves it.
- **CSS:** `.dropdown-menu` block per conventions; panel look mirrors popover
  (bg-popover, `--shadow-md`, radius, 0.25rem padding, min-width 8rem); item
  focus highlight via `:focus` (real focus, no data-highlighted); logical
  properties throughout (RTL sweep rule from task 03).
- **Non-goals:** typeahead, PortalContainer, `dir` prop on parts (root
  direction context only), collision-aware align shifting, menubar/context
  reuse hooks (tasks 13/14 will extract what they need).

## Sub-tasks

- [x] 1. core menu — test: trigger click opens `role="menu"` below trigger
  with first item focused; ArrowDown/Up loop and skip `aria-disabled`;
  Home/End; Enter/click select an item (readout updates), close, and return
  focus to trigger; `onSelect` preventDefault keeps it open; Esc + outside
  click close and sync; Tab closes; trigger aria (haspopup/expanded/controls);
  exit transition plays; files: `ui/dropdown-menu/dropdown-menu.jsx` + `.css`
  (root/trigger/content/item/group/label/separator/shortcut),
  `tests/dropdown-menu.test.mjs`, `playground/pages/dropdown-menu.jsx`,
  `playground/registry.js`.
- [x] 2. checkbox + radio items — test: checkbox toggles `aria-checked`,
  closes, state persists on reopen; controlled `checked/onCheckedChange`;
  radio group is single-select with `menuitemradio` roles and
  `value/onValueChange`; indicator visible only when checked; files:
  `ui/dropdown-menu/dropdown-menu.jsx` + `.css`, test + demo page.
- [x] 3. submenu + safe triangle — test: ArrowRight on SubTrigger opens
  SubContent focused on first item, ArrowLeft closes back; hover opens after
  delay; diagonal pointer path from SubTrigger across the gap into SubContent
  keeps it open (safe triangle); moving to a sibling item instead closes it;
  Esc closes the whole stack; files: `lib/use-safe-triangle.js`,
  `ui/dropdown-menu/dropdown-menu.jsx` + `.css`, test + demo page.

## Verify / done

- `node tests/run.mjs` green; `npm run build` clean.
- Manual :5173 `#dropdown-menu` light/dark: open/close motion, submenu hover
  grace feels right, RTL demo opens submenu leftward with mirrored arrows.
