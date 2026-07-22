import { cn } from "../../lib/cn.js"

/**
 * variant: default | secondary | destructive | outline
 */
export function Badge({ variant = "default", className, ...props }) {
  return (
    <span
      className={cn(
        "badge",
        variant !== "default" && `badge--${variant}`,
        className
      )}
      {...props}
    />
  )
}
