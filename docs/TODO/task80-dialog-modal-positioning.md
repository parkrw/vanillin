# task80: dialog-modal-positioning
**Goal:** Make an open `<dialog>` position against the viewport again (ISSUES C9), then restore the full docs template on the drawer and sheet pages that the bug blocked.  **Branch:** `fix/dialog-modal-positioning`  **Deps:** none
**Owns:** `ui/dialog/**`, `site/pages/{drawer,sheet}.jsx`, `tests/{dialog,drawer,sheet,alert-dialog}.test.mjs`

## The bug

`ui/dialog/dialog.css:7` sets `position: relative` on `.dialog`. That beats the UA stylesheet's `:modal { position: fixed }`, so an open dialog — and every drawer and sheet, which reuse `.dialog` — anchors to the **document** instead of the viewport. On a page taller than the viewport a bottom drawer renders below the fold: measured flush-bottom expected 720, got 170 once the page gained an `InstallSnippet`.

The blast radius is not the docs site. Any consumer page taller than the viewport gets an off-screen drawer.

`position: relative` was added for task 39's `container-type: inline-size` container. Whatever the fix is, `@container vanillin-dialog` queries must keep working.

**Lead worth trying first:** `container-type: inline-size` already applies `contain: layout`, which by itself makes `.dialog` a containing block for absolutely-positioned descendants — `.dialog-close` (`ui/dialog/dialog.css:74`) and drawer's handle (`ui/drawer/drawer.css:87`) are the two that matter. So `position: relative` may be plain redundant. Delete it and measure before designing anything more elaborate.

## Sub-tasks

- [x] 1. **Reproduce.** Add a failing test: a fixture page taller than the viewport (~2x), scrolled to the top, opens a bottom drawer; assert the drawer's `getBoundingClientRect().bottom` is within a few px of `window.innerHeight`. It must fail on the current tree — a test that passes now proves nothing. Files: `tests/drawer.test.mjs`.
- [x] 2. **Fix `.dialog`.** Restore viewport positioning without losing the container. Verify both: an open dialog reports `position: fixed` (computed style), and a `@container vanillin-dialog` rule still resolves — grep for the existing container queries in `ui/dialog/` and the components that reuse it, and assert one of them at a real width. Files: `ui/dialog/dialog.css`.
- [x] 3. **Regression-guard the container.** A test that narrows the dialog and asserts the container-query-driven style actually applied, so a future `contain` change cannot silently kill it. Files: `tests/dialog.test.mjs`.
- [x] 4. **Restore the drawer + sheet docs pages.** Task 77b skipped `<InstallSnippet>` and `<ApiReference>` on both because the added height triggered this bug. Add them, matching `site/pages/button.jsx`. Files: `site/pages/{drawer,sheet}.jsx`.
- [x] 5. **Re-verify the pages that were height-constrained.** `tests/{drawer,sheet}.test.mjs` were passing only because those fixture pages stayed short. With the fix they should pass at full height — if a test still depends on page height, it is asserting the bug; fix the test.

## Verify / done

```sh
node tests/run.mjs   # full suite
npm run build
```

Baseline is 753/755 (2 pre-existing: slider cursor/thumb). Run the full suite and report exact counts from the runner's summary — do not summarize from memory. Then run the four owned tests targeted and report their counts separately.

Done when: an open dialog computes to `position: fixed`, the container query still resolves, the taller-than-viewport drawer test passes, and the drawer + sheet pages carry the full template.

## Out of scope

Other components' pages, `site/pages/*.jsx` beyond drawer and sheet, and the two pre-existing slider failures. If the fix appears to require touching a file outside `Owns`, stop and report it rather than editing.

## Handoff

**Status:** DONE

**What landed (5 commits on `fix/dialog-modal-positioning`):**

1. `e3cb03a` test(drawer): add viewport-anchoring test for tall pages — injects a 2× viewport spacer, opens a bottom drawer, asserts `getBoundingClientRect().bottom ≈ window.innerHeight`. Confirmed failing before the fix (`expected 720±1, got 170`).
2. `cf0373a` fix(dialog): remove position:relative that broke viewport anchoring — deleted `position: relative` from `.dialog` in `dialog.css:7`. `container-type: inline-size` already applies `contain: layout`, which establishes the containing block for `.dialog-close` and drawer handle. The removed rule overrode the UA `:modal { position: fixed }`, causing dialogs/drawers/sheets to anchor to the document instead of the viewport on tall pages.
3. `27a9457` test(dialog): regression-guard container query at wide and narrow widths — asserts `text-align` and `flex-direction` flip between the wide (32rem) and narrow (320px) dialog, proving `@container vanillin-dialog (min-width: 24rem)` resolves.
4. `6000f58` docs(drawer,sheet): restore InstallSnippet and ApiReference — adds the `<InstallSnippet>` and `<ApiReference>` that task 77b skipped because the extra height triggered this bug.
5. `66521ad` test(drawer): assert position:fixed and clean up diagnostics — adds explicit `eq(position, "fixed")` to the first drawer test.

**Verify output:**
- `node tests/run.mjs` → 759/761 passed (2 pre-existing: slider cursor/thumb)
- `npm run build` → clean
- `node tests/run.mjs dialog drawer sheet alert-dialog` → 35/35 passed

**Surprises:**
- Stale Vite dev-server processes on `:5199` from previous test runs caused phantom failures: the old server served pre-fix CSS. Killing them before each run resolved it. The test runner's `vite.kill()` in its finally block doesn't always reap the child in time when runs overlap.
