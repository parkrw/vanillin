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

import "../../ui/table/table.css"
import "../../ui/checkbox/checkbox.css"
import "../../ui/button/button.css"
import "../../ui/input/input.css"
import "../../ui/dropdown-menu/dropdown-menu.css"
import "../../ui/data-table/data-table.css"

// ── Inline SVG icons (zero-dep, no lucide) ───────────────────────────

function ArrowUpDown() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m7 15 5 5 5-5" />
      <path d="m7 9 5-5 5 5" />
    </svg>
  )
}

function ArrowUp() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m7 9 5-5 5 5" />
    </svg>
  )
}

function ArrowDown() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m7 15 5 5 5-5" />
    </svg>
  )
}

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

function SortIcon({ sorted }) {
  if (sorted === "asc") return <ArrowUp />
  if (sorted === "desc") return <ArrowDown />
  return <ArrowUpDown />
}

// ── Sample data (mirrors the shadcn payments example) ────────────────

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
    header: ({ column }) => {
      const sorted = column.getIsSorted()
      return (
        <button
          className="data-table-sort-btn"
          onClick={() => column.toggleSorting(sorted === "asc")}
          {...(sorted ? { "data-sorted": sorted } : {})}
        >
          Email
          <SortIcon sorted={sorted} />
        </button>
      )
    },
    cell: ({ row }) => <span>{row.getValue("email")}</span>,
  },
  {
    accessorKey: "amount",
    header: ({ column }) => {
      const sorted = column.getIsSorted()
      return (
        <div style={{ textAlign: "end" }}>
          <button
            className="data-table-sort-btn"
            onClick={() => column.toggleSorting(sorted === "asc")}
            {...(sorted ? { "data-sorted": sorted } : {})}
          >
            Amount
            <SortIcon sorted={sorted} />
          </button>
        </div>
      )
    },
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

// ── Page ─────────────────────────────────────────────────────────────

export default function DataTablePage() {
  const table = useDataTable({ data: payments, columns, initialPageSize: 10 })
  const { pagination } = table.getState()
  const selectedCount = table.getFilteredSelectedRowModel().rows.length

  return (
    <>
      <h2>Data Table</h2>

      <section className="pg-section" data-pg="dt">
        <h3>Payments</h3>

        {/* Toolbar: filter + column visibility */}
        <div className="data-table-toolbar">
          <Input
            className="data-table-filter"
            placeholder="Filter emails..."
            value={table.getColumn("email")?.getFilterValue() ?? ""}
            onChange={(e) =>
              table.getColumn("email")?.setFilterValue(e.target.value)
            }
            data-pg="dt-filter"
          />
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
                  return (
                    <TableHead
                      key={header.id}
                      {...(sorted
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
    </>
  )
}
