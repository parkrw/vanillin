import { useCallback, useEffect, useRef, useState } from "react"
import { useControllableState } from "./use-controllable-state.js"
import { useDirection } from "./direction.jsx"

const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

/**
 * Pixel size of one element along one axis, set by dragging or by keyboard.
 *
 * `ui/resizable` splits a group by percentage; this is the single-element,
 * pixel-clamped case (a rail's width, a taskbar's height).
 *
 * Spread `handleProps` on the grab handle. It is a focusable `separator`:
 * arrows step by `step` in the direction they point on screen, Home and End
 * jump to `min` and `max`. Give the handle `touch-action: none`, or a touch
 * drag is taken as a pan and cancelled.
 *
 * @param {object} options
 * @param {"x"|"y"} [options.axis="x"]
 * @param {number} [options.size] - controlled size in px
 * @param {number} [options.defaultSize=min] - initial size in px
 * @param {(size: number) => void} [options.onSizeChange]
 * @param {number} [options.min=0]
 * @param {number} [options.max=Infinity]
 * @param {number} [options.step=10] - keyboard step in px
 * @param {boolean} [options.reverse=false] - the element grows against the
 *   pointer, as a bottom-anchored panel does when its handle is dragged up
 * @param {boolean} [options.disabled=false]
 * @returns {{ size: number, dragging: boolean, handleProps: object }}
 */
export function useDragResize({
  axis = "x",
  size: sizeProp,
  defaultSize,
  onSizeChange,
  min = 0,
  max = Infinity,
  step = 10,
  reverse = false,
  disabled = false,
} = {}) {
  const [size, setSize] = useControllableState({
    value: sizeProp,
    defaultValue: clamp(defaultSize ?? min, min, max),
    onChange: onSizeChange,
  })
  const [dragging, setDragging] = useState(false)
  const rtl = useDirection() === "rtl"

  // The x axis is the inline axis: under RTL a pointer moving left is growth
  // for an inline-start-anchored element.
  const sign = (reverse ? -1 : 1) * (axis === "x" && rtl ? -1 : 1)

  const latest = useRef()
  latest.current = { axis, min, max, sign, setSize }
  const endDragRef = useRef(null)

  const clearDrag = useCallback(() => {
    endDragRef.current?.()
  }, [])

  // A drag outliving its component would leave the cursor and the window
  // listeners behind.
  useEffect(() => clearDrag, [clearDrag])

  const onPointerDown = useCallback(
    (event) => {
      if (event.button !== 0 || disabled) return
      clearDrag()
      const { axis: ax } = latest.current
      const read = (e) => (ax === "y" ? e.clientY : e.clientX)
      const startPointer = read(event)
      const startSize = size
      const { pointerId } = event
      const target = event.currentTarget

      try {
        target.setPointerCapture(pointerId)
      } catch {
        // The window listeners carry the drag without capture.
      }

      const onMove = (e) => {
        if (e.pointerId !== pointerId) return
        const { min: lo, max: hi, sign: s, setSize: set } = latest.current
        set(clamp(startSize + s * (read(e) - startPointer), lo, hi))
      }
      const onEnd = (e) => {
        if (e.pointerId !== pointerId) return
        clearDrag()
      }

      window.addEventListener("pointermove", onMove)
      window.addEventListener("pointerup", onEnd)
      window.addEventListener("pointercancel", onEnd)
      document.body.style.cursor = ax === "y" ? "row-resize" : "col-resize"
      document.body.style.userSelect = "none"
      setDragging(true)

      endDragRef.current = () => {
        endDragRef.current = null
        window.removeEventListener("pointermove", onMove)
        window.removeEventListener("pointerup", onEnd)
        window.removeEventListener("pointercancel", onEnd)
        document.body.style.cursor = ""
        document.body.style.userSelect = ""
        if (target.hasPointerCapture?.(pointerId)) target.releasePointerCapture(pointerId)
        setDragging(false)
      }
    },
    [clearDrag, disabled, size]
  )

  const onKeyDown = useCallback(
    (event) => {
      if (disabled) return
      const { axis: ax, min: lo, max: hi, sign: s, setSize: set } = latest.current
      const forward = ax === "y" ? "ArrowDown" : "ArrowRight"
      const back = ax === "y" ? "ArrowUp" : "ArrowLeft"
      if (event.key === forward) set((cur) => clamp(cur + s * step, lo, hi))
      else if (event.key === back) set((cur) => clamp(cur - s * step, lo, hi))
      else if (event.key === "Home") set(lo)
      else if (event.key === "End" && Number.isFinite(hi)) set(hi)
      else return
      event.preventDefault()
    },
    [disabled, step]
  )

  return {
    size,
    dragging,
    handleProps: {
      role: "separator",
      tabIndex: disabled ? undefined : 0,
      // A separator's orientation is the opposite of the axis it moves along.
      "aria-orientation": axis === "y" ? "horizontal" : "vertical",
      "aria-valuenow": Math.round(size),
      "aria-valuemin": min,
      // Left off, a separator's maximum defaults to 100, below any wider size.
      "aria-valuemax": Number.isFinite(max) ? max : Number.MAX_SAFE_INTEGER,
      "aria-disabled": disabled || undefined,
      "data-dragging": dragging ? "" : undefined,
      onPointerDown,
      onKeyDown,
    },
  }
}
