import { useMemo, useState } from "react"
import { flexRender, useDataTable } from "../../../lib/use-data-table.js"
import { Attachment, AttachmentAction, AttachmentActions, AttachmentContent, AttachmentDescription, AttachmentGroup, AttachmentMedia, AttachmentTitle } from "../../../ui/attachment/attachment.jsx"
import { Badge } from "../../../ui/badge/badge.jsx"
import { ButtonGroup } from "../../../ui/button-group/button-group.jsx"
import { Button } from "../../../ui/button/button.jsx"
import { Card, CardContent, CardHeader, CardTitle } from "../../../ui/card/card.jsx"
import { Checkbox } from "../../../ui/checkbox/checkbox.jsx"
import { ContextMenu, ContextMenuContent, ContextMenuLabel, ContextMenuSeparator, ContextMenuTrigger } from "../../../ui/context-menu/context-menu.jsx"
import { CopyField } from "../../../ui/copy-field/copy-field.jsx"
import { DataTableColumnHeader, DataTableFacetedFilter, DataTableScroller } from "../../../ui/data-table/data-table.jsx"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "../../../ui/empty/empty.jsx"
import { Input } from "../../../ui/input/input.jsx"
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemTitle } from "../../../ui/item/item.jsx"
import { Progress } from "../../../ui/progress/progress.jsx"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../ui/table/table.jsx"
import { toast } from "../../../ui/toast/toast.jsx"
import { Tooltip, TooltipContent, TooltipTrigger } from "../../../ui/tooltip/tooltip.jsx"
import { API_KEYS, INSTANCES, ORDER_SITES, QUOTAS, SSH_KEYS, UPLOADED_IMAGES } from "../console-data.js"
import { DashCard } from "./dashboard.jsx"
import { BoxIcon, CloseIcon, DiskIcon, PlusIcon, RefreshIcon, UploadIcon } from "../icons.jsx"
import { ActionItems, RowActions, StatusBadge, Tip, fakeTask } from "../shared.jsx"
import "../../../ui/attachment/attachment.css"
import "../../../ui/badge/badge.css"
import "../../../ui/button/button.css"
import "../../../ui/button-group/button-group.css"
import "../../../ui/card/card.css"
import "../../../ui/checkbox/checkbox.css"
import "../../../ui/context-menu/context-menu.css"
import "../../../ui/copy-field/copy-field.css"
import "../../../ui/data-table/data-table.css"
import "../../../ui/empty/empty.css"
import "../../../ui/input/input.css"
import "../../../ui/item/item.css"
import "../../../ui/progress/progress.css"
import "../../../ui/table/table.css"
import "../../../ui/toast/toast.css"
import "../../../ui/tooltip/tooltip.css"

/* ── Virtual machines table (the advanced data-table composition) ────── */

const instanceActions = (instance, onDetails) => [
  { label: "View details", onSelect: () => onDetails(instance) },
  { label: "Start" },
  { label: "Stop" },
  { label: "Reboot" },
  { label: "Resize" },
  { label: "Snapshot" },
  { label: "Delete", danger: true },
]

function instanceColumns(onDetails) {
  return [
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
          aria-label={`Select ${row.original.name}`}
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "name",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
      cell: ({ row }) => (
        <button type="button" className="ck-cell-link" onClick={() => onDetails(row.original)}>
          {row.getValue("name")}
        </button>
      ),
    },
    {
      accessorKey: "status",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
      cell: ({ row }) => <StatusBadge value={row.getValue("status")} />,
    },
    {
      accessorKey: "az",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Zone" />,
    },
    {
      accessorKey: "size",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Size" />,
    },
    {
      accessorKey: "ip",
      header: "IP address",
      cell: ({ row }) => <code className="ck-mono">{row.getValue("ip")}</code>,
    },
    {
      accessorKey: "user",
      header: ({ column }) => <DataTableColumnHeader column={column} title="User" />,
    },
    {
      id: "actions",
      header: "",
      enableSorting: false,
      enableHiding: false,
      cell: ({ row }) => (
        <RowActions name={row.original.name} items={instanceActions(row.original, onDetails)} />
      ),
    },
  ]
}

/* Every paginated table shares one footer: a rows-per-page select beside the
   pager, both driving the same useDataTable instance. */
const PAGE_SIZES = [5, 10, 20, 50]

