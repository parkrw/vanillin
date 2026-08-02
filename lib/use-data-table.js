import { useState, useMemo, useEffect, useRef } from "react"

/**
 * Render a column definition (header or cell). Function defs receive the
 * context object; strings/elements pass through. A cell def left undefined
 * falls back to the accessor value via the context's `getValue`, matching
 * tanstack's default cell.
 */
export function flexRender(Comp, props) {
  if (typeof Comp === "function") return Comp(props)
  return Comp ?? props?.getValue?.() ?? null
}

// Fire `callback(value)` after commit whenever `value` changes, skipping the
// initial render. Setters guard against no-op updates (returning the previous
// object) so a callback fires exactly once per real change.
function useChangeCallback(value, callback) {
  const first = useRef(true)
  const cbRef = useRef(callback)
  cbRef.current = callback
  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    cbRef.current?.(value)
  }, [value])
}

/**
 * Zero-dep table engine replacing @tanstack/react-table for the
 * data-table pattern. Mirrors the tanstack surface the docs example uses:
 *
 *   column defs      accessorKey + header + cell render fns
 *   sorting          multi-column stable sort, shift-click append,
 *                     maxMultiSortColCount cap (default 3)
 *   global filter    case-insensitive substring across all accessor
 *                     columns (opt out with enableGlobalFilter: false,
 *                     override the matched value with getFilterValue)
 *   column filter    text substring or array-valued "in set" filter
 *   faceted values   getFacetedUniqueValues(colId) counts computed
 *                     against rows passing every other filter
 *   visibility       toggle columns on/off
 *   row selection    header tri-state + per-row checkboxes
 *   pagination       page size selector + prev/next
 *   grouping         `grouping` state (column ids, depth capped at 2)
 *                     inserts a group stage: filter → group → sort
 *                     (within groups) → flatten → paginate. Group rows
 *                     carry isGrouped/groupValue/subRows/depth and the
 *                     expand API; `expanded` is `{ [rowId]: true }`.
 *   manual modes     `manualSorting`/`manualFiltering`/`manualPagination`
 *                     skip the corresponding engine stage — the consumer
 *                     fetches processed data server-side. State is still
 *                     tracked; `onSortingChange`/`onPaginationChange`/
 *                     `onColumnFiltersChange` fire after each change so
 *                     the consumer can re-fetch. `manualPagination`
 *                     requires `rowCount` (preferred) or `pageCount`.
 *
 * Skipped: virtualization (measured and rejected — pagination and the
 * manual modes keep the DOM at page size; see the data-table docs page).
 *
 * Column sizing:  explicit `size`/`minSize`/`maxSize` on defs,
 *                  `columnSizing` state, `getSize`/`setSize`/`resetSize`.
 * Column pinning: `columnPinning` state (`{ left, right }`),
 *                  `getIsPinned`/`pin`/`getStart`/`getAfter`.
 */
