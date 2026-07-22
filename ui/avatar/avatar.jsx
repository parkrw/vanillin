import { useState } from "react"
import { cn } from "../../lib/cn.js"

export function Avatar({ className, ...props }) {
  return <span className={cn("avatar", className)} {...props} />
}

export function AvatarImage({ className, src, alt, onError: onErrorProp, ...props }) {
  const [failed, setFailed] = useState(false)

  if (failed || !src) return null

  return (
    <img
      className={cn("avatar-image", className)}
      src={src}
      alt={alt}
      onError={(e) => {
        setFailed(true)
        onErrorProp?.(e)
      }}
      {...props}
    />
  )
}

export function AvatarFallback({ className, ...props }) {
  return <span className={cn("avatar-fallback", className)} {...props} />
}
