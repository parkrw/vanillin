import { useId, useRef } from "react"
import { cn } from "../../lib/cn.js"
import { arcPath, linearScale, niceTicks, polarToCartesian } from "../../lib/chart-math.js"
import { useChart, useElementSize } from "../chart/chart.jsx"

/*
 * Two single-value roots on the Chart shell: BulletChart (a measure bar, a
 * target tick and range bands on a linear scale) and GaugeChart (a measure on
 * an arc, as a needle or a fill). Neither has a pointer or keyboard layer: the
 * value is printed beside the drawing, and under accessibilityLayer a
 * generated summary is wired to the svg with aria-describedby.
 *
 * Bands default to graded neutrals. A band's lightness orders the ranges, and
 * the order is also in the label and the summary, so no state rests on hue
 * alone; a consumer that wants status tones sets `color` on a band.
 */

const DEFAULT_MARGIN = { top: 5, right: 5, bottom: 5, left: 5 }
const TICK_GAP = 6
const BAND_SHADE = [30, 8]
const HUB = 0.06

const finite = (v) => (typeof v === "number" && Number.isFinite(v) ? v : null)
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v))
/* Below one, default grouping would round a reading like 0.0004 or 3e-7 to 0; three significant digits keeps a nonzero value nonzero. */
const plain = (v) => (typeof v === "number" ? v.toLocaleString(undefined, v !== 0 && Math.abs(v) < 1 ? { maximumSignificantDigits: 3 } : undefined) : String(v))
const decimals = (v) => {
  const [mantissa, exponent] = String(v).split("e")
  return Math.max(0, (mantissa.split(".")[1] ?? "").length - Number(exponent ?? 0))
}
/* A subtraction of two decimals carries binary noise; keep the inputs' own precision. */
const difference = (a, b) => {
  const rounded = Number((a - b).toFixed(Math.min(100, Math.max(decimals(a), decimals(b)))))
  return rounded === 0 && a !== b ? a - b : rounded
}
const round2 = (v) => Math.round(v * 100) / 100

function neutralShade(i, count) {
  const t = count > 1 ? i / (count - 1) : 0.5
  return `color-mix(in oklab, var(--foreground) ${round2(BAND_SHADE[0] + (BAND_SHADE[1] - BAND_SHADE[0]) * t)}%, var(--background))`
}

/* Ascending upper bounds, each band running from the one before (the first from min). */
function normalizeBands(bands, min, max) {
  const given = (bands ?? [])
    .map((band) => (typeof band === "number" ? { to: band } : band))
    .filter((band) => finite(band?.to) != null)
    .sort((a, b) => a.to - b.to)
  let from = min
  const out = []
  for (const band of given) {
    const to = clamp(band.to, min, max)
    if (to <= from) continue
    out.push({ ...band, from, to })
    from = to
  }
  return out.map((band, i) => ({ ...band, index: i, fill: band.color ?? neutralShade(i, out.length) }))
}

const bandOf = (bands, value) => (value == null ? null : (bands.find((band) => value <= band.to) ?? null))
const bandName = (band, format) => band.label ?? `${format(band.from)}–${format(band.to)}`
/* The dash in a default name is skipped by screen readers, so the summary spells the span out. */
const spokenName = (band, format) => band.label ?? `${format(band.from)} to ${format(band.to)}`

/* Rounded alike, a value and a target just apart would read "5 ... Target 5, 0.0004 short"; widen the default format until they differ. */
function distinguish(format, value, target) {
  if (format !== plain || format(value) !== format(target)) return format
  for (let digits = 4; digits <= 20; digits++) {
    const widened = (v) => v.toLocaleString(undefined, { maximumFractionDigits: digits })
    if (widened(value) !== widened(target)) return widened
  }
  return format
}

