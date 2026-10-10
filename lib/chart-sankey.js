/**
 * Sankey layout for ui/chart-sankey: nodes and weighted links in, positioned
 * node rectangles and cubic link bands out. No DOM, no React — runs under
 * plain Node so the unit suite can pin every rule here without a browser.
 *
 * Constraint: the result must be a pure function of the input. Every sort
 * breaks ties by input index and the relaxation runs a fixed number of
 * passes, so the same data renders the same diagram on every load and in
 * every test. A cycle has no left-to-right order, so it throws instead of
 * drawing something misleading.
 */

const isNum = (v) => typeof v === "number" && Number.isFinite(v)

const byPosition = (a, b) => a.y0 - b.y0 || a.index - b.index

function findCycle(nodes, outgoing) {
  const WHITE = 0
  const ON_PATH = 1
  const DONE = 2
  const state = new Array(nodes.length).fill(WHITE)
  const path = []
  const visit = (i) => {
    state[i] = ON_PATH
    path.push(i)
    for (const t of outgoing[i]) {
      if (state[t] === ON_PATH) return [...path.slice(path.indexOf(t)), t]
      if (state[t] === WHITE) {
        const found = visit(t)
        if (found) return found
      }
    }
    path.pop()
    state[i] = DONE
    return null
  }
  for (let i = 0; i < nodes.length; i++) {
    if (state[i] === WHITE) {
      const found = visit(i)
      if (found) return found
    }
  }
  return null
}

function assignColumns(count, outgoing, incoming, align) {
  const column = new Array(count).fill(0)
  const pending = incoming.map((list) => list.length)
  const queue = []
  for (let i = 0; i < count; i++) if (pending[i] === 0) queue.push(i)
  for (let head = 0; head < queue.length; head++) {
    const i = queue[head]
    for (const t of outgoing[i]) {
      column[t] = Math.max(column[t], column[i] + 1)
      if (--pending[t] === 0) queue.push(t)
    }
  }
  const last = Math.max(0, ...column)
  // Justified sinks sit on the right edge so every outcome lines up under
  // one header; a sink left mid-diagram reads as an unfinished flow.
  if (align === "justify") {
    for (let i = 0; i < count; i++) {
      if (outgoing[i].length === 0 && incoming[i].length > 0) column[i] = last
    }
  }
  return { column, last }
}

function resolveCollisions(members, height, padding) {
  members.sort(byPosition)
  let cursor = 0
  for (const node of members) {
    node.y0 = Math.max(node.y0, cursor)
    cursor = node.y0 + node.height + padding
  }
  let limit = height
  for (let i = members.length - 1; i >= 0; i--) {
    members[i].y0 = Math.min(members[i].y0, limit - members[i].height)
    limit = members[i].y0 - padding
  }
}

function relax(members, neighbours, alpha, nodes, height, padding) {
  for (const node of members) {
    let weight = 0
    let sum = 0
    for (const link of neighbours(node)) {
      const other = nodes[link.other]
      weight += link.value
      sum += link.value * (other.y0 + other.height / 2)
    }
    if (weight > 0) node.y0 += (sum / weight - (node.y0 + node.height / 2)) * alpha
  }
  resolveCollisions(members, height, padding)
}

/**
 * Lay out a Sankey diagram inside [0, width] × [0, height].
 *
 * nodes: [{ id, ... }]; links: [{ source, target, value }] by node id. A link
 * with a non-positive or non-numeric value has no band and is dropped; an
 * unknown endpoint throws. align "justify" (default) pushes sinks to the last
 * column, "left" leaves them one column past their deepest source. nodeWidth
 * and nodePadding shrink to fit a box too small for them.
 *
 * Returns { nodes, links, columns }. nodes keep input order; columns lists
 * node indices per column, top to bottom — the order keyboard navigation and
 * a screen-reader walk follow. Each node: { id, index, datum, column, x0, x1,
 * y0, y1, height, value, valueIn, valueOut, sourceLinks, targetLinks } with
 * the link lists as indices into links, ordered top to bottom by where the
 * band meets the node. Each link: { index, datum, source, target, value,
 * width, x0, x1, y0, y1, d } with source/target as node indices and y0/y1 the
 * band centre at either end, so the renderer strokes d at `width` and a
 * tooltip anchors at ((x0 + x1) / 2, (y0 + y1) / 2).
 */
