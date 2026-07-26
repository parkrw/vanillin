# task37: config-generator

**Goal:** `vanillin.config.json` → `styles/vanillin.css`. One stdlib-only Node
script, no runtime cost in the consumer app.
**Branch:** feat/config-generator
**Deps:** 33 (typed/derivable tokens), 34 + 35 (component tokens to target)

## Design decisions

- **Build-time, not runtime.** Decided 2026-07-25. A runtime provider would
  keep vanillin pure copy-paste but costs a hydration pass and risks a flash
  of unthemed content. The generator emits static CSS: nothing to ship, nothing
  to run. The trade is that vanillin has to become installable — task 38.

- **Config shape** (every section optional; omitted = current defaults):

  ```jsonc
  {
    "theme": {
      "brand": "oklch(0.55 0.2 265)",   // derives primary/hover/ring/subtle
      "radius": "0.5rem",
      "density": "comfortable",
      "motion": { "scale": 1, "ease": "ease-out" },
      "font": { "sans": "Inter, …", "mono": "…" },
      "light": { "primary": "…" },       // literal overrides beat derivation
      "dark":  { "primary": "…" }
    },
    "components": {
      "button": {
        "tokens":   { "radius": "9999px", "height": "2rem" },
        "variants": { "brand": { "bg": "var(--brand)", "fg": "white" } },
        "sizes":    { "xs": { "height": "1.75rem", "padding-inline": ".5rem" } }
      }
    }
  }
  ```

- **Custom variants need no JSX change.** `Button` already does
  ``variant !== "default" && `btn--${variant}` `` — any string passes straight
  through to a class. So `<Button variant="brand">` works the moment the
  generator emits `.btn--brand`. Same for `size`. This is why tokenization was
  worth doing first: a generated variant is just a token override.

  ```css
  .btn--brand { --btn-bg: var(--brand); --btn-fg: white; }
  .btn--xs    { --btn-height: 1.75rem; --btn-padding-inline: .5rem; }
  ```

- **Output is a single `styles/vanillin.css`, imported *after* `globals.css`.**
  Never rewrite `globals.css` in place — the consumer may have edited it, and
  an in-place rewrite makes the generator destructive. Layer order matters:
  emit into `@layer vanillin.config` so config always wins over component CSS
  without selector-specificity games.

- **Validation is the security boundary.** Config values land verbatim in a
  CSS file. Reject anything that could break out of a declaration:
  - no `;`, `{`, `}`, `<`, `@`, or comment sequences in any value
  - allowlist the `var(--…)` / `calc(…)` / colour-function forms actually
    needed; reject arbitrary `url(...)` (data-exfil via CSS is real)
  - unknown component slugs and unknown token names are **errors**, not
    silent no-ops — a typo'd token that vanishes is the worst failure mode
  - clamp numerics (density, motion scale) to sane ranges
  Write the injection tests first-class; this is the one part of the task
  where a bug is a vulnerability, not a papercut.

- **Determinism.** Same config in, byte-identical CSS out — sorted keys, fixed
  section order, a header comment with the generator version. Consumers will
  commit this file, and a diff that churns on every run is unusable.

- **`@property` interaction (from 33).** Emitting a token that was registered
  with a `syntax` means an invalid value now *falls back to initial* instead of
  being ignored — good, but it means validation errors can hide. Surface them
  as generator errors, don't rely on CSS to catch them.

- **No JS config file.** JSON only. A `vanillin.config.js` would mean
  executing consumer code inside the generator and kills the "just data"
  property that makes the config safe to validate.

## Sub-tasks

- [ ] 1. Schema + validator, standalone and fully tested (injection cases,
  unknown keys, range clamps, derivation-vs-literal precedence). Files:
  `scripts/config-schema.mjs`, `tests/config-schema.test.mjs`.
- [ ] 2. Generator: theme section → token layer (light/dark via 33's
  `light-dark()`), brand derivation, density, motion, fonts. Files:
  `scripts/build-theme.mjs`.
- [ ] 3. Generator: component section → per-component token overrides,
  generated variants, generated sizes. Files: `scripts/build-theme.mjs`.
- [ ] 4. `npm run theme` script; a `vanillin.config.json` at the repo root
  exercising every feature; playground imports the generated file so the docs
  theming page (29's stub) has something real to show. Files: `package.json`,
  `vanillin.config.json`, `playground/main.jsx`.
- [ ] 5. Test: end-to-end — generate from a fixture config, load it in the
  playground, assert computed styles on a button with a generated variant and
  a generated size; assert byte-identical output across two runs. Files:
  `tests/config-generator.test.mjs`.

## Verify / done

- `node tests/run.mjs` green; `npm run build` clean.
- Generate with an empty config `{}` — output must be a no-op layer and the
  playground must look pixel-identical to today.
- Generate with a single `"brand"` value and eyeball the derived theme in both
  modes. This is the demo that sells the feature; if it looks muddy, the
  derivation formulas in 33 need work, not this task.
