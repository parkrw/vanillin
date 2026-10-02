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
} from "../../lib/chart-math.js"

/*
 * Upstream's shell (ChartContainer, ChartStyle, ChartTooltipContent,
 * ChartLegendContent) over cartesian primitives drawn here on plain SVG under
 * the Recharts names, so upstream examples paste in unchanged. Cartesian only:
 * no pie, radar or radial. No entrance animation. Axes do not mirror in RTL.
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

const SERIES_ROLES = new Set(["bar", "line", "area"])

function collect(children, out) {
  for (const child of Children.toArray(children)) {
    if (!isValidElement(child)) continue
    if (child.type === Fragment) {
      collect(child.props.children, out)
      continue
    }
    const role = child.type?.chartRole
    if (SERIES_ROLES.has(role)) out.series.push(child)
    else if (role === "xaxis" || role === "yaxis") {
      if (out[role]) out.duplicates.push(role)
      else out[role] = child
    } else if (role === "grid" || role === "tooltip" || role === "legend") {
      if (!out[role]) out[role] = child
    } else if (role === "label") out.stray.push(child)
    else if (typeof child.type === "string") out.passthrough.push(child)
    else out.unknown.push(child)
  }
  return out
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

  const stacks = new Map()
  for (const entry of entries) {
    if (entry.stackId == null || entry.role === "line") continue
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

  const bars = entries.filter((entry) => entry.role === "bar")
  const slotKeys = []
  for (const entry of bars) {
    const key = entry.stackId != null ? `s:${entry.stackId}` : `i:${entry.index}`
    if (!slotKeys.includes(key)) slotKeys.push(key)
    entry.slotKey = key
  }
  const firstWith = (prop) => bars.find((entry) => entry.props[prop] != null)?.props[prop]
  const slots = barSlots(categoryScale.bandwidth, slotKeys.length, {
    barGap: barGap ?? 4,
    barSize: firstWith("barSize"),
    maxBarSize: firstWith("maxBarSize"),
  })
  for (const entry of bars) entry.slot = slots[slotKeys.indexOf(entry.slotKey)]

  const byKey = new Map()
  const duplicateKeys = []
  for (const entry of entries) {
    if (byKey.has(entry.key)) duplicateKeys.push(entry.key)
    else byKey.set(entry.key, entry)
  }

  const categoryAxis = vertical ? yaxis : xaxis
  const categoryKey = categoryAxis?.props.dataKey
  const labels = data.map((datum, i) => (categoryKey != null ? datum?.[categoryKey] : i))
  const centers = labels.map((_, i) => categoryScale.center(i))

  const pointAt = (i, v) => {
    const c = categoryScale.center(i)
    const s = valueScale(v)
    return vertical ? [s, c] : [c, s]
  }
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
    clampValue,
    legendPayload,
    payloadAt,
  }
}

const AXIS_SIG_KEYS = ["dataKey", "hide", "width", "height", "domain", "ticks", "tickCount", "allowDataOverflow"]
const SERIES_SIG_KEYS = ["dataKey", "stackId", "name", "barSize", "maxBarSize", "fill", "stroke"]
const pick = (props, keys) => keys.map((key) => props?.[key])

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

  const parts = collect(children, {
    series: [],
    xaxis: null,
    yaxis: null,
    grid: null,
    tooltip: null,
    legend: null,
    passthrough: [],
    unknown: [],
    stray: [],
    duplicates: [],
  })
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
      for (const role of parts.duplicates) {
        console.warn(`<${role === "xaxis" ? "XAxis" : "YAxis"}> declared twice in one chart; only the first is used.`)
      }
      for (const el of parts.unknown) {
        const name = el.type?.displayName ?? el.type?.name ?? "component"
        console.warn(
          `<${name}> is not a chart primitive and was ignored. A wrapper around <Bar>, <Line> or <Area> is ` +
            "invisible to the chart; render the primitives as direct children or inside a Fragment.",
        )
      }
      if (parts.stray.length) {
        console.warn("<LabelList> must be a child of a <Bar>, <Line> or <Area>; at the chart root it draws nothing.")
      }
      for (const key of computed.duplicateKeys) {
        console.warn(`Two series share ${key}; the second is ignored. Give each series its own dataKey.`)
      }
    }, [parts.duplicates.length, parts.unknown.length, parts.stray.length, computed])
  }

  const tooltipEl = parts.tooltip
  const defaultIndex = tooltipEl?.props.defaultIndex
  const [activeIndex, setActiveIndex] = useState(() => (Number.isInteger(defaultIndex) ? defaultIndex : null))
  const [pointer, setPointer] = useState({ source: "default", point: null })

  const activate = (index, source, point = null) => {
    setActiveIndex(index)
    setPointer({ source, point })
  }
  const clear = () => {
    setActiveIndex(null)
    setPointer({ source: "default", point: null })
  }

  const locate = (event) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const point = { x: event.clientX - rect.left, y: event.clientY - rect.top }
    const index = nearestIndex(vertical ? point.y : point.x, computed.category.centers)
    if (index < 0) return
    activate(index, "pointer", point)
  }
  const onPointerLeave = (event) => {
    if (event.pointerType === "touch") return
    clear()
  }

  // A touch tooltip has no leave event: it stays until a press lands outside.
  const layoutRef = useRef(null)
  useEffect(() => {
    if (activeIndex == null || pointer.source !== "pointer") return
    const onDown = (event) => {
      if (!layoutRef.current?.contains(event.target)) clear()
    }
    document.addEventListener("pointerdown", onDown)
    return () => document.removeEventListener("pointerdown", onDown)
  }, [activeIndex, pointer.source])

  const onKeyDown = (event) => {
    const count = computed.category.count
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
    if (activeIndex == null && computed.category.count) activate(0, "keyboard")
  }
  const onBlur = () => {
    if (pointer.source === "keyboard") clear()
  }

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
  const labelled = ariaLabel != null || ariaLabelledBy != null
  const a11y = accessibilityLayer
    ? { tabIndex: 0, role: "application", "aria-roledescription": "chart", onKeyDown, onFocus, onBlur }
    : labelled
      ? { role: "img" }
      : {}

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
                onPointerMove={locate}
                onPointerDown={locate}
                onPointerLeave={onPointerLeave}
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
  if (!layout || !series) return null
  const { entry, points } = series
  const spec = LABEL_ANCHORS[position] ?? LABEL_ANCHORS.top
  const labels = points.map((p, i) => {
    if (!p) return null
    const raw = dataKey != null ? layout.data[i]?.[dataKey] : entry.values[i]
    if (raw == null) return null
    const text = formatter ? formatter(raw) : typeof raw === "number" ? raw.toLocaleString() : String(raw)
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

  const { plot, category, vertical, width: W, height: H } = layout
  let ax
  let ay
  if (pointer.point) {
    ax = pointer.point.x
    ay = pointer.point.y
  } else if (vertical) {
    ax = plot.x
    ay = category.scale.center(index)
  } else {
    ax = category.scale.center(index)
    ay = plot.y
  }
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
