/**
 * Squarified treemap layout for ui/chart-treemap: a nested { name, value,
 * children } tree becomes one flat list of rects whose areas are proportional
 * to value, with a padded frame and a header band per group. No DOM, no React
 * — runs under plain Node so the unit suite can pin every rule here without a
 * browser.
 */

const isNum = (v) => typeof v === "number" && Number.isFinite(v)

/** The tree with unusable nodes dropped, children sorted by value descending, group values summed. */
function prune(node) {
  // An empty children array is a leaf, as d3.hierarchy reads one.
  if (Array.isArray(node.children) && node.children.length) {
    const children = node.children
      .map(prune)
      .filter(Boolean)
      .sort((a, b) => b.value - a.value)
    if (!children.length) return null
    return { name: node.name, value: children.reduce((sum, c) => sum + c.value, 0), children }
  }
  return isNum(node.value) && node.value > 0 ? { name: node.name, value: node.value } : null
}

/**
 * Bruls, Huizing and van Wijk (2000): grow a row along the short side while
 * the worst aspect ratio in it keeps improving, then start the next row in
 * what is left. Greedy on aspect ratio, so tiles come out near-square instead
 * of the slivers slice-and-dice produces.
 */
function squarify(areas, x, y, width, height) {
  const rects = []
  let i = 0
  while (i < areas.length) {
    const side = Math.min(width, height)
    let end = i + 1
    let sum = areas[i]
    let worst = worstRatio(areas[i], areas[i], sum, side)
    while (end < areas.length) {
      const nextSum = sum + areas[end]
      const next = worstRatio(areas[i], areas[end], nextSum, side)
      if (next > worst) break
      sum = nextSum
      worst = next
      end++
    }
    const wide = width >= height
    const across = wide ? height : width
    // The last row takes exactly what is left: at extreme value ratios float
    // drift can leave a remaining side of 0, and dividing by it gives an
    // infinite tile.
    const thickness = end === areas.length ? (wide ? width : height) : across > 0 ? sum / across : 0
    let cursor = wide ? y : x
    for (let k = i; k < end; k++) {
      const length = sum > 0 ? (areas[k] / sum) * across : 0
      rects.push(wide ? { x, y: cursor, width: thickness, height: length } : { x: cursor, y, width: length, height: thickness })
      cursor += length
    }
    if (wide) {
      x += thickness
      width -= thickness
    } else {
      y += thickness
      height -= thickness
    }
    i = end
  }
  return rects
}

// areas are sorted descending, so the row's extremes are its first and newest members.
function worstRatio(largest, smallest, sum, side) {
  const s2 = side * side
  return Math.max((s2 * largest) / (sum * sum), (sum * sum) / (s2 * smallest))
}

/**
 * Lay a tree out in a width × height box. Returns a flat pre-order list (a
 * group, then its children largest first, each subtree before the next
 * sibling) — the order a keyboard walks the tiles in. Each rect carries
 * { x, y, width, height, depth, name, value, path, parent, leaf, headerHeight }:
 * path is the names from the root down (a tooltip's "Group › Item"), parent
 * the flat index of the enclosing group (-1 at the root), headerHeight the
 * band at the top of a group's rect (0 on a leaf). A group's children fill its
 * rect inset by `padding` on every side and by `header` at the top. A node
 * with children is a group whose value is the sum of its kept children;
 * zero, negative and non-finite leaves are dropped, and a group left with no
 * children goes with them. An unusable root returns [].
 */
export function treemapLayout(root, { width, height, padding = 0, header = 0 } = {}) {
  const tree = root && prune(root)
  if (!tree || !isNum(width) || !isNum(height)) return []
  const pad = Math.max(0, padding)
  const band = Math.max(0, header)
  const out = []

  const place = (node, x, y, w, h, depth, path, parent) => {
    const leaf = !node.children
    const rect = {
      x, y, width: w, height: h, depth, name: node.name, value: node.value,
      path, parent, leaf, headerHeight: leaf ? 0 : Math.min(band, h),
    }
    const index = out.push(rect) - 1
    if (leaf) return
    const innerX = x + pad
    const innerY = y + rect.headerHeight + pad
    const innerW = Math.max(0, w - 2 * pad)
    const innerH = Math.max(0, h - rect.headerHeight - 2 * pad)
    const scale = innerW * innerH / node.value
    // A collapsed box has no short side to squarify against; every child collapses onto its origin.
    const slots = scale > 0
      ? squarify(node.children.map((c) => c.value * scale), innerX, innerY, innerW, innerH)
      : node.children.map(() => ({ x: innerX, y: innerY, width: 0, height: 0 }))
    node.children.forEach((child, k) => {
      const s = slots[k]
      place(child, s.x, s.y, s.width, s.height, depth + 1, [...path, child.name], index)
    })
  }

  place(tree, 0, 0, Math.max(0, width), Math.max(0, height), 0, [tree.name], -1)
  return out
}
