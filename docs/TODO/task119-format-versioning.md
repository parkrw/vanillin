# task119: format-versioning
**Goal:** Every machine-read artifact the kit emits carries a format version, the `$schema` the CLI writes stops dangling, and the one hardcoded version constant gets a drift test.  **Branch:** `feat/format-versioning`  **Deps:** 117 (touches `scripts/manifest.mjs` and `bin/van.mjs`; serialize behind it)
**Owns:** `scripts/manifest.mjs`, `scripts/build-registry.mjs`, `scripts/gen-schema.mjs`, `scripts/build-theme.mjs` (VERSION only), `bin/van.mjs` (init `$schema` handling), `tests/registry.unit.mjs`, `tests/cli.unit.mjs`

## Why

`kitVersion` is a *content* version (`scripts/manifest.mjs:199` reads `pkg.version`). Nothing versions the **shape** of the four formats consumers' tooling parses: the `.van.json` sidecar (canonical 5 keys, `scripts/manifest.mjs:13`), `registry.json` (`scripts/build-registry.mjs:56-61`), `van.config.json` (validated by `scripts/config-schema.mjs`), and the generated `van.css` token vocabulary. So a future CLI reading an older artifact — or an older CLI reading a newer one — cannot *refuse safely* or migrate; it parses, ignores unknown semantics, and acts on stale assumptions. The sidecar's unknown-key preservation (`scripts/manifest.mjs:51-54`) already delivers half of forward compat; the version integer delivers the other half: the ability to say "I don't understand this, stopping."

Two adjacent papercuts, same seam:

- `bin/van.mjs:457` writes `"$schema": "./van.schema.json"` into the consumer's config, but `init` never copies that file — every editor shows a resolution error on the file the CLI just wrote. Either copy it at `init` (and refresh via the styles path task117 built) or point at a versioned raw-GitHub URL — **copying is recommended**: a URL becomes a permanent public endpoint with its own compat burden, which is exactly what this task exists to avoid creating accidentally.
- `scripts/build-theme.mjs:35` hardcodes `VERSION = "0.1.0"` (verified), disconnected from `package.json` and untested — the first version bump ships a lying `van.css` header. Contrast `tests/registry.unit.mjs:93-95`, which *does* pin `registry.kitVersion === pkg.version`; give VERSION the same treatment (import `pkg.version`, delete the constant). While there: the version stamp in the `van.css` header (`:404`) makes every kit bump dirty every consumer's generated file even when nothing changed — move the version to a comment consumers can ignore in diffs, or drop it from the header and keep it in `van.config.json` only. Decide, record in the task Handoff.

## Sub-tasks

- [ ] 1. `"schemaVersion": 1` as the first key of every emitted `.van.json` (component, and 117's lib/styles sidecars) and of `registry.json`. Writers set it; readers in `bin/van.mjs` accept absent (treat as 1 — every existing artifact) and refuse greater-than-known with a message naming the fix ("this project was written by a newer van; upgrade the kit").
- [ ] 2. Same field in `van.config.json` written by `init`, accepted by the validator (`config-schema.mjs` TOP_LEVEL_KEYS), absent-tolerated.
- [ ] 3. `van.schema.json` copied at `init` (and kept fresh by the styles update path); `$schema` keeps pointing at the local file. Test: after `init` in a scratch dir, the referenced file exists.
- [ ] 4. `build-theme.mjs` VERSION from `pkg.version` + the drift test; the header-churn decision.
- [ ] 5. Tests: refuse-newer behavior for sidecar and registry; absent-means-1 acceptance; schema regeneration (`npm run schema`) emits the new field.

## Verify / done

```sh
npm run contracts && npm run schema && git diff --exit-code
node tests/run.mjs cli registry config-schema
npm test > out.txt 2>&1 && grep ^FAIL out.txt
```

Done when: every generated artifact on a clean tree carries `schemaVersion`, an artifact stamped `schemaVersion: 99` makes the CLI stop with the upgrade message (test), and no version string exists in the repo that isn't derived from `package.json`.

## Out of scope

Actually bumping any format (there is no v2), the config unknown-key strictness question — that's a policy call for task124 (directional facts: old-config-on-new-CLI is safe because every key is optional; new-config-on-old-CLI hard-fails by design; the policy doc must state which the project promises).

## Handoff

**Status:** NOT STARTED
