import { useLayoutEffect, useRef } from "react"
import { positionAnchored } from "./anchor-position.js"

/**
 * The anchor's box as laid out, without the transform of the open popover it
 * sits in. Overlays scale in from 0.96 (@starting-style) and
 * getBoundingClientRect reads through that, so a submenu opened during its
 * parent's entry anchored to a shrunken trigger, and kept the offset once the
 * parent settled: a transform fires none of the observers below. Handles
 * scale + translate, the only transforms the entry transitions use.
 */
function laidOutRect(anchor) {
  const rect = anchor.getBoundingClientRect()
  const host = anchor.closest(":popover-open")
  if (!host) return rect
  const style = getComputedStyle(host)
  if (style.transform === "none") return rect
  const { a, b, c, d, e, f } = new DOMMatrixReadOnly(style.transform)
  if (b !== 0 || c !== 0 || a <= 0 || d <= 0) return rect
  const [ox, oy] = style.transformOrigin.split(" ").map(parseFloat)
  // The host's rect is its laid-out box mapped through the transform about
  // its origin; solve that for the laid-out top-left, then unscale the
  // anchor's offset within it.
  const box = host.getBoundingClientRect()
  const left = box.left - e - ox * (1 - a)
  const top = box.top - f - oy * (1 - d)
  return new DOMRect(
    left + (rect.left - box.left) / a,
    top + (rect.top - box.top) / d,
    rect.width / a,
    rect.height / d
  )
}

/**
 * Keep a floating element positioned against its anchor while `open`.
 * Repositions on scroll (any ancestor), resize, and anchor/floating size
 * changes, throttled to animation frames.
 *
 * The anchor may be an Element or a virtual anchor — any object with a
 * `getBoundingClientRect()` (e.g. a pointer-coord rect for context menus);
 * virtual anchors are not observed for size changes.
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

    const measured =
      anchor instanceof Element ? { getBoundingClientRect: () => laidOutRect(anchor) } : anchor
    let frame = 0
    const update = () => positionAnchored(measured, floating, optionsRef.current)
    const schedule = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(update)
    }

    update()

    const resizeObserver = new ResizeObserver(schedule)
    if (anchor instanceof Element) resizeObserver.observe(anchor)
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
