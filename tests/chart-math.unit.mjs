import {
  extent,
  niceTicks,
  niceDomain,
  resolveDomain,
  linearScale,
  bandScale,
  pointScale,
  barSlots,
  stackSeries,
  nearestIndex,
  thinTicks,
  splitRuns,
  curvePath,
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
} from "../lib/chart-math.js"
import assert from "node:assert/strict"

let passed = 0
let failed = 0

function test(name, fn) {
  try {
    fn()
    passed++
  } catch (e) {
    failed++
    console.error(`FAIL: ${name}`)
    console.error("  ", e.message)
  }
}

// --- extent ---

test("extent spans every column and skips nulls", () => {
  assert.deepEqual(extent([[3, null, 9], [1, 4]]), [1, 9])
})

test("extent folds zero in only when asked", () => {
  assert.deepEqual(extent([[3, 9]]), [3, 9])
  assert.deepEqual(extent([[3, 9]], true), [0, 9])
  assert.deepEqual(extent([[-3, -9]], true), [-9, 0])
})

test("extent of nothing is [0, 0]", () => {
  assert.deepEqual(extent([[null]]), [0, 0])
})

// --- ticks ---

test("niceTicks(0, 100, 5) steps by 20", () => {
  assert.deepEqual(niceTicks(0, 100, 5), [0, 20, 40, 60, 80, 100])
})

test("niceTicks rounds the ends outward onto the grid", () => {
  const ticks = niceTicks(3, 97, 5)
  assert.notDeepEqual(ticks, [3, 97])
  assert.equal(ticks[0], 0)
  assert.equal(ticks.at(-1), 100)
})

test("niceTicks avoids float drift on fractional steps", () => {
  assert.deepEqual(niceTicks(0, 1, 5), [0, 0.2, 0.4, 0.6, 0.8, 1])
})

test("niceTicks on a flat extent is the single value", () => {
  assert.deepEqual(niceTicks(5, 5), [5])
})

test("niceDomain is the first and last nice tick", () => {
  assert.deepEqual(niceDomain(3, 97), [0, 100])
  assert.deepEqual(niceDomain(-15, 42), [-20, 50])
})

// --- resolveDomain ---

test("resolveDomain: dataMax is exact, auto is nice", () => {
  assert.deepEqual(resolveDomain([0, "dataMax"], [12, 97]), [0, 97])
  assert.deepEqual(resolveDomain(["auto", "auto"], [12, 97]), [0, 100])
})

test("resolveDomain: a numeric end the data overshoots rounds nice, unless allowDataOverflow", () => {
  assert.deepEqual(resolveDomain([10, 50], [12, 97]), [10, 100])
  assert.deepEqual(resolveDomain([10, 50], [12, 97], 5, true), [10, 50])
  assert.deepEqual(resolveDomain([0, "auto"], [-15, 42]), [-20, 50])
  assert.deepEqual(resolveDomain([0, "auto"], [12, 42]), [0, 50])
})

test("resolveDomain: a function receives the exact end", () => {
  assert.deepEqual(resolveDomain([0, (max) => max * 2], [12, 50]), [0, 100])
})

test("resolveDomain: a collapsed domain is widened", () => {
  const [lo, hi] = resolveDomain(["dataMin", "dataMax"], [7, 7])
  assert.ok(lo < 7 && hi > 7)
})

// --- linearScale ---

test("linearScale hits both range ends", () => {
  const s = linearScale([0, 100], [200, 0])
  assert.equal(s(0), 200)
  assert.equal(s(100), 0)
  assert.equal(s(50), 100)
})

test("linearScale.invert round-trips", () => {
  const s = linearScale([10, 60], [0, 400])
  assert.equal(s.invert(s(37)), 37)
})

test("linearScale on a flat domain sits mid-range", () => {
  const s = linearScale([5, 5], [0, 100])
  assert.equal(s(5), 50)
})

// --- bandScale / pointScale ---

test("bandScale(4, [0, 400]) steps by 100 and indexAt inverts center", () => {
  const b = bandScale(4, [0, 400])
  assert.equal(b.step, 100)
  for (let i = 0; i < 4; i++) assert.equal(b.indexAt(b.center(i)), i)
  assert.ok(b.center(0) > 0, "a band's first centre sits inside the range")
  assert.ok(b.bandwidth < b.step)
})

test("bandScale indexAt clamps outside the range", () => {
  const b = bandScale(4, [0, 400])
  assert.equal(b.indexAt(-50), 0)
  assert.equal(b.indexAt(900), 3)
})

