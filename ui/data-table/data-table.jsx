import { cn } from "../../lib/cn.js"

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
