import {
  Children,
  Fragment,
  cloneElement,
  createContext,
  isValidElement,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import { cn } from "../../lib/cn.js"
import {
  extent,
  niceTicks,
  resolveDomain,
  linearScale,
  bandScale,
  pointScale,
  barSlots,
  stackSeries,
  nearestIndex,
  thinTicks,
  linePath,
  areaPath,
  polarToCartesian,
  cartesianToPolar,
  resolveLength,
  arcPath,
  arcLinePath,
  pieSlices,
  sliceIndexAt,
  nearestAngleIndex,
  radarPath,
  polarGridPath,
} from "../../lib/chart-math.js"

/*
 * Upstream's shell (ChartContainer, ChartStyle, ChartTooltipContent,
 * ChartLegendContent) over primitives drawn here on plain SVG under the
 * Recharts names, so upstream examples paste in unchanged. Two roots:
 * CartesianChart (bar, line, area) and PolarChart (pie, radar, radial bar),
 * which share the shell, the tooltip host and the keyboard layer but no
 * geometry. No entrance animation. Axes do not mirror in RTL.
 *
 * A chart root walks its children once (Fragments included) and classifies
 * each by a static `chartRole` marker on the component — a consumer wrapper
 * around <Bar> carries no marker and is invisible to the walk, so series,
 * axes, grid, tooltip and legend must be direct children or sit in a Fragment.
 */

const INITIAL_DIMENSION = { width: 320, height: 200 }
const DEFAULT_MARGIN = { top: 5, right: 5, bottom: 5, left: 5 }
const PALETTE_SIZE = 5
const TOOLTIP_GAP = 12
const SAFE_IDENT = /^[\w-]+$/

const ChartContext = createContext(null)
const LayoutContext = createContext(null)
const ActiveIndexContext = createContext(null)
const PointerContext = createContext(null)
const SeriesContext = createContext(null)

function useChart() {
  const context = useContext(ChartContext)
  if (!context) throw new Error("useChart must be used within a <ChartContainer />")
  return context
}

// ── Shell ───────────────────────────────────────────────────────────

export function ChartContainer({ id, className, children, config, initialDimension = INITIAL_DIMENSION, ...props }) {
  const uniqueId = useId()
  const chartId = `chart-${String(id ?? uniqueId).replace(/[^\w-]/g, "")}`
  const value = useMemo(() => ({ config, id: chartId, initialDimension }), [config, chartId, initialDimension])
  return (
    <ChartContext.Provider value={value}>
      <div data-chart={chartId} className={cn("chart", className)} {...props}>
        <ChartStyle id={chartId} config={config} />
        {children}
      </div>
    </ChartContext.Provider>
  )
}

const safeColor = (v) => typeof v === "string" && v.trim() && !/[<{};]/.test(v)

/*
 * One rule, scoped to the chart. A `theme` pair becomes light-dark(): the kit
 * resolves colour at the root's color-scheme (docs/DECISIONS.md, root-only
 * dark mode), so upstream's `.dark [data-chart]` selector would never flip a
 * series colour here. Input is sanitised because this is innerHTML.
 */
export function ChartStyle({ id, config }) {
  if (!config || !SAFE_IDENT.test(String(id))) return null
  const rules = []
  for (const [key, item] of Object.entries(config)) {
    if (!SAFE_IDENT.test(key) || !item) continue
    const light = item.theme?.light ?? item.color
    const dark = item.theme?.dark ?? item.color
    const lightOk = safeColor(light)
    const darkOk = safeColor(dark)
    if (!lightOk && !darkOk) continue
    const value =
      item.theme && lightOk && darkOk && light !== dark
        ? `light-dark(${light}, ${dark})`
        : lightOk
          ? light
          : dark
    rules.push(`  --color-${key}: ${value};`)
  }
  if (!rules.length) return null
  return <style dangerouslySetInnerHTML={{ __html: `[data-chart=${id}] {\n${rules.join("\n")}\n}` }} />
}

export function ChartTooltipContent({
  active,
  payload,
  className,
  indicator = "dot",
  hideLabel = false,
  hideIndicator = false,
  label,
  labelFormatter,
  labelClassName,
  formatter,
  color,
  nameKey,
  labelKey,
  ...props
}) {
  const { config } = useChart()

  const tooltipLabel = useMemo(() => {
    if (hideLabel || !payload?.length) return null
    const [item] = payload
    const key = `${labelKey ?? item?.dataKey ?? item?.name ?? "value"}`
    const itemConfig = getPayloadConfigFromPayload(config, item, key)
    const value = !labelKey && typeof label === "string" ? (config[label]?.label ?? label) : itemConfig?.label
    if (labelFormatter) {
      return <div className={cn("chart-tooltip-label", labelClassName)}>{labelFormatter(value, payload)}</div>
    }
    if (!value) return null
    return <div className={cn("chart-tooltip-label", labelClassName)}>{value}</div>
  }, [label, labelFormatter, payload, hideLabel, labelClassName, config, labelKey])

  if (!active || !payload?.length) return null

  const nestLabel = payload.length === 1 && indicator !== "dot"

  return (
    <div className={cn("chart-tooltip", className)} {...props}>
      {!nestLabel ? tooltipLabel : null}
      <div className="chart-tooltip-items">
        {payload
          .filter((item) => item.type !== "none")
          .map((item, index) => {
            const key = `${nameKey ?? item.name ?? item.dataKey ?? "value"}`
            const itemConfig = getPayloadConfigFromPayload(config, item, key)
            const indicatorColor = color ?? item.payload?.fill ?? item.color
            const Icon = itemConfig?.icon

            return (
              <div key={index} className="chart-tooltip-item" data-indicator={indicator}>
                {formatter && item?.value !== undefined && item.name ? (
                  formatter(item.value, item.name, item, index, item.payload)
                ) : (
                  <>
                    {Icon ? (
                      <Icon />
                    ) : (
                      !hideIndicator && (
                        <div
                          className={cn(
                            "chart-tooltip-indicator",
                            `chart-tooltip-indicator--${indicator}`,
                            nestLabel && indicator === "dashed" && "chart-tooltip-indicator--nested",
                          )}
                          style={{ "--chart-indicator": indicatorColor }}
                        />
                      )
                    )}
                    <div className="chart-tooltip-body" data-nested={nestLabel || undefined}>
                      <div className="chart-tooltip-text">
                        {nestLabel ? tooltipLabel : null}
                        <span className="chart-tooltip-name">{itemConfig?.label ?? item.name}</span>
                      </div>
                      {item.value != null && (
                        <span className="chart-tooltip-value">
                          {typeof item.value === "number" ? item.value.toLocaleString() : String(item.value)}
                        </span>
                      )}
                    </div>
                  </>
                )}
              </div>
            )
          })}
      </div>
    </div>
  )
}

export function ChartLegendContent({ className, hideIcon = false, payload, verticalAlign = "bottom", nameKey, ...props }) {
  const { config } = useChart()

  if (!payload?.length) return null

  return (
    <div className={cn("chart-legend", `chart-legend--${verticalAlign}`, className)} {...props}>
      {payload
        .filter((item) => item.type !== "none")
        .map((item, index) => {
          const key = `${nameKey ?? item.dataKey ?? "value"}`
          const itemConfig = getPayloadConfigFromPayload(config, item, key)
          const Icon = itemConfig?.icon

          return (
            <div key={index} className="chart-legend-item">
              {Icon && !hideIcon ? (
                <Icon />
              ) : (
                <div className="chart-legend-swatch" style={{ backgroundColor: item.color }} />
              )}
              {itemConfig?.label}
            </div>
          )
        })}
    </div>
  )
}

// Helper to extract item config from a payload.
function getPayloadConfigFromPayload(config, payload, key) {
  if (typeof payload !== "object" || payload === null) return undefined

  const payloadPayload =
    "payload" in payload && typeof payload.payload === "object" && payload.payload !== null
      ? payload.payload
      : undefined

  let configLabelKey = key

  if (key in payload && typeof payload[key] === "string") {
    configLabelKey = payload[key]
  } else if (payloadPayload && key in payloadPayload && typeof payloadPayload[key] === "string") {
    configLabelKey = payloadPayload[key]
  }

  return configLabelKey in config ? config[configLabelKey] : config[key]
}

// ── Composition ─────────────────────────────────────────────────────

// What each root accepts: series roles, axes that must be unique, parts that
// take the first occurrence. Anything else is passthrough SVG or a warning.
const CARTESIAN_PARTS = {
  series: new Set(["bar", "line", "area"]),
  unique: ["xaxis", "yaxis"],
  first: ["grid", "tooltip", "legend"],
}
const POLAR_PARTS = {
  series: new Set(["pie", "radar", "radialbar"]),
  unique: ["polarangleaxis", "polarradiusaxis"],
  first: ["polargrid", "tooltip", "legend"],
}

function collect(children, parts, out = { series: [], passthrough: [], unknown: [], stray: [], duplicates: [] }) {
  for (const child of Children.toArray(children)) {
    if (!isValidElement(child)) continue
    if (child.type === Fragment) {
      collect(child.props.children, parts, out)
      continue
    }
    const role = child.type?.chartRole
    if (parts.series.has(role)) out.series.push(child)
    else if (parts.unique.includes(role)) {
      if (out[role]) out.duplicates.push(child)
      else out[role] = child
    } else if (parts.first.includes(role)) {
      if (!out[role]) out[role] = child
    } else if (role === "label") out.stray.push(child)
    else if (typeof child.type === "string") out.passthrough.push(child)
    else out.unknown.push(child)
  }
  return out
}

const componentName = (el) => el.type?.displayName ?? el.type?.name ?? "component"

/*
 * Rows sharing a stackId pile on each other; everything else stands on zero.
 * Sets entry.stack = { y0, y1 }[] on every entry.
 */
function stackEntries(entries, canStack) {
  const stacks = new Map()
  for (const entry of entries) {
    if (entry.stackId == null || !canStack(entry)) continue
    const key = `${entry.role}:${entry.stackId}`
    if (!stacks.has(key)) stacks.set(key, [])
    stacks.get(key).push(entry)
  }
  for (const group of stacks.values()) {
    const stacked = stackSeries(group.map((entry) => entry.values))
    group.forEach((entry, i) => {
      entry.stack = stacked[i]
    })
  }
  for (const entry of entries) {
    if (!entry.stack) entry.stack = entry.values.map((v) => ({ y0: 0, y1: v ?? 0 }))
  }
}

/* One slot per stack or per lone bar inside a band; sets entry.slot. */
function slotEntries(bars, bandwidth, barGap) {
  const slotKeys = []
  for (const entry of bars) {
    const key = entry.stackId != null ? `s:${entry.stackId}` : `i:${entry.index}`
    if (!slotKeys.includes(key)) slotKeys.push(key)
    entry.slotKey = key
  }
  const firstWith = (prop) => bars.find((entry) => entry.props[prop] != null)?.props[prop]
  const slots = barSlots(bandwidth, slotKeys.length, {
    barGap: barGap ?? 4,
    barSize: firstWith("barSize"),
    maxBarSize: firstWith("maxBarSize"),
  })
  for (const entry of bars) entry.slot = slots[slotKeys.indexOf(entry.slotKey)]
}

function indexEntries(entries) {
  const byKey = new Map()
  const duplicateKeys = []
  for (const entry of entries) {
    if (byKey.has(entry.key)) duplicateKeys.push(entry.key)
    else byKey.set(entry.key, entry)
  }
  return { byKey, duplicateKeys }
}

function useElementSize(ref, initial) {
  const [size, setSize] = useState(initial)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el || typeof ResizeObserver === "undefined") return
    const measure = () => {
      const width = el.clientWidth
      const height = el.clientHeight
      if (!width || !height) return
      setSize((prev) => (prev.width === width && prev.height === height ? prev : { width, height }))
    }
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    measure()
    return () => observer.disconnect()
  }, [ref])
  return size
}

