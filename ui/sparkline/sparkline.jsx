import { useId } from "react"
import { cn } from "../../lib/cn.js"
import { areaPath, extent, linePath, linearScale, pointScale, splitRuns } from "../../lib/chart-math.js"

// The chart's default series palette, so a series gets the same colour at either size.
const PALETTE_SIZE = 5
const paletteColor = (i) => `var(--chart-${(i % PALETTE_SIZE) + 1})`

const isNum = (v) => typeof v === "number" && Number.isFinite(v)

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

/*
 * Ascending thresholds read higher-is-worse, descending lower-is-worse (free
 * space, a success rate). A value on a threshold is in the worse band.
 */
function zoneOf(v, [warn, critical]) {
  const past = warn <= critical ? (t) => v >= t : (t) => v <= t
  return past(critical) ? "critical" : past(warn) ? "warn" : "ok"
}

/*
 * One band per zone, top down, with hard stops at each threshold's height.
 * userSpaceOnUse: a bounding-box gradient on a flat line has zero height and
 * paints nothing. A flat domain puts every value on one row, so the whole
 * line is in one zone.
 */
function MeterGradient({ id, y, height, thresholds }) {
  const [warn, critical] = thresholds
  const [d0, d1] = y.domain
  const topDown = warn <= critical ? ["critical", "warn", "ok"] : ["ok", "warn", "critical"]
  let edges
  if (d0 === d1) {
    const k = topDown.indexOf(zoneOf(d0, thresholds))
    edges = [k < 1 ? 1 : 0, k < 2 ? 1 : 0]
  } else {
    edges = [Math.max(warn, critical), Math.min(warn, critical)].map((t) => Math.min(1, Math.max(0, y(t) / height)))
  }
  const bands = topDown.map((zone, i) => [zone, i ? edges[i - 1] : 0, i < 2 ? edges[i] : 1])
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
 * `min` → `max`, each defaulting to the data's end folded with 0, so a
 * positive series rises from a zero baseline and a negative one hangs from
 * it; a series of percentages wants `max={100}` to keep its scale steady as
 * it moves. A value past either end pegs to that edge, as a gauge does.
 *
 * A sample that is not a finite number is a gap: the line and wash break
 * there, and the dot marks the latest reading. A reading with a gap on both
 * sides draws nothing.
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
 * `thresholds={[warn, critical]}` colours it like a meter: green, then amber
 * from `warn`, then red from `critical`. Ascending reads higher-is-worse,
 * descending lower-is-worse, so `[40, 20]` turns amber at 40 and red at 20.
 * Each stretch of line and wash takes the band it sits in, and the dot the
 * band of the latest reading, in place of `color`/`theme`; `dotColor` and
 * `areaColor` still win. The bands read `--sparkline-ok`, `--sparkline-warn`
 * and `--sparkline-critical`.
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
  min,
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
  const [dataMin, dataMax] = extent(lines.map((l) => l.points), true)
  const y = linearScale([min ?? dataMin, max ?? dataMax], [height - inset, inset])
  const lo = Math.min(...y.domain)
  const hi = Math.max(...y.domain)
  const peg = (v) => Math.min(hi, Math.max(lo, v))
  // The wash fills to the zero line; with zero at or past an end, to that box edge.
  const floor = lo >= 0 ? height : hi <= 0 ? 0 : y(0)

  return (
    <svg
      className={cn("sparkline", className)}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{
        ...colourStyle(shared),
        ...(thresholds && { "--sparkline-meter": `url(#${meterId})` }),
        ...style,
      }}
      {...props}
      aria-hidden="true"
    >
      {thresholds && count > 0 && <MeterGradient id={meterId} y={y} height={height} thresholds={thresholds} />}
      {lines.map((line, i) => {
        const latest = line.points.findLastIndex(isNum)
        if (latest < 0) return null
        const upper = line.points.map((v, j) => (isNum(v) ? [x.center(j), y(peg(v))] : null))
        const spans = splitRuns(upper).filter((run) => run.length > 1)
        const [cx, cy] = upper[latest]
        return (
          <g
            key={i}
            className="sparkline-series"
            data-zone={thresholds && zoneOf(line.points[latest], thresholds)}
            style={line.style}
          >
            {area && spans.length > 0 && (
              <path
                className="sparkline-area"
                d={spans.map((run) => areaPath(run, [[run[0][0], floor], [run[run.length - 1][0], floor]])).join(" ")}
              />
            )}
            {spans.length > 0 && <path className="sparkline-line" d={spans.map((run) => linePath(run)).join(" ")} />}
            {dot && <circle className="sparkline-dot" cx={cx} cy={cy} r={inset} />}
          </g>
        )
      })}
    </svg>
  )
}
