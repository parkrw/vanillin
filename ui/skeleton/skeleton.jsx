import { cn } from "../../lib/cn.js"

export function Skeleton({ className, ...props }) {
  return (
    <div
      className={cn("skeleton", className)}
      {...props}
    />
  )
}
