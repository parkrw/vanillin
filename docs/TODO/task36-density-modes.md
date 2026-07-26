# task36: density-modes

**Goal:** `compact | comfortable | spacious` as a real, scoped API over the
tokenized components.
**Branch:** feat/density-modes
**Deps:** 34, 35 (nothing to scale until those land)

## Design decisions

- **The mechanism already exists** — `--density-scale` (a typed `@property`
  number, initial `1`) multiplying the `--space-1`…`--space-8` ramp. This task
  does not invent it; it names three presets and makes them scopeable.
- **Scoped, not global.** A data-dense table inside a comfortable page is the
  actual use case. Implement as a `data-density` attribute that sets the
  scale, so it cascades to any subtree:
  ```css
  [data-density="compact"]     { --density-scale: 0.875; }
  [data-density="comfortable"] { --density-scale: 1; }
  [data-density="spacious"]    { --density-scale: 1.25; }
  ```
  **Gotcha:** `--density-scale` is registered with `inherits: true`, so a
  nested override works — but the `--space-*` tokens are themselves declared
  at `:root`, meaning they were *computed* there with the root's scale and
  inherit as resolved values. Setting `--density-scale` on a subtree will
  therefore do nothing unless the `--space-*` declarations are also re-declared
  in the `[data-density]` rule. **Verify this before building on it** — it
  determines whether the whole feature is one rule or thirty.
- **A `<Density>` component is the ergonomic wrapper**, not the mechanism:
  renders a `div` (or `as`) with `data-density`. Keep it in `ui/density/`.
- **Do not scale font size.** Density is spacing. Shrinking text below 14px
  fails accessibility expectations and is the reason "compact" modes usually
  look broken. Say so in the docs.
- **Do not scale touch targets below 24px.** Compact mode on a coarse pointer
  is a WCAG 2.5.8 problem. Guard interactive minimum sizes with `max()` so
  they clamp rather than shrink, and check the checkbox/radio/switch sizes
  specifically.
- **Three presets, not a free number.** A consumer *can* set
  `--density-scale` directly, and that stays supported and documented, but the
  named modes are the API.

## Sub-tasks

- [ ] 1. Determine whether a scoped `data-density` actually re-resolves the
  `--space-*` ramp (see the gotcha above). Record the finding — it decides the
  shape of sub-task 2.
- [ ] 2. `data-density` rules + touch-target clamping. Files:
  `styles/globals.css`.
- [ ] 3. `ui/density/` wrapper component. Files: `ui/density/density.jsx`
  (probably no CSS).
- [ ] 4. Demo page showing all three modes side by side, including a table
  (the component where density matters most) and a nested scope. Files:
  `playground/pages/density.jsx`, `playground/registry.js`.
- [ ] 5. Docs prose: what scales and what deliberately does not (font size,
  minimum touch targets), and how to set a custom scale. Files: the demo page
  plus a short section in `playground/pages/docs/theming.jsx`.
- [ ] 6. Test: each mode produces a distinct computed padding on a table cell
  and a button; a nested `data-density` overrides its ancestor; font size is
  unchanged across all three; checkbox/switch hit area stays ≥24px in compact.
  Files: `tests/density.test.mjs`.

## Verify / done

- `node tests/run.mjs` green; `npm run build` clean.
- Visual check at all three densities on button, table, card, dialog, form —
  nothing overlaps or clips at `compact`, nothing looks stranded at `spacious`.
- Confirm a `[data-density]` inside another one wins.
