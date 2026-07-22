import { cn } from "../../lib/cn.js"

export function Empty({ className, ...props }) {
  return (
    <div
      className={cn("empty", className)}
      {...props}
    />
  )
}

export function EmptyHeader({ className, ...props }) {
  return (
    <div
      className={cn("empty-header", className)}
      {...props}
    />
  )
}

/**
 * variant: default | icon
 */
export function EmptyMedia({ variant = "default", className, ...props }) {
  return (
    <div
      className={cn(
        "empty-media",
        variant !== "default" && `empty-media--${variant}`,
        className
      )}
      {...props}
    />
  )
}

export function EmptyTitle({ className, ...props }) {
  return (
    <h3
      className={cn("empty-title", className)}
      {...props}
    />
  )
}

export function EmptyDescription({ className, ...props }) {
  return (
    <p
      className={cn("empty-description", className)}
      {...props}
    />
  )
}

export function EmptyContent({ className, ...props }) {
  return (
    <div
      className={cn("empty-content", className)}
      {...props}
    />
  )
}
