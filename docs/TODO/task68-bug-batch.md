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

- [x] 5. **C5 — attachment group scroll eats the outer edge borders.** Done:
      `76c28b8da75b`. Diagnosis held; line numbers had drifted again (rule was
      `199-209`, the `mask-image` `202-208`, against `198-206` here and
      `195-205` in ISSUES). Insets the viewport by a new
      `--attachment-group-fade`. **`scroll-padding-inline` was the non-obvious
      half** — mandatory snap aligns card starts to the snapport, so
      `padding-inline` alone would have fixed only the `scrollLeft: 0` resting
      position and re-broken every other snap point. Chrome workaround
      untouched. `tests/attachment.test.mjs` was **new** (no browser suite
      existed) and samples painted pixels, since a masked border still reports
      full `border-width` in computed style.

- [x] 6. **E2 — collapsible end-of-animation jump.** Done: `913325d47400`.
      **Both suspected causes were falsified by per-frame measurement** and the
      fix landed in neither listed file. No fractional endpoint (`scrollHeight
      86` vs rect `86.0000`); `forwards` holds `0` for ~9 frames, so no early
      release. Open jumps at the **head** (mount frame), not the tail. Real
      cause: `height: 0` cannot collapse the box — `border-box` floors it at the
      content's own padding, and a zero-height flex child still occupies its
      slot in the root's `gap`, 8px each, both released in one frame at
      mount/unmount. Fixed as a **spacing contract** on `site/pages/collapsible.jsx`
      with `ui/collapsible/` untouched, because `ui/accordion` already ships the
      inner wrapper this needs (`accordion.jsx:157`). **The assertion this
      sub-task specified would have passed against the broken code** — see 9.
      Catching it needs a pair: content height at the endpoint is 0, *and* the
      root box step across the boundary is 0; each alone passes the other's
      mechanism.

- [x] 7. **C4 — data-table resize overlaps row content.** Done: `6e0d45a6167c`.
      Cause held, prescription needed two corrections: **`white-space: nowrap`
      is required** (without it anything containing a space wraps instead of
      clipping per character) and **`min-width: 0` is not** — a `<td>` under
      `table-layout: fixed` takes its width from the column and ignores content
      min-width, so it would have been dead CSS. **Body cells only**:
      `overflow: hidden` on a `<th>` clips the resizer handle, which sits 2px
      outside the header box. Adds a stacked-mode stand-down, since a card is as
      wide as its row and must wrap. Test is behavioural — it hit-tests a point
      inside the neighbouring cell — and restores column widths *before*
      asserting, because this suite shares one page and a mid-test failure
      leaks state into the pinning cases.

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
      **Three instances came out of sub-tasks 5–7 — start from them**, they are
      written up under H1 in `docs/ISSUES.md`: E2's specified assertion passed
      against broken code and needed a *pair* of checks; C5's borders reported
      full `border-width` while painting at ~0 alpha, so masked/filtered/
      transformed properties must be sampled as pixels; and the browser suites
      share one page per component, so an early-returning test leaks state into
      later ones.
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

**Status:** IN PROGRESS — 7 of 9 done, 8 and 9 left
**Branch:** four unmerged branches, unpushed, no PRs  **Updated:** 2026-07-30

- **Landed:** sub-tasks 1–7.
  - `main`: 1 (E1), 2 (C2), 3 (C3) — the original `fix/bug-batch` was merged and
    deleted.
  - `fix/bug-batch-2` (from that merge): 4 (D7) — `066fb6a22a2e`, `da1ea95caac5`.
  - `fix/c5-attachment-borders`: 5 (C5) — `76c28b8da75b`.
  - `fix/e2-collapsible-jump`: 6 (E2) — `913325d47400`.
  - `fix/c4-data-table-resize`: 7 (C4) — `6e0d45a6167c`.
- **The last three ran concurrently in git worktrees** (`../vanillin-c5-attachment`,
  `-e2-collapsible`, `-c4-data-table`), each branched from `da1ea95caac5`. They
  are mutually disjoint by file; `.van.json` manifests are per-component, so
  even those do not overlap. **Merging is the user's** — `git merge` is denied.
- **Two follow-ups staged but uncommitted**, both mine, both after their worker
  pane had exited: `tests/attachment.test.mjs` in the C5 worktree (adds the
  missing `scrollPaddingInlineEnd` assertion) and `site/pages/collapsible.jsx`
  in the E2 worktree (moves the spacing-contract note into its own
  `pg-section`). Each verified green where it sits.
- **Repo state:** every worktree's suite verified by the head, not just the
  worker: C5 698 total with its 4 new cases green, E2 **698/698** zero FAIL, C4
  **695/695** zero FAIL, all three with `npm run contracts` clean and
  `npm run build` green.
  (`stash@{0}` "On main: whoops" predates all of this — not ours, left alone.)
- **Next:** sub-task 8, **D8** — `site/pages/empty.jsx` sits further left than
  every other page. Confirm it is a missing `.pg-section` wrapper before
  touching `ui/empty`. Then 9 (H1), which now has three concrete starting points
  written up under H1 in `docs/ISSUES.md`.
- **Gotchas:**
  - **Line numbers drift, every time.** C3's moved 301,328 → 294,321; C5's rule
    was at `199-209` against `198-206` here and `195-205` in ISSUES; E2's
    `13-33` was `15` + `18-34`. D7's were the only accurate ones. Re-check
    before editing.
  - **The `files:` lists are wishes, not inventories.** Sub-task 2 named a
    `tests/use-form.unit.mjs` that does not exist, 4 needed a fixture page it
    did not list, 5's `tests/attachment.test.mjs` had to be created, and 6's fix
    landed in neither listed file.
  - **Two sub-tasks' stated diagnoses were wrong** (E2 entirely, C4's
    prescription partly). Verify by measurement before implementing; both were
    caught only because the worker probed first.
  - A worker's report claimed "no commits, staged only" two minutes *after* it
    had committed. Check `git log` yourself.
  - Concurrent suites need distinct `VANILLIN_TEST_PORT`s, and CPU contention
    produces flakes — G2 (drawer) fired twice and a new G4 (navigation-menu)
    appeared, all clean in isolation.
  - Run `npm run contracts` after any `ui/` edit or `npm test` fails.
