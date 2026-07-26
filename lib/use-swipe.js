import { useRef } from "react"

/** Samples older than this (ms) are pruned from the velocity window. */
const VELOCITY_WINDOW = 100

/** Default movement (px) before pointer capture is taken. */
const CAPTURE_THRESHOLD = 10

/**
 * Pointer-based swipe/drag tracking with conditional capture.
 *
 * Returns React pointer-event handlers to spread onto the target element.
 * Pointer capture is deferred: the hook only captures once movement along
 * the configured axis exceeds `captureThreshold`, so native scrolling on
 * the cross-axis is never hijacked.  If the dominant movement resolves to
 * the cross-axis, the gesture is abandoned entirely.
 *
 * @param {object} options
 * @param {boolean} [options.enabled=true]
 * @param {"x"|"y"} [options.axis="y"]
 * @param {number} [options.captureThreshold] - px before capture (default 10)
 * @param {(event: PointerEvent) => boolean} [options.shouldStart] - veto a
 *   gesture before tracking begins
 * @param {(delta: number, event: PointerEvent) => void} [options.onMove]
 * @param {(result: { delta: number, velocity: number }, event: PointerEvent) => void} [options.onEnd]
 *   `velocity` (px/ms) is computed over a ~100ms trailing window of pointer
 *   samples, not the whole gesture, so a slow drag ending in a flick reports
 *   the flick velocity.
 * @param {(event: PointerEvent) => void} [options.onCancel] - gesture
 *   abandoned by the browser (pointer lost, element removed, etc.)
 * @returns {{ onPointerDown, onPointerMove, onPointerUp, onPointerCancel }}
 */
export function useSwipe({
  enabled = true,
  axis = "y",
  captureThreshold = CAPTURE_THRESHOLD,
  shouldStart,
  onMove,
  onEnd,
  onCancel,
} = {}) {
  const optionsRef = useRef()
  optionsRef.current = { enabled, axis, captureThreshold, shouldStart, onMove, onEnd, onCancel }

  const stateRef = useRef({
    phase: "idle", // idle | pending | tracking
    startX: 0,
    startY: 0,
    startPos: 0,
    delta: 0,
    samples: [],
    pointerId: null,
  })

  // Stable handler references — created once, read options/state from refs.
  const handlersRef = useRef(null)
  if (!handlersRef.current) {
    const read = (event, ax) => (ax === "y" ? event.clientY : event.clientX)

    /** Prune samples outside the trailing window, keeping at least one. */
    function pruneOlderThan(samples, cutoff) {
      while (samples.length > 1 && samples[0].time < cutoff) {
        samples.shift()
      }
    }

    handlersRef.current = {
      onPointerDown(event) {
        const opts = optionsRef.current
        if (!opts.enabled) return
        if (event.button !== 0 && event.pointerType === "mouse") return
        if (opts.shouldStart && !opts.shouldStart(event)) return

        const s = stateRef.current
        s.phase = "pending"
        s.startX = event.clientX
        s.startY = event.clientY
        s.startPos = read(event, opts.axis)
        s.delta = 0
        s.samples = [{ time: event.timeStamp, position: read(event, opts.axis) }]
        s.pointerId = event.pointerId
      },

      onPointerMove(event) {
        const s = stateRef.current
        if (s.phase === "idle") return
        if (event.pointerId !== s.pointerId) return

        const opts = optionsRef.current
        const pos = read(event, opts.axis)
        const now = event.timeStamp

        if (s.phase === "pending") {
          const primaryDist = Math.abs(pos - s.startPos)
          const crossAx = opts.axis === "y" ? "x" : "y"
          const crossPos = read(event, crossAx)
          const crossStart = opts.axis === "y" ? s.startX : s.startY
          const crossDist = Math.abs(crossPos - crossStart)

          if (Math.max(primaryDist, crossDist) < opts.captureThreshold) {
            // Not enough movement — keep pending, collect samples for velocity.
            s.samples.push({ time: now, position: pos })
            pruneOlderThan(s.samples, now - VELOCITY_WINDOW)
            return
          }

          if (crossDist > primaryDist) {
            // Cross-axis wins — bail; let the browser handle scrolling.
            s.phase = "idle"
            s.samples = []
            return
          }

          // Primary axis wins — capture and start tracking.
          s.phase = "tracking"
          event.currentTarget.setPointerCapture(event.pointerId)
        }

        // Tracking phase.
        s.delta = pos - s.startPos
        s.samples.push({ time: now, position: pos })
        pruneOlderThan(s.samples, now - VELOCITY_WINDOW)
        opts.onMove?.(s.delta, event)
      },

      onPointerUp(event) {
        const s = stateRef.current
        if (event.pointerId !== s.pointerId) return

        if (s.phase === "tracking") {
          const opts = optionsRef.current
          const pos = read(event, opts.axis)
          const now = event.timeStamp
          s.samples.push({ time: now, position: pos })
          pruneOlderThan(s.samples, now - VELOCITY_WINDOW)

          // Windowed velocity (px/ms): first-to-last sample in the remaining
          // window.  Guards: single sample -> 0, sub-frame dt -> 0
          // (unreliable), zero duration -> 0, held still -> 0.
          let velocity = 0
          if (s.samples.length >= 2) {
            const first = s.samples[0]
            const last = s.samples[s.samples.length - 1]
            const dt = last.time - first.time
            if (dt >= 16) {
              velocity = (last.position - first.position) / dt
            }
          }

          const delta = s.delta
          s.phase = "idle"
          s.samples = []
          opts.onEnd?.({ delta, velocity }, event)
        } else {
          s.phase = "idle"
          s.samples = []
        }
      },

      onPointerCancel(event) {
        const s = stateRef.current
        if (event.pointerId !== s.pointerId) return
        const wasTracking = s.phase === "tracking"
        s.phase = "idle"
        s.samples = []
        if (wasTracking) {
          optionsRef.current.onCancel?.(event)
        }
      },
    }
  }

  return handlersRef.current
}
