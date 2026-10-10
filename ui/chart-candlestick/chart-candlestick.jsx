import { useEffect, useMemo, useRef } from "react"
import { cn } from "../../lib/cn.js"
import { bandScale, extent, linearScale, niceTicks, resolveDomain, thinTicks } from "../../lib/chart-math.js"
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
 * One candle or OHLC mark per datum on the Chart shell, with an optional
 * volume pane beneath it. The panes are separate roots that share a `syncId`,
 * so the shared tooltip host, pointer and keyboard layer from ui/chart carry
 * the active index from one to the other by position. Categories sit on a band
 * axis, one slot per row, in data order.
 */

const DEFAULT_MARGIN = { top: 5, right: 5, bottom: 5, left: 5 }
const TICK_GAP = 6
const LABEL_CHAR_WIDTH = 6
const PARTS = { series: new Set(), unique: [], first: ["tooltip", "legend"] }
const FIELDS = ["open", "high", "low", "close"]

const finite = (v) => (typeof v === "number" && Number.isFinite(v) ? v : null)
const json = (value) => JSON.stringify(value ?? null)
const NUMBER = new Intl.NumberFormat()
const format = (t) => NUMBER.format(t)

function direction(open, close) {
  if (close > open) return "up"
  if (close < open) return "down"
  return "flat"
}

function readBar(datum, keys) {
  const [open, high, low, close] = FIELDS.map((f) => finite(datum?.[keys[f]]))
  if (open == null || high == null || low == null || close == null) return null
  return { open, high, low, close, direction: direction(open, close) }
}

function plotRect({ margin, valueAxisSize, categoryAxisSize, width, height }) {
  return {
    x: margin.left + valueAxisSize,
    y: margin.top,
    width: Math.max(0, width - margin.left - margin.right - valueAxisSize),
    height: Math.max(0, height - margin.top - margin.bottom - categoryAxisSize),
  }
}

function categoryModel(data, categoryKey, plot, categoryGap, width, height) {
  const labels = data.map((datum, i) => datum?.[categoryKey] ?? i)
  const band = bandScale(data.length, [plot.x, plot.x + plot.width], { categoryGap })
  const indexAt = (p) => {
    const along = p.x - plot.x
    if (!band.step || along < 0 || along >= plot.width || p.y < plot.y || p.y > plot.y + plot.height) return -1
    return Math.min(data.length - 1, Math.floor(along / band.step))
  }
  return { labels, band, indexAt, category: { count: data.length, labels }, width, height, plot }
}

function candleModel({ data, keys, categoryKey, variant, domain, tickCount, categoryGap, margin, valueAxisSize, categoryAxisSize, width, height }) {
  const plot = plotRect({ margin, valueAxisSize, categoryAxisSize, width, height })
  const base = categoryModel(data, categoryKey, plot, categoryGap, width, height)
  const bars = data.map((datum, index) => ({ index, label: base.labels[index], datum, bar: readBar(datum, keys) }))
  const spec = Array.isArray(domain) ? domain : ["auto", "auto"]
  const [lo, hi] = resolveDomain(spec, extent(bars.flatMap((b) => (b.bar ? [[b.bar.low, b.bar.high]] : []))), tickCount)
  const ticks = niceTicks(lo, hi, tickCount).filter((t) => t >= lo && t <= hi)
  const valueScale = linearScale([lo, hi], [plot.y + plot.height, plot.y])
  return {
    ...base,
    legendPayload: [
      { dataKey: "up", value: "up", color: "var(--candle-up)", type: "rect" },
      { dataKey: "down", value: "down", color: "var(--candle-down)", type: "rect" },
    ],
    variant,
    bars,
    valueScale,
    ticks,
    domain: [lo, hi],
    anchorAt: (i) => [base.band.center(i), valueScale(bars[i].bar ? bars[i].bar.high : lo)],
    payloadAt: (i) => {
      const { bar, datum } = bars[i]
      if (!bar) return []
      const color = `var(--candle-${bar.direction})`
      return [
        ["Open", bar.open],
        ["High", bar.high],
        ["Low", bar.low],
        ["Close", bar.close],
      ].map(([name, value]) => ({ dataKey: name, name, value, color, payload: datum }))
    },
  }
}

