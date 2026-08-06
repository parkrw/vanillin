# task77b: docs-pages-overlay-nav
**Goal:** Apply the task-76 docs template to the 13 overlay + navigation component pages.  **Branch:** `docs/pages-rest-b`  **Deps:** 76
**Owns:** `site/pages/{alert-dialog,breadcrumb,command,context-menu,drawer,dropdown-menu,hover-card,menubar,navigation-menu,pagination,popover,sheet,tooltip}.jsx`

## Pages (13)

alert-dialog, breadcrumb, command, context-menu, drawer, dropdown-menu, hover-card, menubar, navigation-menu, pagination, popover, sheet, tooltip

## Per-page structure

Read `site/pages/button.jsx` (task 76) as the reference pattern before starting:
1. Title + description (vanillin voice)
2. `<InstallSnippet slug="..." />`
3. Usage — `<ComponentPreview>` with basic import + JSX
4. Examples — each variant/feature with preview + source, 1-2 creative compositions
5. `<ApiReference>` — props table

## Test-safety rules (lesson from task 76 — it shipped 14 hidden failures ignoring these)

- Before rewriting a page, read `tests/<slug>.test.mjs` if it exists. Every page here except breadcrumb has one. Preserve every selector and `data-pg` hook the test uses.
- `ComponentPreview` renders `ui/tabs` internally. Any fixture a test targets via `[role="tablist"]`, `.tabs-trigger`, or similarly collision-prone selectors must render **directly on the page** (source shown in a plain `<CodeBlock>`), not inside `ComponentPreview`.
- No duplicate visible button labels on one page — Playwright strict mode fails on `has-text` collisions (76's dialog page hit exactly this with two "Open dialog" buttons).
- Keep code-tab strings in sync with the rendered JSX (76 needed a fix commit for drift).

## Content notes

- **command** (ISSUES B3): add a "wire your own actions" section; explain what the search actually searches.
- **drawer** (ISSUES B4): give the demos a visible grab-handle affordance.

## Verify / done

```sh
node tests/run.mjs   # suite green — all data-pg hooks preserved
npm run build        # clean
```

Baseline is 753/755 (2 pre-existing failures). Run the full suite and report exact counts — do not summarize from memory.

## Handoff

**Status:** DONE

All 13 pages rewritten to task-76 template: title + description, InstallSnippet, ComponentPreview usage/examples, ApiReference props table. Navigation-menu left unwrapped (demos too interactive for preview tabs). ISSUES B3 (command: "wire your own actions" + search-match explanation) and B4 (drawer: grab-handle documented) addressed.

Suite: 752/755 (3 pre-existing: 2 cursor/slider-thumb, 1 slider/onValueCommit flake). All 151 target-component tests pass. Build clean.
