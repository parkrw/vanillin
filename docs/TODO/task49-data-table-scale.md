# task49: data-table-scale

**Goal:** Row grouping, `manual*` server-side modes, and the virtualization
decision for `ui/data-table`.
**Branch:** feat/data-table-scale
**Deps:** 48 (column pinning/resizing — `columnSizing`, `columnPinning`,
`.data-table-sized`, `table-layout: fixed`)
**Scope:** `lib/use-data-table.js`, `ui/data-table/`,
`site/pages/data-table.jsx`, `tests/data-table.test.mjs`.

## Where things are today

The engine pipeline is `filter -> sort -> paginate` over `useMemo`. Pagination
caps DOM size to `pageSize` rows (default 10). There are no stubs for grouping,
expanding, or server-side operations — the `Skipped:` comment on line 29 of
`lib/use-data-table.js` lists them all.

## Virtualization verdict: do not build it

Measured on Chrome 137 via playwright-core against a plain `<table>` with 8
columns, `table-layout: fixed`, and a sticky first column (the exact shape
task 48 produces).

| Config           | Total render | Scroll p95 | Jank frames |
|------------------|-------------|------------|-------------|
| 5K fixed         | 156 ms      | 14.5 ms    | 0 / 120     |
| 5K fixed + cv    | 157 ms      | 14.9 ms    | 0 / 120     |
| 10K fixed        | —           | 28.0 ms    | 21 / 120    |
| 10K fixed + cv   | —           | 31.5 ms    | 80 / 120    |
| 50K fixed        | 2154 ms     | 283 ms     | —           |
| 50K fixed + cv   | 2255 ms     | 262 ms     | —           |

`content-visibility: auto` + `contain-intrinsic-size` is **inert** at paginated
sizes (the DOM is already small) and **counterproductive** at 10K+ rows — the
per-frame cost of toggling visibility state during scroll exceeds the paint
savings, producing *more* jank, not less. At 50K the bottleneck is DOM
construction and layout, which neither cv:auto nor a windowing layer solves
without removing nodes from the DOM entirely.

A windowing layer would remove nodes, but it breaks `Ctrl+F`, breaks
`aria-rowcount`/`aria-rowindex` unless you maintain them manually, breaks
sticky column pinning (task 48) because off-screen pinned cells disappear,
and it is ~400 lines of bug surface for a feature whose need is eliminated by
pagination + server-side modes. **Do not build windowing. Do not use
`content-visibility: auto`.** The answer to large datasets is `manualPagination`
— push the work to the server and keep the DOM at page-size.

## Design decisions

- **Grouping is an expand/collapse row model, not a second table.** A grouped
  table renders `GroupRow` items interleaved with data rows. A `GroupRow` has
  `isGrouped: true`, `groupValue`, `subRows`, `depth`, `getIsExpanded()`,
  `toggleExpanded()`. Insert grouping into the pipeline as
  `filter -> group -> sort (within groups) -> flatten -> paginate`. Sorting
  applies *within* each group, not across the flattened result — that is what
  users expect from a grouped view.

- **`getGroupedRowModel` is opt-in via `grouping` state.** `grouping` is an
  array of column ids (`string[]`). When empty, the pipeline skips the group
  stage entirely — zero overhead for ungrouped tables. Do **not** create a
  `getGroupedRowModel()` factory function the way TanStack does; that
  indirection exists to support tree-shaking in a monorepo and is pointless
  here. A `useMemo` conditional on `grouping.length > 0` is enough.

- **Nested grouping is depth-capped at 2.** Deeper nesting is never
  intentional in a flat data table and the indentation UI becomes unusable.
  Silently ignore `grouping` entries beyond index 1.

- **Aggregation is out of scope.** TanStack supports `aggregationFn` per
  column — sum, count, extent, etc. That is a reporting-table feature, not a
  data-table feature. If a consumer needs it they can compute it in their
  data. Do **not** add an aggregation API.

- **`manual*` modes disable the corresponding engine stage.** Three boolean
  props on `useDataTable`: `manualSorting`, `manualFiltering`,
  `manualPagination`. When `manualSorting` is true the engine skips its sort
  memo and passes filtered data straight through — the consumer fetches
  pre-sorted data from the server and passes it as `data`. Same for filtering
  and pagination. The engine still tracks the *state* (`sorting`,
  `columnFilters`, `pagination`) so the UI can display controls and the
  consumer can read state to build server queries. This is TanStack's exact
  contract and it is the right one.

