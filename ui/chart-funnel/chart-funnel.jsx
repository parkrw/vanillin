import { useEffect, useId, useMemo, useRef } from "react"
import { cn } from "../../lib/cn.js"
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
 * Stages stacked top to bottom on the Chart shell, each a trapezoid centred on
 * the plot: its top edge is as wide as its value is large against the biggest
 * stage, and its bottom edge is as wide as the next stage's value, so the
 * outline is continuous. A stage with no next one, or none with a value, stays a rectangle.
 * Beside each stage a label gives its name, value and two conversion rates: of
 * the stage before and of the first. The stage index is what the shared
 * tooltip host, pointer and keyboard layer from ui/chart address.
 */

const DEFAULT_MARGIN = { top: 5, right: 5, bottom: 5, left: 5 }
const PARTS = { series: new Set(), unique: [], first: ["tooltip", "legend"] }
const NAME_LINE = -7
const RATE_LINE = 9
const LABEL_GAP = 12

const finite = (v) => (typeof v === "number" && Number.isFinite(v) ? v : null)
const json = (value) => JSON.stringify(value ?? null)
const plain = (v) => (typeof v === "number" ? v.toLocaleString() : String(v))
const round2 = (v) => Math.round(v * 100) / 100
const percent = (ratio) => `${ratio.toLocaleString(undefined, { style: "percent", maximumFractionDigits: 1 })}`
const rateOf = (value, base) => (value == null || base == null || base <= 0 ? null : value / base)

function funnelModel({ data, nameKey, valueKey, formatter, stageGap, margin, labelSize, width, height }) {
  const stages = data.map((datum, index) => {
    const raw = finite(datum?.[valueKey])
    return { index, name: datum?.[nameKey] ?? index, datum, value: raw != null && raw >= 0 ? raw : null }
  })
  const top = Math.max(0, ...stages.map((s) => s.value ?? 0))
  const plot = {
    x: margin.left,
    y: margin.top,
    width: Math.max(0, width - margin.left - margin.right - labelSize),
    height: Math.max(0, height - margin.top - margin.bottom),
  }
  const step = stages.length ? plot.height / stages.length : 0
  const rowHeight = Math.max(0, step - stageGap)
  const widthOf = (value) => (value == null || top <= 0 ? 0 : (plot.width * value) / top)
  const centre = plot.x + plot.width / 2
  const first = stages[0]?.value ?? null
  for (const stage of stages) {
    const next = stages[stage.index + 1]
    stage.stepRate = rateOf(stage.value, stages[stage.index - 1]?.value)
    stage.overallRate = stage.index === 0 ? null : rateOf(stage.value, first)
    stage.y = plot.y + stage.index * step
    stage.height = rowHeight
    stage.topWidth = widthOf(stage.value)
    stage.bottomWidth = stage.value == null ? 0 : widthOf(next?.value != null ? next.value : stage.value)
    const [tw, bw] = [stage.topWidth / 2, stage.bottomWidth / 2]
    stage.points = [
      [centre - tw, stage.y],
      [centre + tw, stage.y],
      [centre + bw, stage.y + rowHeight],
      [centre - bw, stage.y + rowHeight],
    ]
    stage.rates = [
      stage.stepRate != null ? `${percent(stage.stepRate)} of previous` : null,
      stage.overallRate != null ? `${percent(stage.overallRate)} of first` : null,
    ].filter(Boolean)
  }

  const payloadAt = (i) => {
    const s = stages[i]
    if (!s) return []
    const rows = [[String(s.name), s.value == null ? "No value" : formatter(s.value)]]
    if (s.stepRate != null) rows.push(["Of previous stage", percent(s.stepRate)])
    if (s.overallRate != null) rows.push(["Of first stage", percent(s.overallRate)])
    return rows.map(([name, value]) => ({ dataKey: name, name, value, color: "var(--color-funnel, var(--chart-1))", payload: s.datum }))
  }
  const indexAt = (p) => {
    if (!step || p.y < plot.y || p.y >= plot.y + plot.height || p.x < 0 || p.x > width) return -1
    return Math.min(stages.length - 1, Math.floor((p.y - plot.y) / step))
  }
  return {
    legendPayload: [{ dataKey: "funnel", value: "funnel", color: "var(--color-funnel, var(--chart-1))", type: "rect" }],
    width,
    height,
    plot,
    centre,
    stages,
    indexAt,
    anchorAt: (i) => [centre, (stages[i]?.y ?? plot.y) + rowHeight / 2],
    payloadAt,
    category: { count: stages.length, labels: stages.map((s) => s.name) },
  }
}

function summarize(stages, formatter) {
  if (!stages.length) return "Funnel with no stages."
  const parts = stages.map((s) => {
    const rates = s.rates.length ? `, ${s.rates.join(", ")}` : ""
    return `${s.name} ${s.value == null ? "has no value" : formatter(s.value)}${rates}`
  })
  return `Funnel of ${stages.length} ${stages.length === 1 ? "stage" : "stages"}. ${parts.join("; ")}.`
}

// ── Root ────────────────────────────────────────────────────────────

