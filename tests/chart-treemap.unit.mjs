import { treemapLayout } from "../lib/chart-treemap.js"
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

const EPS = 1e-9
const near = (a, b, msg = "") => assert.ok(Math.abs(a - b) <= EPS * Math.max(1, Math.abs(b)), `${msg} ${a} vs ${b}`)
const area = (r) => r.width * r.height
const childrenOf = (rects, i) => rects.filter((r) => r.parent === i)
const worstAspect = (rects) => Math.max(...rects.map((r) => Math.max(r.width / r.height, r.height / r.width)))

const leaf = (name, value) => ({ name, value })
const fixture = {
  name: "all",
  children: [
    { name: "a", children: [leaf("a1", 6), leaf("a2", 6), leaf("a3", 4), leaf("a4", 3), leaf("a5", 2), leaf("a6", 2), leaf("a7", 1)] },
    { name: "b", children: [leaf("b1", 9), leaf("b2", 5), leaf("b3", 1)] },
    leaf("c", 12),
    leaf("d", 3),
  ],
}
const SIZE = { width: 600, height: 400 }

// Baseline for the aspect-ratio claim: every group sliced along one axis, alternating by depth.
function sliceAndDice(node, x, y, w, h, vertical, out) {
  if (!node.children) return out.push({ width: w, height: h })
  let cursor = vertical ? x : y
  for (const c of node.children) {
    const share = c.value / node.value
    const cw = vertical ? w * share : w
    const ch = vertical ? h : h * share
    sliceAndDice(c, vertical ? cursor : x, vertical ? y : cursor, cw, ch, !vertical, out)
    cursor += vertical ? cw : ch
  }
}
const withSums = (n) => {
  if (!n.children) return n
  const children = n.children.map(withSums)
  return { ...n, children, value: children.reduce((s, c) => s + c.value, 0) }
}

// --- areas ---

test("a leaf's area is proportional to its value and the leaves fill the box", () => {
  const leaves = treemapLayout(fixture, SIZE).filter((r) => r.leaf)
  const perUnit = area(leaves[0]) / leaves[0].value
  assert.equal(leaves.length, 12)
  for (const r of leaves) near(area(r) / r.value, perUnit, r.name)
  near(perUnit * 54, SIZE.width * SIZE.height)
})

test("with padding and header, areas are proportional among siblings and shrink overall", () => {
  const rects = treemapLayout(fixture, { ...SIZE, padding: 4, header: 18 })
  rects.forEach((g, i) => {
    if (g.leaf) return
    const kids = childrenOf(rects, i)
    for (const k of kids) near(area(k) / k.value, area(kids[0]) / kids[0].value, k.name)
  })
  const total = rects.filter((r) => r.leaf).reduce((s, r) => s + area(r), 0)
  assert.ok(total < SIZE.width * SIZE.height)
})

// --- tiling ---

test("children tile the group's inner box: inside it, no overlap, full coverage", () => {
  const padding = 3
  const header = 20
  const rects = treemapLayout(fixture, { ...SIZE, padding, header })
  let groups = 0
  rects.forEach((g, i) => {
    if (g.leaf) return
    groups++
    const kids = childrenOf(rects, i)
    const inner = { x: g.x + padding, y: g.y + header + padding, w: g.width - 2 * padding, h: g.height - header - 2 * padding }
    let covered = 0
    for (const k of kids) {
      assert.ok(k.x >= inner.x - EPS && k.y >= inner.y - EPS, `${k.name} starts inside`)
      assert.ok(k.x + k.width <= inner.x + inner.w + EPS && k.y + k.height <= inner.y + inner.h + EPS, `${k.name} ends inside`)
      covered += area(k)
    }
    near(covered, inner.w * inner.h, `${g.name} coverage`)
    kids.forEach((a, ai) => {
      kids.slice(ai + 1).forEach((b) => {
        const ox = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x)
        const oy = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y)
        assert.ok(ox <= EPS || oy <= EPS, `${a.name} and ${b.name} overlap`)
      })
    })
  })
  assert.equal(groups, 3)
})

test("the root fills the box; headerHeight is set on groups only", () => {
  const rects = treemapLayout(fixture, { ...SIZE, header: 20 })
  assert.deepEqual([rects[0].x, rects[0].y, rects[0].width, rects[0].height], [0, 0, 600, 400])
  assert.ok(rects.filter((r) => !r.leaf).every((r) => r.headerHeight === 20))
  assert.ok(rects.filter((r) => r.leaf).every((r) => r.headerHeight === 0))
})

// --- squarify ---

test("worst aspect ratio beats slice-and-dice on the fixture", () => {
  const squarified = worstAspect(treemapLayout(fixture, SIZE).filter((r) => r.leaf))
  const baseline = []
  sliceAndDice(withSums(fixture), 0, 0, SIZE.width, SIZE.height, true, baseline)
  const sliced = worstAspect(baseline)
  assert.ok(squarified < sliced / 2, `squarified ${squarified} vs sliced ${sliced}`)
})

test("rows close when the next tile would worsen the ratio: 6 6 4 3 2 2 1 in 600x400", () => {
  const values = [6, 6, 4, 3, 2, 2, 1]
  const rects = treemapLayout({ name: "r", children: values.map((v, i) => leaf(`n${i}`, v)) }, SIZE)
  const [, a, b, c] = rects
  near(a.width, 300)
  near(b.width, 300)
  near(a.height, 200)
  assert.equal(b.y, 200)
  near(c.x, 300)
})

