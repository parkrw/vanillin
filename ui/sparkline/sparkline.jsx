import { useId } from "react"
import { cn } from "../../lib/cn.js"
import { areaPath, extent, linePath, linearScale, pointScale } from "../../lib/chart-math.js"

// The chart's default series palette, so a series gets the same colour at either size.
const PALETTE_SIZE = 5
const paletteColor = (i) => `var(--chart-${(i % PALETTE_SIZE) + 1})`

/* `theme` mirrors a chart config item: one value, or a light-dark() pair. */
function themed(color, theme) {
  const light = theme?.light ?? color
  const dark = theme?.dark ?? color
  if (theme && light && dark && light !== dark) return `light-dark(${light}, ${dark})`
  return light ?? dark
}

/*
 * Only the props that were passed become declarations, so an ancestor's
 * `color` or `--sparkline-*` still reaches the parts this element leaves unset.
 */
function colourStyle({ color, theme, dotColor, areaColor, areaOpacity }) {
  const style = {}
  const line = themed(color, theme)
  if (line) style.color = line
  if (dotColor) style["--sparkline-dot"] = dotColor
  if (areaColor) style["--sparkline-area"] = areaColor
  if (areaOpacity != null) style["--sparkline-area-opacity"] = areaOpacity
  return style
}

const zoneOf = (v, [warn, critical]) => (v >= critical ? "critical" : v >= warn ? "warn" : "ok")

/*
 * One band per zone, with hard stops at each threshold's height, top down.
 * userSpaceOnUse: a bounding-box gradient on a flat line has zero height and
 * paints nothing. On a flat domain every value sits on one row, so a
 * threshold is wholly above it or wholly below.
 */
function MeterGradient({ id, y, height, thresholds: [warn, critical] }) {
  const [d0, d1] = y.domain
  const at = (t) => (d0 === d1 ? (t > d0 ? 0 : 1) : Math.min(1, Math.max(0, y(t) / height)))
  const bands = [
    ["critical", 0, at(critical)],
    ["warn", at(critical), at(warn)],
    ["ok", at(warn), 1],
  ]
  return (
    <defs>
      <linearGradient id={id} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2={height}>
        {bands.flatMap(([zone, from, to]) => [
          <stop key={`${zone}-from`} className="sparkline-stop" data-zone={zone} offset={from} />,
          <stop key={`${zone}-to`} className="sparkline-stop" data-zone={zone} offset={to} />,
        ])}
      </linearGradient>
    </defs>
  )
}

/**
 * Sparkline — an inline trend line for the figure beside it.
 *
 *   <Sparkline points={[12, 18, 9, 24, 20, 35, 27, 31]} />
 *   <Sparkline points={cpu} color="var(--chart-2)" dotColor="var(--chart-1)" />
 *   <Sparkline series={[{ points: inbound }, { points: outbound }]} />
 *
 * Draws the series as a stroke in `currentColor`, a wash of the same colour
 * under it (`area`) and a dot on the latest point (`dot`). The y domain runs
 * `min` → `max`, defaulting to 0 → the data's maximum, so a series of
 * percentages wants `max={100}` to keep its scale steady as it moves.
 *
 * Colour: `color` (or a `theme` light/dark pair) sets the stroke, and with it
 * the wash and dot; `dotColor`, `areaColor` and `areaOpacity` override those
 * parts. Each is optional, and the matching CSS (`color`, `--sparkline-dot`,
 * `--sparkline-area`, `--sparkline-area-opacity`) set on an ancestor works too.
 *
 * `series` draws several lines on one shared x and y scale, index for index,
 * first at the back. An item takes `points` and the same colour props; an
 * item without `color` or `theme` takes the chart palette (`--chart-1…5`) by
 * position. Given `series`, `points`, `color` and `theme` are ignored.
 *
 * `thresholds={[warn, critical]}` colours it like a meter: green below
 * `warn`, amber from it, red from `critical`. Each stretch of line and wash
 * takes the band it sits in, and the dot the band of the latest point, in
 * place of `color`/`theme`; `dotColor` and `areaColor` still win. The bands
 * read `--sparkline-ok`, `--sparkline-warn` and `--sparkline-critical`.
 *
 * Always `aria-hidden`: the number it illustrates is the accessible content,
 * so the svg has no name to give. `inset` keeps the stroke and the dot inside
 * the box — the dot's radius is the inset, so a dot on the first, last, top
 * or bottom point still paints whole. One point draws only the dot, centred;
 * no points draw an empty box of the same size.
 */
export function Sparkline({
  points = [],
  series,
  width = 72,
  height = 24,
  inset = 2,
  min = 0,
  max,
  area = true,
  dot = true,
  color,
  theme,
  dotColor,
  areaColor,
  areaOpacity,
  thresholds,
  className,
  style,
  ...props
}) {
  const meterId = `sparkline-meter-${useId().replace(/[^\w-]/g, "")}`
  const lines = series
    ? series.map((item, i) => ({
        points: item.points ?? [],
        style: colourStyle({ ...item, color: item.color ?? (item.theme ? undefined : paletteColor(i)) }),
      }))
    : [{ points }]
  const shared = series ? { dotColor, areaColor, areaOpacity } : { color, theme, dotColor, areaColor, areaOpacity }

  const count = Math.max(0, ...lines.map((l) => l.points.length))
  const x = pointScale(count, [inset, width - inset])
  const y = linearScale([min, max ?? extent(lines.map((l) => l.points))[1]], [height - inset, inset])

  return (
    <svg
      className={cn("sparkline", className)}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden="true"
      style={{
        ...colourStyle(shared),
        ...(thresholds && { "--sparkline-meter": `url(#${meterId})` }),
        ...style,
      }}
      {...props}
    >
      {thresholds && count > 0 && <MeterGradient id={meterId} y={y} height={height} thresholds={thresholds} />}
      {lines.map((line, i) => {
        const n = line.points.length
        if (!n) return null
        const upper = line.points.map((v, j) => [x.center(j), y(v)])
        const last = upper[n - 1]
        return (
          <g
            key={i}
            className="sparkline-series"
            data-zone={thresholds && zoneOf(line.points[n - 1], thresholds)}
            style={line.style}
          >
            {area && n > 1 && (
              <path
                className="sparkline-area"
                d={areaPath(upper, [[upper[0][0], height], [last[0], height]])}
              />
            )}
            {n > 1 && <path className="sparkline-line" d={linePath(upper)} />}
            {dot && <circle className="sparkline-dot" cx={last[0]} cy={last[1]} r={inset} />}
          </g>
        )
      })}
    </svg>
  )
}
