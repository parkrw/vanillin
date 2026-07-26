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

This matters because upstream's core property — and ours — is copy-paste
independence: one file, copied, works. A blanket "components must use each other
everywhere" mandate destroys that. If `ui/button` imports `ui/tooltip` which
imports `ui/popover`, copying Button drags in a third of the kit. Upstream
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
- [x] 2. `ui/form` composes `ui/field` + `ui/label`. Public export names and
  rendered DOM must not change — the existing form tests are the contract.
  `FormLabel` → `Label`, `FormDescription` → `FieldDescription`,
  `FormMessage` → `FieldError`. No test changed; verified against the live page
  that tag, `id`, `role`, `for` and `data-error` are byte-identical and each
  element gained exactly one class (`field-description` / `field-error`).
  Three notes:
  - **`FieldError` gained an `as` prop** (default `div`). `FormMessage` is a
    `<p>`, and `as` is the kit's polymorphism convention, so this was the way to
    compose without changing form's tag.
  - **Precedence differs and is resolved in `form.jsx`.** `FormMessage` lets the
    engine's error win over `children`; `FieldError` prefers `children`. Form
    resolves the body itself and passes one child, so `FieldError` keeps its own
    contract.
  - **One deliberate rendering change:** `.form-description` / `.form-message`
    never set `margin: 0`, and globals.css has no `p` reset, so both carried UA
    `margin-block: 1em` *on top of* `.form-item`'s `gap: 0.5rem` — 14px of
    unintended spacing (flex items don't collapse margins). `field-description`
    already sets `margin: 0`; `margin: 0` added to `.field-error` to match (a
    no-op for its default `div`). Verified by screenshot.
  - **`FormItem` was left alone.** It duplicates `.field`'s flex column, but
    `Field` renders `role="group"` + `data-orientation`, and adding a group per
    field changes the a11y tree. That is a real decision, not a refactor
    side-effect — it needs its own call, and the contract here forbids DOM
    changes.
- [x] 3. Consolidate chips: one implementation, `ui/combobox` consumes it.
  **It lives in `ui/badge` as a `Chip` export**, not its own slug: a chip *is* a
  badge with a dismiss affordance, so `Chip` renders
  `<Badge variant="secondary" className="badge--chip">` and inherits the base
  geometry, focus ring and icon sizing; only the pill deltas are new CSS. A new
  slug would also have needed a `playground/registry.js` entry, which task 59
  owns this batch. Only two implementations existed, not three — `grep -rn chip
  ui lib playground` finds `ui/combobox` and nothing else; the third was
  `ui/badge` itself. `.combobox-chip` survives as the in-field hook and the
  selector `tests/combobox.test.mjs` uses, so no combobox test changed.
  `combobox.css` now `@import`s `badge.css` (the `alert-dialog` → `dialog`
  precedent). One deliberate change: the old chip's literal `0.25rem`/`0.5rem`
  padding became `--space-1`/`--space-2`, so chips now scale with
  `--density-scale` like the input group they sit in.
- [ ] 4. `ui/data-table` → `ui/scroll-area`, with column pinning intact.
- [ ] 5. Wire `lib/use-highlight.js` into `ui/data-table` search matches.
- [x] 6. Write the rule into `docs/HANDOFF.md` conventions so the next fan-out
  briefs agents to *reuse named components*, and assigns any shared file to
  exactly one owner with the others reporting requests. Landed as the first
  bullet of "Conventions (must match)".

## Verify / done

- `node tests/run.mjs` green (560/560 at time of writing); `npm run build` clean.
- Sub-task 2 changes no test. If a form test needs editing, the DOM changed and
  that is a regression, not a test problem.
- Every registry slug resolves to its own page — no two slugs sharing a module.
- Grep for the composition you just added and confirm no cycle: `ui/field` must
  not import `ui/form`.

## File ownership (batch 59/60/63)

Sub-tasks 1, 2 and 6 are **done** — do not redo them. Remaining: 3 (chips),
4 (`ui/data-table` → `ui/scroll-area`), 5 (wire `lib/use-highlight.js`).

You own `ui/badge/`, `ui/combobox/`, `ui/data-table/`, `ui/scroll-area/` and
`lib/use-highlight.js`. Do **not** touch `playground/registry.js` (task 59 owns
it this batch — if sub-task 3 needs a new slug registered, report the exact line
you want added and leave it out of your branch), `styles/globals.css` (task 60
owns it — report missing tokens, do not add them), or `ui/form/` and
`lib/use-form.js` (task 59).
