# task65: component-update
**Goal:** `van update` — 3-way merge for edited components with upstream changes  **Branch:** feat/component-update  **Deps:** 64, 38
**Owns:** `bin/van.mjs`, `tests/cli.unit.mjs`

## Sub-tasks
- [x] 1. Base retrieval + 3-way merge utility — `getBaseContent()` via `git show v${kitVersion}:…`, `mergeFile()` via `git merge-file`, RSC transform on base; files: `bin/van.mjs`
- [x] 2. `planUpdate` + `cmdUpdate` — classify installed components via `diffComponent`, apply overwrite/merge/skip per state, update manifests, summary output; files: `bin/van.mjs`
- [x] 3. CLI wiring — switch case, USAGE string, update command word; files: `bin/van.mjs`
- [x] 4. Tests — all file states, merge paths, --overwrite, --dry-run, no-args-updates-all; files: `tests/cli.unit.mjs`

## Design

File states from `diffComponent` → update actions:
- `current` → skip (up to date)
- `upstream-changed` → overwrite (consumer didn't edit, safe)
- `edited` → skip (upstream didn't change, nothing to merge)
- `diverged` → 3-way merge (both changed)
- `deleted` → skip + report
- `untracked` → skip + report

3-way merge:
- Base: `git show v${recordedKitVersion}:ui/<slug>/<file>` from kitRoot
- Merge: `git merge-file` via `spawnSync` — exits 0 clean, 1 conflicts
- RSC: apply `kitFileContent` transform to base content too
- No tag available: skip with message (degrades gracefully)

Manifest update:
- Clean update → new kitVersion + hashes of written bytes
- Conflicts → file written with markers, manifest keeps old kitVersion (so `diff` still shows diverged)

Lib files: no sidecar, same as `add` — skip if different unless `--overwrite`.

Exit codes: 0 = all clean, 1 = any conflicts/skipped edits.

## Verify / done
```
node tests/run.mjs cli
```
All existing CLI tests pass + new update tests pass.

## Handoff

**Status:** COMPLETE
**Branch:** feat/component-update (merged)  **PR:** none (local merge)  **Updated:** 2026-08-04

- **Landed:** `van update [slug...]` — overwrites upstream-changed files, 3-way merges diverged via `git merge-file`, skips consumer-edited. Base retrieval from git tags, degrades gracefully. Supports `--dry-run`, `--overwrite`.
- **Repo state:** `docs/task65-checkpoint` branch has the docs checkpoint commit, needs merge to main.
- **Next:** task 66 (config-schema-json) — generated `van.schema.json` for editor autocomplete.
- **Gotchas:** 3-way merge path untestable end-to-end until the kit has a second version tag. The diverged-no-base fallback path IS tested.
