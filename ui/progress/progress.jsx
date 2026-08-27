import { cn } from "../../lib/cn.js"

/**
 * Determinate when `value` is a number, indeterminate when null/undefined.
 *
 * `glow` breathes a halo in the bar's own colour on a fixed 2s loop, for the
 * one bar on a page that means "live". Reduced motion leaves it static.
 *
 * The indeterminate sweep lives in the stylesheet, so no inline transform is
 * written in that state — an inline one outranks the keyframes and parks the
 * indicator off the track.
 */
export function Progress({ value, max = 100, glow = false, className, ...props }) {
  const isDeterminate = typeof value === "number"
  const percent = isDeterminate ? (value / max) * 100 : 0
  const state = !isDeterminate ? "indeterminate" : value >= max ? "complete" : "loading"
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={isDeterminate ? value : undefined}
      aria-valuetext={isDeterminate ? `${Math.round(percent)}%` : undefined}
      data-state={state}
      data-value={isDeterminate ? value : undefined}
      data-max={max}
      className={cn("progress", glow && "progress--glow", className)}
      {...props}
    >
      <div
        className="progress-indicator"
        data-state={state}
        style={isDeterminate ? { transform: `translateX(-${100 - percent}%)` } : undefined}
      />
    </div>
  )
}
