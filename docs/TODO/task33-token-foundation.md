# task33: token-foundation

**Goal:** Make `styles/globals.css` a machine-writable, typed, derivable token
layer — the substrate the config generator (37) writes into.
**Branch:** feat/token-foundation
**Deps:** none (but 34/35/36/37 all depend on this)

## Why

Today's tokens are hand-written literals duplicated across `:root` and
`.dark` — ~60 declarations each, and every colour must be authored twice. That
is fine for humans and hostile to a generator. Three platform features fix it.

## Design decisions

- **Step 0 is a live browser-support check.** Relative color syntax,
  `light-dark()`, and `@property` were all Baseline-ish at plan time but not
  verified. Check each; anything not safe degrades to the current
  two-block form and the generator emits the fallback instead. Record what
  you found in the adjustments log — 37 and 39 will need the same answer.

- **`light-dark()` collapses the duplication.** One declaration per token
  instead of two blocks:

  ```css
  :root {
    color-scheme: light dark;
    --primary: light-dark(oklch(0.205 0 0), oklch(0.922 0 0));
  }
  ```

  **Keep the `.dark` class working.** The kit's theme toggle, the playground,
  and every consumer set `.dark` explicitly — `light-dark()` alone follows the
  OS. Set `color-scheme: light` / `dark` on `:root` and `.dark` respectively so
  `light-dark()` resolves from the class, and keep `.dark` as the override
  hook. This must not become an OS-only theme.

- **Brand derivation via relative color syntax.** The headline config feature:
  a consumer supplies one colour and gets a coherent theme.

  ```css
  --primary-hover:  oklch(from var(--primary) calc(l - 0.05) c h);
  --primary-subtle: oklch(from var(--primary) 0.96 calc(c * 0.3) h);
  --ring:           oklch(from var(--primary) l calc(c * 0.6) h);
  ```

  Scope this task to **deriving the interaction states** (hover, active,
  subtle, ring) from the base families that already exist. Do **not** invent
  an 11-shade scale — nothing in the kit consumes one, and it would be
  speculative surface for 37 to maintain.

  Note the existing `color-mix(in oklab, … 90%, transparent)` hover pattern is
  *transparency*, not a darker colour — it shows the page through the button.
  Derived hovers are strictly better; migrate the hover declarations as part
  of 34/35, not here.

- **`@property` types the tokens.** Gives the generator's output a declared
  syntax, an initial value, and inheritance behaviour — so a malformed config
  value falls back instead of cascading garbage, and colour tokens become
  animatable (needed by 54 view transitions):

  ```css
  @property --primary {
    syntax: "<color>";
    inherits: true;
    initial-value: oklch(0.205 0 0);
  }
  ```

  Register the colour, length, and number families. **Gotcha:** a registered
  property with `inherits: false` will not reach descendants — get this right
  per family or components silently lose their tokens. Colours and radii
  inherit; component-scoped tokens (34/35) will not.

- **Density scaffold only.** Define `--density-scale: 1` plus the spacing
  ramp it multiplies. Do not apply it anywhere — task 36 does that once
  components are tokenized. Defining it here means 34/35 author against it
  instead of being retrofitted.

- **Non-breaking is a hard requirement.** Every existing token name keeps its
  name and resolves to the same computed value. The visual diff at the end of
  this task is zero.

## Sub-tasks

- [ ] 1. Browser-support check for relative color syntax, `light-dark()`,
  `@property`; write findings into the adjustments log and pick the fallback
  shape for anything unsupported.
- [ ] 2. `light-dark()` migration with `.dark` preserved as an explicit
  override; `@property` registrations for colour/length/number families.
  Files: `styles/globals.css`.
- [ ] 3. Derived interaction-state tokens + `--density-scale` scaffold.
  Files: `styles/globals.css`.
- [ ] 4. Test: computed values of every token match a snapshot taken **before**
  the change in both modes (this is the non-breaking proof, and it is the
  whole test); `.dark` class still overrides regardless of emulated OS scheme;
  an invalid `@property` value falls back to its initial rather than
  cascading. Files: `tests/tokens.test.mjs`.

## Verify / done

- `node tests/run.mjs` green; `npm run build` clean.
- **Capture the before-snapshot first** — run the token-value dump against
  `main`, commit it as the fixture, then migrate. Without that the
  non-breaking claim is unfalsifiable.
- Screenshot diff of 4–5 dense demo pages (button, badge, dialog, data-table,
  sidebar) in both modes: pixel-identical.
