import { useContext, useEffect, useId, useMemo, useRef, useState } from "react"
import { cn } from "../../lib/cn.js"
import { treemapLayout } from "../../lib/chart-treemap.js"
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
 * Nested groups as tiles on the squarified layout in lib/chart-treemap.js. The
 * layout's flat pre-order list is the index the shared tooltip host, pointer
 * and keyboard layer from ui/chart address, so a tile, a group or a group's
 * header is one stop, and the arrows walk the list in order.
 *
 * Drilling re-lays out one group as the whole chart. The full tree is laid
 * out once for its shape; a group's subtree is a contiguous run of that list,
 * so the view's tile k is the full tile `zoom + k`.
 */

const DEFAULT_MARGIN = { top: 2, right: 2, bottom: 2, left: 2 }
const DEFAULT_COLORS = 5
const TEXT_WIDTH_PER_CHAR = 7
const TEXT_HEIGHT = 14
const LABEL_INSET = 6
const PARTS = { series: new Set(), unique: [], first: ["tooltip", "legend"] }
const SEPARATOR = " › "

const finite = (v) => (typeof v === "number" && Number.isFinite(v) ? v : null)
const json = (value) => JSON.stringify(value ?? null)
const plain = (v) => v.toLocaleString()

const lowColor = "var(--color-low, var(--muted))"
const highColor = "var(--color-high, var(--chart-1))"
const mix = (color, percent, into) => `color-mix(in oklab, ${color} ${Math.round(percent * 1000) / 1000}%, ${into})`

// ── Model ───────────────────────────────────────────────────────────

/** A group's subtree as a node tree, rebuilt from the flat list so the view lays out exactly what the full chart holds. */
function subtree(full, root) {
  const kids = new Map()
  full.forEach((rect, i) => kids.set(rect.parent, [...(kids.get(rect.parent) ?? []), i]))
  const build = (i) => {
    const children = kids.get(i)
    return children ? { name: full[i].name, value: full[i].value, children: children.map(build) } : { name: full[i].name, value: full[i].value }
  }
  return build(root)
}

/** The palette slot of every tile: a top-level group's own, inherited by what is inside it. The root has none. */
function colorSlots(full) {
  const slots = []
  let next = 0
  full.forEach((rect) => {
    if (rect.parent === -1) slots.push(rect.leaf ? next++ : -1)
    else if (full[rect.parent].parent === -1) slots.push(next++)
    else slots.push(slots[rect.parent])
  })
  return slots
}

function valueScale(full, domain) {
  const leaves = full.filter((rect) => rect.leaf).map((rect) => rect.value)
  const [dataLo, dataHi] = leaves.length ? [Math.min(...leaves), Math.max(...leaves)] : [0, 1]
  const ends = Array.isArray(domain) ? domain : []
  const pinnedLo = finite(ends[0])
  const pinnedHi = finite(ends[1])
  let lo = pinnedLo ?? (pinnedHi != null ? Math.min(dataLo, pinnedHi) : dataLo)
  let hi = pinnedHi ?? Math.max(dataHi, lo)
  if (hi < lo) [lo, hi] = [hi, lo]
  // An empty range has no gradient; every tile takes the low end.
  const share = (v) => (hi === lo ? 0 : Math.min(1, Math.max(0, (v - lo) / (hi - lo))))
  return { lo, hi, colorAt: (v) => mix(highColor, share(v) * 100, lowColor) }
}

function paintTile(rect, slot, colorBy, scale) {
  if (colorBy === "value" && rect.leaf) {
    const color = scale.colorAt(rect.value)
    // The edge is the scale's high end on every item, so a pale low-end tile still has an outline that clears 3:1.
    return { fill: mix(color, 55, "var(--background)"), stroke: highColor, swatch: color }
  }
  if (colorBy === "value" || slot < 0) return { fill: mix("var(--foreground)", 6, "var(--background)"), stroke: "var(--border)", swatch: "var(--muted-foreground)" }
  const base = `var(--chart-${(slot % DEFAULT_COLORS) + 1})`
  return rect.leaf
    ? { fill: mix(base, 30, "var(--background)"), stroke: base, swatch: base }
    : { fill: mix(base, 10, "var(--background)"), stroke: "var(--border)", swatch: base }
}

