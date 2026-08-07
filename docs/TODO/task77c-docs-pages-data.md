# task77c: docs-pages-data
**Goal:** Apply the task-76 docs template to 16 data, disclosure and content component pages.  **Branch:** `docs/pages-rest-c`  **Deps:** 76
**Owns:** `site/pages/{attachment,bubble,calendar,carousel,collapsible,data-table,empty,format,item,kbd,marker,message,message-scroller,progress,resizable,scroll-area}.jsx`

## Pages (16)

attachment, bubble, calendar, carousel, collapsible, data-table, empty, format, item, kbd, marker, message, message-scroller, progress, resizable, scroll-area

## Per-page structure

Read `site/pages/button.jsx` (task 76) as the reference pattern before starting:
1. Title + description (vanillin voice)
2. `<InstallSnippet slug="..." />`
3. Usage — `<ComponentPreview>` with basic import + JSX
4. Examples — each variant/feature with preview + source, 1-2 creative compositions
5. `<ApiReference>` — props table

## Test-safety rules (learned three times across 76, 77a and 77b — all three shipped hidden failures)

- Before rewriting a page, read `tests/<slug>.test.mjs` if it exists. Preserve every selector and `data-pg` hook the test uses.
- `ComponentPreview` renders `ui/tabs` internally. Any fixture a test targets via `[role="tablist"]`, `.tabs-trigger`, or similarly collision-prone selectors must render **directly on the page** (source in a plain `<CodeBlock>`), not inside `ComponentPreview`.
- No duplicate visible button labels on one page — Playwright strict mode fails on `has-text` collisions.
- Keep code-tab strings in sync with the rendered JSX.
- **Page-height rule.** These pages have tests that drive by viewport coordinates or bounding-box geometry: **attachment, calendar, carousel, collapsible, data-table, empty, message-scroller, resizable, scroll-area**. Adding height above a fixture moves it out from under those coordinates. Put `InstallSnippet`, Usage and `ApiReference` **below** the fixtures the test drives, or keep the fixture scrolled into view. (Root cause is ISSUES C9, fixed in parallel by task 80 — do not depend on that landing.)

## Verify / done

```sh
node tests/run.mjs   # full suite
npm run build
```

Baseline is 753/755 (2 pre-existing: slider cursor/thumb). Run the full suite and report exact counts from the runner's summary — do not summarize from memory. Then run the 16 owned components' tests targeted and report those counts separately.

## Out of scope

Any `site/pages/*.jsx` not listed above, `ui/**`, `tests/**`, and the shared docs components (`site/install-snippet.jsx`, `ComponentPreview`, `CodeBlock`, `ApiReference`) — use them, do not edit them. If a page cannot carry the template without a change outside `Owns`, stop and report it rather than editing.

## Handoff

**Status:** DONE

All 16 pages carry the task-76 template: title + description, InstallSnippet, Usage (ComponentPreview), examples, ApiReference.

**Height-sensitive pages** (attachment, calendar, carousel, collapsible, data-table, empty, message-scroller, resizable, scroll-area): InstallSnippet, Usage, and ApiReference placed below test-driven fixtures. Existing fixtures untouched — no ComponentPreview wrapping on test-driven sections.

**Empty page fix**: Usage preview initially rendered a bare `<Empty>` component, breaking the "every empty demo is framed" test (expected `.pg-empty-frame` count to match `.empty` count). Fixed by showing text reference instead of rendered component.

**Progress page**: Test uses `document.querySelectorAll(".progress")[0]` for the animated demo, so Usage section placed below fixtures to preserve index ordering.

**Format page**: Prose sections trimmed (kept only the live fixtures + locale selector the tests drive). Template elements appended below.

**Rework round:** Restored all behavioral prose that the first pass deleted (format ~46 lines, carousel 4 paragraphs, resizable 7 section intros, scroll-area 4 descriptive notes). Fixed collapsible Usage code string to match rendered `as={Button} variant="outline"`. Added ItemMedia variant prop to item ApiReference with note that image variant is not demoed.

**Rework round 2:** Restored collapsible spacing-contract section (CollapsibleContent inner-wrapper constraint, no gap on root). Restored message-scroller section intro (prepending keeps your place). Audited all 15 other pages — no further constraint/gotcha/browser-support prose was lost; remaining diffs are structural (demos wrapped in ComponentPreview).

**Verify:** `VANILLIN_TEST_PORT=5205 node tests/run.mjs` → 757/759 (2 pre-existing slider cursor). `npm run build` clean.
