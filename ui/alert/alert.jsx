import { cn } from "../../lib/cn.js"

export function Alert({ variant = "default", className, ...props }) {
  return (
    <div
      role="alert"
      className={cn(
        "alert",
        variant !== "default" && `alert--${variant}`,
        className
      )}
      {...props}
    />
  )
}

export function AlertTitle({ className, ...props }) {
  return <div className={cn("alert-title", className)} {...props} />
}

export function AlertDescription({ className, ...props }) {
  return <div className={cn("alert-description", className)} {...props} />
}
