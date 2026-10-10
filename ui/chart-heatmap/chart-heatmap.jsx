import { useContext, useEffect, useMemo, useRef } from "react"
import { cn } from "../../lib/cn.js"
import { bandScale, thinTicks } from "../../lib/chart-math.js"
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
 * Two roots over one grid: HeatmapChart (a band of x by a band of y) and
 * CalendarHeatmap (a year of days, week columns by weekday rows). Both lay
 * out cells with a flat index, row-major for the heatmap and day-of-year for
 * the calendar, so the shared tooltip host, pointer and keyboard layer from
 * ui/chart address a cell the way they address a category.
 *
 * Colour is a stepped scale between the config entries `low` and `high`
 * (--color-low, --color-high). A cell takes the colour of its step, so the
 * legend swatches are exactly the colours on the grid.
 */

const DEFAULT_MARGIN = { top: 5, right: 5, bottom: 5, left: 5 }
const DEFAULT_STEPS = 5
const TEXT_WIDTH_PER_CHAR = 7
const TEXT_HEIGHT = 14
const DAY_MS = 86_400_000
const PARTS = { series: new Set(), unique: [], first: ["tooltip", "legend"] }

const finite = (v) => (typeof v === "number" && Number.isFinite(v) ? v : null)
// A string prop (year="2024") must not reach arithmetic, where `+` would concatenate.
const wholeNumber = (v) => (v === "" || v == null || !Number.isInteger(Number(v)) ? null : Number(v))
const keyOf = (col, row) => `${col}:${row}`

// ── Scale ───────────────────────────────────────────────────────────

function makeScale(values, domain, stepsProp) {
  const steps = Math.max(2, Math.floor(finite(stepsProp) ?? DEFAULT_STEPS))
  const known = values.filter((v) => v != null)
  const [dataLo, dataHi] = known.length ? [Math.min(...known), Math.max(...known)] : [0, 1]
  // Each end falls back on its own, so [0, max] with max still loading draws from the data rather than NaN.
  const ends = Array.isArray(domain) ? domain : []
  const pinnedLo = finite(ends[0])
  const pinnedHi = finite(ends[1])
  // A fallback end never crosses a pinned one: [50, null] over data that tops out at 39 is all floor.
  let lo = pinnedLo ?? (pinnedHi != null ? Math.min(dataLo, pinnedHi) : dataLo)
  let hi = pinnedHi ?? Math.max(dataHi, lo)
  if (hi < lo) [lo, hi] = [hi, lo]
  const binOf = (v) => {
    // An empty range has no gradient; a reading on it takes the low end, so an idle year stays pale.
    if (hi === lo) return v > hi ? steps - 1 : 0
    if (v >= hi) return steps - 1
    if (v <= lo) return 0
    return Math.min(steps - 1, Math.floor(((v - lo) / (hi - lo)) * steps))
  }
  const colorOfBin = (bin) => {
    if (bin <= 0) return "var(--color-low, var(--muted))"
    if (bin >= steps - 1) return "var(--color-high, var(--chart-1))"
    const pct = Math.round((bin / (steps - 1)) * 100_000) / 1000
    return `color-mix(in oklab, var(--color-high, var(--chart-1)) ${pct}%, var(--color-low, var(--muted)))`
  }
  return { lo, hi, steps, binOf, colorOfBin }
}

function paint(cells, scale) {
  for (const cell of cells) {
    cell.bin = cell.value == null ? null : scale.binOf(cell.value)
    cell.color = cell.bin == null ? null : scale.colorOfBin(cell.bin)
  }
}

// ── Models ──────────────────────────────────────────────────────────

function gridPlot(width, height, margin, left, top, bottom = 0) {
  return {
    x: margin.left + left,
    y: margin.top + top,
    width: Math.max(0, width - margin.left - margin.right - left),
    height: Math.max(0, height - margin.top - margin.bottom - top - bottom),
  }
}