export function useDataTable({
  data,
  columns,
  initialPageSize = 10,
  maxMultiSortColCount = 3,
  initialGrouping = [],
  manualSorting = false,
  manualFiltering = false,
  manualPagination = false,
  rowCount,
  pageCount: pageCountProp,
  onSortingChange,
  onPaginationChange,
  onColumnFiltersChange,
}) {
  if (manualPagination && rowCount == null && pageCountProp == null) {
    throw new Error(
      "useDataTable: manualPagination requires rowCount or pageCount"
    )
  }
  const [sorting, setSorting] = useState([])
  const [globalFilter, setGlobalFilter] = useState("")
  const [columnFilters, setColumnFilters] = useState({})
  const [columnVisibility, setColumnVisibility] = useState({})
  const [rowSelection, setRowSelection] = useState({})
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: initialPageSize,
  })
  const [columnSizing, setColumnSizing] = useState({})
  const [columnPinning, setColumnPinning] = useState({ left: [], right: [] })
  const [grouping, setGroupingState] = useState(initialGrouping)
  const [expanded, setExpanded] = useState({})

  // ── Derived data: filter → group → sort → flatten → paginate ───────

  const filteredData = useMemo(() => {
    // Manual filtering: the consumer passes pre-filtered data; filter state
    // is still tracked so the UI can render controls.
    if (manualFiltering) return data

    let result = data

    // Global filter: case-insensitive substring across filterable columns
    if (globalFilter) {
      const lower = globalFilter.toLowerCase()
      const globalCols = columns.filter(
        (c) => c.accessorKey && c.enableGlobalFilter !== false
      )
      result = result.filter((item) =>
        globalCols.some((c) => {
          const raw = item[c.accessorKey]
          const val = c.getFilterValue ? c.getFilterValue(raw) : raw
          return val != null && String(val).toLowerCase().includes(lower)
        })
      )
    }

    // Column filters (ANDed with global filter)
    for (const [colId, filterValue] of Object.entries(columnFilters)) {
      if (
        filterValue == null ||
        filterValue === "" ||
        (Array.isArray(filterValue) && filterValue.length === 0)
      )
        continue
      const def = columns.find((c) => (c.id ?? c.accessorKey) === colId)
      if (!def?.accessorKey) continue

      if (Array.isArray(filterValue)) {
        // Faceted: value must be in the set
        result = result.filter((item) =>
          filterValue.includes(String(item[def.accessorKey]))
        )
      } else {
        const lower = String(filterValue).toLowerCase()
        result = result.filter((item) => {
          const val = item[def.accessorKey]
          return val != null && String(val).toLowerCase().includes(lower)
        })
      }
    }
    return result
  }, [data, columns, columnFilters, globalFilter, manualFiltering])

  const filteredIndices = useMemo(
    () => filteredData.map((item) => data.indexOf(item)),
    [data, filteredData]
  )

  // Faceted unique values: counts per column computed against rows passing
  // every *other* filter but not the facet's own selection — this keeps
  // counts useful instead of collapsing them to the current selection.
  const facetedUniqueValues = useMemo(() => {
    const result = {}

    // Helper: apply global filter to a row set
    const applyGlobal = (rows) => {
      if (!globalFilter) return rows
      const lower = globalFilter.toLowerCase()
      const globalCols = columns.filter(
        (c) => c.accessorKey && c.enableGlobalFilter !== false
      )
      return rows.filter((item) =>
        globalCols.some((c) => {
          const raw = item[c.accessorKey]
          const val = c.getFilterValue ? c.getFilterValue(raw) : raw
          return val != null && String(val).toLowerCase().includes(lower)
        })
      )
    }

    // Helper: apply one column filter
    const applyColFilter = (rows, colId, filterValue) => {
      const def = columns.find((c) => (c.id ?? c.accessorKey) === colId)
      if (!def?.accessorKey) return rows
      if (Array.isArray(filterValue)) {
        return rows.filter((item) =>
          filterValue.includes(String(item[def.accessorKey]))
        )
      }
      const lower = String(filterValue).toLowerCase()
      return rows.filter((item) => {
        const val = item[def.accessorKey]
        return val != null && String(val).toLowerCase().includes(lower)
      })
    }

    for (const def of columns) {
      if (!def.accessorKey) continue
      const colId = def.id ?? def.accessorKey

      // Start from all data, apply global filter + every column filter
      // except this column's own (manual filtering: counts over raw data)
      let rows = manualFiltering ? data : applyGlobal(data)
      if (!manualFiltering) {
        for (const [filterId, fv] of Object.entries(columnFilters)) {
          if (filterId === colId) continue
          if (fv == null || fv === "" || (Array.isArray(fv) && fv.length === 0))
            continue
          rows = applyColFilter(rows, filterId, fv)
        }
      }

      const counts = new Map()
      for (const item of rows) {
        const val = item[def.accessorKey]
        counts.set(val, (counts.get(val) ?? 0) + 1)
      }
      result[colId] = counts
    }
    return result
  }, [data, columns, columnFilters, globalFilter, manualFiltering])

  const indexedRows = useMemo(
    () => filteredData.map((item, i) => ({ item, oi: filteredIndices[i] })),
    [filteredData, filteredIndices]
  )

  // Multi-key comparator over { item, oi } descriptors; null when unsorted
  // or when the consumer sorts server-side (manual sorting passes data
  // through in the order it arrived).
  const comparator = useMemo(() => {
    if (manualSorting || sorting.length === 0) return null

    // Resolve accessor keys once
    const keys = sorting.map(({ id: sortId, desc }) => {
      const def = columns.find((c) => (c.id ?? c.accessorKey) === sortId)
      return { key: def?.accessorKey, dir: desc ? -1 : 1 }
    }).filter((k) => k.key)

    if (keys.length === 0) return null

    return (a, b) => {
      for (const { key, dir } of keys) {
        const va = a.item[key]
        const vb = b.item[key]
        if (va == null && vb == null) continue
        if (va == null) return 1
        if (vb == null) return -1
        if (va < vb) return -1 * dir
        if (va > vb) return 1 * dir
      }
      // Stable: preserve original order for ties
      return a.oi - b.oi
    }
  }, [columns, sorting, manualSorting])

  // Grouping is depth-capped at 2; entries beyond index 1 and ids without
  // an accessor column are silently ignored.
  const activeGrouping = useMemo(
    () =>
      grouping
        .slice(0, 2)
        .filter((colId) =>
          columns.some((c) => (c.id ?? c.accessorKey) === colId && c.accessorKey)
        ),
    [grouping, columns]
  )

  // Group stage. Produces either a flat sorted leaf list (no grouping) or a
  // tree of group descriptors whose leaf buckets are sorted within their
  // group. `leaves` is always the full post-filter data-row list (used by
  // the selection model, which must see collapsed rows too).
  const grouped = useMemo(() => {
    const sortRows = (rows) => (comparator ? [...rows].sort(comparator) : rows)

    if (activeGrouping.length === 0) {
      const leaves = sortRows(indexedRows).map(({ item, oi }) => ({
        kind: "data",
        item,
        oi,
        depth: 0,
      }))
      return { groups: null, leaves, groupIds: [] }
    }

    const groupIds = []
    const leaves = []
    const build = (rows, depth, parentId) => {
      const colId = activeGrouping[depth]
      const def = columns.find((c) => (c.id ?? c.accessorKey) === colId)
      const buckets = new Map()
      for (const r of rows) {
        const v = r.item[def.accessorKey]
        if (!buckets.has(v)) buckets.set(v, [])
        buckets.get(v).push(r)
      }

      // Groups order by value; direction follows this column's sort entry
      const dir = sorting.find((s) => s.id === colId)?.desc ? -1 : 1
      const entries = [...buckets.entries()].sort(([a], [b]) => {
        if (a == null && b == null) return 0
        if (a == null) return 1
        if (b == null) return -1
        return (a < b ? -1 : a > b ? 1 : 0) * dir
      })

      return entries.map(([value, bucket]) => {
        // Stable id distinct from data-row ids so expand state survives
        // re-renders; nested groups prefix the parent chain.
        const id = `${parentId ? `${parentId}>` : ""}group:${colId}:${value}`
        groupIds.push(id)
        let children
        if (depth < activeGrouping.length - 1) {
          children = build(bucket, depth + 1, id)
        } else {
          children = sortRows(bucket).map(({ item, oi }) => ({
            kind: "data",
            item,
            oi,
            depth: depth + 1,
          }))
          leaves.push(...children)
        }
        return {
          kind: "group",
          id,
          colId,
          value,
          depth,
          children,
          leafCount: bucket.length,
        }
      })
    }

    return { groups: build(indexedRows, 0, ""), leaves, groupIds }
  }, [indexedRows, activeGrouping, comparator, columns, sorting])

  // Flatten pass: group rows interleaved with their children, collapsed
  // groups contribute only their header row.
  const flatRows = useMemo(() => {
    if (!grouped.groups) return grouped.leaves
    const out = []
    const walk = (nodes) => {
      for (const n of nodes) {
        out.push(n)
        if (n.kind === "group" && expanded[n.id]) walk(n.children)
      }
    }
    walk(grouped.groups)
    return out
  }, [grouped, expanded])

  // Manual pagination: the consumer passes one page of data; the page count
  // comes from `pageCount` or is derived from `rowCount`. The missing prop
  // is derived from the other.
  const pageCount = manualPagination
    ? pageCountProp ?? Math.max(1, Math.ceil(rowCount / pagination.pageSize))
    : Math.max(1, Math.ceil(flatRows.length / pagination.pageSize))

  const totalRowCount = manualPagination
    ? rowCount ?? pageCountProp * pagination.pageSize
    : flatRows.length

  const paginatedRows = useMemo(() => {
    if (manualPagination) return flatRows
    const { pageSize } = pagination
    // Clamp: collapsing groups can shrink the row count below the page
    const pageIndex = Math.min(pagination.pageIndex, pageCount - 1)
    const start = pageIndex * pageSize
    return flatRows.slice(start, start + pageSize)
  }, [flatRows, pagination, pageCount, manualPagination])

  // ── Server-side re-fetch hooks (fire after the state setter runs) ──

  useChangeCallback(sorting, onSortingChange)
  useChangeCallback(pagination, onPaginationChange)
  useChangeCallback(columnFilters, onColumnFiltersChange)

  // ── Column sizing helper (O(1) — hash lookup + column scan) ────────

  function getColumnSize(colId) {
    if (columnSizing[colId] != null) return columnSizing[colId]
    const d = columns.find((c) => (c.id ?? c.accessorKey) === colId)
    return d?.size ?? 150
  }

  // Visible columns ordered by pinning: left → center → right
  const orderedVisibleColumns = useMemo(() => {
    const isVisible = (cid) => columnVisibility[cid] !== false
    const leftIds = columnPinning.left ?? []
    const rightIds = columnPinning.right ?? []
    const leftSet = new Set(leftIds)
    const rightSet = new Set(rightIds)
    const getDef = (cid) =>
      columns.find((d) => (d.id ?? d.accessorKey) === cid)

    const left = leftIds.filter(isVisible).map(getDef).filter(Boolean)
    const right = rightIds.filter(isVisible).map(getDef).filter(Boolean)
    const center = columns.filter((d) => {
      const cid = d.id ?? d.accessorKey
      return isVisible(cid) && !leftSet.has(cid) && !rightSet.has(cid)
    })
    return [...left, ...center, ...right]
  }, [columns, columnVisibility, columnPinning])

  // ── Column proxy ───────────────────────────────────────────────────

  function getColumn(id) {
    const def = columns.find((c) => (c.id ?? c.accessorKey) === id)
    return {
      id,
      columnDef: def,
      getCanSort: () => def?.enableSorting !== false,
      getCanHide: () => def?.enableHiding !== false,
      getIsSorted() {
        const entry = sorting.find((s) => s.id === id)
        if (!entry) return false
        return entry.desc ? "desc" : "asc"
      },
      getSortIndex() {
        return sorting.findIndex((s) => s.id === id)
      },
      toggleSorting(desc, multi) {
        setSorting((prev) => {
          if (multi) {
            const idx = prev.findIndex((s) => s.id === id)
            if (idx !== -1) {
              if (desc !== undefined)
                return prev.map((s) => (s.id === id ? { id, desc } : s))
              if (!prev[idx].desc)
                return prev.map((s) => (s.id === id ? { id, desc: true } : s))
              return prev.filter((s) => s.id !== id)
            }
            const entry = { id, desc: desc ?? false }
            const next = [...prev, entry]
            if (next.length > maxMultiSortColCount) next.shift()
            return next
          }
          // Single sort (plain click)
          if (desc !== undefined) return [{ id, desc }]
          const current = prev.find((s) => s.id === id)
          if (!current) return [{ id, desc: false }]
          if (!current.desc) return [{ id, desc: true }]
          return []
        })
        setPagination((prev) =>
          prev.pageIndex === 0 ? prev : { ...prev, pageIndex: 0 }
        )
      },
      getFilterValue: () => columnFilters[id] ?? "",
      setFilterValue(val) {
        setColumnFilters((prev) => ({ ...prev, [id]: val }))
        setPagination((prev) =>
          prev.pageIndex === 0 ? prev : { ...prev, pageIndex: 0 }
        )
      },
      getFacetedUniqueValues: () => facetedUniqueValues[id] ?? new Map(),
      getIsVisible: () => columnVisibility[id] !== false,
      toggleVisibility(isVisible) {
        setColumnVisibility((prev) => ({ ...prev, [id]: isVisible }))
      },
      // ── Sizing ──────────────────────────────────────────────────────
      getSize: () => columnSizing[id] ?? def?.size ?? 150,
      setSize(n) {
        const min = def?.minSize ?? 40
        const max = def?.maxSize ?? 800
        setColumnSizing((prev) => ({
          ...prev,
          [id]: Math.min(max, Math.max(min, n)),
        }))
      },
      resetSize() {
        setColumnSizing((prev) => {
          const next = { ...prev }
          delete next[id]
          return next
        })
      },
      getCanResize: () => def?.enableResizing !== false,
      // ── Pinning ─────────────────────────────────────────────────────
      getCanPin: () => def?.enablePinning !== false,
      getIsPinned() {
        if ((columnPinning.left ?? []).includes(id)) return "left"
        if ((columnPinning.right ?? []).includes(id)) return "right"
        return false
      },
      pin(pos) {
        setColumnPinning((prev) => {
          const left = (prev.left ?? []).filter((c) => c !== id)
          const right = (prev.right ?? []).filter((c) => c !== id)
          if (pos === "left") left.push(id)
          else if (pos === "right") right.push(id)
          return { left, right }
        })
      },
      getStart(position) {
        if (position !== "left") return 0
        const leftIds = (columnPinning.left ?? []).filter(
          (cid) => columnVisibility[cid] !== false
        )
        const idx = leftIds.indexOf(id)
        if (idx <= 0) return 0
        let offset = 0
        for (let i = 0; i < idx; i++) offset += getColumnSize(leftIds[i])
        return offset
      },
      getAfter(position) {
        if (position !== "right") return 0
        const rightIds = (columnPinning.right ?? []).filter(
          (cid) => columnVisibility[cid] !== false
        )
        const idx = rightIds.indexOf(id)
        if (idx < 0 || idx >= rightIds.length - 1) return 0
        let offset = 0
        for (let i = idx + 1; i < rightIds.length; i++)
          offset += getColumnSize(rightIds[i])
        return offset
      },
    }
  }

  // ── Row / cell proxies ─────────────────────────────────────────────

  function makeRow(r) {
    if (r.kind === "group") {
      return {
        id: r.id,
        isGrouped: true,
        groupColumnId: r.colId,
        groupValue: r.value,
        depth: r.depth,
        leafCount: r.leafCount,
        subRows: r.children.map(makeRow),
        getIsExpanded: () => !!expanded[r.id],
        toggleExpanded(value) {
          setExpanded((prev) => {
            const next = { ...prev }
            if (value ?? !prev[r.id]) next[r.id] = true
            else delete next[r.id]
            return next
          })
        },
      }
    }

    const { item, oi, depth = 0 } = r
    const row = {
      id: String(oi),
      original: item,
      isGrouped: false,
      depth,
      getValue(colId) {
        const def = columns.find((c) => (c.id ?? c.accessorKey) === colId)
        return def?.accessorKey ? item[def.accessorKey] : undefined
      },
      getIsSelected: () => !!rowSelection[oi],
      toggleSelected(value) {
        setRowSelection((prev) => {
          const next = { ...prev }
          if (value ?? !prev[oi]) next[oi] = true
          else delete next[oi]
          return next
        })
      },
      getVisibleCells() {
        return orderedVisibleColumns.map((d) => {
          const colId = d.id ?? d.accessorKey
          const column = getColumn(colId)
          return {
            id: `${oi}_${colId}`,
            column,
            row,
            getValue: () => row.getValue(colId),
            getContext: () => ({
              column,
              row,
              table: tableApi,
              getValue: () => row.getValue(colId),
            }),
          }
        })
      },
    }
    return row
  }

  // ── Table-level selection (group rows are not selectable) ──────────

  function getIsAllPageRowsSelected() {
    const dataRows = paginatedRows.filter((r) => r.kind === "data")
    if (dataRows.length === 0) return false
    return dataRows.every(({ oi }) => !!rowSelection[oi])
  }

  function getIsSomePageRowsSelected() {
    const dataRows = paginatedRows.filter((r) => r.kind === "data")
    if (dataRows.length === 0) return false
    const some = dataRows.some(({ oi }) => !!rowSelection[oi])
    return some && !getIsAllPageRowsSelected()
  }

  function toggleAllPageRowsSelected(value) {
    const select = value ?? !getIsAllPageRowsSelected()
    setRowSelection((prev) => {
      const next = { ...prev }
      for (const r of paginatedRows) {
        if (r.kind !== "data") continue
        if (select) next[r.oi] = true
        else delete next[r.oi]
      }
      return next
    })
  }

  function getFilteredSelectedRowModel() {
    return {
      rows: grouped.leaves.filter(({ oi }) => !!rowSelection[oi]).map(makeRow),
    }
  }

  // ── Grouping / expanding ───────────────────────────────────────────

  function setGrouping(ids) {
    setGroupingState(ids)
    setPagination((prev) =>
      prev.pageIndex === 0 ? prev : { ...prev, pageIndex: 0 }
    )
  }

  function getIsAllExpanded() {
    return (
      grouped.groupIds.length > 0 &&
      grouped.groupIds.every((id) => !!expanded[id])
    )
  }

  function toggleAllExpanded(value) {
    const expand = value ?? !getIsAllExpanded()
    if (!expand) return setExpanded({})
    const next = {}
    for (const id of grouped.groupIds) next[id] = true
    setExpanded(next)
  }

  // ── Pagination ─────────────────────────────────────────────────────

  const getCanPreviousPage = () => pagination.pageIndex > 0
  const getCanNextPage = () => pagination.pageIndex < pageCount - 1

  function previousPage() {
    setPagination((p) =>
      p.pageIndex === 0 ? p : { ...p, pageIndex: p.pageIndex - 1 }
    )
  }
  function nextPage() {
    setPagination((p) =>
      p.pageIndex >= pageCount - 1 ? p : { ...p, pageIndex: p.pageIndex + 1 }
    )
  }
  function setPageSize(size) {
    setPagination((p) =>
      p.pageSize === size && p.pageIndex === 0
        ? p
        : { pageIndex: 0, pageSize: size }
    )
  }
  function setPageIndex(index) {
    setPagination((p) => (p.pageIndex === index ? p : { ...p, pageIndex: index }))
  }

  // ── Public API (mirrors tanstack surface used in the docs) ─────────

  const tableApi = {
    getHeaderGroups() {
      return [
        {
          id: "header-0",
          headers: orderedVisibleColumns.map((d) => {
            const colId = d.id ?? d.accessorKey
            const column = getColumn(colId)
            return {
              id: colId,
              column,
              isPlaceholder: false,
              getContext: () => ({ column, table: tableApi }),
            }
          }),
        },
      ]
    },
    getRowModel: () => ({ rows: paginatedRows.map(makeRow) }),
    getAllColumns: () =>
      columns.map((d) => getColumn(d.id ?? d.accessorKey)),
    getColumn,
    getFilteredSelectedRowModel,
    getIsAllPageRowsSelected,
    getIsSomePageRowsSelected,
    toggleAllPageRowsSelected,
    previousPage,
    nextPage,
    getCanPreviousPage,
    getCanNextPage,
    setPageSize,
    setPageIndex,
    getPageCount: () => pageCount,
    getRowCount: () => totalRowCount,
    setGlobalFilter,
    setColumnSizing,
    setColumnPinning,
    resetColumnSizing: () => setColumnSizing({}),
    setGrouping,
    getIsAllExpanded,
    toggleAllExpanded,
    getState: () => ({
      sorting,
      globalFilter,
      columnFilters,
      columnVisibility,
      rowSelection,
      pagination,
      columnSizing,
      columnPinning,
      grouping,
      expanded,
    }),
  }

  return tableApi
}
