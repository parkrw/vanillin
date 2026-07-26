import { useEffect, useRef } from "react"

/** Samples older than this (ms) are pruned from the velocity window. */
const VELOCITY_WINDOW = 100

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
 *   `velocity` (px/ms) is computed over a ~100ms trailing window of pointer
 *   samples, not the whole gesture, so a slow drag ending in a flick reports
 *   the flick velocity.
 */
export function useSwipe(ref, { enabled = true, axis = "y", shouldStart, onMove, onEnd } = {}) {
  const handlers = useRef({ shouldStart, onMove, onEnd })
  handlers.current = { shouldStart, onMove, onEnd }

  useEffect(() => {
    const node = ref.current
    if (!enabled || !node) return

    let tracking = false
    let startPos = 0
    let delta = 0
    let samples = []

    const read = (event) => (axis === "y" ? event.clientY : event.clientX)

    /** Prune samples outside the trailing window, keeping at least one. */
    function pruneOlderThan(cutoff) {
      while (samples.length > 1 && samples[0].time < cutoff) {
        samples.shift()
      }
    }

    function onPointerDown(event) {
      if (event.button !== 0 && event.pointerType === "mouse") return
      if (handlers.current.shouldStart && !handlers.current.shouldStart(event)) return
      tracking = true
      startPos = read(event)
      delta = 0
      samples = [{ time: event.timeStamp, position: read(event) }]
      node.setPointerCapture(event.pointerId)
    }

    function onPointerMove(event) {
      if (!tracking) return
      delta = read(event) - startPos
      const now = event.timeStamp
      samples.push({ time: now, position: read(event) })
      pruneOlderThan(now - VELOCITY_WINDOW)
      handlers.current.onMove?.(delta, event)
    }

    function onPointerUp(event) {
      if (!tracking) return
      tracking = false

      // Record the final position and prune the window
      const now = event.timeStamp
      samples.push({ time: now, position: read(event) })
      pruneOlderThan(now - VELOCITY_WINDOW)

      // Windowed velocity: first-to-last sample in the remaining window.
      // Guards: single sample → 0, zero duration → 0, held still → 0.
      let velocity = 0
      if (samples.length >= 2) {
        const first = samples[0]
        const last = samples[samples.length - 1]
        const dt = last.time - first.time
        if (dt > 0) {
          velocity = (last.position - first.position) / dt
        }
      }

      samples = []
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
