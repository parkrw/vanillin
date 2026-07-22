import { cn } from "../../lib/cn.js"

/**
 * variant: default | outline | muted
 * size: default | sm | xs
 * as: render a different element (e.g. as="a" for links)
 */
export function Item({ variant = "default", size = "default", as: Comp = "div", className, ...props }) {
  return (
    <Comp
      className={cn(
        "item",
        variant !== "default" && `item--${variant}`,
        size !== "default" && `item--${size}`,
        className
      )}
      {...props}
    />
  )
}

/**
 * variant: default | icon | image
 */
export function ItemMedia({ variant = "default", className, ...props }) {
  return (
    <div
      className={cn(
        "item-media",
        variant !== "default" && `item-media--${variant}`,
        className
      )}
      {...props}
    />
  )
}

export function ItemContent({ className, ...props }) {
  return (
    <div
      className={cn("item-content", className)}
      {...props}
    />
  )
}

export function ItemTitle({ as: Comp = "div", className, ...props }) {
  return (
    <Comp
      className={cn("item-title", className)}
      {...props}
    />
  )
}

export function ItemDescription({ className, ...props }) {
  return (
    <div
      className={cn("item-description", className)}
      {...props}
    />
  )
}

export function ItemActions({ className, ...props }) {
  return (
    <div
      className={cn("item-actions", className)}
      {...props}
    />
  )
}

export function ItemGroup({ className, ...props }) {
  return (
    <div
      className={cn("item-group", className)}
      {...props}
    />
  )
}

export function ItemSeparator({ className, ...props }) {
  return (
    <div
      role="separator"
      className={cn("item-separator", className)}
      {...props}
    />
  )
}

export function ItemHeader({ className, ...props }) {
  return (
    <div
      className={cn("item-header", className)}
      {...props}
    />
  )
}

export function ItemFooter({ className, ...props }) {
  return (
    <div
      className={cn("item-footer", className)}
      {...props}
    />
  )
}
