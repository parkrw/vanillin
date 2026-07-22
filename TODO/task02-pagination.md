# task02: pagination
**Goal:** Add the Pagination component with demo page and smoke test.
**Branch:** feat/pagination  **Deps:** 01 merged (branch from updated main)

## Sub-tasks
- [ ] 1. pagination — test: nav has `aria-label="pagination"`, active link `aria-current="page"`, prev/next aria-labels, ellipsis `aria-hidden`; files: `tests/pagination.test.mjs`, `ui/pagination/pagination.jsx` + `.css`, `playground/pages/pagination.jsx`, `playground/registry.js`.
  - Exports (shadcn names): `Pagination` (nav), `PaginationContent` (ul), `PaginationItem` (li), `PaginationLink` (`as`-able anchor; `isActive` → `aria-current` + `btn--outline`, else `btn--ghost`; default `size="icon"`), `PaginationPrevious`/`PaginationNext` (chevron + label, `size="default"`), `PaginationEllipsis` (span aria-hidden + scoped sr-only).
  - Reuses `.btn` classes from `ui/button/button.css` (as shadcn uses buttonVariants).

## Verify / done
`node tests/run.mjs` all green; playground page renders default + disabled-prev + ellipsis states; screenshot QA.
