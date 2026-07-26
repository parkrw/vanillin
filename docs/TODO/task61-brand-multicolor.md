# task61: brand-multicolor

**Goal:** `theme.brand` accepts more than one colour, and derived foregrounds are
picked by measured contrast instead of a lightness threshold.
**Branch:** feat/brand-multicolor
**Deps:** 37 ✓
**Note:** sub-task 1 is an accessibility fix, is independent of the rest, and can
land on its own if 61 gets deferred.

## Why

`theme.brand` is a single oklch string, and `deriveBrand`
(`scripts/build-theme.mjs:166`) emits only three tokens from it: `primary`,
`primary-foreground`, `ring`. Everything else semantic is unreachable from
config:

- `--secondary`, `--accent`, `--muted` are pure greys (chroma 0) — they never
  pick up the brand hue at all (`styles/globals.css:101-106`).
- `--success` / `--warning` / `--info` / `--destructive` are hard-coded hues
  (145 / 65 / 250 / 27) with their own `-background` / `-border` / `-foreground`
  families.
- The only escape hatch is the `theme.light` / `theme.dark` blocks, which means
  overriding token by token, by hand.

A two-colour brand — primary plus secondary, the common case — cannot be
expressed. That is a real gap in the consumer story task 37 exists to serve.

## Design decisions

- **`brand` accepts a string or an object.** String stays sugar for
  `{ primary: … }`, so every existing config keeps working:

  ```jsonc
  "brand": {
    "primary":   "oklch(0.55 0.2 265)",
    "secondary": "oklch(0.65 0.14 190)",
    "accent":    "oklch(0.7 0.15 320)",
    "neutral":   "oklch(0.55 0.01 265)"
  }
  ```

  Each key derives its own `-foreground` / `-hover` / tint family the way
  `deriveBrand` already does for primary.

- **`neutral` earns its place.** Tinting the greys slightly toward the brand hue
  is most of what separates a designed theme from a default one. Today
  `--secondary`, `--muted` and `--accent` are all chroma 0, so a themed kit still
  reads as grey. This is the highest-visual-impact part of the task.

- **Derive foregrounds by measured contrast, not a lightness threshold.** This is
  the accessibility bug. Current code:

  ```js
  const lightFg = l < 0.6 ? "oklch(0.985 0 0)" : "oklch(0.205 0 0)"
  ```

  A brand sitting near the 0.6 boundary can derive a pair under 4.5:1. Compute
  actual contrast against the resolved background and pick the foreground that
  passes; error at generate time if neither does. Same problem in the dark-mode
  derivation (`l + 0.3`, `c * 0.85`) — both are heuristics standing in for a
  measurement.

- **Status hues stay overridable but keep their defaults.** Do not derive
  success/warning/info from the brand; a red "success" because the brand is red
  is worse than an off-palette green. Allow explicit override, derive nothing.

- **Validation is still the security boundary** (task 37): every new key runs
  through the same `parseOklch` + `isSafeCSSValue` path. An object-shaped `brand`
  must not become a hole in that — unknown keys are errors, not no-ops.

## Sub-tasks

- [ ] 1. Replace the lightness-threshold foreground pick with a real contrast
  computation; error when no candidate passes 4.5:1. Re-check the dark-mode
  derivation against measured contrast too. Files: `scripts/build-theme.mjs`,
  `tests/config-generator.test.mjs`. **Independently shippable.**
- [ ] 2. Schema: `brand` as string-or-object, per-key validation, unknown keys
  are errors. Files: `scripts/config-schema.mjs`, `tests/config-schema.test.mjs`.
- [ ] 3. Derivation: emit the `-foreground` / `-hover` / tint family per brand
  key. Files: `scripts/build-theme.mjs`.
- [ ] 4. `neutral` tinting — thread the brand hue through `--secondary`,
  `--muted`, `--accent` and their `-foreground` pairs.
- [ ] 5. Docs prose on the theming page: the object form, what each key drives,
  and which tokens are deliberately not derived.

## Verify / done

- `node tests/run.mjs` green; `npm run build` clean.
- A string `brand` produces byte-identical output to before this task — prove it,
  it is the backward-compatibility contract.
- A four-key brand renders coherently in both light and dark. Eyeball it at
  `npm run dev`; muddiness means the derivation formulas need work, not the
  schema.
- Every derived foreground/background pair passes 4.5:1. Assert it in the test
  rather than checking by eye — that is the whole point of sub-task 1.
