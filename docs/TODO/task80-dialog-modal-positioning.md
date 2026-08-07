# task80: dialog-modal-positioning
**Goal:** Make an open `<dialog>` position against the viewport again (ISSUES C9), then restore the full docs template on the drawer and sheet pages that the bug blocked.  **Branch:** `fix/dialog-modal-positioning`  **Deps:** none
**Owns:** `ui/dialog/**`, `site/pages/{drawer,sheet}.jsx`, `tests/{dialog,drawer,sheet,alert-dialog}.test.mjs`

## The bug

`ui/dialog/dialog.css:7` sets `position: relative` on `.dialog`. That beats the UA stylesheet's `:modal { position: fixed }`, so an open dialog — and every drawer and sheet, which reuse `.dialog` — anchors to the **document** instead of the viewport. On a page taller than the viewport a bottom drawer renders below the fold: measured flush-bottom expected 720, got 170 once the page gained an `InstallSnippet`.

The blast radius is not the docs site. Any consumer page taller than the viewport gets an off-screen drawer.

`position: relative` was added for task 39's `container-type: inline-size` container. Whatever the fix is, `@container vanillin-dialog` queries must keep working.

**Lead worth trying first:** `container-type: inline-size` already applies `contain: layout`, which by itself makes `.dialog` a containing block for absolutely-positioned descendants — `.dialog-close` (`ui/dialog/dialog.css:74`) and drawer's handle (`ui/drawer/drawer.css:87`) are the two that matter. So `position: relative` may be plain redundant. Delete it and measure before designing anything more elaborate.

## Sub-tasks

- [ ] 1. **Reproduce.** Add a failing test: a fixture page taller than the viewport (~2x), scrolled to the top, opens a bottom drawer; assert the drawer's `getBoundingClientRect().bottom` is within a few px of `window.innerHeight`. It must fail on the current tree — a test that passes now proves nothing. Files: `tests/drawer.test.mjs`.
- [ ] 2. **Fix `.dialog`.** Restore viewport positioning without losing the container. Verify both: an open dialog reports `position: fixed` (computed style), and a `@container vanillin-dialog` rule still resolves — grep for the existing container queries in `ui/dialog/` and the components that reuse it, and assert one of them at a real width. Files: `ui/dialog/dialog.css`.
- [ ] 3. **Regression-guard the container.** A test that narrows the dialog and asserts the container-query-driven style actually applied, so a future `contain` change cannot silently kill it. Files: `tests/dialog.test.mjs`.
- [ ] 4. **Restore the drawer + sheet docs pages.** Task 77b skipped `<InstallSnippet>` and `<ApiReference>` on both because the added height triggered this bug. Add them, matching `site/pages/button.jsx`. Files: `site/pages/{drawer,sheet}.jsx`.
- [ ] 5. **Re-verify the pages that were height-constrained.** `tests/{drawer,sheet}.test.mjs` were passing only because those fixture pages stayed short. With the fix they should pass at full height — if a test still depends on page height, it is asserting the bug; fix the test.

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

**Status:** NOT STARTED
