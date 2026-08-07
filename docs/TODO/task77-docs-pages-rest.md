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
**Branch:** A `docs/pages-rest-a` ✓ merged, B `docs/pages-rest-b` ✓ merged; C `docs/pages-rest-c` and D `docs/pages-rest-d` in flight (batch 3)  **PR:** none (remote writes off)  **Updated:** 2026-08-06

- **Landed:** A (14 form pages) and B (13 overlay/nav pages) carry the task-76 template, each verified 753/755 by the supervisor after one rework round. Both merged, along with 79 (right rail) and the batch-2 TODO reconcile.
- **In flight:** C and D, spawned as batch 3 alongside task 80 (the C9 dialog fix). Live state lives in `task77c-docs-pages-data.md` and `task77d-docs-pages-layout-platform.md`, not here.
- **Repo state:** batch-2 worktrees removed. The `drawer-fix-attempt` stash noted in the previous handoff is gone — only two unrelated `On main:` stashes remain.
- **Gotchas:** fixture-height rule, learned three times: pages whose tests use viewport coordinates or flush-edge geometry must not gain height above their fixtures — put Usage/InstallSnippet/ApiReference below them. Root cause is ISSUES C9 (task 80). Worker suite counts are unreliable (3-for-3 misreports); supervisor re-runs are mandatory.
