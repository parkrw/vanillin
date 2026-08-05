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

Batch into 3-4 workers by category (disjoint files):
- **Worker A:** Forms — combobox, date-input, date-picker, field, form-fields, input-group, input-otp, label, native-select, radio-group, slider, textarea, time-picker, use-form
- **Worker B:** Overlay + Navigation — alert-dialog, command, context-menu, drawer, dropdown-menu, hover-card, menubar, navigation-menu, pagination, popover, sheet, tooltip, breadcrumb
- **Worker C:** Data + Layout + Disclosure — aspect-ratio, attachment, bubble, button-group, calendar, carousel, collapsible, container-queries, data-table, empty, format, input-group, item, kbd, marker, message, message-scroller, progress, resizable, scroll-area, separator, skeleton, spinner, status-dot, toggle, toggle-group, typography
- **Worker D:** Platform — density, direction, forced-colors, mode-toggle, primitives, sidebar, view-transitions

Each worker reads `site/pages/button.jsx` (from task 76) as the reference pattern.

## Content notes for specific pages

- **command** (B3): add "how to wire your own actions" section, explain what search searches
- **drawer** (B4): add visible grab handle affordance to demos
- **density** (B2): add code examples to all sections
- **form-fields** (B6): add form vs form-fields explainer at top
- **use-form** (C7): fix adjacent `<span>`s that render as one unreadable token

## Verify / done

```sh
npm run dev          # visual QA: every page follows the template
npm test             # suite green — all data-pg hooks preserved
npm run build        # build clean
```

## Handoff

**Status:** NOT STARTED
