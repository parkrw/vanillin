# task84: token-guard
**Goal:** Fail the build when a CSS file reads a custom property that nothing defines, so the generated/hand-written token seam cannot drift silently.  **Branch:** `fix/token-guard`  **Deps:** none
**Owns:** `scripts/check-tokens.mjs`, `tests/check-tokens.unit.mjs`, `package.json` (one script entry), `styles/globals.css` (`@property` additions only), `tests/run.mjs` (sub-task 5 only)

## Read this first: nothing is broken today

This task came from a report that `styles/typeset.css` read five `--typeset-*` tokens `styles/defaults.css` did not define, so every heading computed an invalid `calc()` while `npm run build` passed clean. **It does not reproduce.** Measured 2026-08-07 on `main` at `b0650f0`:

- All six `--typeset-*` tokens read by `typeset.css` and `ui/typography` **are** defined in `defaults.css`.
- Both files landed in the **same commit**, `4ad8d502ed06` — there is no lag between them.
- At runtime the page computes `h1` 36px/39.6px, `h2` 21px, `h3`/`p` 14px/21px, correct font stacks. No invalid `calc()`.
- `docs/ISSUES.md` has no `ui-styles-lag-vanillin` entry.

So this is **preventive, not a fix.** Size it accordingly and do not go looking for the bug — it is not there. What is real is the failure *mode*: a `var()` miss inside `calc()` is invalid at computed-value time, and neither `npm run build` (vite never resolves custom properties) nor `tests/run.mjs` can see it. The kit has a genuine seam — `van.defaults.json` → generated `defaults.css`, hand-written `styles/typeset.css` and 68 component stylesheets — where a future drift is possible. This closes it before it costs anything.

## The one real gap found while measuring

`--typeset-font-body`, `--typeset-font-heading` and `--typeset-font-mono` have **no `@property` declaration**, while `--typeset-size`, `--typeset-leading` and `--typeset-flow` do (`styles/globals.css`). An `@property` with an `initial-value` means a missing token degrades to that value instead of invalidating the declaration — which is exactly why the reported failure could not have happened for the three rhythm vars even if the tokens *had* been missing. The three font tokens are unguarded. That is a two-line hardening, and it is sub-task 3.

## The hard part: runtime-set tokens

A naive "read but not defined" diff reports **17 false positives**. Measured:

```
--accordion-content-height   --collapsible-content-height  --dt-group-depth
--exit-scale                 --hit-margin                  --indicator-offset
--indicator-width            --scroll-area-thumb-height     --scroll-area-thumb-width
--sidebar-width              --sidebar-width-icon           --skeleton-width
--toast-index                --toast-offset                 --toast-z
--viewport-height            --viewport-width
```

Every one is legitimately absent from CSS because JS sets it — either `el.style.setProperty(...)` (`ui/navigation-menu/navigation-menu.jsx:573`, `ui/accordion/accordion.jsx:150`, `ui/drawer/drawer.jsx:83`, `ui/toast/toast.jsx:322`, `ui/scroll-area/scroll-area.jsx:99`) or an inline `style={{"--x": …}}` in JSX. **A tool that reports these is noise and will be ignored within a week**, which is the actual risk to this task — not missing a real drift.

Two traps in detecting them, both hit while scoping:

- `setProperty` is not always called with a string literal. `ui/scroll-area/scroll-area.jsx:99` passes a ternary: `setProperty(vertical ? "--scroll-area-thumb-height" : "--scroll-area-thumb-width", …)`. A `setProperty\(\s*"` regex silently misses it and the token reports as missing.
- Inline JSX style objects (`"--sidebar-width": …`) are a second, differently-shaped source. Eight tokens come in only this way.

Prefer scanning for **any occurrence of the token name in a `.jsx`/`.js` file** over trying to parse the call shape. It is cruder and it is right more often here: a token named in JS is a token JS owns.

## Sub-tasks

- [x] 1. **`scripts/check-tokens.mjs`.** Collect every `var(--x)` across `styles/*.css` and `ui/*/*.css`; collect every definition (declaration in any block, plus `@property`); collect every token named anywhere in `ui/**/*.jsx` and `lib/**`. Report reads that match none of the three. Static only — no browser, no dev server, so it is fast enough to be a build step.
- [x] 2. **Wire it in.** `npm run check:tokens`, and call it from whatever `npm run build` already runs. Exit non-zero on a finding — this is a gate, unlike `sweep-pages.mjs` and `probe-stacking.mjs`, which are instruments that exit 0 on findings. Say so in the file header so nobody "fixes" the inconsistency.
- [ ] 3. **`@property` for the three font tokens** in `styles/globals.css`, with `syntax: "*"` (a font stack is not a typed grammar) and an `initial-value` matching the current `defaults.css` stack.
- [ ] 4. **Prove it catches the reported bug — as a committed test.** Export the checker's core as a function that takes a root directory, and write `tests/check-tokens.unit.mjs` (pure Node, runs first like the other `*.unit.mjs`): a temp fixture tree with one `var(--missing)` read reports exactly that token; the same fixture with the token defined in CSS, then with it named only in a `.jsx`, reports nothing; and the real repo root reports nothing. Never commit a deliberate break of `defaults.css`.
- [ ] 5. **ISSUES H4, remaining half — `tests/run.mjs` fails fast when its vite child dies.** The busy-port refusal already landed (`tests/run.mjs:18-26`, commit `0a3f51954733`); do not redo it. What is still missing: `waitForServer()` polls for up to 15s even when the spawned vite has already exited, so a vite crash reads as "dev server did not start" 15s late with no exit code. Fix: attach `vite.on("exit", …)` before `waitForServer` and reject immediately with the exit code and signal. Verify: `VANILLIN_TEST_PORT=1 node tests/run.mjs badge` (unprivileged bind fails) exits non-zero within ~2s naming vite's exit code; with a free port the run is unchanged. If you can make that a committed test without spawning Chrome (a seam such as an env var pointing the runner at a stub vite bin is acceptable), do; if not, record the manual check in the Handoff and say why. files: `tests/run.mjs`

## Verify / done

```sh
node scripts/check-tokens.mjs   # exits 0, reports nothing on a clean tree
npm run build
VANILLIN_TEST_PORT=5201 node tests/run.mjs > out.txt 2>&1; grep -c '^PASS' out.txt; grep '^FAIL' out.txt
```

Baseline: **811/811** on 2026-08-27 (`07961519da8d`, idle machine, exit 0) — no known failures. This task adds one unit suite and should otherwise not move the count; name any `FAIL` line in the report, a bare count cannot be reviewed.

Done when: the checker reports **zero** findings on a clean tree (17 false positives means sub-task 1 is not finished), fails on a deliberately deleted token, and runs as part of the build.

## Out of scope

Anything visual. This is a static checker; it cannot see contrast, layout or stacking — those are `sweep-pages.mjs`, `contrast-nontext.mjs` and `probe-stacking.mjs` (task 83). Also out: checking that a token's *value* is sensible, and the `site/` stylesheets, whose tokens are the docs site's own and not shipped to consumers.

## Handoff

**Status:** NOT STARTED
