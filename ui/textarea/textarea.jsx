import { cn } from "../../lib/cn.js"

export function Textarea({ className, ...props }) {
  return (
    <textarea
      className={cn("textarea", className)}
      {...props}
    />
  )
}
