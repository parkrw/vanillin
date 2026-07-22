import { cn } from "../../lib/cn.js"

/**
 * variant: default | secondary | muted | tinted | outline | ghost | destructive
 * align: start | end
 */
export function Bubble({ variant = "default", align = "start", className, ...props }) {
  return (
    <div
      data-align={align}
      className={cn(
        "bubble",
        variant !== "default" && `bubble--${variant}`,
        align === "end" && "bubble--end",
        className
      )}
      {...props}
    />
  )
}

/**
 * as: render a different element (e.g. as="a" for tappable bubbles)
 */
export function BubbleContent({ as: Comp = "div", className, ...props }) {
  return <Comp className={cn("bubble-content", className)} {...props} />
}

/**
 * side: top | bottom — anchor edge
 * align: start | end — horizontal position on that edge
 */
export function BubbleReactions({ side = "bottom", align = "end", className, ...props }) {
  return (
    <div
      className={cn(
        "bubble-reactions",
        side === "top" && "bubble-reactions--top",
        align === "start" && "bubble-reactions--start",
        className
      )}
      {...props}
    />
  )
}

export function BubbleGroup({ className, ...props }) {
  return <div className={cn("bubble-group", className)} {...props} />
}
