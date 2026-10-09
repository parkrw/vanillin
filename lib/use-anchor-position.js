import { useLayoutEffect, useRef } from "react"
import { positionAnchored } from "./anchor-position.js"

function scaleTranslate(transform) {
  if (!transform || transform === "none") return { a: 1, d: 1, e: 0, f: 0 }
  const { a, b, c, d, e, f } = new DOMMatrixReadOnly(transform)
  return b === 0 && c === 0 && a > 0 && d > 0 ? { a, d, e, f } : null
}

/**
 * The anchor's box once the open popover it sits in finishes its entry.
 * Overlays scale in from 0.96 (@starting-style) and getBoundingClientRect
 * reads through that, so a submenu opened during its parent's entry anchored
 * to a shrunken trigger, and kept the offset once the parent settled: a
 * transform fires none of the observers below. Only a running transform
 * transition is mapped to its end; a transform the host rests at is where the
 * anchor is drawn, so it stands. Handles scale + translate, the only
 * transforms the entry transitions use.
 */
function restingRect(anchor) {
  const rect = anchor.getBoundingClientRect()
  const host = anchor.closest(":popover-open")
  if (!host) return rect
  const entry = host
    .getAnimations()
    .find((anim) => anim.transitionProperty === "transform" && anim.playState === "running")
  if (!entry) return rect
  const frames = entry.effect.getKeyframes()
  const style = getComputedStyle(host)
  const now = scaleTranslate(style.transform)
  const rest = scaleTranslate(frames[frames.length - 1].transform)
  if (!now || !rest) return rect
  const [ox, oy] = style.transformOrigin.split(" ").map(parseFloat)
  // The host's rect is its laid-out box mapped through the transform about
  // its origin: solve for the laid-out top-left, map it through the resting
  // transform, and rescale the anchor's offset within the host.
  const box = host.getBoundingClientRect()
  const left = box.left - now.e - ox * (1 - now.a)
  const top = box.top - now.f - oy * (1 - now.d)
  const sx = rest.a / now.a
  const sy = rest.d / now.d
  return new DOMRect(
    left + rest.e + ox * (1 - rest.a) + (rect.left - box.left) * sx,
    top + rest.f + oy * (1 - rest.d) + (rect.top - box.top) * sy,
    rect.width * sx,
    rect.height * sy
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
      anchor instanceof Element ? { getBoundingClientRect: () => restingRect(anchor) } : anchor
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