/** The name and value lines a tile has room for; a line that does not fit is left out, never clipped. */
function labelsOf(rect, text, format) {
  const fits = (s, width) => s.length * TEXT_WIDTH_PER_CHAR + 2 * LABEL_INSET <= width
  const name = text
  if (!rect.leaf) {
    const room = rect.headerHeight >= TEXT_HEIGHT && fits(name, rect.width)
    return room ? [{ part: "name", text: name, x: rect.x + LABEL_INSET, y: rect.y + rect.headerHeight / 2 }] : []
  }
  const out = []
  if (rect.height >= TEXT_HEIGHT + 2 * LABEL_INSET && fits(name, rect.width)) {
    out.push({ part: "name", text: name, x: rect.x + LABEL_INSET, y: rect.y + LABEL_INSET + TEXT_HEIGHT / 2 })
    const value = format(rect.value)
    if (rect.height >= 2 * TEXT_HEIGHT + 2 * LABEL_INSET && fits(value, rect.width)) {
      out.push({ part: "value", text: value, x: rect.x + LABEL_INSET, y: rect.y + LABEL_INSET + TEXT_HEIGHT * 1.5 })
    }
  }
  return out
}

function summarize(view, format) {
  const [root] = view
  if (!root) return "Empty treemap."
  const items = view.filter((rect) => rect.leaf).length
  const groups = view.filter((rect) => !rect.leaf && rect.parent !== -1).length
  const top = view.filter((rect) => rect.parent === 0).slice(0, 3)
  let text = `Treemap of ${root.path.join(SEPARATOR)}, ${format(root.value)} in ${items === 1 ? "1 item" : `${items} items`}`
  if (groups) text += ` across ${groups === 1 ? "1 group" : `${groups} groups`}`
  text += "."
  if (!root.leaf && top.length) text += ` Largest: ${top.map((rect) => `${rect.name} ${format(rect.value)}`).join(", ")}.`
  return text
}

function treemapModel({ full, slots, scale, zoom, colorBy, padding, header, margin, formatter, valueName, width, height }) {
  const plot = {
    x: margin.left,
    y: margin.top,
    width: Math.max(0, width - margin.left - margin.right),
    height: Math.max(0, height - margin.top - margin.bottom),
  }
  const laid = full.length === 0 ? [] : treemapLayout(subtree(full, zoom), { width: plot.width, height: plot.height, padding, header })
  const tiles = laid.map((rect, k) => {
    const placed = { ...rect, x: rect.x + plot.x, y: rect.y + plot.y }
    const paint = paintTile(placed, slots[zoom + k], colorBy, scale)
    // The zoomed root carries its whole path, so the header doubles as a breadcrumb.
    const label = k === 0 ? zoomedPath(full, zoom) : placed.name
    return { ...placed, index: k, fullIndex: zoom + k, ...paint, labels: labelsOf(placed, String(label), formatter) }
  })
  const indexAt = (point) => {
    for (let i = tiles.length - 1; i >= 0; i--) {
      const t = tiles[i]
      if (point.x >= t.x && point.x < t.x + t.width && point.y >= t.y && point.y < t.y + t.height) return i
    }
    return -1
  }
  return {
    width,
    height,
    plot,
    tiles,
    scale: colorBy === "value" ? scale : null,
    format: formatter,
    indexAt,
    anchorAt: (i) => [tiles[i].x + tiles[i].width / 2, tiles[i].y],
    payloadAt: (i) => [{ dataKey: "value", name: valueName, value: tiles[i].value, color: tiles[i].swatch, payload: { name: tiles[i].name, value: tiles[i].value } }],
    legendPayload:
      colorBy === "value"
        ? []
        : full.flatMap((rect, i) => (rect.parent === 0 || (rect.parent === -1 && rect.leaf) ? [{ dataKey: rect.name, value: rect.name, type: "rect", color: paintTile(rect, slots[i], "group", null).swatch }] : [])),
    category: { count: tiles.length, labels: tiles.map((t) => t.path.join(SEPARATOR)) },
    summary: summarize(laid, formatter),
  }
}

