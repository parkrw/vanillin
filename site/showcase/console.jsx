import { Fragment, useMemo, useState } from "react"
import { Avatar, AvatarFallback } from "../../ui/avatar/avatar.jsx"
import {
  Attachment,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentContent,
  AttachmentTitle,
  AttachmentDescription,
  AttachmentActions,
  AttachmentAction,
} from "../../ui/attachment/attachment.jsx"
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
import {
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
} from "../../ui/hover-card/hover-card.jsx"
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
import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "../../ui/tooltip/tooltip.jsx"
import { cn } from "../../lib/cn.js"
import { useDataTable, flexRender } from "../../lib/use-data-table.js"
import {
  PROJECTS,
  REGIONS,
  NAV_GROUPS,
  findService,
  INSTANCES,
  SIZES,
  QUOTAS,
  MACHINE_IMAGES,
  UPLOADED_IMAGES,
  NETWORKS,
  VOLUMES,
  DATA_CENTERS,
  SNAPSHOTS,
  PUBLIC_IPS,
  TASKS,
  UTILIZATION,
  HEALTH,
  EVENTS,
  STATS,
} from "./console-data.js"

import { SettingsPanel, StatusShowcase, SupportPanel } from "./panels/index.js"
import "../../ui/avatar/avatar.css"
import "../../ui/attachment/attachment.css"
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
import "../../ui/hover-card/hover-card.css"
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
import "../../ui/tooltip/tooltip.css"
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

const SunIcon = () =>
  icon(
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </>
  )

const MoonIcon = () => icon(<path d="M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z" />)

const DiskIcon = () =>
  icon(
    <>
      <ellipse cx="12" cy="6" rx="7" ry="3" />
      <path d="M5 6v12c0 1.66 3.13 3 7 3s7-1.34 7-3V6" />
      <path d="M5 12c0 1.66 3.13 3 7 3s7-1.34 7-3" />
    </>
  )

const UploadIcon = () =>
  icon(
    <>
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
      <polyline points="7.5 7.5 12 3 16.5 7.5" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </>
  )

const CloseIcon = () =>
  icon(
    <>
      <line x1="6" y1="6" x2="18" y2="18" />
      <line x1="18" y1="6" x2="6" y2="18" />
    </>
  )

