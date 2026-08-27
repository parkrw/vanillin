# task122: webkit-ci
**Goal:** A second engine in CI. Every platform-API claim the kit makes is currently a Chrome claim — `tests/run.mjs:66-68` launches `channel: "chrome"`, and the workflow runs it on one engine. One WebKit job converts every Safari unknown into a known.  **Branch:** `feat/webkit-ci`  **Deps:** none
**Owns:** `tests/run.mjs` (browser selection), `.github/workflows/deploy.yml` (one added job), `docs/ISSUES.md` (new section for WebKit findings — this task *files*, follow-ups fix)

## Why WebKit first (not Firefox)

The kit rides the Popover API, `@starting-style`, `light-dark()`, scroll-snap, pointer capture — the family where WebKit historically diverges from Chromium the most, and Playwright's WebKit build is a `playwright-core` download away (already a devDependency). Firefox can follow later with the same switch. The highest-risk components, from the 2026-08-27 audit:

- `ui/select` item-aligned mode (`select.jsx:363-456`): measure → `showPopover()` → re-measure → scroll mutate, tuned against Chrome's layout-flush timing — `docs/QUIRKS.md` documents the `@starting-style` rect-corruption workaround this dance depends on.
- Every popover-family exit animation: the `overlay` transition property is Chromium-only (14 CSS sites), so Safari/Firefox drop the panel out of the top layer the instant `hidePopover()` runs — task123 owns the fix; this task gets the evidence.
- `ui/toast` swipe (pointer capture + `touch-action: none`) and removal gated on `getAnimations()`.
- `ui/message-scroller` imperative `scrollTop` writes under momentum scrolling.

## Approach — a gate for the safe set, an instrument for the rest

Expect real failures on day one. Do **not** weaken tests to get a green WebKit run, and do not block deploys on a brand-new engine's noise floor:

1. `tests/run.mjs`: a `VANILLIN_BROWSER=webkit|firefox|chrome` env switch (`playwright-core`'s `webkit.launch()` — no `channel`), default unchanged. Document that WebKit needs `npx playwright-core install webkit` locally (CI installs it in the job).
2. Run the full suite under WebKit once, locally, and triage every failure into: (a) real kit bug → file in `docs/ISSUES.md` under a new **W** section with the failing test named; (b) test assumes Chrome (timing, `getAnimations` shapes, scrollbar metrics) → fix the test to assert outcomes both engines can satisfy; (c) known-unsupported feature degrading as designed (`overlay`, `field-sizing`) → per-test skip **with the reason and the tracking item**, via an explicit engine-skip helper, never a silent allowlist.
3. CI: a `test-webkit` job, `continue-on-error: true` initially (the Pages deploy gate stays Chrome-only), flipped to required in a follow-up once the W section is burned down. Say both halves of that plan in the workflow comment so the soft gate doesn't fossilize.
4. Suite mechanics to watch (from `tests/run.mjs`'s own comments): all suites share one page — engine-specific state leaks may differ; the port pin + `--strictPort` behavior is engine-independent but the WebKit job needs its own `VANILLIN_TEST_PORT` if jobs ever share a runner.

## Sub-tasks

- [ ] 1. Browser switch in `tests/run.mjs`.
- [ ] 2. Full local WebKit run; triage table (test → a/b/c → action) goes in this file's Handoff verbatim — that table is the deliverable the follow-up tasks are cut from.
- [ ] 3. Category-(b) test fixes; category-(c) skip helper + skips with reasons.
- [ ] 4. `docs/ISSUES.md` W-section for category (a), each entry naming test, symptom, suspected mechanism.
- [ ] 5. The CI job (`continue-on-error`, webkit install step, artifact-upload the output log).

## Verify / done

```sh
VANILLIN_BROWSER=webkit node tests/run.mjs > wk.txt 2>&1; grep -c ^FAIL wk.txt   # count matches the triage table exactly
node tests/run.mjs > chrome.txt 2>&1; grep ^FAIL chrome.txt                      # Chrome baseline unmoved
```

Done when: the Chrome suite is untouched-green, the WebKit run's failures are 100% triaged (every FAIL is either fixed, skipped-with-reason, or a W-item — zero unexplained), and the CI job runs on PRs. A bare pass count is not evidence — name the failing tests (house rule).

## Out of scope

Fixing category-(a) bugs (each becomes its own task from the W section — except anything trivially small, fix-small-things-yourself rule applies), Firefox (same switch, later), visual screenshot diffing.

## Handoff

**Status:** NOT STARTED
