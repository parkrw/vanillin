import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "../../ui/table/table.jsx"
import { Checkbox } from "../../ui/checkbox/checkbox.jsx"
import { Button } from "../../ui/button/button.jsx"
import { Input } from "../../ui/input/input.jsx"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "../../ui/dropdown-menu/dropdown-menu.jsx"
import { useDataTable, flexRender } from "../../lib/use-data-table.js"
import {
  DataTableColumnHeader,
  DataTableFacetedFilter,
  DataTableColumnResizer,
} from "../../ui/data-table/data-table.jsx"

import "../../ui/table/table.css"
import "../../ui/checkbox/checkbox.css"
import "../../ui/button/button.css"
import "../../ui/input/input.css"
import "../../ui/dropdown-menu/dropdown-menu.css"
import "../../ui/popover/popover.css"
import "../../ui/command/command.css"
import "../../ui/badge/badge.css"
import "../../ui/separator/separator.css"
import "../../ui/data-table/data-table.css"

// ── Inline SVG icons (zero-dep, no lucide) ───────────────────────────

function ChevronLeft() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m15 18-6-6 6-6" />
    </svg>
  )
}

function ChevronRight() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m9 18 6-6-6-6" />
    </svg>
  )
}

function MoreHorizontal() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="1" />
      <circle cx="19" cy="12" r="1" />
      <circle cx="5" cy="12" r="1" />
    </svg>
  )
}

// ── Sample data (a payments table) ───────────────────────────────────

const payments = [
  { id: "728ed52f", amount: 100, status: "pending", email: "m@example.com" },
  { id: "489e1d42", amount: 125, status: "processing", email: "example@gmail.com" },
  { id: "a1b2c3d4", amount: 250, status: "success", email: "john@example.com" },
  { id: "e5f6g7h8", amount: 75, status: "failed", email: "jane@example.com" },
  { id: "i9j0k1l2", amount: 300, status: "success", email: "bob@example.com" },
  { id: "m3n4o5p6", amount: 50, status: "pending", email: "alice@example.com" },
  { id: "q7r8s9t0", amount: 200, status: "processing", email: "charlie@example.com" },
  { id: "u1v2w3x4", amount: 150, status: "success", email: "diana@example.com" },
  { id: "y5z6a7b8", amount: 175, status: "failed", email: "eve@example.com" },
  { id: "c9d0e1f2", amount: 225, status: "pending", email: "frank@example.com" },
  { id: "g3h4i5j6", amount: 350, status: "success", email: "grace@example.com" },
  { id: "k7l8m9n0", amount: 400, status: "processing", email: "heidi@example.com" },
  { id: "o1p2q3r4", amount: 450, status: "success", email: "ivan@example.com" },
  { id: "s5t6u7v8", amount: 500, status: "failed", email: "judy@example.com" },
  { id: "w9x0y1z2", amount: 275, status: "pending", email: "karl@example.com" },
  { id: "a3b4c5d6", amount: 325, status: "success", email: "laura@example.com" },
  { id: "e7f8g9h0", amount: 550, status: "processing", email: "mike@example.com" },
  { id: "i1j2k3l4", amount: 600, status: "success", email: "nancy@example.com" },
  { id: "m5n6o7p8", amount: 425, status: "pending", email: "oscar@example.com" },
  { id: "q9r0s1t2", amount: 375, status: "failed", email: "paula@example.com" },
]

const currencyFmt = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
})

// ── Column definitions ───────────────────────────────────────────────

