/**
 * Pure cartesian-chart arithmetic for ui/chart: scales, nice ticks, stacking,
 * curve paths, tick thinning. No DOM, no React — runs under plain Node so the
 * unit suite can pin every rule here without a browser.
 */

const isNum = (v) => typeof v === "number" && Number.isFinite(v)

/** [min, max] over columns of (number | null)[]; includeZero folds 0 in. */
export function extent(columns, includeZero = false) {
  let min = Infinity
  let max = -Infinity
  for (const column of columns) {
    for (const v of column) {
      if (!isNum(v)) continue
      if (v < min) min = v
      if (v > max) max = v
    }
  }
  if (includeZero) {
    if (min > 0) min = 0
    if (max < 0) max = 0
  }
  if (min === Infinity) return [0, 0]
  return [min, max]
}

function tickStep(min, max, count) {
  const span = max - min
  if (!(span > 0) || !(count > 0)) return 0
  const rough = span / count
  const magnitude = 10 ** Math.floor(Math.log10(rough))
  const error = rough / magnitude
  // d3's tickIncrement thresholds: √50, √10, √2.
  const factor = error >= 7.07 ? 10 : error >= 3.16 ? 5 : error >= 1.41 ? 2 : 1
  return factor * magnitude
}

const snap = (v, step) => {
  const decimals = Math.max(0, -Math.floor(Math.log10(step)))
  return Number(v.toFixed(decimals + 2))
}

/** 1/2/5 × 10^n steps spanning [min, max]; the ends land on multiples of the step. */
export function niceTicks(min, max, count = 5) {
  if (min === max) return [min]
  if (min > max) [min, max] = [max, min]
  const step = tickStep(min, max, count)
  if (!step) return [min, max]
  const lo = Math.floor(min / step) * step
  const hi = Math.ceil(max / step) * step
  const ticks = []
  for (let v = lo; v <= hi + step / 2; v += step) ticks.push(snap(v, step))
  return ticks
}

/** [lo, hi] rounded outward onto the nice-tick grid. */
export function niceDomain(min, max, count = 5) {
  if (min === max) return [min, max]
  const ticks = niceTicks(min, max, count)
  return [ticks[0], ticks[ticks.length - 1]]
}

/**
 * Recharts domain spec → [lo, hi]. Each end is a number (folded into the data
 * extent unless allowDataOverflow), "auto" (rounded onto the nice-tick grid),
 * "dataMin"/"dataMax" (exact), or a function of the exact end.
 */
export function resolveDomain(spec, ext, count = 5, allowDataOverflow = false) {
  const [dMin, dMax] = ext
  const [s0, s1] = Array.isArray(spec) ? spec : ["auto", "auto"]
  let lo = dMin
  let hi = dMax
  // A numeric end the data overshoots behaves as "auto": the consumer asked
  // for a zero baseline, not for the bars to stop at -209.
  let niceLo = s0 === "auto"
  let niceHi = s1 === "auto"
  if (isNum(s0)) {
    if (allowDataOverflow || s0 <= dMin) lo = s0
    else niceLo = true
  }
  if (isNum(s1)) {
    if (allowDataOverflow || s1 >= dMax) hi = s1
    else niceHi = true
  }
  if (typeof s0 === "function") lo = s0(dMin)
  if (typeof s1 === "function") hi = s1(dMax)
  if (lo === hi) {
    lo -= 1
    hi += 1
  }
  const nice = niceDomain(lo, hi, count)
  if (niceLo) lo = nice[0]
  if (niceHi) hi = nice[1]
  if (lo > hi) [lo, hi] = [hi, lo]
  return [lo, hi]
}

/** Linear map from domain to range; `invert` maps a pixel back to a value. */
export function linearScale([d0, d1], [r0, r1]) {
  const span = d1 - d0
  const scale = (v) => (span === 0 ? (r0 + r1) / 2 : r0 + ((v - d0) / span) * (r1 - r0))
  scale.invert = (px) => (r1 === r0 ? d0 : d0 + ((px - r0) / (r1 - r0)) * span)
  scale.domain = [d0, d1]
  scale.range = [r0, r1]
  return scale
}

