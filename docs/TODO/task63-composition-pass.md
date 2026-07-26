# task63: composition-pass

**Goal:** make components reuse each other where the relationship is semantic,
and pay off the specific duplication that parallel development created.
**Branch:** feat/composition-pass
**Deps:** none hard. Sub-task 2 overlaps 59 — whoever gets there first does it.

## Why

Phase 2 was built by ~20 agents each given exclusive file ownership and told to
report rather than touch anything outside it. Twenty branches cherry-picked with
almost no conflicts, and that number is misleading: **the discipline that
produced it actively prevented components from composing**, because no agent ever
reused another's work (HANDOFF, "The composition problem").

## The rule

**Compose when the relationship is semantic; duplicate when it's incidental.**

This matters because shadcn's core property — and ours — is copy-paste
independence: one file, copied, works. A blanket "components must use each other
everywhere" mandate destroys that. If `ui/button` imports `ui/tooltip` which
imports `ui/popover`, copying Button drags in a third of the kit. shadcn
duplicates some things deliberately for exactly this reason.

Applying the rule:

- A form field genuinely **is** a field → `ui/form` must use `ui/field` and
  `ui/label`. Compose.
- A carousel arrow merely **looks like** a button → leave it. Importing `ui/button`
  there buys coupling and no cohesion.
- A combobox chip and a badge are the same visual primitive with the same
  meaning → consolidate.

When in doubt, ask whether a consumer copying the file alone would be surprised
by what came with it.

## Known debts

Each is verified, not speculative:

1. **`date-input` / `date-picker` / `time-picker` share one demo page** via three
   registry aliases (`playground/registry.js:40,41,81` all import
   `./pages/date-picker.jsx`). Two of the three components are effectively
   undocumented. Cheapest item here and pure win.
2. **`ui/form` reimplements label, description and message** instead of using
   `ui/field` and `ui/label` — it imports only React, `react-dom` and `lib/cn.js`.
   Semantic duplication, the clearest case for the rule above.
3. **Third chip implementation.** Task 44 built its own chips because it was told
   not to extend `ui/badge` — a merge-conflict decision that added a third
   chip-like thing to the kit.
4. **`ui/data-table` never uses `ui/scroll-area`** despite needing horizontal
   scrolling; it relies on `ui/table`'s raw `overflow: auto`. Note the
   interaction with column pinning (48) — pinned cells and overlay scrollbars
   both position against the scroll container, so do this one carefully and with
   the pinning tests in front of you.
5. **`lib/use-highlight.js` never wired into `ui/data-table`.** Task 55 deferred
   it; its report says what the follow-up needs.

## Sub-tasks

- [x] 1. Split the date demos: real `playground/pages/date-input.jsx` and
  `time-picker.jsx`, each carrying its own prose, registry pointed at them.
  Landed `0f48e2fe84de`. `tests/date-input.test.mjs` and
  `tests/time-picker.test.mjs` now drive their own slugs; their assertions were
  not touched. `CalendarIcon` stayed a per-page local — that is the existing
  playground convention (`command.jsx` has its own copy) and an icon in a demo
  page is incidental, not semantic.
- [ ] 2. `ui/form` composes `ui/field` + `ui/label`. Public export names and
  rendered DOM must not change — the existing form tests are the contract.
- [ ] 3. Consolidate chips: one implementation, `ui/combobox` consumes it.
  Decide explicitly whether it lives in `ui/badge` or its own slug and write the
  reason down.
- [ ] 4. `ui/data-table` → `ui/scroll-area`, with column pinning intact.
- [ ] 5. Wire `lib/use-highlight.js` into `ui/data-table` search matches.
- [ ] 6. Write the rule into `docs/HANDOFF.md` conventions so the next fan-out
  briefs agents to *reuse named components*, and assigns any shared file to
  exactly one owner with the others reporting requests.

## Verify / done

- `node tests/run.mjs` green (560/560 at time of writing); `npm run build` clean.
- Sub-task 2 changes no test. If a form test needs editing, the DOM changed and
  that is a regression, not a test problem.
- Every registry slug resolves to its own page — no two slugs sharing a module.
- Grep for the composition you just added and confirm no cycle: `ui/field` must
  not import `ui/form`.
