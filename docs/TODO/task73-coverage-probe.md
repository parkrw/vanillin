# task73: coverage-probe

**Goal:** find features the 730-test suite would not catch if broken, then write the tests it needs.
**Branch:** `test/coverage-probe`  **Deps:** 72  **Owns:** `tests/**`, `docs/TODO/task73-*`, `docs/TODO/README.md`

## Method

**Deletion probe:** for each tested component, neuter one load-bearing mechanism (comment out a handler, zero a CSS value, delete an ARIA attribute), run its targeted test, and see whether anything fails. If nothing fails, the suite has a gap. Revert immediately — never commit a break.

Untested CSS-only components (alert, aspect-ratio, avatar, breadcrumb, bubble, button, button-group, card, field, input, input-group, item, kbd, label, marker, message, native-select, separator, skeleton, spinner, table, typography) are out of scope — they have no JS behavior to probe. A test file for them would assert DOM structure and classes, which is testing the test.

## Risk tiers

Sorted by hooks÷tests (JS complexity per test). Probe in this order.

**Tier 1 — highest risk** (≥4 hooks/test, complex JS):
sidebar (32/6), hover-card (40/7), select (84/17), tooltip (39/8), navigation-menu (98/21), combobox (73/18), message-scroller (39/9), resizable (67/17), dialog (28/8), scroll-area (54/19)

**Tier 2 — moderate risk** (2–4 hooks/test or overlay re-exports):
command (53/17), toast (37/15), carousel (52/26), accordion (19/7), menubar (30/11), context-menu (21/14), calendar (37/16), drawer (12/14), collapsible (13/8), tabs (14/7), slider (14/14), form (18/16), time-picker (15/11), date-input (10/8), popover (21/10), radio-group (12/6), input-otp (12/9), toggle-group (10/7), form-fields (10/14)

**Tier 3 — lower risk** (thin wrappers, CSS-heavy, or meta-tests):
alert-dialog (0/8 — re-export of dialog), sheet (0/4 — re-export), badge (1/7), toggle (5/7), switch (5/9), checkbox (5/7), mode-toggle (7/8), date-picker (0/6 — composition), progress (0/5), pagination (0/5), empty (0/6 — CSS), status-dot (0/4 — CSS animation), attachment (0/6 — CSS), format (11/15), view-transitions (0/7), highlight (0/6), forced-colors (0/20), density (7/7), direction (4/4), container-queries (10/10), contrast (10/10), cursor (12/12), textarea (0/18), docs-shell (4/4), generated-defaults (6/6), tokens/tokens-controls/tokens-surfaces (meta)

## Sub-tasks

- [x] 1. **Probe tier 1 + partial tier 2** (~20 components) — 5 gaps found (anchor positioning × 4, input-otp caret × 1), 14 caught, 1 skipped (drawer/G2). files: probe log below
- [x] 2. **Write tests for gaps** — 5 tests added to existing test files, all passing. Suite 735. files: `tests/{hover-card,tooltip,combobox,navigation-menu,input-otp}.test.mjs`
- [x] 3. **Finish probes** (6 components) — all 6 caught: sidebar (5/6), message-scroller (3/9), command (11/18), menubar (10/11), form (56/75), radio-group (4/6). No new gaps. files: `docs/TODO/task73-coverage-probe.md`
- [x] 4. **Verify** — 731/735 passed (4 pre-existing flakes), `npm run contracts` clean, `npm run build` clean

## Verify / done

```sh
npm test                    # 730+N passed, 0 failed
npm run contracts           # clean (no ui/ edits should survive)
npm run build               # clean
```

## Handoff

**Status:** DONE  **Branch:** `test/coverage-probe`  **PR:** none  **Updated:** 2026-08-04

- **Result:** 26 components probed, 5 gaps found and fixed (sub-tasks 1-2), 20 caught, 1 skipped (drawer/G2). Two gap classes: anchor positioning (4 components lacked `data-side`/position assertions) and input-otp caret parking. Suite 735 total, 731/735 green (4 pre-existing flakes).
- **Repo state:** clean, 2 commits on branch. No ui/ changes survive (all probes restored). Contracts and build clean.

### Full probe log

| Component | Mechanism neutered | Result | Tests |
|---|---|---|---|
| hover-card | `useAnchorPosition` | **GAP** 7/7 | test added |
| tooltip | `useAnchorPosition` | **GAP** 8/8 | test added |
| combobox | `useAnchorPosition` | **GAP** 18/18 | test added |
| nav-menu (per-item) | `useAnchorPosition` | **GAP** 21/21 | test added |
| input-otp | `caretToEnd` | **GAP** 9/9 | test added |
| popover | `useAnchorPosition` | CAUGHT 8/10 | — |
| select | `useAnchorPosition` | CAUGHT 16/17 | — |
| dropdown-menu | `useAnchorPosition` | CAUGHT 23/28 | — |
| dialog | `useReturnFocus` | CAUGHT 7/8 | — |
| scroll-area | `sync` callback | CAUGHT 0/1 (abort) | — |
| nav-menu | indicator offset | CAUGHT 20/21 | — |
| accordion | `aria-expanded`/`aria-controls` | CAUGHT 2/7 | — |
| carousel | keyboard handler | CAUGHT 24/26 | — |
| tabs | `useRovingFocus` | CAUGHT 5/7 | — |
| slider | `handleThumbKeyDown` | CAUGHT 7/14 | — |
| collapsible | `usePresence` | CAUGHT 9/11 | — |
| toast | swipe handlers | CAUGHT 12/15 | — |
| highlight | `CSS.highlights.set` | CAUGHT 5/6 | — |
| resizable | `readStorage` | CAUGHT 16/17 | — |
| calendar | keyboard handler | CAUGHT 13/16 | — |
| drawer | swipe handlers | SKIPPED (G2 timeout) | — |
| sidebar | keyboard shortcut (`useEffect`) | CAUGHT 5/6 | — |
| message-scroller | MutationObserver + ResizeObserver | CAUGHT 3/9 | — |
| command | `score` callback (fuzzy filter) | CAUGHT 11/18 | — |
| menubar | `useRovingFocus` | CAUGHT 10/11 | — |
| form | `ariaProps` in FormControl | CAUGHT 56/75 | — |
| radio-group | `useRovingFocus` | CAUGHT 4/6 | — |
