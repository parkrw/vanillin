import { cn } from "../../lib/cn.js"

/**
 * variant: default | border | separator
 * as: render a different element (e.g. as="a" for links)
 */
export function Marker({ variant = "default", as: Comp = "div", className, ...props }) {
  return (
    <Comp
      className={cn(
        "marker",
        variant !== "default" && `marker--${variant}`,
        className
      )}
      {...props}
    />
  )
}

export function MarkerIcon({ className, ...props }) {
  return (
    <span
      aria-hidden="true"
      className={cn("marker-icon", className)}
      {...props}
    />
  )
}

export function MarkerContent({ className, ...props }) {
  return (
    <span
      className={cn("marker-content", className)}
      {...props}
    />
  )
}
