import { sankeyLayout } from "../lib/chart-sankey.js"
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

const near = (a, b, msg) => assert.ok(Math.abs(a - b) < 1e-9, `${msg ?? ""} ${a} vs ${b}`)
const sum = (list) => list.reduce((s, v) => s + v, 0)

// Interior nodes (b, c, d) balance in and out; e is a sink fed from two columns.
const fixture = {
  nodes: [{ id: "a" }, { id: "b" }, { id: "c" }, { id: "d" }, { id: "e" }, { id: "f" }],
  links: [
    { source: "a", target: "b", value: 6 },
    { source: "a", target: "c", value: 4 },
    { source: "b", target: "d", value: 6 },
    { source: "c", target: "d", value: 1 },
    { source: "c", target: "e", value: 3 },
    { source: "d", target: "f", value: 7 },
  ],
  width: 400,
  height: 200,
}
const lay = (over = {}) => sankeyLayout({ ...fixture, ...over })
const col = (out, id) => out.nodes.find((n) => n.id === id).column

// --- columns ---

test("columns: longest path from the sources, sinks justified right", () => {
  const out = lay()
  assert.deepEqual(["a", "b", "c", "d", "e", "f"].map((id) => col(out, id)), [0, 1, 1, 2, 3, 3])
  assert.deepEqual(out.columns, [[0], [1, 2], [3], [4, 5]].map((c) => c.slice().sort((x, y) => out.nodes[x].y0 - out.nodes[y].y0)))
})

test("columns: align left keeps a sink one past its deepest source", () => {
  const out = lay({ align: "left" })
  assert.equal(col(out, "e"), 2)
  assert.equal(col(out, "f"), 3)
})

test("columns: a node with no links sits in the first column", () => {
  const out = sankeyLayout({ nodes: [{ id: "x" }, { id: "y" }, { id: "z" }], links: [{ source: "x", target: "y", value: 1 }], width: 100, height: 100 })
  assert.equal(col(out, "z"), 0)
  assert.equal(out.nodes[2].height, 0)
})

test("columns: x positions span the width, nodes are nodeWidth wide", () => {
  const out = lay({ nodeWidth: 10 })
  assert.equal(out.nodes[0].x0, 0)
  assert.equal(out.nodes[5].x1, 400)
  assert.equal(out.nodes[3].x0, 260)
  assert.equal(out.nodes[3].x1 - out.nodes[3].x0, 10)
})

// --- heights and flow ---

test("flow is conserved through every interior node", () => {
  const out = lay()
  for (const id of ["b", "c", "d"]) {
    const n = out.nodes.find((x) => x.id === id)
    assert.equal(sum(n.targetLinks.map((i) => out.links[i].value)), sum(n.sourceLinks.map((i) => out.links[i].value)), id)
    assert.equal(n.valueIn, n.valueOut, id)
    assert.equal(n.value, n.valueIn, id)
  }
})

test("node height is proportional to max(in, out) with one shared scale", () => {
  const out = lay()
  const scale = out.nodes[0].height / out.nodes[0].value
  assert.ok(scale > 0)
  for (const n of out.nodes) {
    near(n.height, Math.max(n.valueIn, n.valueOut) * scale, n.id)
    near(n.y1 - n.y0, n.height, n.id)
  }
})

test("a sink fed more than it sends takes the larger side", () => {
  const out = sankeyLayout({ nodes: [{ id: "a" }, { id: "b" }, { id: "c" }], links: [{ source: "a", target: "b", value: 5 }, { source: "b", target: "c", value: 3 }], width: 100, height: 100 })
  assert.equal(out.nodes[1].value, 5)
  near(out.nodes[1].height, out.nodes[0].height)
})

test("the tightest column sets the scale and fills the height exactly", () => {
  const out = lay({ nodePadding: 10 })
  const colHeights = out.columns.map((ids) => sum(ids.map((i) => out.nodes[i].height)) + (ids.length - 1) * 10)
  near(Math.max(...colHeights), 200)
  for (const n of out.nodes) assert.ok(n.y0 >= -1e-9 && n.y1 <= 200 + 1e-9, n.id)
})

