import { cn } from "../../lib/cn.js"

/**
 * align: start | end — sender vs receiver row
 */
export function Message({ align = "start", className, ...props }) {
  return (
    <div
      data-align={align}
      className={cn("message", align === "end" && "message--end", className)}
      {...props}
    />
  )
}

export function MessageGroup({ className, ...props }) {
  return <div className={cn("message-group", className)} {...props} />
}

/** Anchored to the row bottom; shifts up past a MessageFooter when present. */
export function MessageAvatar({ className, ...props }) {
  return <div className={cn("message-avatar", className)} {...props} />
}

export function MessageContent({ className, ...props }) {
  return <div className={cn("message-content", className)} {...props} />
}

export function MessageHeader({ className, ...props }) {
  return <div className={cn("message-header", className)} {...props} />
}

export function MessageFooter({ className, ...props }) {
  return <div className={cn("message-footer", className)} {...props} />
}
