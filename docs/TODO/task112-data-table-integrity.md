# task112: data-table-integrity
**Goal:** Row selection that survives reorders, a filter path that isn't O(n²), and pagination state that agrees with what's rendered.  **Branch:** `fix/data-table-integrity`  **Deps:** none
**Owns:** `lib/use-data-table.js`, `tests/data-table.test.mjs`, `site/pages/data-table.jsx` (ApiReference row for `getRowId` + a memoized-columns note only)

Line numbers measured 2026-08-27; re-verify before editing.

## The findings

1. **Row selection is keyed by array index.** `lib/use-data-table.js:547` sets `id: String(oi)` where `oi` is the item's position in `data`, and `getIsSelected`/`toggleSelected` (`:555-563`) key `rowSelection` on it. Select rows 3 and 7, let a refetch or upstream sort reorder `data`, and the checkboxes now point at different records — bulk delete/export operates on the wrong rows with no visible symptom. Fix: a `getRowId(item, index)` option (TanStack's shape), defaulting to the current index behavior so existing consumers don't move; document that stable ids are required for selection across data changes.
2. **The filter path is O(n²).** `:152-155` (verified): `filteredData.map((item) => data.indexOf(item))` — a linear scan per row. At 10k rows that's ~50M reference comparisons per recompute, and the memo recomputes whenever `filteredData` identity changes, whose deps include `columns` (`:150`) — so a consumer passing an inline `columns` array (the shape the docs demo shows at `site/pages/data-table.jsx:1316-1321`) pays it **per render**, including every filter keystroke. Fix: build `Map<item, index>` once per `data` identity; O(n) total.
3. **`pageIndex` clamps locally, never in state.** `paginatedRows` clamps to `pageCount - 1` at `:367` but state still holds the stale index, so `getCanPreviousPage()`/the page indicator (`:646-652`) disagree with the rendered rows — after a filter shrinks the set, "previous" appears dead for several clicks. Fix: clamp in state (an effect or on-write clamp in the filter/pagination setters), and make the indicator read the same value the row slice uses.

## Worth one line each in the docs page (not code)

- `columns` identity matters: a module-scope or `useMemo`'d array avoids recomputing filters/facets per render. One sentence next to the first `useDataTable` example.
- The windowing rejection (`site/pages/data-table.jsx:1838-1859`) already documents the rendered-DOM story; these fixes are about the *compute* path upstream of pagination — don't reopen that decision.

## Sub-tasks

- [ ] 1. `getRowId` option threaded through row construction, selection, and expansion keys. Test: select two rows, reverse `data`, assert the same *records* stay selected (and the counter-precondition: with the index default, they don't — pinning the old behavior as the documented default).
- [ ] 2. Index `Map` replacing `indexOf`. Test is behavioral equality (selection/facets unchanged) — add a coarse perf guard only if it can be made deterministic (assert call counts via a wrapped accessor, not wall-clock).
- [ ] 3. State-level `pageIndex` clamp. Test: 5 pages, go to page 5, filter down to 2 pages, assert the indicator shows the clamped page **and** one "previous" click moves the view.
- [ ] 4. ApiReference row for `getRowId` + the columns-identity sentence on the docs page.

## Verify / done

```sh
node tests/run.mjs data-table
npm test > out.txt 2>&1 && grep ^FAIL out.txt
npm run contracts   # ui/ untouched, but run it anyway if any ui file moved
```

Done when: the three tests above were red first, suite baseline unmoved, no public API removed (only `getRowId` added).

## Out of scope

The allocation work (per-cell `columns.find` scans, fresh `tableApi` per render, eager collapsed-group materialization, faceted-count re-filters) — real, measured, and deferred to the perf backlog; it changes object identity guarantees and deserves its own task with benchmarks. Windowing stays rejected.

## Handoff

**Status:** NOT STARTED
