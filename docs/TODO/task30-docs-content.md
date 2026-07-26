# task30: docs-content

**Goal:** final consistency and gap pass across every playground page —
enforce the structural rules, backfill prose that earlier tasks failed to
ship, and leave a machine-checkable definition of "page is documented."

**Branch:** `feat/docs-content`
**Deps:** 58 (runs last, after every other task)

## Why

The 2026-07-26 policy says each task ships its own docs in the same PR as
the code. In practice most tasks shipped demos only — at snapshot time
(2026-07-26, `feat/phase-2`) roughly 55 of 70 component pages carry zero
explanatory prose. A handful of pages added inline paragraphs (badge,
command, data-table, date-picker, drawer, format, message-scroller, select,
status-dot, toast, use-form); the rest are live examples with headings. The
gap is wide enough that a dedicated pass is justified, but the scope is
**consistency and backfill**, not a rewrite of pages that already have prose.

## Audit method (re-run before starting)

This audit is a snapshot. Twelve tasks are in flight and will change pages
before task 30 starts. Re-run it; the method matters more than the table.

```bash
# 1. Prose detection: pages with at least one rendered <p> in page-level JSX
for f in playground/pages/*.jsx playground/pages/docs/*.jsx; do
  words=$(grep -oP '(?<=>)[^<]+' "$f" \
    | grep -vP '^\s*$' \
    | wc -w | tr -d ' ')
  h2s=$(grep -c '<h2' "$f")
  echo "$(basename "$f" .jsx)  words=$words  h2=$h2s"
done

# 2. Cross-reference: registry vs ui/ vs pages/
comm -23 <(ls -1 ui/ | sort) \
  <(grep -oP '^\s+"?([a-z][-a-z]*)"?\s*:' playground/registry.js \
    | sed 's/[: "]*//g' | sort)
```

### Snapshot (2026-07-26, feat/phase-2)

| Page             | Prose? | ~Words | Gaps                                        |
|------------------|--------|-------:|---------------------------------------------|
| badge            | yes    |    110 | no intro paragraph; variant prose only       |
| command          | yes    |    110 | inline only; no intro                        |
| data-table       | yes    |    160 | partial; filtering prose, no column API      |
| date-picker      | yes    |    220 | best-documented page; shared by 3 aliases    |
| drawer           | yes    |     50 | swipe thresholds only                        |
| format           | yes    |    200 | good per-section prose                       |
| message-scroller | yes    |     25 | one behavioral note                          |
| select           | yes    |    130 | good; alignItemWithTrigger explained         |
| status-dot       | yes    |    175 | good; covers token families                  |
| toast            | yes    |     40 | swipe-dismiss note only                      |
| use-form         | yes    |    450 | full API docs; model page                    |
| primitives       | yes    |     10 | one sentence; lib/ overview                  |
| docs/introduction| yes    |     75 | thin — what vanillin is, not how to use it   |
| docs/installation| stub   |     55 | self-identifies as stub; awaits CLI (38)     |
| docs/theming     | yes    |    530 | fully fleshed out                            |
| typography       | no     |      0 | demos only; **2 h2s** (demo `<h2>` breaks tests) |
| *(~54 others)*   | no     |      0 | demos only — h3 labels + live examples       |

**Structural notes:** every page except typography has exactly one `<h2>`;
typography renders a second inside a demo, breaking `locator("h2")` tests.
No page has a props table — inline prose is the house style. Cross-reference
is clean; `date-input`/`time-picker` alias `date-picker.jsx`.

## Design decisions

- **Define "documented" with a checkable rule, then enforce it.** A page is
  documented when it has: (a) one `<h2>` title and only one, (b) an intro
  `<p>` immediately after the `<h2>` saying what the component is and when to
  reach for it (1-3 sentences), and (c) at least one demo section. Props
  tables are not required — inline prose per demo section is the house style.

- **Do not rewrite pages that already have prose.** If a page's task shipped
  explanatory text, leave it. Fix only structural violations (heading level,
  missing intro `<p>`, duplicate h2) and factual errors.

- **Backfill intros, not full docs.** For the ~54 demos-only pages, add a
  1-3 sentence intro `<p>` after the `<h2>`. Do not invent new demo sections
  or reorganize existing ones. The intro says what the component is, one
  distinguishing trait, and (if non-obvious) when to use it vs. an
  alternative.

- **Fix typography's double h2.** Wrap the demo heading in a non-h2 element
  so `locator("h2")` matches one element.

- **Fill the installation stub only if task 38 did not.** If the CLI landed,
  installation should already reflect it. If 38 is still open, write proper
  manual-copy steps and mark the CLI as forthcoming.

- **Flesh out the introduction page.** Feature list, "vanillin vs. upstream"
  blurb, pointer to theming. Under 300 words.

## Sub-tasks

- [ ] 1. Re-run the audit method above; update the snapshot table in this
  file with current findings. Expect the numbers to shift — tasks 34-58
  will have landed prose on several pages.
  Files: `docs/TODO/task30-docs-content.md`

- [ ] 2. Fix every structural violation: pages with != 1 `<h2>`, wrong
  heading hierarchy (h4 after h2, skipped levels). Currently only
  `typography.jsx` is known; the re-run may find others.
  Files: `playground/pages/typography.jsx`, any others surfaced by step 1

- [ ] 3. Add intro `<p>` to every component page that still lacks one after
  all prior tasks have landed. One to three sentences: what, trait, when.
  Do not touch pages that already open with prose.
  Files: `playground/pages/*.jsx` (only those missing intros)

- [ ] 4. Flesh out `docs/introduction.jsx` — feature list, comparison blurb,
  theming pointer. Under 300 words.
  Files: `playground/pages/docs/introduction.jsx`

- [ ] 5. Fill `docs/installation.jsx` if task 38 has not. Manual steps if no
  CLI; CLI-first if 38 landed.
  Files: `playground/pages/docs/installation.jsx`

- [ ] 6. Sweep for factual drift — component names, prop names, or behaviors
  described in prose that no longer match the code (token renames from 33-35,
  API changes from 43/45/47). Correct prose to match code; do not change code.
  Files: any page with existing prose (see audit table)

- [ ] 7. Verify the "documented" rule holds for every page: one h2, intro
  `<p>`, at least one demo. Write a quick Node script that asserts this
  against every `playground/pages/*.jsx` and fails CI if a future PR
  regresses it.
  Files: `tests/docs-structure.unit.mjs`

## Verify / done

- `node tests/run.mjs` green — no test broke from heading or content changes.
- `npm run build` clean.
- Every `playground/pages/*.jsx` has exactly one `<h2>` and an intro `<p>`.
- `docs/introduction.jsx` is no longer thin; `docs/installation.jsx` is no
  longer a stub.
- `tests/docs-structure.unit.mjs` passes and would catch a missing intro or
  duplicate h2.
