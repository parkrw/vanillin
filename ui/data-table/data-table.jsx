import { useState, useRef } from "react"
import { cn } from "../../lib/cn.js"
import { TableRow, TableCell } from "../table/table.jsx"
import { Popover, PopoverTrigger, PopoverContent } from "../popover/popover.jsx"
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "../command/command.jsx"
import { Checkbox } from "../checkbox/checkbox.jsx"
import { Badge } from "../badge/badge.jsx"
import { Separator } from "../separator/separator.jsx"
import { Button } from "../button/button.jsx"
import { ScrollArea, ScrollBar } from "../scroll-area/scroll-area.jsx"

// ── Inline SVG sort icons ───────────────────────────────────────────

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

function SortIcon({ sorted }) {
  if (sorted === "asc") return <ArrowUp />
  if (sorted === "desc") return <ArrowDown />
  return <ArrowUpDown />
}

/**
 * Sort header button with shift-click multi-sort and accessible names.
 *
 * Plain click sets the column as the only sort key; shift-click appends it
 * (or toggles direction if already in the chain). The primary sort column
 * gets `aria-sort` on its `<th>` (handled by the caller); secondary columns
 * get an `aria-label` describing their position ("Email, sorted ascending,
 * sort 2").
 */
export function DataTableColumnHeader({ column, title, className }) {
  if (!column.getCanSort()) return <span className={className}>{title}</span>

  const sorted = column.getIsSorted()
  const sortIndex = column.getSortIndex()

  let ariaLabel
  if (sorted && sortIndex >= 1) {
    const dir = sorted === "asc" ? "ascending" : "descending"
    ariaLabel = `${title}, sorted ${dir}, sort ${sortIndex + 1}`
  }

  return (
    <button
      className={cn("data-table-sort-btn", className)}
      onClick={(e) => column.toggleSorting(sorted === "asc", e.shiftKey)}
      aria-label={ariaLabel}
      {...(sorted ? { "data-sorted": sorted } : {})}
    >
      {title}
      <SortIcon sorted={sorted} />
    </button>
  )
}

// ── Inline SVG for the faceted trigger icon ─────────────────────────

function PlusCircle() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <path d="M8 12h8" />
      <path d="M12 8v8" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  )
}

/**
 * Faceted multi-select filter popover built from popover + command + checkbox.
 *
 * Shows unique values for `column` with counts derived from rows passing
 * every other active filter (not this column's own selection). Selecting
 * values sets an array column filter; "Clear filters" removes it.
 *
 * Props:
 *   column   – column proxy from the table engine
 *   title    – display name for the filter
 *   options  – optional `{ label, value, icon }[]`; when omitted the faceted
 *              values are used directly
 */
