import { useEffect, useMemo, useRef } from "react"
import { cn } from "../../lib/cn.js"
import { bandScale, extent, linearScale, niceTicks, resolveDomain } from "../../lib/chart-math.js"
import { boxStats, finiteSorted } from "../../lib/chart-stats.js"
import {
  ActiveIndexContext,
  LayoutContext,
  PointerContext,
  collect,
  surfaceA11y,
  useActiveIndex,
  useChart,
  useElementSize,
} from "../chart/chart.jsx"

/*
 * One box per datum on the Chart shell: a datum carries raw samples under
 * `valuesKey`, or its own min, q1, median, q3, max (and outliers). The flat
 * category index is what the shared tooltip host, pointer and keyboard layer
 * from ui/chart address, so a box is one stop.
 */

const DEFAULT_MARGIN = { top: 5, right: 5, bottom: 5, left: 5 }
const TICK_GAP = 6
const OUTLIER_RADIUS = 3
const PARTS = { series: new Set(), unique: [], first: ["tooltip", "legend"] }

const finite = (v) => (typeof v === "number" && Number.isFinite(v) ? v : null)
const json = (value) => JSON.stringify(value ?? null)

function resolveBox(datum, valuesKey, whiskers, range) {
  const [q1, median, q3] = [datum?.q1, datum?.median, datum?.q3].map(finite)
  if (q1 != null && median != null && q3 != null) {
    const low = finite(datum.min) ?? q1
    const high = finite(datum.max) ?? q3
    return { n: null, q1, median, q3, low, high, outliers: finiteSorted(datum.outliers), precomputed: true }
  }
  const stats = boxStats(datum?.[valuesKey], { whiskers, range })
  return stats ? { ...stats, precomputed: false } : null
}

function boxModel({ data, categoryKey, valuesKey, whiskers, range, horizontal, domain, tickCount, categoryGap, margin, valueAxisSize, categoryAxisSize, width, height }) {
  const boxes = data.map((datum, index) => {
    const stats = resolveBox(datum, valuesKey, whiskers, range)
    return { index, label: datum?.[categoryKey] ?? index, datum, stats }
  })
  const extents = boxes.flatMap((box) => (box.stats ? [[box.stats.low, box.stats.high, ...box.stats.outliers]] : []))
  const spec = Array.isArray(domain) ? domain : ["auto", "auto"]
  const [lo, hi] = resolveDomain(spec, extent(extents), tickCount)
  const ticks = niceTicks(lo, hi, tickCount).filter((t) => t >= lo && t <= hi)

  const plot = horizontal
    ? { x: margin.left + categoryAxisSize, y: margin.top, width: Math.max(0, width - margin.left - margin.right - categoryAxisSize), height: Math.max(0, height - margin.top - margin.bottom - valueAxisSize) }
    : { x: margin.left + valueAxisSize, y: margin.top, width: Math.max(0, width - margin.left - margin.right - valueAxisSize), height: Math.max(0, height - margin.top - margin.bottom - categoryAxisSize) }
  const valueScale = linearScale([lo, hi], horizontal ? [plot.x, plot.x + plot.width] : [plot.y + plot.height, plot.y])
  const band = bandScale(boxes.length, horizontal ? [plot.y, plot.y + plot.height] : [plot.x, plot.x + plot.width], { categoryGap })

  // [x, y] of a value on a box's centre line.
  const point = (box, v) => (horizontal ? [valueScale(v), band.center(box.index)] : [band.center(box.index), valueScale(v)])
  const anchorAt = (i) => {
    const s = boxes[i].stats
    return point(boxes[i], s ? s.q3 : lo)
  }
  const indexAt = (p) => {
    const along = horizontal ? p.y - plot.y : p.x - plot.x
    const across = horizontal ? p.x - plot.x : p.y - plot.y
    const length = horizontal ? plot.height : plot.width
    const depth = horizontal ? plot.width : plot.height
    if (!band.step || along < 0 || along >= length || across < 0 || across > depth) return -1
    return Math.min(boxes.length - 1, Math.floor(along / band.step))
  }
  const payloadAt = (i) => {
    const s = boxes[i].stats
    if (!s) return []
    const ends = whiskers === "minmax" && !s.precomputed ? ["Minimum", "Maximum"] : ["Lower whisker", "Upper whisker"]
    return [
      [ends[1], s.high],
      ["Upper quartile", s.q3],
      ["Median", s.median],
      ["Lower quartile", s.q1],
      [ends[0], s.low],
      ["Outliers", s.outliers.length],
    ].map(([name, value]) => ({ dataKey: name, name, value, color: "var(--color-box, var(--chart-1))", payload: boxes[i].datum }))
  }
  return {
    legendPayload: [{ dataKey: "box", value: "box", color: "var(--color-box, var(--chart-1))", type: "rect" }],
    width,
    height,
    plot,
    horizontal,
    boxes,
    band,
    valueScale,
    point,
    ticks,
    domain: [lo, hi],
    indexAt,
    anchorAt,
    payloadAt,
    category: { count: boxes.length, labels: boxes.map((b) => b.label) },
  }
}