const finite = (v) => (typeof v === "number" && Number.isFinite(v) ? v : null)

function categoryGapFraction(gap, step) {
  if (typeof gap === "number") return step > 0 ? Math.min(0.9, gap / step) : 0
  const pct = parseFloat(gap)
  return Number.isFinite(pct) ? Math.min(0.9, pct / 100) : 0.1
}

function seriesColor(role, props, index) {
  const explicit = role === "bar" ? props.fill : role === "line" ? props.stroke : (props.stroke ?? props.fill)
  return explicit ?? `var(--chart-${(index % PALETTE_SIZE) + 1})`
}

function computeLayout({ data, vertical, margin, width, height, barCategoryGap, barGap, series, xaxis, yaxis }) {
  const space = (el, dim, fallback) => (el && !el.props.hide ? (el.props[dim] ?? fallback) : 0)
  const left = space(yaxis, "width", 60)
  const bottom = space(xaxis, "height", 30)
  const plot = {
    x: margin.left + left,
    y: margin.top,
    width: Math.max(0, width - margin.left - margin.right - left),
    height: Math.max(0, height - margin.top - margin.bottom - bottom),
  }
  const count = data.length
  const hasBar = series.some((el) => el.type.chartRole === "bar")
  const categoryRange = vertical ? [plot.y, plot.y + plot.height] : [plot.x, plot.x + plot.width]
  const span = categoryRange[1] - categoryRange[0]
  const categoryScale = hasBar
    ? bandScale(count, categoryRange, { categoryGap: categoryGapFraction(barCategoryGap, count ? span / count : 0) })
    : pointScale(count, categoryRange)

  const entries = series.map((el, index) => {
    const role = el.type.chartRole
    const { dataKey, stackId, name } = el.props
    const values = data.map((datum) => finite(datum?.[dataKey]))
    return {
      key: `${role}:${dataKey}`,
      role,
      dataKey,
      name: name ?? String(dataKey),
      stackId,
      index,
      values,
      color: seriesColor(role, el.props, index),
      props: el.props,
      stack: null,
      slot: null,
    }
  })

  stackEntries(entries, (entry) => entry.role !== "line")

  const columns = entries.flatMap((entry) =>
    entry.role === "line" || entry.stackId == null
      ? [entry.values]
      : [entry.stack.map((p) => p.y0), entry.stack.map((p) => p.y1)],
  )
  const valueAxis = vertical ? xaxis : yaxis
  const tickCount = valueAxis?.props.tickCount ?? 5
  const domain = resolveDomain(
    valueAxis?.props.domain ?? [0, "auto"],
    extent(columns),
    tickCount,
    valueAxis?.props.allowDataOverflow,
  )
  const [lo, hi] = domain
  const ticks = (valueAxis?.props.ticks ?? niceTicks(lo, hi, tickCount)).filter((t) => t >= lo && t <= hi)
  const valueScale = linearScale(domain, vertical ? [plot.x, plot.x + plot.width] : [plot.y + plot.height, plot.y])

  slotEntries(
    entries.filter((entry) => entry.role === "bar"),
    categoryScale.bandwidth,
    barGap,
  )
  const { byKey, duplicateKeys } = indexEntries(entries)

  const categoryAxis = vertical ? yaxis : xaxis
  const categoryKey = categoryAxis?.props.dataKey
  const labels = data.map((datum, i) => (categoryKey != null ? datum?.[categoryKey] : i))
  const centers = labels.map((_, i) => categoryScale.center(i))

  const pointAt = (i, v) => {
    const c = categoryScale.center(i)
    const s = valueScale(v)
    return vertical ? [s, c] : [c, s]
  }
  const anchorAt = (i) => (vertical ? [plot.x, categoryScale.center(i)] : [categoryScale.center(i), plot.y])
  const indexAt = (point) => nearestIndex(vertical ? point.y : point.x, centers)
  const clampValue = (v) => Math.min(hi, Math.max(lo, v))

  const legendPayload = entries.map((entry) => ({
    dataKey: entry.dataKey,
    value: entry.name,
    color: entry.color,
    type: "rect",
  }))
  const payloadAt = (i) =>
    entries.map((entry) => ({
      dataKey: entry.dataKey,
      name: entry.name,
      value: entry.values[i],
      color: entry.color,
      fill: entry.color,
      payload: data[i],
    }))

  return {
    data,
    vertical,
    width,
    height,
    plot,
    hasBar,
    category: { axis: vertical ? "y" : "x", dataKey: categoryKey, scale: categoryScale, labels, count, centers },
    value: { axis: vertical ? "x" : "y", domain, scale: valueScale, ticks },
    series: entries,
    byKey,
    duplicateKeys,
    pointAt,
    anchorAt,
    indexAt,
    clampValue,
    legendPayload,
    payloadAt,
  }
}

const AXIS_SIG_KEYS = ["dataKey", "hide", "width", "height", "domain", "ticks", "tickCount", "allowDataOverflow"]
const SERIES_SIG_KEYS = ["dataKey", "stackId", "name", "barSize", "maxBarSize", "fill", "stroke"]
const pick = (props, keys) => keys.map((key) => props?.[key])

/*
 * The active category: set by the pointer (the surface's own coordinates
 * travel with it so the tooltip can follow), by the keyboard, or by a
 * tooltip's defaultIndex. A touch tooltip has no leave event: it stays
 * until a press lands outside the chart.
 */
function useActiveIndex({ count, defaultIndex, indexAt }) {
  const [activeIndex, setActiveIndex] = useState(() => (Number.isInteger(defaultIndex) ? defaultIndex : null))
  const [pointer, setPointer] = useState({ source: "default", point: null })
  const layoutRef = useRef(null)

  const activate = (index, source, point = null) => {
    setActiveIndex(index)
    setPointer({ source, point })
  }
  const clear = () => {
    setActiveIndex(null)
    setPointer((prev) => (prev.source === "default" && prev.point === null ? prev : { source: "default", point: null }))
  }

  const locate = (event) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const point = { x: event.clientX - rect.left, y: event.clientY - rect.top }
    const index = indexAt(point)
    if (index < 0) clear()
    else activate(index, "pointer", point)
  }
  const onPointerLeave = (event) => {
    if (event.pointerType === "touch") return
    clear()
  }

  useEffect(() => {
    if (activeIndex == null || pointer.source !== "pointer") return
    const onDown = (event) => {
      if (!layoutRef.current?.contains(event.target)) clear()
    }
    document.addEventListener("pointerdown", onDown)
    return () => document.removeEventListener("pointerdown", onDown)
  }, [activeIndex, pointer.source])

  const onKeyDown = (event) => {
    if (!count) return
    const rtl = getComputedStyle(event.currentTarget).direction === "rtl"
    const forward = rtl ? "ArrowLeft" : "ArrowRight"
    const back = rtl ? "ArrowRight" : "ArrowLeft"
    let next
    switch (event.key) {
      case forward:
        next = Math.min(count - 1, (activeIndex ?? -1) + 1)
        break
      case back:
        next = Math.max(0, (activeIndex ?? count) - 1)
        break
      case "Home":
        next = 0
        break
      case "End":
        next = count - 1
        break
      case "Escape":
        event.preventDefault()
        clear()
        return
      default:
        return
    }
    event.preventDefault()
    activate(next, "keyboard")
  }
  const onFocus = () => {
    if (activeIndex == null && count) activate(0, "keyboard")
  }
  const onBlur = () => {
    if (pointer.source === "keyboard") clear()
  }

  return {
    activeIndex,
    pointer,
    layoutRef,
    surface: { onPointerMove: locate, onPointerDown: locate, onPointerLeave },
    keyboard: { onKeyDown, onFocus, onBlur },
  }
}