function TableFooter({ table, children }) {
  const { pageIndex, pageSize } = table.getState().pagination
  return (
    <div className="ck-table-foot">
      <span>{children}</span>
      <div className="ck-table-pager">
        <label className="ck-page-size">
          Rows per page
          <select value={pageSize} onChange={(e) => table.setPageSize(Number(e.target.value))}>
            {PAGE_SIZES.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
        <span>Page {pageIndex + 1} of {Math.max(table.getPageCount(), 1)}</span>
        <ButtonGroup>
          <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
            Prev
          </Button>
          <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
            Next
          </Button>
        </ButtonGroup>
      </div>
    </div>
  )
}

export function InstancesView({ project, onDetails }) {
  const data = useMemo(
    () => (project === "admin" ? INSTANCES : INSTANCES.filter((s) => s.project === project)),
    [project]
  )
  const columns = useMemo(() => instanceColumns(onDetails), [onDetails])
  const table = useDataTable({ data, columns, initialPageSize: 5 })
  const selected = Object.keys(table.getState().rowSelection).length
  const rows = table.getRowModel().rows
  // The row under the pointer when the right-click landed; one menu serves
  // the whole body.
  const [contextRow, setContextRow] = useState(null)

  return (
    <div className="ck-view">
      <div className="ck-page-head">
        <h4 className="ck-page-title">Virtual Machines</h4>
        <span className="ck-page-count">{data.length} virtual machines in {project}</span>
      </div>
      <div className="ck-actions">
        <Button size="sm" onClick={() => fakeTask("Launch virtual machine", "Scheduling on az-east-1a")}>
          Launch virtual machine
        </Button>
        <ButtonGroup>
          <Button variant="outline" size="sm" disabled={!selected} onClick={() => fakeTask("Start", `${selected} virtual machine(s)`)}>Start</Button>
          <Button variant="outline" size="sm" disabled={!selected} onClick={() => fakeTask("Stop", `${selected} virtual machine(s)`)}>Stop</Button>
          <Button variant="outline" size="sm" disabled={!selected} onClick={() => fakeTask("Live migrate", `${selected} virtual machine(s)`)}>Migrate</Button>
        </ButtonGroup>
        <div className="ck-actions-spacer" />
        <Tooltip>
          <TooltipTrigger
            as={Button}
            variant="ghost"
            size="icon"
            className="ck-refresh"
            aria-label="Refresh virtual machines"
            onClick={() => toast("Inventory refreshed", { description: `${data.length} virtual machines in ${project}` })}
          >
            <RefreshIcon />
          </TooltipTrigger>
          <TooltipContent>Refresh</TooltipContent>
        </Tooltip>
        <Tip label="Filter by name, zone or size">
          <Input
            className="ck-filter"
            placeholder="Filter virtual machines..."
            value={table.getState().globalFilter}
            onChange={(e) => table.setGlobalFilter(e.target.value)}
          />
        </Tip>
        <Tip label="Filter by status">
          <DataTableFacetedFilter column={table.getColumn("status")} title="Status" />
        </Tip>
      </div>
      <ContextMenu>
        <DataTableScroller className="ck-table-wrap">
          <Table className="ck-table">
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((header) => {
                  const sorted = header.column.getIsSorted()
                  const isPrimary = sorted && header.column.getSortIndex() === 0
                  return (
                    <TableHead
                      key={header.id}
                      {...(isPrimary
                        ? { "aria-sort": sorted === "asc" ? "ascending" : "descending" }
                        : {})}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
            <ContextMenuTrigger
              as={TableBody}
              onContextMenu={(e) => {
                const tr = e.target.closest("tr[data-name]")
                setContextRow(tr ? data.find((s) => s.name === tr.dataset.name) ?? null : null)
              }}
            >
              {rows.length > 0 ? (
                rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-name={row.original.name}
                    data-selected={row.getIsSelected() ? "true" : undefined}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="ck-table-empty">
                    No virtual machines match.
                  </TableCell>
                </TableRow>
              )}
            </ContextMenuTrigger>
          </Table>
        </DataTableScroller>
        <ContextMenuContent className="ck-context">
          {contextRow && (
            <>
              <ContextMenuLabel className="ck-context-label">
                <code className="ck-mono">{contextRow.name}</code>
                <StatusBadge value={contextRow.status} />
              </ContextMenuLabel>
              <ContextMenuSeparator />
              <ActionItems name={contextRow.name} items={instanceActions(contextRow, onDetails)} />
            </>
          )}
        </ContextMenuContent>
      </ContextMenu>
      <TableFooter table={table}>{selected} of {data.length} selected · right-click a row for its actions</TableFooter>
    </div>
  )
}

/* ── Simple resource tables ──────────────────────────────────────────── */

/* `rows` are cell arrays; when `actions` is given each row grows a trailing
   menu cell, so one table shape serves every resource page. The engine only
   paginates here — the one column exists so it has something to index. */
const SIMPLE_COLUMNS = [{ accessorKey: "i" }]

export function SimpleTable({ title, count, cols, rows, actions, children }) {
  const data = useMemo(() => rows.map((cells, i) => ({ i, cells, action: actions?.[i] })), [rows, actions])
  const table = useDataTable({ data, columns: SIMPLE_COLUMNS, initialPageSize: 10 })
  const pageRows = table.getRowModel().rows
  return (
    <div className="ck-view">
      <div className="ck-page-head">
        <h4 className="ck-page-title">{title}</h4>
        <span className="ck-page-count">{count}</span>
      </div>
      {children}
      <DataTableScroller className="ck-table-wrap">
        <Table className="ck-table">
          <TableHeader>
            <TableRow>
              {cols.map((c) => <TableHead key={c}>{c}</TableHead>)}
              {actions && <TableHead />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageRows.map(({ original: r }) => (
              <TableRow key={r.i}>
                {r.cells.map((cell, j) => <TableCell key={j}>{cell}</TableCell>)}
                {r.action && (
                  <TableCell>
                    <RowActions name={r.action.name} items={r.action.items} />
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </DataTableScroller>
      <TableFooter table={table}>{count}</TableFooter>
    </div>
  )
}

const UPLOAD_STATUS = {
  done: "Ready to launch",
  uploading: "Uploading",
  processing: "Converting",
  error: "Upload failed",
}

export function ImageUploads() {
  return (
    <Card>
      <CardHeader><CardTitle className="ck-card-title">Uploads</CardTitle></CardHeader>
      <CardContent className="ck-uploads">
        <AttachmentGroup>
          {UPLOADED_IMAGES.map((f) => (
            <Attachment key={f.name} state={f.state} size="sm" className="ck-upload">
              <AttachmentMedia><DiskIcon /></AttachmentMedia>
              <AttachmentContent>
                <AttachmentTitle>{f.name}</AttachmentTitle>
                <AttachmentDescription>
                  {f.size} · {UPLOAD_STATUS[f.state]}
                </AttachmentDescription>
              </AttachmentContent>
              <AttachmentActions>
                <AttachmentAction
                  aria-label={`Remove ${f.name}`}
                  onClick={() => toast(`Removed ${f.name}`, { description: "Nothing left the demo." })}
                >
                  <CloseIcon />
                </AttachmentAction>
              </AttachmentActions>
            </Attachment>
          ))}
        </AttachmentGroup>
        <Button
          variant="outline"
          size="sm"
          className="ck-upload-btn"
          onClick={() => fakeTask("Upload machine image", "Pick a disk image from your workstation")}
        >
          <UploadIcon />
          Upload image
        </Button>
      </CardContent>
    </Card>
  )
}

export function QuotasView() {
  return (
    <div className="ck-view">
      <div className="ck-page-head">
        <h4 className="ck-page-title">Project quotas</h4>
        <span className="ck-page-count">engineering</span>
      </div>
      <Card>
        <CardContent className="ck-util">
          {QUOTAS.map((q) => {
            const pct = Math.round((q.used / q.limit) * 100)
            return (
              <div key={q.resource} className="ck-util-row">
                <span className="ck-util-label">{q.resource}</span>
                <Progress value={pct} className="ck-util-bar" data-tone={pct >= 80 ? "warning" : "success"} />
                <span className="ck-util-val">{q.used} / {q.limit}</span>
              </div>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}

const PROTECTION_LABEL = {
  none: "None",
  warm: "Warm standby",
  hot: "Hot standby",
  replica: "Replica",
}

function PoolRow({ label, unit, used, size }) {
  const pct = Math.round((used / size) * 100)
  return (
    <div className="ck-util-row">
      <span className="ck-util-label">{label}</span>
      <Progress value={pct} className="ck-util-bar" data-tone={pct >= 90 ? "error" : pct >= 75 ? "warning" : "success"} />
      <span className="ck-util-val">
        {used.toLocaleString("en-US")} / {size.toLocaleString("en-US")} {unit} · {pct}%
      </span>
    </div>
  )
}

export function VdcView({ vdc }) {
  const site = ORDER_SITES.find((s) => s.id === vdc.site)
  const drSite = ORDER_SITES.find((s) => s.id === vdc.drSite)
  return (
    <div className="ck-view ck-vdc">
      <div className="ck-page-head">
        <h4 className="ck-page-title">{vdc.name}</h4>
        <span className="ck-page-count">{site.name} · {site.city}</span>
      </div>
      <div className="ck-actions">
        <Button size="sm" onClick={() => fakeTask("Launch virtual machine", `In ${vdc.name}`)}>
          Launch virtual machine
        </Button>
        <Button variant="outline" size="sm" onClick={() => fakeTask("Resize pools", vdc.name)}>
          Resize pools
        </Button>
        <div className="ck-actions-spacer" />
        <StatusBadge value={vdc.status} />
      </div>
      <div className="ck-dash-grid">
        <DashCard title="Pools">
          <div className="ck-util">
            <PoolRow label="CPU" unit="GHz" used={vdc.cpu[0]} size={vdc.cpu[1]} />
            <PoolRow label="RAM" unit="GB" used={vdc.ram[0]} size={vdc.ram[1]} />
            <PoolRow label="Storage" unit="GB" used={vdc.storage[0]} size={vdc.storage[1]} />
          </div>
        </DashCard>
        <DashCard title="Details">
          <ItemGroup>
            <Item size="sm">
              <ItemContent><ItemTitle>Project</ItemTitle></ItemContent>
              <ItemActions><Badge variant="outline">{vdc.project}</Badge></ItemActions>
            </Item>
            <Item size="sm">
              <ItemContent><ItemTitle>Virtual machines</ItemTitle></ItemContent>
              <ItemActions><span className="ck-num">{vdc.vms}</span></ItemActions>
            </Item>
            <Item size="sm">
              <ItemContent>
                <ItemTitle>Protection</ItemTitle>
                {drSite && (
                  <ItemDescription>
                    {vdc.protection === "replica" ? `Replica of ${vdc.name.replace(/-dr$/, "")} in ${drSite.name}` : `Replica in ${drSite.name}`}
                  </ItemDescription>
                )}
              </ItemContent>
              <ItemActions>
                <Badge variant={vdc.protection === "none" ? "outline" : "info"}>{PROTECTION_LABEL[vdc.protection]}</Badge>
              </ItemActions>
            </Item>
          </ItemGroup>
        </DashCard>
      </div>
    </div>
  )
}

export function UnderConstruction({ name }) {
  return (
    <Empty className="ck-empty">
      <EmptyHeader>
        <EmptyMedia variant="icon"><BoxIcon /></EmptyMedia>
        <EmptyTitle>{name} is quiet</EmptyTitle>
        <EmptyDescription>
          Nothing provisioned in this project yet. Resources created elsewhere in the console will appear here.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  )
}

/* ── Access keys: identifiers nobody types, so every one copies ───────── */

export function AccessKeysView() {
  return (
    <div className="ck-view">
      <div className="ck-page-head">
        <h4 className="ck-page-title">Access Keys</h4>
        <span className="ck-page-count">{SSH_KEYS.length} SSH keys · {API_KEYS.length} API keys</span>
      </div>
      <div className="ck-actions">
        <Button size="sm" onClick={() => fakeTask("Add SSH key", "Paste a public key to register it")}>
          <PlusIcon />
          Add SSH key
        </Button>
        <Button variant="outline" size="sm" onClick={() => fakeTask("Create API key", "Scoped to this project")}>
          Create API key
        </Button>
      </div>
      <DataTableScroller className="ck-table-wrap">
        <Table className="ck-table ck-keys-table">
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Fingerprint</TableHead>
              <TableHead>Added</TableHead>
              <TableHead>Last used</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {SSH_KEYS.map((k) => (
              <TableRow key={k.name}>
                <TableCell><code className="ck-mono">{k.name}</code></TableCell>
                <TableCell>{k.type}</TableCell>
                <TableCell className="ck-keys-fingerprint">
                  <CopyField value={k.fingerprint} copyLabel={`Copy fingerprint of ${k.name}`} className="ck-copy" />
                </TableCell>
                <TableCell>{k.added}</TableCell>
                <TableCell>{k.lastUsed}</TableCell>
                <TableCell>
                  <RowActions
                    name={k.name}
                    items={[{ label: "Download public key" }, { label: "Rotate" }, { label: "Revoke", danger: true }]}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </DataTableScroller>
      <Card>
        <CardHeader><CardTitle className="ck-card-title">API keys</CardTitle></CardHeader>
        <CardContent className="ck-api-keys">
          {API_KEYS.map((k) => (
            <div key={k.name} className="ck-api-key">
              <div className="ck-api-key-head">
                <code className="ck-mono ck-api-key-name">{k.name}</code>
                <Badge variant="outline">{k.scopes}</Badge>
                <span className="ck-api-key-meta">Created {k.created} · Last used {k.lastUsed}</span>
              </div>
              <CopyField value={k.id} label="Key ID" truncate="end" className="ck-copy" />
              <CopyField value={k.secret} label="Secret" secret className="ck-copy" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
