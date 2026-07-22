import { useEffect, useRef } from "react"

const stack = []

/**
 * Dismiss a floating layer on outside pointerdown or Escape.
 * Layers stack: only the topmost layer responds, so nested overlays
 * dismiss innermost-first.
 *
 * @param {React.RefObject} ref - the layer element
 * @param {object} options
 * @param {boolean} [options.enabled]
 * @param {(event: Event) => void} options.onDismiss
 * @param {React.RefObject[]} [options.exclude] - elements (e.g. the trigger)
 *   whose clicks should not dismiss
 */
export function useDismissableLayer(ref, { enabled = true, onDismiss, exclude = [] } = {}) {
  const onDismissRef = useRef(onDismiss)
  onDismissRef.current = onDismiss
  const excludeRef = useRef(exclude)
  excludeRef.current = exclude

  useEffect(() => {
    if (!enabled) return
    const entry = {}
    stack.push(entry)
    const isTop = () => stack[stack.length - 1] === entry

    function onPointerDown(event) {
      if (!isTop()) return
      const target = event.target
      if (ref.current?.contains(target)) return
      for (const ex of excludeRef.current) {
        if (ex?.current?.contains(target)) return
      }
      onDismissRef.current?.(event)
    }

    function onKeyDown(event) {
      if (event.key !== "Escape" || !isTop()) return
      onDismissRef.current?.(event)
    }

    document.addEventListener("pointerdown", onPointerDown, true)
    document.addEventListener("keydown", onKeyDown, true)
    return () => {
      stack.splice(stack.indexOf(entry), 1)
      document.removeEventListener("pointerdown", onPointerDown, true)
      document.removeEventListener("keydown", onKeyDown, true)
    }
  }, [enabled, ref])
}
