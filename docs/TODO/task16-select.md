# task16: select

**Goal:** Select — listbox-on-popover picker with trigger value display,
typeahead, and form participation. Menu recipe (12) + popover recipe (10),
new roles (combobox/listbox/option).
**Branch:** feat/select (stacked on feat/navigation-menu — shared registry.js)
**Deps:** 10, 12

## Design decisions

- **Live anatomy verified 2026-07-23 (Base UI default):** Select,
  SelectTrigger, SelectValue, SelectContent, SelectGroup, SelectLabel,
  SelectItem, SelectSeparator. No scroll up/down buttons in the Base UI
  variant — the listbox scrolls natively (max-height + overflow). Root takes
  `items` (value→label pairs) for value display; trigger has `size`.
- **Popper placement only (documented deviation):** Base UI's
  `alignItemWithTrigger` (selected item overlays the trigger, macOS-style) is
  a non-goal — content anchors below the trigger (upstream Radix's
  `position="popper"` default look). Prop accepted and swallowed.
- **Roles, not menu re-exports:** trigger is `role="combobox"`
  (aria-expanded/controls/haspopup=listbox), content `role="listbox"`,
  items `role="option"` + aria-selected + data-state checked/unchecked —
  so parts are select-specific, but reuse task-12's mechanics: popover="auto"
  content, toggle-event state sync, live `:popover-open` gating,
  focus-follows-pointer items (real focus, no aria-activedescendant),
  in-listbox arrow nav/Home/End.
- **Value display:** items register value→label in root context on mount
  (from `textValue` prop or textContent); `items` prop consulted first.
  SelectValue renders the label, else its `placeholder`; trigger gets
  `data-placeholder` when empty.
- **Open focuses the selected option** (not first/last) and
  `scrollIntoView({block:"nearest"})`s it; content min-inline-size is
  synced to the trigger width on open.
- **Typeahead** (1s buffer, both states): open — focuses the first matching
  option; closed — sets the value directly without opening (native `<select>`
  parity). Space while buffering matches instead of selecting.
- **Form participation:** `name` renders a hidden `<input>` carrying the
  value; `disabled` mirrored onto it (no constraint validation — hidden
  inputs don't validate; deviation from Base UI's hidden `<select>`).
- **Click-toggle race:** SelectTrigger snapshots open-state at pointerdown
  (task-14 gotcha). Also fixes dropdown-menu's own trigger the same way —
  the task-14 log marked it "fix when touched (select 16)" — with a held-press
  regression test there.
- **Esc/outside click:** native light dismiss + toggle sync; Esc handler
  refocuses the trigger. Selection (click/Enter/Space) closes and refocuses
  the trigger, dropdown-menu item precedent.

## Sub-tasks

- [x] 1. select — test: placeholder then selected label in trigger; open
  focuses selected option; click/Enter/Space select, close, refocus trigger;
  arrows/Home/End skip disabled items; Esc + outside click close in sync;
  open and closed typeahead; long list scrolls focused option into view;
  hidden form input; controlled value/onValueChange; trigger click toggles
  closed; files: `ui/select/select.jsx` + `.css`, `tests/select.test.mjs`,
  `site/pages/select.jsx`, `site/registry.js`.
- [x] 2. dropdown-menu trigger race fix + held-press click-to-close
  regression test; files: `ui/dropdown-menu/dropdown-menu.jsx`,
  `tests/dropdown-menu.test.mjs`.

## Verify / done

- `node tests/run.mjs` green; `npm run build` clean.
- Manual :5173 `#select` light/dark: trigger looks like an input, check mark
  on the selected item, long list scroll, typeahead feel.
