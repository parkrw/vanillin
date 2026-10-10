import { useEffect, useId, useMemo, useRef } from "react"
import { cn } from "../../lib/cn.js"
import { sankeyLayout } from "../../lib/chart-sankey.js"
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
 * Nodes and weighted links on the Chart shell, laid out by lib/chart-sankey.js.
 * The shared tooltip host, pointer and keyboard layer address one flat list of
 * stops: every node in column order, top to bottom, then every link in the
 * order of its source node. A stop is a node or a link, never both.
 */

const DEFAULT_MARGIN = { top: 5, right: 5, bottom: 5, left: 5 }
const PALETTE_SIZE = 5
const LABEL_GAP = 6
const SAFE_IDENT = /^[\w-]+$/
const PARTS = { series: new Set(), unique: [], first: ["tooltip", "legend"] }

const finite = (v) => (typeof v === "number" && Number.isFinite(v) ? v : null)
const json = (value) => JSON.stringify(value ?? null)
const format = (v) => String(Number(v.toPrecision(12)))
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`

function nodeName(datum, config) {
  const label = config?.[datum.id]?.label
  if (typeof label === "string") return label
  return typeof datum.name === "string" ? datum.name : String(datum.id)
}

function nodeColor(datum, index, config) {
  const key = String(datum.id)
  const entry = config?.[key]
  if (SAFE_IDENT.test(key) && (entry?.color || entry?.theme)) return `var(--color-${key})`
  return `var(--chart-${(index % PALETTE_SIZE) + 1})`
}

// The y of a link's centreline at screen x: x(t) is monotone because both control points sit at the midpoint.
function bandCentreAt(link, x) {
  const mid = (link.x0 + link.x1) / 2
  let [lo, hi] = [0, 1]
  for (let i = 0; i < 24; i++) {
    const t = (lo + hi) / 2
    const u = 1 - t
    const px = u * u * u * link.x0 + 3 * u * u * t * mid + 3 * u * t * t * mid + t * t * t * link.x1
    if (px < x) lo = t
    else hi = t
  }
  const t = (lo + hi) / 2
  const u = 1 - t
  return u * u * u * link.y0 + 3 * u * u * t * link.y0 + 3 * u * t * t * link.y1 + t * t * t * link.y1
}

function summarize({ layout, names }) {
  const { nodes, links } = layout
  if (!nodes.length) return "Flow diagram with nothing to draw."
  const total = links.reduce((sum, l) => sum + l.value, 0)
  const parts = [`Flow diagram with ${plural(nodes.length, "node", "nodes")} and ${plural(links.length, "flow", "flows")}, total ${format(total)}.`]
  const list = (items) => items.map((n) => `${names[n.index]} ${format(n.value)}`).join(", ")
  const sources = nodes.filter((n) => n.valueIn === 0 && n.valueOut > 0)
  const sinks = nodes.filter((n) => n.valueOut === 0 && n.valueIn > 0)
  if (sources.length) parts.push(`Starts: ${list(sources)}.`)
  if (sinks.length) parts.push(`Ends: ${list(sinks)}.`)
  const largest = links.reduce((best, l) => (!best || l.value > best.value ? l : best), null)
  if (largest) parts.push(`Largest flow: ${names[largest.source]} to ${names[largest.target]}, ${format(largest.value)}.`)
  return parts.join(" ")
}

function sankeyModel({ nodes, links, linkColor, config, margin, labelSize, nodeWidth, nodePadding, iterations, align, width, height }) {
  const plot = {
    x: margin.left + labelSize,
    y: margin.top,
    width: Math.max(0, width - margin.left - margin.right - 2 * labelSize),
    height: Math.max(0, height - margin.top - margin.bottom),
  }
  const layout = sankeyLayout({ nodes, links, width: plot.width, height: plot.height, nodeWidth, nodePadding, iterations, align })
  const names = layout.nodes.map((n) => nodeName(n.datum, config))
  const colors = layout.nodes.map((n) => nodeColor(n.datum, n.index, config))

  const nodeStops = layout.columns.flat()
  const linkStops = nodeStops.flatMap((i) => layout.nodes[i].sourceLinks)
  const stops = [...nodeStops.map((index) => ({ type: "node", index })), ...linkStops.map((index) => ({ type: "link", index }))]
  const stopOfNode = new Map(nodeStops.map((index, stop) => [index, stop]))
  const stopOfLink = new Map(linkStops.map((index, stop) => [index, nodeStops.length + stop]))

  const linkEnd = (link) => (linkColor === "target" ? link.target : link.source)
  const anchorAt = (stop) => {
    const s = stops[stop]
    if (s.type === "node") {
      const n = layout.nodes[s.index]
      return [plot.x + n.x1, plot.y + (n.y0 + n.y1) / 2]
    }
    const l = layout.links[s.index]
    return [plot.x + (l.x0 + l.x1) / 2, plot.y + (l.y0 + l.y1) / 2]
  }
  const indexAt = (p) => {
    const x = p.x - plot.x
    const y = p.y - plot.y
    const node = layout.nodes.find((n) => x >= n.x0 && x <= n.x1 && y >= n.y0 && y <= n.y1)
    if (node) return stopOfNode.get(node.index)
    let best = -1
    let bestGap = Infinity
    for (const l of layout.links) {
      if (x < l.x0 || x > l.x1) continue
      const gap = Math.abs(y - bandCentreAt(l, x))
      if (gap <= Math.max(l.width / 2, 2) && gap < bestGap) [best, bestGap] = [l.index, gap]
    }
    return best < 0 ? -1 : stopOfLink.get(best)
  }
  const payloadAt = (stop) => {
    const s = stops[stop]
    if (s.type === "node") {
      const n = layout.nodes[s.index]
      const rows = [n.valueIn > 0 ? ["Inflow", n.valueIn] : null, n.valueOut > 0 ? ["Outflow", n.valueOut] : null].filter(Boolean)
      return rows.map(([name, value]) => ({ dataKey: name, name, value, color: colors[n.index], payload: n.datum }))
    }
    const l = layout.links[s.index]
    return [{ dataKey: "Flow", name: "Flow", value: l.value, color: colors[linkEnd(l)], payload: l.datum }]
  }
  const labels = stops.map((s) => (s.type === "node" ? names[s.index] : `${names[layout.links[s.index].source]} → ${names[layout.links[s.index].target]}`))

  // Arrows follow the screen: right runs downstream along a flow, up and down step among siblings.
  const move = (from, key) => {
    const s = stops[from]
    if (s.type === "node") {
      const n = layout.nodes[s.index]
      if (key === "ArrowRight") return n.sourceLinks.length ? stopOfLink.get(n.sourceLinks[0]) : from
      if (key === "ArrowLeft") return n.targetLinks.length ? stopOfLink.get(n.targetLinks[0]) : from
      const column = layout.columns[n.column]
      const at = column.indexOf(n.index) + (key === "ArrowDown" ? 1 : -1)
      return column[at] === undefined ? from : stopOfNode.get(column[at])
    }
    const l = layout.links[s.index]
    if (key === "ArrowRight") return stopOfNode.get(l.target)
    if (key === "ArrowLeft") return stopOfNode.get(l.source)
    const siblings = layout.nodes[l.source].sourceLinks
    const at = siblings.indexOf(l.index) + (key === "ArrowDown" ? 1 : -1)
    return siblings[at] === undefined ? from : stopOfLink.get(siblings[at])
  }

  return {
    legendPayload: layout.nodes.map((n) => ({ dataKey: String(n.id), value: names[n.index], color: colors[n.index], type: "rect" })),
    width,
    height,
    plot,
    layout,
    names,
    colors,
    stops,
    stopOfNode,
    stopOfLink,
    linkEnd,
    indexAt,
    anchorAt,
    payloadAt,
    move,
    summary: summarize({ layout, names }),
    category: { count: stops.length, labels },
  }
}

// ── Root ────────────────────────────────────────────────────────────

export function SankeyChart({
  nodes = [],
  links = [],
  nodeWidth = 12,
  nodePadding = 8,
  align = "justify",
  iterations,
  linkColor = "source",
  labelSize = 72,
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
  const gradientId = `${chart.id}-sankey-${useId().replace(/[^\w-]/g, "")}`
  const summaryId = `${gradientId}-summary`
  const { width, height } = useElementSize(plotRef, chart.initialDimension)
  const parts = collect(children, PARTS)
  const options = {
    linkColor: ["target", "gradient"].includes(linkColor) ? linkColor : "source",
    margin: { ...DEFAULT_MARGIN, ...margin },
    labelSize: Math.max(0, finite(labelSize) ?? 0),
    nodeWidth,
    nodePadding,
    iterations,
    align: align === "left" ? "left" : "justify",
  }
  const signature = json(options)
  const model = useMemo(
    () => sankeyModel({ ...options, nodes, links, config: chart.config, width, height }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [nodes, links, chart.config, width, height, signature],
  )

  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => {
      for (const el of [...parts.unknown, ...parts.stray, ...parts.duplicates]) {
        console.warn(`<${el.type?.displayName ?? el.type?.name ?? "component"}> is not a Sankey part and was ignored; only ChartTooltip and ChartLegend draw here.`)
      }
    }, [parts.unknown.length, parts.stray.length, parts.duplicates.length])
  }

  const tooltipEl = parts.tooltip
  const count = model.stops.length
  const { activeIndex, pointer, layoutRef, activate, surface, keyboard } = useActiveIndex({
    count,
    defaultIndex: tooltipEl?.props.defaultIndex,
    trigger: tooltipEl?.props.trigger,
    indexAt: model.indexAt,
    syncId,
  })
  // An index with no stop here (one a larger synced chart handed over) counts as none, so a first arrow lands on the first stop or the last.
  const current = activeIndex != null && activeIndex < count ? activeIndex : null
  const onKeyDown = (event) => {
    const forward = event.key === "ArrowRight" || event.key === "ArrowDown"
    const back = event.key === "ArrowLeft" || event.key === "ArrowUp"
    if (!count || !(forward || back)) return keyboard.onKeyDown(event)
    event.preventDefault()
    if (current == null) activate(forward ? 0 : count - 1, "keyboard")
    else activate(model.move(current, event.key), "keyboard")
  }
  const ownSummary = accessibilityLayer && ariaDescribedBy == null
  const a11y = surfaceA11y(accessibilityLayer, ariaLabel != null || ariaLabelledBy != null, { ...keyboard, onKeyDown })

  const { layout, plot } = model
  const stop = current == null ? null : model.stops[current]
  const emphasised = { links: new Set(), nodes: new Set() }
  if (stop?.type === "node") {
    const node = layout.nodes[stop.index]
    for (const i of [...node.sourceLinks, ...node.targetLinks]) {
      emphasised.links.add(i)
      emphasised.nodes.add(layout.links[i].source)
      emphasised.nodes.add(layout.links[i].target)
    }
  } else if (stop) {
    emphasised.links.add(stop.index)
    emphasised.nodes.add(layout.links[stop.index].source)
    emphasised.nodes.add(layout.links[stop.index].target)
  }
  const currentLink = stop?.type === "link" ? layout.links[stop.index] : null

  const legendEl = parts.legend
  const legendTop = legendEl && legendEl.props.verticalAlign === "top"
  const lastColumn = layout.columns.length - 1

  return (
    <LayoutContext.Provider value={model}>
      <ActiveIndexContext.Provider value={activeIndex}>
        <PointerContext.Provider value={pointer}>
          <div ref={layoutRef} className={cn("chart-layout chart-sankey", className)} data-link-color={options.linkColor} {...props}>
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
                {options.linkColor === "gradient" ? (
                  <defs>
                    {layout.links.map((l) => (
                      <linearGradient key={l.index} id={`${gradientId}-${l.index}`} gradientUnits="userSpaceOnUse" x1={l.x0} x2={l.x1} y1="0" y2="0">
                        <stop offset="0" style={{ stopColor: model.colors[l.source] }} />
                        <stop offset="1" style={{ stopColor: model.colors[l.target] }} />
                      </linearGradient>
                    ))}
                  </defs>
                ) : null}
                <g transform={`translate(${plot.x} ${plot.y})`}>
                  <g className="chart-sankey-links" data-emphasis={stop ? "" : undefined}>
                    {currentLink ? <path className="chart-sankey-link-ring" d={currentLink.d} strokeWidth={currentLink.width + 4} /> : null}
                    {layout.links.map((l) => (
                      <path
                        key={l.index}
                        className="chart-sankey-link"
                        data-index={l.index}
                        data-source={l.source}
                        data-target={l.target}
                        data-value={l.value}
                        data-active={emphasised.links.has(l.index) || undefined}
                        data-current={currentLink?.index === l.index || undefined}
                        d={l.d}
                        strokeWidth={l.width}
                        style={options.linkColor === "gradient" ? { stroke: `url(#${gradientId}-${l.index})` } : { "--sankey-color": model.colors[model.linkEnd(l)] }}
                      />
                    ))}
                  </g>
                  <g className="chart-sankey-nodes">
                    {layout.nodes.map((n) => (
                      <rect
                        key={n.index}
                        className="chart-sankey-node"
                        data-index={n.index}
                        data-id={n.id}
                        data-value={n.value}
                        data-linked={(emphasised.nodes.has(n.index) && !(stop?.type === "node" && stop.index === n.index)) || undefined}
                        data-current={(stop?.type === "node" && stop.index === n.index) || undefined}
                        x={n.x0}
                        y={n.y0}
                        width={n.x1 - n.x0}
                        height={n.height}
                        style={{ "--sankey-color": model.colors[n.index] }}
                      />
                    ))}
                  </g>
                  {options.labelSize > 0 ? (
                    <g className="chart-sankey-labels">
                      {layout.nodes.map((n) => {
                        const first = n.column === 0 && lastColumn > 0
                        return (
                          <text
                            key={n.index}
                            className="chart-tick-text chart-sankey-label"
                            data-index={n.index}
                            x={first ? n.x0 - LABEL_GAP : n.x1 + LABEL_GAP}
                            y={(n.y0 + n.y1) / 2}
                            textAnchor={first ? "end" : "start"}
                            dominantBaseline="middle"
                          >
                            {model.names[n.index]}
                          </text>
                        )
                      })}
                    </g>
                  ) : null}
                </g>
              </svg>
              {tooltipEl}
            </div>
            {legendEl && !legendTop ? legendEl : null}
            {ownSummary ? (
              <p id={summaryId} className="chart-sankey-summary" hidden>
                {model.summary}
              </p>
            ) : null}
          </div>
        </PointerContext.Provider>
      </ActiveIndexContext.Provider>
    </LayoutContext.Provider>
  )
}
