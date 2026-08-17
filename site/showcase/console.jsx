import { useMemo, useState } from "react"
import { Avatar, AvatarFallback } from "../../ui/avatar/avatar.jsx"
import { Badge } from "../../ui/badge/badge.jsx"
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "../../ui/breadcrumb/breadcrumb.jsx"
import { Button } from "../../ui/button/button.jsx"
import { ButtonGroup } from "../../ui/button-group/button-group.jsx"
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card/card.jsx"
import { Checkbox } from "../../ui/checkbox/checkbox.jsx"
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "../../ui/collapsible/collapsible.jsx"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "../../ui/command/command.jsx"
import {
  DataTableColumnHeader,
  DataTableFacetedFilter,
  DataTableScroller,
} from "../../ui/data-table/data-table.jsx"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../ui/dropdown-menu/dropdown-menu.jsx"
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "../../ui/empty/empty.jsx"
import { Input } from "../../ui/input/input.jsx"
import {
  Item,
  ItemContent,
  ItemTitle,
  ItemDescription,
  ItemActions,
  ItemGroup,
} from "../../ui/item/item.jsx"
import { Progress } from "../../ui/progress/progress.jsx"
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "../../ui/resizable/resizable.jsx"
import { ScrollArea } from "../../ui/scroll-area/scroll-area.jsx"
import { Separator } from "../../ui/separator/separator.jsx"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from "../../ui/sheet/sheet.jsx"
import { Spinner } from "../../ui/spinner/spinner.jsx"
import { StatusDot } from "../../ui/status-dot/status-dot.jsx"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "../../ui/table/table.jsx"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../ui/tabs/tabs.jsx"
import { Toaster, toast } from "../../ui/toast/toast.jsx"
import { useDataTable, flexRender } from "../../lib/use-data-table.js"
import {
  PROJECTS,
  REGIONS,
  SERVICES,
  findService,
  SERVERS,
  FLAVORS,
  QUOTAS,
  IMAGES,
  NETWORKS,
  VOLUMES,
  TASKS,
  UTILIZATION,
  HEALTH,
  EVENTS,
  STATS,
} from "./console-data.js"

import "../../ui/avatar/avatar.css"
import "../../ui/badge/badge.css"
import "../../ui/breadcrumb/breadcrumb.css"
import "../../ui/button/button.css"
import "../../ui/button-group/button-group.css"
import "../../ui/card/card.css"
import "../../ui/checkbox/checkbox.css"
import "../../ui/collapsible/collapsible.css"
import "../../ui/command/command.css"
import "../../ui/data-table/data-table.css"
import "../../ui/dropdown-menu/dropdown-menu.css"
import "../../ui/empty/empty.css"
import "../../ui/input/input.css"
import "../../ui/item/item.css"
import "../../ui/progress/progress.css"
import "../../ui/resizable/resizable.css"
import "../../ui/scroll-area/scroll-area.css"
import "../../ui/separator/separator.css"
import "../../ui/sheet/sheet.css"
import "../../ui/spinner/spinner.css"
import "../../ui/status-dot/status-dot.css"
import "../../ui/table/table.css"
import "../../ui/tabs/tabs.css"
import "../../ui/toast/toast.css"
import "./console.css"

/* ── Inline icons (stroke inherits currentColor) ─────────────────────── */

const icon = (path, extra = {}) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...extra}
  >
    {path}
  </svg>
)

const KeyIcon = () =>
  icon(<path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.78 7.78 5.5 5.5 0 017.78-7.78zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />)

const SearchIcon = () =>
  icon(
    <>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </>
  )

const BellIcon = () =>
  icon(
    <>
      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 01-3.46 0" />
    </>
  )

const EllipsisIcon = () =>
  icon(
    <>
      <circle cx="5" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="19" cy="12" r="1" fill="currentColor" stroke="none" />
    </>
  )

const BoxIcon = () =>
  icon(
    <>
      <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </>
  )

/* ── Shared bits ─────────────────────────────────────────────────────── */

