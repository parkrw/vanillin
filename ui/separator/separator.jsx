import { cn } from "../../lib/cn.js"

/**
 * orientation: horizontal | vertical
 * decorative: when true, uses role="none" instead of "separator"
 */
export function Separator({ orientation = "horizontal", decorative = false, className, ...props }) {
  return (
    <div
      role={decorative ? "none" : "separator"}
      aria-orientation={decorative ? undefined : orientation}
      className={cn(
        "separator",
        orientation === "vertical" && "separator--vertical",
        className
      )}
      {...props}
    />
  )
}
