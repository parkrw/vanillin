# task17: combobox

**Goal:** Combobox — filterable input + listbox popup. Select (16) mechanics
with the combobox delta: focus never leaves the input; options are
highlighted, not focused.
**Branch:** feat/combobox (stacked on feat/select — shared registry.js)
**Deps:** 16

## Design decisions

- **Live anatomy verified 2026-07-25 (Base UI, not Popover+Command):**
  Combobox, ComboboxInput, ComboboxContent, ComboboxList, ComboboxItem,
  ComboboxEmpty, ComboboxGroup, ComboboxLabel, ComboboxSeparator. Root takes
  `items`, `value`/`onValueChange`, `inputValue`/`onInputValueChange`,
  `autoHighlight`, `name`, `disabled`.
- **Single-select only (documented deviation):** `multiple` + the chips family
  (ComboboxChips/ComboboxChipsInput/ComboboxChip/ComboboxValue) and
  `showClear` are non-goals v1. ComboboxCollection not exported.
- **ARIA combobox-with-listbox:** input `role="combobox"` +
  `aria-autocomplete="list"` + `aria-activedescendant`; ComboboxContent is the
  popover container, ComboboxList is `role="listbox"` (popup also holds
  Empty); items `role="option"` + `data-highlighted` — **no real focus moves**,
  the select-16 focus-follows-pointer pattern does not apply.
- **Highlight state lives in root** as the option's DOM id (per-item `useId`);
  keyboard nav walks visible options via the DOM, pointer-move highlights,
  pointer-leave clears. Highlighted option `scrollIntoView` on keyboard moves.
- **Filtering:** `query` state separate from `inputValue` — typing sets both;
  close resets query (reopen shows all items; the selected label must not
  filter). Default filter: case-insensitive `includes` on the option label.
  Items stay mounted and toggle `hidden` (registry + closed-state nav intact);
  groups auto-hide via CSS `:has()` when all their options are hidden.
  ComboboxList function-children render root `items` pre-filtered.
- **Input value sync:** selection writes the label; close without selection
  reverts to the selected label (or empty). Esc closes + reverts.
- **Open triggers:** typing, input click (`openOnInputClick` parity), chevron
  button (tabIndex −1), ArrowDown/Up. Enter selects the highlighted option;
  Tab closes and moves on; Home/End hijacked only while an option is
  highlighted (else native caret move).
- **Blur does NOT close** (deviation from Base UI): items would need
  pointerdown-preventDefault to survive the blur race, which breaks scrollbar
  drags. Outside click = native light dismiss; keyboard exit = Tab.
- **Input click while open:** pointerdown on the input light-dismisses the
  popup natively; snapshot open-state at pointerdown (task-14 pattern) and
  re-show on click — "stays open", with one exit/enter transition blink.
- **Empty state:** post-render effect counts visible options; ComboboxEmpty
  renders its children only when `query !== ""` and nothing matches.
- **autoHighlight** (default false, Base UI parity): highlight the first
  visible option as the query changes; stale highlights (filtered out) clear.
- **Form:** `name` renders a hidden `<input>` (select-16 precedent).

## Sub-tasks

- [x] 1. combobox — test: wiring (role/aria-activedescendant), typing filters
  + empty state + query reset on reopen, keyboard highlight/Enter/Esc-revert,
  click select, disabled item skip, outside click sync, input-click stays
  open, autoHighlight, controlled value + hidden input; files:
  `ui/combobox/combobox.jsx` + `.css`, `tests/combobox.test.mjs`,
  `site/pages/combobox.jsx`, `site/registry.js`.

## Verify / done

- `node tests/run.mjs` green; `npm run build` clean.
- Manual :5173 `#combobox` light/dark: input styled like select trigger,
  filter feel, highlight vs selection distinct, empty state.
