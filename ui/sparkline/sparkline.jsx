import { cn } from "../../lib/cn.js"
import { areaPath, extent, linePath, linearScale, pointScale } from "../../lib/chart-math.js"

/**
 * Sparkline — an inline trend line for the figure beside it.
 *
 *   <Sparkline points={[12, 18, 9, 24, 20, 35, 27, 31]} />
 *
 * Draws the series as a stroke in `currentColor`, a wash of the same colour
 * under it (`area`) and a dot on the latest point (`dot`). The y domain runs
 * `min` → `max`, defaulting to 0 → the data's maximum, so a series of
 * percentages wants `max={100}` to keep its scale steady as it moves.
 *
 * Always `aria-hidden`: the number it illustrates is the accessible content,
 * so the svg has no name to give. `inset` keeps the stroke and the dot inside
 * the box — the dot's radius is the inset, so a dot on the first, last, top
 * or bottom point still paints whole. One point draws only the dot, centred;
 * no points draw an empty box of the same size.
 */
export function Sparkline({
  points = [],
  width = 72,
  height = 24,
  inset = 2,
  min = 0,
  max,
  area = true,
  dot = true,
  className,
  ...props
}) {
  const count = points.length
  const x = pointScale(count, [inset, width - inset])
  const y = linearScale([min, max ?? extent([points])[1]], [height - inset, inset])
  const upper = points.map((v, i) => [x.center(i), y(v)])
  const last = upper[count - 1]

  return (
    <svg
      className={cn("sparkline", className)}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden="true"
      {...props}
    >
      {area && count > 1 && (
        <path
          className="sparkline-area"
          d={areaPath(upper, [[upper[0][0], height], [last[0], height]])}
        />
      )}
      {count > 1 && <path className="sparkline-line" d={linePath(upper)} />}
      {dot && count > 0 && <circle className="sparkline-dot" cx={last[0]} cy={last[1]} r={inset} />}
    </svg>
  )
}
