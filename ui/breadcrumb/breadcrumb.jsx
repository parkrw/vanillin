import { cn } from "../../lib/cn.js"

export function Breadcrumb({ className, ...props }) {
  return <nav aria-label="breadcrumb" className={cn("breadcrumb", className)} {...props} />
}

export function BreadcrumbList({ className, ...props }) {
  return <ol className={cn("breadcrumb-list", className)} {...props} />
}

export function BreadcrumbItem({ className, ...props }) {
  return <li className={cn("breadcrumb-item", className)} {...props} />
}

export function BreadcrumbLink({ className, as: Comp = "a", ...props }) {
  return <Comp className={cn("breadcrumb-link", className)} {...props} />
}

export function BreadcrumbPage({ className, ...props }) {
  return (
    <span
      role="link"
      aria-disabled="true"
      aria-current="page"
      className={cn("breadcrumb-page", className)}
      {...props}
    />
  )
}

export function BreadcrumbSeparator({ className, children, ...props }) {
  return (
    <li role="presentation" aria-hidden="true" className={cn("breadcrumb-separator", className)} {...props}>
      {children ?? (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m9 18 6-6-6-6" />
        </svg>
      )}
    </li>
  )
}

export function BreadcrumbEllipsis({ className, ...props }) {
  return (
    <span role="presentation" aria-hidden="true" className={cn("breadcrumb-ellipsis", className)} {...props}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="1" />
        <circle cx="19" cy="12" r="1" />
        <circle cx="5" cy="12" r="1" />
      </svg>
      <span className="sr-only">More</span>
    </span>
  )
}
