import { cn } from "../../lib/cn.js"

export function Input({ className, ...props }) {
  return (
    <input
      className={cn("input", className)}
      {...props}
    />
  )
}
