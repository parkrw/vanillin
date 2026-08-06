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
- **Worker C:** Data + Layout + Disclosure — aspect-ratio, attachment, bubble, button-group, calendar, carousel, collapsible, container-queries, data-table, empty, format, item, kbd, marker, message, message-scroller, progress, resizable, scroll-area, separator, skeleton, spinner, status-dot, toggle, toggle-group, typography (26 pages — rebalance with D into ~16/16 when batch 3 is sized)
- **Worker D:** Platform — density, direction, mode-toggle, primitives, sidebar, view-transitions (6 pages)

Each worker reads `site/pages/button.jsx` (from task 76) as the reference pattern.

## Content notes for specific pages

Notes for A/B pages moved into their task files. Remaining here for batch 3:

- **density** (B2): add code examples to all sections

## Verify / done

```sh
npm run dev          # visual QA: every page follows the template
npm test             # suite green — all data-pg hooks preserved
npm run build        # build clean
```

## Handoff

**Status:** IN PROGRESS — A and B landed 2026-08-06 (branches `docs/pages-rest-a`, `docs/pages-rest-b`, one rework round each; see their task files' Handoffs). C and D remain for batch 3 — rebalance 26+6 into ~16/16. Batch-3 fixture rule, learned twice: pages with viewport-coordinate or flush-edge tests (see ISSUES C9) must not add height above their fixtures; put Usage/InstallSnippet/ApiReference below them or fix C9 first.
