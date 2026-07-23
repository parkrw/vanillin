# task14: menubar

**Goal:** Menubar — a horizontal row of menus reusing the task-12 menu wholesale via re-exports; new mechanics are trigger roving focus, click-then-hover menu switching, and cross-menu arrow navigation.
**Branch:** feat/menubar  **Deps:** 12

## Design decisions

- **Live anatomy verified 2026-07-23 (Base UI variant):** Menubar, MenubarMenu,
  MenubarTrigger, MenubarContent, MenubarGroup, MenubarLabel, MenubarItem,
  MenubarSeparator, MenubarCheckboxItem, MenubarRadioGroup, MenubarRadioItem,
  MenubarSub, MenubarSubTrigger, MenubarSubContent, MenubarShortcut — no
  Portal. Item/CheckboxItem/RadioGroup/RadioItem/Sub/SubTrigger/SubContent/
  Group/Label/Separator/Shortcut are direct re-exports of DropdownMenu parts
  (context-menu precedent). `menubar.css` `@import`s dropdown-menu.css.
- **Roots:** `Menubar` renders `role="menubar"` and carries
  `value/defaultValue/onValueChange` (`useControllableState`) — the value of
  the open menu, `""` when closed. `MenubarMenu` takes an optional `value`
  (falls back to `useId()`), wraps a **controlled** `DropdownMenu`
  (`open={rootValue === value}`, close only clears the root value if it still
  owns it) so every menu part works unchanged.
- **Trigger:** `<button role="menuitem">` (WAI-ARIA menubar pattern) with
  aria-haspopup/expanded/controls + `data-state`; wired to its menu's
  DropdownMenu context (`useDropdownMenu`). Roving tabindex across triggers =
  `useRovingFocus` on the menubar root (selector `[data-menubar-trigger]`,
  horizontal, loop — Base UI default loops; menu items don't match the
  selector so bubbled content keydowns are ignored). Click toggles;
  ArrowDown/Enter/Space open focusing first item, ArrowUp opens focusing last
  (root `focusLastRef`); when closed, Left/Right only move focus (no open —
  Radix/Base parity). Trigger carries `data-menubar-value` so cross-menu nav
  can map DOM order → menu value.
- **Hover switching:** pointerenter on a trigger opens its menu **only when
  another menu is already open** (click-first model); the switch must not
  steal item highlight, so dropdown-menu's root context grows
  `skipItemFocusRef` — content focuses itself (not the first item) when set.
  Both one-shot refs (`focusLastRef` too) now self-reset after the open
  effect consumes them: menubar opens menus from outside the trigger, where
  nobody re-arms them, so a stale `focusLastRef` from an old ArrowUp open
  would leak into the next switch.
- **Cross-menu arrows:** MenubarContent's `onKeyDown` (runs before the
  dropdown handler) moves to the adjacent menu — dir-aware next key
  (ArrowRight, RTL flipped) anywhere in the stack since SubTrigger
  stopPropagations its open key and SubContent its close key: so ArrowRight
  on a plain submenu item bubbles here and jumps to the next menu (Radix
  behavior), while ArrowLeft from a submenu never arrives (it closed the
  sub). Prev key only acts when the event target's menu is the top-level
  content. Switch = focus target trigger + open its menu (first item focused
  by the default open path). Wraps around.
- **Native popover exclusivity does the handoff:** the two contents are
  sibling `popover="auto"` — showing the new one hides the old natively; its
  queued toggle event syncs the old menu's state to closed. Esc/outside
  click/select close via the existing dropdown paths and clear the root
  value through `onOpenChange`.
- **Content placement:** shadcn defaults — `align="start" alignOffset={-4}
  sideOffset={8}`, side bottom.
- **CSS:** `.menubar` = flex row, border, `--radius-md`, `--shadow-sm`
  (never xs), 0.25rem padding, gap 0.25rem; `.menubar-trigger` px 0.5rem /
  py 0.25rem, `--radius-sm`, highlight on `:focus` and `[data-state="open"]`
  (bg-accent); `.menubar-content` min-inline-size 12rem on top of
  `.dropdown-menu`. Logical properties; motion comes free from
  dropdown-menu.css.
- **Non-goals:** typeahead, vertical orientation, `loop` prop, per-part `dir`
  (root direction context flips submenus + nav keys already).

## Sub-tasks

- [x] 1. core menubar — test: `role="menubar"` row with `role="menuitem"`
  triggers, one tabbable (roving); ArrowRight/Left/Home/End move trigger
  focus without opening; click toggles a `role="menu"` below the trigger
  with first item focused (matching dropdown); ArrowDown opens focusing
  first item, ArrowUp
  last; Esc closes and refocuses the trigger; with menu A open, hovering
  trigger B switches menus (B open, A closed) without highlighting an item;
  hovering with nothing open does nothing; ArrowRight inside content A moves
  to menu B with first item focused, wraps at the end, ArrowLeft goes back;
  select closes and clears root value (reopen works); files:
  `ui/menubar/menubar.jsx` + `.css`, `ui/dropdown-menu/dropdown-menu.jsx`
  (skipItemFocusRef + one-shot ref reset), `tests/menubar.test.mjs`,
  `playground/pages/menubar.jsx`, `playground/registry.js`.
- [x] 2. submenu + re-export coverage — test: ArrowRight on a SubTrigger
  opens the submenu (not the next menu), ArrowRight on a plain item inside
  the submenu jumps to the next menu (whole stack closes), ArrowLeft inside
  the submenu only closes the sub; checkbox toggles `aria-checked`, closes,
  persists on reopen; radio group single-selects; dropdown-menu suite still
  green (no regression from the ref-reset edit); files: test + demo page.

## Verify / done

- `node tests/run.mjs` green (menubar + dropdown-menu + context-menu);
  `npm run build` clean.
- Manual :5173 `#menubar` light/dark: hover switching feels native, open/close
  motion, RTL demo mirrors cross-menu arrows and submenus.