export function FunnelChart({
  data = [],
  nameKey = "name",
  valueKey = "value",
  formatter = plain,
  stageGap = 4,
  labelSize = 168,
  margin,
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
  const summaryId = `chart-funnel-summary-${useId().replace(/[^\w-]/g, "")}`
  const { width, height } = useElementSize(plotRef, chart.initialDimension)
  const parts = collect(children, PARTS)
  const options = {
    nameKey,
    valueKey,
    stageGap: Math.max(0, finite(stageGap) ?? 4),
    labelSize: Math.max(0, finite(labelSize) ?? 168),
    margin: { ...DEFAULT_MARGIN, ...margin },
  }
  const signature = json(options)
  const model = useMemo(
    () => funnelModel({ ...options, formatter, data, width, height }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data, formatter, width, height, signature],
  )

  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => {
      for (const el of [...parts.unknown, ...parts.stray, ...parts.duplicates]) {
        console.warn(`<${el.type?.displayName ?? el.type?.name ?? "component"}> is not a funnel part and was ignored; only ChartTooltip and ChartLegend draw here.`)
      }
    }, [parts.unknown.length, parts.stray.length, parts.duplicates.length])
  }

  const tooltipEl = parts.tooltip
  const { activeIndex, pointer, layoutRef, activate, surface, keyboard } = useActiveIndex({
    count: model.stages.length,
    defaultIndex: tooltipEl?.props.defaultIndex,
    trigger: tooltipEl?.props.trigger,
    indexAt: model.indexAt,
    syncId,
  })
  // Stages run down the screen, so Up and Down step as well as Left and Right.
  // An index with no stage here (one a larger synced chart handed over) counts
  // as none: forward lands on the first stage, back on the last.
  const onKeyDown = (event) => {
    const step = { ArrowUp: -1, ArrowDown: 1 }[event.key]
    const count = model.stages.length
    if (step == null || !count) return keyboard.onKeyDown(event)
    event.preventDefault()
    const from = activeIndex != null && activeIndex < count ? activeIndex : null
    activate(step > 0 ? Math.min(count - 1, (from ?? -1) + 1) : Math.max(0, (from ?? count) - 1), "keyboard")
  }
  const labelled = ariaLabel != null || ariaLabelledBy != null
  const a11y = surfaceA11y(accessibilityLayer, labelled, { ...keyboard, onKeyDown })
  const ownSummary = accessibilityLayer && ariaDescribedBy == null

  const legendEl = parts.legend
  const legendTop = legendEl && legendEl.props.verticalAlign === "top"
  const { plot } = model
  const labelX = plot.x + plot.width + LABEL_GAP

  return (
    <LayoutContext.Provider value={model}>
      <ActiveIndexContext.Provider value={activeIndex}>
        <PointerContext.Provider value={pointer}>
          <div ref={layoutRef} className={cn("chart-layout chart-funnel", className)} {...props}>
            {legendTop ? legendEl : null}
            <div className="chart-plot" ref={plotRef}>
              <svg
                className="chart-surface"
                width={width}
                height={height}
                aria-label={ariaLabel}
                aria-labelledby={ariaLabelledBy}
                aria-describedby={ownSummary ? summaryId : ariaDescribedBy}
                {...surface}
                {...a11y}
              >
                {parts.passthrough}
                <g className="chart-funnel-stages">
                  {model.stages.map((stage) => (
                    <g
                      key={stage.index}
                      className="chart-funnel-stage-group"
                      data-index={stage.index}
                      data-active={stage.index === activeIndex || undefined}
                      data-value={stage.value ?? undefined}
                      data-step-rate={stage.stepRate != null ? round2(stage.stepRate * 100) : undefined}
                      data-overall-rate={stage.overallRate != null ? round2(stage.overallRate * 100) : undefined}
                    >
                      {stage.value == null ? null : (
                        <polygon
                          className="chart-funnel-stage"
                          data-top-width={round2(stage.topWidth)}
                          data-bottom-width={round2(stage.bottomWidth)}
                          points={stage.points.map((p) => p.map(round2).join(",")).join(" ")}
                        />
                      )}
                      {options.labelSize > 0 ? (
                        <>
                          <text className="chart-funnel-label" x={labelX} y={stage.y + stage.height / 2 + NAME_LINE} dominantBaseline="middle">
                            {`${stage.name}: ${stage.value == null ? "No value" : formatter(stage.value)}`}
                          </text>
                          {stage.rates.length ? (
                            <text className="chart-funnel-rate" x={labelX} y={stage.y + stage.height / 2 + RATE_LINE} dominantBaseline="middle">
                              {stage.rates.join(" · ")}
                            </text>
                          ) : null}
                        </>
                      ) : null}
                    </g>
                  ))}
                </g>
              </svg>
              {tooltipEl}
            </div>
            {legendEl && !legendTop ? legendEl : null}
            {ownSummary ? (
              <p id={summaryId} className="chart-funnel-summary" hidden>
                {summarize(model.stages, formatter)}
              </p>
            ) : null}
          </div>
        </PointerContext.Provider>
      </ActiveIndexContext.Provider>
    </LayoutContext.Provider>
  )
}
