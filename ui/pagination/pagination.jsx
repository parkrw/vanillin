import { cn } from "../../lib/cn.js"

export function Pagination({ className, ...props }) {
  return <nav role="navigation" aria-label="pagination" className={cn("pagination", className)} {...props} />
}

export function PaginationContent({ className, ...props }) {
  return <ul className={cn("pagination-content", className)} {...props} />
}

export function PaginationItem(props) {
  return <li {...props} />
}

/**
 * isActive: current page — aria-current + outline style
 * size: default | sm | lg | icon (icon for page numbers, default for prev/next)
 * as: render a different element/component (e.g. a router Link)
 */
export function PaginationLink({ isActive, size = "icon", as: Comp = "a", className, ...props }) {
  return (
    <Comp
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "btn",
        isActive ? "btn--outline" : "btn--ghost",
        size !== "default" && `btn--${size}`,
        className
      )}
      {...props}
    />
  )
}

export function PaginationPrevious({ className, ...props }) {
  return (
    <PaginationLink
      aria-label="Go to previous page"
      size="default"
      className={cn("pagination-previous", className)}
      {...props}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m15 18-6-6 6-6" />
      </svg>
      <span>Previous</span>
    </PaginationLink>
  )
}

export function PaginationNext({ className, ...props }) {
  return (
    <PaginationLink
      aria-label="Go to next page"
      size="default"
      className={cn("pagination-next", className)}
      {...props}
    >
      <span>Next</span>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m9 18 6-6-6-6" />
      </svg>
    </PaginationLink>
  )
}

export function PaginationEllipsis({ className, ...props }) {
  return (
    <span aria-hidden="true" className={cn("pagination-ellipsis", className)} {...props}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="1" />
        <circle cx="19" cy="12" r="1" />
        <circle cx="5" cy="12" r="1" />
      </svg>
      <span className="sr-only">More pages</span>
    </span>
  )
}