test("nodes in a column are at least nodePadding apart and do not overlap", () => {
  const out = lay({ nodePadding: 12 })
  for (const ids of out.columns) {
    for (let k = 1; k < ids.length; k++) {
      const gap = out.nodes[ids[k]].y0 - out.nodes[ids[k - 1]].y1
      assert.ok(gap >= 12 - 1e-9, `gap ${gap}`)
    }
  }
})

// --- link bands ---

test("link band widths at a node sum to its height, on each side", () => {
  const out = lay()
  for (const n of out.nodes) {
    if (n.sourceLinks.length) near(sum(n.sourceLinks.map((i) => out.links[i].width)), n.valueOut * (n.height / n.value), `${n.id} out`)
    if (n.targetLinks.length) near(sum(n.targetLinks.map((i) => out.links[i].width)), n.valueIn * (n.height / n.value), `${n.id} in`)
  }
  const d = out.nodes[3]
  near(sum(d.targetLinks.map((i) => out.links[i].width)), d.height)
  near(sum(d.sourceLinks.map((i) => out.links[i].width)), d.height)
})

test("bands stack inside their node without gaps, ordered by the far node", () => {
  const out = lay()
  for (const n of out.nodes) {
    let y = n.y0
    for (const i of n.sourceLinks) {
      near(out.links[i].y0 - out.links[i].width / 2, y, `${n.id} source edge`)
      y += out.links[i].width
    }
    const targets = n.sourceLinks.map((i) => out.nodes[out.links[i].target].y0)
    assert.deepEqual(targets, targets.slice().sort((p, q) => p - q))
    y = n.y0
    for (const i of n.targetLinks) {
      near(out.links[i].y1 - out.links[i].width / 2, y, `${n.id} target edge`)
      y += out.links[i].width
    }
  }
})

test("bands entering a node stack by their source's position, not input order", () => {
  const out = sankeyLayout({ nodes: [{ id: "a" }, { id: "b" }, { id: "c" }], links: [{ source: "b", target: "c", value: 2 }, { source: "a", target: "c", value: 3 }], width: 100, height: 100 })
  const [a, b, c] = out.nodes
  assert.ok(a.y0 < b.y0, "a sits above b")
  assert.equal(out.links[0].source, b.index, "the first link in input order comes from the lower source")
  assert.deepEqual(c.targetLinks.map((i) => out.links[i].source), [a.index, b.index])
  assert.ok(out.links[1].y1 < out.links[0].y1, "a's band enters c above b's")
})

test("link path is a cubic Bezier from the source edge to the target edge", () => {
  const out = lay()
  const l = out.links[0]
  assert.equal(l.x0, out.nodes[l.source].x1)
  assert.equal(l.x1, out.nodes[l.target].x0)
  const mid = (l.x0 + l.x1) / 2
  assert.equal(l.d, `M ${l.x0} ${l.y0} C ${mid} ${l.y0} ${mid} ${l.y1} ${l.x1} ${l.y1}`)
  assert.equal(l.datum, fixture.links[0])
  near(l.width, l.value * (out.nodes[0].height / out.nodes[0].value))
})

test("links with no flow are dropped, unknown endpoints throw", () => {
  const nodes = [{ id: "a" }, { id: "b" }]
  const out = sankeyLayout({ nodes, links: [{ source: "a", target: "b", value: 0 }, { source: "a", target: "b", value: null }, { source: "a", target: "b", value: 2 }], width: 100, height: 50 })
  assert.equal(out.links.length, 1)
  assert.equal(out.links[0].value, 2)
  assert.throws(() => sankeyLayout({ nodes, links: [{ source: "a", target: "q", value: 1 }], width: 100, height: 50 }), /a -> q/)
  assert.throws(() => sankeyLayout({ nodes: [{ id: "a" }, { id: "a" }], links: [], width: 1, height: 1 }), /"a" is duplicated/)
})

// --- relaxation ---

