import { cn } from "../../lib/cn.js"

/**
 * Determinate when `value` is a number, indeterminate when null/undefined.
 */
export function Progress({ value, max = 100, className, ...props }) {
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
      className={cn("progress", className)}
      {...props}
    >
      <div
        className="progress-indicator"
        data-state={state}
        style={{ transform: `translateX(-${100 - percent}%)` }}
      />
    </div>
  )
}
