import { cn } from "../../lib/cn.js"

const REGIONS = ["low", "middle", "high"]

function regionOf(n, low, high) {
  return n < low ? 0 : n > high ? 2 : 1
}

/**
 * A level inside a known range: disk used, quota spent, battery left. Not task
 * progress — use `Progress` for work that is advancing toward done.
 *
 * `low`, `high` and `optimum` follow HTML's `<meter>`: the range splits into
 * below `low`, between, and above `high`, and `optimum` names the region that
 * is good. A reading in the optimum's region is `success`, one region away is
 * `warning`, two away is `error`. Give none of them and the bar stays primary.
 * An explicit `tone` wins over the derived one.
 *
 * Styled div rather than native `<meter>`: the native element's fill is only
 * reachable through `::-webkit-meter-*` and `::-moz-meter-bar`, its tone
 * colours are the browser's own greens and ambers, and none of them clear 3:1
 * against the track or follow the status tokens.
 *
 * The default `aria-valuetext` is a percentage; pass `aria-valuetext` (e.g.
 * "41 of 50 GB") to replace it.
 */
export function Meter({ value, min = 0, max = 100, low, high, optimum, tone, className, ...props }) {
  const span = max - min
  const now = Math.min(Math.max(Number.isFinite(value) ? value : min, min), max)
  const percent = span > 0 ? ((now - min) / span) * 100 : 0

  let resolved = tone
  if (!resolved && (low != null || high != null || optimum != null)) {
    const lo = low ?? min
    const hi = high ?? max
    const target = optimum ?? min + span / 2
    const distance = Math.abs(regionOf(now, lo, hi) - regionOf(target, lo, hi))
    resolved = ["success", "warning", "error"][distance]
  }

  return (
    <div
      role="meter"
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={now}
      aria-valuetext={`${Math.round(percent)}%`}
      data-value={now}
      data-region={low != null || high != null ? REGIONS[regionOf(now, low ?? min, high ?? max)] : undefined}
      className={cn("meter", resolved && `meter--${resolved}`, className)}
      {...props}
    >
      <div className="meter-indicator" style={{ width: `${percent}%` }} />
    </div>
  )
}