function summarize({ value, held, min, max, target, bands, format }) {
  const band = bandOf(bands, held)
  const reported = target != null && value != null && value < target ? distinguish(format, value, target) : format
  let text = `${value == null ? "No value" : reported(value)} on a scale from ${format(min)} to ${format(max)}`
  if (band) text += `, in the ${spokenName(band, format)} range`
  text += "."
  if (target != null) text += ` Target ${reported(target)}${value == null ? "" : `, ${value >= target ? "met" : `${format(difference(target, value))} short`}`}.`
  if (bands.length) text += ` Ranges: ${bands.map((b) => (b.label == null ? spokenName(b, format) : `${b.label} ${format(b.from)} to ${format(b.to)}`)).join("; ")}.`
  return text
}

function normalizeScale({ value, min, max }) {
  const lo = finite(min) ?? 0
  const hi = finite(max) ?? 100
  const [a, b] = lo <= hi ? [lo, hi] : [hi, lo]
  const v = finite(value)
  return { min: a, max: b, raw: v, value: v == null ? null : clamp(v, a, b) }
}

// ── Shell ───────────────────────────────────────────────────────────

function Single({
  variant,
  scale,
  target,
  bands,
  label,
  formatter = plain,
  accessibilityLayer = false,
  className,
  children,
  render,
  readoutFirst,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  "aria-describedby": ariaDescribedBy,
  ...props
}) {
  const chart = useChart()
  const plotRef = useRef(null)
  const summaryId = `chart-gauge-summary-${useId().replace(/[^\w-]/g, "")}`
  const { width, height } = useElementSize(plotRef, chart.initialDimension)

  const band = bandOf(bands, scale.value)
  const summary = summarize({ ...scale, value: scale.raw, held: scale.value, target, bands, format: formatter })
  const ownSummary = accessibilityLayer && ariaDescribedBy == null
  const labelled = ariaLabel != null || ariaLabelledBy != null
  const fallbackName = accessibilityLayer && !labelled ? (typeof label === "string" ? label : variant === "gauge" ? "Gauge" : "Bullet chart") : undefined
  const readout = (
    <div className="chart-gauge-readout">
      <span className="chart-gauge-value">{scale.raw == null ? "No value" : formatter(scale.raw)}</span>
      {band ? <span className="chart-gauge-band-label">{bandName(band, formatter)}</span> : null}
      {label ? <span className="chart-gauge-label">{label}</span> : null}
    </div>
  )
  return (
    <div className={cn("chart-layout chart-gauge", className)} data-layout={variant} {...props}>
      {readoutFirst ? readout : null}
      <div className="chart-plot" ref={plotRef}>
        <svg
          className="chart-surface"
          width={width}
          height={height}
          aria-label={ariaLabel ?? fallbackName}
          aria-labelledby={ariaLabelledBy}
          aria-describedby={ownSummary ? summaryId : ariaDescribedBy}
          role={accessibilityLayer || labelled ? "img" : undefined}
          aria-roledescription={accessibilityLayer ? "chart" : undefined}
        >
          {render({ width, height })}
          {children}
        </svg>
      </div>
      {readoutFirst ? null : readout}
      {ownSummary ? (
        <p id={summaryId} className="chart-gauge-summary" hidden>
          {summary}
        </p>
      ) : null}
    </div>
  )
}

// ── Bullet ──────────────────────────────────────────────────────────