test("pointScale puts the first point on r0 and the last on r1", () => {
  const p = pointScale(5, [0, 100])
  assert.equal(p.center(0), 0)
  assert.equal(p.center(4), 100)
  assert.equal(p.bandwidth, 0)
  assert.equal(p.indexAt(55), 2)
})

test("pointScale with one point centres it", () => {
  const p = pointScale(1, [0, 100])
  assert.equal(p.center(0), 50)
})

// --- barSlots ---

test("barSlots fit inside the band with the gap between", () => {
  const slots = barSlots(100, 2, { barGap: 4 })
  assert.equal(slots.length, 2)
  assert.equal(slots[0].offset, 0)
  assert.equal(slots[0].size, 48)
  assert.equal(slots[1].offset, 52)
})

test("barSlots: barSize wins and is centred", () => {
  const [slot] = barSlots(100, 1, { barSize: 20 })
  assert.equal(slot.size, 20)
  assert.equal(slot.offset, 40)
})

test("barSlots: maxBarSize clamps", () => {
  const [slot] = barSlots(100, 1, { maxBarSize: 30 })
  assert.equal(slot.size, 30)
  assert.equal(slot.offset, 35)
})

// --- stackSeries ---

test("stackSeries piles positives up and negatives down", () => {
  const [a, b] = stackSeries([
    [10, -5],
    [20, -5],
  ])
  assert.deepEqual(a[0], { y0: 0, y1: 10 })
  assert.deepEqual(b[0], { y0: 10, y1: 30 })
  assert.deepEqual(a[1], { y0: 0, y1: -5 })
  assert.deepEqual(b[1], { y0: -5, y1: -10 })
})

test("stackSeries: null contributes nothing", () => {
  const [a, b] = stackSeries([[null], [4]])
  assert.deepEqual(a[0], { y0: 0, y1: 0 })
  assert.deepEqual(b[0], { y0: 0, y1: 4 })
})

test('stackSeries "expand": every stack spans exactly 0 to 1 in its shares', () => {
  const rows = [
    [186, 305, 237],
    [80, 200, 120],
    [45, 100, 150],
  ]
  const none = stackSeries(rows)
  const expanded = stackSeries(rows, "expand")
  assert.equal(none[2][0].y1, 311, "the default offset keeps raw sums")
  for (let i = 0; i < 3; i++) {
    const total = rows[0][i] + rows[1][i] + rows[2][i]
    assert.equal(expanded[0][i].y0, 0)
    assert.equal(expanded[2][i].y1, 1, `datum ${i} tops out at exactly 1`)
    assert.ok(Math.abs(expanded[0][i].y1 - rows[0][i] / total) < 1e-12, `datum ${i} first share`)
    assert.ok(Math.abs(expanded[1][i].y1 - expanded[1][i].y0 - rows[1][i] / total) < 1e-12, `datum ${i} second share`)
  }
})

test('stackSeries "expand": mixed signs split one unit of span across zero by absolute share', () => {
  const [a, b] = stackSeries(
    [
      [3, -1],
      [1, -3],
    ],
    "expand",
  )
  assert.deepEqual(a[0], { y0: 0, y1: 0.75 })
  assert.deepEqual(b[0], { y0: 0.75, y1: 1 })
  assert.deepEqual(a[1], { y0: 0, y1: -0.25 })
  assert.deepEqual(b[1], { y0: -0.25, y1: -1 })
})

test('stackSeries "expand": an empty or all-zero datum stays at 0, a null still contributes nothing', () => {
  const [a, b] = stackSeries(
    [
      [0, null, 2],
      [0, null, null],
    ],
    "expand",
  )
  assert.deepEqual(a[0], { y0: 0, y1: 0 })
  assert.deepEqual(b[1], { y0: 0, y1: 0 })
  assert.deepEqual(a[2], { y0: 0, y1: 1 })
  assert.deepEqual(b[2], { y0: 1, y1: 1 })
})

// --- nearestIndex ---

test("nearestIndex picks the closest centre", () => {
  const centers = [10, 30, 50]
  assert.equal(nearestIndex(0, centers), 0)
  assert.equal(nearestIndex(29, centers), 1)
  assert.equal(nearestIndex(41, centers), 2)
  assert.equal(nearestIndex(99, centers), 2)
})

test("nearestIndex: a midpoint tie goes to the lower index", () => {
  assert.equal(nearestIndex(20, [10, 30, 50]), 0)
  assert.equal(nearestIndex(40, [10, 30, 50]), 1)
})

test("nearestIndex of nothing is -1", () => {
  assert.equal(nearestIndex(5, []), -1)
})

// --- thinTicks ---