function finishModel({ cells, cols, rows, plot, xScale, yScale, scale, xTicks, yTicks, width, height, labelOf, nameOf }) {
  const at = new Map(cells.map((cell) => [keyOf(cell.col, cell.row), cell]))
  const cellStep = { x: xScale.step, y: yScale.step }
  for (const cell of cells) {
    cell.x = xScale.start(cell.col)
    cell.y = yScale.start(cell.row)
    cell.width = xScale.bandwidth
    cell.height = yScale.bandwidth
  }
  const indexAt = (point) => {
    if (!cellStep.x || !cellStep.y) return -1
    const col = Math.floor((point.x - plot.x) / cellStep.x)
    const row = Math.floor((point.y - plot.y) / cellStep.y)
    return at.get(keyOf(col, row))?.index ?? -1
  }
  const anchorAt = (i) => [cells[i].x + cells[i].width / 2, cells[i].y]
  const payloadAt = (i) => {
    const cell = cells[i]
    return [{ dataKey: cell.dataKey, name: nameOf, value: cell.value, color: cell.color ?? "var(--muted)", payload: cell.datum }]
  }
  return {
    width,
    height,
    plot,
    cells,
    cols,
    rows,
    at,
    scale,
    xTicks,
    yTicks,
    indexAt,
    anchorAt,
    payloadAt,
    category: { count: cells.length, labels: cells.map((cell) => labelOf(cell)) },
  }
}

function uniqueInOrder(values) {
  const seen = new Map()
  for (const v of values) if (!seen.has(String(v))) seen.set(String(v), v)
  return [...seen.values()]
}

function thinned(ticks, widthOf) {
  if (!ticks.length) return ticks
  const keep = thinTicks(ticks.map((t) => t.pos), ticks.map((t) => widthOf(t.label)), 4)
  return ticks.filter((_, i) => keep[i])
}

function heatmapModel({ data, xKey, yKey, valueKey, xDomain, yDomain, domain, steps, cellGap, margin, yAxisWidth, xAxisHeight, width, height, name }) {
  const xs = xDomain ?? uniqueInOrder(data.map((d) => d?.[xKey]))
  const ys = yDomain ?? uniqueInOrder(data.map((d) => d?.[yKey]))
  const colOf = new Map(xs.map((x, i) => [String(x), i]))
  const rowOf = new Map(ys.map((y, i) => [String(y), i]))
  const found = new Map()
  for (const datum of data) {
    const col = colOf.get(String(datum?.[xKey]))
    const row = rowOf.get(String(datum?.[yKey]))
    if (col != null && row != null && !found.has(keyOf(col, row))) found.set(keyOf(col, row), datum)
  }
  const cells = []
  ys.forEach((y, row) =>
    xs.forEach((x, col) => {
      const datum = found.get(keyOf(col, row))
      cells.push({ index: row * xs.length + col, col, row, xLabel: x, yLabel: y, datum: datum ?? {}, dataKey: valueKey, value: finite(datum?.[valueKey]) })
    }),
  )
  const scale = makeScale(cells.map((c) => c.value), domain, steps)
  paint(cells, scale)

  const plot = gridPlot(width, height, margin, yAxisWidth, 0, xAxisHeight)
  const xScale = bandScale(xs.length, [plot.x, plot.x + plot.width], { categoryGap: cellGap })
  const yScale = bandScale(ys.length, [plot.y, plot.y + plot.height], { categoryGap: cellGap })
  const xTicks = xAxisHeight <= 0 ? [] : thinned(xs.map((label, i) => ({ pos: xScale.center(i), label: String(label) })), (t) => t.length * TEXT_WIDTH_PER_CHAR)
  const yTicks = yAxisWidth <= 0 ? [] : thinned(ys.map((label, i) => ({ pos: yScale.center(i), label: String(label) })), () => TEXT_HEIGHT)
  return finishModel({
    cells,
    cols: xs.length,
    rows: ys.length,
    plot,
    xScale,
    yScale,
    scale,
    xTicks,
    yTicks,
    width,
    height,
    nameOf: name,
    labelOf: (cell) => `${cell.yLabel} · ${cell.xLabel}`,
  })
}

const utcDay = (value) => {
  if (value instanceof Date) return Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()) / DAY_MS
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value))
  if (!match) return null
  const [y, m, d] = [Number(match[1]), Number(match[2]) - 1, Number(match[3])]
  const date = new Date(Date.UTC(y, m, d))
  // Date.UTC rolls 2024-02-30 over to 1 March, where it would claim that day's slot.
  return date.getUTCMonth() === m && date.getUTCDate() === d ? date.getTime() / DAY_MS : null
}

