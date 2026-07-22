import { cn } from "../../lib/cn.js"

/**
 * orientation: horizontal | vertical
 */
export function ButtonGroup({ orientation = "horizontal", className, ...props }) {
  return (
    <div
      role="group"
      className={cn(
        "btn-group",
        orientation === "vertical" && "btn-group--vertical",
        className
      )}
      {...props}
    />
  )
}

/**
 * orientation: horizontal | vertical
 * Defaults to vertical (a vertical line in a horizontal group).
 */
export function ButtonGroupSeparator({ orientation = "vertical", className, ...props }) {
  return (
    <div
      role="separator"
      aria-orientation={orientation}
      className={cn(
        "btn-group-separator",
        orientation === "horizontal" && "btn-group-separator--horizontal",
        className
      )}
      {...props}
    />
  )
}

export function ButtonGroupText({ as: Comp = "span", className, ...props }) {
  return (
    <Comp
      className={cn("btn-group-text", className)}
      {...props}
    />
  )
}
