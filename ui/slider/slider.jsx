import { useRef } from "react"
import { cn } from "../../lib/cn.js"
import { useControllableState } from "../../lib/use-controllable-state.js"
import { useDirection } from "../../lib/direction.jsx"

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

/** Snap to the step grid and trim float noise (step 0.1 → one decimal). */
function snapToStep(value, min, max, step) {
  const snapped = min + Math.round((value - min) / step) * step
  const decimals = (String(step).split(".")[1] || "").length
  return clamp(Number(snapped.toFixed(decimals)), min, max)
}

/**
 * Controlled via `value` + `onValueChange`, uncontrolled via `defaultValue`;
 * both accept a number or an array (one thumb per entry). Thumbs move by
 * pointer drag and Arrow/PageUp/PageDown/Home/End keys (Shift = 10× step);
 * `onValueCommit` fires on pointer release and after each key change.
 */
export function Slider({
  value,
  defaultValue,
  onValueChange,
  onValueCommit,
  min = 0,
  max = 100,
  step = 1,
  disabled = false,
  orientation = "horizontal",
  className,
  ...props
}) {
  const dir = useDirection()
  const [values = [min], setValues] = useControllableState({
    value: value === undefined ? undefined : [].concat(value),
    defaultValue: defaultValue === undefined ? undefined : [].concat(defaultValue),
    onChange: onValueChange,
  })
  const rootRef = useRef(null)
  const thumbRefs = useRef([])
  const dragIndexRef = useRef(-1)
  const valuesRef = useRef(values)
  valuesRef.current = values

  const horizontal = orientation === "horizontal"
  const disabledAttrs = disabled ? { "data-disabled": "" } : {}

  /** Clamp between neighbour thumbs, update state, return the new array
   * synchronously so commit handlers don't read a stale render. */
  function setThumbValue(index, next) {
    const prev = valuesRef.current
    const lower = prev[index - 1] ?? min
    const upper = prev[index + 1] ?? max
    const resolved = clamp(next, lower, upper)
    if (resolved === prev[index]) return prev
    const updated = [...prev]
    updated[index] = resolved
    valuesRef.current = updated
    setValues(updated)
    return updated
  }

  function valueFromPointer(event) {
    const rect = rootRef.current.getBoundingClientRect()
    let ratio = horizontal
      ? (event.clientX - rect.left) / rect.width
      : 1 - (event.clientY - rect.top) / rect.height
    if (horizontal && dir === "rtl") ratio = 1 - ratio
    return snapToStep(min + ratio * (max - min), min, max, step)
  }

  function handlePointerDown(event) {
    if (disabled || event.button !== 0) return
    event.preventDefault()
    const next = valueFromPointer(event)
    const index = valuesRef.current.reduce(
      (closest, current, i) =>
        Math.abs(current - next) < Math.abs(valuesRef.current[closest] - next) ? i : closest,
      0,
    )
    dragIndexRef.current = index
    rootRef.current.setPointerCapture(event.pointerId)
    thumbRefs.current[index]?.focus()
    setThumbValue(index, next)
  }

  function handlePointerMove(event) {
    if (dragIndexRef.current < 0) return
    setThumbValue(dragIndexRef.current, valueFromPointer(event))
  }

  function handlePointerUp(event) {
    if (dragIndexRef.current < 0) return
    dragIndexRef.current = -1
    rootRef.current.releasePointerCapture(event.pointerId)
    onValueCommit?.(valuesRef.current)
  }

  function handleThumbKeyDown(event, index) {
    if (disabled) return
    const increment = horizontal && dir === "rtl" ? -1 : 1
    const stepsByKey = {
      ArrowRight: increment,
      ArrowUp: 1,
      ArrowLeft: -increment,
      ArrowDown: -1,
      PageUp: 10,
      PageDown: -10,
    }
    let next
    if (event.key === "Home") next = min
    else if (event.key === "End") next = max
    else if (event.key in stepsByKey) {
      const multiplier = event.shiftKey && !event.key.startsWith("Page") ? 10 : 1
      next = snapToStep(values[index] + stepsByKey[event.key] * multiplier * step, min, max, step)
    } else return
    event.preventDefault()
    const updated = setThumbValue(index, next)
    onValueCommit?.(updated)
  }

  const percents = values.map((current) => ((current - min) / (max - min)) * 100)
  const rangeStart = values.length > 1 ? Math.min(...percents) : 0
  const rangeEnd = 100 - Math.max(...percents)
  const rangeStyle = horizontal
    ? dir === "rtl"
      ? { right: `${rangeStart}%`, left: `${rangeEnd}%` }
      : { left: `${rangeStart}%`, right: `${rangeEnd}%` }
    : { bottom: `${rangeStart}%`, top: `${rangeEnd}%` }

  return (
    <span
      ref={rootRef}
      data-orientation={orientation}
      {...disabledAttrs}
      className={cn("slider", className)}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      {...props}
    >
      <span className="slider-track" data-orientation={orientation} {...disabledAttrs}>
        <span className="slider-range" data-orientation={orientation} {...disabledAttrs} style={rangeStyle} />
      </span>
      {values.map((current, index) => {
        // Keep the thumb inside the track: shift by half its size at 0%,
        // −half at 100% (Radix's in-bounds offset), on top of the -50% centering.
        const percent = horizontal && dir === "rtl" ? 100 - percents[index] : percents[index]
        const offset = `${0.5 - percent / 100} * var(--slider-thumb-size, 1rem)`
        return (
          <span
            key={index}
            ref={(node) => {
              thumbRefs.current[index] = node
            }}
            role="slider"
            aria-valuemin={min}
            aria-valuemax={max}
            aria-valuenow={current}
            aria-orientation={orientation}
            aria-disabled={disabled || undefined}
            tabIndex={disabled ? undefined : 0}
            data-orientation={orientation}
            {...disabledAttrs}
            className="slider-thumb"
            style={horizontal ? { left: `calc(${percent}% + ${offset})` } : { bottom: `calc(${percent}% + ${offset})` }}
            onKeyDown={(event) => handleThumbKeyDown(event, index)}
          />
        )
      })}
    </span>
  )
}
