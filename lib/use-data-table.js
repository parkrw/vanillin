import { useState, useMemo } from "react"

/**
 * Render a column definition (header or cell). Function defs receive the
 * context object; strings/elements pass through.
 */
export function flexRender(Comp, props) {
  if (typeof Comp === "function") return Comp(props)
  return Comp ?? null
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
 *
 * Skipped: row expanding, grouping, manual/server-side operations,
 * virtualization.
 *
 * Column sizing:  explicit `size`/`minSize`/`maxSize` on defs,
 *                  `columnSizing` state, `getSize`/`setSize`/`resetSize`.
 * Column pinning: `columnPinning` state (`{ left, right }`),
 *                  `getIsPinned`/`pin`/`getStart`/`getAfter`.
 */
export function useDataTable({ data, columns, initialPageSize = 10, maxMultiSortColCount = 3 }) {
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

  // ── Derived data: filter → sort → paginate ─────────────────────────

  const filteredData = useMemo(() => {
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
  }, [data, columns, columnFilters, globalFilter])

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
      // except this column's own
      let rows = applyGlobal(data)
      for (const [filterId, fv] of Object.entries(columnFilters)) {
        if (filterId === colId) continue
        if (fv == null || fv === "" || (Array.isArray(fv) && fv.length === 0))
          continue
        rows = applyColFilter(rows, filterId, fv)
      }

      const counts = new Map()
      for (const item of rows) {
        const val = item[def.accessorKey]
        counts.set(val, (counts.get(val) ?? 0) + 1)
      }
      result[colId] = counts
    }
    return result
  }, [data, columns, columnFilters, globalFilter])

  const sortedData = useMemo(() => {
    const indexed = filteredData.map((item, i) => ({
      item,
      oi: filteredIndices[i],
    }))
    if (sorting.length === 0) return indexed

    // Resolve accessor keys once
    const keys = sorting.map(({ id: sortId, desc }) => {
      const def = columns.find((c) => (c.id ?? c.accessorKey) === sortId)
      return { key: def?.accessorKey, dir: desc ? -1 : 1 }
    }).filter((k) => k.key)

    if (keys.length === 0) return indexed

    return [...indexed].sort((a, b) => {
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
    })
  }, [filteredData, filteredIndices, columns, sorting])

  const pageCount = Math.max(1, Math.ceil(sortedData.length / pagination.pageSize))

  const paginatedRows = useMemo(() => {
    const { pageIndex, pageSize } = pagination
    const start = pageIndex * pageSize
    return sortedData.slice(start, start + pageSize)
  }, [sortedData, pagination])

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
        setPagination((prev) => ({ ...prev, pageIndex: 0 }))
      },
      getFilterValue: () => columnFilters[id] ?? "",
      setFilterValue(val) {
        setColumnFilters((prev) => ({ ...prev, [id]: val }))
        setPagination((prev) => ({ ...prev, pageIndex: 0 }))
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

  function makeRow({ item, oi }) {
    const row = {
      id: String(oi),
      original: item,
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

  // ── Table-level selection ──────────────────────────────────────────

  function getIsAllPageRowsSelected() {
    if (paginatedRows.length === 0) return false
    return paginatedRows.every(({ oi }) => !!rowSelection[oi])
  }

  function getIsSomePageRowsSelected() {
    if (paginatedRows.length === 0) return false
    const some = paginatedRows.some(({ oi }) => !!rowSelection[oi])
    return some && !getIsAllPageRowsSelected()
  }

  function toggleAllPageRowsSelected(value) {
    const select = value ?? !getIsAllPageRowsSelected()
    setRowSelection((prev) => {
      const next = { ...prev }
      for (const { oi } of paginatedRows) {
        if (select) next[oi] = true
        else delete next[oi]
      }
      return next
    })
  }

  function getFilteredSelectedRowModel() {
    return {
      rows: sortedData.filter(({ oi }) => !!rowSelection[oi]).map(makeRow),
    }
  }

  // ── Pagination ─────────────────────────────────────────────────────

  const getCanPreviousPage = () => pagination.pageIndex > 0
  const getCanNextPage = () => pagination.pageIndex < pageCount - 1

  function previousPage() {
    setPagination((p) => ({ ...p, pageIndex: Math.max(0, p.pageIndex - 1) }))
  }
  function nextPage() {
    setPagination((p) => ({
      ...p,
      pageIndex: Math.min(pageCount - 1, p.pageIndex + 1),
    }))
  }
  function setPageSize(size) {
    setPagination({ pageIndex: 0, pageSize: size })
  }
  function setPageIndex(index) {
    setPagination((p) => ({ ...p, pageIndex: index }))
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
    setGlobalFilter,
    setColumnSizing,
    setColumnPinning,
    resetColumnSizing: () => setColumnSizing({}),
    getState: () => ({
      sorting,
      globalFilter,
      columnFilters,
      columnVisibility,
      rowSelection,
      pagination,
      columnSizing,
      columnPinning,
    }),
  }

  return tableApi
}