const STATUS_TONE = {
  Active: "success",
  "In-use": "success",
  Available: "info",
  Shutoff: "secondary",
  Error: "destructive",
  Maintenance: "warning",
  Running: "info",
  Succeeded: "success",
}

function StatusBadge({ value }) {
  return <Badge variant={STATUS_TONE[value] ?? "outline"}>{value}</Badge>
}

function fakeTask(title, description) {
  toast.promise(new Promise((resolve) => setTimeout(resolve, 1400)), {
    loading: `${title}...`,
    success: { title: `${title} queued`, description },
  })
}

/* ── Topbar ──────────────────────────────────────────────────────────── */

function ConsoleTopbar({ project, setProject, region, setRegion, onOpenPalette }) {
  return (
    <header className="ck-topbar">
      <div className="ck-brand">
        <span className="ck-brand-mark"><KeyIcon /></span>
        <span className="ck-brand-name">CloudKey</span>
        <Badge variant="secondary">10.6</Badge>
      </div>
      <Separator orientation="vertical" decorative className="ck-topbar-sep" />
      <DropdownMenu>
        <DropdownMenuTrigger as={Button} variant="ghost" size="sm" className="ck-pill">
          <span className="ck-pill-label">Project</span>
          {project}
          <span className="ck-pill-caret" aria-hidden="true">&#9662;</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuLabel>Switch project</DropdownMenuLabel>
          <DropdownMenuRadioGroup value={project} onValueChange={setProject}>
            {PROJECTS.map((p) => (
              <DropdownMenuRadioItem key={p} value={p}>{p}</DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      <DropdownMenu>
        <DropdownMenuTrigger as={Button} variant="ghost" size="sm" className="ck-pill">
          <span className="ck-pill-label">Region</span>
          {region}
          <span className="ck-pill-caret" aria-hidden="true">&#9662;</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuRadioGroup value={region} onValueChange={setRegion}>
            {REGIONS.map((r) => (
              <DropdownMenuRadioItem key={r} value={r}>{r}</DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      <div className="ck-topbar-spacer" />
      <button type="button" className="ck-search" onClick={onOpenPalette}>
        <SearchIcon />
        <span>Search resources...</span>
      </button>
      <Button
        variant="ghost"
        size="icon"
        className="ck-bell"
        aria-label="Notifications, 1 unread"
        onClick={() => toast.info("2 alarms firing", { description: "compute-node-down, storage-capacity-high" })}
      >
        <BellIcon />
        <StatusDot status="error" size="sm" label={null} className="ck-bell-dot" />
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger as={Button} variant="ghost" size="sm" className="ck-user">
          <Avatar className="ck-user-avatar"><AvatarFallback>PW</AvatarFallback></Avatar>
          pwilliams
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>pwilliams@cloudkey.io</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => fakeTask("Rotate API key", "New key delivered to your inbox")}>
            Rotate API key
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => toast("Signed out of the demo", { description: "Not really. It is a showcase." })}>
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}

/* ── Navigation pane ─────────────────────────────────────────────────── */

function ConsoleNav({ view, onNavigate }) {
  return (
    <ScrollArea className="ck-nav-scroll">
      <nav className="ck-nav" aria-label="Console services">
        <button
          type="button"
          className="ck-nav-link ck-nav-overview"
          data-active={view.svc === "overview" || undefined}
          onClick={() => onNavigate("overview")}
        >
          Overview
        </button>
        <Separator decorative className="ck-nav-sep" />
        {SERVICES.map((cat) => (
          <Collapsible key={cat.label} defaultOpen className="ck-nav-cat">
            <CollapsibleTrigger className="ck-nav-cat-trigger">
              {cat.label}
              <span className="ck-nav-cat-caret" aria-hidden="true">&#9662;</span>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="ck-nav-cat-items">
                {cat.items.map((svc) => (
                  <button
                    key={svc.id}
                    type="button"
                    className="ck-nav-link"
                    data-active={view.svc === svc.id || undefined}
                    onClick={() => onNavigate(svc.id)}
                  >
                    {svc.name}
                    <span className="ck-nav-code">{svc.code}</span>
                  </button>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        ))}
      </nav>
    </ScrollArea>
  )
}

/* ── Overview dashboard ──────────────────────────────────────────────── */

function Dashboard() {
  return (
    <div className="ck-dash">
      <div className="ck-stats">
        {STATS.map((s) => (
          <Card key={s.label} className="ck-stat">
            <CardContent className="ck-stat-body">
              <div className="ck-stat-num">{s.num}</div>
              <div className="ck-stat-label">{s.label}</div>
              <div className="ck-stat-sub">
                <StatusDot status={s.tone} size="sm" label={null} /> {s.sub}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="ck-dash-grid">
        <Card>
          <CardHeader><CardTitle className="ck-card-title">Resource utilization</CardTitle></CardHeader>
          <CardContent className="ck-util">
            {UTILIZATION.map((u) => (
              <div key={u.label} className="ck-util-row">
                <span className="ck-util-label">{u.label}</span>
                <Progress value={u.pct} className="ck-util-bar" data-tone={u.tone} />
                <span className="ck-util-val">{u.pct}% · {u.detail}</span>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="ck-card-title">Service health</CardTitle></CardHeader>
          <CardContent>
            <ItemGroup>
              {HEALTH.map((h) => (
                <Item key={h.name} size="sm" className="ck-health-row">
                  <ItemContent>
                    <ItemTitle>{h.name}</ItemTitle>
                  </ItemContent>
                  <ItemActions>
                    <StatusDot status={h.tone} label={null} />
                    <span className="ck-health-val" data-tone={h.tone}>{h.value}</span>
                  </ItemActions>
                </Item>
              ))}
            </ItemGroup>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader><CardTitle className="ck-card-title">Recent events</CardTitle></CardHeader>
        <CardContent>
          <ItemGroup>
            {EVENTS.map((e) => (
              <Item key={e.text + e.target} size="sm" className="ck-event-row">
                <StatusDot status={e.tone} label={null} />
                <ItemContent>
                  <ItemTitle className="ck-event-text">
                    <code>{e.text}</code> {e.target}
                  </ItemTitle>
                </ItemContent>
                <ItemActions>
                  <span className="ck-event-time">{e.time}</span>
                </ItemActions>
              </Item>
            ))}
          </ItemGroup>
        </CardContent>
      </Card>
    </div>
  )
}

/* ── Servers table (the advanced data-table composition) ─────────────── */

function serverColumns(onDetails) {
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
      accessorKey: "flavor",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Flavor" />,
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
        <DropdownMenu>
          <DropdownMenuTrigger
            as={Button}
            variant="ghost"
            size="icon"
            aria-label={`Actions for ${row.original.name}`}
          >
            <EllipsisIcon />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => onDetails(row.original)}>View details</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => fakeTask("Start server", row.original.name)}>Start</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => fakeTask("Soft reboot", row.original.name)}>Soft reboot</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="ck-menu-danger"
              onSelect={() => toast.error("Delete blocked", { description: `${row.original.name} is protected in this demo.` })}
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]
}

function ServersView({ project, onDetails }) {
  const data = useMemo(
    () => (project === "admin" ? SERVERS : SERVERS.filter((s) => s.project === project)),
    [project]
  )
  const columns = useMemo(() => serverColumns(onDetails), [onDetails])
  const table = useDataTable({ data, columns, initialPageSize: 6 })
  const selected = Object.keys(table.getState().rowSelection).length
  const { pageIndex } = table.getState().pagination
  const rows = table.getRowModel().rows

  return (
    <div className="ck-view">
      <div className="ck-page-head">
        <h4 className="ck-page-title">Servers</h4>
        <span className="ck-page-count">{data.length} in {project}</span>
      </div>
      <div className="ck-actions">
        <Button size="sm" className="ck-accent-btn" onClick={() => fakeTask("Launch server", "Scheduling on az-east-1a")}>
          Launch Server
        </Button>
        <ButtonGroup>
          <Button variant="outline" size="sm" disabled={!selected} onClick={() => fakeTask("Start", `${selected} server(s)`)}>Start</Button>
          <Button variant="outline" size="sm" disabled={!selected} onClick={() => fakeTask("Stop", `${selected} server(s)`)}>Stop</Button>
          <Button variant="outline" size="sm" disabled={!selected} onClick={() => fakeTask("Live migrate", `${selected} server(s)`)}>Migrate</Button>
        </ButtonGroup>
        <div className="ck-actions-spacer" />
        <Input
          className="ck-filter"
          placeholder="Filter servers..."
          value={table.getState().globalFilter}
          onChange={(e) => table.setGlobalFilter(e.target.value)}
        />
        <DataTableFacetedFilter column={table.getColumn("status")} title="Status" />
      </div>
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
          <TableBody>
            {rows.length > 0 ? (
              rows.map((row) => (
                <TableRow key={row.id} data-selected={row.getIsSelected() ? "true" : undefined}>
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
                  No servers match.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </DataTableScroller>
      <div className="ck-table-foot">
        <span>{selected} of {data.length} selected</span>
        <div className="ck-table-pager">
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
    </div>
  )
}

/* ── Simple resource tables ──────────────────────────────────────────── */

function SimpleTable({ title, count, cols, rows }) {
  return (
    <div className="ck-view">
      <div className="ck-page-head">
        <h4 className="ck-page-title">{title}</h4>
        <span className="ck-page-count">{count}</span>
      </div>
      <DataTableScroller className="ck-table-wrap">
        <Table className="ck-table">
          <TableHeader>
            <TableRow>
              {cols.map((c) => <TableHead key={c}>{c}</TableHead>)}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r, i) => (
              <TableRow key={i}>
                {r.map((cell, j) => <TableCell key={j}>{cell}</TableCell>)}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </DataTableScroller>
    </div>
  )
}

function QuotasView() {
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

function UnderConstruction({ name }) {
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

/* ── Page routing inside the mock ────────────────────────────────────── */

function PageContent({ svc, page, project, onDetails }) {
  if (svc === "overview") return <Dashboard />
  switch (page) {
    case "Servers":
      return <ServersView project={project} onDetails={onDetails} />
    case "Flavors":
      return (
        <SimpleTable
          title="Flavors"
          count={`${FLAVORS.length} flavors`}
          cols={["Name", "VCPUs", "RAM", "Root disk", "Public"]}
          rows={FLAVORS.map((f) => [<code className="ck-mono" key="n">{f.name}</code>, f.vcpus, f.ram, f.disk, f.pub])}
        />
      )
    case "Quotas":
      return <QuotasView />
    case "Images":
      return (
        <SimpleTable
          title="Images"
          count={`${IMAGES.length} images`}
          cols={["Name", "Format", "Size", "Status", "Visibility"]}
          rows={IMAGES.map((i) => [
            i.name,
            <code className="ck-mono" key="f">{i.format}</code>,
            i.size,
            <StatusBadge key="s" value={i.status} />,
            i.visibility,
          ])}
        />
      )
    case "Networks":
      return (
        <SimpleTable
          title="Networks"
          count={`${NETWORKS.length} networks`}
          cols={["Name", "Subnet", "Type", "External", "Status"]}
          rows={NETWORKS.map((n) => [
            n.name,
            <code className="ck-mono" key="s">{n.subnet}</code>,
            n.type,
            n.external,
            <StatusBadge key="b" value={n.status} />,
          ])}
        />
      )
    case "Volumes":
      return (
        <SimpleTable
          title="Volumes"
          count={`${VOLUMES.length} volumes`}
          cols={["Name", "Size", "Status", "Type", "Attached to"]}
          rows={VOLUMES.map((v) => [
            v.name,
            v.size,
            <StatusBadge key="s" value={v.status} />,
            <code className="ck-mono" key="t">{v.type}</code>,
            v.attached || "–",
          ])}
        />
      )
    default:
      return <UnderConstruction name={page} />
  }
}

/* ── Taskbar ─────────────────────────────────────────────────────────── */

function ConsoleTaskbar() {
  const running = TASKS.filter((t) => t.status === "Running").length
  return (
    <Collapsible className="ck-taskbar">
      <CollapsibleTrigger className="ck-taskbar-bar">
        <Spinner className="ck-taskbar-spinner" />
        <span className="ck-taskbar-label">Recent tasks</span>
        <span className="ck-taskbar-stat">Running: <b>{running}</b></span>
        <span className="ck-taskbar-stat">Failed: <b>0</b></span>
        <span className="ck-taskbar-caret" aria-hidden="true">&#9652;</span>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="ck-taskbar-panel">
          <Table className="ck-table">
            <TableHeader>
              <TableRow>
                <TableHead>Task</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Started</TableHead>
                <TableHead>Duration</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {TASKS.map((t) => (
                <TableRow key={t.task + t.target}>
                  <TableCell>{t.task}</TableCell>
                  <TableCell><code className="ck-mono">{t.target}</code></TableCell>
                  <TableCell>
                    <StatusDot status={t.status === "Running" ? "pending" : "success"} ring={t.status === "Running"} label={null} />{" "}
                    {t.status}
                  </TableCell>
                  <TableCell>{t.started}</TableCell>
                  <TableCell>{t.duration || "–"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

/* ── Detail sheet ────────────────────────────────────────────────────── */

function ServerSheet({ server, onOpenChange }) {
  return (
    <Sheet open={!!server} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="ck-glass-panel">
        {server && (
          <>
            <SheetHeader>
              <SheetTitle>{server.name}</SheetTitle>
              <SheetDescription>
                {server.flavor} in {server.az}
              </SheetDescription>
            </SheetHeader>
            <div className="ck-sheet-body">
              <ItemGroup>
                <Item size="sm">
                  <ItemContent><ItemTitle>Status</ItemTitle></ItemContent>
                  <ItemActions><StatusBadge value={server.status} /></ItemActions>
                </Item>
                <Item size="sm">
                  <ItemContent><ItemTitle>IP address</ItemTitle></ItemContent>
                  <ItemActions><code className="ck-mono">{server.ip}</code></ItemActions>
                </Item>
                <Item size="sm">
                  <ItemContent><ItemTitle>Project</ItemTitle></ItemContent>
                  <ItemActions><Badge variant="outline">{server.project}</Badge></ItemActions>
                </Item>
                <Item size="sm">
                  <ItemContent>
                    <ItemTitle>Owner</ItemTitle>
                    <ItemDescription>Launched by {server.user}</ItemDescription>
                  </ItemContent>
                </Item>
              </ItemGroup>
              <Separator decorative />
              <div className="ck-util">
                <div className="ck-util-row">
                  <span className="ck-util-label">CPU</span>
                  <Progress value={server.cpu} className="ck-util-bar" data-tone={server.cpu >= 85 ? "warning" : "success"} />
                  <span className="ck-util-val">{server.cpu}%</span>
                </div>
                <div className="ck-util-row">
                  <span className="ck-util-label">Memory</span>
                  <Progress value={server.mem} className="ck-util-bar" data-tone={server.mem >= 85 ? "warning" : "success"} />
                  <span className="ck-util-val">{server.mem}%</span>
                </div>
              </div>
            </div>
            <SheetFooter>
              <Button
                variant="outline"
                onClick={() => fakeTask("Soft reboot", server.name)}
              >
                Soft reboot
              </Button>
              <SheetClose as={Button} variant="secondary">Close</SheetClose>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}

/* ── Command palette ─────────────────────────────────────────────────── */

function ConsolePalette({ open, onOpenChange, onNavigate }) {
  const go = (svcId, page) => {
    onNavigate(svcId, page)
    onOpenChange(false)
  }
  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Console search"
      description="Jump to a service or run an action"
      className="ck-glass-panel"
    >
      <CommandInput placeholder="Search the console..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Go to">
          <CommandItem value="overview dashboard" onSelect={() => go("overview")}>
            Overview
          </CommandItem>
          {SERVICES.flatMap((cat) =>
            cat.items.flatMap((svc) =>
              svc.pages.map((page) => (
                <CommandItem
                  key={`${svc.id}-${page}`}
                  value={`${svc.name} ${svc.code} ${page}`}
                  onSelect={() => go(svc.id, page)}
                >
                  {svc.name}: {page}
                </CommandItem>
              ))
            )
          )}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Actions">
          <CommandItem
            value="launch server create instance"
            onSelect={() => { fakeTask("Launch server", "Scheduling on az-east-1a"); onOpenChange(false) }}
          >
            Launch a server
          </CommandItem>
          <CommandItem
            value="create volume block storage"
            onSelect={() => { fakeTask("Create volume", "ceph-ssd, 100 GB"); onOpenChange(false) }}
          >
            Create a volume
          </CommandItem>
          <CommandItem
            value="upload image glance"
            onSelect={() => { fakeTask("Upload image", "ubuntu-24.04-ck"); onOpenChange(false) }}
          >
            Upload an image
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}

/* ── Root ────────────────────────────────────────────────────────────── */

export default function ConsoleShowcase() {
  const [view, setView] = useState({ svc: "overview", page: "Dashboard" })
  const [project, setProject] = useState("engineering")
  const [region, setRegion] = useState("Dallas")
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [detailServer, setDetailServer] = useState(null)

  const navigate = (svcId, page) => {
    const svc = findService(svcId)
    setView({ svc: svcId, page: page ?? svc?.pages[0] ?? "Dashboard" })
  }

  const svc = view.svc === "overview" ? null : findService(view.svc)

  return (
    <div className="ck-console" data-pg="console">
      <ConsoleTopbar
        project={project}
        setProject={setProject}
        region={region}
        setRegion={setRegion}
        onOpenPalette={() => setPaletteOpen(true)}
      />
      <ResizablePanelGroup direction="horizontal" className="ck-body">
        <ResizablePanel defaultSize={24} minSize={16} maxSize={36} className="ck-nav-panel">
          <ConsoleNav view={view} onNavigate={navigate} />
        </ResizablePanel>
        <ResizableHandle className="ck-handle" />
        <ResizablePanel className="ck-main">
          <div className="ck-scroller">
            {(() => {
              const crumbs = (
                <Breadcrumb>
                  <BreadcrumbList>
                    <BreadcrumbItem>
                      <BreadcrumbLink as="button" type="button" onClick={() => navigate("overview")}>
                        CloudKey
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                    {svc && (
                      <>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>{svc.category}</BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>{svc.name}</BreadcrumbItem>
                      </>
                    )}
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbPage>{view.page}</BreadcrumbPage>
                    </BreadcrumbItem>
                  </BreadcrumbList>
                </Breadcrumb>
              )
              if (svc && svc.pages.length > 1) {
                return (
                  <Tabs
                    value={view.page}
                    onValueChange={(page) => setView((v) => ({ ...v, page }))}
                  >
                    <div className="ck-toolbar">
                      {crumbs}
                      <TabsList>
                        {svc.pages.map((p) => (
                          <TabsTrigger key={p} value={p}>{p}</TabsTrigger>
                        ))}
                      </TabsList>
                    </div>
                    {svc.pages.map((p) => (
                      <TabsContent key={p} value={p} className="ck-content">
                        <PageContent svc={view.svc} page={p} project={project} onDetails={setDetailServer} />
                      </TabsContent>
                    ))}
                  </Tabs>
                )
              }
              return (
                <>
                  <div className="ck-toolbar">{crumbs}</div>
                  <div className="ck-content">
                    <PageContent svc={view.svc} page={view.page} project={project} onDetails={setDetailServer} />
                  </div>
                </>
              )
            })()}
          </div>
          <ConsoleTaskbar />
        </ResizablePanel>
      </ResizablePanelGroup>
      <ConsolePalette open={paletteOpen} onOpenChange={setPaletteOpen} onNavigate={navigate} />
      <ServerSheet server={detailServer} onOpenChange={(open) => !open && setDetailServer(null)} />
      <Toaster position="bottom-right" richColors />
    </div>
  )
}