const RefreshIcon = () =>
  icon(
    <>
      <path d="M21 12a9 9 0 01-9 9 9 9 0 01-8.2-5.3" />
      <path d="M3 12a9 9 0 019-9 9 9 0 018.2 5.3" />
      <polyline points="21 3 20.2 8.3 15 7.5" />
      <polyline points="3 21 3.8 15.7 9 16.5" />
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

/* Nav iconography, keyed by nav item id. */
const NAV_ICONS = {
  overview: () =>
    icon(
      <>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
      </>
    ),
  vdc: () =>
    icon(
      <>
        <rect x="2" y="3" width="20" height="7" rx="2" />
        <rect x="2" y="14" width="20" height="7" rx="2" />
        <line x1="6" y1="6.5" x2="6.01" y2="6.5" />
        <line x1="6" y1="17.5" x2="6.01" y2="17.5" />
      </>
    ),
  resources: BoxIcon,
  networking: () =>
    icon(
      <>
        <circle cx="12" cy="12" r="9" />
        <line x1="3" y1="12" x2="21" y2="12" />
        <path d="M12 3a14 14 0 010 18 14 14 0 010-18z" />
      </>
    ),
  storage: () =>
    icon(
      <>
        <ellipse cx="12" cy="5" rx="8" ry="3" />
        <path d="M4 5v14c0 1.66 3.58 3 8 3s8-1.34 8-3V5" />
        <path d="M4 12c0 1.66 3.58 3 8 3s8-1.34 8-3" />
      </>
    ),
  metrics: () =>
    icon(
      <>
        <line x1="6" y1="20" x2="6" y2="13" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="18" y1="20" x2="18" y2="9" />
      </>
    ),
  events: () => icon(<path d="M22 12h-4l-3 8-4-16-3 8H2" />),
  "service-health": () =>
    icon(
      <>
        <path d="M12 21s8-4 8-10V5l-8-3-8 3v6c0 6 8 10 8 10z" />
        <polyline points="9 11.5 11 13.5 15 9.5" />
      </>
    ),
  billing: () =>
    icon(
      <>
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <line x1="2" y1="10" x2="22" y2="10" />
      </>
    ),
  contacts: () =>
    icon(
      <>
        <path d="M15 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" />
        <circle cx="8.5" cy="7" r="3.5" />
        <path d="M22 21v-2a4 4 0 00-3-3.87" />
      </>
    ),
  support: () =>
    icon(
      <>
        <circle cx="12" cy="12" r="9" />
        <circle cx="12" cy="12" r="3.5" />
        <line x1="5.6" y1="5.6" x2="9.5" y2="9.5" />
        <line x1="14.5" y1="14.5" x2="18.4" y2="18.4" />
        <line x1="14.5" y1="9.5" x2="18.4" y2="5.6" />
        <line x1="5.6" y1="18.4" x2="9.5" y2="14.5" />
      </>
    ),
  security: () =>
    icon(
      <>
        <rect x="4" y="11" width="16" height="10" rx="2" />
        <path d="M8 11V7a4 4 0 018 0v4" />
      </>
    ),
  "your-data": () =>
    icon(
      <>
        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
        <polyline points="7.5 10.5 12 15 16.5 10.5" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </>
    ),
  settings: () =>
    icon(
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M12 2.5v2.2M12 19.3v2.2M4.6 4.6l1.6 1.6M17.8 17.8l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.6 19.4l1.6-1.6M17.8 6.2l1.6-1.6" />
      </>
    ),
}

/* ── Shared bits ─────────────────────────────────────────────────────── */

/* Wraps a control whose own element is already claimed — a dropdown trigger,
   a status dot — so the tooltip has something to anchor to. */
function Tip({ label, side = "top", className, children }) {
  return (
    <Tooltip>
      <TooltipTrigger as="span" className={cn("ck-tip", className)}>
        {children}
      </TooltipTrigger>
      <TooltipContent side={side}>{label}</TooltipContent>
    </Tooltip>
  )
}

const TONE_LABEL = {
  success: "Healthy",
  warning: "Needs attention",
  error: "Failing",
  info: "Informational",
  pending: "In progress",
  neutral: "Idle",
}

function Dot({ tone, ...props }) {
  return (
    <Tip label={TONE_LABEL[tone] ?? tone}>
      <StatusDot status={tone} label={null} {...props} />
    </Tip>
  )
}

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

/* A row menu. Non-destructive entries queue a fake task; destructive ones
   report the demo's protection, both naming the row. */
function RowActions({ name, items }) {
  return (
    <DropdownMenu>
      <Tip label={`Actions for ${name}`}>
        <DropdownMenuTrigger
          as={Button}
          variant="ghost"
          size="icon"
          aria-label={`Actions for ${name}`}
        >
          <EllipsisIcon />
        </DropdownMenuTrigger>
      </Tip>
      <DropdownMenuContent align="end">
        {items.map((item) =>
          item.danger ? (
            <Fragment key={item.label}>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="ck-menu-danger"
                onSelect={() =>
                  toast.error(`${item.label} blocked`, {
                    description: `${name} is protected in this demo.`,
                  })
                }
              >
                {item.label}
              </DropdownMenuItem>
            </Fragment>
          ) : (
            <DropdownMenuItem
              key={item.label}
              onSelect={item.onSelect ?? (() => fakeTask(item.label, name))}
            >
              {item.label}
            </DropdownMenuItem>
          )
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function fakeTask(title, description) {
  toast.promise(new Promise((resolve) => setTimeout(resolve, 1400)), {
    loading: `${title}...`,
    success: { title: `${title} queued`, description },
  })
}

/* ── Topbar ──────────────────────────────────────────────────────────── */

function ConsoleTopbar({ project, setProject, region, setRegion, onOpenPalette }) {
  // Decorative only: the icon flips, the page theme never moves.
  const [moon, setMoon] = useState(false)
  return (
    <header className="ck-topbar">
      <div className="ck-brand">
        <span className="ck-brand-mark"><KeyIcon /></span>
        <span className="ck-brand-name">Acme Cloud</span>
        <Tip label="Console release 1.0.0" side="bottom">
          <Badge variant="secondary">1.0.0</Badge>
        </Tip>
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
      <Tooltip>
        <TooltipTrigger
          as={Button}
          variant="ghost"
          size="icon"
          className="ck-theme-toggle"
          aria-label={moon ? "Switch to light theme" : "Switch to dark theme"}
          onClick={() => {
            setMoon((m) => !m)
            toast("Theme switching is decorative in this demo")
          }}
        >
          {moon ? <MoonIcon /> : <SunIcon />}
        </TooltipTrigger>
        <TooltipContent side="bottom">Theme</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger
          as={Button}
          variant="ghost"
          size="icon"
          className="ck-bell"
          aria-label="Notifications, 1 unread"
          onClick={() => toast.info("2 alarms firing", { description: "compute-node-down, storage-capacity-high" })}
        >
          <BellIcon />
          <StatusDot status="error" size="sm" label={null} className="ck-bell-dot" />
        </TooltipTrigger>
        <TooltipContent side="bottom">Notifications</TooltipContent>
      </Tooltip>
      <DropdownMenu>
        <DropdownMenuTrigger as={Button} variant="ghost" size="sm" className="ck-user">
          <Avatar className="ck-user-avatar"><AvatarFallback>PW</AvatarFallback></Avatar>
          pwilliams
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>ops@acme.cloud</DropdownMenuLabel>
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

function NavIcon({ id }) {
  const Glyph = NAV_ICONS[id]
  return <span className="ck-nav-icon">{Glyph ? <Glyph /> : null}</span>
}

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
          <NavIcon id="overview" />
          Overview
        </button>
        <Separator decorative className="ck-nav-sep" />
        {NAV_GROUPS.map((group) => (
          <Collapsible key={group.label} className="ck-nav-cat" defaultOpen={group.label === "Platform"}>
            <Tooltip>
              <CollapsibleTrigger as={TooltipTrigger} className="ck-nav-cat-trigger">
                {group.label}
                <span className="ck-nav-cat-caret" aria-hidden="true">&#9662;</span>
              </CollapsibleTrigger>
              <TooltipContent side="right">Toggle {group.label}</TooltipContent>
            </Tooltip>
            <CollapsibleContent>
              <div className="ck-nav-cat-items">
                {group.items.map((svc) => (
                  <button
                    key={svc.id}
                    type="button"
                    className="ck-nav-link"
                    data-active={view.svc === svc.id || undefined}
                    onClick={() => onNavigate(svc.id)}
                  >
                    <NavIcon id={svc.id} />
                    {svc.name}
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

function UtilizationCard() {
  return (
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
  )
}

function HealthCard() {
  return (
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
                <Dot tone={h.tone} />
                <span className="ck-health-val" data-tone={h.tone}>{h.value}</span>
              </ItemActions>
            </Item>
          ))}
        </ItemGroup>
      </CardContent>
    </Card>
  )
}

function EventsCard() {
  return (
    <Card>
      <CardHeader><CardTitle className="ck-card-title">Recent events</CardTitle></CardHeader>
      <CardContent>
        <ItemGroup>
          {EVENTS.map((e) => (
            <Item key={e.text + e.target} size="sm" className="ck-event-row">
              <Dot tone={e.tone} />
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
  )
}

function Dashboard() {
  return (
    <div className="ck-dash">
      <div className="ck-stats">
        {STATS.map((s) => (
          <HoverCard key={s.label} openDelay={200} closeDelay={150}>
            <HoverCardTrigger as={Card} className="ck-stat">
              <CardContent className="ck-stat-body">
                <div className="ck-stat-num">{s.num}</div>
                <div className="ck-stat-label">{s.label}</div>
                <div className="ck-stat-sub">
                  <Dot tone={s.tone} size="sm" /> {s.sub}
                </div>
              </CardContent>
            </HoverCardTrigger>
            <HoverCardContent className="ck-stat-hover">
              <div className="ck-stat-hover-title">{s.label}</div>
              {s.detail.map((d) => (
                <div key={d.label} className="ck-stat-hover-row">
                  {d.tone && <Dot tone={d.tone} size="sm" />}
                  <span className="ck-stat-hover-label">{d.label}</span>
                  <span className="ck-stat-hover-val">{d.value}</span>
                </div>
              ))}
            </HoverCardContent>
          </HoverCard>
        ))}
      </div>
      <div className="ck-dash-grid">
        <UtilizationCard />
        <HealthCard />
      </div>
      <EventsCard />
    </div>
  )
}

function CardPage({ title, count, children }) {
  return (
    <div className="ck-view">
      <div className="ck-page-head">
        <h4 className="ck-page-title">{title}</h4>
        {count && <span className="ck-page-count">{count}</span>}
      </div>
      {children}
    </div>
  )
}

/* ── Instances table (the advanced data-table composition) ───────────── */

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
        <RowActions
          name={row.original.name}
          items={[
            { label: "View details", onSelect: () => onDetails(row.original) },
            { label: "Start" },
            { label: "Stop" },
            { label: "Reboot" },
            { label: "Resize" },
            { label: "Snapshot" },
            { label: "Delete", danger: true },
          ]}
        />
      ),
    },
  ]
}

function InstancesView({ project, onDetails }) {
  const data = useMemo(
    () => (project === "admin" ? INSTANCES : INSTANCES.filter((s) => s.project === project)),
    [project]
  )
  const columns = useMemo(() => instanceColumns(onDetails), [onDetails])
  const table = useDataTable({ data, columns, initialPageSize: 6 })
  const selected = Object.keys(table.getState().rowSelection).length
  const { pageIndex } = table.getState().pagination
  const rows = table.getRowModel().rows

  return (
    <div className="ck-view">
      <div className="ck-page-head">
        <h4 className="ck-page-title">Instances</h4>
        <span className="ck-page-count">{data.length} in {project}</span>
      </div>
      <div className="ck-actions">
        <Button size="sm" className="ck-accent-btn" onClick={() => fakeTask("Launch instance", "Scheduling on az-east-1a")}>
          Launch instance
        </Button>
        <ButtonGroup>
          <Button variant="outline" size="sm" disabled={!selected} onClick={() => fakeTask("Start", `${selected} instance(s)`)}>Start</Button>
          <Button variant="outline" size="sm" disabled={!selected} onClick={() => fakeTask("Stop", `${selected} instance(s)`)}>Stop</Button>
          <Button variant="outline" size="sm" disabled={!selected} onClick={() => fakeTask("Live migrate", `${selected} instance(s)`)}>Migrate</Button>
        </ButtonGroup>
        <div className="ck-actions-spacer" />
        <Tooltip>
          <TooltipTrigger
            as={Button}
            variant="ghost"
            size="icon"
            className="ck-refresh"
            aria-label="Refresh instances"
            onClick={() => toast("Inventory refreshed", { description: `${data.length} instances in ${project}` })}
          >
            <RefreshIcon />
          </TooltipTrigger>
          <TooltipContent>Refresh</TooltipContent>
        </Tooltip>
        <Tip label="Filter by name, zone or size">
          <Input
            className="ck-filter"
            placeholder="Filter instances..."
            value={table.getState().globalFilter}
            onChange={(e) => table.setGlobalFilter(e.target.value)}
          />
        </Tip>
        <Tip label="Filter by status">
          <DataTableFacetedFilter column={table.getColumn("status")} title="Status" />
        </Tip>
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
                  No instances match.
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

/* `rows` are cell arrays; when `actions` is given each row grows a trailing
   menu cell, so one table shape serves every resource page. */
function SimpleTable({ title, count, cols, rows, actions, children }) {
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
            {rows.map((r, i) => (
              <TableRow key={i}>
                {r.map((cell, j) => <TableCell key={j}>{cell}</TableCell>)}
                {actions && (
                  <TableCell>
                    <RowActions name={actions[i].name} items={actions[i].items} />
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </DataTableScroller>
    </div>
  )
}

const UPLOAD_STATUS = {
  done: "Ready to launch",
  uploading: "Uploading",
  processing: "Converting",
  error: "Upload failed",
}

function ImageUploads() {
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
    case "Instances":
      return <InstancesView project={project} onDetails={onDetails} />
    case "Instance sizes":
      return (
        <SimpleTable
          title="Instance sizes"
          count={`${SIZES.length} sizes`}
          cols={["Name", "vCPUs", "Memory", "Root disk", "Public"]}
          rows={SIZES.map((f) => [<code className="ck-mono" key="n">{f.name}</code>, f.vcpus, f.ram, f.disk, f.pub])}
          actions={SIZES.map((f) => ({
            name: f.name,
            items: [{ label: "Launch instance" }, { label: "Copy specification" }, { label: "Set as project default" }, { label: "Retire", danger: true }],
          }))}
        />
      )
    case "Quotas":
      return <QuotasView />
    case "Data centers":
      return (
        <SimpleTable
          title="Data centers"
          count={`${DATA_CENTERS.length} data centers`}
          cols={["Name", "Region", "Hosts", "Instances", "Status"]}
          rows={DATA_CENTERS.map((d) => [
            <code className="ck-mono" key="n">{d.name}</code>,
            d.region,
            d.hosts,
            d.instances,
            <StatusBadge key="s" value={d.status} />,
          ])}
          actions={DATA_CENTERS.map((d) => ({
            name: d.name,
            items: [{ label: "View hosts" }, { label: "Add capacity" }, { label: "Drain for maintenance" }, { label: "Decommission", danger: true }],
          }))}
        />
      )
    case "Public IPs":
      return (
        <SimpleTable
          title="Public IPs"
          count={`${PUBLIC_IPS.length} addresses`}
          cols={["Address", "Attached to", "Network", "Status"]}
          rows={PUBLIC_IPS.map((a) => [
            <code className="ck-mono" key="a">{a.address}</code>,
            a.attached || "none",
            a.network,
            <StatusBadge key="s" value={a.status} />,
          ])}
          actions={PUBLIC_IPS.map((a) => ({
            name: a.address,
            items: [{ label: "Attach to instance" }, { label: "Detach" }, { label: "Set reverse DNS" }, { label: "Release", danger: true }],
          }))}
        />
      )
    case "Snapshots":
      return (
        <SimpleTable
          title="Snapshots"
          count={`${SNAPSHOTS.length} snapshots`}
          cols={["Name", "Source volume", "Size", "Created", "Status"]}
          rows={SNAPSHOTS.map((n) => [
            n.name,
            <code className="ck-mono" key="v">{n.source}</code>,
            n.size,
            n.created,
            <StatusBadge key="s" value={n.status} />,
          ])}
          actions={SNAPSHOTS.map((n) => ({
            name: n.name,
            items: [{ label: "Restore to volume" }, { label: "Clone" }, { label: "Export" }, { label: "Delete", danger: true }],
          }))}
        />
      )
    case "Utilization":
      return (
        <CardPage title="Utilization" count="last 24 hours">
          <UtilizationCard />
          <StatusShowcase />
        </CardPage>
      )
    case "Event log":
      return <CardPage title="Event log" count={`${EVENTS.length} events`}><EventsCard /></CardPage>
    case "Services":
      return <CardPage title="Services" count={`${HEALTH.length} groups`}><HealthCard /></CardPage>
    case "Support":
      return <SupportPanel />
    case "Settings":
      return <SettingsPanel />
    case "Machine images":
      return (
        <SimpleTable
          title="Machine images"
          count={`${MACHINE_IMAGES.length} images`}
          cols={["Name", "Format", "Size", "Status", "Visibility"]}
          rows={MACHINE_IMAGES.map((i) => [
            i.name,
            <code className="ck-mono" key="f">{i.format}</code>,
            i.size,
            <StatusBadge key="s" value={i.status} />,
            i.visibility,
          ])}
          actions={MACHINE_IMAGES.map((i) => ({
            name: i.name,
            items: [{ label: "Launch instance" }, { label: "Copy to region" }, { label: "Share with project" }, { label: "Deprecate" }, { label: "Delete", danger: true }],
          }))}
        >
          <ImageUploads />
        </SimpleTable>
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
          actions={NETWORKS.map((n) => ({
            name: n.name,
            items: [{ label: "Edit network" }, { label: "Add subnet" }, { label: "Attach instance" }, { label: "Manage firewall" }, { label: "Delete", danger: true }],
          }))}
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
          actions={VOLUMES.map((v) => ({
            name: v.name,
            items: [{ label: "Attach" }, { label: "Detach" }, { label: "Extend" }, { label: "Snapshot" }, { label: "Delete", danger: true }],
          }))}
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
                    <Dot tone={t.status === "Running" ? "pending" : "success"} ring={t.status === "Running"} />{" "}
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

function InstanceSheet({ instance, onOpenChange }) {
  return (
    <Sheet open={!!instance} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="ck-glass-panel">
        {instance && (
          <>
            <SheetHeader>
              <SheetTitle>{instance.name}</SheetTitle>
              <SheetDescription>
                {instance.size} in {instance.az}
              </SheetDescription>
            </SheetHeader>
            <div className="ck-sheet-body">
              <ItemGroup>
                <Item size="sm">
                  <ItemContent><ItemTitle>Status</ItemTitle></ItemContent>
                  <ItemActions><StatusBadge value={instance.status} /></ItemActions>
                </Item>
                <Item size="sm">
                  <ItemContent><ItemTitle>IP address</ItemTitle></ItemContent>
                  <ItemActions><code className="ck-mono">{instance.ip}</code></ItemActions>
                </Item>
                <Item size="sm">
                  <ItemContent><ItemTitle>Project</ItemTitle></ItemContent>
                  <ItemActions><Badge variant="outline">{instance.project}</Badge></ItemActions>
                </Item>
                <Item size="sm">
                  <ItemContent>
                    <ItemTitle>Owner</ItemTitle>
                    <ItemDescription>Launched by {instance.user}</ItemDescription>
                  </ItemContent>
                </Item>
              </ItemGroup>
              <Separator decorative />
              <div className="ck-util">
                <div className="ck-util-row">
                  <span className="ck-util-label">CPU</span>
                  <Progress value={instance.cpu} className="ck-util-bar" data-tone={instance.cpu >= 85 ? "warning" : "success"} />
                  <span className="ck-util-val">{instance.cpu}%</span>
                </div>
                <div className="ck-util-row">
                  <span className="ck-util-label">Memory</span>
                  <Progress value={instance.mem} className="ck-util-bar" data-tone={instance.mem >= 85 ? "warning" : "success"} />
                  <span className="ck-util-val">{instance.mem}%</span>
                </div>
              </div>
            </div>
            <SheetFooter>
              <Button
                variant="outline"
                onClick={() => fakeTask("Soft reboot", instance.name)}
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
          {NAV_GROUPS.flatMap((group) =>
            group.items.flatMap((svc) =>
              svc.pages.map((page) => (
                <CommandItem
                  key={`${svc.id}-${page}`}
                  value={`${group.label} ${svc.name} ${page}`}
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
            value="launch instance create server"
            onSelect={() => { fakeTask("Launch instance", "Scheduling on az-east-1a"); onOpenChange(false) }}
          >
            Launch an instance
          </CommandItem>
          <CommandItem
            value="create volume block storage"
            onSelect={() => { fakeTask("Create volume", "fast-ssd, 100 GB"); onOpenChange(false) }}
          >
            Create a volume
          </CommandItem>
          <CommandItem
            value="upload machine image"
            onSelect={() => { fakeTask("Upload machine image", "ubuntu-24.04-acme"); onOpenChange(false) }}
          >
            Upload a machine image
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
  const [detailInstance, setDetailInstance] = useState(null)

  const navigate = (svcId, page) => {
    const svc = findService(svcId)
    setView({ svc: svcId, page: page ?? svc?.pages[0] ?? "Dashboard" })
  }

  const svc = view.svc === "overview" ? null : findService(view.svc)

  return (
    <TooltipProvider delayDuration={250}>
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
                          Acme Cloud
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
                          <PageContent svc={view.svc} page={p} project={project} onDetails={setDetailInstance} />
                        </TabsContent>
                      ))}
                    </Tabs>
                  )
                }
                return (
                  <>
                    <div className="ck-toolbar">{crumbs}</div>
                    <div className="ck-content">
                      <PageContent svc={view.svc} page={view.page} project={project} onDetails={setDetailInstance} />
                    </div>
                  </>
                )
              })()}
            </div>
            <ConsoleTaskbar />
          </ResizablePanel>
        </ResizablePanelGroup>
        <ConsolePalette open={paletteOpen} onOpenChange={setPaletteOpen} onNavigate={navigate} />
        <InstanceSheet instance={detailInstance} onOpenChange={(open) => !open && setDetailInstance(null)} />
        <Toaster position="bottom-right" richColors />
      </div>
    </TooltipProvider>
  )
}
