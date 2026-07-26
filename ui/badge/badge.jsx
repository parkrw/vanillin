import { cn } from "../../lib/cn.js"

/**
 * variant: default | secondary | destructive | outline
 *          | success | warning | info | destructive-soft
 *
 * Status variants (success, warning, info, destructive-soft) use the soft
 * treatment — tinted background, coloured foreground, tinted border — so
 * they stay readable when badges cluster in dense tables.
 *
 * The original `destructive` variant is the solid red badge, kept as-is.
 * `destructive-soft` matches the other status variants'
 * visual weight.
 *
 * Note: status-dot uses `error` for the same semantic state because that
 * is the console convention; badge keeps `destructive` for compatibility.
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
