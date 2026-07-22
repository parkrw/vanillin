import { cn } from "../../lib/cn.js"

/**
 * variant: default | destructive | outline | secondary | ghost | link
 * size: default | sm | lg | icon
 * as: render a different element/component (e.g. as="a" for links)
 */
export function Button({ variant = "default", size = "default", as: Comp = "button", className, ...props }) {
  return (
    <Comp
      className={cn(
        "btn",
        variant !== "default" && `btn--${variant}`,
        size !== "default" && `btn--${size}`,
        className
      )}
      {...props}
    />
  )
}
