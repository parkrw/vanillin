import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react"
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
  CommandShortcut,
} from "../../ui/command/command.jsx"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "../../ui/context-menu/context-menu.jsx"
import { CopyField } from "../../ui/copy-field/copy-field.jsx"
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
import { Field, FieldContent, FieldDescription, FieldLabel } from "../../ui/field/field.jsx"
import {
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
} from "../../ui/hover-card/hover-card.jsx"
import { Input } from "../../ui/input/input.jsx"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "../../ui/input-group/input-group.jsx"
import {
  Item,
  ItemContent,
  ItemMedia,
  ItemTitle,
  ItemDescription,
  ItemActions,
  ItemGroup,
} from "../../ui/item/item.jsx"
import { Kbd, KbdGroup } from "../../ui/kbd/kbd.jsx"
import { Label } from "../../ui/label/label.jsx"
import { LiveValue } from "../../ui/live-value/live-value.jsx"
import { Marker, MarkerIcon, MarkerContent } from "../../ui/marker/marker.jsx"
import { ModeToggle } from "../../ui/mode-toggle/mode-toggle.jsx"
import { NativeSelect, NativeSelectOption } from "../../ui/native-select/native-select.jsx"
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverDescription,
} from "../../ui/popover/popover.jsx"
import { Progress } from "../../ui/progress/progress.jsx"
import { RadioGroup, RadioGroupItem } from "../../ui/radio-group/radio-group.jsx"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select/select.jsx"
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
import { Slider } from "../../ui/slider/slider.jsx"
import { Spinner } from "../../ui/spinner/spinner.jsx"
import { StatusDot } from "../../ui/status-dot/status-dot.jsx"
import { Switch } from "../../ui/switch/switch.jsx"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "../../ui/table/table.jsx"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../ui/tabs/tabs.jsx"
import { Toaster, toast } from "../../ui/toast/toast.jsx"
import { ToggleGroup, ToggleGroupItem } from "../../ui/toggle-group/toggle-group.jsx"
import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "../../ui/tooltip/tooltip.jsx"
import { cn } from "../../lib/cn.js"
import { useDataTable, flexRender } from "../../lib/use-data-table.js"
import { useTicker } from "../../lib/use-ticker.js"
import {
  OVERVIEW,
  NAV_GROUPS,
  CATEGORIES,
  ORDER_PAGE,
  PROJECTS,
  REGIONS,
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
  INCOMING_EVENTS,
  STATS,
  VDCS,
  SSH_KEYS,
  API_KEYS,
  ORDER_SITES,
  BILLING_TERMS,
  ORDER_RATES,
  POOLS,
  COMPUTE_PRESETS,
  UPLINKS,
  NETWORK_ADDONS,
  STORAGE_TIERS,
  PROTECTION_TIERS,
  BACKUP_RETENTION,
  BCDR_COPY,
  ORDER_COPY,
  VM_GROUP_DEFAULTS,
  VM_DEFAULTS,
  ORDER_DEFAULTS,
} from "./console-data.js"
import { drift, history } from "./console-live.js"

import { SettingsPanel, StatusShowcase, SupportPanel } from "./panels/index.js"
import "../../ui/avatar/avatar.css"
import "../../ui/attachment/attachment.css"
import "../../ui/badge/badge.css"
import "../../ui/button/button.css"
import "../../ui/button-group/button-group.css"
import "../../ui/card/card.css"
import "../../ui/checkbox/checkbox.css"
import "../../ui/collapsible/collapsible.css"
import "../../ui/command/command.css"
import "../../ui/context-menu/context-menu.css"
import "../../ui/copy-field/copy-field.css"
import "../../ui/data-table/data-table.css"
import "../../ui/dropdown-menu/dropdown-menu.css"
import "../../ui/empty/empty.css"
import "../../ui/field/field.css"
import "../../ui/hover-card/hover-card.css"
import "../../ui/input/input.css"
import "../../ui/input-group/input-group.css"
import "../../ui/item/item.css"
import "../../ui/kbd/kbd.css"
import "../../ui/label/label.css"
import "../../ui/live-value/live-value.css"
import "../../ui/marker/marker.css"
import "../../ui/mode-toggle/mode-toggle.css"
import "../../ui/native-select/native-select.css"
import "../../ui/popover/popover.css"
import "../../ui/progress/progress.css"
import "../../ui/radio-group/radio-group.css"
import "../../ui/select/select.css"
import "../../ui/separator/separator.css"
import "../../ui/sheet/sheet.css"
import "../../ui/slider/slider.css"
import "../../ui/spinner/spinner.css"
import "../../ui/status-dot/status-dot.css"
import "../../ui/switch/switch.css"
import "../../ui/table/table.css"
import "../../ui/tabs/tabs.css"
import "../../ui/toast/toast.css"
import "../../ui/toggle/toggle.css"
import "../../ui/toggle-group/toggle-group.css"
import "../../ui/tooltip/tooltip.css"
import "./console.css"

/* Every live number in the mock beats on this one shared timer. */
const TICK_MS = 2000

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
      <circle cx="12" cy="12" r="1" />
      <circle cx="19" cy="12" r="1" />
      <circle cx="5" cy="12" r="1" />
    </>
  )

const DiskIcon = () =>
  icon(
    <>
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
    </>
  )

const UploadIcon = () =>
  icon(
    <>
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </>
  )

const CloseIcon = () =>
  icon(
    <>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </>
  )

const RefreshIcon = () =>
  icon(
    <>
      <polyline points="23 4 23 10 17 10" />
      <polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
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

const ChevronDownIcon = () => icon(<polyline points="6 9 12 15 18 9" />, { strokeWidth: "2" })
const ChevronRightIcon = () => icon(<polyline points="9 6 15 12 9 18" />, { strokeWidth: "2" })
const ChevronUpIcon = () => icon(<polyline points="6 15 12 9 18 15" />, { strokeWidth: "2" })
const ArrowLeftIcon = () =>
  icon(
    <>
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </>,
    { strokeWidth: "2" }
  )
const CartIcon = () =>
  icon(
    <>
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
    </>
  )
const SiteIcon = () =>
  icon(
    <>
      <path d="M3 21h18" />
      <path d="M5 21V7l7-4 7 4v14" />
      <path d="M9 21v-4h6v4" />
      <path d="M9 10h.01M15 10h.01M9 14h.01M15 14h.01" />
    </>
  )
const PlusIcon = () =>
  icon(
    <>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </>,
    { strokeWidth: "2" }
  )
const ChevronsLeftIcon = () =>
  icon(
    <>
      <polyline points="11 17 6 12 11 7" />
      <polyline points="18 17 13 12 18 7" />
    </>,
    { strokeWidth: "2" }
  )
const ChevronsRightIcon = () =>
  icon(
    <>
      <polyline points="13 17 18 12 13 7" />
      <polyline points="6 17 11 12 6 7" />
    </>,
    { strokeWidth: "2" }
  )

const GridIcon = () =>
  icon(
    <>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
    </>
  )

const GaugeIcon = () =>
  icon(
    <>
      <path d="M4 15.5a8 8 0 1116 0" />
      <path d="M12 15.5l3.5-4.5" />
      <path d="M2 19h20" />
    </>
  )

const LayersIcon = () =>
  icon(
    <>
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </>
  )

const ActivityIcon = () => icon(<path d="M22 12h-4l-3 8-4-16-3 8H2" />)

const HeartPulseIcon = () =>
  icon(
    <>
      <path d="M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.6l-1-1a5.5 5.5 0 00-7.8 7.8l8.8 8.8 8.8-8.8a5.5 5.5 0 000-7.8z" />
      <path d="M3.5 12.5h4l2-3 3 6 2-3h6" />
    </>
  )

const CreditCardIcon = () =>
  icon(
    <>
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <line x1="2" y1="10" x2="22" y2="10" />
    </>
  )

const UserIcon = () =>
  icon(
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21v-1a6 6 0 016-6h4a6 6 0 016 6v1" />
    </>
  )

const UsersIcon = () =>
  icon(
    <>
      <path d="M15 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" />
      <circle cx="8.5" cy="7" r="3.5" />
      <path d="M22 21v-2a4 4 0 00-3-3.87" />
      <path d="M16 3.13a4 4 0 010 7.75" />
    </>
  )

const CpuIcon = () =>
  icon(
    <>
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <rect x="9" y="9" width="6" height="6" />
      <path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 14h3M1 9h3M1 14h3" />
    </>
  )

const ShieldIcon = () => icon(<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />)

const BarChartIcon = () =>
  icon(
    <>
      <line x1="6" y1="20" x2="6" y2="13" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="18" y1="20" x2="18" y2="9" />
    </>
  )

const RacksIcon = () =>
  icon(
    <>
      <rect x="2" y="3" width="20" height="7" rx="2" />
      <rect x="2" y="14" width="20" height="7" rx="2" />
      <line x1="6" y1="6.5" x2="6.01" y2="6.5" />
      <line x1="6" y1="17.5" x2="6.01" y2="17.5" />
    </>
  )

const GlobeIcon = () =>
  icon(
    <>
      <circle cx="12" cy="12" r="9" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <path d="M12 3a14 14 0 010 18 14 14 0 010-18z" />
    </>
  )

const DiskStackIcon = () =>
  icon(
    <>
      <ellipse cx="12" cy="5" rx="8" ry="3" />
      <path d="M4 5v14c0 1.66 3.58 3 8 3s8-1.34 8-3V5" />
      <path d="M4 12c0 1.66 3.58 3 8 3s8-1.34 8-3" />
    </>
  )

const LifebuoyIcon = () =>
  icon(
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="3.5" />
      <line x1="5.6" y1="5.6" x2="9.5" y2="9.5" />
      <line x1="14.5" y1="14.5" x2="18.4" y2="18.4" />
      <line x1="14.5" y1="9.5" x2="18.4" y2="5.6" />
      <line x1="5.6" y1="18.4" x2="9.5" y2="14.5" />
    </>
  )

const DownloadIcon = () =>
  icon(
    <>
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
      <polyline points="7.5 10.5 12 15 16.5 10.5" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </>
  )

const GearIcon = () =>
  icon(
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2.5v2.2M12 19.3v2.2M4.6 4.6l1.6 1.6M17.8 17.8l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.6 19.4l1.6-1.6M17.8 6.2l1.6-1.6" />
    </>
  )

const InfoIcon = () =>
  icon(
    <>
      <circle cx="12" cy="12" r="9" />
      <line x1="12" y1="11" x2="12" y2="16" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </>,
    { strokeWidth: "2" }
  )

const SlidersIcon = () =>
  icon(
    <>
      <line x1="4" y1="21" x2="4" y2="14" />
      <line x1="4" y1="10" x2="4" y2="3" />
      <line x1="12" y1="21" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12" y2="3" />
      <line x1="20" y1="21" x2="20" y2="16" />
      <line x1="20" y1="12" x2="20" y2="3" />
      <line x1="1" y1="14" x2="7" y2="14" />
      <line x1="9" y1="8" x2="15" y2="8" />
      <line x1="17" y1="16" x2="23" y2="16" />
    </>
  )

const ClockIcon = () =>
  icon(
    <>
      <circle cx="12" cy="12" r="9" />
      <polyline points="12 7 12 12 15.5 14" />
    </>
  )

const ArchiveIcon = () =>
  icon(
    <>
      <rect x="2" y="4" width="20" height="5" rx="1" />
      <path d="M4 9v10a2 2 0 002 2h12a2 2 0 002-2V9" />
      <line x1="10" y1="13" x2="14" y2="13" />
    </>
  )

const CheckIcon = () => icon(<polyline points="20 6 9 17 4 12" />, { strokeWidth: "2" })

/* Every row in either rail carries an icon: categories in the primary rail,
   services in the secondary. Keyed by id; the lookup has no fallback to
   the Overview grid, so a new service must bring its own glyph. */
const CATEGORY_ICONS = {
  overview: GridIcon,
  vdcs: RacksIcon,
  operations: ActivityIcon,
  account: UserIcon,
  "support-center": LifebuoyIcon,
}

const SERVICE_ICONS = {
  overview: GaugeIcon,
  vdc: RacksIcon,
  resources: CpuIcon,
  networking: GlobeIcon,
  storage: DiskStackIcon,
  order: CartIcon,
  metrics: BarChartIcon,
  events: ActivityIcon,
  "service-health": HeartPulseIcon,
  billing: CreditCardIcon,
  contacts: UsersIcon,
  security: ShieldIcon,
  "your-data": DownloadIcon,
  settings: GearIcon,
  support: LifebuoyIcon,
}

const serviceIcon = (svc) => SERVICE_ICONS[svc.id] ?? (svc.collapsible ? SiteIcon : LayersIcon)

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

/* The console's own toggle only rocks its lamp; the site's navbar owns the scheme. */
const THEME_HINT = "Change the theme in the vanillin navbar at the top of the page"

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
  Failed: "destructive",
  Standby: "info",
}

