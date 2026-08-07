# task77: docs-pages-rest
**Goal:** Apply the docs template to all remaining ~59 component pages. Spawn-ready — each page is a disjoint file.  **Branch:** `docs/pages-rest-{batch}` (one per worker)  **Deps:** 76
**Owns:** `site/pages/*.jsx` (all pages NOT in task 76's list)

## Remaining pages (~59)

alert-dialog, aspect-ratio, attachment, breadcrumb, bubble, button-group, calendar, carousel, collapsible, combobox, command, container-queries, context-menu, data-table, date-input, date-picker, density, direction, drawer, dropdown-menu, empty, field, form-fields, format, hover-card, input-group, input-otp, item, kbd, label, marker, menubar, message, message-scroller, mode-toggle, native-select, navigation-menu, pagination, popover, primitives, progress, radio-group, resizable, scroll-area, separator, sheet, sidebar, skeleton, slider, spinner, status-dot, textarea, time-picker, toggle, toggle-group, tooltip, typography, use-form, view-transitions

## Per-component structure

Same template as task 76:
1. Title + description (vanillin voice)
2. `<InstallSnippet slug="..." />`
3. Usage — `<ComponentPreview>` with basic import + JSX
4. Examples — each variant/feature with preview + source, 1-2 compositions
5. `<ApiReference>` — props table

## Spawn strategy

Batch into workers by category (disjoint files). **A and B split into their own task files 2026-08-06** (`task77a-docs-pages-forms.md`, `task77b-docs-pages-overlay-nav.md`) and spawned as batch 2 alongside task 79. Two list fixes made then: `input-group` was listed under both A and C (one file — it is A's), and D listed `forced-colors`, which has no `site/pages/` file (dropped).
- **Worker A:** → `task77a-docs-pages-forms.md` (14 pages)
- **Worker B:** → `task77b-docs-pages-overlay-nav.md` (13 pages)
C and D were rebalanced 26+6 → 16/16 for batch 3 (2026-08-06) and split into their own task files, same as A and B.
- **Worker C:** → `task77c-docs-pages-data.md` (16 pages — data, disclosure, content)
- **Worker D:** → `task77d-docs-pages-layout-platform.md` (16 pages — layout, primitives, platform)

Each worker reads `site/pages/button.jsx` (from task 76) as the reference pattern.

## Content notes for specific pages

All moved into the four A/B/C/D task files.

## Verify / done

```sh
npm run dev          # visual QA: every page follows the template
npm test             # suite green — all data-pg hooks preserved
npm run build        # build clean
```

## Handoff

**Status:** IN PROGRESS
**Status:** DONE — all four batches landed  **PR:** none (remote writes off)  **Updated:** 2026-08-07

- **Landed:** A (14 form pages) + B (13 overlay/nav) 2026-08-06, both merged. C (16 data/disclosure) + D (16 layout/platform) 2026-08-07 on `docs/pages-rest-c` / `docs/pages-rest-d`, verified 757/759 and 756/759, awaiting merge. All 59 pages carry the task-76 template.
- **Per-batch state** lives in `task77a`/`task77b`/`task77c`/`task77d` files, not here.
- **Gotchas, in the order they were learned.** *Fixture height* — pages whose tests drive by viewport coordinates or flush-edge geometry must not gain height above their fixtures; put Usage/InstallSnippet/ApiReference below. Root cause was ISSUES C9, fixed by task 80, so this constraint is now advisory rather than load-bearing. *Worker test counts* — 3-for-3 misreported in batches 1-2, then 3-for-3 accurate in batch 3; re-run them regardless, the cost is one command. *Content deletion* — the batch-3 failure mode, and the one no test catches: both 77c and 77d shipped green suites while prose that documented real behaviour had been replaced by prop tables. Applying the template is additive. Diff against `git show <base>:<file>` before accepting any page rewrite that comes out shorter.