test("thinTicks keeps the first and last and never overlaps", () => {
  const positions = [0, 20, 40, 60, 80, 100]
  const keep = thinTicks(positions, 30, 4)
  assert.equal(keep[0], true)
  assert.equal(keep.at(-1), true)
  const kept = positions.filter((_, i) => keep[i])
  for (let i = 1; i < kept.length; i++) assert.ok(kept[i] - kept[i - 1] >= 34)
})

test("thinTicks works on positions that count down, as a y axis does", () => {
  const down = [100, 80, 60, 40, 20, 0]
  const keep = thinTicks(down, 14, 4)
  assert.deepEqual(keep, [true, true, true, true, true, true])
  const crowded = thinTicks(down, 30, 4)
  assert.equal(crowded[0], true)
  assert.equal(crowded.at(-1), true)
  assert.ok(crowded.some((k, i) => i > 0 && i < 5 && k), "an inner tick survives when it fits")
})

test("thinTicks keeps everything when there is room", () => {
  assert.deepEqual(thinTicks([0, 50, 100], 10, 4), [true, true, true])
})

// --- splitRuns ---

test("splitRuns breaks at nulls", () => {
  const runs = splitRuns([[0, 1], [1, 2], null, [3, 4]])
  assert.equal(runs.length, 2)
  assert.equal(runs[1][0][0], 3)
})

test("splitRuns with connectNulls bridges the gap", () => {
  const runs = splitRuns([[0, 1], null, [3, 4]], true)
  assert.equal(runs.length, 1)
  assert.equal(runs[0].length, 2)
})

// --- curvePath ---

const pts = [
  [0, 100],
  [50, 20],
  [100, 60],
  [150, 60],
]

test("curvePath linear is M then L", () => {
  const d = curvePath(pts, "linear")
  assert.ok(d.startsWith("M 0 100 L 50 20"))
  assert.ok(!d.includes("C"))
})

test("curvePath step turns at the midpoint", () => {
  const d = curvePath(pts.slice(0, 2), "step")
  assert.equal(d, "M 0 100 L 25 100 L 25 20 L 50 20")
})

test("curvePath stepBefore / stepAfter", () => {
  assert.equal(curvePath(pts.slice(0, 2), "stepBefore"), "M 0 100 L 0 20 L 50 20")
  assert.equal(curvePath(pts.slice(0, 2), "stepAfter"), "M 0 100 L 50 100 L 50 20")
})

test("curvePath monotone emits cubics whose control points stay within neighbour y", () => {
  const d = curvePath(pts, "monotone")
  assert.ok(d.includes(" C "))
  const segs = d.split(" C ").slice(1)
  segs.forEach((seg, i) => {
    const nums = seg.replace(/,/g, "").trim().split(/\s+/).map(Number)
    const lo = Math.min(pts[i][1], pts[i + 1][1])
    const hi = Math.max(pts[i][1], pts[i + 1][1])
    for (const y of [nums[1], nums[3]]) assert.ok(y >= lo - 1e-9 && y <= hi + 1e-9, `${y} in [${lo}, ${hi}]`)
  })
})

test("curvePath: a flat segment stays flat under monotone", () => {
  const d = curvePath(pts, "monotone")
  const last = d.split(" C ").at(-1).replace(/,/g, "").trim().split(/\s+/).map(Number)
  assert.equal(last[1], 60)
  assert.equal(last[3], 60)
})

test("natural and basis alias monotone", () => {
  assert.equal(curvePath(pts, "natural"), curvePath(pts, "monotone"))
  assert.equal(curvePath(pts, "basis"), curvePath(pts, "monotone"))
})

test("curvePath of one point is a bare M", () => {
  assert.equal(curvePath([[3, 4]], "monotone"), "M 3 4")
  assert.equal(curvePath([], "linear"), "")
})

// --- linePath / areaPath ---

test("linePath joins one subpath per run", () => {
  const d = linePath([[0, 0], [1, 1], null, [3, 3], [4, 4]], "linear")
  assert.equal((d.match(/M /g) || []).length, 2)
})

test("areaPath walks the lower edge back and closes", () => {
  const d = areaPath([[0, 10], [10, 0]], [[0, 50], [10, 50]], "linear")
  assert.equal(d, "M 0 10 L 10 0 L 10 50 L 0 50 Z")
})

// --- polar: angles ---

const nearPoint = (p, [x, y], msg) => {
  assert.ok(Math.abs(p[0] - x) < 1e-9 && Math.abs(p[1] - y) < 1e-9, `${msg}: got ${p}`)
}

