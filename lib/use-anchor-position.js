import { useLayoutEffect, useRef } from "react"
import { positionAnchored } from "./anchor-position.js"

/**
 * Keep a floating element positioned against its anchor while `open`.
 * Repositions on scroll (any ancestor), resize, and anchor/floating size
 * changes, throttled to animation frames.
 *
 * @param {boolean} open
 * @param {React.RefObject} anchorRef
 * @param {React.RefObject} floatingRef
 * @param {object} [options] - see positionAnchored
 */
export function useAnchorPosition(open, anchorRef, floatingRef, options = {}) {
  const optionsRef = useRef(options)
  optionsRef.current = options

  useLayoutEffect(() => {
    const anchor = anchorRef.current
    const floating = floatingRef.current
    if (!open || !anchor || !floating) return

    let frame = 0
    const update = () => positionAnchored(anchor, floating, optionsRef.current)
    const schedule = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(update)
    }

    update()

    const resizeObserver = new ResizeObserver(schedule)
    resizeObserver.observe(anchor)
    resizeObserver.observe(floating)
    window.addEventListener("resize", schedule)
    // capture-phase scroll catches every scrollable ancestor
    document.addEventListener("scroll", schedule, true)

    return () => {
      cancelAnimationFrame(frame)
      resizeObserver.disconnect()
      window.removeEventListener("resize", schedule)
      document.removeEventListener("scroll", schedule, true)
    }
  }, [open, anchorRef, floatingRef])
}
