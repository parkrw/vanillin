import { Fragment } from "react"
import { cn } from "../../lib/cn.js"
import { Badge } from "../../ui/badge/badge.jsx"
import { Button } from "../../ui/button/button.jsx"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "../../ui/dropdown-menu/dropdown-menu.jsx"
import { StatusDot } from "../../ui/status-dot/status-dot.jsx"
import { toast } from "../../ui/toast/toast.jsx"
import { Tooltip, TooltipContent, TooltipTrigger } from "../../ui/tooltip/tooltip.jsx"
import { EllipsisIcon } from "./icons.jsx"
import "../../ui/badge/badge.css"
import "../../ui/button/button.css"
import "../../ui/dropdown-menu/dropdown-menu.css"
import "../../ui/status-dot/status-dot.css"
import "../../ui/toast/toast.css"
import "../../ui/tooltip/tooltip.css"

/* Every live number in the mock beats on this one shared timer. */
export const TICK_MS = 2000

/* Wraps a control whose own element is already claimed — a dropdown trigger,
   a status dot — so the tooltip has something to anchor to. */
export function Tip({ label, side = "top", className, children }) {
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

export function Dot({ tone, ...props }) {
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

export function StatusBadge({ value }) {
  return <Badge variant={STATUS_TONE[value] ?? "outline"}>{value}</Badge>
}

export const TONE_BADGE = { success: "success", warning: "warning", error: "destructive-soft", info: "info" }

/* Menu entries shared by a row's (…) menu and its right-click menu.
   Non-destructive entries queue a fake task; destructive ones report the
   demo's protection, both naming the row. */
export function ActionItems({ name, items }) {
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

export function RowActions({ name, items }) {
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

export function fakeTask(title, description) {
  toast.promise(new Promise((resolve) => setTimeout(resolve, 1400)), {
    loading: `${title}...`,
    success: { title: `${title} queued`, description },
  })
}

export const clamp = (n, { min, max }) => Math.max(min, Math.min(max, n))
