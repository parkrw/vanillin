# task31: cursor-affordance

**Goal:** Every clickable thing shows the pointer cursor; every draggable thing
shows the right drag cursor.
**Branch:** feat/cursor-affordance
**Deps:** none

## Why

Tailwind v4's preflight sets `cursor: default` on `button`, and shadcn never
overrides it — so shadcn buttons show an arrow, not a hand. We inherited the
gap unevenly: only 18 of 61 components declare `cursor: pointer` today. The
other 43 either don't need it or are missing it, and there is no rule saying
which.

## Design decisions

- **One base rule in `styles/globals.css`, not 40 component edits.** Target
  roles and semantics rather than class names so future components inherit the
  behaviour for free:

  ```css
  button,
  summary,
  label[for],
  a[href],
  select,
  [role="button"],
  [role="menuitem"],
  [role="menuitemcheckbox"],
  [role="menuitemradio"],
  [role="option"],
  [role="tab"],
  [role="switch"],
  [role="radio"],
  [role="checkbox"],
  [role="link"] {
    cursor: pointer;
  }
  ```

- **Disabled needs no branch.** Every disabled state in the kit already sets
  `pointer-events: none`, which suppresses the cursor. Verify this holds
  rather than adding `:not(:disabled)` noise — if a component only sets
  `opacity`, fix that component instead.
- **Non-pointer cursors are per-component**, because they are semantic:
  - `ui/slider` thumb — `grab`, `grabbing` while dragging
  - `ui/resizable` separator — `col-resize` / `row-resize` by orientation
  - `ui/scroll-area` thumb — `default` (native scrollbars do not show a hand)
  - `ui/carousel` track — `grab` / `grabbing`, but only once a drag captures
    (task 24 defers capture past a 5px dead zone; a plain click must not flash
    the grab cursor)
  - `ui/input` and friends — `text` comes from the UA, leave it
- **Text selection:** `.btn` already sets `user-select: none`. Audit the other
  click targets — menu items, options, tabs — for the same, since a hand
  cursor over selectable text reads as broken.

## Sub-tasks

- [ ] 1. globals.css base rule + audit that every disabled state uses
  `pointer-events: none`; fix any that only dim. Files: `styles/globals.css`,
  plus whichever component CSS the audit turns up.
- [ ] 2. Per-component drag cursors (slider, resizable, carousel, scroll-area)
  + `user-select` audit on click targets. Files: `ui/slider/slider.css`,
  `ui/resizable/resizable.css`, `ui/carousel/carousel.css`,
  `ui/scroll-area/scroll-area.css`.
- [ ] 3. Test: computed `cursor` on a representative target per family —
  button, menu item, select option, tab, switch, `label[for]`, breadcrumb
  link, pagination link, accordion trigger — plus `grabbing` appearing only
  during an active slider drag and `col-resize` on a vertical separator.
  Files: `tests/cursor.test.mjs`.

## Verify / done

- `node tests/run.mjs` green; `npm run build` clean.
- Manual :5173 sweep: hover every demo page, nothing clickable shows an arrow,
  nothing static shows a hand. Check the disabled demos specifically.