function zoomedPath(full, zoom) {
  return full[zoom].path.join(SEPARATOR)
}

// ── Root ────────────────────────────────────────────────────────────

const STEPS = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }

export function TreemapChart({
  data,
  colorBy = "group",
  domain,
  padding = 2,
  headerHeight = 20,
  formatter = plain,
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
  const summaryId = `chart-treemap-summary-${useId().replace(/[^\w-]/g, "")}`
  const { width, height } = useElementSize(plotRef, chart.initialDimension)
  const parts = collect(children, PARTS)
  const valueName = chart.config?.value?.label ?? "Value"
  const by = colorBy === "value" ? "value" : "group"

  const full = useMemo(() => treemapLayout(data, { width: 1, height: 1 }), [data])
  const slots = useMemo(() => colorSlots(full), [full])
  const [zoomState, setZoom] = useState(0)
  // Data can change under a drilled view; a group that is gone, or now a leaf, falls back to the whole tree.
  const zoom = full[zoomState] && !full[zoomState].leaf ? zoomState : 0

  const options = { colorBy: by, domain, padding: finite(padding) ?? 2, header: finite(headerHeight) ?? 20, margin: { ...DEFAULT_MARGIN, ...margin } }
  const signature = json(options)
  const model = useMemo(
    () => treemapModel({ ...options, full, slots, scale: valueScale(full, domain), zoom, formatter, valueName, width, height }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [full, slots, zoom, width, height, signature, formatter, valueName],
  )

  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => {
      for (const el of [...parts.unknown, ...parts.stray, ...parts.duplicates]) {
        console.warn(`<${el.type?.displayName ?? el.type?.name ?? "component"}> is not a treemap part and was ignored; only ChartTooltip and ChartLegend draw here.`)
      }
    }, [parts.unknown.length, parts.stray.length, parts.duplicates.length])
  }

  const tooltipEl = parts.tooltip
  const { activeIndex, pointer, layoutRef, activate, surface, keyboard } = useActiveIndex({
    count: model.tiles.length,
    defaultIndex: tooltipEl?.props.defaultIndex,
    trigger: tooltipEl?.props.trigger,
    indexAt: model.indexAt,
    syncId,
  })

  const drillIn = (tile) => {
    if (!tile || tile.leaf || tile.index === 0) return false
    setZoom(tile.fullIndex)
    activate(0, "keyboard")
    return true
  }
  const climb = () => {
    if (zoom === 0) return false
    const parent = full[zoom].parent
    setZoom(parent)
    activate(zoom - parent, "keyboard")
    return true
  }

  // The tiles do not mirror in RTL, so the arrows follow the screen. A synced chart can hand over an
  // index this one does not have; it counts as none, so forward lands on the first tile and back on the last.
  const onKeyDown = (event) => {
    const count = model.tiles.length
    const step = STEPS[event.key]
    if (step != null && count) {
      event.preventDefault()
      const from = activeIndex != null && activeIndex < count ? activeIndex : null
      activate(step > 0 ? Math.min(count - 1, (from ?? -1) + 1) : Math.max(0, (from ?? count) - 1), "keyboard")
      return
    }
    if (event.key === "Enter" && activeIndex != null && drillIn(model.tiles[activeIndex])) {
      event.preventDefault()
      return
    }
    if (event.key === "Escape" && climb()) {
      event.preventDefault()
      return
    }
    keyboard.onKeyDown(event)
  }
  const onDoubleClick = (event) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const tile = model.tiles[model.indexAt({ x: event.clientX - rect.left, y: event.clientY - rect.top })]
    if (tile?.index === 0) climb()
    else drillIn(tile)
  }

  const labelled = ariaLabel != null || ariaLabelledBy != null
  const ownSummary = accessibilityLayer && ariaDescribedBy == null
  const a11y = surfaceA11y(accessibilityLayer, labelled, { ...keyboard, onKeyDown })

  // ChartLegend names series through the config, and a treemap's groups come from the data: its own legend names them, or draws the scale by value.
  const legendEl = parts.legend && parts.legend.type !== TreemapLegend ? <TreemapLegend verticalAlign={parts.legend.props.verticalAlign} /> : parts.legend
  const legendTop = legendEl && legendEl.props.verticalAlign === "top"

  return (
    <LayoutContext.Provider value={model}>
      <ActiveIndexContext.Provider value={activeIndex}>
        <PointerContext.Provider value={pointer}>
          <div ref={layoutRef} className={cn("chart-layout chart-treemap", className)} data-color-by={by} data-zoomed={zoom !== 0 || undefined} {...props}>
            {legendTop ? legendEl : null}
            <div className="chart-plot" ref={plotRef}>
              <svg
                className="chart-surface"
                width={width}
                height={height}
                aria-label={ariaLabel}
                aria-labelledby={ariaLabelledBy}
                aria-describedby={ownSummary ? summaryId : ariaDescribedBy}
                onDoubleClick={onDoubleClick}
                {...surface}
                {...a11y}
              >
                {parts.passthrough}
                <g className="chart-treemap-tiles">
                  {model.tiles.map((tile) => (
                    <rect
                      key={tile.fullIndex}
                      className="chart-treemap-tile"
                      data-index={tile.index}
                      data-depth={tile.depth}
                      data-kind={tile.leaf ? "leaf" : "group"}
                      data-value={tile.value}
                      data-active={tile.index === activeIndex || undefined}
                      x={tile.x}
                      y={tile.y}
                      width={tile.width}
                      height={tile.height}
                      style={{ fill: tile.fill, stroke: tile.stroke }}
                    />
                  ))}
                </g>
                <g className="chart-treemap-labels" aria-hidden="true">
                  {model.tiles.flatMap((tile) =>
                    tile.labels.map((label) => (
                      <text key={`${tile.fullIndex}-${label.part}`} className="chart-treemap-label" data-index={tile.index} data-part={label.part} x={label.x} y={label.y} dominantBaseline="central">
                        {label.text}
                      </text>
                    )),
                  )}
                </g>
                {activeIndex != null && model.tiles[activeIndex] ? (
                  <rect
                    className="chart-treemap-active"
                    data-index={activeIndex}
                    x={model.tiles[activeIndex].x}
                    y={model.tiles[activeIndex].y}
                    width={model.tiles[activeIndex].width}
                    height={model.tiles[activeIndex].height}
                  />
                ) : null}
              </svg>
              {tooltipEl}
            </div>
            {legendEl && !legendTop ? legendEl : null}
            {ownSummary ? (
              <p id={summaryId} className="chart-treemap-summary" hidden>
                {model.summary}
              </p>
            ) : null}
          </div>
        </PointerContext.Provider>
      </ActiveIndexContext.Provider>
    </LayoutContext.Provider>
  )
}