function surfaceA11y(accessibilityLayer, labelled, keyboard) {
  if (accessibilityLayer) return { tabIndex: 0, role: "application", "aria-roledescription": "chart", ...keyboard }
  return labelled ? { role: "img" } : {}
}

function CartesianChart({
  data = [],
  layout = "horizontal",
  margin,
  barCategoryGap = "10%",
  barGap,
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
  const vertical = layout === "vertical"

  const parts = collect(children, CARTESIAN_PARTS)
  const { series, xaxis, yaxis } = parts
  const fullMargin = { ...DEFAULT_MARGIN, ...margin }

  // Keyed on what the geometry reads, never on children identity: a parent
  // re-render hands down fresh elements every time.
  const signature = JSON.stringify({
    vertical,
    margin: fullMargin,
    barCategoryGap,
    barGap,
    series: series.map((el) => [el.type.chartRole, ...pick(el.props, SERIES_SIG_KEYS)]),
    xaxis: xaxis && pick(xaxis.props, AXIS_SIG_KEYS),
    yaxis: yaxis && pick(yaxis.props, AXIS_SIG_KEYS),
  })
  const computed = useMemo(
    () => computeLayout({ data, vertical, margin: fullMargin, width, height, barCategoryGap, barGap, series, xaxis, yaxis }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data, width, height, signature],
  )

  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => {
      for (const el of parts.duplicates) {
        console.warn(`<${componentName(el)}> declared twice in one chart; only the first is used.`)
      }
      for (const el of parts.unknown) {
        console.warn(
          `<${componentName(el)}> is not a cartesian chart primitive and was ignored. A wrapper around <Bar>, <Line> or <Area> is ` +
            "invisible to the chart; render the primitives as direct children or inside a Fragment.",
        )
      }
      for (const el of parts.stray) {
        console.warn(`<${componentName(el)}> must be a child of a <Bar>, <Line> or <Area>; at the chart root it draws nothing.`)
      }
      for (const key of computed.duplicateKeys) {
        console.warn(`Two series share ${key}; the second is ignored. Give each series its own dataKey.`)
      }
    }, [parts.duplicates.length, parts.unknown.length, parts.stray.length, computed])
  }

  const tooltipEl = parts.tooltip
  const { activeIndex, pointer, layoutRef, surface, keyboard } = useActiveIndex({
    count: computed.category.count,
    defaultIndex: tooltipEl?.props.defaultIndex,
    indexAt: computed.indexAt,
  })

  const showCursor = tooltipEl && tooltipEl.props.cursor !== false && activeIndex != null && activeIndex < computed.category.count
  const { plot, category } = computed
  let cursor = null
  if (showCursor) {
    if (computed.hasBar) {
      const start = category.scale.start(activeIndex)
      const size = category.scale.bandwidth
      cursor = vertical ? (
        <rect className="chart-cursor" x={plot.x} y={start} width={plot.width} height={size} />
      ) : (
        <rect className="chart-cursor" x={start} y={plot.y} width={size} height={plot.height} />
      )
    } else {
      const c = category.scale.center(activeIndex)
      cursor = vertical ? (
        <line className="chart-cursor chart-cursor--line" x1={plot.x} x2={plot.x + plot.width} y1={c} y2={c} />
      ) : (
        <line className="chart-cursor chart-cursor--line" x1={c} x2={c} y1={plot.y} y2={plot.y + plot.height} />
      )
    }
  }

  const legendEl = parts.legend
  const legendTop = legendEl && legendEl.props.verticalAlign === "top"
  const a11y = surfaceA11y(accessibilityLayer, ariaLabel != null || ariaLabelledBy != null, keyboard)

  return (
    <LayoutContext.Provider value={computed}>
      <ActiveIndexContext.Provider value={activeIndex}>
        <PointerContext.Provider value={pointer}>
          <div ref={layoutRef} className={cn("chart-layout", className)} data-layout={layout} {...props}>
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
                {parts.grid}
                {cursor}
                {series}
                {xaxis}
                {yaxis}
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

export function BarChart({ children, ...props }) {
  return <CartesianChart {...props}>{children}</CartesianChart>
}

export function LineChart({ children, ...props }) {
  return <CartesianChart {...props}>{children}</CartesianChart>
}

export function AreaChart({ children, ...props }) {
  return <CartesianChart {...props}>{children}</CartesianChart>
}

// ── Polar root ──────────────────────────────────────────────────────

/*
 * Angles follow Recharts: degrees, 0° at 3 o'clock, counter-clockwise
 * positive. The active index is a slice (pie), a category angle (radar) or a
 * ring (radial bar); the layout exposes the same category / payloadAt /
 * anchorAt shape as the cartesian one, so ChartTooltip, ChartLegend and the
 * keyboard layer need no polar knowledge.
 */

const POLAR_ANGLES = { pie: [0, 360], radar: [90, -270], radialbar: [0, 360] }
const POLAR_SERIES_SIG_KEYS = [
  "dataKey",
  "nameKey",
  "stackId",
  "name",
  "fill",
  "stroke",
  "innerRadius",
  "outerRadius",
  "startAngle",
  "endAngle",
  "paddingAngle",
  "background",
  "barSize",
  "maxBarSize",
]
const POLAR_AXIS_SIG_KEYS = ["dataKey", "domain", "ticks", "tickCount", "allowDataOverflow"]
const HIT_SLACK = 4
const EMPTY_DATA = []
const PolarViewBoxContext = createContext(null)

const paletteColor = (i) => `var(--chart-${(i % PALETTE_SIZE) + 1})`
const configColor = (config, key) => {
  const item = key != null ? config?.[key] : null
  return item && (item.color || item.theme) ? `var(--color-${key})` : null
}
const isCell = (el) => isValidElement(el) && el.type?.chartRole === "cell"
const cellFills = (el) => Children.toArray(el.props.children).filter(isCell).map((cell) => cell.props.fill)
const round2 = (v) => Math.round(v * 100) / 100

function polarFrame({ margin, width, height, cx, cy, innerRadius, outerRadius }) {
  const innerW = Math.max(0, width - margin.left - margin.right)
  const innerH = Math.max(0, height - margin.top - margin.bottom)
  const maxRadius = Math.min(innerW, innerH) / 2
  const outer = Math.max(0, resolveLength(outerRadius, maxRadius, maxRadius * 0.8))
  return {
    cx: margin.left + resolveLength(cx, innerW, innerW / 2),
    cy: margin.top + resolveLength(cy, innerH, innerH / 2),
    maxRadius,
    innerRadius: Math.min(outer, Math.max(0, resolveLength(innerRadius, maxRadius, 0))),
    outerRadius: outer,
  }
}

function valueTicks(axis, columns, fallbackDomain = [0, "auto"]) {
  const tickCount = axis?.props.tickCount ?? 5
  const domain = resolveDomain(axis?.props.domain ?? fallbackDomain, extent(columns), tickCount, axis?.props.allowDataOverflow)
  const [lo, hi] = domain
  const ticks = (axis?.props.ticks ?? niceTicks(lo, hi, tickCount)).filter((t) => t >= lo && t <= hi)
  return { domain, ticks, clamp: (v) => Math.min(hi, Math.max(lo, v)) }
}

/*
 * Each Pie carries its own data. The first one drives the legend and the
 * keyboard; the pointer picks a pie by radius, and `focus(k)` is the same
 * layout with the tooltip view (category, payloadAt, anchorAt) on pie k.
 */
function pieLayout(ctx, series) {
  const { frame, config } = ctx
  const { cx, cy } = frame
  const entries = series.map((el, index) => {
    const { data, dataKey, nameKey, paddingAngle = 0 } = el.props
    const rows = Array.isArray(data) ? data : EMPTY_DATA
    const outer = Math.max(0, resolveLength(el.props.outerRadius, frame.maxRadius, frame.outerRadius))
    const inner = Math.min(outer, Math.max(0, resolveLength(el.props.innerRadius, frame.maxRadius, frame.innerRadius)))
    const startAngle = finite(el.props.startAngle) ?? ctx.startAngle
    const endAngle = finite(el.props.endAngle) ?? ctx.endAngle
    const values = rows.map((d) => finite(d?.[dataKey]))
    const names = rows.map((d, i) => (nameKey != null ? d?.[nameKey] : i))
    const cells = cellFills(el)
    const colors = rows.map((d, i) => cells[i] ?? d?.fill ?? el.props.fill ?? configColor(config, names[i]) ?? paletteColor(i))
    return {
      key: `pie:${dataKey}`,
      role: "pie",
      dataKey,
      nameKey,
      name: el.props.name ?? String(dataKey),
      index,
      data: rows,
      values,
      names,
      colors,
      slices: pieSlices(values, { startAngle, endAngle, paddingAngle }),
      inner,
      outer,
      startAngle,
      endAngle,
      props: el.props,
    }
  })
  const slice = (pie, i) => ({ ...pie.data[i], fill: pie.colors[i] })
  const views = entries.map((pie, k) => ({
    activeSeries: k,
    category: { labels: pie.names, count: pie.data.length },
    anchorAt: (i) => polarToCartesian(cx, cy, (pie.inner + pie.outer) / 2, pie.slices[i].mid),
    payloadAt: (i) => [
      { dataKey: pie.dataKey, name: pie.names[i], value: pie.values[i], color: pie.colors[i], fill: pie.colors[i], payload: slice(pie, i) },
    ],
  }))
  // Where pies overlap the topmost paint wins, as it would under a pointer.
  const seriesAt = (point) => {
    if (!point) return 0
    const [r] = cartesianToPolar(cx, cy, point.x, point.y)
    for (let k = entries.length - 1; k >= 0; k--) {
      if (r >= entries[k].inner && r <= entries[k].outer + HIT_SLACK) return k
    }
    return -1
  }
  const primary = entries[0]
  const layout = {
    ...ctx.base,
    activeSeries: 0,
    category: { labels: [], count: 0 },
    anchorAt: () => [cx, cy],
    payloadAt: () => [],
    ...views[0],
    series: entries,
    ...indexEntries(entries),
    indexAt: (point) => {
      const k = seriesAt(point)
      if (k < 0) return -1
      const [, angle] = cartesianToPolar(cx, cy, point.x, point.y)
      return sliceIndexAt(angle, entries[k].slices)
    },
    seriesAt,
    legendPayload: primary
      ? primary.data.map((_, i) => ({ dataKey: primary.nameKey, value: primary.names[i], color: primary.colors[i], type: "rect", payload: slice(primary, i) }))
      : [],
    angleItems: [],
    radiusItems: [],
    gridRadii: [],
    gridAngles: [],
  }
  const focused = [layout]
  layout.focus = (k) => {
    if (!views[k]) return layout
    if (!focused[k]) focused[k] = { ...layout, ...views[k] }
    return focused[k]
  }
  return layout
}

/* The angle axis is the category, spread evenly from startAngle; the radius axis is the value. */
function radarLayout(ctx, series) {
  const { frame, data, startAngle, endAngle, angleAxis, radiusAxis } = ctx
  const { cx, cy } = frame
  const count = data.length
  const step = count ? (endAngle - startAngle) / count : 0
  const angles = data.map((_, i) => startAngle + i * step)
  const entries = series.map((el, index) => {
    const { dataKey, name } = el.props
    return {
      key: `radar:${dataKey}`,
      role: "radar",
      dataKey,
      name: name ?? String(dataKey),
      index,
      values: data.map((d) => finite(d?.[dataKey])),
      color: el.props.stroke ?? el.props.fill ?? paletteColor(index),
      props: el.props,
    }
  })
  const { domain, ticks, clamp } = valueTicks(radiusAxis, entries.map((entry) => entry.values))
  const valueScale = linearScale(domain, [frame.innerRadius, frame.outerRadius])
  const key = angleAxis?.props.dataKey
  const labels = data.map((d, i) => (key != null ? d?.[key] : i))
  const radiusAt = (i) => Math.max(frame.outerRadius / 2, ...entries.map((entry) => (entry.values[i] == null ? 0 : valueScale(clamp(entry.values[i])))))
  return {
    ...ctx.base,
    category: { labels, count, angles },
    value: { domain, ticks, scale: valueScale },
    series: entries,
    ...indexEntries(entries),
    pointAt: (i, v) => polarToCartesian(cx, cy, valueScale(clamp(v)), angles[i]),
    indexAt: (point) => {
      const [r, angle] = cartesianToPolar(cx, cy, point.x, point.y)
      return r <= frame.outerRadius + HIT_SLACK ? nearestAngleIndex(angle, angles) : -1
    },
    anchorAt: (i) => polarToCartesian(cx, cy, radiusAt(i), angles[i]),
    payloadAt: (i) => entries.map((entry) => ({ dataKey: entry.dataKey, name: entry.name, value: entry.values[i], color: entry.color, fill: entry.color, payload: data[i] })),
    legendPayload: entries.map((entry) => ({ dataKey: entry.dataKey, value: entry.name, color: entry.color, type: "rect" })),
    angleItems: angles.map((angle, i) => ({ angle, label: labels[i] })),
    radiusItems: ticks.map((tick) => ({ radius: valueScale(tick), label: tick })),
    gridRadii: ticks.map((tick) => valueScale(tick)).filter((r) => r > 0),
    gridAngles: angles,
  }
}

/* One ring per row between innerRadius and outerRadius; the angle is the value. */
function radialLayout(ctx, series) {
  const { frame, data, startAngle, endAngle, angleAxis, radiusAxis, barCategoryGap, barGap } = ctx
  const { cx, cy } = frame
  const count = data.length
  const thickness = frame.outerRadius - frame.innerRadius
  const rings = bandScale(count, [frame.innerRadius, frame.outerRadius], {
    categoryGap: categoryGapFraction(barCategoryGap, count ? thickness / count : 0),
  })
  const entries = series.map((el, index) => {
    const { dataKey, name, stackId } = el.props
    const cells = cellFills(el)
    return {
      key: `radialbar:${dataKey}`,
      role: "radialbar",
      dataKey,
      name: name ?? String(dataKey),
      stackId,
      index,
      values: data.map((d) => finite(d?.[dataKey])),
      colors: data.map((d, i) => cells[i] ?? d?.fill ?? el.props.fill ?? paletteColor(series.length > 1 ? index : i)),
      color: el.props.fill ?? paletteColor(index),
      props: el.props,
      stack: null,
      slot: null,
    }
  })
  stackEntries(entries, () => true)
  const columns = entries.flatMap((entry) =>
    entry.stackId == null ? [entry.values] : [entry.stack.map((p) => p.y0), entry.stack.map((p) => p.y1)],
  )
  const { domain, ticks, clamp } = valueTicks(angleAxis, columns)
  const angleScale = linearScale(domain, [startAngle, endAngle])
  slotEntries(entries, rings.bandwidth, barGap)
  for (const entry of entries) {
    entry.arcs = entry.stack.map((p, i) => {
      const inner = rings.start(i) + entry.slot.offset
      return { inner, outer: inner + entry.slot.size, start: angleScale(clamp(p.y0)), end: angleScale(clamp(p.y1)) }
    })
  }
  // One track per ring and slot, drawn under every series so a later series'
  // track never covers an earlier bar.
  const backgrounds = []
  const tracked = new Set()
  for (const entry of entries) {
    const { background } = entry.props
    if (!background || tracked.has(entry.slotKey)) continue
    tracked.add(entry.slotKey)
    const bg = typeof background === "object" ? background : {}
    for (const arc of entry.arcs) backgrounds.push({ inner: arc.inner, outer: arc.outer, fill: bg.fill, fillOpacity: bg.fillOpacity })
  }
  const key = radiusAxis?.props.dataKey
  const labels = data.map((d, i) => (key != null ? d?.[key] : i))
  return {
    ...ctx.base,
    category: { labels, count },
    value: { domain, ticks, scale: angleScale },
    series: entries,
    ...indexEntries(entries),
    backgrounds,
    indexAt: (point) => {
      const [r] = cartesianToPolar(cx, cy, point.x, point.y)
      return r < frame.innerRadius - HIT_SLACK || r > frame.outerRadius + HIT_SLACK ? -1 : rings.indexAt(r)
    },
    anchorAt: (i) => {
      const arc = entries[0]?.arcs[i]
      return polarToCartesian(cx, cy, rings.center(i), arc ? (arc.start + arc.end) / 2 : startAngle)
    },
    payloadAt: (i) => entries.map((entry) => ({ dataKey: entry.dataKey, name: entry.name, value: entry.values[i], color: entry.colors[i], fill: entry.colors[i], payload: data[i] })),
    legendPayload: entries.map((entry) => ({ dataKey: entry.dataKey, value: entry.name, color: entry.color, type: "rect" })),
    angleItems: ticks.map((tick) => ({ angle: angleScale(tick), label: tick })),
    radiusItems: data.map((_, i) => ({ radius: rings.center(i), label: labels[i] })),
    gridRadii: [...data.map((_, i) => rings.start(i)), frame.outerRadius].filter((r) => r > 0),
    gridAngles: ticks.map((tick) => angleScale(tick)),
  }
}

function computePolarLayout({ kind, data, series, angleAxis, radiusAxis, config, margin, width, height, cx, cy, innerRadius, outerRadius, startAngle, endAngle, barCategoryGap, barGap }) {
  const frame = polarFrame({ margin, width, height, cx, cy, innerRadius, outerRadius })
  const ctx = {
    frame,
    data,
    config,
    startAngle,
    endAngle,
    angleAxis,
    radiusAxis,
    barCategoryGap,
    barGap,
    base: {
      kind,
      data,
      width,
      height,
      viewBox: { cx: frame.cx, cy: frame.cy, innerRadius: frame.innerRadius, outerRadius: frame.outerRadius, startAngle, endAngle },
      backgrounds: [],
    },
  }
  if (kind === "pie") return pieLayout(ctx, series)
  if (kind === "radar") return radarLayout(ctx, series)
  return radialLayout(ctx, series)
}

// A new array each render, so compare members: a Pie's data is a prop on the
// series element, not on the root.
function useSameList(list) {
  const ref = useRef(list)
  if (ref.current.length !== list.length || ref.current.some((item, i) => item !== list[i])) ref.current = list
  return ref.current
}

function PolarChart({
  kind,
  data = EMPTY_DATA,
  margin,
  cx = "50%",
  cy = "50%",
  innerRadius,
  outerRadius,
  startAngle,
  endAngle,
  barCategoryGap = "10%",
  barGap,
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

  const parts = collect(children, POLAR_PARTS)
  const series = parts.series.filter((el) => el.type.chartRole === kind)
  const foreign = parts.series.filter((el) => el.type.chartRole !== kind)
  const angleAxis = parts.polarangleaxis
  const radiusAxis = parts.polarradiusaxis
  const [defaultStart, defaultEnd] = POLAR_ANGLES[kind]
  const geometry = {
    kind,
    margin: { ...DEFAULT_MARGIN, ...margin },
    cx,
    cy,
    innerRadius,
    outerRadius,
    startAngle: finite(startAngle) ?? defaultStart,
    endAngle: finite(endAngle) ?? defaultEnd,
    barCategoryGap,
    barGap,
  }
  const seriesData = useSameList(series.map((el) => el.props.data))
  const signature = JSON.stringify({
    geometry,
    series: series.map((el) => [...pick(el.props, POLAR_SERIES_SIG_KEYS), cellFills(el)]),
    angleAxis: angleAxis && pick(angleAxis.props, POLAR_AXIS_SIG_KEYS),
    radiusAxis: radiusAxis && pick(radiusAxis.props, POLAR_AXIS_SIG_KEYS),
  })
  const computed = useMemo(
    () => computePolarLayout({ ...geometry, data, series, angleAxis, radiusAxis, config: chart.config, width, height }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data, seriesData, chart.config, width, height, signature],
  )

  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => {
      for (const el of parts.duplicates) {
        console.warn(`<${componentName(el)}> declared twice in one chart; only the first is used.`)
      }
      for (const el of foreign) {
        console.warn(`<${componentName(el)}> belongs in a different chart root and was ignored: Pie in PieChart, Radar in RadarChart, RadialBar in RadialBarChart.`)
      }
      for (const el of parts.unknown) {
        console.warn(
          `<${componentName(el)}> is not a polar chart primitive and was ignored. A wrapper around <Pie>, <Radar> or <RadialBar> is ` +
            "invisible to the chart; render the primitives as direct children or inside a Fragment.",
        )
      }
      for (const el of parts.stray) {
        console.warn(`<${componentName(el)}> must be a child of a series or a <PolarRadiusAxis>; at the chart root it draws nothing.`)
      }
      for (const key of computed.duplicateKeys) {
        console.warn(`Two series share ${key}; the second is ignored. Give each series its own dataKey.`)
      }
    }, [parts.duplicates.length, foreign.length, parts.unknown.length, parts.stray.length, computed])
  }

  const tooltipEl = parts.tooltip
  const { activeIndex, pointer, layoutRef, surface, keyboard } = useActiveIndex({
    count: computed.category.count,
    defaultIndex: tooltipEl?.props.defaultIndex,
    indexAt: computed.indexAt,
  })

  const legendEl = parts.legend
  const legendTop = legendEl && legendEl.props.verticalAlign === "top"
  const a11y = surfaceA11y(accessibilityLayer, ariaLabel != null || ariaLabelledBy != null, keyboard)
  const { viewBox } = computed
  const hostLayout = computed.focus ? computed.focus(computed.seriesAt(pointer.point)) : computed

  return (
    <LayoutContext.Provider value={hostLayout}>
      <ActiveIndexContext.Provider value={activeIndex}>
        <PointerContext.Provider value={pointer}>
          <PolarViewBoxContext.Provider value={viewBox}>
            <div ref={layoutRef} className={cn("chart-layout", className)} data-layout={kind} {...props}>
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
                  {parts.polargrid}
                  {computed.backgrounds.length ? (
                    <g className="chart-background">
                      {computed.backgrounds.map((track, i) => (
                        <path
                          key={i}
                          className="chart-sector chart-sector--background"
                          d={arcPath(viewBox.cx, viewBox.cy, track.inner, track.outer, viewBox.startAngle, viewBox.endAngle)}
                          fill={track.fill ?? "var(--muted)"}
                          fillOpacity={track.fillOpacity}
                        />
                      ))}
                    </g>
                  ) : null}
                  {series}
                  {angleAxis}
                  {radiusAxis}
                </svg>
                {tooltipEl}
              </div>
              {legendEl && !legendTop ? legendEl : null}
            </div>
          </PolarViewBoxContext.Provider>
        </PointerContext.Provider>
      </ActiveIndexContext.Provider>
    </LayoutContext.Provider>
  )
}