export function DataTableFacetedFilter({ column, title, options: optionsProp }) {
  const [open, setOpen] = useState(false)

  const facets = column.getFacetedUniqueValues()
  const filterValue = column.getFilterValue()
  const selected = new Set(Array.isArray(filterValue) ? filterValue : [])

  // Derive options from the faceted values if none provided
  const options = optionsProp ??
    [...facets.keys()].sort().map((v) => ({ label: String(v), value: String(v) }))

  const toggle = (value) => {
    const next = new Set(selected)
    if (next.has(value)) next.delete(value)
    else next.add(value)
    column.setFilterValue(next.size ? [...next] : undefined)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger as={Button} variant="outline" size="sm" className="data-table-facet-trigger">
        <PlusCircle />
        {title}
        {selected.size > 0 && (
          <>
            <Separator orientation="vertical" decorative className="data-table-facet-sep" />
            {selected.size <= 2 ? (
              [...selected].map((v) => {
                const opt = options.find((o) => o.value === v)
                return (
                  <Badge key={v} variant="secondary" className="data-table-facet-badge">
                    {opt?.label ?? v}
                  </Badge>
                )
              })
            ) : (
              <Badge variant="secondary" className="data-table-facet-badge">
                {selected.size} selected
              </Badge>
            )}
          </>
        )}
      </PopoverTrigger>
      <PopoverContent className="data-table-facet-content" align="start">
        <Command>
          <CommandInput placeholder={title} />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup>
              {options.map((opt) => {
                const isSelected = selected.has(opt.value)
                const count = facets.get(opt.value) ?? facets.get(Number(opt.value)) ?? 0
                return (
                  <CommandItem
                    key={opt.value}
                    value={opt.value}
                    onSelect={() => toggle(opt.value)}
                  >
                    <span className="data-table-facet-check" data-selected={isSelected ? "" : undefined}>
                      {isSelected && <CheckIcon />}
                    </span>
                    {opt.icon}
                    <span>{opt.label ?? opt.value}</span>
                    <span className="data-table-facet-count">{count}</span>
                  </CommandItem>
                )
              })}
            </CommandGroup>
            {selected.size > 0 && (
              <>
                <CommandSeparator alwaysRender />
                <CommandGroup>
                  <CommandItem
                    onSelect={() => column.setFilterValue(undefined)}
                    className="data-table-facet-clear"
                  >
                    Clear filters
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

// ── Group row ──────────────────────────────────────────────────────

function ChevronRightIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m9 18 6-6-6-6" />
    </svg>
  )
}

/**
 * Full-width group header row for a grouped table. Renders one cell
 * spanning every visible column with an expand/collapse chevron, the group
 * value, and the leaf-row count. Nested groups indent by `row.depth`.
 *
 * Props:
 *   row      – group row from the engine (`row.isGrouped === true`)
 *   colSpan  – number of visible columns (span the full table width)
 *   label    – optional display label; defaults to the group value
 */
export function DataTableGroupRow({ row, colSpan, label, className }) {
  const isExpanded = row.getIsExpanded()
  return (
    <TableRow className={cn("data-table-group-row", className)} data-depth={row.depth}>
      <TableCell colSpan={colSpan} className="data-table-group-cell">
        <button
          className="data-table-group-toggle"
          style={{ "--dt-group-depth": row.depth }}
          aria-expanded={isExpanded}
          onClick={() => row.toggleExpanded()}
        >
          <ChevronRightIcon />
          <span className="data-table-group-label">
            {label ?? String(row.groupValue)}
          </span>
          <span className="data-table-group-count">{row.leafCount}</span>
        </button>
      </TableCell>
    </TableRow>
  )
}

// ── Scroll container ───────────────────────────────────────────────

/**
 * Horizontal scroll container for a wide table: `ScrollArea` with the one
 * override a `<table>` needs.
 *
 * `Table` wraps its `<table>` in `.table-container { overflow: auto }`, which
 * would be a second scroller nested inside the scroll area's viewport — the
 * viewport would never overflow, so no overlay scrollbar and no reason for it
 * to scroll. `.data-table-scroller .table-container { overflow: visible }`
 * (in data-table.css) hands the scrolling to the viewport instead.
 *
 * That single change is also what keeps column pinning working: sticky cells
 * position against their nearest scrollport, and both the pinned cells and
 * the overlay scrollbar now measure the same element. Pinning needs nothing
 * else from here — `position: sticky` and the `--dt-size-*` offsets are
 * unchanged.
 *
 * Constrain the width on this element (or its parent) — a scroll area with
 * nothing to scroll renders no bars.
 */
export function DataTableScroller({ className, children, ...props }) {
  return (
    <ScrollArea className={cn("data-table-scroller", className)} {...props}>
      {children}
      {/* ScrollArea mounts only the vertical bar itself; a wide table is
          exactly the horizontal case, so it is not the consumer's job. The
          bar is absolutely positioned against the scroll-area root, so
          sitting inside the scrolled content costs nothing. */}
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  )
}

// ── Column resizer ─────────────────────────────────────────────────

/**
 * Drag handle for column resizing. Place inside a `<th>`.
 *
 * Pointer drag updates a CSS custom property (`--dt-size-<colId>`) on the
 * nearest `<table>` element for zero-rerender feedback, then commits to
 * React state on pointerup. Double-click resets to the column def's
 * default `size`. Keyboard: arrows ±8 px, Home/End to min/max.
 */
export function DataTableColumnResizer({ column }) {
  const handleRef = useRef(null)

  const min = column.columnDef?.minSize ?? 40
  const max = column.columnDef?.maxSize ?? 800

  const onPointerDown = (e) => {
    if (e.button !== 0) return
    e.preventDefault()
    const el = handleRef.current
    const tableEl = el.closest("table")
    const isRtl = getComputedStyle(el).direction === "rtl"
    const startX = e.clientX
    const startSize = column.getSize()

    el.setAttribute("data-resizing", "")

    const onMove = (ev) => {
      const delta = (ev.clientX - startX) * (isRtl ? -1 : 1)
      const clamped = Math.min(max, Math.max(min, startSize + delta))
      tableEl.style.setProperty(`--dt-size-${column.id}`, `${clamped}px`)
    }

    const onUp = (ev) => {
      el.removeAttribute("data-resizing")
      document.removeEventListener("pointermove", onMove)
      document.removeEventListener("pointerup", onUp)
      const delta = (ev.clientX - startX) * (isRtl ? -1 : 1)
      column.setSize(Math.min(max, Math.max(min, startSize + delta)))
    }

    document.addEventListener("pointermove", onMove)
    document.addEventListener("pointerup", onUp)
  }

  const onKeyDown = (e) => {
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      e.preventDefault()
      const isRtl = getComputedStyle(e.target).direction === "rtl"
      let delta = e.key === "ArrowRight" ? 8 : -8
      if (isRtl) delta = -delta
      column.setSize(Math.min(max, Math.max(min, column.getSize() + delta)))
    } else if (e.key === "Home") {
      e.preventDefault()
      column.setSize(min)
    } else if (e.key === "End") {
      e.preventDefault()
      column.setSize(max)
    }
  }

  return (
    <div
      ref={handleRef}
      className="data-table-resizer"
      role="separator"
      aria-orientation="vertical"
      aria-valuenow={column.getSize()}
      aria-valuemin={min}
      aria-valuemax={max}
      tabIndex={0}
      onPointerDown={onPointerDown}
      onDoubleClick={() => column.resetSize()}
      onKeyDown={onKeyDown}
    />
  )
}