const columns = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <span style={{ textTransform: "capitalize" }}>{row.getValue("status")}</span>
    ),
  },
  {
    accessorKey: "email",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Email" />,
    cell: ({ row }) => <span>{row.getValue("email")}</span>,
  },
  {
    accessorKey: "amount",
    header: ({ column }) => (
      <div style={{ textAlign: "end" }}>
        <DataTableColumnHeader column={column} title="Amount" />
      </div>
    ),
    cell: ({ row }) => (
      <div style={{ textAlign: "end", fontWeight: 500 }}>
        {currencyFmt.format(row.getValue("amount"))}
      </div>
    ),
  },
  {
    id: "actions",
    enableHiding: false,
    enableSorting: false,
    cell: ({ row }) => {
      const payment = row.original
      return (
        <DropdownMenu>
          <DropdownMenuTrigger className="data-table-actions-trigger" aria-label="Row actions">
            <MoreHorizontal />
          </DropdownMenuTrigger>
          <DropdownMenuContent side="bottom" align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onSelect={() => navigator.clipboard.writeText(payment.id)}
            >
              Copy payment ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>View customer</DropdownMenuItem>
            <DropdownMenuItem>View payment details</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]

// ── Sized / pinned demo ──────────────────────────────────────────────

const sizedColumns = [
  {
    id: "select",
    size: 40,
    enableResizing: false,
    enablePinning: true,
    enableHiding: false,
    enableSorting: false,
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
  },
  {
    accessorKey: "id",
    header: "ID",
    size: 100,
    enablePinning: true,
    cell: ({ row }) => (
      <code style={{ fontSize: "0.8125rem" }}>{row.getValue("id")}</code>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    size: 120,
    cell: ({ row }) => (
      <span style={{ textTransform: "capitalize" }}>{row.getValue("status")}</span>
    ),
  },
  {
    accessorKey: "email",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Email" />,
    size: 260,
    minSize: 100,
  },
  {
    accessorKey: "amount",
    header: ({ column }) => (
      <div style={{ textAlign: "end" }}>
        <DataTableColumnHeader column={column} title="Amount" />
      </div>
    ),
    size: 120,
    cell: ({ row }) => (
      <div style={{ textAlign: "end", fontWeight: 500 }}>
        {currencyFmt.format(row.getValue("amount"))}
      </div>
    ),
  },
]

function SizedPinnedDemo() {
  const table = useDataTable({ data: payments, columns: sizedColumns, initialPageSize: 5 })

  // CSS vars for column widths — set on the <table> element
  const sizeVars = {}
  for (const col of table.getAllColumns()) {
    if (col.getIsVisible()) {
      sizeVars[`--dt-size-${col.id}`] = `${col.getSize()}px`
    }
  }

  // Helper: compute pinned-cell props for a column
  function pinProps(column) {
    const pinned = column.getIsPinned()
    if (!pinned) return {}
    const { columnPinning: cp, columnVisibility: cv } = table.getState()
    const result = { className: "data-table-pinned" }

    if (pinned === "left") {
      const ids = (cp.left ?? []).filter((cid) => cv[cid] !== false)
      const i = ids.indexOf(column.id)
      const prev = ids.slice(0, i)
      result.style = {
        insetInlineStart: prev.length
          ? `calc(${prev.map((cid) => `var(--dt-size-${cid})`).join(" + ")})`
          : "0px",
      }
      if (i === ids.length - 1) result["data-pin-edge"] = "left"
    } else {
      const ids = (cp.right ?? []).filter((cid) => cv[cid] !== false)
      const i = ids.indexOf(column.id)
      const after = ids.slice(i + 1)
      result.style = {
        insetInlineEnd: after.length
          ? `calc(${after.map((cid) => `var(--dt-size-${cid})`).join(" + ")})`
          : "0px",
      }
      if (i === 0) result["data-pin-edge"] = "right"
    }
    return result
  }

  return (
    <section className="pg-section" data-pg="dt-sized">
      <h3>Column sizing & pinning</h3>
      <p>
        Drag the column edges to resize. Double-click a handle to reset.
        Use the Columns dropdown to pin columns left or right, then scroll
        the table horizontally to see sticky pinning in action.
      </p>

      {/* Toolbar */}
      <div className="data-table-toolbar">
        <div className="data-table-toolbar-actions">
          <DropdownMenu>
            <DropdownMenuTrigger as={Button} variant="outline" size="sm" data-pg="dt-sized-columns-btn">
              Columns
            </DropdownMenuTrigger>
            <DropdownMenuContent side="bottom" align="end">
              <DropdownMenuLabel>Visibility</DropdownMenuLabel>
              {table.getAllColumns().filter((c) => c.getCanHide()).map((col) => (
                <DropdownMenuCheckboxItem
                  key={col.id}
                  checked={col.getIsVisible()}
                  onCheckedChange={(val) => col.toggleVisibility(!!val)}
                >
                  {col.id}
                </DropdownMenuCheckboxItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Pin</DropdownMenuLabel>
              {table.getAllColumns().filter((c) => c.getCanPin()).map((col) => {
                const pinned = col.getIsPinned()
                return (
                  <DropdownMenuItem
                    key={`pin-${col.id}`}
                    onSelect={() => {
                      if (!pinned) col.pin("left")
                      else if (pinned === "left") col.pin("right")
                      else col.pin(false)
                    }}
                  >
                    {col.id}: {pinned ? `pinned ${pinned}` : "unpinned"}
                  </DropdownMenuItem>
                )
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Table with constrained width to demonstrate horizontal scroll */}
      <div style={{ maxInlineSize: "36rem" }}>
        <Table className="data-table-sized" style={sizeVars}>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((header) => {
                  const pp = pinProps(header.column)
                  const sorted = header.column.getIsSorted()
                  const isPrimary = sorted && header.column.getSortIndex() === 0
                  return (
                    <TableHead
                      key={header.id}
                      className={pp.className}
                      style={{
                        width: `var(--dt-size-${header.id})`,
                        ...pp.style,
                      }}
                      {...(pp["data-pin-edge"] != null ? { "data-pin-edge": pp["data-pin-edge"] } : {})}
                      {...(isPrimary
                        ? { "aria-sort": sorted === "asc" ? "ascending" : "descending" }
                        : {})}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getCanResize() && (
                        <DataTableColumnResizer column={header.column} />
                      )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-selected={row.getIsSelected() ? "true" : undefined}
                >
                  {row.getVisibleCells().map((cell) => {
                    const pp = pinProps(cell.column)
                    return (
                      <TableCell
                        key={cell.id}
                        className={pp.className}
                        style={pp.style}
                        {...(pp["data-pin-edge"] != null ? { "data-pin-edge": pp["data-pin-edge"] } : {})}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    )
                  })}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={sizedColumns.length}
                  style={{ height: "6rem", textAlign: "center" }}
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </section>
  )
}

// ── Page ─────────────────────────────────────────────────────────────

export default function DataTablePage() {
  const table = useDataTable({ data: payments, columns, initialPageSize: 10 })
  const { pagination } = table.getState()
  const selectedCount = table.getFilteredSelectedRowModel().rows.length

  return (
    <>
      <h2>Data Table</h2>

      <section className="pg-section">
        <h3>Filtering</h3>
        <p>
          The global filter is a case-insensitive substring match across every
          column with an <code>accessorKey</code>. Set{" "}
          <code>enableGlobalFilter: false</code> on a column def to exclude it.
          Use <code>getFilterValue(rawValue)</code> on a column def to override
          what string the global filter matches against (useful for timestamps
          or enum codes). Global and column filters compose with AND — a row
          must pass both to appear.
        </p>
        <h3>Faceted counts</h3>
        <p>
          <code>column.getFacetedUniqueValues()</code> returns a{" "}
          <code>Map&lt;value, count&gt;</code> computed from rows passing every
          active filter <em>except</em> the facet column's own selection. This
          keeps counts useful: selecting "pending" does not collapse all other
          status counts to zero.
        </p>
        <h3>Multi-sort</h3>
        <p>
          Shift-click a sortable column header to append it as a secondary (or
          tertiary) sort key. Plain click resets to single-column sort. The
          comparator chain is stable — ties on all sort keys preserve original
          data order. <code>maxMultiSortColCount</code> (default 3) caps the
          depth; exceeding it drops the oldest key. <code>aria-sort</code> goes
          on the primary column only; secondary columns expose their position
          via the button's <code>aria-label</code>.
        </p>
      </section>

      <section className="pg-section" data-pg="dt">
        <h3>Payments</h3>

        {/* Toolbar: global filter + faceted filter + column filter + visibility */}
        <div className="data-table-toolbar">
          <div className="data-table-toolbar-filters">
            <Input
              className="data-table-filter"
              placeholder="Search all columns..."
              value={table.getState().globalFilter}
              onChange={(e) => table.setGlobalFilter(e.target.value)}
              data-pg="dt-global-filter"
            />
            <DataTableFacetedFilter
              column={table.getColumn("status")}
              title="Status"
            />
            <Input
              className="data-table-filter"
              placeholder="Filter emails..."
              value={table.getColumn("email")?.getFilterValue() ?? ""}
              onChange={(e) =>
                table.getColumn("email")?.setFilterValue(e.target.value)
              }
              data-pg="dt-filter"
            />
          </div>
          <div className="data-table-toolbar-actions">
            <DropdownMenu>
              <DropdownMenuTrigger as={Button} variant="outline" size="sm" data-pg="dt-columns-btn">
                Columns
              </DropdownMenuTrigger>
              <DropdownMenuContent side="bottom" align="end">
                {table
                  .getAllColumns()
                  .filter((col) => col.getCanHide())
                  .map((col) => (
                    <DropdownMenuCheckboxItem
                      key={col.id}
                      checked={col.getIsVisible()}
                      onCheckedChange={(val) => col.toggleVisibility(!!val)}
                    >
                      {col.id}
                    </DropdownMenuCheckboxItem>
                  ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Table */}
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const sorted = header.column.getIsSorted()
                  const isPrimary = sorted && header.column.getSortIndex() === 0
                  return (
                    <TableHead
                      key={header.id}
                      {...(isPrimary
                        ? {
                            "aria-sort":
                              sorted === "asc" ? "ascending" : "descending",
                          }
                        : {})}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-selected={row.getIsSelected() ? "true" : undefined}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  style={{ height: "6rem", textAlign: "center" }}
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        <div className="data-table-pagination">
          <div className="data-table-selection-count" data-pg="dt-selection">
            {selectedCount} of {payments.length} row(s) selected.
          </div>
          <div className="data-table-page-controls">
            <div className="data-table-page-size">
              <span>Rows per page</span>
              <select
                value={pagination.pageSize}
                onChange={(e) => table.setPageSize(Number(e.target.value))}
                data-pg="dt-page-size"
              >
                {[5, 10, 20].map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>
            <div className="data-table-page-info" data-pg="dt-page-info">
              Page {pagination.pageIndex + 1} of {table.getPageCount()}
            </div>
            <div className="data-table-page-nav">
              <Button
                variant="outline"
                size="icon"
                className="btn--sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                aria-label="Previous page"
                data-pg="dt-prev"
              >
                <ChevronLeft />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="btn--sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                aria-label="Next page"
                data-pg="dt-next"
              >
                <ChevronRight />
              </Button>
            </div>
          </div>
        </div>
      </section>

      <SizedPinnedDemo />

      <section className="pg-section">
        <h3>Column sizing</h3>
        <p>
          Add <code>size</code>, <code>minSize</code> (default 40), and{" "}
          <code>maxSize</code> (default 800) to a column definition. The engine
          exposes <code>column.getSize()</code> (O(1)),{" "}
          <code>column.setSize(n)</code>, and <code>column.resetSize()</code>.
          Set <code>enableResizing: false</code> to lock a column.
        </p>
        <p>
          Widths ride on CSS custom properties set once on the{" "}
          <code>&lt;table&gt;</code> element (<code>--dt-size-&lt;colId&gt;</code>
          ). During a pointer drag the resizer updates the property directly for
          zero-rerender feedback; React state commits on <code>pointerup</code>.
        </p>
        <h3>table-layout: fixed</h3>
        <p>
          Predictable column sizing requires{" "}
          <code>table-layout:&nbsp;fixed</code>. Vanillin ships this as an
          opt-in class: add <code>className="data-table-sized"</code> to your{" "}
          <code>&lt;Table&gt;</code>. Without it the table keeps the browser's
          intrinsic <code>auto</code> layout and renders identically to before —
          existing tables are never affected.
        </p>
        <h3>Column pinning</h3>
        <p>
          <code>column.pin("left")</code> / <code>column.pin("right")</code> /{" "}
          <code>column.pin(false)</code>. The engine exposes{" "}
          <code>getIsPinned()</code>, <code>getStart("left")</code>, and{" "}
          <code>getAfter("right")</code> for cumulative sticky offsets over
          visible columns (hiding a pinned column shifts the rest). The{" "}
          <code>columnPinning</code> state is <code>{`{ left: [], right: [] }`}</code>.
        </p>
        <h3>No split header groups</h3>
        <p>
          TanStack exposes <code>getLeftHeaderGroups</code> /{" "}
          <code>getCenterHeaderGroups</code> /{" "}
          <code>getRightHeaderGroups</code>. Vanillin deliberately omits these.
          A single <code>getHeaderGroups()</code> returns columns in pinning
          order (left, center, right), and <code>position:&nbsp;sticky</code>{" "}
          does the visual work with far less machinery. The ordered column list
          is computed once per render as a <code>useMemo</code>.
        </p>
      </section>
    </>
  )
}
