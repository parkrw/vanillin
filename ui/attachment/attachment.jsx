import { cn } from "../../lib/cn.js"
import { Button } from "../button/button.jsx"

/**
 * state: idle | uploading | processing | error | done
 * size: default | sm | xs
 * orientation: horizontal | vertical
 */
export function Attachment({
  state = "idle",
  size = "default",
  orientation = "horizontal",
  className,
  ...props
}) {
  return (
    <div
      data-state={state}
      className={cn(
        "attachment",
        size !== "default" && `attachment--${size}`,
        orientation === "vertical" && "attachment--vertical",
        className
      )}
      {...props}
    />
  )
}

/**
 * variant: icon | image
 */
export function AttachmentMedia({ variant = "icon", className, ...props }) {
  return (
    <div
      className={cn(
        "attachment-media",
        variant === "image" && "attachment-media--image",
        className
      )}
      {...props}
    />
  )
}

export function AttachmentContent({ className, ...props }) {
  return <div className={cn("attachment-content", className)} {...props} />
}

export function AttachmentTitle({ className, ...props }) {
  return <div className={cn("attachment-title", className)} {...props} />
}

export function AttachmentDescription({ className, ...props }) {
  return <div className={cn("attachment-description", className)} {...props} />
}

export function AttachmentActions({ className, ...props }) {
  return <div className={cn("attachment-actions", className)} {...props} />
}

export function AttachmentAction({ className, ...props }) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn("attachment-action", className)}
      {...props}
    />
  )
}

/**
 * as: render a different element (e.g. as="a") — inset overlay
 * that makes the whole card clickable; actions stay above it.
 */
export function AttachmentTrigger({ as: Comp = "button", className, ...props }) {
  return <Comp className={cn("attachment-trigger", className)} {...props} />
}

/*
 * Mask lives on the static outer div, scrolling on the inner viewport:
 * mask-image directly on a scrolling element makes Chrome composite the
 * whole pane as a white layer in dark mode.
 */
export function AttachmentGroup({ className, children, ...props }) {
  return (
    <div className={cn("attachment-group", className)} {...props}>
      <div className="attachment-group-viewport">{children}</div>
    </div>
  )
}