test("polarToCartesian: 0° is 3 o'clock, 90° is up, counter-clockwise", () => {
  nearPoint(polarToCartesian(10, 10, 5, 0), [15, 10], "0°")
  nearPoint(polarToCartesian(10, 10, 5, 90), [10, 5], "90°")
  nearPoint(polarToCartesian(10, 10, 5, 180), [5, 10], "180°")
  nearPoint(polarToCartesian(10, 10, 5, -90), [10, 15], "-90°")
})

test("cartesianToPolar inverts polarToCartesian", () => {
  for (const a of [0, 45, 90, 135, 180, -45, -135]) {
    const [x, y] = polarToCartesian(3, 4, 7, a)
    const [r, angle] = cartesianToPolar(3, 4, x, y)
    assert.ok(Math.abs(r - 7) < 1e-9 && Math.abs(angle - a) < 1e-9, `${a}° → ${r} ${angle}`)
  }
})

test("resolveLength: px as is, percent of the total, fallback otherwise", () => {
  assert.equal(resolveLength(30, 200, 1), 30)
  assert.equal(resolveLength("80%", 200, 1), 160)
  assert.equal(resolveLength("12", 200, 1), 12)
  assert.equal(resolveLength(undefined, 200, 1), 1)
  assert.equal(resolveLength("auto", 200, 1), 1)
})

// --- polar: arcPath ---

const arcs = (d) => (d.match(/ A /g) || []).length

test("arcPath: a quarter disc is one arc to the centre, a quarter ring two arcs", () => {
  assert.equal(arcPath(0, 0, 0, 10, 0, 90), "M 10 0 A 10 10 0 0 0 0 -10 L 0 0 Z")
  assert.equal(arcPath(0, 0, 5, 10, 0, 90), "M 10 0 A 10 10 0 0 0 0 -10 L 0 -5 A 5 5 0 0 1 5 0 Z")
})

test("arcPath: a sweep past 180° sets the large-arc flag; a negative sweep flips the direction", () => {
  assert.ok(arcPath(0, 0, 0, 10, 0, 270).includes("A 10 10 0 1 0"), "large arc")
  assert.ok(arcPath(0, 0, 0, 10, 0, -90).includes("A 10 10 0 0 1"), "clockwise sweep")
  assert.equal(arcPath(0, 0, 0, 10, 0, -90), "M 10 0 A 10 10 0 0 1 0 10 L 0 0 Z")
})

test("arcPath: a full circle is two half arcs per edge, never a 360° arc", () => {
  const disc = arcPath(0, 0, 0, 10, 0, 360)
  assert.equal(arcs(disc), 2)
  assert.ok(!disc.includes("NaN"))
  const ring = arcPath(0, 0, 4, 10, 0, 360)
  assert.equal(arcs(ring), 4)
  assert.ok(ring.includes("A 10 10 0 0 0") && ring.includes("A 4 4 0 0 1"), "opposite windings")
  assert.equal(arcPath(0, 0, 0, 10, 90, -270), disc, "any 360° sweep is the same ring")
})

test("arcPath: nothing for a zero sweep or radius", () => {
  assert.equal(arcPath(0, 0, 0, 10, 45, 45), "")
  assert.equal(arcPath(0, 0, 0, 0, 0, 90), "")
})

test("arcPath: cornerRadius adds four corner arcs on a ring, two on a disc", () => {
  const ring = arcPath(0, 0, 20, 30, 0, 90, 3)
  assert.equal(arcs(ring), 6)
  assert.ok(ring.startsWith("M 26."), `starts on the radial edge inside the outer radius: ${ring}`)
  const disc = arcPath(0, 0, 0, 30, 0, 90, 3)
  assert.equal(arcs(disc), 3)
  assert.ok(disc.endsWith("L 0 0 Z"))
})

test("arcPath: cornerRadius is clamped to half the ring and to the sweep's room", () => {
  // Half the thickness: the two corners on an edge meet, so the join is a zero-length line.
  const thin = arcPath(0, 0, 20, 30, 0, 90, 50)
  assert.equal(arcs(thin), 6)
  assert.ok(!thin.includes("NaN"))
  // A 2° sliver has no room for a 5px corner at r=30 and must not go NaN.
  const sliver = arcPath(0, 0, 20, 30, 0, 2, 5)
  assert.ok(!sliver.includes("NaN"), sliver)
  assert.equal(arcs(sliver), 6)
  assert.ok(sliver.startsWith("M 29.9") || sliver.startsWith("M 30 ") || sliver.startsWith("M 29."), sliver)
})

