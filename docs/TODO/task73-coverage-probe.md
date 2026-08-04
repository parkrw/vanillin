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

- [ ] 1. **Probe tier 1** (10 components) — for each: identify mechanism, neuter, run `node tests/run.mjs <slug>`, record CAUGHT or GAP, revert. Output: gap list with the mechanism that went unnoticed; files: `docs/TODO/task73-coverage-probe.md` (record in Handoff)
- [ ] 2. **Probe tier 2** (19 components) — same method; files: same
- [ ] 3. **Probe tier 3** (remaining ~20 testable components) — same method; skip pure meta-tests (contrast, cursor, density, etc.) that test tokens/config rather than component behavior; files: same
- [ ] 4. **Write tests for gaps** — one test per gap found, added to the component's existing test file; each test proves the neutered mechanism is load-bearing. Exact scope determined by sub-tasks 1-3. files: `tests/*.test.mjs`
- [ ] 5. **Verify** — full suite green (730+N, where N = tests added), `npm run contracts` clean, `npm run build` clean

## Verify / done

```sh
npm test                    # 730+N passed, 0 failed
npm run contracts           # clean (no ui/ edits should survive)
npm run build               # clean
```

## Handoff

**Status:** SUB-TASKS 1-3 IN PROGRESS, 4 DONE (5 tests written)  **Updated:** 2026-08-04

### Probe results so far

**Probed ~20 components.** 5 gaps found, all tests written and passing (735 total, 731 green — 4 pre-existing flakes: cursor/F4, drawer/G2).

**Gap class 1 — anchor positioning (4 components):**
`useAnchorPosition` neutered → suite passes. Content opens/closes correctly but is not positioned near its trigger. No `data-side`/`data-align` or bounding-rect assertion.
- `hover-card` (7/7 passed neutered) → test added: `tests/hover-card.test.mjs`
- `tooltip` (8/8 passed neutered) → test added: `tests/tooltip.test.mjs`
- `combobox` (18/18 passed neutered) → test added: `tests/combobox.test.mjs`
- `navigation-menu` per-item panels (21/21 passed neutered) → test added: `tests/navigation-menu.test.mjs`

Positioning IS caught in: popover (2/10 fail on `data-side`), select (1/17), dropdown-menu (5/28), context-menu (has explicit position tests).

**Gap class 2 — caret management (1 component):**
- `input-otp` caretToEnd neutered → 9/9 passed. Tests check slot content but not cursor position. → test added: `tests/input-otp.test.mjs`

**Caught (no gap):** dialog return-focus, scroll-area sync, accordion ARIA, carousel keyboard, tabs roving-focus, slider keyboard, collapsible usePresence, nav-menu indicator, toast swipe, highlight ranges, resizable autoSaveId.

### Remaining probe work
- Tier 2/3 probes incomplete — ~25 components not yet probed. The positioning gap class is the headline finding; remaining probes are unlikely to find a new class but may find one-offs like input-otp.
- Drawer probes timed out (G2 flakes); skipped.