// ── Root ────────────────────────────────────────────────────────────

export function BoxPlot({
  data = [],
  categoryKey = "name",
  valuesKey = "values",
  whiskers = "iqr",
  whiskerRange = 1.5,
  layout = "vertical",
  domain,
  tickCount = 5,
  categoryGap = 0.4,
  margin,
  valueAxisSize,
  categoryAxisSize,
  syncId,
  accessibilityLayer = false,
  className,
  children,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  "aria-describedby": ariaDescribedBy,
  ...props
}) {
  const chart = useChart()
  const plotRef = useRef(null)
  const { width, height } = useElementSize(plotRef, chart.initialDimension)
  const parts = collect(children, PARTS)
  const horizontal = layout === "horizontal"
  const options = {
    categoryKey,
    valuesKey,
    whiskers,
    range: whiskerRange,
    horizontal,
    domain,
    tickCount,
    categoryGap,
    margin: { ...DEFAULT_MARGIN, ...margin },
    valueAxisSize: finite(valueAxisSize) ?? (horizontal ? 24 : 48),
    categoryAxisSize: finite(categoryAxisSize) ?? (horizontal ? 64 : 24),
  }
  const signature = json(options)
  const model = useMemo(
    () => boxModel({ ...options, data, width, height }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data, width, height, signature],
  )

  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => {
      for (const el of [...parts.unknown, ...parts.stray, ...parts.duplicates]) {
        console.warn(`<${el.type?.displayName ?? el.type?.name ?? "component"}> is not a box plot part and was ignored; only ChartTooltip and ChartLegend draw here.`)
      }
    }, [parts.unknown.length, parts.stray.length, parts.duplicates.length])
  }

  const tooltipEl = parts.tooltip
  const { activeIndex, pointer, layoutRef, activate, surface, keyboard } = useActiveIndex({
    count: model.boxes.length,
    defaultIndex: tooltipEl?.props.defaultIndex,
    trigger: tooltipEl?.props.trigger,
    indexAt: model.indexAt,
    syncId,
  })
  // A horizontal plot lists its boxes down the screen, so up and down step as
  // well. Arrows are handled here rather than by the shared handler so that an
  // index with no box here (one a larger synced chart handed over) counts as
  // none, as the heatmap does: forward lands on the first box, back on the last.
  const onKeyDown = (event) => {
    const step = { ArrowLeft: -1, ArrowRight: 1, ...(horizontal ? { ArrowUp: -1, ArrowDown: 1 } : {}) }[event.key]
    const count = model.boxes.length
    if (step == null || !count) return keyboard.onKeyDown(event)
    event.preventDefault()
    const from = activeIndex != null && activeIndex < count ? activeIndex : null
    activate(step > 0 ? Math.min(count - 1, (from ?? -1) + 1) : Math.max(0, (from ?? count) - 1), "keyboard")
  }
  const a11y = surfaceA11y(accessibilityLayer, ariaLabel != null || ariaLabelledBy != null, { ...keyboard, onKeyDown })

  const legendEl = parts.legend
  const legendTop = legendEl && legendEl.props.verticalAlign === "top"
  const { plot, band } = model
  const categoryLabels = options.categoryAxisSize > 0
  const valueLabels = options.valueAxisSize > 0

  return (
    <LayoutContext.Provider value={model}>
      <ActiveIndexContext.Provider value={activeIndex}>
        <PointerContext.Provider value={pointer}>
          <div ref={layoutRef} className={cn("chart-layout chart-boxplot", className)} data-layout={layout} {...props}>
            {legendTop ? legendEl : null}
            <div className="chart-plot" ref={plotRef}>
              <svg
                className="chart-surface"
                width={width}
                height={height}
                aria-label={ariaLabel}
                aria-labelledby={ariaLabelledBy}
                aria-describedby={ariaDescribedBy}
                {...surface}
                {...a11y}
              >
                {parts.passthrough}
                <g className="chart-boxplot-grid">
                  {model.ticks.map((t) => {
                    const v = model.valueScale(t)
                    return horizontal ? (
                      <line key={t} className="chart-grid" x1={v} x2={v} y1={plot.y} y2={plot.y + plot.height} />
                    ) : (
                      <line key={t} className="chart-grid" x1={plot.x} x2={plot.x + plot.width} y1={v} y2={v} />
                    )
                  })}
                </g>
                <g className="chart-axis chart-boxplot-axis" data-axis="value">
                  {valueLabels
                    ? model.ticks.map((t) =>
                        horizontal ? (
                          <text key={t} className="chart-tick-text" x={model.valueScale(t)} y={plot.y + plot.height + TICK_GAP} textAnchor="middle" dominantBaseline="hanging">
                            {t.toLocaleString()}
                          </text>
                        ) : (
                          <text key={t} className="chart-tick-text" x={plot.x - TICK_GAP} y={model.valueScale(t)} textAnchor="end" dominantBaseline="middle">
                            {t.toLocaleString()}
                          </text>
                        ),
                      )
                    : null}
                </g>
                <g className="chart-axis chart-boxplot-axis" data-axis="category">
                  {categoryLabels
                    ? model.boxes.map((box) =>
                        horizontal ? (
                          <text key={box.index} className="chart-tick-text" x={plot.x - TICK_GAP} y={band.center(box.index)} textAnchor="end" dominantBaseline="middle">
                            {String(box.label)}
                          </text>
                        ) : (
                          <text key={box.index} className="chart-tick-text" x={band.center(box.index)} y={plot.y + plot.height + TICK_GAP} textAnchor="middle" dominantBaseline="hanging">
                            {String(box.label)}
                          </text>
                        ),
                      )
                    : null}
                </g>
                <g className="chart-boxplot-boxes">
                  {model.boxes.map((box) => (box.stats ? <Box key={box.index} box={box} model={model} active={box.index === activeIndex} /> : null))}
                </g>
              </svg>
              {tooltipEl}
            </div>
            {legendEl && !legendTop ? legendEl : null}
          </div>
        </PointerContext.Provider>
      </ActiveIndexContext.Provider>
    </LayoutContext.Provider>
  )
}

