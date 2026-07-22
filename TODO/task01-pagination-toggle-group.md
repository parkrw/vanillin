# task01: pagination-toggle-group
**Goal:** Add Toggle Group and Pagination components with demo pages and smoke tests.
**Branch:** feat/pagination-toggle-group  **Deps:** none

## Sub-tasks
- [x] 1. toggle-group — test: single-select toggles `data-state` (one on, click again deselects), multiple allows several on, arrow keys rove focus; files: `tests/toggle-group.test.mjs`, `ui/toggle-group/toggle-group.jsx` + `.css`, `playground/pages/toggle-group.jsx`, `playground/registry.js`.
  - Exports `ToggleGroup` (role="group", context: type/value/setValue/variant/size/disabled, `useRovingFocus` selector `.toggle-group-item`) + `ToggleGroupItem` (button, `aria-pressed`, `data-state` on/off, reuses `.toggle` classes from `ui/toggle/toggle.css` + `.toggle-group-item`).
  - Props mirror Radix/shadcn: `type` "single"|"multiple", `value`/`defaultValue`/`onValueChange` (string or array), `variant`/`size` shared via context.
- [ ] 2. pagination — test: nav has `aria-label="pagination"`, active link `aria-current="page"`, prev/next aria-labels, ellipsis `aria-hidden`; files: `tests/pagination.test.mjs`, `ui/pagination/pagination.jsx` + `.css`, `playground/pages/pagination.jsx`, `playground/registry.js`.
  - Exports (shadcn names): `Pagination` (nav), `PaginationContent` (ul), `PaginationItem` (li), `PaginationLink` (`as`-able anchor; `isActive` → `aria-current` + `btn--outline`, else `btn--ghost`; default `size="icon"`), `PaginationPrevious`/`PaginationNext` (chevron + label, `size="default"`), `PaginationEllipsis` (span aria-hidden + scoped sr-only).
  - Reuses `.btn` classes from `ui/button/button.css` (as shadcn uses buttonVariants).

## Verify / done
`npm run dev` on :5173, then `node tests/run.mjs` — all suites green (incl. existing progress/slider). Both playground pages render all variants; headless screenshot QA per HANDOFF gotcha. Net diff ≤500 lines vs main.
