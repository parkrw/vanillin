import { cn } from "../../lib/cn.js"

export function Kbd({ className, ...props }) {
  return (
    <kbd
      className={cn("kbd", className)}
      {...props}
    />
  )
}

export function KbdGroup({ className, ...props }) {
  return (
    <span
      className={cn("kbd-group", className)}
      {...props}
    />
  )
}