export function BulletChart({
  value,
  min,
  max,
  target,
  bands,
  layout = "horizontal",
  axisSize,
  formatter = plain,
  margin,
  ...props
}) {
  const scale = normalizeScale({ value, min, max })
  const vertical = layout === "vertical"
  const tick = finite(axisSize) ?? (vertical ? 40 : 24)
  const m = { ...DEFAULT_MARGIN, ...margin }
  const given = finite(target)
  const goal = given != null ? clamp(given, scale.min, scale.max) : null
  const ranges = normalizeBands(bands, scale.min, scale.max)

  const render = ({ width, height }) => {
    const plot = vertical
      ? { x: m.left + tick, y: m.top, width: Math.max(0, width - m.left - m.right - tick), height: Math.max(0, height - m.top - m.bottom) }
      : { x: m.left, y: m.top, width: Math.max(0, width - m.left - m.right), height: Math.max(0, height - m.top - m.bottom - tick) }
    const along = linearScale([scale.min, scale.max], vertical ? [plot.y + plot.height, plot.y] : [plot.x, plot.x + plot.width])
    const span = vertical ? plot.width : plot.height
    const span0 = vertical ? plot.x : plot.y
    // The measure is a third of the band, the target two thirds, as Few draws it.
    const barSize = span / 3
    const markSize = (span * 2) / 3
    const rect = (a, b, offset, size) =>
      vertical
        ? { x: span0 + offset, y: Math.min(along(a), along(b)), width: size, height: Math.abs(along(a) - along(b)) }
        : { x: Math.min(along(a), along(b)), y: span0 + offset, width: Math.abs(along(a) - along(b)), height: size }
    const ticks = tick > 0 ? niceTicks(scale.min, scale.max, 5).filter((t) => t >= scale.min && t <= scale.max) : []
    return (
      <>
        <g className="chart-gauge-bands">
          {ranges.map((band) => (
            <rect
              key={band.index}
              className="chart-gauge-band"
              data-index={band.index}
              data-from={band.from}
              data-to={band.to}
              fill={band.fill}
              {...rect(band.from, band.to, 0, span)}
            />
          ))}
        </g>
        <g className="chart-gauge-boundaries">
          {ranges.slice(1).map((band) => (
            <line
              key={band.index}
              className="chart-gauge-boundary"
              data-at={band.from}
              {...(vertical
                ? { x1: span0, x2: span0 + span, y1: along(band.from), y2: along(band.from) }
                : { x1: along(band.from), x2: along(band.from), y1: span0, y2: span0 + span })}
            />
          ))}
        </g>
        {scale.value != null ? (
          <rect className="chart-gauge-measure" data-value={scale.value} {...rect(scale.min, scale.value, (span - barSize) / 2, barSize)} />
        ) : null}
        {goal != null ? (
          <rect
            className="chart-gauge-target"
            data-value={goal}
            {...(vertical
              ? { x: span0 + (span - markSize) / 2, y: along(goal) - 1.5, width: markSize, height: 3 }
              : { x: along(goal) - 1.5, y: span0 + (span - markSize) / 2, width: 3, height: markSize })}
          />
        ) : null}
        <g className="chart-axis chart-gauge-axis" data-axis={vertical ? "y" : "x"}>
          {ticks.map((t) =>
            vertical ? (
              <text key={t} className="chart-tick-text" x={plot.x - TICK_GAP} y={along(t)} textAnchor="end" dominantBaseline="middle">
                {formatter(t)}
              </text>
            ) : (
              <text key={t} className="chart-tick-text" x={along(t)} y={plot.y + plot.height + TICK_GAP} textAnchor="middle" dominantBaseline="hanging">
                {formatter(t)}
              </text>
            ),
          )}
        </g>
      </>
    )
  }
  return <Single {...props} variant="bullet" scale={scale} target={given} bands={ranges} formatter={formatter} render={render} readoutFirst />
}

// ── Gauge ───────────────────────────────────────────────────────────

/* The ring's extent for a unit outer radius, so any sweep fits the plot the same way. The inner edge counts because a short sweep's inner corners lie outside its outer chord; `pad` adds the needle hub, which hangs past the baseline. */
function arcBounds(start, end, inner, pad = 0) {
  const angles = [start, end]
  const [lo, hi] = start <= end ? [start, end] : [end, start]
  // A sweep of a full turn holds every axis crossing; a shorter one holds at most four, so the sweep's size never sets the loop's.
  if (hi - lo >= 360) angles.push(0, 90, 180, 270)
  else for (let a = Math.ceil(lo / 90) * 90, n = 0; a <= hi && n < 4; a += 90, n++) angles.push(a)
  const points = angles.flatMap((a) => [polarToCartesian(0, 0, 1, a), polarToCartesian(0, 0, inner, a)])
  if (pad) points.push([-pad, -pad], [pad, pad])
  const xs = points.map((p) => p[0])
  const ys = points.map((p) => p[1])
  return { minX: Math.min(...xs), maxX: Math.max(...xs), minY: Math.min(...ys), maxY: Math.max(...ys) }
}

