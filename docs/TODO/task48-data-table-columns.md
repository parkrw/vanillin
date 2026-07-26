# task48: data-table-columns

**Goal:** Column pinning and column resizing for `ui/data-table`.
**Branch:** feat/data-table-columns
**Deps:** 47 (landed)
**Scope:** `lib/use-data-table.js`, `ui/data-table/`,
`playground/pages/data-table.jsx`, `tests/data-table.test.mjs`.

## Where things are today

- `lib/use-data-table.js` line 29 states the gap outright: *"Skipped: column
  pinning/resizing, row expanding, grouping, manual/server-side operations,
  virtualization."* There are **zero stubs** — no `size`, `minSize`, `getStart`,
  `pin`, nothing. You are building this from scratch.
- Engine state (lines 33–41): `sorting`, `globalFilter`, `columnFilters`,
  `columnVisibility`, `rowSelection`, `pagination`. Pipeline is
  filter → sort → paginate.
- Column proxy: `getColumn(id)` (line 197). Header model:
  `getHeaderGroups()` (line 348) returns a **single** group.
- `ui/data-table/` exports only `DataTableColumnHeader` (line 60) and
  `DataTableFacetedFilter` (line 118). Neither accepts width or style props.
- The table markup is assembled in the **playground page**, not in `ui/`, out of
  `ui/table` components (`playground/pages/data-table.jsx` lines 267–310).
- `ui/table` already provides the horizontal scroll container:
  `Table` wraps `<table>` in `.table-container` with `overflow: auto`
  (table.css line 4). No `table-layout`, no `<colgroup>`, no
  `position: sticky` anywhere in either component.

## Design decisions

- **Do not edit `ui/table/table.css` or `ui/table/table.jsx`.** Another task
  owns them this wave. Everything you need is achievable from
  `data-table.css` plus classes you put on the elements yourself. In
  particular, get `table-layout: fixed` by adding an **opt-in**
  `.data-table-sized` class in your own stylesheet and applying it to
  `<Table className="data-table-sized">`, not by changing the base table.
- **`table-layout: fixed` is required for predictable resizing** and is the
  reason the opt-in class exists. A table that is not sized keeps today's
  intrinsic `auto` layout and must render identically to before.
- **Widths ride on CSS custom properties set once on the `<table>` element**
  (`--dt-size-<colId>`), not as an inline `style` per cell. A drag then
  updates one style property instead of N. Cells reference their own var.
- **Drag updates the CSS var directly and commits to React state on
  pointerup.** Setting engine state on every pointermove re-renders every row
  and will feel bad on a 500-row table. Task 49 (virtualization) will lean on
  `getSize()` being cheap — keep it O(1).
- **Engine owns state, UI owns pointers.** TanStack puts
  `getResizeHandler()` on the header; here the engine exposes `setSize`, and a
  `DataTableColumnResizer` component in `ui/data-table` owns the pointer
  events. `lib/use-data-table.js` must stay DOM-free.
- **Deliberate deviation from TanStack: no split header groups.** Do *not*
  build `getLeftHeaderGroups` / `getCenterHeaderGroups` / `getRightHeaderGroups`.
  Keep the single header group and expose `getIsPinned()` / `getStart()` per
  column; `position: sticky` does the visual work with far less machinery.
  Record this in the log.
- **Pinned cells need an opaque background** or the scrolled content shows
  through them — the same class of bug as the hover-transparency issue in
  task 34. Use `var(--background)`, and make sure **row hover and
  `data-selected` backgrounds still reach pinned cells**; a pinned cell that
  keeps the plain background while its row highlights looks broken. This is
  the single most likely thing to get wrong.
- **Logical properties only.** `inset-inline-start` / `inset-inline-end`, never
  `left`/`right` — task 03 made the kit RTL-correct and there is an RTL demo
  that will catch you.
- **Pinning is an API, the toolbar is a demo.** Ship `column.pin(pos)` and put
  the pin controls in the existing "Columns" dropdown on the playground page.
  Do **not** turn `DataTableColumnHeader` into a dropdown — it is a plain sort
  button today and several tests click it.
- **Persistence is out of scope.** No `autoSaveId`, no localStorage; a
  concurrent task owns that pattern for `ui/resizable`.

## API to add

Column def fields: `size`, `minSize` (default 40), `maxSize` (default 800),
`enableResizing`, `enablePinning`.

Engine state: `columnSizing` (`{ [colId]: number }`), `columnPinning`
(`{ left: string[], right: string[] }`), both surfaced through `getState()`.

Column proxy: `getSize()`, `setSize(n)`, `resetSize()`, `getCanResize()`,
`getCanPin()`, `getIsPinned()` → `false | "left" | "right"`, `pin(pos | false)`,
`getStart("left")` / `getAfter("right")` — cumulative offsets over the
**visible** columns, so hiding a pinned column must shift the rest.

Table API: `setColumnSizing`, `setColumnPinning`, `resetColumnSizing`.

## Sub-tasks

- [ ] 1. Engine: sizing + pinning state, column-def fields, the column-proxy
  methods above, `getState()` additions. Files: `lib/use-data-table.js`.
- [ ] 2. `DataTableColumnResizer` — pointer drag with min/max clamping, the
  CSS-var fast path, commit on pointerup, double-click resets. Files:
  `ui/data-table/data-table.jsx`, `ui/data-table/data-table.css`.
- [ ] 3. Keyboard resizing on the same handle: `role="separator"`,
  `aria-orientation="vertical"`, `aria-valuenow/min/max`, arrows ±8px,
  Home/End to min/max. Files: same two.
- [ ] 4. Pinned-cell styling: sticky offsets from `getStart`/`getAfter`, opaque
  background, hover/selected inheritance, an edge shadow on the last-left and
  first-right pinned column. Files: `ui/data-table/data-table.css`, plus
  whatever prop-spreading helper the header/cell needs in `data-table.jsx`.
- [ ] 5. Demo + **docs prose**: a sized/pinned table, pin controls in the
  Columns dropdown, and a section explaining the `table-layout: fixed` opt-in
  and why the engine has no split header groups. Files:
  `playground/pages/data-table.jsx`.
- [ ] 6. Tests. Files: `tests/data-table.test.mjs` (extend).

## Verify / done

- `VANILLIN_TEST_PORT=<yours> node tests/run.mjs data-table` green — **all 14
  existing tests included**; tests 1–8 predate task 47 and must not regress.
- `npm run build` clean.
- New coverage: drag changes width and it survives a re-sort; min/max clamp;
  arrow-key resize and double-click reset; a left-pinned column stays at
  `inset-inline-start: 0` after scrolling the container horizontally; a pinned
  cell's computed background is **opaque** and tracks row hover/selection; an
  un-sized table still computes `table-layout: auto`.
- Check the RTL demo: pinning must mirror.