test("relaxation untangles a crossing the input order would draw", () => {
  const nodes = [{ id: "s1" }, { id: "s2" }, { id: "t1" }, { id: "t2" }]
  const links = [{ source: "s1", target: "t2", value: 1 }, { source: "s2", target: "t1", value: 1 }]
  const spec = { nodes, links, width: 100, height: 100 }
  const before = sankeyLayout({ ...spec, iterations: 0 })
  const after = sankeyLayout({ ...spec, iterations: 6 })
  assert.ok(before.nodes[2].y0 < before.nodes[3].y0, "no passes keeps input order, so s1 -> t2 crosses s2 -> t1")
  assert.ok(after.nodes[3].y0 < after.nodes[2].y0, "t2 moves above t1 to sit beside s1")
})

// --- determinism ---

test("output is deterministic and independent of earlier calls", () => {
  const first = lay()
  lay({ width: 10 })
  assert.deepEqual(lay(), first)
  assert.equal(JSON.stringify(lay()), JSON.stringify(first))
})

test("ties break by input index", () => {
  const out = sankeyLayout({ nodes: [{ id: "a" }, { id: "b" }, { id: "c" }, { id: "d" }], links: [{ source: "a", target: "c", value: 1 }, { source: "b", target: "d", value: 1 }], width: 100, height: 100 })
  assert.deepEqual(out.columns, [[0, 1], [2, 3]])
})

// --- cycles ---

test("a cycle throws and names the nodes on it", () => {
  const nodes = [{ id: "in" }, { id: "x" }, { id: "y" }, { id: "z" }]
  const links = [{ source: "in", target: "x", value: 1 }, { source: "x", target: "y", value: 1 }, { source: "y", target: "z", value: 1 }, { source: "z", target: "x", value: 1 }]
  assert.throws(() => sankeyLayout({ nodes, links, width: 100, height: 100 }), (e) => e instanceof Error && e.message === "Sankey links form a cycle: x -> y -> z -> x")
})

test("a link from a node to itself is a cycle", () => {
  assert.throws(() => sankeyLayout({ nodes: [{ id: "a" }], links: [{ source: "a", target: "a", value: 1 }], width: 1, height: 1 }), /a -> a/)
})

test("a box too small for nodeWidth and nodePadding keeps every node inside it", () => {
  const ids = ["s", "t1", "t2", "t3", "t4", "t5", "t6"]
  const nodes = ids.map((id) => ({ id }))
  const links = ids.slice(1).map((target) => ({ source: "s", target, value: 1 }))
  for (const [width, height] of [[300, 30], [6, 40], [0, 0]]) {
    const out = sankeyLayout({ nodes, links, width, height })
    for (const n of out.nodes) {
      for (const v of [n.x0, n.x1, n.y0, n.y1]) assert.ok(Number.isFinite(v), `${n.id} finite in ${width}x${height}`)
      assert.ok(n.x0 >= 0 && n.x1 <= width + 1e-9, `${n.id} x [${n.x0}, ${n.x1}] in ${width}`)
      assert.ok(n.y0 >= -1e-9 && n.y1 <= height + 1e-9, `${n.id} y [${n.y0}, ${n.y1}] in ${height}`)
    }
  }
  const roomy = sankeyLayout({ nodes, links, width: 300, height: 30, nodePadding: 2 })
  assert.ok(roomy.nodes[1].height > 0, "padding that fits leaves the sinks a height")
})

test("a box narrower than its columns' node widths keeps columns apart and bands running left to right", () => {
  const ids = ["a", "b", "c", "d", "e", "f"]
  const out = sankeyLayout({ nodes: ids.map((id) => ({ id })), links: ids.slice(1).map((target, i) => ({ source: ids[i], target, value: 1 })), width: 60, height: 40 })
  assert.equal(out.columns.length, 6, "six columns at the default nodeWidth need 72px")
  for (let i = 1; i < out.nodes.length; i++) assert.ok(out.nodes[i - 1].x1 <= out.nodes[i].x0 + 1e-9, `${ids[i - 1]} ends before ${ids[i]} starts`)
  for (const l of out.links) assert.ok(l.x0 <= l.x1, `link ${l.x0} -> ${l.x1}`)
  near(out.nodes[5].x1, 60)
})

test("empty input lays out nothing", () => {
  assert.deepEqual(sankeyLayout({ width: 10, height: 10 }), { nodes: [], links: [], columns: [[]] })
})

console.log(`\nchart-sankey: ${passed} passed, ${failed} failed`)
if (failed > 0) process.exit(1)