export function GaugeChart({
  value,
  min,
  max,
  bands,
  target: _target,
  variant = "needle",
  startAngle = 180,
  endAngle = 0,
  thickness = 0.22,
  margin,
  ...props
}) {
  const scale = normalizeScale({ value, min, max })
  const m = { ...DEFAULT_MARGIN, ...margin }
  const start = finite(startAngle) ?? 180
  const end = finite(endAngle) ?? 0
  const ring = clamp(finite(thickness) ?? 0.22, 0.02, 1)
  const ranges = normalizeBands(bands, scale.min, scale.max)
  const angleOf = (v) => start + (end - start) * (scale.max === scale.min ? 0 : (v - scale.min) / (scale.max - scale.min))
  const active = bandOf(ranges, scale.value)

  const render = ({ width, height }) => {
    const room = { width: Math.max(0, width - m.left - m.right), height: Math.max(0, height - m.top - m.bottom) }
    const box = arcBounds(start, end, 1 - ring, variant === "fill" || scale.value == null ? 0 : HUB)
    const radius = Math.max(0, Math.min(room.width / (box.maxX - box.minX || 1), room.height / (box.maxY - box.minY || 1)))
    const cx = m.left + room.width / 2 - ((box.minX + box.maxX) / 2) * radius
    const cy = m.top + room.height / 2 - ((box.minY + box.maxY) / 2) * radius
    const inner = radius * (1 - ring)
    const hub = radius * HUB
    const tip = scale.value == null ? null : polarToCartesian(cx, cy, radius * (1 - ring / 2), angleOf(scale.value))
    const fillColor = (variant === "fill" && active?.color) || undefined
    return (
      <g className="chart-gauge-dial" data-cx={round2(cx)} data-cy={round2(cy)} data-radius={round2(radius)}>
        <path className="chart-gauge-track" d={arcPath(cx, cy, inner, radius, start, end)} />
        {(variant === "fill" ? [] : ranges).map((band) => (
          <path
            key={band.index}
            className="chart-gauge-band"
            data-index={band.index}
            data-from={band.from}
            data-to={band.to}
            data-start={round2(angleOf(band.from))}
            data-end={round2(angleOf(band.to))}
            fill={band.fill}
            d={arcPath(cx, cy, inner, radius, angleOf(band.from), angleOf(band.to))}
          />
        ))}
        {variant === "fill" ? null : (
          <g className="chart-gauge-boundaries">
            {ranges.slice(1).map((band) => {
              const [x1, y1] = polarToCartesian(cx, cy, inner, angleOf(band.from))
              const [x2, y2] = polarToCartesian(cx, cy, radius, angleOf(band.from))
              return <line key={band.index} className="chart-gauge-boundary" data-at={band.from} x1={x1} y1={y1} x2={x2} y2={y2} />
            })}
          </g>
        )}
        {variant === "fill" ? (
          <>
            {scale.value != null ? (
              <path
                className="chart-gauge-fill"
                data-value={scale.value}
                data-end={round2(angleOf(scale.value))}
                style={fillColor ? { fill: fillColor } : undefined}
                d={arcPath(cx, cy, inner, radius, start, angleOf(scale.value))}
              />
            ) : null}
            {ranges.slice(1).map((band) => {
              const [x1, y1] = polarToCartesian(cx, cy, inner, angleOf(band.from))
              const [x2, y2] = polarToCartesian(cx, cy, radius, angleOf(band.from))
              return <line key={band.index} className="chart-gauge-divider" x1={x1} y1={y1} x2={x2} y2={y2} />
            })}
          </>
        ) : scale.value == null ? null : (
          <>
            <line
              className="chart-gauge-needle"
              data-value={scale.value}
              data-angle={round2(angleOf(scale.value))}
              x1={cx}
              y1={cy}
              x2={tip[0]}
              y2={tip[1]}
            />
            <circle className="chart-gauge-hub" cx={cx} cy={cy} r={hub} />
          </>
        )}
      </g>
    )
  }
  return <Single {...props} variant="gauge" scale={scale} bands={ranges} render={render} data-variant={variant} />
}