export function PieChart({ children, ...props }) {
  return (
    <PolarChart {...props} kind="pie">
      {children}
    </PolarChart>
  )
}

export function RadarChart({ children, ...props }) {
  return (
    <PolarChart {...props} kind="radar">
      {children}
    </PolarChart>
  )
}

export function RadialBarChart({ children, ...props }) {
  return (
    <PolarChart {...props} kind="radialbar">
      {children}
    </PolarChart>
  )
}

// ── Series ──────────────────────────────────────────────────────────

function cornerRadii(radius, width, height) {
  const max = Math.min(width, height) / 2
  const list = Array.isArray(radius) ? radius : [radius, radius, radius, radius]
  return list.map((r) => Math.max(0, Math.min(max, Number(r) || 0)))
}

function roundedRectPath({ x, y, width, height }, radius) {
  if (!(width > 0) || !(height > 0)) return ""
  const [tl, tr, br, bl] = cornerRadii(radius, width, height)
  const arc = (r, dx, dy) => (r ? ` A ${r} ${r} 0 0 1 ${dx} ${dy}` : "")
  const right = x + width
  const bottom = y + height
  return (
    `M ${x + tl} ${y} H ${right - tr}${arc(tr, right, y + tr)}` +
    ` V ${bottom - br}${arc(br, right - br, bottom)}` +
    ` H ${x + bl}${arc(bl, x, bottom - bl)}` +
    ` V ${y + tl}${arc(tl, x + tl, y)} Z`
  )
}

