# task117: substrate-sidecars
**Goal:** `lib/` and `styles/` join the hash-tracked update path. Today three of the four things a consumer has on disk (`lib/`, `styles/`, orphaned components) sit outside the update system entirely — the single biggest gap in the backwards-compat story.  **Branch:** `feat/substrate-sidecars`  **Deps:** none — but 118/119/120 edit the same files; this task goes first and they serialize behind it
**Owns:** `scripts/manifest.mjs`, `bin/van.mjs`, `tests/cli.unit.mjs`, `tests/conformance.unit.mjs` (new rules), `registry.json` (regenerated)

Line numbers measured 2026-08-27 on `bin/van.mjs`; re-verify.

## The three findings this closes

1. **`lib/` files have no recorded hash, so every difference reads as a consumer edit.** `bin/van.mjs:380-384` (verified — the comment admits it: "No sidecar covers lib/ … a difference cannot be attributed and is treated as an edit"). Consequences, both bad in opposite directions:
   - `van update` rewrites `ui/dialog/dialog.jsx` against a new `usePresence` signature while **leaving the consumer's stale `lib/use-presence.js` in place**, prints the dim "differs, use --overwrite" line without counting it as updated or conflicted, and can still exit 0 saying "all components up to date". Runtime break from a clean-exit update.
   - `van update --overwrite` then clobbers a `lib/` file the consumer genuinely edited, with no merge and no detection.
2. **`styles/` is written once at `init` and never again.** `bin/van.mjs:150-151` (`STYLESHEETS = ["globals.css", "defaults.css", "forced-colors.css"]`, verified) is consumed only inside `cmdInit` (`:489-497`). New tokens never reach existing consumers: a future component referencing them renders unstyled with no diagnostic, and `van build` validation (which reads the *consumer's* `globals.css` — `scripts/build-theme.mjs:386-393`) hard-fails on configs naming the new token. There is no safe refresh: `init --overwrite` also destroys `van.config.json`.
3. **`lib/` copies never get the `"use client"` injection.** The `:380` `readFileSync` bypasses `kitFileContent` (`:289-296`), which is where RSC injection lives. `lib/direction.jsx` calls `createContext` at module scope, so importing `DirectionProvider` into a Next root layout — the natural place — throws at build. (Most lib hooks escape via import-graph inheritance from a `"use client"` component, which is why nobody has hit it.)
4. **Bonus, same seam:** `styles/typeset.css` is generated *for* consumers (its `--typeset-*` tokens land in `defaults.css`, its preset classes land in the consumer's `van.css`) but is **not in `STYLESHEETS`**, so consumers get preset classes with no stylesheet to power them. Add it.

## Design — reuse, don't invent

One new sidecar per directory, same shape and same writer as `ui/`'s:

- `lib/.van.json` — `{ schemaVersion?, kitVersion, files: { "<file>": "<hash>" } }` covering every file `registry.json`'s `lib` union references. Written by `scripts/manifest.mjs` alongside the component sidecars; conformance suite gains a rule that it exists, hashes match, and covers exactly the union of registry `lib` entries.
- `styles/.van.json` — same, over `STYLESHEETS` (now including `typeset.css`).
- `cmdAdd`: when copying a lib file, route contents through `kitFileContent`-equivalent injection (RSC `"use client"` for `.jsx` lib files — decide whether plain `.js` hooks get it too; they should when `framework` is Next+rsc, same rule as `ui/`), and record the written hash in the **consumer's** `lib/.van.json` (create on first add). Consumer styles sidecar written at `init`.
- `cmdUpdate`: lib and styles files get the same three-state classification as `ui/` files (`unchanged` / `upstream-changed` → overwrite / `edited` → skip loudly / `diverged` → merge path once task120 lands; until then, diverged = conflict report, never silent). The dim "differs, use --overwrite" line dies; `lib`/`styles` outcomes join the updated/conflicted counts and the exit code.
- `van diff`: report lib/styles drift with the same vocabulary as components.
- Migration: a consumer with no `lib/.van.json` (every existing install) gets one seeded on the next `add`/`update`: hash-match against the current kit → recorded as current; mismatch → recorded as *absent* (state stays "edited"/unattributable, exactly today's semantics — never fabricate provenance).

## Sub-tasks

- [ ] 1. `scripts/manifest.mjs`: emit `lib/.van.json` + `styles/.van.json`; keep canonical key order and unknown-key preservation (`:51-54`) — those behaviors are load-bearing for forward compat.
- [ ] 2. Conformance rules: sidecars exist, hashes fresh, lib coverage == registry union, styles coverage == STYLESHEETS. Failure messages name the regen command (`npm run contracts`), house style.
- [ ] 3. `STYLESHEETS` += `typeset.css`; README repo-layout table gains the row.
- [ ] 4. `cmdAdd`: injection + consumer-side sidecar writes; blockedLib logic (`:690`) updated to consult the recorded hash instead of assuming edit.
- [ ] 5. `cmdUpdate` + `cmdDiff`: full three-state handling for lib/styles, counts and exit codes, migration seeding.
- [ ] 6. CLI tests: fresh init→add→update round-trip; upstream-changed lib file updates cleanly; consumer-edited lib file is skipped *and counted*; stale-styles case (new token in kit globals) refreshes and `van build` passes; the Next-rsc lib injection case.

## Verify / done

```sh
npm run contracts && git diff --exit-code   # regenerated sidecars committed
node tests/run.mjs cli conformance
npm test > out.txt 2>&1 && grep ^FAIL out.txt
```

Done when: a consumer fixture can take a kit-side `lib/` change through `van update` with exit 0 *and the file actually updated* (red today — write this test first), an edited lib file is never silently overwritten without `--overwrite`, and `git diff` on a clean tree after `npm run contracts` is empty.

## Out of scope

The merge-base fetch (task120), ENOENT/rename hardening (task118), `schemaVersion` fields (task119 — but leave room: don't hard-code the sidecar key set anywhere new).

## Handoff

**Status:** NOT STARTED
