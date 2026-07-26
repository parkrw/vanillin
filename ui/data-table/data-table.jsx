import { useState } from "react"
import { cn } from "../../lib/cn.js"
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