export function Bar({ dataKey, name, fill, fillOpacity, radius = 0, stackId, barSize, maxBarSize, className, children, ...props }) {
  const layout = useContext(LayoutContext)
  const entry = layout?.byKey.get(`bar:${dataKey}`)
  if (!layout || !entry || !entry.slot) return null
  const { category, value, vertical } = layout
  const color = fill ?? entry.color
  const bars = entry.stack.map((p, i) => {
    if (entry.values[i] == null) return null
    const start = category.scale.start(i) + entry.slot.offset
    const a = value.scale(p.y0)
    const b = value.scale(p.y1)
    const rect = vertical
      ? { x: Math.min(a, b), y: start, width: Math.abs(b - a), height: entry.slot.size }
      : { x: start, y: Math.min(a, b), width: entry.slot.size, height: Math.abs(b - a) }
    const d = roundedRectPath(rect, radius)
    if (!d) return null
    return <path key={i} className="chart-bar" data-index={i} d={d} fill={color} fillOpacity={fillOpacity} />
  })
  const points = entry.stack.map((p, i) => (entry.values[i] == null ? null : layout.pointAt(i, p.y1)))
  return (
    <g className={cn("chart-series", className)} data-key={dataKey} data-role="bar" {...props}>
      {bars}
      {children ? <SeriesContext.Provider value={{ entry, points }}>{children}</SeriesContext.Provider> : null}
    </g>
  )
}
Bar.chartRole = "bar"

function Dots({ points, dot, color, active, activeDot }) {
  const dotProps = typeof dot === "object" && dot ? dot : {}
  const activeProps = typeof activeDot === "object" && activeDot ? activeDot : {}
  const activePoint = activeDot && active != null ? points[active] : null
  return (
    <>
      {dot
        ? points.map(
            (p, i) =>
              p && (
                <circle
                  key={i}
                  className="chart-dot"
                  data-index={i}
                  cx={p[0]}
                  cy={p[1]}
                  r={dotProps.r ?? 3}
                  stroke={dotProps.stroke ?? color}
                  strokeWidth={dotProps.strokeWidth ?? 2}
                  fill={dotProps.fill ?? "var(--background)"}
                />
              ),
          )
        : null}
      {activePoint ? (
        <circle
          className="chart-dot chart-dot--active"
          cx={activePoint[0]}
          cy={activePoint[1]}
          r={activeProps.r ?? 4}
          stroke={activeProps.stroke ?? "var(--background)"}
          strokeWidth={activeProps.strokeWidth ?? 2}
          fill={activeProps.fill ?? color}
        />
      ) : null}
    </>
  )
}

export function Line({
  dataKey,
  name,
  stroke,
  strokeWidth = 2,
  strokeDasharray,
  type = "linear",
  dot = true,
  activeDot = true,
  connectNulls = false,
  className,
  children,
  ...props
}) {
  const layout = useContext(LayoutContext)
  const active = useContext(ActiveIndexContext)
  const entry = layout?.byKey.get(`line:${dataKey}`)
  if (!layout || !entry) return null
  const color = stroke ?? entry.color
  const points = entry.values.map((v, i) => (v == null ? null : layout.pointAt(i, v)))
  return (
    <g className={cn("chart-series", className)} data-key={dataKey} data-role="line" {...props}>
      <path
        className="chart-line"
        d={linePath(points, type, connectNulls)}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={strokeDasharray}
      />
      <Dots points={points} dot={dot} color={color} active={active} activeDot={activeDot} />
      {children ? <SeriesContext.Provider value={{ entry, points }}>{children}</SeriesContext.Provider> : null}
    </g>
  )
}
Line.chartRole = "line"

export function Area({
  dataKey,
  name,
  type = "linear",
  fill,
  fillOpacity = 0.4,
  stroke,
  strokeWidth = 1.5,
  strokeDasharray,
  stackId,
  dot = false,
  activeDot = true,
  connectNulls = false,
  className,
  children,
  ...props
}) {
  const layout = useContext(LayoutContext)
  const active = useContext(ActiveIndexContext)
  const entry = layout?.byKey.get(`area:${dataKey}`)
  if (!layout || !entry) return null
  const color = stroke ?? entry.color
  const upper = entry.stack.map((p, i) => (entry.values[i] == null ? null : layout.pointAt(i, p.y1)))
  const lower = entry.stack.map((p, i) => (entry.values[i] == null ? null : layout.pointAt(i, layout.clampValue(p.y0))))
  const runs = []
  let run = []
  upper.forEach((p, i) => {
    if (p) run.push(i)
    else if (!connectNulls && run.length) {
      runs.push(run)
      run = []
    }
  })
  if (run.length) runs.push(run)
  const areaD = runs
    .map((indices) =>
      areaPath(
        indices.map((i) => upper[i]),
        indices.map((i) => lower[i]),
        type,
      ),
    )
    .join(" ")
  return (
    <g className={cn("chart-series", className)} data-key={dataKey} data-role="area" {...props}>
      <path className="chart-area" d={areaD} fill={fill ?? entry.color} fillOpacity={fillOpacity} />
      <path
        className="chart-line"
        d={linePath(upper, type, connectNulls)}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={strokeDasharray}
      />
      <Dots points={upper} dot={dot} color={color} active={active} activeDot={activeDot} />
      {children ? <SeriesContext.Provider value={{ entry, points: upper }}>{children}</SeriesContext.Provider> : null}
    </g>
  )
}
Area.chartRole = "area"

