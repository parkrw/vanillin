import { cn } from "../../lib/cn.js"

export function Label({ className, ...props }) {
  return (
    <label
      className={cn("label", className)}
      {...props}
    />
  )
}
