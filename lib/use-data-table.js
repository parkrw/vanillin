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
 * Zero-dep table engine replacing @tanstack/react-table for the shadcn
 * data-table pattern. Mirrors the tanstack surface the docs example uses:
 *
 *   column defs      accessorKey + header + cell render fns
 *   sorting          single-column asc/desc toggle, aria-sort
 *   column filter    text substring filter on one column
 *   visibility       toggle columns on/off
 *   row selection    header tri-state + per-row checkboxes
 *   pagination       page size selector + prev/next
 *
 * Skipped (beyond the payments example scope): multi-sort, global filter,
 * column pinning/resizing, row expanding, grouping, faceted filters,
 * manual/server-side operations, virtualization.
 */
export function useDataTable({ data, columns, initialPageSize = 10 }) {
  const [sorting, setSorting] = useState(null)
  const [columnFilters, setColumnFilters] = useState({})
  const [columnVisibility, setColumnVisibility] = useState({})
  const [rowSelection, setRowSelection] = useState({})
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: initialPageSize,
  })

  // ── Derived data: filter → sort → paginate ─────────────────────────

  const filteredData = useMemo(() => {
    let result = data
    for (const [colId, filterValue] of Object.entries(columnFilters)) {
      if (!filterValue) continue
      const def = columns.find((c) => (c.id ?? c.accessorKey) === colId)
      if (!def?.accessorKey) continue
      const lower = String(filterValue).toLowerCase()
      result = result.filter((item) => {
        const val = item[def.accessorKey]
        return val != null && String(val).toLowerCase().includes(lower)
      })
    }
    return result
  }, [data, columns, columnFilters])

  const filteredIndices = useMemo(
    () => filteredData.map((item) => data.indexOf(item)),
    [data, filteredData]
  )

  const sortedData = useMemo(() => {
    const indexed = filteredData.map((item, i) => ({
      item,
      oi: filteredIndices[i],
    }))
    if (!sorting) return indexed
    const def = columns.find((c) => (c.id ?? c.accessorKey) === sorting.id)
    if (!def?.accessorKey) return indexed
    const key = def.accessorKey
    const dir = sorting.desc ? -1 : 1
    return [...indexed].sort((a, b) => {
      const va = a.item[key]
      const vb = b.item[key]
      if (va == null && vb == null) return 0
      if (va == null) return 1
      if (vb == null) return -1
      if (va < vb) return -1 * dir
      if (va > vb) return 1 * dir
      return 0
    })
  }, [filteredData, filteredIndices, columns, sorting])

  const pageCount = Math.max(1, Math.ceil(sortedData.length / pagination.pageSize))

  const paginatedRows = useMemo(() => {
    const { pageIndex, pageSize } = pagination
    const start = pageIndex * pageSize
    return sortedData.slice(start, start + pageSize)
  }, [sortedData, pagination])

  // ── Column proxy ───────────────────────────────────────────────────

  function getColumn(id) {
    const def = columns.find((c) => (c.id ?? c.accessorKey) === id)
    return {
      id,
      columnDef: def,
      getCanSort: () => def?.enableSorting !== false,
      getCanHide: () => def?.enableHiding !== false,
      getIsSorted() {
        if (!sorting || sorting.id !== id) return false
        return sorting.desc ? "desc" : "asc"
      },
      toggleSorting(desc) {
        setSorting((prev) => {
          if (desc !== undefined) return { id, desc }
          if (!prev || prev.id !== id) return { id, desc: false }
          if (!prev.desc) return { id, desc: true }
          return null
        })
        setPagination((prev) => ({ ...prev, pageIndex: 0 }))
      },
      getFilterValue: () => columnFilters[id] ?? "",
      setFilterValue(val) {
        setColumnFilters((prev) => ({ ...prev, [id]: val }))
        setPagination((prev) => ({ ...prev, pageIndex: 0 }))
      },
      getIsVisible: () => columnVisibility[id] !== false,
      toggleVisibility(isVisible) {
        setColumnVisibility((prev) => ({ ...prev, [id]: isVisible }))
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
        return columns
          .filter((d) => columnVisibility[d.id ?? d.accessorKey] !== false)
          .map((d) => {
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
          headers: columns
            .filter((d) => columnVisibility[d.id ?? d.accessorKey] !== false)
            .map((d) => {
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
    getState: () => ({
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      pagination,
    }),
  }

  return tableApi
}
