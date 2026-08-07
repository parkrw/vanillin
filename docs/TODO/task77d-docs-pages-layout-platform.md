# task77d: docs-pages-layout-platform
**Goal:** Apply the task-76 docs template to 16 layout, primitive and platform component pages.  **Branch:** `docs/pages-rest-d`  **Deps:** 76
**Owns:** `site/pages/{aspect-ratio,button-group,container-queries,density,direction,mode-toggle,primitives,separator,sidebar,skeleton,spinner,status-dot,toggle,toggle-group,typography,view-transitions}.jsx`

## Pages (16)

aspect-ratio, button-group, container-queries, density, direction, mode-toggle, primitives, separator, sidebar, skeleton, spinner, status-dot, toggle, toggle-group, typography, view-transitions

## Per-page structure

Read `site/pages/button.jsx` (task 76) as the reference pattern before starting:
1. Title + description (vanillin voice)
2. `<InstallSnippet slug="..." />`
3. Usage — `<ComponentPreview>` with basic import + JSX
4. Examples — each variant/feature with preview + source, 1-2 creative compositions
5. `<ApiReference>` — props table

Several of these pages document a *system* rather than a component (density, direction, container-queries, view-transitions, typography, primitives). `InstallSnippet` and a props table make no sense there — keep title, description, and preview+source examples, and replace the API table with whatever the page's real contract is (tokens, CSS custom properties, utility classes). Say so in the report rather than forcing the template.

**primitives** has no stated purpose (ISSUES A2 flagged it). Decide what the page is for and make it say that, or report that it should be deleted — do not leave it ambiguous.

## Test-safety rules (learned three times across 76, 77a and 77b — all three shipped hidden failures)

- Before rewriting a page, read `tests/<slug>.test.mjs` if it exists. Preserve every selector and `data-pg` hook the test uses.
- `ComponentPreview` renders `ui/tabs` internally. Any fixture a test targets via `[role="tablist"]`, `.tabs-trigger`, or similarly collision-prone selectors must render **directly on the page** (source in a plain `<CodeBlock>`), not inside `ComponentPreview`.
- No duplicate visible button labels on one page — Playwright strict mode fails on `has-text` collisions.
- Keep code-tab strings in sync with the rendered JSX.
- **Page-height rule.** These pages have tests that drive by viewport coordinates or bounding-box geometry: **container-queries, density, direction, sidebar, status-dot, typography**. Adding height above a fixture moves it out from under those coordinates. Put `InstallSnippet`, Usage and `ApiReference` **below** the fixtures the test drives, or keep the fixture scrolled into view. (Root cause is ISSUES C9, fixed in parallel by task 80 — do not depend on that landing.)

## Content notes

- **density** (ISSUES B2): add code examples to all sections — it currently shows the effect with no way to reproduce it.

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

**Branch:** `docs/pages-rest-d`
**Commit:** `287b2b07fa0f` — docs(pages): apply task-76 template to 16 layout/platform pages

### What landed

All 16 pages rewritten to the task-76 template:

**Component pages (10)** — title, description, InstallSnippet, Usage with ComponentPreview, example sections with ComponentPreview, ApiReference:
aspect-ratio, button-group, separator, skeleton, spinner, status-dot, toggle, toggle-group, mode-toggle, sidebar

**System pages (6)** — title, description, examples with CodeBlock, contract section (tokens/CSS custom properties/utility list):
container-queries, density, direction, typography, view-transitions, primitives

### Height-sensitive pages

container-queries, density, direction, sidebar, status-dot, typography — all test fixtures kept at their original DOM positions. InstallSnippet and ApiReference placed below fixtures per task rules.

### Content decisions

- **primitives**: defined as the shared `lib/` hooks page for building custom components (anchored positioning, keyboard nav, animated mount/unmount, layer dismissal). Not deleted — it has a clear purpose.
- **density**: code examples added to all sections (ISSUES B2).
- System pages use CodeBlock (not ComponentPreview) for code examples, and replace ApiReference with a tokens/properties section.

### Verify results

- `node tests/run.mjs`: **755/759 passed** (4 failures, all pre-existing or unrelated: 2 slider cursor, 1 carousel loop, 1 slider dynamic import race)
- `npm run build`: clean
- Owned tests targeted: **85/85 passed**

### Surprises

- None. All 10 test files for owned pages pass cleanly.