function slotScale(count, [r0, r1], step, bandwidth, pad) {
  const start = (i) => r0 + pad + i * step
  const center = (i) => start(i) + bandwidth / 2
  const indexAt = (px) => {
    if (count === 0) return -1
    const i = Math.round((px - pad - r0 - bandwidth / 2) / (step || 1))
    return Math.max(0, Math.min(count - 1, i))
  }
  return { step, bandwidth, start, center, indexAt, range: [r0, r1], count }
}

/** Equal bands across the range with a gap fraction either side of each band. */
export function bandScale(count, [r0, r1], { categoryGap = 0.1 } = {}) {
  const span = r1 - r0
  const step = count > 0 ? span / count : 0
  const bandwidth = step * (1 - categoryGap)
  return slotScale(count, [r0, r1], step, bandwidth, (step - bandwidth) / 2)
}

/** Points spread edge to edge: the first at r0, the last at r1, bandwidth 0. */
export function pointScale(count, [r0, r1]) {
  const span = r1 - r0
  const step = count > 1 ? span / (count - 1) : 0
  const pad = count > 1 ? 0 : span / 2
  return slotScale(count, [r0, r1], step, 0, pad)
}

/** Lay `n` bars inside one band: [{ offset, size }] relative to the band start. */
export function barSlots(bandwidth, n, { barGap = 4, barSize, maxBarSize } = {}) {
  if (n <= 0) return []
  const gap = n > 1 ? barGap : 0
  let size = isNum(barSize) ? barSize : (bandwidth - gap * (n - 1)) / n
  if (isNum(maxBarSize)) size = Math.min(size, maxBarSize)
  size = Math.max(0, size)
  const total = size * n + gap * (n - 1)
  const offset0 = (bandwidth - total) / 2
  return Array.from({ length: n }, (_, i) => ({ offset: offset0 + i * (size + gap), size }))
}

/**
 * Stack rows of series values: positives pile upward from 0, negatives
 * downward, a null contributes nothing. Returns { y0, y1 }[series][datum].
 */
export function stackSeries(rows) {
  const n = rows[0]?.length ?? 0
  const up = new Array(n).fill(0)
  const down = new Array(n).fill(0)
  return rows.map((row) =>
    row.map((v, i) => {
      if (!isNum(v) || v === 0) return { y0: up[i], y1: up[i] }
      if (v > 0) {
        const y0 = up[i]
        up[i] += v
        return { y0, y1: up[i] }
      }
      const y0 = down[i]
      down[i] += v
      return { y0, y1: down[i] }
    }),
  )
}

/** Index of the centre nearest px; a midpoint tie resolves to the lower index. */
export function nearestIndex(px, centers) {
  const n = centers.length
  if (n === 0) return -1
  let lo = 0
  let hi = n - 1
  while (lo < hi) {
    const mid = (lo + hi) >> 1
    if (centers[mid] < px) lo = mid + 1
    else hi = mid
  }
  if (lo > 0 && px - centers[lo - 1] <= centers[lo] - px) return lo - 1
  return lo
}

/**
 * Which ticks to keep so neighbours are at least minGap apart; the first and
 * last always survive, the rest are dropped greedily from the first. Positions
 * may run either way (a y axis counts down the screen).
 */
export function thinTicks(positions, widths, minGap = 0) {
  const n = positions.length
  const keep = new Array(n).fill(false)
  if (n === 0) return keep
  keep[0] = true
  keep[n - 1] = true
  const w = (i) => (Array.isArray(widths) ? (widths[i] ?? 0) : (widths ?? 0))
  const dir = positions[n - 1] < positions[0] ? -1 : 1
  const pos = (i) => positions[i] * dir
  const lastEdge = pos(n - 1) - w(n - 1) / 2
  let edge = pos(0) + w(0) / 2
  for (let i = 1; i < n - 1; i++) {
    const left = pos(i) - w(i) / 2
    const right = pos(i) + w(i) / 2
    if (left - edge >= minGap && lastEdge - right >= minGap) {
      keep[i] = true
      edge = right
    }
  }
  return keep
}