- **`rowCount` and `pageCount` for server-side pagination.** When
  `manualPagination` is true the engine cannot derive page count from data
  length. Accept `rowCount` (preferred) or `pageCount` as props. Derive the
  missing one from the other; require at least one when `manualPagination` is
  set. `getPageCount()` and `getRowCount()` join the table API.

- **`onSortingChange`, `onPaginationChange`, `onColumnFiltersChange`.**
  Optional callbacks fired when the corresponding state changes. These are
  the hooks a server-side consumer uses to trigger a re-fetch. Fire them
  *after* the state setter runs, not as a replacement for it — the engine
  still owns the state. Do **not** support fully controlled (externally owned)
  state — that is a TanStack pattern needed for URL sync in Next.js routers
  and is out of scope for a zero-dep kit.

- **Expand state is `{ [rowId]: true }`, same shape as `rowSelection`.**
  `toggleExpanded()` and `toggleAllExpanded()` mirror the selection API.
  `getIsAllExpanded()` returns whether every group row is open.

## Sub-tasks

- [ ] 1. Engine: `grouping` state, group stage in the pipeline, `GroupRow`
  model with `isGrouped`/`groupValue`/`subRows`/`depth`/expand methods,
  depth cap, flatten pass. Files: `lib/use-data-table.js`.
- [ ] 2. Engine: `manualSorting`, `manualFiltering`, `manualPagination` —
  conditional skips in the pipeline, `rowCount`/`pageCount` props,
  `onSortingChange`/`onPaginationChange`/`onColumnFiltersChange` callbacks.
  Files: `lib/use-data-table.js`.
- [ ] 3. Group row rendering — expand/collapse chevron, indented group
  header, visual grouping separator. Files: `ui/data-table/data-table.jsx`,
  `ui/data-table/data-table.css`.
- [ ] 4. Demo: grouped table (group by status), a "server-side" table that
  fakes `manual*` with a setTimeout to show loading states, section
  explaining why there is no windowing and what `manual*` is for. Files:
  `site/pages/data-table.jsx`.
- [ ] 5. Tests: grouping produces correct row structure; expand/collapse
  round-trips; sort-within-group orders correctly; pagination applies to the
  flattened result; `manualSorting` skips the sort stage (data order
  preserved); `manualPagination` uses `rowCount` for page count; state
  callbacks fire on change. Files: `tests/data-table.test.mjs` (extend).

## Gotchas

- **`content-visibility: auto` made scroll jank *worse* at 10K rows** (80
  jank frames vs 21 without it). The toggling cost during scroll exceeds
  the paint savings. Do not reach for it as a performance band-aid.
- **Grouped rows change the meaning of `row.id`.** A group row's id must be
  stable and distinct from data-row ids — use `group:<colId>:<value>` so
  expand state survives re-renders. Data rows keep their original-index id.
- **Every state change re-renders the whole table.** `use-data-table` holds its
  eight state slices as plain `useState` (`lib/use-data-table.js:38-48`), so
  typing in the global filter re-renders every row. Contrast `lib/use-form.js`,
  which keeps values in a mutable ref and notifies only the subscribed slices —
  typing in one field re-renders no siblings. At 10K rows this is likely the
  dominant cost, and it is cheaper to fix than any windowing layer. **Measure it
  before building anything else here** (noted 2026-07-26; a general
  state-management task was rejected, but this specific case is real).
- **Task 48 dependency is load-bearing.** Group rows span the full table
  width, which requires knowing the visible column count. Pinned columns
  inside a group must keep their sticky offsets. Do not start this until 48
  has landed and its `getStart()`/`getAfter()` API is available.

## Verify / done

- `VANILLIN_TEST_PORT=<yours> node tests/run.mjs data-table` green — all
  existing tests (tasks 26, 47, 48) pass unchanged.
- `npm run build` clean.
- New coverage: grouped rows appear with correct depth; collapsing a group
  hides its children; sort within a group; paginate across group boundaries;
  manual modes skip their pipeline stage; `rowCount` drives page count;
  state-change callbacks fire exactly once per change.