test("arcLinePath: one arc the text follows; a full turn is two half arcs, since one arc back to its own start draws nothing", () => {
  assert.equal(arcLinePath(0, 0, 10, 0, 90), "M 10 0 A 10 10 0 0 0 0 -10")
  assert.equal(arcLinePath(0, 0, 10, 0, 360), "M 10 0 A 10 10 0 0 0 -10 0 A 10 10 0 0 0 10 0")
  assert.equal(arcs(arcLinePath(0, 0, 10, 0, 270)), 1)
})

// --- polar: pieSlices ---

test("pieSlices: shares of the sweep, contiguous, from startAngle counter-clockwise", () => {
  const s = pieSlices([1, 1, 2])
  assert.deepEqual(
    s.map((x) => [x.start, x.end]),
    [
      [0, 90],
      [90, 180],
      [180, 360],
    ],
  )
  assert.equal(s[2].mid, 270)
  assert.equal(s[0].value, 1)
})

test("pieSlices: a partial sweep pads between slices only; a full circle pads the wrap too", () => {
  const half = pieSlices([1, 1], { startAngle: 0, endAngle: 180, paddingAngle: 10 })
  assert.deepEqual(
    half.map((x) => [x.start, x.end]),
    [
      [0, 85],
      [95, 180],
    ],
  )
  const full = pieSlices([1, 1], { paddingAngle: 10 })
  assert.deepEqual(
    full.map((x) => [x.start, x.end]),
    [
      [0, 170],
      [180, 350],
    ],
  )
})

test("pieSlices: null, zero and negative values are empty slices that keep their index and take no padding", () => {
  const s = pieSlices([2, null, 0, -3, 2], { paddingAngle: 10 })
  assert.equal(s.length, 5)
  assert.equal(s[1].start, s[1].end)
  assert.equal(s[3].start, s[3].end)
  assert.deepEqual([s[0].start, s[0].end], [0, 170])
  assert.deepEqual([s[4].start, s[4].end], [180, 350])
})

test("pieSlices: all-empty data is all empty slices at startAngle; a reversed sweep runs clockwise", () => {
  assert.ok(pieSlices([0, null], { startAngle: 90 }).every((x) => x.start === 90 && x.end === 90))
  const s = pieSlices([1, 3], { startAngle: 90, endAngle: -270 })
  assert.deepEqual(
    s.map((x) => [x.start, x.end]),
    [
      [90, 0],
      [0, -270],
    ],
  )
})

test("sliceIndexAt: the slice whose span holds the angle, modulo 360; a gap is -1", () => {
  const s = pieSlices([1, 1, 2])
  assert.equal(sliceIndexAt(45, s), 0)
  assert.equal(sliceIndexAt(-100, s), 2, "wraps: -100 is 260")
  assert.equal(sliceIndexAt(90, s), 0, "a shared edge resolves to the lower index")
  const padded = pieSlices([1, 1], { paddingAngle: 20 })
  assert.equal(sliceIndexAt(170, padded), -1, "inside the padding")
  assert.equal(sliceIndexAt(355, padded), -1, "inside the wrap gap")
  assert.equal(sliceIndexAt(0, []), -1)
})

test("nearestAngleIndex: shortest angular distance, modulo 360", () => {
  const angles = [90, 30, -30, -90, -150, -210]
  assert.equal(nearestAngleIndex(100, angles), 0)
  assert.equal(nearestAngleIndex(179, angles), 5, "150 (= -210) is nearer than 90")
  assert.equal(nearestAngleIndex(-179, angles), 4)
  assert.equal(nearestAngleIndex(0, []), -1)
})

// --- polar: radarPath / polarGridPath ---

test("radarPath: closed polygon through the points, nulls skipped", () => {
  assert.equal(radarPath([[0, 0], [10, 0], null, [10, 10]]), "M 0 0 L 10 0 L 10 10 Z")
  assert.equal(radarPath([null]), "")
})

test("polarGridPath: a polygon has one vertex per angle; a circle is two arcs", () => {
  const poly = polarGridPath(0, 0, 10, [90, -30, -150])
  assert.equal((poly.match(/ L /g) || []).length, 2)
  assert.ok(poly.startsWith("M 0 -10") && poly.endsWith("Z"))
  const circle = polarGridPath(0, 0, 10, [90, -30, -150], "circle")
  assert.equal(arcs(circle), 2)
  assert.ok(!circle.includes("L"))
  assert.equal(polarGridPath(0, 0, 10, [0, 180]), circle, "fewer than three angles falls back to a circle")
  assert.equal(polarGridPath(0, 0, 0, [0, 90, 180]), "")
})

// --- summary ---

console.log(`\nchart-math: ${passed} passed, ${failed} failed`)
if (failed > 0) process.exit(1)
