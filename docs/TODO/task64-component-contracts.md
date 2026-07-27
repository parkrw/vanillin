# task64: component-contracts

**Goal:** every installed component carries a manifest recording where it came
from, what it needs, and what its files hashed to — and a conformance suite that
keeps those manifests true.
**Branch:** feat/component-contracts
**Deps:** none to build. **Task 38 (CLI) consumes this** — write the manifest
format before `add` is implemented, or `add` will hard-code assumptions.

## Why

Conventions live in `docs/HANDOFF.md` and nothing checks them. That is why phase 2
drifted into three chip implementations, a `var(--motion-medium)` strobe on an
indeterminate loop, and `--shadow-xs` after it was banned — each caught by hand,
late, by a human reading diffs.

Separately, the kit needs a per-copy manifest ("homebase config", user's term,
2026-07-26) so an installed component knows its origin. These are one task
because **a manifest nobody verifies rots into fiction.** The conformance suite
is what makes `requires` true.

## The manifest

One sidecar per installed component: `ui/<slug>/.van.json`.

```json
{
  "name": "data-table",
  "kitVersion": "0.1.0",
  "source": "github:user/vanillin@v0.1.0",
  "requires": ["table", "checkbox", "scroll-area"],
  "files": {
    "data-table.jsx": "sha256-…",
    "data-table.css": "sha256-…"
  }
}
```

### Design decisions

- **Sidecar, not a root lockfile.** The sidecar travels with the folder, so
  copying a component into another project keeps its provenance — that *is* the
  copy-paste property. A root `van.lock.json` diffs more nicely but creates
  two sources of truth that silently diverge the moment someone hand-copies a
  directory. Need a project-wide view? Derive it by globbing; never store a
  second copy.

- **`files` hashes are the load-bearing field.** They are what separates
  "unmodified, safe to overwrite" from "customized, must merge". Without them
  `update` is guesswork. **Never overwrite a file whose hash does not match the
  recorded one without explicit confirmation** — silently destroying a
  consumer's customizations is the worst failure this system can have, and it is
  worse than refusing to update.

- **Provenance only — no theming config.** It is tempting to put
  `button: { radius: "9999px" }` here. Do not: `van.config.json` (task 37)
  owns theming, and splitting a theme across 60 sidecars means there is no single
  place to read your theme.

- **Unknown fields are preserved, never stripped.** An older CLI must not destroy
  a field a newer one wrote.

- **One monotonic kit version, independent release windows** (decided
  2026-07-26). Components land and ship on their own schedule — no coordinated
  release train — but `kitVersion` records the *kit* version at release time, not
  a per-component semver. Rationale: the substrate (tokens, `lib/` primitives, the
  19 cross-component import edges) cannot version per component; tasks 34 and 35
  both hit the missing `--space-1-5` and that one gap retuned eight components at
  once. And **the diamond problem has no escape hatch in copy-paste** — npm
  survives conflicting ranges by nesting two copies in `node_modules`, but there
  is exactly one `ui/table/table.jsx` path and one CSS cascade, so
  `data-table` needing `table@^2` while `sidebar` needs `table@^1` is
  unresolvable and surfaces as broken styling rather than a clean error. A single
  linear history reduces "compatible" to "kitVersion >= N". `kitVersion` can
  become a range later without breaking the format, so full per-component semver
  stays available if real selectively-upgrading consumers appear.

- **This is an install-time boundary, not a runtime one.** Nothing stops
  `ui/button` importing `ui/tooltip` at runtime whatever `requires` says. The
  manifest is a lint contract in the sense of Go's `vendor/modules.txt`. Say so
  in the docs so nobody mistakes it for enforced isolation.

## The conformance suite

One test walking every `ui/*/`, asserting what HANDOFF already requires:

- tokens only — no hex, no raw `rgb()`/`hsl()`, no `--shadow-xs`
- no hard-coded durations or easings, **except** indeterminate loops, which must
  use a fixed literal and never a motion token (they must not track
  `--motion-scale`) — allowlist those by selector
- block class matches the directory name; variants are `block--modifier`
- a `playground/pages/<slug>.jsx` and a `playground/registry.js` entry exist, and
  **no two slugs share a page module** (that bug was real — three date slugs
  pointed at one page until `0f48e2fe84de`)
- interactive components have `tests/<slug>.test.mjs`; pure-node tests are named
  `*.unit.mjs`
- **the actual import graph matches every manifest's `requires`** — this is the
  check that keeps the manifest honest, and the reason the two halves are one task

Failures must name the file and the rule. A conformance error that does not say
what to do is worse than no check.

## Sub-tasks

- [x] 1. Manifest schema + reader/writer that round-trips unknown fields. Files:
  `scripts/manifest.mjs`, `tests/manifest.unit.mjs`.
- [x] 2. Generate manifests for all existing `ui/*/` from the current tree; commit
  them. Expect the `requires` derivation to surface import edges nobody
  documented — there are 19 today. *(Actual: 36 edges across 14 components —
  data-table 8, form-fields 8, sidebar 5 grew after the estimate.)*
- [x] 3. Conformance suite over the static rules (tokens, naming, demo page,
  registry uniqueness, test presence). Files: `tests/conformance.unit.mjs`.
- [x] 4. Import-graph check against `requires`, including a cycle check.
- [ ] 5. Wire into `npm test`; fix whatever it finds (expect a real backlog).
- [ ] 6. Docs: the manifest format, the install-time-not-runtime caveat, and how
  to add a component that passes conformance.

## Verify / done

- `node tests/run.mjs` green; `npm run build` clean; conformance green.
- Deliberately break each rule once and confirm the failure message names the
  file and the rule. An unverified checker is the same problem as an unverified
  manifest.
- Hand-edit a component file and confirm the recorded hash no longer matches —
  that is the signal `update` will depend on.

## Follow-on (not this task)

`van update` with 3-way merge (base = recorded `kitVersion`, ours = local,
theirs = upstream). It is the biggest payoff — the original kit cannot take upstream fixes
into an edited component at all — and the easiest to make destructive. It needs
its own task and its own tests, after this manifest lands.
