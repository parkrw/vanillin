# task34: tokenize-core-a

**Goal:** Move the form-control components onto the token layer task 33 built —
spacing ramp, derived hover states, typed radii.
**Branch:** feat/tokenize-core-a
**Deps:** 33 (landed)
**Scope:** button, badge, input, textarea, checkbox, radio-group, switch,
label, field, native-select

## Why

Task 33 defined `--space-1`…`--space-8` (each `calc(Xrem *
var(--density-scale))`) and derived `--primary-hover` / `--secondary-hover` /
`--accent-hover` / `--destructive-hover` / `--muted-hover`. **Nothing consumes
any of them yet.** Until components do, task 36 (density) has nothing to scale
and task 37 (config generator) has nothing meaningful to write.

## Design decisions

- **Two substitutions, mechanically:**
  1. Hard-coded spacing (`padding: 0.5rem 0.75rem`) → the `--space-*` ramp.
     Values that do not land on the ramp get rounded to the nearest step
     rather than a new token minted; if a component genuinely needs a
     half-step, say so in the report instead of inventing `--space-1-5`.
  2. `color-mix(in oklab, X 90%, transparent)` hover patterns → the derived
     `--*-hover` tokens. **This is a behaviour improvement, not just a
     rename:** the `color-mix`-to-transparent pattern shows the page through
     the control, so a button over a patterned or coloured background looks
     broken on hover. The derived tokens are opaque.
- **Non-visual-change is the bar, except where the hover fix is the point.**
  Everything else must be pixel-identical. Where the hover migration does
  change a rendered colour, that is intended — capture it and say so.
- **Do not touch `styles/globals.css`.** Task 33 owns it and it is correct.
  If a needed token is missing, report it; do not add one.
- **Borders and radii already reference tokens** in most of these files —
  verify rather than assume, and fix any literal `border-radius: 6px`.
- **`--input-background`** (added by task 28) must keep working; several
  controls depend on it for dark mode.
- **Order the work by risk:** button and badge first (most reused, best
  covered by tests), then the inputs, then checkbox/radio/switch, then
  label/field/native-select.

## Sub-tasks

- [ ] 1. Screenshot baseline of every affected demo page in both modes, before
  any edit — this is the only way to prove "no visual change". Keep it out of
  the commit if it is large; record the method in the report.
- [ ] 2. button + badge: spacing ramp, derived hover, radii. Files:
  `ui/button/button.css`, `ui/badge/badge.css`.
- [ ] 3. input + textarea + native-select. Files: those three `.css` files.
- [ ] 4. checkbox + radio-group + switch. Files: those three `.css` files.
- [ ] 5. label + field. Files: `ui/label/label.css`, `ui/field/field.css`.
- [ ] 6. Test: a representative control from each family resolves its padding
  through `--space-*` (assert that changing `--density-scale` moves the
  computed padding — that is the real proof, and it is what task 36 depends
  on), and hover states resolve to an **opaque** colour, not a `color-mix`
  with transparent. Files: `tests/tokens.test.mjs` (extend).

## Verify / done

- `node tests/run.mjs` green; `npm run build` clean.
- Screenshot comparison against the sub-task 1 baseline: identical except the
  deliberate hover changes, which must be listed explicitly.
- Set `--density-scale: 0.875` on `:root` in DevTools and confirm every
  component in scope tightens. Anything that does not move was missed.
- Hover every control over a coloured section to confirm the transparency
  artefact is gone.
