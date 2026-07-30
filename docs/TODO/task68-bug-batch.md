# task68: bug-batch
**Goal:** Clear the confirmed code bugs in `docs/ISSUES.md` — the motion glitches,
four component defects, and the test-quality gap.
**Branch:** `fix/bug-batch`  **Deps:** 39 (done — visual fixes land after the
container-query CSS rewrite, not before)

Scope is **known** bugs. The user's docs-site sweep stopped at `form-fields`, so
everything alphabetically after it is unswept; expect a sibling task later.

Not in scope: D1–D6 (the contrast family — one pass of its own), F1–F4 (cursor
affordance), G1–G3 (flakes), I1 (unverified).

## Sub-tasks

- [x] 1. **E1 — light/dark wipe, high priority.** Done: `d8183de` on this branch
      plus `fe125ed` on `feat/mode-toggle`, where the sweep now lives.
      Three real defects, none of them the suspected paint boundary: the
      duration silently fell back to 200ms (unregistered `calc()` token vs
      `parseFloat`) while the site runs `--motion-scale: 2.5`;
      `::view-transition-group(root)` kept its 250ms UA animation and outlasted
      the reveal; and `site/app.jsx` and the demo page each wrote `.dark`.
      **"Soften the leading edge" was dropped as impossible** — Chrome does not
      paint `mask-image` on view-transition pseudos at all, verified with a
      side-by-side probe. The reveal is `clip-path: ellipse()` plus an opacity
      ramp that carries the swept region through grey instead.

- [x] 2. **C2 — non-throwing form-context read.** Done: `3bbd2bb318d7`.
      `useFormContextSafe()` added, `FormContext` exported, the `try/catch` in
      `useBoundControl` gone. **The `FormProvider` path it guards had no test
      coverage** — every `form-fields` demo passed `control` explicitly — so the
      fix also adds a provider-path demo and two cases for it.
      Tests went in `tests/use-form.test.mjs` and `tests/form-fields.test.mjs`,
      **not** the `tests/use-form.unit.mjs` this sub-task named: that file does
      not exist, and a pure-node hook test would need a DOM the repo has no
      dependency for. Browser suite is the only seam.

- [x] 3. **C3 — stray `htmlFor` on radiogroup labels.** Done: `b730bab4e43a`.
      New `grouped` flag on `FormItem` — `FormLabel` drops `htmlFor` and takes
      an id, `FormControl` adds `aria-labelledby`. It had to go on the
      *ancestor*: `FormLabel` renders before `FormControl` and cannot learn what
      the control will be, and context only flows down.
      The `ui/form-fields` workaround was left in place with its comment
      updated, as specified. Also documents `grouped` on the form page
      (`site/pages/form.jsx`, "Grouped fields") and covers it in both
      `tests/form.test.mjs` and `tests/form-fields.test.mjs`.
      The workaround's line numbers had drifted from 301,328 to 294,321.

- [x] 4. **D7 — `ui/switch` thumb ignores writing direction.** Done:
      `066fb6a22a2e`. Diagnosis held and the line numbers were still accurate:
      `switch.css:37,42` used physical `translateX`. Only the checked rule
      needed mirroring — `translateX(0)` is direction-neutral — so the fix is
      one `:dir(rtl)` override, matching `ui/data-table/data-table.css:295`.
      **A third file was needed beyond the two listed:** `tests/switch.test.mjs`
      had no RTL switch to measure, and the repo's convention is an RTL fixture
      on the component's own page (`sa-rtl`, `cal-rtl`), not borrowing the
      Direction page — so `site/pages/switch.jsx` gained an RTL section
      (`sw-rtl`, `sw-rtl-off`) plus `sw-ltr` on the existing checked switch.
      Test asserts the offset sign flips, magnitudes mirror within 2px, and the
      thumb stays inside the track both ways. Confirmed load-bearing per 9:
      removing the `:dir(rtl)` rule fails the sign assertion.

- [ ] 5. **C5 — attachment group scroll eats the outer edge borders.** The
      `mask-image` at `ui/attachment/attachment.css:198-206` fades to
      `transparent` at both edges, so the first and last cards lose their outer
      border. Fade to the group's own inset instead of card zero. Keep the
      Chrome compositing workaround (mask on the outer div, scroll on the inner
      viewport) — it is commented as load-bearing.
      — test: first and last card each report a non-zero rendered border on the
      outer edge while the group is scrollable.
      files: `ui/attachment/attachment.css`, `tests/attachment.test.mjs`