function Box({ box, model, active }) {
  const { stats } = box
  const { band, horizontal, point, valueScale } = model
  const start = band.start(box.index)
  const thickness = band.bandwidth
  const mid = band.center(box.index)
  const cap = thickness / 4
  const [a, b] = [valueScale(stats.q1), valueScale(stats.q3)]
  const boxRect = horizontal
    ? { x: Math.min(a, b), y: start, width: Math.abs(b - a), height: thickness }
    : { x: start, y: Math.min(a, b), width: thickness, height: Math.abs(b - a) }
  // A segment along the centre line from one value to another, and one across it at a value.
  const run = (from, to) =>
    horizontal ? { x1: valueScale(from), x2: valueScale(to), y1: mid, y2: mid } : { x1: mid, x2: mid, y1: valueScale(from), y2: valueScale(to) }
  const cross = (v, from, to) =>
    horizontal ? { x1: valueScale(v), x2: valueScale(v), y1: from, y2: to } : { x1: from, x2: to, y1: valueScale(v), y2: valueScale(v) }
  return (
    <g className="chart-boxplot-box-group" data-index={box.index} data-active={active || undefined}>
      <line className="chart-boxplot-whisker" data-end="low" {...run(stats.low, stats.q1)} />
      <line className="chart-boxplot-whisker" data-end="high" {...run(stats.q3, stats.high)} />
      <line className="chart-boxplot-cap" data-end="low" {...cross(stats.low, mid - cap, mid + cap)} />
      <line className="chart-boxplot-cap" data-end="high" {...cross(stats.high, mid - cap, mid + cap)} />
      <rect className="chart-boxplot-box" {...boxRect} />
      <line className="chart-boxplot-median" data-value={stats.median} {...cross(stats.median, start, start + thickness)} />
      {stats.outliers.map((v, i) => {
        const [cx, cy] = point(box, v)
        return <circle key={i} className="chart-boxplot-outlier" data-value={v} cx={cx} cy={cy} r={OUTLIER_RADIUS} />
      })}
    </g>
  )
}
