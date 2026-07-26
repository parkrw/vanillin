import { forwardRef } from "react"
import { cn } from "../../lib/cn.js"

/**
 * Density — sets `data-density` on a wrapper element to scope spacing.
 *
 * Three named modes: "compact" (0.875), "comfortable" (1), "spacious" (1.25).
 * The attribute cascades `--density-scale` to all descendants that use the
 * `--space-*` ramp.
 *
 * For a custom scale, skip this component and set `--density-scale` directly.
 */
const Density = forwardRef(function Density(
  { mode = "comfortable", as: Tag = "div", className, children, ...props },
  ref
) {
  return (
    <Tag
      ref={ref}
      data-density={mode}
      className={cn("density", className)}
      {...props}
    >
      {children}
    </Tag>
  )
})

Density.displayName = "Density"

export { Density }