function volumeModel({ data, keys, volumeKey, categoryKey, tickCount, categoryGap, margin, valueAxisSize, categoryAxisSize, width, height }) {
  const plot = plotRect({ margin, valueAxisSize, categoryAxisSize, width, height })
  const base = categoryModel(data, categoryKey, plot, categoryGap, width, height)
  const bars = data.map((datum, index) => {
    const volume = finite(datum?.[volumeKey])
    const open = finite(datum?.[keys.open])
    const close = finite(datum?.[keys.close])
    return { index, label: base.labels[index], datum, volume: volume != null && volume >= 0 ? volume : null, direction: open != null && close != null ? direction(open, close) : "flat" }
  })
  const top = Math.max(0, ...bars.map((b) => b.volume ?? 0))
  const [lo, hi] = resolveDomain([0, "auto"], [0, top], tickCount)
  const ticks = niceTicks(lo, hi, tickCount).filter((t) => t >= lo && t <= hi)
  const valueScale = linearScale([lo, hi], [plot.y + plot.height, plot.y])
  return {
    ...base,
    legendPayload: [{ dataKey: volumeKey, value: "volume", color: "var(--candle-up)", type: "rect" }],
    bars,
    valueScale,
    ticks,
    domain: [lo, hi],
    anchorAt: (i) => [base.band.center(i), valueScale(bars[i].volume ?? 0)],
    payloadAt: (i) =>
      bars[i].volume == null ? [] : [{ dataKey: volumeKey, name: "Volume", value: bars[i].volume, color: `var(--candle-${bars[i].direction})`, payload: bars[i].datum }],
  }
}

function useSharedChart({ model, parts, syncId, accessibilityLayer, ariaLabel, ariaLabelledBy }) {
  const tooltipEl = parts.tooltip
  const active = useActiveIndex({
    count: model.category.count,
    defaultIndex: tooltipEl?.props.defaultIndex,
    trigger: tooltipEl?.props.trigger,
    indexAt: model.indexAt,
    syncId,
  })
  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => {
      for (const el of [...parts.unknown, ...parts.stray, ...parts.duplicates]) {
        console.warn(`<${el.type?.displayName ?? el.type?.name ?? "component"}> is not a candlestick part and was ignored; only ChartTooltip and ChartLegend draw here.`)
      }
    }, [parts.unknown.length, parts.stray.length, parts.duplicates.length])
  }
  const a11y = surfaceA11y(accessibilityLayer, ariaLabel != null || ariaLabelledBy != null, active.keyboard)
  return { ...active, a11y }
}

function optionsFor({ openKey, highKey, lowKey, closeKey, categoryKey, domain, tickCount, categoryGap, margin, valueAxisSize, categoryAxisSize }) {
  return {
    keys: { open: openKey, high: highKey, low: lowKey, close: closeKey },
    categoryKey,
    domain,
    tickCount,
    categoryGap,
    margin: { ...DEFAULT_MARGIN, ...margin },
    valueAxisSize: finite(valueAxisSize) ?? 56,
    categoryAxisSize: finite(categoryAxisSize) ?? 24,
  }
}

function Pane({ model, parts, shared, className, pane, ariaLabel, ariaLabelledBy, ariaDescribedBy, options, plotRef, props, children }) {
  const { plot, band } = model
  const legendEl = parts.legend
  const legendTop = legendEl && legendEl.props.verticalAlign === "top"
  const kept = thinTicks(
    model.labels.map((_, i) => band.center(i)),
    model.labels.map((l) => String(l).length * LABEL_CHAR_WIDTH),
    8,
  )
  return (
    <LayoutContext.Provider value={model}>
      <ActiveIndexContext.Provider value={shared.activeIndex}>
        <PointerContext.Provider value={shared.pointer}>
          <div ref={shared.layoutRef} className={cn("chart-layout chart-candlestick", className)} data-pane={pane} {...props}>
            {legendTop ? legendEl : null}
            <div className="chart-plot" ref={plotRef}>
              <svg
                className="chart-surface"
                width={model.width}
                height={model.height}
                aria-label={ariaLabel}
                aria-labelledby={ariaLabelledBy}
                aria-describedby={ariaDescribedBy}
                {...shared.surface}
                {...shared.a11y}
              >
                {parts.passthrough}
                <g className="chart-candlestick-grid">
                  {model.ticks.map((t) => (
                    <line key={t} className="chart-grid" x1={plot.x} x2={plot.x + plot.width} y1={model.valueScale(t)} y2={model.valueScale(t)} />
                  ))}
                </g>
                <g className="chart-axis chart-candlestick-axis" data-axis="value">
                  {options.valueAxisSize > 0
                    ? model.ticks.map((t) => (
                        <text key={t} className="chart-tick-text" x={plot.x - TICK_GAP} y={model.valueScale(t)} textAnchor="end" dominantBaseline="middle">
                          {format(t)}
                        </text>
                      ))
                    : null}
                </g>
                <g className="chart-axis chart-candlestick-axis" data-axis="category">
                  {options.categoryAxisSize > 0
                    ? model.labels.map((label, i) =>
                        kept[i] ? (
                          <text key={i} className="chart-tick-text" x={band.center(i)} y={plot.y + plot.height + TICK_GAP} textAnchor="middle" dominantBaseline="hanging">
                            {String(label)}
                          </text>
                        ) : null,
                      )
                    : null}
                </g>
                {children}
              </svg>
              {parts.tooltip}
            </div>
            {legendEl && !legendTop ? legendEl : null}
          </div>
        </PointerContext.Provider>
      </ActiveIndexContext.Provider>
    </LayoutContext.Provider>
  )
}