function calendarModel({ data, year, dateKey, valueKey, weekStart, domain, steps, cellGap, margin, yAxisWidth, xAxisHeight, width, height, locale, name }) {
  const first = Date.UTC(year, 0, 1) / DAY_MS
  const days = Date.UTC(year + 1, 0, 1) / DAY_MS - first
  const lead = (new Date(first * DAY_MS).getUTCDay() - weekStart + 7) % 7
  const cols = Math.ceil((lead + days) / 7)

  const found = new Map()
  for (const datum of data) {
    const day = utcDay(datum?.[dateKey])
    if (day != null && day >= first && day < first + days && !found.has(day - first)) found.set(day - first, datum)
  }
  const dateLabel = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone: "UTC" })
  const cells = Array.from({ length: days }, (_, i) => {
    const datum = found.get(i)
    const offset = lead + i
    return {
      index: i,
      col: Math.floor(offset / 7),
      row: offset % 7,
      date: new Date((first + i) * DAY_MS),
      datum: datum ?? {},
      dataKey: valueKey,
      value: finite(datum?.[valueKey]),
    }
  })
  const scale = makeScale(cells.map((c) => c.value), domain, steps)
  paint(cells, scale)

  const room = gridPlot(width, height, margin, yAxisWidth, xAxisHeight)
  const step = Math.max(0, Math.min(room.width / cols, room.height / 7))
  const plot = { x: room.x, y: room.y, width: step * cols, height: step * 7 }
  const xScale = bandScale(cols, [plot.x, plot.x + plot.width], { categoryGap: cellGap })
  const yScale = bandScale(7, [plot.y, plot.y + plot.height], { categoryGap: cellGap })

  const monthName = new Intl.DateTimeFormat(locale, { month: "short", timeZone: "UTC" })
  const weekdayName = new Intl.DateTimeFormat(locale, { weekday: "short", timeZone: "UTC" })
  const xTicks = xAxisHeight <= 0 ? [] : thinned(
    Array.from({ length: 12 }, (_, m) => {
      const start = Date.UTC(year, m, 1) / DAY_MS - first
      return { pos: xScale.center(Math.floor((lead + start) / 7)), label: monthName.format(new Date(Date.UTC(year, m, 1))) }
    }),
    (t) => t.length * TEXT_WIDTH_PER_CHAR,
  )
  // 2023-01-01 is a Sunday, so day n of January 2023 is weekday n - 1.
  const yTicks =
    yAxisWidth <= 0
      ? []
      : [1, 3, 5].map((r) => ({
          pos: yScale.center(r),
          label: weekdayName.format(new Date(Date.UTC(2023, 0, 1 + ((weekStart + r) % 7)))),
        }))
  return finishModel({
    cells,
    cols,
    rows: 7,
    plot,
    xScale,
    yScale,
    scale,
    xTicks,
    yTicks,
    width,
    height,
    nameOf: name,
    labelOf: (cell) => dateLabel.format(cell.date),
  })
}

// ── Root ────────────────────────────────────────────────────────────

const ARROWS = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }

