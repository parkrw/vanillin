import { cn } from "../../lib/cn.js"

export function Textarea({ className, autoResize, ...props }) {
  return (
    <textarea
      className={cn("textarea", autoResize && "textarea--auto-resize", className)}
      {...props}
    />
  )
}