// --- order and shape ---

test("pre-order with children largest first; ties keep input order", () => {
  const tree = { name: "r", children: [leaf("x", 1), { name: "g", children: [leaf("g1", 1), leaf("g2", 3)] }, leaf("y", 1), leaf("z", 2)] }
  const rects = treemapLayout(tree, SIZE)
  assert.deepEqual(rects.map((r) => r.name), ["r", "g", "g2", "g1", "z", "x", "y"])
  assert.deepEqual(rects.map((r) => r.depth), [0, 1, 2, 2, 1, 1, 1])
  assert.deepEqual(rects.map((r) => r.parent), [-1, 0, 1, 1, 0, 0, 0])
})

test("path names the ancestry; a group's value is its kept children's sum", () => {
  const rects = treemapLayout(fixture, SIZE)
  assert.deepEqual(rects.find((r) => r.name === "a2").path, ["all", "a", "a2"])
  assert.equal(rects.find((r) => r.name === "a").value, 24)
  assert.equal(rects[0].value, 54)
})

test("a group's own value is ignored in favour of its children", () => {
  const rects = treemapLayout({ name: "r", value: 999, children: [leaf("p", 1), leaf("q", 3)] }, SIZE)
  assert.equal(rects[0].value, 4)
})

// --- dropped values ---

test("zero, negative, non-finite and non-number leaves are dropped", () => {
  const children = [leaf("ok", 5), leaf("zero", 0), leaf("neg", -2), leaf("nan", NaN), leaf("inf", Infinity), leaf("str", "7"), leaf("nul", null), leaf("ok2", 5)]
  const rects = treemapLayout({ name: "r", children }, SIZE)
  assert.deepEqual(rects.map((r) => r.name), ["r", "ok", "ok2"])
  assert.equal(rects[0].value, 10)
  near(area(rects[1]), 120000)
})

test("a group left empty is dropped, and its value no longer counts", () => {
  const tree = { name: "r", children: [{ name: "dead", children: [leaf("z", 0), leaf("n", -1)] }, { name: "empty", children: [] }, leaf("live", 4)] }
  const rects = treemapLayout(tree, SIZE)
  assert.deepEqual(rects.map((r) => r.name), ["r", "live"])
  near(area(rects[1]), SIZE.width * SIZE.height)
})

test("a node with a value and an empty children array is a leaf", () => {
  const tree = { name: "r", children: [{ name: "x", value: 5, children: [] }, leaf("y", 3)] }
  const rects = treemapLayout(tree, SIZE)
  assert.deepEqual(rects.map((r) => [r.name, r.leaf]), [["r", false], ["x", true], ["y", true]])
  assert.equal(rects[0].value, 8)
  near(area(rects[1]) / area(rects[2]), 5 / 3)
})

test("an unusable root or box returns an empty list", () => {
  assert.deepEqual(treemapLayout(null, SIZE), [])
  assert.deepEqual(treemapLayout(leaf("r", 0), SIZE), [])
  assert.deepEqual(treemapLayout({ name: "r", children: [] }, SIZE), [])
  assert.deepEqual(treemapLayout(fixture, {}), [])
})

test("a lone leaf root fills the box", () => {
  const rects = treemapLayout(leaf("solo", 3), SIZE)
  assert.equal(rects.length, 1)
  assert.deepEqual([rects[0].width, rects[0].height, rects[0].leaf], [600, 400, true])
})

// --- degenerate boxes ---

test("padding and header larger than the box collapse children to zero size, never negative or NaN", () => {
  const rects = treemapLayout(fixture, { width: 30, height: 30, padding: 20, header: 40 })
  assert.equal(rects.length, 15)
  for (const r of rects) {
    for (const key of ["x", "y", "width", "height"]) assert.ok(Number.isFinite(r[key]), `${r.name}.${key}`)
    assert.ok(r.width >= 0 && r.height >= 0, r.name)
  }
  assert.equal(rects[0].headerHeight, 30)
  assert.ok(rects.slice(1).every((r) => area(r) === 0))
})

// --- extreme values ---

test("siblings 1e16 apart, or one underflowing to zero area, stay finite and inside the box", () => {
  for (const [big, small] of [[1e16, 1], [1e17, 1], [1e300, 1e-300]]) {
    const rects = treemapLayout({ name: "r", children: [leaf("big", big), leaf("small", small)] }, { width: 600, height: 400 })
    assert.equal(rects.length, 3)
    for (const r of rects) {
      for (const v of [r.x, r.y, r.width, r.height]) assert.ok(Number.isFinite(v) && v >= 0, `${r.name} ${v} at ${big}`)
      assert.ok(r.x + r.width <= 600 + EPS && r.y + r.height <= 400 + EPS, `${r.name} inside at ${big}`)
    }
  }
})

// --- determinism ---

test("the same input gives identical output and the input is left untouched", () => {
  const before = JSON.stringify(fixture)
  const options = { ...SIZE, padding: 2, header: 16 }
  const first = treemapLayout(fixture, options)
  const second = treemapLayout(JSON.parse(before), options)
  assert.deepEqual(first, second)
  assert.equal(JSON.stringify(fixture), before)
})

// --- summary ---

console.log(`\nchart-treemap: ${passed} passed, ${failed} failed`)
if (failed > 0) process.exit(1)
