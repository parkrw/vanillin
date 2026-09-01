import { useMemo } from "react"
import { flexRender, useDataTable } from "../../../lib/use-data-table.js"
import { Badge } from "../../../ui/badge/badge.jsx"
import { Button } from "../../../ui/button/button.jsx"
import { DataTableScroller } from "../../../ui/data-table/data-table.jsx"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../ui/table/table.jsx"
import { ORDER_COPY } from "../console-data.js"
import { CartIcon, PlusIcon } from "../icons.jsx"
import { money, siteName, vdcCost } from "./pricing.js"
import { RowActions } from "../shared.jsx"
import "../../../ui/badge/badge.css"
import "../../../ui/button/button.css"
import "../../../ui/data-table/data-table.css"
import "../../../ui/table/table.css"

/* Every configured vDC, its replica as a second row. */

function summaryColumns(onEdit, onRemove) {
  const num = (key, header) => ({
    accessorKey: key,
    header,
    cell: ({ row }) => <span className="ck-num">{row.original[key].toLocaleString("en-US")}</span>,
  })
  return [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => (
        <span className="ck-order-row-name" data-role={row.original.role}>
          <code className="ck-mono">{row.original.name}</code>
          {row.original.role === "dr" && <Badge variant="info">Replica</Badge>}
        </span>
      ),
    },
    { accessorKey: "site", header: "Site" },
    num("cpu", "CPU (GHz)"),
    num("ram", "RAM (GB)"),
    num("storage", "Storage (GB)"),
    { accessorKey: "protection", header: "Protection" },
    num("vms", "VMs"),
    {
      accessorKey: "monthly",
      header: "$/mo",
      cell: ({ row }) => <span className="ck-num ck-order-row-price">{money(row.original.monthly)}</span>,
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <RowActions
          name={row.original.name}
          items={[
            { label: "Edit", onSelect: () => onEdit(row.original.vdcId) },
            { label: "Remove", onSelect: () => onRemove(row.original.vdcId) },
          ]}
        />
      ),
    },
  ]
}

function summaryRows(vdcs, vms) {
  return vdcs.flatMap((v) => {
    const c = vdcCost(v, vms)
    const primary = {
      id: v.id, vdcId: v.id, role: "primary", name: v.name, site: siteName(v.site),
      cpu: v.cpu, ram: v.ram, storage: c.storageGb, protection: c.tier.name, vms: c.vmCount, monthly: c.pools,
    }
    if (!c.dr) return [primary]
    return [
      primary,
      {
        id: `${v.id}-dr`, vdcId: v.id, role: "dr", name: `${v.name}-dr`, site: siteName(v.drSite),
        cpu: v.cpu * c.tier.share, ram: v.ram * c.tier.share, storage: c.drStorageGb,
        protection: `${c.tier.name} replica`, vms: c.vmCount, monthly: c.drTotal,
      },
    ]
  })
}

export function SummaryStep({ order, cost, onAdd, onEdit, onRemove, onPlace }) {
  const rows = useMemo(() => summaryRows(order.vdcs, order.vms), [order.vdcs, order.vms])
  const columns = useMemo(() => summaryColumns(onEdit, onRemove), [onEdit, onRemove])
  const table = useDataTable({ data: rows, columns, initialPageSize: 50, getRowId: (r) => r.id })
  const total = rows.reduce((sum, r) => sum + r.monthly, 0)
  const annual = order.vdcs.some((v) => v.billing === "annual")
  const editing = order.editing !== null
  const colSpan = table.getHeaderGroups()[0].headers.length

  return (
    <>
      <div className="ck-order-current">
        <div className="ck-order-current-text">
          <span className="ck-order-current-label">Current configuration</span>
          <span className="ck-order-current-name">
            <code className="ck-mono">{order.draft.name}</code> · {siteName(order.draft.site)} · {cost.tier.name.toLowerCase()} protection
          </span>
        </div>
        <span className="ck-order-current-price">{money(cost.total)}/mo</span>
        <Button size="sm" variant="outline" className="ck-order-add" onClick={onAdd}>
          <PlusIcon />
          {editing ? "Add back to order" : "Add another vDC"}
        </Button>
      </div>
      <DataTableScroller className="ck-table-wrap">
        <Table className="ck-table ck-order-table">
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((header) => (
                  <TableHead key={header.id}>
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-role={row.original.role}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={colSpan} className="ck-table-empty">
                  Nothing in the order yet. Add the current configuration to start one.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </DataTableScroller>
      <div className="ck-order-totals">
        <div className="ck-order-total-row">
          <span>Total recurring</span>
          <span className="ck-order-total">{money(total)}<span>/mo</span></span>
        </div>
        {annual && (
          <p className="ck-option-desc">Annual vDCs are invoiced once a year at twelve times their monthly line.</p>
        )}
        <div className="ck-order-total-row ck-order-due">
          <span>Due today</span>
          <span className="ck-order-total">{money(0)}</span>
        </div>
        <p className="ck-option-desc">{ORDER_COPY.dueToday}</p>
        <div className="ck-order-place">
          {editing && (
            <p className="ck-order-hint ck-order-editing">
              <code className="ck-mono">{order.draft.name}</code> is out of the order while you edit it. Add it back to place the order.
            </p>
          )}
          <Button className="ck-order-place-btn" disabled={rows.length === 0 || editing} onClick={onPlace}>
            <CartIcon />
            Place order
          </Button>
        </div>
      </div>
    </>
  )
}