const LABEL_ANCHORS = {
  top: { dx: 0, dy: -1, anchor: "middle", baseline: "auto" },
  bottom: { dx: 0, dy: 1, anchor: "middle", baseline: "hanging" },
  left: { dx: -1, dy: 0, anchor: "end", baseline: "middle" },
  right: { dx: 1, dy: 0, anchor: "start", baseline: "middle" },
  inside: { dx: 0, dy: 0, anchor: "middle", baseline: "middle", inside: true },
  center: { dx: 0, dy: 0, anchor: "middle", baseline: "middle", inside: true },
  insideTop: { dx: 0, dy: 1, anchor: "middle", baseline: "hanging", inside: true },
  insideBottom: { dx: 0, dy: -1, anchor: "middle", baseline: "auto", inside: true },
  insideLeft: { dx: 1, dy: 0, anchor: "start", baseline: "middle", inside: true },
  insideRight: { dx: -1, dy: 0, anchor: "end", baseline: "middle", inside: true },
}

export function LabelList({ dataKey, position = "top", offset = 5, formatter, fill, className, ...props }) {
  const layout = useContext(LayoutContext)
  const series = useContext(SeriesContext)
  const pathId = useId().replace(/[^\w-]/g, "")
  if (!layout || !series) return null
  const { entry, points } = series
  const rows = series.data ?? layout.data
  const spec = LABEL_ANCHORS[position] ?? LABEL_ANCHORS.top
  const labels = points.map((p, i) => {
    if (!p) return null
    const raw = dataKey != null ? rows[i]?.[dataKey] : entry.values[i]
    if (raw == null) return null
    const text = formatter ? formatter(raw) : typeof raw === "number" ? raw.toLocaleString() : String(raw)
    if (series.place) {
      const at = series.place(i, position, offset)
      if (at.arc) {
        const id = `${pathId}-${i}`
        return (
          <g key={i} className="chart-label-arc" data-index={i}>
            <path id={id} d={at.arc} fill="none" stroke="none" />
            <text className={cn("chart-label", className)} dominantBaseline="middle" style={fill ? { fill } : undefined}>
              <textPath href={`#${id}`} startOffset={at.startOffset} textAnchor={at.anchor}>
                {text}
              </textPath>
            </text>
          </g>
        )
      }
      return (
        <text
          key={i}
          className={cn("chart-label", className)}
          data-index={i}
          x={at.x}
          y={at.y}
          textAnchor={at.anchor}
          dominantBaseline={at.baseline}
          style={fill ? { fill } : undefined}
        >
          {text}
        </text>
      )
    }
    let [x, y] = p
    if (spec.inside && entry.role === "bar") {
      const [bx, by] = layout.pointAt(i, entry.stack[i].y0)
      if (position === "inside" || position === "center") {
        x = (x + bx) / 2
        y = (y + by) / 2
      } else if (layout.vertical) {
        x = spec.dx > 0 ? Math.min(x, bx) + offset : Math.max(x, bx) - offset
      } else {
        y = spec.dy > 0 ? Math.min(y, by) + offset : Math.max(y, by) - offset
      }
    } else if (!spec.inside) {
      x += spec.dx * offset
      y += spec.dy * offset
    }
    return (
      <text
        key={i}
        className={cn("chart-label", className)}
        data-index={i}
        x={x}
        y={y}
        textAnchor={spec.anchor}
        dominantBaseline={spec.baseline}
        style={fill ? { fill } : undefined}
      >
        {text}
      </text>
    )
  })
  return (
    <g className="chart-labels" {...props}>
      {labels}
    </g>
  )
}
LabelList.chartRole = "label"

// ── Axes and grid ───────────────────────────────────────────────────

const TEXT_WIDTH_PER_CHAR = 7
const TEXT_HEIGHT = 14

function keptTicks(interval, positions, texts, minTickGap, alongY) {
  if (typeof interval === "number") return positions.map((_, i) => i % (interval + 1) === 0)
  const widths = alongY ? positions.map(() => TEXT_HEIGHT) : texts.map((t) => t.length * TEXT_WIDTH_PER_CHAR)
  return thinTicks(positions, widths, minTickGap)
}

function AxisGroup({ axis, side, tickLine, axisLine, tickMargin, tickSize, tickFormatter, interval, minTickGap, className, ...props }) {
  const { plot } = useContext(LayoutContext)
  const items =
    axis.labels !== undefined
      ? axis.labels.map((label, i) => ({ pos: axis.scale.center(i), label }))
      : axis.ticks.map((tick) => ({ pos: axis.scale(tick), label: tick }))
  const texts = items.map((item, i) => String(tickFormatter ? tickFormatter(item.label, i) : item.label))
  const alongY = side === "left"
  const keep = keptTicks(interval, items.map((item) => item.pos), texts, minTickGap, alongY)
  const tickLen = tickLine ? tickSize : 0
  const base = alongY ? plot.x : plot.y + plot.height
  return (
    <g className={cn("chart-axis", className)} data-axis={alongY ? "y" : "x"} {...props}>
      {axisLine ? (
        alongY ? (
          <line className="chart-axis-line" x1={base} x2={base} y1={plot.y} y2={plot.y + plot.height} />
        ) : (
          <line className="chart-axis-line" x1={plot.x} x2={plot.x + plot.width} y1={base} y2={base} />
        )
      ) : null}
      {items.map((item, i) =>
        keep[i] ? (
          <g key={i} className="chart-tick-group" data-index={i}>
            {tickLine ? (
              alongY ? (
                <line className="chart-tick" x1={base - tickSize} x2={base} y1={item.pos} y2={item.pos} />
              ) : (
                <line className="chart-tick" x1={item.pos} x2={item.pos} y1={base} y2={base + tickSize} />
              )
            ) : null}
            {alongY ? (
              <text className="chart-tick-text" x={base - tickLen - tickMargin} y={item.pos} textAnchor="end" dominantBaseline="middle">
                {texts[i]}
              </text>
            ) : (
              <text className="chart-tick-text" x={item.pos} y={base + tickLen + tickMargin} textAnchor="middle" dominantBaseline="hanging">
                {texts[i]}
              </text>
            )}
          </g>
        ) : null,
      )}
    </g>
  )
}

export function XAxis({
  dataKey,
  type,
  hide = false,
  tickLine = true,
  axisLine = true,
  tickMargin = 2,
  tickSize = 6,
  tickFormatter,
  tickCount,
  ticks,
  domain,
  allowDataOverflow,
  interval = "preserveStartEnd",
  minTickGap = 5,
  height = 30,
  ...props
}) {
  const layout = useContext(LayoutContext)
  if (!layout || hide) return null
  const axis = layout.category.axis === "x" ? layout.category : layout.value
  return (
    <AxisGroup
      axis={axis}
      side="bottom"
      tickLine={tickLine}
      axisLine={axisLine}
      tickMargin={tickMargin}
      tickSize={tickSize}
      tickFormatter={tickFormatter}
      interval={interval}
      minTickGap={minTickGap}
      {...props}
    />
  )
}
XAxis.chartRole = "xaxis"

export function YAxis({
  dataKey,
  type,
  hide = false,
  tickLine = true,
  axisLine = true,
  tickMargin = 2,
  tickSize = 6,
  tickFormatter,
  tickCount,
  ticks,
  domain,
  allowDataOverflow,
  interval = "preserveStartEnd",
  minTickGap = 5,
  width = 60,
  ...props
}) {
  const layout = useContext(LayoutContext)
  if (!layout || hide) return null
  const axis = layout.category.axis === "y" ? layout.category : layout.value
  return (
    <AxisGroup
      axis={axis}
      side="left"
      tickLine={tickLine}
      axisLine={axisLine}
      tickMargin={tickMargin}
      tickSize={tickSize}
      tickFormatter={tickFormatter}
      interval={interval}
      minTickGap={minTickGap}
      {...props}
    />
  )
}
YAxis.chartRole = "yaxis"

export function CartesianGrid({ horizontal = true, vertical = true, strokeDasharray = "3 3", className, ...props }) {
  const layout = useContext(LayoutContext)
  if (!layout) return null
  const { plot, category, value } = layout
  const categoryPositions = category.centers
  const valuePositions = value.ticks.map((tick) => value.scale(tick))
  const xs = layout.vertical ? valuePositions : categoryPositions
  const ys = layout.vertical ? categoryPositions : valuePositions
  return (
    <g className={cn("chart-grid", className)} strokeDasharray={strokeDasharray} {...props}>
      {horizontal ? ys.map((y, i) => <line key={`h${i}`} x1={plot.x} x2={plot.x + plot.width} y1={y} y2={y} />) : null}
      {vertical ? xs.map((x, i) => <line key={`v${i}`} x1={x} x2={x} y1={plot.y} y2={plot.y + plot.height} />) : null}
    </g>
  )
}
CartesianGrid.chartRole = "grid"

// ── Polar series, axes and grid ─────────────────────────────────────

const RADIAN = Math.PI / 180
// A sector's edge is the page behind it, so strokeWidth reads as a gap
// between slices; the default width is 0 so slices meet.
const SECTOR_STROKE = "var(--background)"

// Text placed away from the centre reads outward: anchor and baseline follow
// the direction it was pushed in.
function outwardText(angle) {
  const cos = Math.cos(angle * RADIAN)
  const sin = Math.sin(angle * RADIAN)
  return {
    anchor: cos > 0.2 ? "start" : cos < -0.2 ? "end" : "middle",
    baseline: sin > 0.2 ? "auto" : sin < -0.2 ? "hanging" : "middle",
  }
}