function StatusBadge({ value }) {
  return <Badge variant={STATUS_TONE[value] ?? "outline"}>{value}</Badge>
}

const TONE_BADGE = { success: "success", warning: "warning", error: "destructive-soft", info: "info" }

/* Menu entries shared by a row's (…) menu and its right-click menu.
   Non-destructive entries queue a fake task; destructive ones report the
   demo's protection, both naming the row. */
function ActionItems({ name, items }) {
  return items.map((item) =>
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
  )
}

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
        <ActionItems name={name} items={items} />
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

/* ── Topbar (chrome) ─────────────────────────────────────────────────── */

function ContextPill({ label, value, options, onChange, menuLabel }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="ck-pill">
        <span className="ck-pill-label">{label}</span>
        {value}
        <span className="ck-pill-caret" aria-hidden="true">
          <ChevronDownIcon />
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="ck-pill-menu">
        {menuLabel && (
          <>
            <DropdownMenuLabel>{menuLabel}</DropdownMenuLabel>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuRadioGroup value={value} onValueChange={onChange}>
          {options.map((opt) => (
            <DropdownMenuRadioItem key={opt} value={opt}>{opt}</DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function ConsoleTopbar({ project, setProject, region, setRegion, orderCount, onOrder, onOpenPalette }) {
  // Decorative only: the lamp flips, the page theme never moves.
  const [moon, setMoon] = useState(false)
  return (
    <header className="ck-topbar">
      <div className="ck-brand">
        <span className="ck-brand-mark"><KeyIcon /></span>
        <span className="ck-brand-name">Acme Cloud</span>
        <span className="ck-brand-app">Console</span>
      </div>
      <button type="button" className="ck-search" onClick={onOpenPalette}>
        <SearchIcon />
        <span>Search resources...</span>
        <KbdGroup className="ck-search-kbd" aria-hidden="true">
          <Kbd>&#8984;</Kbd>
          <Kbd>K</Kbd>
        </KbdGroup>
      </button>
      <div className="ck-topbar-right">
        <ContextPill label="Project" value={project} options={PROJECTS} onChange={setProject} menuLabel="Switch project" />
        <ContextPill label="Region" value={region} options={REGIONS} onChange={setRegion} />
        <button type="button" className="ck-topbar-order" onClick={onOrder}>
          <CartIcon />
          <span>Order a VDC</span>
          {orderCount > 0 && (
            <span className="ck-topbar-order-count">
              {orderCount}
              <span className="ck-sr-only"> {orderCount === 1 ? "vDC" : "vDCs"} in the order</span>
            </span>
          )}
        </button>
        <Tip label={THEME_HINT} side="bottom">
          <ModeToggle
            className="ck-topbar-btn ck-theme-toggle"
            isDark={moon}
            onIsDarkChange={(dark) => {
              setMoon(dark)
              toast(THEME_HINT)
            }}
            labels={{ toDark: "Switch to dark theme", toLight: "Switch to light theme" }}
          />
        </Tip>
        <Tooltip>
          <TooltipTrigger
            className="ck-topbar-btn ck-bell"
            aria-label="Notifications, 1 unread"
            onClick={() => toast.info("2 alarms firing", { description: "compute-node-down, storage-capacity-high" })}
          >
            <BellIcon />
            <span className="ck-topbar-badge" />
          </TooltipTrigger>
          <TooltipContent side="bottom">Notifications</TooltipContent>
        </Tooltip>
        <DropdownMenu>
          <DropdownMenuTrigger className="ck-topbar-user">
            <Avatar className="ck-user-avatar"><AvatarFallback>PW</AvatarFallback></Avatar>
            <span>pwilliams</span>
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
      </div>
    </header>
  )
}

/* ── Primary rail: Overview + the categories, one row each ───────────── */

function PriRail({ category, collapsed, onNavigate, onToggleCollapse }) {
  const isActive = (cat) => cat.id === category.id
  const go = (cat) => onNavigate(cat.items[0].id)
  const OverviewIcon = CATEGORY_ICONS.overview

  if (collapsed) {
    return (
      <nav className="ck-pri ck-rail--collapsed" aria-label="Console services">
        <div className="ck-rail-head">
          <Tooltip>
            <TooltipTrigger
              className="ck-rail-btn"
              data-active={isActive(OVERVIEW) || undefined}
              onClick={() => go(OVERVIEW)}
              aria-label="Overview"
            >
              <OverviewIcon />
            </TooltipTrigger>
            <TooltipContent side="right">Overview</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger className="ck-rail-btn" onClick={onToggleCollapse} aria-label="Expand sidebar">
              <ChevronsRightIcon />
            </TooltipTrigger>
            <TooltipContent side="right">Expand sidebar</TooltipContent>
          </Tooltip>
        </div>
        {NAV_GROUPS.map((cat) => {
          const Icon = CATEGORY_ICONS[cat.id]
          return (
            <Tooltip key={cat.id}>
              <TooltipTrigger
                className="ck-rail-item"
                data-active={isActive(cat) || undefined}
                onClick={() => go(cat)}
              >
                <Icon />
                <span className="ck-rail-label">{cat.label}</span>
              </TooltipTrigger>
              <TooltipContent side="right">{cat.label}</TooltipContent>
            </Tooltip>
          )
        })}
      </nav>
    )
  }

  return (
    <nav className="ck-pri ck-nav" aria-label="Console services">
      <Tooltip>
        <TooltipTrigger className="ck-rail-toggle" onClick={onToggleCollapse} aria-label="Collapse sidebar">
          <ChevronsLeftIcon />
        </TooltipTrigger>
        <TooltipContent side="right">Collapse sidebar</TooltipContent>
      </Tooltip>
      <button
        type="button"
        className="ck-nav-link ck-nav-overview"
        data-active={isActive(OVERVIEW) || undefined}
        onClick={() => go(OVERVIEW)}
      >
        <span className="ck-nav-icon"><OverviewIcon /></span>
        <span className="ck-nav-text">Overview</span>
      </button>
      <Separator decorative className="ck-nav-sep" />
      {NAV_GROUPS.map((cat) => {
        const Icon = CATEGORY_ICONS[cat.id]
        return (
          <button
            key={cat.id}
            type="button"
            className="ck-nav-link ck-nav-cat"
            data-active={isActive(cat) || undefined}
            onClick={() => go(cat)}
          >
            <span className="ck-nav-icon"><Icon /></span>
            <span className="ck-nav-text">{cat.label}</span>
          </button>
        )
      })}
    </nav>
  )
}

/* ── Secondary rail: the services of the selected category ───────────── */

function SecRail({ category, svc, page, collapsed, onNavigate, onToggleCollapse }) {
  // Landing on a vDC opens its site; nothing else closes one.
  const [openSites, setOpenSites] = useState(() => new Set())
  const activeSite = svc.collapsible ? svc.id : null
  useEffect(() => {
    if (activeSite) setOpenSites((prev) => (prev.has(activeSite) ? prev : new Set(prev).add(activeSite)))
  }, [activeSite])
  const toggleSite = (id) =>
    setOpenSites((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const toggle = (
    <Tooltip>
      <TooltipTrigger
        className="ck-rail-toggle ck-sec-collapse"
        onClick={onToggleCollapse}
        aria-label={collapsed ? "Expand section rail" : "Collapse section rail"}
      >
        {collapsed ? <ChevronsRightIcon /> : <ChevronsLeftIcon />}
      </TooltipTrigger>
      <TooltipContent side="right">{collapsed ? "Expand" : "Collapse"}</TooltipContent>
    </Tooltip>
  )

  if (collapsed) {
    return (
      <aside className="ck-sec ck-rail--collapsed" aria-label={`${category.label} services`}>
        {toggle}
        {category.items.map((item) => {
          const Icon = serviceIcon(item)
          return (
            <Tooltip key={item.id}>
              <TooltipTrigger
                className="ck-sec-group"
                data-active={item.id === svc.id || undefined}
                onClick={() => onNavigate(item.id)}
              >
                <Icon />
                <span className="ck-sec-group-name">{item.short ?? item.name}</span>
              </TooltipTrigger>
              <TooltipContent side="right">{item.name}</TooltipContent>
            </Tooltip>
          )
        })}
      </aside>
    )
  }

  return (
    <aside className="ck-sec" aria-label={`${category.label} services`}>
      {toggle}
      {category.items.map((item) => {
        const Icon = serviceIcon(item)
        if (item.collapsible) {
          return (
            <Collapsible
              key={item.id}
              className="ck-sec-cat"
              open={openSites.has(item.id)}
              onOpenChange={() => toggleSite(item.id)}
            >
              <CollapsibleTrigger className="ck-sec-group ck-sec-cat-trigger" data-active={item.id === svc.id || undefined}>
                <Icon />
                <span className="ck-sec-group-name">{item.name}</span>
                <span className="ck-sec-cat-caret" aria-hidden="true"><ChevronDownIcon /></span>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="ck-sec-cat-items">
                  {item.pages.map((p) => (
                    <button
                      key={p}
                      type="button"
                      className="ck-sec-link"
                      data-active={(item.id === svc.id && p === page) || undefined}
                      onClick={() => onNavigate(item.id, p)}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          )
        }
        return (
          <button
            key={item.id}
            type="button"
            className="ck-sec-group"
            data-active={item.id === svc.id || undefined}
            onClick={() => onNavigate(item.id)}
          >
            <Icon />
            <span className="ck-sec-group-name">{item.name}</span>
          </button>
        )
      })}
      {category.quickLinks && (
        <>
          <Separator decorative className="ck-sec-sep" />
          <div className="ck-sec-quick-label">Quick links</div>
          {category.quickLinks.map((q) => (
            <button
              key={q.label}
              type="button"
              className="ck-sec-quick"
              onClick={() => onNavigate(q.svc, q.page)}
            >
              {q.label}
            </button>
          ))}
        </>
      )}
    </aside>
  )
}

/* ── Overview dashboard: every number on it breathes ─────────────────── */

function Sparkline({ points, width = 72, height = 24, max = 100 }) {
  const step = width / (points.length - 1)
  const y = (v) => height - 2 - (v / max) * (height - 4)
  const coords = points.map((v, i) => `${(i * step).toFixed(1)},${y(v).toFixed(1)}`)
  const last = points[points.length - 1]
  return (
    <svg className="ck-spark" width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      <polygon className="ck-spark-fill" points={`0,${height} ${coords.join(" ")} ${width},${height}`} />
      <polyline points={coords.join(" ")} />
      <circle cx={width} cy={y(last)} r="2" />
    </svg>
  )
}

const SPARK = Object.fromEntries(STATS.map((s, i) => [s.label, drift(`spark:${s.label}`, 40 + i * 8, { spread: 18 })]))
const RUNNING = drift("stat:running", 38, { spread: 1, min: 37, max: 39 })

function StatCards() {
  const tick = useTicker(TICK_MS)
  return (
    <div className="ck-stats">
      {STATS.map((s) => (
        <HoverCard key={s.label} openDelay={200} closeDelay={150}>
          <HoverCardTrigger as={Card} className="ck-stat">
            <CardContent className="ck-stat-body">
              <div className="ck-stat-num">{s.num}</div>
              <div className="ck-stat-label">{s.label}</div>
              <div className="ck-stat-sub" data-tone={s.tone}>
                <Dot tone={s.tone} size="sm" />
                {s.label === "Virtual Machines" ? (
                  <LiveValue value={RUNNING(tick)} format={(v) => `${v} active`} />
                ) : (
                  s.sub
                )}
              </div>
              <div className="ck-stat-spark">
                <Sparkline points={history(SPARK[s.label], tick)} />
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
  )
}

function DashCard({ title, live, className, children }) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="ck-card-title">
          {title}
          {live && <StatusDot status="success" label="Live" size="sm" ring className="ck-card-live" />}
        </CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

const UTIL = Object.fromEntries(
  UTILIZATION.map((u) => [u.label, drift(`util:${u.label}`, u.pct, { spread: 3, min: 1, max: 99 })])
)

function UtilizationCard() {
  const tick = useTicker(TICK_MS)
  return (
    <DashCard title="Resource utilization" live>
      <div className="ck-util">
        {UTILIZATION.map((u) => {
          const pct = UTIL[u.label](tick)
          const tone = pct >= 85 ? "error" : pct >= 60 ? "warning" : "success"
          return (
            <div key={u.label} className="ck-util-row">
              <span className="ck-util-label">{u.label}</span>
              <Progress value={pct} className="ck-util-bar" data-tone={tone} />
              <span className="ck-util-val">
                <LiveValue value={pct} format={(v) => `${v}%`} /> · {u.detail}
              </span>
            </div>
          )
        })}
      </div>
    </DashCard>
  )
}

function HealthCard() {
  return (
    <DashCard title="Service health">
      <ItemGroup>
        {HEALTH.map((h) => (
          <Item key={h.name} size="sm" className="ck-health-row">
            <Dot tone={h.tone} ring />
            <ItemContent>
              <ItemTitle>{h.name}</ItemTitle>
            </ItemContent>
            <ItemActions>
              <Badge variant={TONE_BADGE[h.tone] ?? "outline"} glow={h.tone === "error"}>
                {h.value}
              </Badge>
            </ItemActions>
          </Item>
        ))}
      </ItemGroup>
    </DashCard>
  )
}

/* Every fifth tick the next canned event arrives at the top with a sweep. */
const INJECT_EVERY = 5

function EventsCard({ max = 7 }) {
  const tick = useTicker(TICK_MS)
  const injected = Math.min(INCOMING_EVENTS.length, Math.floor(tick / INJECT_EVERY))
  const rows = [
    ...INCOMING_EVENTS.slice(0, injected)
      .map((e, i) => ({
        ...e,
        fresh: i === injected - 1,
        time: i === injected - 1 ? "just now" : `${(injected - 1 - i) * INJECT_EVERY * (TICK_MS / 1000)} s ago`,
      }))
      .reverse(),
    ...EVENTS,
  ].slice(0, max)
  return (
    <DashCard title="Recent events" live>
      <ItemGroup>
        {rows.map((e) => (
          <Item key={e.text + e.target} size="sm" className="ck-event-row" data-fresh={e.fresh || undefined}>
            <Dot tone={e.tone} size="sm" />
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
    </DashCard>
  )
}

function Dashboard() {
  return (
    <div className="ck-dash">
      <StatCards />
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

function InstancesView({ project, onDetails }) {
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

function SimpleTable({ title, count, cols, rows, actions, children }) {
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

function VdcView({ vdc }) {
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

/* ── Access keys: identifiers nobody types, so every one copies ───────── */

function AccessKeysView() {
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

/* ── Order: a new virtual data center ────────────────────────────────── */

const ORDER_STEPS = [
  { id: "location", label: "Location" },
  { id: "compute", label: "Compute" },
  { id: "network", label: "Network" },
  { id: "storage", label: "Storage" },
  { id: "bcdr", label: "BCDR" },
  { id: "vms", label: "VMs" },
  { id: "summary", label: "Summary" },
]

const money = (n) => n.toLocaleString("en-US", { style: "currency", currency: "USD" })
const siteName = (id) => ORDER_SITES.find((s) => s.id === id)?.name ?? id
const siteOf = (id) => ORDER_SITES.find((s) => s.id === id)
const otherSite = (id) => ORDER_SITES.find((s) => s.id !== id).id
const pad2 = (n) => String(n).padStart(2, "0")
/* Tick labels: thousands fold to "k" once the figure has five digits. */
const compact = (n) => (n >= 10000 ? `${n / 1000}k` : n.toLocaleString("en-US"))

/* A vDC draft, and the first VM every new vDC starts with. The `seq`
   counters keep ids unique after removals. */
function newDraft(seq) {
  return {
    ...ORDER_DEFAULTS,
    storage: { ...ORDER_DEFAULTS.storage },
    addons: [],
    vmGroup: { ...VM_GROUP_DEFAULTS },
    id: `vdc-${seq}`,
    name: `vdc-${pad2(seq)}`,
  }
}

function newVm(vdcId, seq) {
  return { ...VM_DEFAULTS, id: `vm-${seq}`, vdc: vdcId, name: `vm-${pad2(seq)}`, size: "standard-2", image: MACHINE_IMAGES[0].name, count: 1 }
}

function newOrder(seq = 1, vmSeq = 1) {
  return { vdcs: [], vms: [newVm(`vdc-${seq}`, vmSeq)], draft: newDraft(seq), editing: null, seq, vmSeq }
}

/* What a VM draws from the pools, priced at the pool rates: "8 + 1 GPU" and
   "32 GB" parse to their leading numbers, so the size catalogue is the only
   price list. */
const leadingNumber = (s) => parseFloat(s) || 0
function vmMonthly(sizeName) {
  const size = SIZES.find((s) => s.name === sizeName)
  if (!size) return 0
  const [cpu, ram] = POOLS
  return leadingNumber(size.vcpus) * cpu.rate + leadingNumber(size.ram) * ram.rate
}

function vdcCost(vdc, vms) {
  const [cpuPool, ramPool, ipPool] = POOLS
  const cpu = vdc.cpu * cpuPool.rate
  const ram = vdc.ram * ramPool.rate
  const ips = vdc.ips * ipPool.rate
  const uplink = (UPLINKS.find((u) => u.id === vdc.uplink) ?? UPLINKS[0]).rate
  const addons = NETWORK_ADDONS.filter((a) => vdc.addons.includes(a.id)).reduce((sum, a) => sum + a.rate, 0)
  const storageGb = STORAGE_TIERS.reduce((gb, t) => gb + vdc.storage[t.id], 0)
  const storage = STORAGE_TIERS.reduce((sum, t) => sum + vdc.storage[t.id] * t.rate, 0)
  const retention = BACKUP_RETENTION.find((r) => r.id === vdc.retention) ?? BACKUP_RETENTION[0]
  const backups = vdc.backups ? storageGb * ORDER_RATES.backupGb * retention.factor : 0
  const pools = cpu + ram + ips + uplink + addons + storage + backups
  const tier = PROTECTION_TIERS.find((t) => t.id === vdc.protection)
  const vmCount = vms.filter((v) => v.vdc === vdc.id).reduce((n, v) => n + v.count, 0)
  const drStorageGb = Math.round((storageGb * vdc.drStoragePct) / 100)
  const dr = tier.share
    ? {
        compute: (cpu + ram) * tier.share,
        storage: drStorageGb * ORDER_RATES.drStorageGb,
        licences: vmCount * ORDER_RATES.replicationLicence,
      }
    : null
  const drTotal = dr ? dr.compute + dr.storage + dr.licences : 0
  return { cpu, ram, ips, uplink, addons, storage, storageGb, backups, drStorageGb, pools, tier, vmCount, dr, drTotal, total: pools + drTotal }
}

function OrderSection({ title, hint, wide, className, children }) {
  return (
    <section className={cn("ck-order-section", wide && "ck-order-section--wide", className)}>
      <div className="ck-order-section-head">
        <h5 className="ck-order-section-title">{title}</h5>
        {hint && <p className="ck-order-hint">{hint}</p>}
      </div>
      <div className="ck-order-section-body">{children}</div>
    </section>
  )
}

/* A radio row: the kit's item, then the name, a short meta tag and the
   one-sentence description. The label forwards clicks to the button. */
function OptionRow({ value, name, meta, description }) {
  return (
    <label className="ck-option">
      <RadioGroupItem value={value} aria-label={name} />
      <span className="ck-option-text">
        <span className="ck-option-name">
          {name}
          {meta && <span className="ck-option-meta">{meta}</span>}
        </span>
        <span className="ck-option-desc">{description}</span>
      </span>
    </label>
  )
}

/* A switch or checkbox with its title and one sentence, on the kit's field. */
function SwitchRow({ id, title, meta, description, checked, onCheckedChange, disabled }) {
  return (
    <Field orientation="horizontal" className="ck-switch-row" data-disabled={disabled || undefined}>
      <FieldContent>
        <FieldLabel htmlFor={id}>
          {title}
          {meta && <span className="ck-option-meta">{meta}</span>}
        </FieldLabel>
        <FieldDescription>{description}</FieldDescription>
      </FieldContent>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} />
    </Field>
  )
}

function CheckRow({ id, title, meta, description, checked, onCheckedChange, disabled }) {
  return (
    <Field orientation="horizontal" className="ck-check-row" data-disabled={disabled || undefined}>
      <Checkbox id={id} checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} />
      <FieldContent>
        <FieldLabel htmlFor={id}>
          {title}
          {meta && <span className="ck-option-meta">{meta}</span>}
        </FieldLabel>
        <FieldDescription>{description}</FieldDescription>
      </FieldContent>
    </Field>
  )
}

/* A small spec table inside a hover card, for the figures a label cannot hold. */
function SpecCard({ title, rows, children }) {
  return (
    <HoverCard openDelay={150} closeDelay={100}>
      <HoverCardTrigger as="span" className="ck-hint" tabIndex={0}>
        {children}
        <InfoIcon />
      </HoverCardTrigger>
      <HoverCardContent className="ck-spec-card" side="top">
        <div className="ck-spec-title">{title}</div>
        <dl className="ck-spec-list">
          {rows.map(([k, v]) => (
            <div key={k} className="ck-spec-row">
              <dt>{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
      </HoverCardContent>
    </HoverCard>
  )
}

/* Label, rate and price on one line, the track under it, then the ticks
   that make the range legible. `tick` is the label interval; the ends are
   always marked. */
function SliderRow({ name, label, unit, value, min, max, step, tick, onChange, price, rate, description, disabled }) {
  const ticks = [min]
  for (let v = Math.ceil(min / tick) * tick; v < max; v += tick) if (v > min) ticks.push(v)
  ticks.push(max)
  const at = (v) => `${((v - min) / (max - min)) * 100}%`
  return (
    <div className="ck-slider-row" data-disabled={disabled || undefined}>
      <div className="ck-slider-head">
        <span className="ck-slider-label">{label ?? name}</span>
        <span className="ck-slider-rate">{rate}</span>
        <span className="ck-slider-value">
          {value.toLocaleString("en-US")}
          {unit && <span className="ck-slider-unit">{unit}</span>}
        </span>
        <span className="ck-slider-price">{money(price)}/mo</span>
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        onValueChange={([v]) => onChange(v)}
        aria-label={name}
      />
      <div className="ck-slider-ticks" aria-hidden="true">
        {ticks.map((t) => (
          <span key={t} className="ck-slider-tick" style={{ insetInlineStart: at(t) }}>
            {compact(t)}
          </span>
        ))}
      </div>
      <p className="ck-option-desc">{description}</p>
    </div>
  )
}

function PriceLine({ name, meta, price, description }) {
  return (
    <>
      <div className="ck-order-line">
        <span className="ck-order-line-name">{name}</span>
        {meta && <span className="ck-order-line-meta">{meta}</span>}
        <span className="ck-order-line-price">{money(price)}/mo</span>
      </div>
      {description && <p className="ck-option-desc">{description}</p>}
    </>
  )
}

/* Sticky strip under every configuration step: what this vDC costs so far,
   and the way to the next step. */
function DraftBar({ draft, cost, next, onNext }) {
  return (
    <div className="ck-order-bar">
      <span className="ck-order-bar-name">
        <code className="ck-mono">{draft.name}</code> · {siteName(draft.site)}
      </span>
      <span className="ck-order-bar-total">
        {money(cost.total)}<span>/mo</span>
      </span>
      <Button size="sm" onClick={onNext}>Next: {next}</Button>
    </div>
  )
}

function LocationStep({ draft, patch, cost, onNext }) {
  const setSite = (site) => patch({ site, drSite: draft.drSite === site ? otherSite(site) : draft.drSite })
  const site = siteOf(draft.site)
  const billing = BILLING_TERMS.find((t) => t.id === draft.billing)
  return (
    <>
      <OrderSection title="Site" hint="Where the vDC runs; the replica, if you add one, goes to a second site.">
        <RadioGroup value={draft.site} onValueChange={setSite} className="ck-sites" aria-label="Site">
          {ORDER_SITES.map((s) => (
            <Card
              key={s.id}
              className="ck-site"
              data-state={draft.site === s.id ? "checked" : "unchecked"}
              onClick={() => setSite(s.id)}
            >
              <CardContent className="ck-site-body">
                <RadioGroupItem value={s.id} aria-label={s.name} />
                <div className="ck-site-text">
                  <div className="ck-site-name">{s.name}</div>
                  <div className="ck-site-city">{s.city}</div>
                  <p className="ck-option-desc">{s.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </RadioGroup>
      </OrderSection>
      <OrderSection title="Billing and name">
        <div className="ck-order-two">
          <div className="ck-order-field">
            <Label>Billing term</Label>
            <ToggleGroup
              type="single"
              variant="outline"
              value={draft.billing}
              onValueChange={(id) => id && patch({ billing: id })}
              className="ck-segments"
              aria-label="Billing term"
            >
              {BILLING_TERMS.map((t) => (
                <ToggleGroupItem key={t.id} value={t.id}>{t.name}</ToggleGroupItem>
              ))}
            </ToggleGroup>
            <p className="ck-option-desc">{billing.description}</p>
          </div>
          <div className="ck-order-field">
            <Label htmlFor="ck-order-name">vDC name</Label>
            <InputGroup className="ck-order-name">
              <InputGroupAddon><SiteIcon /></InputGroupAddon>
              <InputGroupInput
                id="ck-order-name"
                value={draft.name}
                onChange={(e) => patch({ name: e.target.value })}
                spellCheck={false}
              />
              <InputGroupAddon align="inline-end">
                <InputGroupText>{site.code.toLowerCase()}.acme.cloud</InputGroupText>
              </InputGroupAddon>
            </InputGroup>
            <p className="ck-option-desc">Shown in the rail and on invoices; lower-case letters, digits and dashes.</p>
          </div>
        </div>
      </OrderSection>
      <DraftBar draft={draft} cost={cost} next="Compute" onNext={onNext} />
    </>
  )
}

function ComputeStep({ draft, patch, cost, onNext }) {
  const [cpuPool, ramPool] = POOLS
  const preset = COMPUTE_PRESETS.find((p) => p.cpu === draft.cpu && p.ram === draft.ram)?.id ?? "custom"
  const applyPreset = (id) => {
    const p = COMPUTE_PRESETS.find((x) => x.id === id)
    if (p) patch({ cpu: p.cpu, ram: p.ram })
  }
  return (
    <>
      <OrderSection title="Pools" hint="Pick a preset or drag the pools; either way every virtual machine in the vDC draws from them.">
        <ToggleGroup
          type="single"
          variant="outline"
          value={preset}
          onValueChange={applyPreset}
          className="ck-presets"
          aria-label="Compute preset"
        >
          {COMPUTE_PRESETS.map((p) => (
            <ToggleGroupItem key={p.id} value={p.id} className="ck-preset" aria-label={`${p.name}: ${p.cpu} GHz, ${p.ram} GB`}>
              <span className="ck-preset-name">{p.name}</span>
              <span className="ck-preset-meta">{p.cpu} GHz · {p.ram} GB</span>
            </ToggleGroupItem>
          ))}
          <ToggleGroupItem value="custom" className="ck-preset" onClick={(e) => e.preventDefault()} aria-label="Custom">
            <span className="ck-preset-name">Custom</span>
            <span className="ck-preset-meta">drag the pools</span>
          </ToggleGroupItem>
        </ToggleGroup>
        <div className="ck-slider-grid">
          {[cpuPool, ramPool].map((p) => (
            <SliderRow
              key={p.id}
              name={p.name}
              unit={p.unit}
              value={draft[p.id]}
              min={p.min}
              max={p.max}
              step={p.step}
              tick={p.tick}
              onChange={(v) => patch({ [p.id]: v })}
              price={draft[p.id] * p.rate}
              rate={`${money(p.rate)} per ${p.unit}`}
              description={p.description}
            />
          ))}
        </div>
        <SwitchRow
          id="ck-order-headroom"
          title="Reserve headroom"
          meta="not billed"
          description={ORDER_COPY.headroom}
          checked={draft.headroom}
          onCheckedChange={(headroom) => patch({ headroom })}
        />
      </OrderSection>
      <OrderSection title="Included" hint={ORDER_COPY.included}>
        <div className="ck-markers">
          {["Hypervisor high availability", "Live migration between hosts", "Management plane and API", "Edge firewall"].map((m) => (
            <Marker key={m} className="ck-marker">
              <MarkerIcon><CheckIcon /></MarkerIcon>
              <MarkerContent>{m}</MarkerContent>
            </Marker>
          ))}
        </div>
      </OrderSection>
      <DraftBar draft={draft} cost={cost} next="Network" onNext={onNext} />
    </>
  )
}

function NetworkStep({ draft, patch, cost, onNext }) {
  const ipPool = POOLS[2]
  const uplink = UPLINKS.find((u) => u.id === draft.uplink)
  const toggleAddon = (id, on) =>
    patch({ addons: on ? [...new Set([...draft.addons, id])] : draft.addons.filter((a) => a !== id) })
  return (
    <>
      <OrderSection title="Public addresses">
        <div className="ck-slider-grid">
          <SliderRow
            name={ipPool.name}
            unit={ipPool.unit}
            value={draft.ips}
            min={ipPool.min}
            max={ipPool.max}
            step={ipPool.step}
            tick={ipPool.tick}
            onChange={(ips) => patch({ ips })}
            price={cost.ips}
            rate={`${money(ipPool.rate)} per address`}
            description={ipPool.description}
          />
        </div>
      </OrderSection>
      <OrderSection title="Uplink" hint="The vDC's internet edge; the first tier is included in the base price.">
        <ToggleGroup
          type="single"
          variant="outline"
          value={draft.uplink}
          onValueChange={(id) => id && patch({ uplink: id })}
          className="ck-presets"
          aria-label="Uplink"
        >
          {UPLINKS.map((u) => (
            <ToggleGroupItem key={u.id} value={u.id} className="ck-preset" aria-label={`${u.name}, ${money(u.rate)} a month`}>
              <span className="ck-preset-name">{u.name}</span>
              <span className="ck-preset-meta">{money(u.rate)}/mo</span>
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <p className="ck-option-desc">{uplink.description}</p>
      </OrderSection>
      <OrderSection title="Add-ons" hint="Edge services provisioned with the vDC; each one is a line on the invoice.">
        <div className="ck-check-list">
          {NETWORK_ADDONS.map((a) => (
            <CheckRow
              key={a.id}
              id={`ck-addon-${a.id}`}
              title={a.name}
              meta={a.included ? "included" : `${money(a.rate)}/mo`}
              description={a.description}
              checked={a.included || draft.addons.includes(a.id)}
              disabled={a.included}
              onCheckedChange={(on) => toggleAddon(a.id, on === true)}
            />
          ))}
        </div>
      </OrderSection>
      <DraftBar draft={draft} cost={cost} next="Storage" onNext={onNext} />
    </>
  )
}

function StorageStep({ draft, patch, cost, onNext }) {
  return (
    <>
      <OrderSection title="Tiers" hint="GB per tier; leave a tier at zero to skip it. Hover a tier's name for its figures.">
        <div className="ck-slider-grid">
          {STORAGE_TIERS.map((t) => (
            <SliderRow
              key={t.id}
              name={t.name}
              label={
                <SpecCard
                  title={`${t.name} · ${t.media}`}
                  rows={[["IOPS per volume", t.iops], ["Latency", t.latency], ["Rate", `${money(t.rate)} per GB`]]}
                >
                  {t.name}
                </SpecCard>
              }
              unit="GB"
              value={draft.storage[t.id]}
              min={0}
              max={10000}
              step={50}
              tick={2500}
              onChange={(v) => patch({ storage: { ...draft.storage, [t.id]: v } })}
              price={draft.storage[t.id] * t.rate}
              rate={`${money(t.rate)} per GB`}
              description={t.description}
            />
          ))}
        </div>
        <div className="ck-storage-mix" aria-label={`${cost.storageGb.toLocaleString("en-US")} GB across ${STORAGE_TIERS.length} tiers`}>
          <div className="ck-storage-mix-bar">
            {STORAGE_TIERS.filter((t) => draft.storage[t.id] > 0).map((t) => (
              <span
                key={t.id}
                className="ck-storage-mix-seg"
                data-tier={t.id}
                style={{ flexGrow: draft.storage[t.id] }}
                title={`${t.name}: ${draft.storage[t.id].toLocaleString("en-US")} GB`}
              />
            ))}
          </div>
          <div className="ck-storage-mix-legend">
            {STORAGE_TIERS.map((t) => (
              <Marker key={t.id} className="ck-marker">
                <MarkerIcon><span className="ck-storage-mix-swatch" data-tier={t.id} /></MarkerIcon>
                <MarkerContent>{t.name} · {draft.storage[t.id].toLocaleString("en-US")} GB</MarkerContent>
              </Marker>
            ))}
            <span className="ck-storage-mix-total">{cost.storageGb.toLocaleString("en-US")} GB · {money(cost.storage)}/mo</span>
          </div>
        </div>
      </OrderSection>
      <DraftBar draft={draft} cost={cost} next="BCDR" onNext={onNext} />
    </>
  )
}

const BCDR_ICONS = { replica: SiteIcon, objectives: ClockIcon, backups: ArchiveIcon }

function BcdrStep({ draft, patch, cost, onNext }) {
  const protectedOn = cost.tier.share > 0
  return (
    <>
      <OrderSection
        title="Business continuity and disaster recovery"
        hint="Continuity keeps the service running through a site failure; recovery is how it gets back afterwards. Both are options here, not defaults."
      >
        <ItemGroup className="ck-bcdr">
          {BCDR_COPY.map((c) => {
            const Icon = BCDR_ICONS[c.id]
            return (
              <Item key={c.id} variant="outline" className="ck-bcdr-item">
                <ItemMedia variant="icon"><Icon /></ItemMedia>
                <ItemContent>
                  <ItemTitle>{c.title}</ItemTitle>
                  <ItemDescription className="ck-bcdr-body">{c.body}</ItemDescription>
                </ItemContent>
              </Item>
            )
          })}
        </ItemGroup>
      </OrderSection>
      <OrderSection title="Protection" hint="How much of the vDC is waiting at a second site, and the objectives that buys.">
        <RadioGroup value={draft.protection} onValueChange={(protection) => patch({ protection })} className="ck-options" aria-label="Protection">
          {PROTECTION_TIERS.map((t) => (
            <OptionRow
              key={t.id}
              value={t.id}
              name={t.name}
              meta={t.share ? `RPO ${t.rpo} · RTO ${t.rto} · ${t.share * 100}% of CPU and RAM` : "No replica"}
              description={t.description}
            />
          ))}
        </RadioGroup>
      </OrderSection>
      <OrderSection title="Replica" className={cn(!protectedOn && "ck-order-muted")}>
        <div className="ck-order-two">
          <div className="ck-order-field">
            <Label htmlFor="ck-order-dr-site">DR target site</Label>
            <Select value={draft.drSite} onValueChange={(drSite) => patch({ drSite })} disabled={!protectedOn}>
              <SelectTrigger id="ck-order-dr-site" className="ck-order-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ORDER_SITES.filter((s) => s.id !== draft.site).map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name} · {s.city}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="ck-option-desc">{ORDER_COPY.drSite}</p>
          </div>
          <SliderRow
            name="Replicated storage"
            unit="%"
            value={draft.drStoragePct}
            min={100}
            max={200}
            step={5}
            tick={25}
            disabled={!protectedOn}
            onChange={(v) => patch({ drStoragePct: v })}
            price={protectedOn ? cost.dr.storage : 0}
            rate={`${cost.drStorageGb.toLocaleString("en-US")} GB at ${money(ORDER_RATES.drStorageGb)} per GB`}
            description={ORDER_COPY.drStorage}
          />
        </div>
        <PriceLine
          name="Replication licences"
          meta={`${cost.vmCount} × ${money(ORDER_RATES.replicationLicence)}`}
          price={protectedOn ? cost.dr.licences : 0}
          description={ORDER_COPY.licences}
        />
      </OrderSection>
      <OrderSection title="Backups">
        <SwitchRow
          id="ck-order-backups"
          title="Nightly backups"
          meta={`${money(ORDER_RATES.backupGb)} per GB`}
          description={ORDER_COPY.backups}
          checked={draft.backups}
          onCheckedChange={(backups) => patch({ backups })}
        />
        <div className="ck-order-field" data-disabled={!draft.backups || undefined}>
          <Label>Retention</Label>
          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            value={draft.retention}
            onValueChange={(id) => id && patch({ retention: id })}
            disabled={!draft.backups}
            className="ck-segments"
            aria-label="Backup retention"
          >
            {BACKUP_RETENTION.map((r) => (
              <ToggleGroupItem key={r.id} value={r.id}>{r.name}</ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
        <PriceLine
          name="Backup storage"
          meta={`${cost.storageGb.toLocaleString("en-US")} GB · ${BACKUP_RETENTION.find((r) => r.id === draft.retention).name}`}
          price={cost.backups}
        />
      </OrderSection>
      <DraftBar draft={draft} cost={cost} next="VMs" onNext={onNext} />
    </>
  )
}

/* ── Virtual machines to provision: one grouped table across every vDC ── */

function vmColumns(onPatch, onRemove, openVms, toggleOpen) {
  return [
    {
      accessorKey: "vdc",
      header: "",
      cell: ({ row }) => (
        <button
          type="button"
          className="ck-vm-expand"
          aria-expanded={openVms.has(row.original.id)}
          aria-label={`Settings for ${row.original.name}`}
          onClick={() => toggleOpen(row.original.id)}
        >
          <ChevronRightIcon />
        </button>
      ),
    },
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => (
        <Input
          className="ck-vm-input"
          value={row.original.name}
          aria-label={`Name of ${row.original.name}`}
          onChange={(e) => onPatch(row.original.id, { name: e.target.value })}
        />
      ),
    },
    {
      accessorKey: "size",
      header: "Size",
      cell: ({ row }) => (
        <Select value={row.original.size} onValueChange={(size) => onPatch(row.original.id, { size })}>
          <SelectTrigger size="sm" className="ck-vm-select" aria-label={`Size of ${row.original.name}`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SIZES.map((s) => (
              <SelectItem key={s.name} value={s.name}>{s.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      ),
    },
    {
      accessorKey: "image",
      header: "Image",
      cell: ({ row }) => (
        <Select value={row.original.image} onValueChange={(image) => onPatch(row.original.id, { image })}>
          <SelectTrigger size="sm" className="ck-vm-select ck-vm-select--wide" aria-label={`Image of ${row.original.name}`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MACHINE_IMAGES.map((i) => (
              <SelectItem key={i.name} value={i.name}>{i.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      ),
    },
    {
      accessorKey: "count",
      header: "Count",
      cell: ({ row }) => (
        <Input
          type="number"
          min="1"
          max="99"
          className="ck-vm-input ck-vm-count"
          value={row.original.count}
          aria-label={`Count of ${row.original.name}`}
          onChange={(e) => onPatch(row.original.id, { count: Math.max(1, Number(e.target.value) || 1) })}
        />
      ),
    },
    {
      id: "price",
      header: "Pool draw",
      cell: ({ row }) => {
        const size = SIZES.find((s) => s.name === row.original.size)
        const [cpu, ram] = POOLS
        const tier = STORAGE_TIERS.find((t) => t.id === row.original.bootTier)
        return (
          <span className="ck-vm-price">
            <SpecCard
              title={`${row.original.count} × ${size.name}`}
              rows={[
                ["vCPU", `${size.vcpus} × ${money(cpu.rate)}`],
                ["RAM", `${size.ram} × ${money(ram.rate)}`],
                ["Root disk", `${size.disk} on ${tier.name}`],
                ["Per machine", `${money(vmMonthly(size.name))}/mo`],
              ]}
            >
              {money(vmMonthly(row.original.size) * row.original.count)}/mo
            </SpecCard>
          </span>
        )
      },
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <Tip label={`Remove ${row.original.name}`}>
          <Button variant="ghost" size="icon" aria-label={`Remove ${row.original.name}`} onClick={() => onRemove(row.original.id)}>
            <CloseIcon />
          </Button>
        </Tip>
      ),
    },
  ]
}

/* Per-machine options, revealed under the row by its chevron. */
function VmSettings({ vm, onPatch }) {
  const set = (changes) => onPatch(vm.id, changes)
  return (
    <div className="ck-vm-settings">
      <SwitchRow
        id={`${vm.id}-ip`}
        title="Public IP"
        meta="1 address"
        description="Attach a routable address from the vDC's public pool."
        checked={vm.publicIp}
        onCheckedChange={(publicIp) => set({ publicIp })}
      />
      <SwitchRow
        id={`${vm.id}-backup`}
        title="Nightly backup"
        description="Include this machine's volumes in the vDC backup set."
        checked={vm.backup}
        onCheckedChange={(backup) => set({ backup })}
      />
      <div className="ck-vm-setting">
        <span className="ck-vm-setting-title">Boot disk tier</span>
        <ToggleGroup
          type="single"
          variant="outline"
          size="sm"
          value={vm.bootTier}
          onValueChange={(bootTier) => bootTier && set({ bootTier })}
          className="ck-segments"
          aria-label={`Boot disk tier of ${vm.name}`}
        >
          {STORAGE_TIERS.slice(1).map((t) => (
            <ToggleGroupItem key={t.id} value={t.id}>{t.name}</ToggleGroupItem>
          ))}
        </ToggleGroup>
        <span className="ck-option-desc">Where the root volume lives; data volumes come from the pools you sized.</span>
      </div>
      <CheckRow
        id={`${vm.id}-start`}
        title="Start after create"
        description="Power on as soon as the image is written."
        checked={vm.startOnCreate}
        onCheckedChange={(on) => set({ startOnCreate: on === true })}
      />
    </div>
  )
}

/* The kit's group row, plus the vDC's placement settings in a popover and an
   action cell: every group offers to add a machine to itself. */
function VmGroupRow({ row, colSpan, label, group, onAdd, onPatchGroup }) {
  const expanded = row.getIsExpanded()
  const vdcId = row.groupValue
  return (
    <TableRow className="data-table-group-row ck-vm-group" data-depth={row.depth}>
      <TableCell colSpan={colSpan - 1} className="data-table-group-cell ck-vm-group-cell">
        <button
          type="button"
          className="data-table-group-toggle"
          aria-expanded={expanded}
          onClick={() => row.toggleExpanded()}
        >
          <ChevronRightIcon />
          <span className="data-table-group-label">{label}</span>
          <span className="data-table-group-count">{row.leafCount}</span>
        </button>
        <Popover>
          <PopoverTrigger as={Button} variant="ghost" size="sm" className="ck-vm-group-settings">
            <SlidersIcon />
            Placement
            {group.antiAffinity && <Badge variant="info">anti-affinity</Badge>}
            <Badge variant="outline">{group.network}</Badge>
          </PopoverTrigger>
          <PopoverContent align="start" className="ck-vm-group-pop">
            <PopoverHeader>
              <PopoverTitle>Placement for {label}</PopoverTitle>
              <PopoverDescription>Applies to every machine in this vDC.</PopoverDescription>
            </PopoverHeader>
            <SwitchRow
              id={`${vdcId}-affinity`}
              title="Anti-affinity"
              description="Spread the machines across hosts, so one host failure takes one machine."
              checked={group.antiAffinity}
              onCheckedChange={(antiAffinity) => onPatchGroup(vdcId, { antiAffinity })}
            />
            <Field>
              <FieldLabel htmlFor={`${vdcId}-network`}>Default network</FieldLabel>
              <NativeSelect
                id={`${vdcId}-network`}
                value={group.network}
                onChange={(e) => onPatchGroup(vdcId, { network: e.target.value })}
              >
                {NETWORKS.filter((n) => n.type === "Private").map((n) => (
                  <NativeSelectOption key={n.name} value={n.name}>{n.name} · {n.subnet}</NativeSelectOption>
                ))}
              </NativeSelect>
              <FieldDescription>New machines attach here first; add more interfaces after launch.</FieldDescription>
            </Field>
          </PopoverContent>
        </Popover>
      </TableCell>
      <TableCell className="ck-vm-group-action">
        <Button variant="ghost" size="sm" className="ck-vm-add" onClick={() => onAdd(vdcId)}>
          <PlusIcon />
          Add virtual machine
        </Button>
      </TableCell>
    </TableRow>
  )
}

function VmTable({ vdcs, draft, vms, onAdd, onPatch, onRemove, onPatchGroup }) {
  const [openVms, setOpenVms] = useState(() => new Set())
  const toggleOpen = useCallback((id) => {
    setOpenVms((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])
  const columns = useMemo(() => vmColumns(onPatch, onRemove, openVms, toggleOpen), [onPatch, onRemove, openVms, toggleOpen])
  const table = useDataTable({
    data: vms,
    columns,
    initialPageSize: 200,
    initialGrouping: ["vdc"],
    getRowId: (vm) => vm.id,
  })
  const all = [...vdcs, draft]
  const names = Object.fromEntries(all.map((v) => [v.id, v.name]))
  const groups = Object.fromEntries(all.map((v) => [v.id, v.vmGroup]))
  // Groups open on arrival and whenever a vDC joins; a group the user folded
  // stays folded until then.
  const groupKey = Object.keys(names).join("|")
  useEffect(() => {
    table.toggleAllExpanded(true)
  }, [groupKey])
  const colSpan = table.getHeaderGroups()[0].headers.length

  return (
    <DataTableScroller className="ck-table-wrap ck-vm-wrap">
      <Table className="ck-table ck-vm-table">
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
          {table.getRowModel().rows.map((row) =>
            row.isGrouped ? (
              <VmGroupRow
                key={row.id}
                row={row}
                colSpan={colSpan}
                label={names[row.groupValue] ?? row.groupValue}
                group={groups[row.groupValue] ?? VM_GROUP_DEFAULTS}
                onAdd={onAdd}
                onPatchGroup={onPatchGroup}
              />
            ) : (
              <Fragment key={row.id}>
                <TableRow data-expanded={openVms.has(row.id) || undefined}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
                {openVms.has(row.id) && (
                  <TableRow className="ck-vm-detail">
                    <TableCell colSpan={colSpan}>
                      <VmSettings vm={row.original} onPatch={onPatch} />
                    </TableCell>
                  </TableRow>
                )}
              </Fragment>
            )
          )}
        </TableBody>
      </Table>
    </DataTableScroller>
  )
}

function VmsStep({ draft, cost, vdcs, vms, onAddVm, onPatchVm, onRemoveVm, onPatchGroup, onNext }) {
  return (
    <>
      <OrderSection title="Virtual machines" hint={ORDER_COPY.vms} wide>
        <VmTable
          vdcs={vdcs}
          draft={draft}
          vms={vms}
          onAdd={onAddVm}
          onPatch={onPatchVm}
          onRemove={onRemoveVm}
          onPatchGroup={onPatchGroup}
        />
        <p className="ck-option-desc">
          Open a row's chevron for its own options; the vDC's placement rules sit on its group row.
        </p>
      </OrderSection>
      <DraftBar draft={draft} cost={cost} next="Summary" onNext={onNext} />
    </>
  )
}

/* ── Summary: every configured vDC, its replica as a second row ─────────── */

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

function SummaryStep({ order, cost, onAdd, onEdit, onRemove, onPlace }) {
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

function OrderView({ order, setOrder, onNavigate }) {
  const [step, setStep] = useState("location")
  const { draft, vdcs, vms } = order
  const cost = vdcCost(draft, vms)
  const committed = vdcs.reduce((sum, v) => sum + vdcCost(v, vms).total, 0)

  const patch = (changes) => setOrder((o) => ({ ...o, draft: { ...o.draft, ...changes } }))
  const addVdc = () =>
    setOrder((o) => {
      const seq = o.seq + 1
      const vmSeq = o.vmSeq + 1
      return {
        ...o,
        vdcs: [...o.vdcs, o.draft],
        draft: newDraft(seq),
        vms: [...o.vms, newVm(`vdc-${seq}`, vmSeq)],
        editing: null,
        seq,
        vmSeq,
      }
    })
  const editVdc = useCallback((id) => {
    setOrder((o) => {
      const target = o.vdcs.find((v) => v.id === id)
      if (!target) return o
      return {
        ...o,
        vdcs: [...o.vdcs.filter((v) => v.id !== id), o.draft],
        draft: target,
        editing: id,
      }
    })
    setStep("location")
  }, [setOrder])
  const removeVdc = useCallback((id) => {
    setOrder((o) => ({ ...o, vdcs: o.vdcs.filter((v) => v.id !== id), vms: o.vms.filter((v) => v.vdc !== id) }))
  }, [setOrder])
  const addVm = useCallback((vdcId) => {
    setOrder((o) => ({ ...o, vms: [...o.vms, newVm(vdcId, o.vmSeq + 1)], vmSeq: o.vmSeq + 1 }))
  }, [setOrder])
  const patchVm = useCallback((id, changes) => {
    setOrder((o) => ({ ...o, vms: o.vms.map((v) => (v.id === id ? { ...v, ...changes } : v)) }))
  }, [setOrder])
  const removeVm = useCallback((id) => {
    setOrder((o) => ({ ...o, vms: o.vms.filter((v) => v.id !== id) }))
  }, [setOrder])
  const patchGroup = useCallback((vdcId, changes) => {
    setOrder((o) =>
      o.draft.id === vdcId
        ? { ...o, draft: { ...o.draft, vmGroup: { ...o.draft.vmGroup, ...changes } } }
        : { ...o, vdcs: o.vdcs.map((v) => (v.id === vdcId ? { ...v, vmGroup: { ...v.vmGroup, ...changes } } : v)) }
    )
  }, [setOrder])
  const placeOrder = () => {
    fakeTask("Place order", `${vdcs.length} vDC${vdcs.length === 1 ? "" : "s"}, ${money(committed)} a month`)
    setOrder((o) => newOrder(o.seq + 1, o.vmSeq + 1))
  }

  const count = vdcs.length
  return (
    <div className="ck-view ck-order">
      <div className="ck-order-head">
        <Button variant="ghost" size="sm" className="ck-order-back" onClick={() => onNavigate("vdc", "Data Centers")}>
          <ArrowLeftIcon />
          Data Centers
        </Button>
        <div className="ck-order-heading">
          <h4 className="ck-page-title">{ORDER_PAGE}</h4>
          <p className="ck-order-lede">Pick a site, size the pools and the network, decide how much of it survives a bad day, then review the order.</p>
        </div>
        <button
          type="button"
          className="ck-order-cart"
          onClick={() => setStep("summary")}
          aria-label={`Order: ${count} vDC${count === 1 ? "" : "s"}, ${money(committed)} a month. Open the summary`}
        >
          <CartIcon />
          <span className="ck-order-cart-count">{count} {count === 1 ? "vDC" : "vDCs"}</span>
          <span className="ck-order-cart-total">{money(committed)}/mo</span>
        </button>
      </div>
      <Tabs value={step} onValueChange={setStep} className="ck-order-tabs">
        <TabsList>
          {ORDER_STEPS.map((s, i) => (
            <TabsTrigger key={s.id} value={s.id}>
              <span className="ck-order-step-num">{i + 1}</span>
              {s.label}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="location" className="ck-order-panel" data-step="location">
          <LocationStep draft={draft} patch={patch} cost={cost} onNext={() => setStep("compute")} />
        </TabsContent>
        <TabsContent value="compute" className="ck-order-panel" data-step="compute">
          <ComputeStep draft={draft} patch={patch} cost={cost} onNext={() => setStep("network")} />
        </TabsContent>
        <TabsContent value="network" className="ck-order-panel" data-step="network">
          <NetworkStep draft={draft} patch={patch} cost={cost} onNext={() => setStep("storage")} />
        </TabsContent>
        <TabsContent value="storage" className="ck-order-panel" data-step="storage">
          <StorageStep draft={draft} patch={patch} cost={cost} onNext={() => setStep("bcdr")} />
        </TabsContent>
        <TabsContent value="bcdr" className="ck-order-panel" data-step="bcdr">
          <BcdrStep draft={draft} patch={patch} cost={cost} onNext={() => setStep("vms")} />
        </TabsContent>
        <TabsContent value="vms" className="ck-order-panel" data-step="vms">
          <VmsStep
            draft={draft}
            cost={cost}
            vdcs={vdcs}
            vms={vms}
            onAddVm={addVm}
            onPatchVm={patchVm}
            onRemoveVm={removeVm}
            onPatchGroup={patchGroup}
            onNext={() => setStep("summary")}
          />
        </TabsContent>
        <TabsContent value="summary" className="ck-order-panel" data-step="summary">
          <SummaryStep order={order} cost={cost} onAdd={addVdc} onEdit={editVdc} onRemove={removeVdc} onPlace={placeOrder} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

/* ── Page routing inside the mock ────────────────────────────────────── */

function PageContent({ svc, page, project, order, setOrder, onNavigate, onDetails }) {
  if (svc === "overview") {
    switch (page) {
      case "Capacity":
        return (
          <CardPage title="Capacity" count="live">
            <StatCards />
            <UtilizationCard />
          </CardPage>
        )
      case "Health":
        return <CardPage title="Service Health" count={`${HEALTH.length} groups`}><HealthCard /></CardPage>
      case "Recent Events":
        return <CardPage title="Recent Events" count="live"><EventsCard max={12} /></CardPage>
      default:
        return <Dashboard />
    }
  }
  switch (page) {
    case "Virtual Machines":
      return <InstancesView project={project} onDetails={onDetails} />
    case "Virtual Machine Sizes":
      return (
        <SimpleTable
          title="Virtual Machine Sizes"
          count={`${SIZES.length} sizes`}
          cols={["Name", "vCPUs", "Memory", "Root disk", "Public"]}
          rows={SIZES.map((f) => [<code className="ck-mono" key="n">{f.name}</code>, f.vcpus, f.ram, f.disk, f.pub])}
          actions={SIZES.map((f) => ({
            name: f.name,
            items: [{ label: "Launch virtual machine" }, { label: "Copy specification" }, { label: "Set as project default" }, { label: "Retire", danger: true }],
          }))}
        />
      )
    case "Quotas":
      return <QuotasView />
    case ORDER_PAGE:
      return <OrderView order={order} setOrder={setOrder} onNavigate={onNavigate} />
    case "Data Centers":
      return (
        <SimpleTable
          title="Data Centers"
          count={`${DATA_CENTERS.length} data centers`}
          cols={["Name", "Region", "Hosts", "Virtual Machines", "Status"]}
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
        >
          <div className="ck-actions">
            <Button size="sm" className="ck-order-open" onClick={() => onNavigate("order", ORDER_PAGE)}>
              <CartIcon />
              Order a VDC
            </Button>
          </div>
        </SimpleTable>
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
            items: [{ label: "Attach to virtual machine" }, { label: "Detach" }, { label: "Set reverse DNS" }, { label: "Release", danger: true }],
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
    case "Event Log":
      return <CardPage title="Event Log" count={`${EVENTS.length} events`}><EventsCard max={12} /></CardPage>
    case "Services":
      return <CardPage title="Services" count={`${HEALTH.length} groups`}><HealthCard /></CardPage>
    case "Tickets":
      return <SupportPanel />
    case "Settings":
      return <SettingsPanel />
    case "Access Keys":
      return <AccessKeysView />
    case "Templates & Images":
      return (
        <SimpleTable
          title="Templates & Images"
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
            items: [{ label: "Launch virtual machine" }, { label: "Copy to region" }, { label: "Share with project" }, { label: "Deprecate" }, { label: "Delete", danger: true }],
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
            items: [{ label: "Edit network" }, { label: "Add subnet" }, { label: "Attach virtual machine" }, { label: "Manage firewall" }, { label: "Delete", danger: true }],
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
    default: {
      const vdc = VDCS.find((v) => v.name === page)
      return vdc ? <VdcView vdc={vdc} /> : <UnderConstruction name={page} />
    }
  }
}

/* ── Taskbar: the whole console's width, resizable from its top edge ──── */

const TASKBAR_H = { initial: 220, min: 96, max: 480 }
/* A running task gains this much per tick, so the bars visibly move. */
const TASK_PACE = 0.6

const taskTone = (t) =>
  t.status === "Failed" ? "err" : t.status === "Succeeded" ? "ok" : t.pct < 50 ? "info" : "run"

const taskActions = (t) =>
  t.status === "Running"
    ? [{ label: "View log" }, { label: "Cancel", danger: true }]
    : t.status === "Failed"
      ? [{ label: "View log" }, { label: "Retry" }, { label: "Dismiss" }]
      : [{ label: "View log" }, { label: "Open target" }, { label: "Dismiss" }]

function ConsoleTaskbar() {
  const [open, setOpen] = useState(false)
  const [height, setHeight] = useState(TASKBAR_H.initial)
  const [dragging, setDragging] = useState(false)
  const drag = useRef(null)
  // The ticker is shared page-wide, so a bar's progress counts from the tick
  // the panel opened on: opening always shows the data's own figures first.
  const tick = useTicker(TICK_MS)
  const [origin, setOrigin] = useState(0)
  const elapsed = open ? tick - origin : 0
  const rows = TASKS.map((t) => ({
    ...t,
    pct: t.status === "Running" ? Math.min(99, Math.round(t.progress + elapsed * TASK_PACE)) : 100,
  }))
  const running = TASKS.filter((t) => t.status === "Running").length
  const failed = TASKS.filter((t) => t.status === "Failed").length

  const onGripDown = (e) => {
    drag.current = { startY: e.clientY, startH: height }
    e.currentTarget.setPointerCapture(e.pointerId)
    setDragging(true)
  }
  const onGripMove = (e) => {
    if (!drag.current) return
    const { startY, startH } = drag.current
    setHeight(clamp(startH + (startY - e.clientY), TASKBAR_H))
  }
  const onGripUp = (e) => {
    if (!drag.current) return
    drag.current = null
    e.currentTarget.releasePointerCapture(e.pointerId)
    setDragging(false)
  }

  return (
    <Collapsible
      className="ck-taskbar"
      open={open}
      onOpenChange={(next) => {
        if (next) setOrigin(tick)
        setOpen(next)
      }}
      data-dragging={dragging || undefined}
      style={{ "--ck-taskbar-h": `${height}px` }}
    >
      {open && (
        <div
          className="ck-taskbar-grip"
          role="separator"
          aria-orientation="horizontal"
          aria-label="Resize the task panel"
          aria-valuenow={height}
          aria-valuemin={TASKBAR_H.min}
          aria-valuemax={TASKBAR_H.max}
          onPointerDown={onGripDown}
          onPointerMove={onGripMove}
          onPointerUp={onGripUp}
          onPointerCancel={onGripUp}
        />
      )}
      <CollapsibleTrigger className="ck-taskbar-bar">
        <Spinner className="ck-taskbar-spinner" />
        <span className="ck-taskbar-label">Recent tasks</span>
        <span className="ck-taskbar-stat">Running: <b data-tone="run">{running}</b></span>
        <span className="ck-taskbar-stat">Failed: <b data-tone={failed ? "err" : "ok"}>{failed}</b></span>
        <span className="ck-taskbar-caret" aria-hidden="true"><ChevronUpIcon /></span>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="ck-taskbar-panel">
          <Table className="ck-table ck-task-table">
            <TableHeader>
              <TableRow>
                <TableHead>Task</TableHead>
                <TableHead>Target</TableHead>
                <TableHead className="ck-task-progress-head">Progress</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Started</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((t) => {
                const tone = taskTone(t)
                return (
                  <TableRow key={t.id} data-status={t.status}>
                    <TableCell>{t.task}</TableCell>
                    <TableCell><code className="ck-mono">{t.target}</code></TableCell>
                    <TableCell>
                      <div className="ck-task-progress" data-tone={tone}>
                        {t.status === "Running" ? (
                          <Spinner className="ck-task-spinner" />
                        ) : (
                          <Dot tone={t.status === "Failed" ? "error" : "success"} size="sm" />
                        )}
                        <Progress
                          value={t.pct}
                          glow={t.status === "Running"}
                          className="ck-task-bar"
                          aria-label={`${t.task} ${t.target}`}
                        />
                        <span className="ck-task-pct">{t.pct}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="ck-task-status" data-tone={tone}>{t.status}</span>
                      {t.error && <span className="ck-task-error"> · {t.error}</span>}
                    </TableCell>
                    <TableCell>{t.started}</TableCell>
                    <TableCell>{t.duration || "–"}</TableCell>
                    <TableCell className="ck-task-actions">
                      <RowActions name={`${t.task}: ${t.target}`} items={taskActions(t)} />
                    </TableCell>
                  </TableRow>
                )
              })}
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
      <SheetContent side="right" className="ck-sheet">
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
      description="Jump to a page or run an action"
    >
      <CommandInput placeholder="Where to? Try volumes or invoices..." />
      <CommandList>
        <CommandEmpty>No pages match.</CommandEmpty>
        {CATEGORIES.map((cat) => (
          <CommandGroup key={cat.id} heading={cat.label}>
            {cat.items.flatMap((svc) =>
              svc.pages.map((page) => (
                <CommandItem
                  key={`${svc.id}-${page}`}
                  value={`${cat.label} ${svc.name} ${page}`}
                  onSelect={() => go(svc.id, page)}
                >
                  {page}
                  <CommandShortcut>{svc.name}</CommandShortcut>
                </CommandItem>
              ))
            )}
          </CommandGroup>
        ))}
        <CommandSeparator />
        <CommandGroup heading="Actions">
          <CommandItem
            value="launch virtual machine vm create server"
            onSelect={() => { fakeTask("Launch virtual machine", "Scheduling on az-east-1a"); onOpenChange(false) }}
          >
            Launch a virtual machine
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

/* ── Tab bar: the pages of the selected service ──────────────────────── */

function TabBar({ svc, page, onNavigate }) {
  return (
    <div className="ck-tabbar">
      <Tabs value={page} onValueChange={(p) => onNavigate(svc.id, p)} className="ck-tabs">
        <TabsList>
          {svc.pages.map((p) => (
            <TabsTrigger key={p} value={p}>{p}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      <Badge variant="success" glow className="ck-live-badge">Live</Badge>
    </div>
  )
}

/* ── Root ────────────────────────────────────────────────────────────── */

/* Rail widths in px, the CloudKey console's: a pointer drag on a handle
   writes them into the body grid's column variables. */
const PRI_W = { initial: 210, min: 120, max: 400 }
const SEC_W = { initial: 200, min: 100, max: 350 }
const RAIL_COLLAPSED_W = 56
const clamp = (n, { min, max }) => Math.max(min, Math.min(max, n))

export default function ConsoleShowcase() {
  const [view, setView] = useState({ svc: "overview", page: "Dashboard" })
  const [project, setProject] = useState("engineering")
  const [region, setRegion] = useState("Dallas")
  const [order, setOrder] = useState(newOrder)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [detailInstance, setDetailInstance] = useState(null)
  const [priCollapsed, setPriCollapsed] = useState(false)
  const [secCollapsed, setSecCollapsed] = useState(false)
  const [priW, setPriW] = useState(PRI_W.initial)
  const [secW, setSecW] = useState(SEC_W.initial)
  const [dragging, setDragging] = useState(null)

  const navigate = useCallback((svcId, page) => {
    const svc = findService(svcId)
    setView({ svc: svcId, page: page ?? svc?.pages[0] ?? "Dashboard" })
  }, [])

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setPaletteOpen((v) => !v)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  useEffect(() => {
    if (!dragging) return
    const onMove = (e) => {
      const width = dragging.startW + e.clientX - dragging.startX
      if (dragging.rail === "pri") setPriW(clamp(width, PRI_W))
      else setSecW(clamp(width, SEC_W))
    }
    const onUp = () => setDragging(null)
    window.addEventListener("pointermove", onMove)
    window.addEventListener("pointerup", onUp)
    document.body.style.cursor = "col-resize"
    document.body.style.userSelect = "none"
    return () => {
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerup", onUp)
      document.body.style.cursor = ""
      document.body.style.userSelect = ""
    }
  }, [dragging])

  const svc = findService(view.svc)
  const category = svc.category
  // The order form takes the whole frame: rails and tab bar step aside so
  // its tables get the room, and its own header carries the way back.
  const orderMode = view.page === ORDER_PAGE
  const priEdge = priCollapsed ? RAIL_COLLAPSED_W : priW
  const secEdge = secCollapsed ? RAIL_COLLAPSED_W : secW

  const handle = (rail, edge, startW) => (
    <div
      className="ck-resize"
      style={{ insetInlineStart: edge - 2 }}
      data-dragging={dragging?.rail === rail || undefined}
      onPointerDown={(e) => setDragging({ rail, startX: e.clientX, startW })}
      role="separator"
      aria-orientation="vertical"
      aria-label={rail === "pri" ? "Resize primary sidebar" : "Resize secondary sidebar"}
    />
  )

  return (
    <TooltipProvider delayDuration={250}>
      <div
        className="ck-console"
        data-pg="console"
        data-pri={priCollapsed ? "collapsed" : "expanded"}
        data-sec={secCollapsed ? "collapsed" : "expanded"}
        data-focus={orderMode ? "order" : undefined}
        style={{ "--pri-w": `${priW}px`, "--sec-w": `${secW}px` }}
      >
        <ConsoleTopbar
          project={project}
          setProject={setProject}
          region={region}
          setRegion={setRegion}
          orderCount={order.vdcs.length}
          onOrder={() => navigate("order", ORDER_PAGE)}
          onOpenPalette={() => setPaletteOpen(true)}
        />
        <div className="ck-body">
          <PriRail
            category={category}
            collapsed={priCollapsed}
            onNavigate={navigate}
            onToggleCollapse={() => setPriCollapsed((v) => !v)}
          />
          <SecRail
            category={category}
            svc={svc}
            page={view.page}
            collapsed={secCollapsed}
            onNavigate={navigate}
            onToggleCollapse={() => setSecCollapsed((v) => !v)}
          />
          <div className="ck-main">
            {!orderMode && <TabBar svc={svc} page={view.page} onNavigate={navigate} />}
            <div className="ck-scroller">
              <div className="ck-content">
                <PageContent
                  svc={view.svc}
                  page={view.page}
                  project={project}
                  order={order}
                  setOrder={setOrder}
                  onNavigate={navigate}
                  onDetails={setDetailInstance}
                />
              </div>
            </div>
          </div>
          {!orderMode && !priCollapsed && handle("pri", priEdge, priW)}
          {!orderMode && !secCollapsed && handle("sec", priEdge + secEdge, secW)}
        </div>
        <ConsoleTaskbar />
        <ConsolePalette open={paletteOpen} onOpenChange={setPaletteOpen} onNavigate={navigate} />
        <InstanceSheet instance={detailInstance} onOpenChange={(open) => !open && setDetailInstance(null)} />
        <Toaster position="bottom-right" richColors />
      </div>
    </TooltipProvider>
  )
}
