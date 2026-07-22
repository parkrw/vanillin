import { cn } from "../../lib/cn.js"

export function InputGroup({ className, ...props }) {
  return (
    <div
      className={cn("input-group", className)}
      {...props}
    />
  )
}

export function InputGroupInput({ className, ...props }) {
  return (
    <input
      className={cn("input-group-input", className)}
      {...props}
    />
  )
}

export function InputGroupTextarea({ className, ...props }) {
  return (
    <textarea
      className={cn("input-group-textarea", className)}
      {...props}
    />
  )
}

/**
 * align: inline-start | inline-end | block-start | block-end
 */
export function InputGroupAddon({ align = "inline-start", className, ...props }) {
  return (
    <div
      className={cn(
        "input-group-addon",
        align !== "inline-start" && `input-group-addon--${align}`,
        className
      )}
      {...props}
    />
  )
}

/**
 * size: xs | icon-xs | sm | icon-sm
 * variant: default | destructive | outline | secondary | ghost | link
 */
export function InputGroupButton({ size = "xs", variant = "ghost", className, ...props }) {
  return (
    <button
      className={cn(
        "input-group-btn",
        variant !== "ghost" && `input-group-btn--${variant}`,
        size !== "xs" && `input-group-btn--${size}`,
        className
      )}
      {...props}
    />
  )
}

export function InputGroupText({ className, ...props }) {
  return (
    <span
      className={cn("input-group-text", className)}
      {...props}
    />
  )
}