const sectorAttrs = (i, arc) => ({ "data-index": i, "data-start": round2(arc.start), "data-end": round2(arc.end) })

/*
 * One sector under Recharts' name, the shape an activeShape renders with.
 * The data fields a Pie hands along (midAngle, index, value, name, percent,
 * payload) are consumed here so they never reach the DOM.
 */
export function Sector({
  cx,
  cy,
  innerRadius,
  outerRadius,
  startAngle,
  endAngle,
  cornerRadius = 0,
  midAngle,
  index,
  value,
  name,
  percent,
  payload,
  className,
  ...props
}) {
  const d = arcPath(cx, cy, innerRadius, outerRadius, startAngle, endAngle, cornerRadius)
  if (!d) return null
  return <path className={cn("chart-sector", className)} data-index={index} data-start={round2(startAngle)} data-end={round2(endAngle)} d={d} {...props} />
}

/* Recharts' shape slots: an element is cloned over the geometry, a function renders it, an object overrides it. */
function renderShape(option, props) {
  if (isValidElement(option)) return cloneElement(option, props)
  if (typeof option === "function") return option(props) ?? null
  return <Sector {...props} {...(typeof option === "object" && option ? option : null)} />
}

function renderSliceLabel(option, props) {
  if (isValidElement(option)) return cloneElement(option, props)
  let text = props.value
  if (typeof option === "function") {
    text = option(props)
    if (isValidElement(text)) return text
  }
  if (text == null) return null
  const { offsetRadius, fill, className, ...custom } = typeof option === "object" && option ? option : {}
  return (
    <text
      className={cn("chart-label", className)}
      x={props.x}
      y={props.y}
      textAnchor={props.textAnchor}
      dominantBaseline={props.dominantBaseline}
      style={fill ? { fill } : undefined}
      {...custom}
    >
      {typeof text === "number" ? text.toLocaleString() : String(text)}
    </text>
  )
}

function renderLabelLine(option, props) {
  if (isValidElement(option)) return cloneElement(option, props)
  if (typeof option === "function") return option(props) ?? null
  const { className, stroke, ...custom } = typeof option === "object" && option ? option : {}
  const [from, to] = props.points
  return (
    <path
      className={cn("chart-label-line", className)}
      d={`M ${round2(from.x)} ${round2(from.y)} L ${round2(to.x)} ${round2(to.y)}`}
      stroke={stroke ?? props.fill}
      {...custom}
    />
  )
}

export function Pie({
  data,
  dataKey,
  nameKey,
  innerRadius,
  outerRadius,
  startAngle,
  endAngle,
  paddingAngle,
  cornerRadius = 0,
  fill,
  stroke,
  strokeWidth = 0,
  label = false,
  labelLine = true,
  activeIndex,
  activeShape,
  inactiveShape,
  className,
  children,
  ...props
}) {
  const layout = useContext(LayoutContext)
  const hovered = useContext(ActiveIndexContext)
  const entry = layout?.byKey.get(`pie:${dataKey}`)
  if (!layout || !entry) return null
  const { cx, cy } = layout.viewBox
  const midRadius = (entry.inner + entry.outer) / 2
  const edge = stroke ?? SECTOR_STROKE
  const total = entry.slices.reduce((sum, slice) => sum + slice.value, 0)
  // A controlled activeIndex wins over the pointer, as in Recharts; the
  // pointer reaches only the pie it is over.
  const active = activeIndex !== undefined ? activeIndex : layout.activeSeries === entry.index ? hovered : null
  const isActive = (i) => (Array.isArray(active) ? active.includes(i) : active === i)
  const hasActive = Array.isArray(active) ? active.length > 0 : active != null && active >= 0
  const shapeProps = (slice, i) => ({
    cx,
    cy,
    innerRadius: entry.inner,
    outerRadius: entry.outer,
    startAngle: slice.start,
    endAngle: slice.end,
    midAngle: slice.mid,
    cornerRadius,
    fill: entry.colors[i],
    stroke: edge,
    strokeWidth,
    index: i,
    value: entry.values[i],
    name: entry.names[i],
    percent: total ? slice.value / total : 0,
    payload: entry.data[i],
  })
  const sectors = entry.slices.map((slice, i) => {
    if (!(slice.value > 0)) return null
    const shape = shapeProps(slice, i)
    if (activeShape && isActive(i)) {
      return (
        <g key={i} className="chart-sector-active" data-index={i}>
          {renderShape(activeShape, shape)}
        </g>
      )
    }
    if (inactiveShape && hasActive && !isActive(i)) {
      return (
        <g key={i} className="chart-sector-inactive" data-index={i}>
          {renderShape(inactiveShape, shape)}
        </g>
      )
    }
    return <Sector key={i} {...shape} />
  })
  const points = entry.slices.map((slice) => (slice.value > 0 ? polarToCartesian(cx, cy, midRadius, slice.mid) : null))
  const place = (i, position, offset) => {
    const { mid } = entry.slices[i]
    if (position === "outside") {
      const [x, y] = polarToCartesian(cx, cy, entry.outer + offset, mid)
      return { x, y, ...outwardText(mid) }
    }
    const [x, y] = polarToCartesian(cx, cy, midRadius, mid)
    return { x, y, anchor: "middle", baseline: "middle" }
  }
  // Recharts draws `label` at outerRadius + 20 along the mid angle, with
  // `labelLine` from the edge out to it in the slice colour.
  const labelOffset = finite(label?.offsetRadius) ?? 20
  const sliceLabels = label
    ? entry.slices.map((slice, i) => {
        if (!(slice.value > 0)) return null
        const at = place(i, "outside", labelOffset)
        const [ex, ey] = polarToCartesian(cx, cy, entry.outer, slice.mid)
        const shape = { ...shapeProps(slice, i), stroke: "none", x: at.x, y: at.y, textAnchor: at.anchor, dominantBaseline: at.baseline }
        return (
          <g key={i} className="chart-pie-label" data-index={i}>
            {labelLine ? renderLabelLine(labelLine, { ...shape, points: [{ x: ex, y: ey }, { x: at.x, y: at.y }] }) : null}
            {renderSliceLabel(label, shape)}
          </g>
        )
      })
    : null
  const labels = Children.toArray(children).filter((child) => !isCell(child))
  return (
    <g
      className={cn("chart-series", className)}
      data-key={dataKey}
      data-role="pie"
      data-cx={round2(cx)}
      data-cy={round2(cy)}
      data-inner={round2(entry.inner)}
      data-outer={round2(entry.outer)}
      {...props}
    >
      {sectors}
      {sliceLabels}
      {labels.length ? (
        <PolarViewBoxContext.Provider
          value={{ cx, cy, innerRadius: entry.inner, outerRadius: entry.outer, startAngle: entry.startAngle, endAngle: entry.endAngle }}
        >
          <SeriesContext.Provider value={{ entry, points, data: entry.data, place }}>{labels}</SeriesContext.Provider>
        </PolarViewBoxContext.Provider>
      ) : null}
    </g>
  )
}
Pie.chartRole = "pie"

export function Radar({ dataKey, name, fill, fillOpacity, stroke, strokeWidth, strokeDasharray, dot = false, className, children, ...props }) {
  const layout = useContext(LayoutContext)
  const entry = layout?.byKey.get(`radar:${dataKey}`)
  if (!layout || !entry) return null
  const { cx, cy } = layout.viewBox
  const points = entry.values.map((v, i) => (v == null ? null : layout.pointAt(i, v)))
  const dotProps = typeof dot === "object" && dot ? dot : {}
  const place = (i, position, offset) => {
    const angle = layout.category.angles[i]
    const [r] = cartesianToPolar(cx, cy, points[i][0], points[i][1])
    const inward = position === "inside" || position === "center"
    const [x, y] = polarToCartesian(cx, cy, Math.max(0, r + (inward ? -offset : offset)), angle)
    return { x, y, ...outwardText(inward ? angle + 180 : angle) }
  }
  return (
    <g className={cn("chart-series", className)} data-key={dataKey} data-role="radar" {...props}>
      <path
        className="chart-radar"
        d={radarPath(points)}
        fill={fill ?? entry.color}
        fillOpacity={fillOpacity}
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeDasharray={strokeDasharray}
      />
      {dot
        ? points.map(
            (p, i) =>
              p && (
                <circle
                  key={i}
                  className="chart-dot"
                  data-index={i}
                  cx={p[0]}
                  cy={p[1]}
                  r={dotProps.r ?? 3}
                  fill={dotProps.fill ?? fill ?? entry.color}
                  fillOpacity={dotProps.fillOpacity ?? fillOpacity}
                  stroke={dotProps.stroke}
                  strokeWidth={dotProps.strokeWidth}
                />
              ),
          )
        : null}
      {children ? <SeriesContext.Provider value={{ entry, points, data: layout.data, place }}>{children}</SeriesContext.Provider> : null}
    </g>
  )
}
Radar.chartRole = "radar"