/** Split a point list at nulls; connectNulls drops the gaps instead. */
export function splitRuns(points, connectNulls = false) {
  const runs = []
  let run = []
  for (const p of points) {
    if (p == null) {
      if (!connectNulls && run.length) {
        runs.push(run)
        run = []
      }
      continue
    }
    run.push(p)
  }
  if (run.length) runs.push(run)
  return runs
}

const fmt = (v) => Number(v.toFixed(2)).toString()
const pt = (p) => `${fmt(p[0])} ${fmt(p[1])}`

function monotoneSegments(points) {
  const n = points.length
  if (n < 2) return ""
  const dx = []
  const dy = []
  const slope = []
  for (let i = 0; i < n - 1; i++) {
    dx.push(points[i + 1][0] - points[i][0])
    dy.push(points[i + 1][1] - points[i][1])
    slope.push(dx[i] === 0 ? 0 : dy[i] / dx[i])
  }
  // Fritsch–Carlson: tangents that keep each segment monotone in y.
  const m = new Array(n)
  m[0] = slope[0]
  m[n - 1] = slope[n - 2]
  for (let i = 1; i < n - 1; i++) {
    if (slope[i - 1] * slope[i] <= 0) m[i] = 0
    else {
      const w1 = 2 * dx[i] + dx[i - 1]
      const w2 = dx[i] + 2 * dx[i - 1]
      m[i] = (w1 + w2) / (w1 / slope[i - 1] + w2 / slope[i])
    }
  }
  let d = ""
  for (let i = 0; i < n - 1; i++) {
    const [x0, y0] = points[i]
    const [x1, y1] = points[i + 1]
    const h = dx[i] / 3
    d += ` C ${fmt(x0 + h)} ${fmt(y0 + m[i] * h)}, ${fmt(x1 - h)} ${fmt(y1 - m[i + 1] * h)}, ${pt([x1, y1])}`
  }
  return d
}

/** SVG path data through points; natural/basis alias monotone. */
export function curvePath(points, type = "linear") {
  if (!points.length) return ""
  const start = `M ${pt(points[0])}`
  if (points.length === 1) return start
  switch (type) {
    case "monotone":
    case "monotoneX":
    case "natural":
    case "basis":
      return start + monotoneSegments(points)
    case "step": {
      let d = start
      for (let i = 1; i < points.length; i++) {
        const xm = (points[i - 1][0] + points[i][0]) / 2
        d += ` L ${fmt(xm)} ${fmt(points[i - 1][1])} L ${fmt(xm)} ${fmt(points[i][1])} L ${pt(points[i])}`
      }
      return d
    }
    case "stepBefore": {
      let d = start
      for (let i = 1; i < points.length; i++) {
        d += ` L ${fmt(points[i - 1][0])} ${fmt(points[i][1])} L ${pt(points[i])}`
      }
      return d
    }
    case "stepAfter": {
      let d = start
      for (let i = 1; i < points.length; i++) {
        d += ` L ${fmt(points[i][0])} ${fmt(points[i - 1][1])} L ${pt(points[i])}`
      }
      return d
    }
    default:
      return start + points.slice(1).map((p) => ` L ${pt(p)}`).join("")
  }
}

/** One path per run of non-null points. */
export function linePath(points, type = "linear", connectNulls = false) {
  return splitRuns(points, connectNulls)
    .map((run) => curvePath(run, type))
    .join(" ")
}

/** Closed area: the upper curve, then the lower edge walked back, then Z. */
export function areaPath(upper, lower, type = "linear") {
  if (!upper.length) return ""
  const top = curvePath(upper, type)
  const back = curvePath([...lower].reverse(), type)
  return `${top} L ${back.slice(2)} Z`
}
