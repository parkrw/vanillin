# task120: base-retrieval
**Goal:** `van update`'s 3-way merge base becomes reachable from a real consumer install. Today it never is — the feature has never executed successfully outside the kit's own git checkout.  **Branch:** `feat/base-retrieval`  **Deps:** 118 (merge-path changes; serialize behind it), 110 sub-task 2 (tags must exist for the URL scheme)
**Owns:** `bin/van.mjs` (`getBaseContent` and the update paths that consume it), `tests/cli.unit.mjs`

## The finding

`getBaseContent` (`bin/van.mjs:396-408`) runs `git show v${kitVersion}:ui/<slug>/<rel>` with `cwd: kitRoot` — the *installed kit directory*. Two independent fatal failures:

1. **No tags exist** (`git tag -l` is empty as of 2026-08-27; task110 cuts the first). Every sidecar says `0.1.0`, so every diverged file hits the `if (!base)` branch (`:900-906`) and `van update` exits 1 with "no base at v0.1.0, use --overwrite".
2. **Even with tags, `.git` is never in an install.** `npm i -D github:…` and `npx github:…` pack a tarball; npm's always-excluded list drops `.git`. `spawnSync("git", ["show", …])` fails in every real consumer project regardless of tags. The design only ever worked from a git clone of the kit itself — corroborated by the test suite: the only base-retrieval test (`tests/cli.unit.mjs:465-479`) asserts the *failure* branch.

## Design

Layered retrieval, first hit wins, every layer hash-verified against the sidecar's recorded hash (the sidecar already stores exactly the base's hash — that's the beauty of the existing design; a fetched base that doesn't hash-match is **discarded**, never merged):

1. **Local git** (current behavior) — free when the kit is a clone; keep it.
2. **HTTPS fetch**: `https://raw.githubusercontent.com/parkrw/vanillin/v<kitVersion>/<path>` via Node 18+ global `fetch` — stdlib, zero-dep rule intact. Derive the URL host/path from the sidecar's `source` field (`github:parkrw/vanillin@v0.1.0`, written at `scripts/manifest.mjs:200`) rather than hardcoding the repo — forks and renames then work for free. Timeout (a few seconds), no retries beyond one, and batch: fetch only files classified `diverged` (the only state that needs a base).
3. **Offline / fetch-failed degradation**: exactly today's skip-and-report per file ("no base for X: offline or tag missing; use --overwrite or retry online") — degraded, loud, never destructive. Exit code stays non-zero when diverged files went unmerged.

Explicitly rejected (record in the file so nobody re-proposes): vendoring every historical base blob into the tarball — unbounded growth; a content-addressed `.van/base/` store written at `add`-time — doubles every component on consumer disk for a file needed only at update, and historical installs don't have it anyway.

## Sub-tasks

- [ ] 1. Extract `getBaseContent` into the layered resolver; hash verification against the sidecar before returning any base.
- [ ] 2. URL derivation from `source`; handle the `github:` → raw-URL mapping and a sidecar with a missing/foreign `source` (skip layer 2, degrade).
- [ ] 3. Tests, all offline-safe: layer 1 via a git fixture (tag + clone in the sandbox — this plus task118's work finally covers `merged.clean === true` over the real retrieval path); layer 2 via injecting a fetch stub (module seam — keep `fetch` an injectable on the resolver, default `globalThis.fetch`, so the test needs no network); hash-mismatch discard; offline degradation message + exit code.
- [ ] 4. One manual end-to-end against the real network, from a scratch `npm i -D github:parkrw/vanillin#v0.1.0` project — user-gated (needs the pushed tag); record the transcript in the Handoff.

## Verify / done

```sh
node tests/run.mjs cli
npm test > out.txt 2>&1 && grep ^FAIL out.txt
```

Done when: a consumer fixture with an edited file and a kit-side change to the same file merges cleanly through layer 2 with the network stubbed (red today at every layer), a hash-mismatched fetch is provably discarded (test), and offline behavior is byte-for-byte today's skip-and-report.

## Out of scope

Changing merge semantics (118 owns that), an HTTP registry (rejected in task 38's spec — this fetches *base blobs for files the consumer already has*, not a distribution channel; note the distinction in the code comment because it will be asked).

## Handoff

**Status:** NOT STARTED
