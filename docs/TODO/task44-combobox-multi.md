# task44: combobox-multi

**Goal:** `multiple` selection with chips, `showClear`, and real constraint
validation in `ui/combobox` — the three things task 17 deferred.
**Branch:** feat/combobox-multi
**Deps:** 43 (landed — it established the form-integration pattern)
**Scope:** `ui/combobox/` only. Chips are a combobox subpart, not a new
component.

## Why

Task 17 shipped single-select only (`docs/TODO/LOG.md` line 174) because it was
already ~1010 net lines. Task 43 then solved form integration for `ui/select`;
this task applies the same pattern to combobox and adds multi-select on top.

## Where things are today

- `ui/combobox/combobox.jsx` — 9 exports plus an unexported `ComboboxChevron`
  (line 319). Value is a **scalar string** via `useControllableState`
  (lines 52–56), `defaultValue = ""`.
- `selectValue` (lines 92–99) writes the value, copies the label into
  `inputValue`, closes, refocuses.
- `revertInput` (lines 108–117) resets `query`, clears the highlight, and
  restores `inputValue` to the selected label on close.
- Form binding today is a bare `<input type="hidden">` (lines 147–149). No
  `required`, no `form`, no `ref`, no validation.
- `.combobox-input-group` (combobox.css line 5) is `inline-flex` with a **fixed
  `block-size: 2.25rem`** — chips cannot wrap inside it as written.

## Design decisions

- **`multiple` switches the value type to `string[]`.** `defaultValue`
  defaults to `[]` in that mode. Use the updater form of the
  `useControllableState` setter to toggle — `ui/calendar`'s `mode="multiple"`
  (calendar.jsx lines 240–247) already does exactly this and is the precedent
  to copy. Never mutate the array.
- **In multiple mode the text input is a query field, not a display field.**
  Selecting does *not* write a label into `inputValue`; it toggles membership,
  clears the query, and **keeps the popup open** with focus in the input. On
  close, clear the query rather than reverting to a label. Single-mode
  behaviour is unchanged — including the Escape-revert fix at
  combobox.jsx lines 266–277, which must keep passing its test.
- **Chips live in `.combobox-input-group`, before the input.** Do **not**
  reuse `ui/badge` and do **not** add a dismiss affordance to it — badge is a
  pure presentational label, and another task owns `ui/badge/badge.css` this
  wave. Add `.combobox-chip` + `.combobox-chip-remove` locally, styled from
  tokens to read like a secondary badge.
- **`block-size: 2.25rem` becomes `min-block-size`** with `flex-wrap: wrap`, so
  a row of chips grows the control instead of clipping. The single-select
  rendering must stay pixel-identical — verify, don't assume.
- **Chip remove buttons are `tabIndex={-1}`.** Tab must not walk eight chips to
  reach the chevron. Removal paths are: click the ✕, or **Backspace on an
  empty input removes the last chip**. Both need `aria-label`s.
- **`showClear`** renders a clear button between the chips and the chevron,
  only when there is something to clear, in **both** modes. It clears the
  value and the query and returns focus to the input.
- **Constraint validation replaces the hidden input** — mirror
  `ui/select`'s pattern from task 43 (select.jsx lines 114–159): a
  visually-hidden **native `<select>`** (`multiple` when the prop is set)
  carrying `name` / `required` / `form` / `disabled`, with
  `useImperativeHandle` exposing `setCustomValidity` on the component ref.
  Reuse the clip-rect SR technique from `.select-native-hidden` (select.css
  lines 229–239) — `display: none` excludes an element from validation. Gate it
  on `name != null || required`, as select does.
  - The native `<select>` needs `<option>`s for the values it holds. Mirror the
    registered items; if a value has no matching item, still emit an option for
    it so the control can hold the value. Say in your report if that case
    turns out to be unreachable.
- **ARIA:** `aria-multiselectable` on the listbox in multiple mode;
  `aria-selected` per item; the checked indicator reflects membership.
- **Watch `.combobox-item[hidden]`** (combobox.css line 122) — it restates
  `display: none` to defeat flex. Filtering still works through the `hidden`
  attribute; don't change that mechanism.

## Sub-tasks

- [ ] 1. `multiple` in the root: array value, toggle-select, keep-open,
  query clearing, `aria-multiselectable`, per-item checked state. Files:
  `ui/combobox/combobox.jsx`.
- [ ] 2. Chips in the trigger + wrap layout + Backspace-removes-last. Files:
  `ui/combobox/combobox.jsx`, `ui/combobox/combobox.css`.
- [ ] 3. `showClear` in both modes. Files: both.
- [ ] 4. Constraint validation via the hidden native `<select>`; drop the bare
  hidden input. Files: both.
- [ ] 5. Demo + **docs prose** — multi with chips, `showClear`, and a
  `required` form example showing the validation message. Files:
  `playground/pages/combobox.jsx`.
- [ ] 6. Tests. Files: `tests/combobox.test.mjs` (extend).

## Verify / done

- `VANILLIN_TEST_PORT=<yours> node tests/run.mjs combobox` green — **all 11
  existing tests included**, especially the Escape-revert one.
- `npm run build` clean.
- New coverage: select two items → two chips, popup stays open; Backspace on
  empty input removes the last chip; `showClear` empties the control;
  submitting a `required` empty multi-combobox is blocked by the browser and
  `setCustomValidity` through the ref surfaces a custom message; single-select
  behaviour is byte-for-byte unchanged.
- Single-select demo screenshots identical to before, light and dark.
