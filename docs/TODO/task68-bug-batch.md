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

- [ ] 3. **C3 — stray `htmlFor` on radiogroup labels.** `ui/form/form.jsx:119`
      always sets `htmlFor={formItemId}`; `<label for>` cannot bind to
      `<div role="radiogroup">`. Fix in `ui/form`, then the
      `aria-labelledby` workaround at `ui/form-fields/form-fields.jsx:301,328`
      becomes belt-and-braces — leave it, update its comment.
      — test: a radiogroup form field renders no `for` attribute; a text field
      still does.
      files: `ui/form/form.jsx`, `tests/form.test.mjs`

- [ ] 4. **D7 — `ui/switch` thumb ignores writing direction.**
      `switch.css:37,42` uses physical `translateX`, so a checked switch in RTL
      travels out of its track — the real cause of "the switch on the Direction
      page looks broken". Use the kit's existing convention (`:dir(rtl)`, as
      `ui/data-table/data-table.css:295,389-393`).
      — test: checked thumb offset is mirrored under `dir="rtl"` vs `ltr`;
      assert the *sign* of the offset, not just a non-zero value (see 9).
      files: `ui/switch/switch.css`, `tests/switch.test.mjs`

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
