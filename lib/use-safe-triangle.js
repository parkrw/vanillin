import { useCallback, useEffect, useRef } from "react"

/**
 * Check whether a point (px, py) lies inside a triangle defined by
 * three vertices using the sign-of-cross-product method.
 */
function pointInTriangle(px, py, x1, y1, x2, y2, x3, y3) {
  const d1 = (px - x2) * (y1 - y2) - (x1 - x2) * (py - y2)
  const d2 = (px - x3) * (y2 - y3) - (x2 - x3) * (py - y3)
  const d3 = (px - x1) * (y3 - y1) - (x3 - x1) * (py - y1)
  const hasNeg = d1 < 0 || d2 < 0 || d3 < 0
  const hasPos = d1 > 0 || d2 > 0 || d3 > 0
  return !(hasNeg && hasPos)
}

/**
 * Safe-triangle grace area for submenu hover.
 *
 * When the pointer leaves a SubTrigger toward the SubContent, the hook
 * records the leave point and computes a triangle from that point to the
 * near-edge top and bottom corners of the SubContent rect. Each pointermove
 * inside the triangle calls `onInsideMove` so the caller can defer a pending
 * close; leaving the triangle calls `onClose`; reaching the SubContent
 * resolves the triangle and calls `onResolve`. `onResolve` must cancel any
 * pending close: `onInsideMove` can re-arm one after the content's own
 * pointerenter has fired (hit-testing flips a fraction before the rect
 * check does, so the enter-cancel can precede the last inside-triangle move).
 *
 * @param {object} options
 * @param {boolean} options.enabled - whether the submenu is open
 * @param {React.RefObject} options.triggerRef - the SubTrigger element
 * @param {React.RefObject} options.contentRef - the SubContent element
 * @param {() => void} options.onClose - called when the pointer leaves the safe area
 * @param {() => void} [options.onInsideMove] - called per move inside the triangle (defer close)
 * @param {() => void} [options.onResolve] - called when the pointer reaches the content (cancel close)
 * @param {string} [options.side="right"] - which side the subcontent opens on
 */
export function useSafeTriangle({
  enabled,
  triggerRef,
  contentRef,
  onClose,
  onInsideMove,
  onResolve,
  side = "right",
}) {
  const triangleRef = useRef(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose
  const onInsideMoveRef = useRef(onInsideMove)
  onInsideMoveRef.current = onInsideMove
  const onResolveRef = useRef(onResolve)
  onResolveRef.current = onResolve

  const handleTriggerLeave = useCallback(
    (event) => {
      if (!enabled) return
      const content = contentRef.current
      if (!content) return

      const rect = content.getBoundingClientRect()
      const leaveX = event.clientX
      const leaveY = event.clientY

      // Near-edge corners depend on which side the content is on.
      let nearTop, nearBottom
      if (side === "left") {
        // Content is to the left — near edge is the right side of content
        nearTop = { x: rect.right, y: rect.top }
        nearBottom = { x: rect.right, y: rect.bottom }
      } else {
        // Content is to the right (default) — near edge is the left side
        nearTop = { x: rect.left, y: rect.top }
        nearBottom = { x: rect.left, y: rect.bottom }
      }

      triangleRef.current = { leaveX, leaveY, nearTop, nearBottom }
    },
    [enabled, contentRef, side]
  )

  useEffect(() => {
    if (!enabled) {
      triangleRef.current = null
      return
    }
    const trigger = triggerRef.current
    if (!trigger) return

    trigger.addEventListener("pointerleave", handleTriggerLeave)
    return () => trigger.removeEventListener("pointerleave", handleTriggerLeave)
  }, [enabled, triggerRef, handleTriggerLeave])

  // Track document-level pointermove while the triangle is active.
  useEffect(() => {
    if (!enabled) return

    const handleMove = (event) => {
      const tri = triangleRef.current
      if (!tri) return

      const content = contentRef.current
      if (!content) return

      // Pointer reached the content: resolve and cancel any pending close.
      const contentRect = content.getBoundingClientRect()
      if (
        event.clientX >= contentRect.left &&
        event.clientX <= contentRect.right &&
        event.clientY >= contentRect.top &&
        event.clientY <= contentRect.bottom
      ) {
        triangleRef.current = null
        onResolveRef.current?.()
        return
      }

      const inside = pointInTriangle(
        event.clientX,
        event.clientY,
        tri.leaveX,
        tri.leaveY,
        tri.nearTop.x,
        tri.nearTop.y,
        tri.nearBottom.x,
        tri.nearBottom.y
      )

      if (inside) {
        onInsideMoveRef.current?.()
      } else {
        triangleRef.current = null
        onCloseRef.current()
      }
    }

    document.addEventListener("pointermove", handleMove)
    return () => document.removeEventListener("pointermove", handleMove)
  }, [enabled, contentRef])
}
