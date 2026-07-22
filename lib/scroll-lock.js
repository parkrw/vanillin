import { useEffect } from "react"

let lockCount = 0
let saved = null

/** Lock body scroll, compensating for scrollbar width to avoid layout shift. */
export function lockScroll() {
  if (++lockCount > 1) return
  const body = document.body
  const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
  saved = { overflow: body.style.overflow, paddingRight: body.style.paddingRight }
  body.style.overflow = "hidden"
  if (scrollbarWidth > 0) body.style.paddingRight = `${scrollbarWidth}px`
}

export function unlockScroll() {
  if (lockCount === 0 || --lockCount > 0) return
  document.body.style.overflow = saved.overflow
  document.body.style.paddingRight = saved.paddingRight
  saved = null
}

/** Lock body scroll while `enabled`. Re-entrant across stacked overlays. */
export function useScrollLock(enabled) {
  useEffect(() => {
    if (!enabled) return
    lockScroll()
    return unlockScroll
  }, [enabled])
}
