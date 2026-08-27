# task118: update-hardening
**Goal:** `van update`/`van diff` survive the changes a living kit will actually make — renamed, split, or deleted files and retired components — and the merge never destroys work it didn't back up.  **Branch:** `fix/update-hardening`  **Deps:** 117 (same files; serialize behind it)
**Owns:** `bin/van.mjs` (diff/update/merge paths), `scripts/build-registry.mjs` (deprecation field), `tests/cli.unit.mjs`

Line numbers measured 2026-08-27 pre-117; re-verify — 117 will have moved them.

## Findings

1. **Upstream file removal crashes `van update` mid-write.** `diffComponent` builds `rels` from the **union** of current kit files and recorded files (`bin/van.mjs:762`), then the update loop calls `kitFileContent` unconditionally (`:872-873`), which is a bare `readFileSync` (`:289-290`) — a recorded-but-now-absent file throws raw ENOENT outside any try/catch. Some files are already written (`writeFileAtomic` per file), the sidecar rewrite (`:932-944`) hasn't happened: **partially updated component, stale sidecar, stack trace.** Until fixed, the kit cannot rename, split, or delete a component file without breaking every consumer's update — the exact class of change a compat promise must survive.
2. **No state for "upstream removed this."** A recorded file the kit no longer ships, still present locally, classifies as `upstream-changed` (`:775-777`, `kit === null`) — the wrong label. Add a `removed` state: unedited local copy → delete it (with say-line); edited → keep, report "upstream removed this file; yours is kept," never delete silently.
3. **Deleted components vanish silently.** `cmdDiff` (`:808`) and `cmdUpdate` (`:850`) filter `installed` to `registry.components[slug]` — an installed component the kit dropped is skipped without a word; `van diff` then reports "✓ N components match". Fix two-sided: (a) report installed-but-unknown components in both commands; (b) a `deprecated` field in registry entries (`scripts/build-registry.mjs:41-46` currently emits `{type, files, requires, lib}`) sourced from an optional per-component marker — decide the source (a key in the component's own `.van.json`? a top-level map in a checked-in `deprecations.json`? pick one, record why in DECISIONS) — so retirement is announced for N versions before removal. Tombstones beat silence.
4. **The merge is destructive-by-default.** `mergeFile` (`:414-431`) + the update loop (`:907-918`): the merged content — conflict markers included — is written **before** the clean check, no backup, no prompt. A JSX file with markers is a syntax error; if the consumer's tree isn't committed, the pre-merge content is gone. Fixes: write `<file>.orig` (or refuse to write markers unless `--merge-markers` is passed — pick one; sonner-style `.orig` matches git conventions and is the recommendation); add `maxBuffer` to the `spawnSync` (default 1 MB silently truncates and the truncated result is what gets written today).
5. **Per-component `clean` flag mis-records cleanly-merged siblings.** `clean` is component-granular (`:932`): one conflicted file suppresses the sidecar bump for *all* files, so siblings that merged cleanly sit on disk at the new version with old hashes recorded — permanently misclassified as `diverged`. Record per-file: bump hashes for files that merged clean or copied clean, leave only the conflicted file's entry at the old hash.
6. **The merge success path has zero tests.** `tests/cli.unit.mjs:465-479` asserts only the no-base failure branch. Whatever base source exists after task120, this task adds the fixture that exercises `merged.clean === true` end-to-end (a local-git-clone kit fixture works today: tags + `.git` present in the test sandbox — don't wait for 120).

## Sub-tasks

- [ ] 1. Guard the union loop: hoist `kitFileContent` into the branches that need it / `existsSync` check; wrap the update loop's per-file work so one file's failure reports and continues (never a raw stack).
- [ ] 2. `removed` file state + behavior above; test both the unedited-delete and edited-keep cases.
- [ ] 3. Installed-but-unknown reporting in `diff` and `update`; `deprecated` registry field + say-line; conformance/registry test.
- [ ] 4. `.orig` backup + `maxBuffer`; test that a conflict leaves both the marked file and the pristine `.orig`.
- [ ] 5. Per-file sidecar recording on partial merges; test: two-file component, one conflicts, assert the clean file's hash advanced and the conflicted one didn't.
- [ ] 6. The clean-merge end-to-end test (git-clone fixture).

## Verify / done

```sh
node tests/run.mjs cli
npm test > out.txt 2>&1 && grep ^FAIL out.txt
```

Done when: a kit-side file rename round-trips through `van update` on a consumer fixture without a crash (red today — write first), every new state has a test, and no code path can write a consumer file without either a recorded hash advance or a backup.

## Out of scope

Where the merge base comes from (task120), format versioning (task119), the interactive conflict UX (a future `van update --interactive` is backlog).

## Handoff

**Status:** NOT STARTED
