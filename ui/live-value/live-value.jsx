import { useEffect, useRef, useState } from "react"
import { cn } from "../../lib/cn.js"
import { useTicker } from "../../lib/use-ticker.js"

/**
 * LiveValue — a number that changes on a schedule and shows which way it went.
 *
 * Two ways to drive it:
 *
 *   <LiveValue interval={2000} sample={(tick) => readCpu(tick)} />   // self-sampling
 *   <LiveValue value={cpu} />                                         // controlled
 *
 * `sample(tick)` runs on every beat of a timer shared by every LiveValue with
 * the same `interval` (see `lib/use-ticker.js`), so a dashboard of gauges
 * ticks in phase instead of flickering. Tick 0 is the first render, so a
 * sampler keyed on the tick paints deterministically before the timer fires.
 *
 * On each change the text flashes: `data-trend="up"` when the new number is
 * higher, `"down"` when lower, `"changed"` for non-numeric text. The colours are
 * `--live-value-up` (default `--warning`) and `--live-value-down` (default
 * `--info`); override them on any ancestor. The flash clears itself when the
 * tick animation ends, so its length follows `--motion-medium`. Under
 * `prefers-reduced-motion` there is no animation and the trend colour holds
 * until the next change.
 *
 * Renders a `<span>` by default; `as` swaps the element.
 */
export function LiveValue({
  value,
  sample,
  interval = 2000,
  format,
  as: Comp = "span",
  className,
  ...props
}) {
  const tick = useTicker(sample ? interval : null)
  const current = sample ? sample(tick) : value
  const text = format ? format(current) : String(current)

  const prev = useRef({ current, text })
  const [flash, setFlash] = useState({ trend: null, n: 0 })

  useEffect(() => {
    const before = prev.current
    prev.current = { current, text }
    if (before.text === text) return
    const trend = direction(before.current, current)
    // `n` keys the text node so a same-direction change remounts it and the
    // tick animation restarts instead of being swallowed mid-flight.
    setFlash((f) => ({ trend, n: f.n + 1 }))
  }, [current, text])

  return (
    <Comp
      className={cn("live-value", className)}
      data-trend={flash.trend ?? undefined}
      {...props}
    >
      <span
        key={flash.n}
        className="live-value-text"
        onAnimationEnd={() => setFlash((f) => ({ ...f, trend: null }))}
      >
        {text}
      </span>
    </Comp>
  )
}

function direction(before, after) {
  if (typeof before === "number" && typeof after === "number") {
    if (after > before) return "up"
    if (after < before) return "down"
  }
  return "changed"
}
