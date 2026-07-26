import { useRef, useCallback } from "react"
import { cn } from "../../lib/cn.js"
import { useControllableState } from "../../lib/use-controllable-state.js"

/**
 * TimePicker — segmented hour / minute / (second) / (meridiem) input.
 *
 * Props:
 *   value / defaultValue  — controlled / uncontrolled { hour, minute, second }
 *                           (24h internal, always)
 *   onChange              — ({ hour, minute, second }) => void
 *   locale                — BCP 47 tag; derives 12h/24h default
 *   hour12                — override locale's hour cycle
 *   showSeconds           — show seconds segment (default false)
 *   step                  — minutes step (default 1)
 *   min / max             — { hour, minute } clamp bounds (24h)
 *   disabled              — disables all segments
 *   className             — extra class on the wrapper
 */
export function TimePicker({
  value,
  defaultValue,
  onChange,
  locale = "en-US",
  hour12: hour12Prop,
  showSeconds = false,
  step = 1,
  min,
  max,
  disabled,
  className,
  ...rest
}) {
  const is12h = hour12Prop ?? getLocaleHour12(locale)

  const [time, setTime] = useControllableState({
    value,
    defaultValue: defaultValue ?? { hour: 0, minute: 0, second: 0 },
    onChange,
  })

  const hourRef = useRef(null)
  const minuteRef = useRef(null)
  const secondRef = useRef(null)
  const meridiemRef = useRef(null)

  const refs = [hourRef, minuteRef]
  if (showSeconds) refs.push(secondRef)
  if (is12h) refs.push(meridiemRef)

  const focusNext = useCallback((currentRef) => {
    const idx = refs.indexOf(currentRef)
    if (idx < refs.length - 1) refs[idx + 1].current?.focus()
  }, [refs])

  const focusPrev = useCallback((currentRef) => {
    const idx = refs.indexOf(currentRef)
    if (idx > 0) refs[idx - 1].current?.focus()
  }, [refs])

  function clampTime(t) {
    let { hour, minute, second } = t
    if (min) {
      if (hour < min.hour || (hour === min.hour && minute < (min.minute ?? 0))) {
        hour = min.hour
        minute = min.minute ?? 0
      }
    }
    if (max) {
      if (hour > max.hour || (hour === max.hour && minute > (max.minute ?? 59))) {
        hour = max.hour
        minute = max.minute ?? 59
      }
    }
    return { hour, minute, second }
  }

  function update(patch) {
    setTime((prev) => clampTime({ ...prev, ...patch }))
  }

  // Display values
  const displayHour = is12h ? (time.hour % 12 || 12) : time.hour
  const meridiem = time.hour >= 12 ? "PM" : "AM"
  const hourMax = is12h ? 12 : 23
  const hourMin = is12h ? 1 : 0

  function handleSegmentKeyDown(e, segment, ref) {
    const { key } = e
    if (key === "ArrowUp" || key === "ArrowDown") {
      e.preventDefault()
      const dir = key === "ArrowUp" ? 1 : -1

      if (segment === "hour") {
        let h = time.hour + dir
        if (h < 0) h = 23
        if (h > 23) h = 0
        update({ hour: h })
      } else if (segment === "minute") {
        let m = time.minute + dir * step
        let h = time.hour
        if (m < 0) { m = 60 + m; h = (h - 1 + 24) % 24 }
        if (m >= 60) { m = m - 60; h = (h + 1) % 24 }
        update({ hour: h, minute: m })
      } else if (segment === "second") {
        let s = time.second + dir
        let m = time.minute
        let h = time.hour
        if (s < 0) { s = 59; m--; if (m < 0) { m = 59; h = (h - 1 + 24) % 24 } }
        if (s > 59) { s = 0; m++; if (m > 59) { m = 0; h = (h + 1) % 24 } }
        update({ hour: h, minute: m, second: s })
      } else if (segment === "meridiem") {
        update({ hour: (time.hour + 12) % 24 })
      }
    } else if (key === "ArrowRight") {
      e.preventDefault()
      focusNext(ref)
    } else if (key === "ArrowLeft") {
      e.preventDefault()
      focusPrev(ref)
    } else if (key === "Tab") {
      // let default tab happen
    }
  }

  /** Numeric segments: type digits to set value, auto-advance when full */
  function handleSegmentInput(e, segment, ref) {
    const raw = e.target.value.replace(/\D/g, "")
    if (!raw) return

    let n = parseInt(raw, 10)

    if (segment === "hour") {
      if (is12h) {
        if (n > 12) n = 12
        if (n < 1) n = 1
        // Convert display hour back to 24h
        const isPM = time.hour >= 12
        let h24 = n === 12 ? 0 : n
        if (isPM) h24 += 12
        update({ hour: h24 })
      } else {
        if (n > 23) n = 23
        update({ hour: n })
      }
      if (raw.length >= 2) focusNext(ref)
    } else if (segment === "minute") {
      if (n > 59) n = 59
      update({ minute: n })
      if (raw.length >= 2) focusNext(ref)
    } else if (segment === "second") {
      if (n > 59) n = 59
      update({ second: n })
      if (raw.length >= 2) focusNext(ref)
    }

    // Reset displayed value after handling
    e.target.value = ""
  }

  function handleMeridiemInput(e) {
    const c = e.target.value.toUpperCase()
    e.target.value = ""
    if (c === "A" && time.hour >= 12) update({ hour: time.hour - 12 })
    else if (c === "P" && time.hour < 12) update({ hour: time.hour + 12 })
  }

  const pad = (n) => String(n).padStart(2, "0")

  return (
    <div
      className={cn("time-picker", className)}
      role="group"
      aria-label="Time"
      data-disabled={disabled ? "" : undefined}
      {...rest}
    >
      <Segment
        ref={hourRef}
        label="Hour"
        value={pad(displayHour)}
        onKeyDown={(e) => handleSegmentKeyDown(e, "hour", hourRef)}
        onInput={(e) => handleSegmentInput(e, "hour", hourRef)}
        disabled={disabled}
        data-segment="hour"
      />
      <span className="time-picker-separator" aria-hidden="true">:</span>
      <Segment
        ref={minuteRef}
        label="Minute"
        value={pad(time.minute)}
        onKeyDown={(e) => handleSegmentKeyDown(e, "minute", minuteRef)}
        onInput={(e) => handleSegmentInput(e, "minute", minuteRef)}
        disabled={disabled}
        data-segment="minute"
      />
      {showSeconds && (
        <>
          <span className="time-picker-separator" aria-hidden="true">:</span>
          <Segment
            ref={secondRef}
            label="Second"
            value={pad(time.second)}
            onKeyDown={(e) => handleSegmentKeyDown(e, "second", secondRef)}
            onInput={(e) => handleSegmentInput(e, "second", secondRef)}
            disabled={disabled}
            data-segment="second"
          />
        </>
      )}
      {is12h && (
        <Segment
          ref={meridiemRef}
          label="AM/PM"
          value={meridiem}
          onKeyDown={(e) => handleSegmentKeyDown(e, "meridiem", meridiemRef)}
          onInput={handleMeridiemInput}
          disabled={disabled}
          data-segment="meridiem"
          className="time-picker-meridiem"
        />
      )}
    </div>
  )
}

/** A single time segment — thin wrapper around an input. */
import { forwardRef } from "react"

const Segment = forwardRef(function Segment(
  { label, value, onKeyDown, onInput, disabled, className, ...rest },
  ref
) {
  return (
    <input
      ref={ref}
      type="text"
      inputMode="numeric"
      className={cn("time-picker-segment", className)}
      value={value}
      onChange={() => {}} // controlled — actual logic is in onInput
      onKeyDown={onKeyDown}
      onInput={onInput}
      disabled={disabled}
      aria-label={label}
      autoComplete="off"
      {...rest}
    />
  )
})

/** Cache for locale hour12 detection */
const hour12Cache = new Map()
function getLocaleHour12(locale) {
  if (hour12Cache.has(locale)) return hour12Cache.get(locale)
  const opts = new Intl.DateTimeFormat(locale, { hour: "numeric" }).resolvedOptions()
  const is12 = opts.hour12 ?? false
  hour12Cache.set(locale, is12)
  return is12
}
