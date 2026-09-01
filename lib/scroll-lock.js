import { useEffect } from "react"

let lockCount = 0
let saved = null

/**
 * Lock body scroll, compensating for scrollbar width to avoid layout shift.
 *
 * `overflow: hidden` on <body> does not stop touch panning in iOS Safari, so
 * the page scrolls under every open overlay there. `position: fixed` is the
 * only lock every engine honours; it drops the document to scroll offset 0,
 * hence the saved offset and the negative `top` that hold the page in place.
 */
export function lockScroll() {
  if (++lockCount > 1) return
  const body = document.body
  const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
  const scrollY = window.scrollY
  saved = {
    scrollY,
    overflow: body.style.overflow,
    paddingRight: body.style.paddingRight,
    position: body.style.position,
    top: body.style.top,
    left: body.style.left,
    right: body.style.right,
  }
  body.style.overflow = "hidden"
  body.style.position = "fixed"
  body.style.top = `-${scrollY}px`
  // A fixed body with `width: auto` shrink-to-fits. Pinning both inset edges
  // keeps it viewport-wide *and* leaves paddingRight below shrinking the
  // content box, which is what makes the compensation work.
  body.style.left = "0"
  body.style.right = "0"
  // Physical `padding-right`, not `padding-inline-end`, on purpose: every
  // engine we support paints the classic scrollbar on the right edge in RTL
  // too, so the logical property would pad the wrong side of an RTL page.
  // Under `scrollbar-gutter: stable` the width is 0 and this no-ops.
  if (scrollbarWidth > 0) body.style.paddingRight = `${scrollbarWidth}px`
}

export function unlockScroll() {
  if (lockCount === 0 || --lockCount > 0) return
  const body = document.body
  const { scrollY, ...styles } = saved
  saved = null
  body.style.overflow = styles.overflow
  body.style.paddingRight = styles.paddingRight
  body.style.position = styles.position
  body.style.top = styles.top
  body.style.left = styles.left
  body.style.right = styles.right
  // Unfixing the body lands the document at 0, so the offset has to be put
  // back by hand. `instant` overrides a consumer's `scroll-behavior: smooth`,
  // which would otherwise animate the restore and read as a scroll jump.
  window.scrollTo({ top: scrollY, left: 0, behavior: "instant" })
}

/** Lock body scroll while `enabled`. Re-entrant across stacked overlays. */
export function useScrollLock(enabled) {
  useEffect(() => {
    if (!enabled) return
    lockScroll()
    return unlockScroll
  }, [enabled])
}