// ── Legend ──────────────────────────────────────────────────────────

export function TreemapLegend({ formatter, verticalAlign = "bottom", className, ...props }) {
  const layout = useContext(LayoutContext)
  if (!layout) return null
  const { scale, legendPayload } = layout
  const format = formatter ?? layout.format
  if (!scale) {
    return (
      <div className={cn("chart-legend chart-treemap-legend", `chart-legend--${verticalAlign}`, className)} {...props}>
        {legendPayload.map((item) => (
          <div key={item.dataKey} className="chart-legend-item" data-group={item.dataKey}>
            <div className="chart-legend-swatch" style={{ backgroundColor: item.color }} />
            {item.value}
          </div>
        ))}
      </div>
    )
  }
  return (
    <div className={cn("chart-legend chart-treemap-legend", `chart-legend--${verticalAlign}`, className)} {...props}>
      <span className="chart-treemap-legend-label" data-end="low">
        {format(scale.lo)}
      </span>
      <span className="chart-treemap-legend-ramp" aria-hidden="true" style={{ backgroundImage: `linear-gradient(to right in oklab, ${scale.colorAt(scale.lo)}, ${scale.colorAt(scale.hi)})` }} />
      <span className="chart-treemap-legend-label" data-end="high">
        {format(scale.hi)}
      </span>
    </div>
  )
}
TreemapLegend.chartRole = "legend"