export function sankeyLayout({
  nodes: inputNodes = [],
  links: inputLinks = [],
  width = 0,
  height = 0,
  nodeWidth = 12,
  nodePadding = 8,
  iterations = 6,
  align = "justify",
} = {}) {
  const indexById = new Map()
  inputNodes.forEach((datum, index) => {
    if (indexById.has(datum.id)) throw new Error(`Sankey node id "${datum.id}" is duplicated`)
    indexById.set(datum.id, index)
  })

  const count = inputNodes.length
  const outgoing = Array.from({ length: count }, () => [])
  const incoming = Array.from({ length: count }, () => [])
  const links = []
  for (const datum of inputLinks) {
    const source = indexById.get(datum.source)
    const target = indexById.get(datum.target)
    if (source === undefined || target === undefined) {
      throw new Error(`Sankey link ${datum.source} -> ${datum.target} names a node that does not exist`)
    }
    if (!isNum(datum.value) || datum.value <= 0) continue
    const index = links.length
    links.push({ index, datum, source, target, value: datum.value })
    outgoing[source].push(target)
    incoming[target].push(source)
  }

  const cycle = findCycle(inputNodes, outgoing)
  if (cycle) {
    throw new Error(`Sankey links form a cycle: ${cycle.map((i) => inputNodes[i].id).join(" -> ")}`)
  }

  const { column, last } = assignColumns(count, outgoing, incoming, align)
  const nodes = inputNodes.map((datum, index) => ({
    id: datum.id,
    index,
    datum,
    column: column[index],
    x0: 0,
    x1: 0,
    y0: 0,
    y1: 0,
    height: 0,
    value: 0,
    valueIn: 0,
    valueOut: 0,
    sourceLinks: [],
    targetLinks: [],
  }))
  for (const link of links) {
    nodes[link.source].sourceLinks.push(link.index)
    nodes[link.target].targetLinks.push(link.index)
    nodes[link.source].valueOut += link.value
    nodes[link.target].valueIn += link.value
  }
  for (const node of nodes) node.value = Math.max(node.valueIn, node.valueOut)

  const columns = Array.from({ length: last + 1 }, () => [])
  for (const node of nodes) columns[node.column].push(node)

  const boxWidth = Math.max(0, width)
  const boxHeight = Math.max(0, height)
  // Capped at one column's share of the width, so neighbouring columns never
  // overlap and every band runs left to right.
  const barWidth = Math.min(Math.max(0, nodeWidth), boxWidth / (last + 1))
  // Capped as d3-sankey caps it: padding that outgrows the tallest column's
  // share of the height would push nodes above the box.
  const tallest = Math.max(...columns.map((members) => members.length))
  const padding = Math.min(Math.max(0, nodePadding), tallest > 1 ? boxHeight / (tallest - 1) : Infinity)

  // One scale for the whole diagram, set by the tightest column, so a unit of
  // flow is the same height everywhere and bands keep their width end to end.
  let scale = Infinity
  for (const members of columns) {
    const total = members.reduce((sum, node) => sum + node.value, 0)
    if (total > 0) scale = Math.min(scale, Math.max(0, boxHeight - (members.length - 1) * padding) / total)
  }
  if (scale === Infinity) scale = 0

  const step = last > 0 ? (boxWidth - barWidth) / last : 0
  for (const members of columns) {
    let y = 0
    for (const node of members) {
      node.height = node.value * scale
      node.y0 = y
      y += node.height + padding
      node.x0 = node.column * step
      node.x1 = node.x0 + barWidth
    }
  }

  const passes = Math.max(0, Math.floor(iterations))
  const incomingOf = (node) => node.targetLinks.map((i) => ({ other: links[i].source, value: links[i].value }))
  const outgoingOf = (node) => node.sourceLinks.map((i) => ({ other: links[i].target, value: links[i].value }))
  for (let pass = 0; pass < passes; pass++) {
    const alpha = 0.99 ** pass
    for (let c = 1; c <= last; c++) relax(columns[c], incomingOf, alpha, nodes, boxHeight, padding)
    for (let c = last - 1; c >= 0; c--) relax(columns[c], outgoingOf, alpha, nodes, boxHeight, padding)
  }
  for (const members of columns) resolveCollisions(members, boxHeight, padding)

  for (const node of nodes) {
    node.y1 = node.y0 + node.height
    // Ordering by the far node's position is what stops bands twisting over
    // each other inside a node.
    node.sourceLinks.sort(
      (a, b) => nodes[links[a].target].y0 - nodes[links[b].target].y0 || links[a].index - links[b].index,
    )
    node.targetLinks.sort(
      (a, b) => nodes[links[a].source].y0 - nodes[links[b].source].y0 || links[a].index - links[b].index,
    )
    let y = node.y0
    for (const i of node.sourceLinks) {
      links[i].width = links[i].value * scale
      links[i].y0 = y + links[i].width / 2
      y += links[i].width
    }
    y = node.y0
    for (const i of node.targetLinks) {
      links[i].y1 = y + links[i].value * scale / 2
      y += links[i].value * scale
    }
  }
  for (const link of links) {
    link.x0 = nodes[link.source].x1
    link.x1 = nodes[link.target].x0
    const mid = (link.x0 + link.x1) / 2
    link.d = `M ${link.x0} ${link.y0} C ${mid} ${link.y0} ${mid} ${link.y1} ${link.x1} ${link.y1}`
  }

  return { nodes, links, columns: columns.map((members) => members.map((node) => node.index)) }
}