- [ ] 6. **E2 — collapsible end-of-animation jump.** Tail of both open and close
      jumps. `ui/collapsible/collapsible.css:13-33` — measured-height keyframes
      plus `fill-mode: forwards` on close (the `usePresence` recipe). Suspect
      the `height: var(--collapsible-content-height)` endpoint landing on a
      fractional pixel, or the forwards hold releasing a frame early.
      — test: `tests/collapsible.test.mjs` green; measured height is monotonic
      across the final frames of both directions.
      files: `ui/collapsible/collapsible.css`, possibly
      `ui/collapsible/collapsible.jsx`

- [ ] 7. **C4 — data-table resize overlaps row content.** Narrowing a column
      makes cell text overlap its neighbour. Wanted: clip per character as the
      column shrinks and show `…` the moment the first character drops, giving
      up a second character for the ellipsis if needed — i.e. `text-overflow:
      ellipsis` needs `overflow: hidden` + `min-width: 0` on the cell, which
      `data-table.css` does not currently set on sized columns.
      — test: with a column resized below its text width, cell `scrollWidth >
      clientWidth` and the rendered text ends in an ellipsis; no overlap with
      the next cell's box.
      files: `ui/data-table/data-table.css`, `tests/data-table.test.mjs`

- [ ] 8. **D8 — empty-state page misalignment.** `site/pages/empty.jsx` sits
      further left than every other page. Likely a missing `.pg-section`
      wrapper rather than a component bug — confirm before touching `ui/empty`.
      — test: the page's section box aligns with a reference page's; visual
      check at :5173 `#empty`.
      files: `site/pages/empty.jsx` (or `site/site.css`)

- [ ] 9. **H1 — sweep assertions that hold for the wrong value.**
      `.data-table-pinned`'s `inset-inline-start === "0px"` was also true under
      `position: relative`, so pinning was broken for months while the test
      passed. Sweep the suite for the same class of gap and assert the
      precondition alongside the effect (`scrollLeft > 0` in that case).
      — test: the suite still passes; each amended assertion fails when its
      precondition is removed (verify by hand once, don't commit the break).
      files: `tests/*.test.mjs`, `tests/conformance.unit.mjs`

## Verify / done

```sh
npm run contracts   # any ui/ edit — manifests + registry, or npm test fails
npm test            # expect >= 679 plus new cases
npm run build
```

- Motion items (1, 6) QA'd under emulated `no-preference`, not just default.
- E1 checked in both directions of the swap, light→dark and dark→light.
- Each fixed item struck through in `docs/ISSUES.md` with its commit sha, matching
  how C1 is recorded.
- No new `docs/ISSUES.md` items silently absorbed — if the sweep turns up
  something new, it goes in ISSUES.md, not this branch.

## Handoff

**Status:** IN PROGRESS
**Branch:** `fix/bug-batch-2` (1 commit past `main`, unpushed)  **PR:** none  **Updated:** 2026-07-30

- **Landed:** sub-tasks 1–4. C2 — `useFormContextSafe()` + exported
  `FormContext`, no more `try/catch` around a hook. C3 — `FormItem grouped`
  drops `htmlFor` and switches the field to `aria-labelledby`, so no label
  aims `for` at a `<div role="radiogroup">`. D7 — `:dir(rtl)` mirror on the
  switch thumb, so a checked switch stays in its track in RTL.
- **Repo state:** clean. Full suite **694/694**, `npm run contracts` and
  `npm run build` green.
  (`stash@{0}` "On main: whoops" predates this work — not ours, left alone.)
- **Branch history:** the original `fix/bug-batch` was merged into `main` and
  deleted, so sub-tasks 1–3 are in `main`, not on a feature branch. Work
  continues on `fix/bug-batch-2`, cut from that merge commit.
- **Next:** sub-task 5, **C5** — attachment group `mask-image` at
  `ui/attachment/attachment.css:198-206` fades to `transparent` at both edges
  and eats the first/last card's outer border. Re-check those line numbers
  first. The Chrome compositing workaround (mask on the outer div, scroll on the
  inner viewport) is commented as load-bearing — keep it.
- **Gotchas:** line numbers in `docs/ISSUES.md` and in this file's sub-task
  bodies drift — C3's had moved 301,328 → 294,321; D7's `switch.css:37,42` was
  still accurate. Verify before editing either way. Sub-task 4 needed a third
  file the sub-task did not list (a fixture page); expect the same where a test
  needs a demo that does not exist yet. Sub-task 2 named a
  `tests/use-form.unit.mjs` that does not exist: pure-node hook tests need a DOM
  this repo has no dependency for, so form tests go in the browser suites.
  Run `npm run contracts` after any `ui/` edit or `npm test` fails.