function GridChart({
  variant,
  build,
  data,
  signature,
  name,
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

  const model = useMemo(
    () => build(width, height),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data, width, height, signature, name],
  )

  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => {
      for (const el of [...parts.unknown, ...parts.stray, ...parts.duplicates]) {
        console.warn(`<${el.type?.displayName ?? el.type?.name ?? "component"}> is not a heatmap part and was ignored; only ChartTooltip and HeatmapLegend draw here.`)
      }
    }, [parts.unknown.length, parts.stray.length, parts.duplicates.length])
  }

  const tooltipEl = parts.tooltip
  const { activeIndex, pointer, layoutRef, activate, surface, keyboard } = useActiveIndex({
    count: model.cells.length,
    defaultIndex: tooltipEl?.props.defaultIndex,
    trigger: tooltipEl?.props.trigger,
    indexAt: model.indexAt,
    syncId,
  })

  // Up and down move a row, left and right a column. Geometry does not mirror
  // in RTL, so the arrows follow the screen. A step off the grid, or onto a
  // day the year does not have, stays put.
  const onKeyDown = (event) => {
    const step = ARROWS[event.key]
    if (!step || !model.cells.length) return keyboard.onKeyDown(event)
    event.preventDefault()
    // A synced chart can hand over an index this grid does not have, and data can shrink under a live one.
    const current = model.cells[activeIndex]
    const from = current ?? model.cells[0]
    const to = current ? model.at.get(keyOf(from.col + step[0], from.row + step[1])) ?? from : from
    activate(to.index, "keyboard")
  }
  const a11y = surfaceA11y(accessibilityLayer, ariaLabel != null || ariaLabelledBy != null, { ...keyboard, onKeyDown })

  const legendEl = parts.legend
  const legendTop = legendEl && legendEl.props.verticalAlign === "top"
  const { plot } = model

  return (
    <LayoutContext.Provider value={model}>
      <ActiveIndexContext.Provider value={activeIndex}>
        <PointerContext.Provider value={pointer}>
          <div ref={layoutRef} className={cn("chart-layout chart-heatmap", className)} data-layout={variant} {...props}>
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
                <g className="chart-axis chart-heatmap-axis" data-axis="x">
                  {model.xTicks.map((tick) => (
                    <text
                      key={tick.pos}
                      className="chart-tick-text"
                      x={tick.pos}
                      y={variant === "calendar" ? plot.y - 6 : plot.y + plot.height + 6}
                      textAnchor="middle"
                      dominantBaseline={variant === "calendar" ? "auto" : "hanging"}
                    >
                      {tick.label}
                    </text>
                  ))}
                </g>
                <g className="chart-axis chart-heatmap-axis" data-axis="y">
                  {model.yTicks.map((tick) => (
                    <text key={tick.pos} className="chart-tick-text" x={plot.x - 8} y={tick.pos} textAnchor="end" dominantBaseline="middle">
                      {tick.label}
                    </text>
                  ))}
                </g>
                <g className="chart-heatmap-cells">
                  {model.cells.map((cell) => (
                    <rect
                      key={cell.index}
                      className="chart-heatmap-cell"
                      data-index={cell.index}
                      data-col={cell.col}
                      data-row={cell.row}
                      data-value={cell.value ?? undefined}
                      data-step={cell.bin ?? undefined}
                      data-empty={cell.value == null || undefined}
                      data-active={cell.index === activeIndex || undefined}
                      x={cell.x}
                      y={cell.y}
                      width={cell.width}
                      height={cell.height}
                      fill={cell.color ?? undefined}
                    />
                  ))}
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

const json = (value) => JSON.stringify(value ?? null)

export function HeatmapChart({
  data = [],
  xKey = "x",
  yKey = "y",
  valueKey = "value",
  xDomain,
  yDomain,
  domain,
  steps,
  cellGap = 0.1,
  margin,
  yAxisWidth = 48,
  xAxisHeight = 24,
  ...props
}) {
  const { config } = useChart()
  const name = config?.[valueKey]?.label ?? valueKey
  const fullMargin = { ...DEFAULT_MARGIN, ...margin }
  const options = { xKey, yKey, valueKey, xDomain, yDomain, domain, steps, cellGap, margin: fullMargin, yAxisWidth, xAxisHeight }
  // name stays out of the serialised key: a config label may be a React element, which does not serialise.
  const signature = json(options)
  return <GridChart variant="heatmap" data={data} signature={signature} name={name} build={(width, height) => heatmapModel({ ...options, name, data, width, height })} {...props} />
}

export function CalendarHeatmap({
  data = [],
  year: yearProp,
  dateKey = "date",
  valueKey = "value",
  weekStart: weekStartProp = 0,
  domain,
  steps,
  cellGap = 0.15,
  locale,
  margin,
  yAxisWidth = 36,
  xAxisHeight = 20,
  ...props
}) {
  const { config } = useChart()
  const name = config?.[valueKey]?.label ?? valueKey
  const fullMargin = { ...DEFAULT_MARGIN, ...margin }
  const parsedYear = wholeNumber(yearProp)
  const year = parsedYear >= 100 && parsedYear <= 9999 ? parsedYear : new Date().getFullYear()
  const weekStart = (((wholeNumber(weekStartProp) ?? 0) % 7) + 7) % 7
  const options = { year, dateKey, valueKey, weekStart, domain, steps, cellGap, locale, margin: fullMargin, yAxisWidth, xAxisHeight }
  const signature = json(options)
  return <GridChart variant="calendar" data={data} signature={signature} name={name} build={(width, height) => calendarModel({ ...options, name, data, width, height })} {...props} />
}

// ── Legend ──────────────────────────────────────────────────────────

export function HeatmapLegend({ formatter = (v) => v.toLocaleString(), verticalAlign = "bottom", className, ...props }) {
  const layout = useContext(LayoutContext)
  if (!layout?.scale) return null
  const { scale } = layout
  return (
    <div className={cn("chart-legend chart-heatmap-legend", `chart-legend--${verticalAlign}`, className)} {...props}>
      <span className="chart-heatmap-legend-label" data-end="low">
        {formatter(scale.lo)}
      </span>
      <span className="chart-heatmap-legend-steps" aria-hidden="true">
        {Array.from({ length: scale.steps }, (_, bin) => (
          <span key={bin} className="chart-heatmap-legend-step" data-step={bin} style={{ backgroundColor: scale.colorOfBin(bin) }} />
        ))}
      </span>
      <span className="chart-heatmap-legend-label" data-end="high">
        {formatter(scale.hi)}
      </span>
    </div>
  )
}
HeatmapLegend.chartRole = "legend"
