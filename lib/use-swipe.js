import { useEffect, useRef } from "react"

/**
 * Pointer-based swipe/drag tracking for Drawer and Toast.
 *
 * @param {React.RefObject} ref - element that receives the gesture
 * @param {object} options
 * @param {boolean} [options.enabled]
 * @param {"x"|"y"} [options.axis]
 * @param {(event: PointerEvent) => boolean} [options.shouldStart] - veto a
 *   gesture (e.g. drawer content not scrolled to its boundary)
 * @param {(delta: number, event: PointerEvent) => void} [options.onMove]
 * @param {(result: { delta: number, velocity: number }, event: PointerEvent) => void} [options.onEnd]
 */
export function useSwipe(ref, { enabled = true, axis = "y", shouldStart, onMove, onEnd } = {}) {
  const handlers = useRef({ shouldStart, onMove, onEnd })
  handlers.current = { shouldStart, onMove, onEnd }

  useEffect(() => {
    const node = ref.current
    if (!enabled || !node) return

    let tracking = false
    let startPos = 0
    let startTime = 0
    let delta = 0

    const read = (event) => (axis === "y" ? event.clientY : event.clientX)

    function onPointerDown(event) {
      if (event.button !== 0 && event.pointerType === "mouse") return
      if (handlers.current.shouldStart && !handlers.current.shouldStart(event)) return
      tracking = true
      startPos = read(event)
      startTime = event.timeStamp
      delta = 0
      node.setPointerCapture(event.pointerId)
    }

    function onPointerMove(event) {
      if (!tracking) return
      delta = read(event) - startPos
      handlers.current.onMove?.(delta, event)
    }

    function onPointerUp(event) {
      if (!tracking) return
      tracking = false
      const elapsed = Math.max(1, event.timeStamp - startTime)
      const velocity = delta / elapsed // px per ms
      handlers.current.onEnd?.({ delta, velocity }, event)
    }

    node.addEventListener("pointerdown", onPointerDown)
    node.addEventListener("pointermove", onPointerMove)
    node.addEventListener("pointerup", onPointerUp)
    node.addEventListener("pointercancel", onPointerUp)
    return () => {
      node.removeEventListener("pointerdown", onPointerDown)
      node.removeEventListener("pointermove", onPointerMove)
      node.removeEventListener("pointerup", onPointerUp)
      node.removeEventListener("pointercancel", onPointerUp)
    }
  }, [enabled, axis, ref])
}