export function RadialBar({
  dataKey,
  name,
  fill,
  background = false,
  cornerRadius = 0,
  stackId,
  barSize,
  maxBarSize,
  stroke,
  strokeWidth = 0,
  className,
  children,
  ...props
}) {
  const layout = useContext(LayoutContext)
  const entry = layout?.byKey.get(`radialbar:${dataKey}`)
  if (!layout || !entry || !entry.arcs) return null
  const { cx, cy } = layout.viewBox
  const edge = stroke ?? SECTOR_STROKE
  const bars = entry.arcs.map((arc, i) => {
    const d = entry.values[i] == null ? "" : arcPath(cx, cy, arc.inner, arc.outer, arc.start, arc.end, cornerRadius)
    if (!d) return null
    return <path key={i} className="chart-sector" {...sectorAttrs(i, arc)} d={d} fill={entry.colors[i]} stroke={edge} strokeWidth={strokeWidth} />
  })
  const points = entry.arcs.map((arc, i) =>
    entry.values[i] == null ? null : polarToCartesian(cx, cy, (arc.inner + arc.outer) / 2, (arc.start + arc.end) / 2),
  )
  // Radial labels follow their ring on a text path; `offset` is in degrees.
  const place = (i, position, offset) => {
    const arc = entry.arcs[i]
    const r = (arc.inner + arc.outer) / 2
    const dir = Math.sign(arc.end - arc.start) || Math.sign(layout.viewBox.endAngle - layout.viewBox.startAngle) || 1
    let from = arc.start
    let to = arc.end
    let startOffset = "50%"
    let anchor = "middle"
    if (position === "insideStart") {
      from = arc.start + dir * offset
      startOffset = "0%"
      anchor = "start"
    } else if (position === "insideEnd") {
      to = arc.end - dir * offset
      startOffset = "100%"
      anchor = "end"
    } else if (position === "end") {
      from = arc.end + dir * offset
      to = from + dir * 180
      startOffset = "0%"
      anchor = "start"
    }
    return { arc: arcLinePath(cx, cy, r, from, to), startOffset, anchor }
  }
  const labels = Children.toArray(children).filter((child) => !isCell(child))
  return (
    <g className={cn("chart-series", className)} data-key={dataKey} data-role="radialbar" data-cx={round2(cx)} data-cy={round2(cy)} {...props}>
      {bars}
      {labels.length ? <SeriesContext.Provider value={{ entry, points, data: layout.data, place }}>{labels}</SeriesContext.Provider> : null}
    </g>
  )
}
RadialBar.chartRole = "radialbar"

/* A per-datum override read by the Pie or RadialBar it sits in; draws nothing itself. */
export function Cell() {
  return null
}
Cell.chartRole = "cell"

/*
 * A single label over the polar view box. `content` gets { viewBox: { cx, cy,
 * innerRadius, outerRadius, startAngle, endAngle } }, which is how upstream's
 * donut centres its total; a plain `value` is drawn at the centre.
 */
export function Label({ content, value, className, ...props }) {
  const viewBox = useContext(PolarViewBoxContext)
  if (!viewBox) return null
  if (typeof content === "function") return content({ viewBox, ...props }) ?? null
  if (isValidElement(content)) return cloneElement(content, { viewBox, ...props })
  if (value == null) return null
  return (
    <text className={cn("chart-label", className)} x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle" {...props}>
      {value}
    </text>
  )
}
Label.chartRole = "label"

export function PolarGrid({ gridType = "polygon", radialLines = true, polarAngles, polarRadius, className, ...props }) {
  const layout = useContext(LayoutContext)
  if (!layout?.viewBox) return null
  const { cx, cy, innerRadius, outerRadius } = layout.viewBox
  const angles = polarAngles ?? layout.gridAngles
  const radii = polarRadius ?? layout.gridRadii
  return (
    <g className={cn("chart-polar-grid", className)} {...props}>
      {radii.map((r, i) => (
        <path key={`r${i}`} className="chart-polar-ring" d={polarGridPath(cx, cy, r, angles, gridType)} />
      ))}
      {radialLines
        ? angles.map((angle, i) => {
            const [x1, y1] = polarToCartesian(cx, cy, innerRadius, angle)
            const [x2, y2] = polarToCartesian(cx, cy, outerRadius, angle)
            return <line key={`a${i}`} className="chart-polar-spoke" x1={x1} y1={y1} x2={x2} y2={y2} />
          })
        : null}
    </g>
  )
}
PolarGrid.chartRole = "polargrid"

export function PolarAngleAxis({
  dataKey,
  type,
  domain,
  ticks,
  tickCount,
  allowDataOverflow,
  hide = false,
  tick = true,
  tickLine = true,
  axisLine = true,
  tickSize = 8,
  tickFormatter,
  className,
  ...props
}) {
  const layout = useContext(LayoutContext)
  if (!layout?.viewBox || hide) return null
  const { cx, cy, outerRadius } = layout.viewBox
  const items = layout.angleItems
  return (
    <g className={cn("chart-axis", className)} data-axis="angle" {...props}>
      {axisLine ? (
        <path
          className="chart-axis-line"
          d={polarGridPath(
            cx,
            cy,
            outerRadius,
            items.map((item) => item.angle),
            "polygon",
          )}
        />
      ) : null}
      {items.map((item, i) => {
        const [x1, y1] = polarToCartesian(cx, cy, outerRadius, item.angle)
        const [x2, y2] = polarToCartesian(cx, cy, outerRadius + tickSize, item.angle)
        const [tx, ty] = polarToCartesian(cx, cy, outerRadius + tickSize + 4, item.angle)
        const { anchor, baseline } = outwardText(item.angle)
        return (
          <g key={i} className="chart-tick-group" data-index={i}>
            {tickLine ? <line className="chart-tick" x1={x1} y1={y1} x2={x2} y2={y2} /> : null}
            {tick ? (
              <text className="chart-tick-text" x={tx} y={ty} textAnchor={anchor} dominantBaseline={baseline}>
                {String(tickFormatter ? tickFormatter(item.label, i) : item.label)}
              </text>
            ) : null}
          </g>
        )
      })}
    </g>
  )
}
PolarAngleAxis.chartRole = "polarangleaxis"

export function PolarRadiusAxis({
  dataKey,
  type,
  domain,
  ticks,
  tickCount,
  allowDataOverflow,
  angle = 0,
  orientation = "right",
  hide = false,
  tick = true,
  tickLine = true,
  axisLine = true,
  tickSize = 6,
  tickMargin = 2,
  tickFormatter,
  className,
  children,
  ...props
}) {
  const layout = useContext(LayoutContext)
  if (!layout?.viewBox || hide) return null
  const { cx, cy, innerRadius, outerRadius } = layout.viewBox
  const [x1, y1] = polarToCartesian(cx, cy, innerRadius, angle)
  const [x2, y2] = polarToCartesian(cx, cy, outerRadius, angle)
  // Looking outward along the axis, "right" is the clockwise side.
  const side = orientation === "left" ? angle + 90 : angle - 90
  const centred = orientation === "middle"
  const [ux, uy] = polarToCartesian(0, 0, 1, side)
  return (
    <g className={cn("chart-axis", className)} data-axis="radius" {...props}>
      {axisLine ? <line className="chart-axis-line" x1={x1} y1={y1} x2={x2} y2={y2} /> : null}
      {layout.radiusItems.map((item, i) => {
        const [px, py] = polarToCartesian(cx, cy, item.radius, angle)
        const reach = centred ? 0 : (tickLine ? tickSize : 0) + tickMargin
        const { anchor, baseline } = centred ? { anchor: "middle", baseline: "middle" } : outwardText(side)
        return (
          <g key={i} className="chart-tick-group" data-index={i}>
            {tickLine && !centred ? <line className="chart-tick" x1={px} y1={py} x2={px + ux * tickSize} y2={py + uy * tickSize} /> : null}
            {tick ? (
              <text className="chart-tick-text" x={px + ux * reach} y={py + uy * reach} textAnchor={anchor} dominantBaseline={baseline}>
                {String(tickFormatter ? tickFormatter(item.label, i) : item.label)}
              </text>
            ) : null}
          </g>
        )
      })}
      {children}
    </g>
  )
}
PolarRadiusAxis.chartRole = "polarradiusaxis"

// ── Tooltip and legend hosts ────────────────────────────────────────

/*
 * Positioned absolutely inside .chart-plot from plot-relative pointer
 * coordinates, never through a popover or lib/use-anchor-position: this is
 * not an overlay, and the top layer would lift it out of the chart's
 * stacking context.
 */
export function ChartTooltip({ content, cursor = true, defaultIndex, ...props }) {
  const layout = useContext(LayoutContext)
  const index = useContext(ActiveIndexContext)
  const pointer = useContext(PointerContext)
  const ref = useRef(null)
  const [size, setSize] = useState(null)
  const visible = layout && index != null && index < layout.category.count

  useLayoutEffect(() => {
    if (!visible || !ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const width = Math.ceil(rect.width)
    const height = Math.ceil(rect.height)
    setSize((prev) => (prev && prev.width === width && prev.height === height ? prev : { width, height }))
  })

  if (!visible) return null

  const { category, width: W, height: H } = layout
  const [ax, ay] = pointer.point ? [pointer.point.x, pointer.point.y] : layout.anchorAt(index)
  const w = size?.width ?? 0
  const h = size?.height ?? 0
  let x = ax + TOOLTIP_GAP
  if (x + w > W) x = ax - TOOLTIP_GAP - w
  x = Math.max(0, Math.min(x, Math.max(0, W - w)))
  let y = ay + TOOLTIP_GAP
  if (y + h > H) y = ay - TOOLTIP_GAP - h
  y = Math.max(0, Math.min(y, Math.max(0, H - h)))

  const node = isValidElement(content) ? content : <ChartTooltipContent />
  return (
    <div ref={ref} className="chart-tooltip-anchor" style={{ transform: `translate(${x}px, ${y}px)` }}>
      {cloneElement(node, { active: true, payload: layout.payloadAt(index), label: category.labels[index], ...props })}
    </div>
  )
}
ChartTooltip.chartRole = "tooltip"

export function ChartLegend({ content, verticalAlign = "bottom", ...props }) {
  const layout = useContext(LayoutContext)
  if (!layout) return null
  const node = isValidElement(content) ? content : <ChartLegendContent />
  return cloneElement(node, { payload: layout.legendPayload, verticalAlign, ...props })
}
ChartLegend.chartRole = "legend"
