import { cn } from "../../lib/cn.js"

export function AspectRatio({ ratio = 1, className, style, ...props }) {
  return (
    <div
      className={cn("aspect-ratio", className)}
      style={{ aspectRatio: ratio, ...style }}
      {...props}
    />
  )
}