// ── Roots ───────────────────────────────────────────────────────────

export function CandlestickChart({
  data = [],
  variant = "candle",
  openKey = "open",
  highKey = "high",
  lowKey = "low",
  closeKey = "close",
  categoryKey = "date",
  domain,
  tickCount = 5,
  categoryGap = 0.3,
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
  const options = { ...optionsFor({ openKey, highKey, lowKey, closeKey, categoryKey, domain, tickCount, categoryGap, margin, valueAxisSize, categoryAxisSize }), variant, tickCount }
  const signature = json(options)
  const model = useMemo(
    () => candleModel({ ...options, data, width, height }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data, width, height, signature],
  )
  const shared = useSharedChart({ model, parts, syncId, accessibilityLayer, ariaLabel, ariaLabelledBy })
  return (
    <Pane
      model={model}
      parts={parts}
      shared={shared}
      className={className}
      pane="price"
      ariaLabel={ariaLabel}
      ariaLabelledBy={ariaLabelledBy}
      ariaDescribedBy={ariaDescribedBy}
      options={options}
      plotRef={plotRef}
      props={{ "data-variant": variant, ...props }}
    >
      <g className="chart-candlestick-marks">
        {model.bars.map((entry) => (entry.bar ? <Mark key={entry.index} entry={entry} model={model} active={entry.index === shared.activeIndex} /> : null))}
      </g>
    </Pane>
  )
}

export function CandlestickVolume({
  data = [],
  volumeKey = "volume",
  openKey = "open",
  closeKey = "close",
  categoryKey = "date",
  tickCount = 3,
  categoryGap = 0.3,
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
  const options = { ...optionsFor({ openKey, highKey: "high", lowKey: "low", closeKey, categoryKey, tickCount, categoryGap, margin, valueAxisSize, categoryAxisSize }), volumeKey, tickCount }
  const signature = json(options)
  const model = useMemo(
    () => volumeModel({ ...options, data, width, height }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data, width, height, signature],
  )
  const shared = useSharedChart({ model, parts, syncId, accessibilityLayer, ariaLabel, ariaLabelledBy })
  const { plot, band, valueScale } = model
  const floor = valueScale(0)
  return (
    <Pane
      model={model}
      parts={parts}
      shared={shared}
      className={className}
      pane="volume"
      ariaLabel={ariaLabel}
      ariaLabelledBy={ariaLabelledBy}
      ariaDescribedBy={ariaDescribedBy}
      options={options}
      plotRef={plotRef}
      props={props}
    >
      <line className="chart-candlestick-baseline" x1={plot.x} x2={plot.x + plot.width} y1={floor} y2={floor} />
      <g className="chart-candlestick-volume-bars">
        {model.bars.map((entry) => {
          if (entry.volume == null) return null
          const y = valueScale(entry.volume)
          return (
            <rect
              key={entry.index}
              className="chart-candlestick-volume-bar"
              data-index={entry.index}
              data-direction={entry.direction}
              data-value={entry.volume}
              data-active={entry.index === shared.activeIndex || undefined}
              x={band.start(entry.index)}
              y={Math.min(y, floor)}
              width={band.bandwidth}
              height={Math.abs(floor - y)}
            />
          )
        })}
      </g>
    </Pane>
  )
}

function Mark({ entry, model, active }) {
  const { bar, index } = entry
  const { band, valueScale, variant } = model
  const mid = band.center(index)
  const [yHigh, yLow, yOpen, yClose] = [bar.high, bar.low, bar.open, bar.close].map(valueScale)
  const wick = { x1: mid, x2: mid, y1: yHigh, y2: yLow }
  const group = { className: "chart-candlestick-mark", "data-index": index, "data-direction": bar.direction, "data-active": active || undefined }
  if (variant === "ohlc") {
    const tick = band.bandwidth / 2
    return (
      <g {...group}>
        <line className="chart-candlestick-wick" {...wick} />
        <line className="chart-candlestick-open" x1={mid - tick} x2={mid} y1={yOpen} y2={yOpen} />
        <line className="chart-candlestick-close" x1={mid} x2={mid + tick} y1={yClose} y2={yClose} />
      </g>
    )
  }
  return (
    <g {...group}>
      <line className="chart-candlestick-wick" {...wick} />
      <rect className="chart-candlestick-body" x={band.start(index)} y={Math.min(yOpen, yClose)} width={band.bandwidth} height={Math.abs(yClose - yOpen)} />
    </g>
  )
}
