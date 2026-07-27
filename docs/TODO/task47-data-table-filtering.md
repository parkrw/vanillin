# task47: data-table-filtering

**Goal:** Global filter, faceted filters, and multi-column sort in
`lib/use-data-table.js` and the `ui/data-table` surface.
**Branch:** feat/data-table-filtering
**Deps:** none (task 26 landed the engine)

## Why

`lib/use-data-table.js`'s own header lists what it skipped: multi-sort, global
filter, faceted filters. Those three are what turn the upstream payments demo
into something a console can actually put a resource list in.

## Design decisions

- **Extend the engine's existing shape; do not restructure it.** Today it is
  `filter → sort → paginate` over `useMemo`. Global filter joins the filter
  stage, multi-sort replaces the single `sorting` object with an array, and
  faceted counts are a new derived memo. Keep the `filteredData` /
  `sortedData` / page-slice pipeline recognisable.
- **`globalFilter` is a string matched across every filterable column.**
  - Which columns participate: all with an `accessorKey`, unless a column def
    sets `enableGlobalFilter: false` (tanstack's name).
  - Matching is case-insensitive substring on the **accessor value**, not the
    rendered cell — a cell that renders a badge must still match its
    underlying value. Allow a per-column `getFilterValue` for the cases where
    the raw value is not what a human is searching (a timestamp, an enum code).
  - Column filters and the global filter are **AND**ed.
- **Faceted filters are the multi-select "Status: Active, Failed" popovers**
  from the upstream toolbar example.
  - Engine side: `getFacetedUniqueValues(columnId)` returning a
    `Map<value, count>`, computed from the rows that pass *every other* filter
    but not this one — that is what makes the counts update usefully instead
    of collapsing to the current selection. This is the subtle part and the
    easy thing to get wrong.
  - Column filter values become `string | string[]`; an array means "value is
    in this set". Keep the existing string behaviour for back-compat.
  - UI: a new `DataTableFacetedFilter` built from `ui/popover` + `ui/command`
    + `ui/checkbox` (upstream's exact composition), showing counts and a
    "Clear filters" affordance.
- **Multi-sort:** `sorting` becomes an array of `{ id, desc }`, applied in
  order. Shift-click a header appends; plain click resets to that one column.
  Cap depth with `maxMultiSortColCount` (default 3) — deeper is never
  intentional. `aria-sort` can only express one column, so put it on the
  primary sort and expose the rest via the header's accessible name
  ("Status, sorted ascending, second sort").
  - Sorting must be **stable** across the whole comparator chain, or the
    secondary key is meaningless.
- **Performance:** these memos run on every keystroke of the global filter.
  Debounce at the *input*, not in the engine — the engine stays synchronous
  and testable, and the demo owns the debounce.

## Sub-tasks

- [ ] 1. Global filter + `enableGlobalFilter` / `getFilterValue` in the engine.
  Files: `lib/use-data-table.js`.
- [ ] 2. Multi-sort — sorting array, shift-click append, stable comparator
  chain, `maxMultiSortColCount`, header accessible names. Files:
  `lib/use-data-table.js`, `ui/data-table/data-table.jsx`.
- [ ] 3. Faceted values — `getFacetedUniqueValues`, array-valued column
  filters, counts computed against the other filters. Files:
  `lib/use-data-table.js`.
- [ ] 4. `DataTableFacetedFilter` + a global-filter input in the toolbar.
  Files: `ui/data-table/data-table.jsx`, `ui/data-table/data-table.css`.
- [ ] 5. Demo sections. Files: `site/pages/data-table.jsx`.
- [ ] 6. Test: global filter matches across columns and respects
  `enableGlobalFilter: false`; global + column filters AND; faceted counts
  reflect other filters but not the facet's own selection; multi-value facet
  filter; shift-click builds a two-key sort and the secondary key actually
  orders ties; plain click resets; `aria-sort` on the primary only. Files:
  `tests/data-table.test.mjs` (extend).

## Verify / done

- `node tests/run.mjs` green (existing data-table suite unmodified);
  `npm run build` clean.
- axe on the demo with a faceted popover open.
- Filter to zero rows and confirm the empty state, pagination, and the
  select-all checkbox all behave (select-all over an empty page must not
  report `mixed`).
