# task60: generated-defaults

**Goal:** the kit's own theme is generated from a default config, so there is
exactly one authoritative `:root`. Removes the two-sources-of-truth split
between `styles/globals.css` and the generator.
**Branch:** feat/generated-defaults
**Deps:** 37 ✓ (generator), 61 (multi-colour brand — land 61 first if both are
scheduled; otherwise the default config can only express a one-colour brand)

## Why

Task 37 shipped a generator whose output nobody consumes, and a sample
`van.config.json` with a blue hue-265 brand. `playground/main.jsx` imported
the generated CSS after `globals.css`; at equal specificity (0,1,0) it won on
source order, re-themed the whole playground and pinned `--density-scale` so
`[data-density]` could not override it on the root element. That was 6 of the 12
integration failures fixed on 2026-07-26 (commits `5d9690d80c55`,
`9a6cd4f0343f`, `bf32897d35cf`).

The import is gone now, which makes the docs correct but leaves the generator
undemonstrated and unexercised — it can rot silently, which is exactly how the
blue sample config shipped committed without anyone noticing.

**Task 37's spec contains the contradiction directly.** Sub-task 4 requires the
playground to import the generated file "so the docs theming page has something
real to show"; Verify requires the playground to "look pixel-identical to
today". Both cannot hold while the sample config re-themes. Resolve it by making
the kit's own theme *be* generator output — then there is no second `:root` to
collide with, and the demo and the defaults are the same artifact.

## Design decisions

- **Split by kind, not by file.** The generator owns token *values*;
  `globals.css` keeps the *machinery*. Machinery is not themeable and must stay
  hand-written:
  - `@property` registrations (`initial-value` must be computationally
    independent — no `var()`, no `rem`)
  - the `[data-density]` `--space-*` re-declaration block
  - `oklch(from var(--primary) …)` hover derivations
  - the forced-colors / `prefers-contrast` repair layer
  - the touch-target floor

- **`@layer` does not solve this, and task 37's spec is wrong about it.** Task
  37 line 52 says to emit into `@layer vanillin.config` "so config always wins".
  Layered styles *lose* to unlayered ones, so that would make config lose to all
  of `globals.css`. Either both sides are layered with an explicit order, or
  neither is. Pick one and write the order down.

- **The token snapshot tests are the acceptance criteria, not an obstacle.**
  34/35's baselines define "byte-identical default rendering". Do not edit them.
  If generated output cannot reproduce a token exactly, that is a generator gap
  to fix or a value to move into machinery — not a baseline to relax.

- **Keep the worked sample config.** Task 38's `init` writes
  `van.config.json`, so a real example of the schema is load-bearing
  documentation. The 2026-07-26 integration agent emptied it to `{}`; that was
  reverted in favour of removing the import. Do not empty it again.

- **The live "try your own brand" preview is a separate, later feature.** Once
  there is one authoritative `:root`, a preview container is genuinely correct
  (a nested scope overriding an ancestor) rather than a workaround. It needs the
  generator to emit scoped selectors instead of `:root` — an opt-in
  `{ scope: "..." }` generate option. Do not build this until the defaults path
  lands; it is the thing that made the original bug hard to see.

## Sub-tasks

- [ ] 1. `config/defaults.json` (name yours) that reproduces today's tokens
  exactly. Generate, diff against the current `:root`, iterate to zero diff.
  Expect gaps — record each one and whether it became a generator feature or
  moved to machinery.
- [ ] 2. Split `globals.css`: token values come from generated output, machinery
  stays. Resolve the layering question and comment the chosen order.
- [ ] 3. Wire the build so generated defaults are produced before vite runs, and
  the generated file is committed (determinism from 37 makes the diff stable).
- [ ] 4. Test: generated defaults are byte-identical to the pre-task-60 `:root`;
  a non-default config changes tokens without touching machinery; 34/35 token
  snapshots and `tests/density.test.mjs` still pass unmodified.
- [ ] 5. Docs prose on the theming page — the real config, not a stub.

## Verify / done

- `node tests/run.mjs` green (currently 560/560); `npm run build` clean.
- `tests/tokens*.test.mjs` and `tests/density.test.mjs` pass **unmodified**.
- Exactly one `:root` token declaration reaches the playground. Grep the built
  CSS to prove it.
- Setting `data-density` on `<html>` still changes spacing — this is the
  regression that the old double-`:root` broke, and it only fails at the root
  element, so test there specifically.
