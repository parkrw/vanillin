# task121: theme-generator-fixes
**Goal:** Two silent-breakage vectors in `scripts/build-theme.mjs`: override selectors derived from CSS rule *order*, and a defaults builder reading token values from a file that no longer holds them.  **Branch:** `fix/theme-generator`  **Deps:** none (disjoint from the 117-120 CLI chain — owns only the generator)
**Owns:** `scripts/build-theme.mjs`, `tests/build-theme.unit.mjs` (or the existing theme test file), `van.defaults.json` (only if sub-task 2 needs an explicit-mode fixup)

Line numbers measured 2026-08-27; re-verify.

## Findings

1. **Override selectors come from "first class selector in the file."** `discoverComponents` (`scripts/build-theme.mjs:61-79`) regexes `/^\.([\w-]+)\s*[{,]/m` and takes the first hit; consumer `components.<slug>` overrides in `van.config.json` are emitted against that class (`:517`). Reordering rules inside a component's CSS — a purely cosmetic edit no reviewer would flag — silently changes which block class every consumer's theme overrides target: their `van.css` still compiles and does nothing. The kit already has the right anchor: the conformance suite enforces that every component defines a block class matching its dir slug (`tests/conformance.unit.mjs:412-445`). **Derive the selector from the slug** (with the same allowlist the conformance rule uses for the re-export components whose CSS lives elsewhere), and keep the regex only as a fallback that *warns* when it disagrees with the slug-derived class.
2. **`buildDefaults` reads token values from `globals.css`, which no longer holds them.** `:591` passes `tokenSources: ["styles/globals.css"]` (verified: the `tokenSources` seam is at `:376`), but since task 60 the color *values* live in generated `defaults.css` — so `extractTokenDefaults` finds nothing, and the missing-mode fill (`:476-484`) silently emits `light-dark(X, X)` for any token `van.defaults.json` specifies in one mode only: a mode-invariant color with no error, in the kit's own theme. The comment at `:459` describes a source of truth that moved. Fix direction: make a single-mode token in `van.defaults.json` an **error** for color tokens (the kit's own defaults file should be explicit — it's generated input, not consumer convenience), or resolve the other mode from `@property` initial-values in `globals.css`; erroring is recommended — it's the only option with no silent branch. Consumer `van.config.json` keeps its current single-mode convenience (`theme.light.brand` only is a legitimate consumer choice); this is about `--defaults` mode.
3. **While in the file** (small, same seam): the version stamp is task119's; don't double-fix. But do add the missing test that `generate()` output is byte-stable across two runs on the same input — determinism is claimed (sorted emission at `:495,504,518,527`) and untested.

## Sub-tasks

- [ ] 1. Slug-derived override selectors + disagreement warning + the re-export allowlist (mirror `conformance.unit.mjs`'s, with reasons). Test: reorder rules in a fixture CSS, assert the emitted selector doesn't move (red today).
- [ ] 2. Single-mode color tokens in `van.defaults.json` error under `--defaults` (or resolve-from-@property — whichever, with the reason in the file header). Test the chosen behavior + that today's silent `light-dark(X, X)` case now surfaces.
- [ ] 3. Determinism test.
- [ ] 4. `npm run theme && npm run theme:defaults` — regenerate; any diff in `styles/van.css`/`styles/defaults.css` must be explainable by the fixes (expect none if the current tree is consistent; a diff here is a finding, record it).

## Verify / done

```sh
node tests/run.mjs build-theme config-schema
npm run theme && npm run theme:defaults && git diff --stat styles/
npm test > out.txt 2>&1 && grep ^FAIL out.txt
```

Done when: the reorder test and the single-mode test were red first, regenerated styles are diff-clean (or the diff is documented), suite baseline unmoved.

## Out of scope

`@property` initial-value alignment (task123 — that's `globals.css` values, not the generator), the STYLESHEETS list (task117), token naming/prefixing policy (task124).

## Handoff

**Status:** NOT STARTED
