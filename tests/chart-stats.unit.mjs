import assert from "node:assert/strict"
import { finiteSorted, quantile, boxStats } from "../lib/chart-stats.js"

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

const near = (actual, expected, label) => assert.ok(Math.abs(actual - expected) < 1e-12, `${label}: expected ${expected}, got ${actual}`)

// --- finiteSorted ---
test("a non-array is empty, not a throw", () => {
  assert.deepEqual(finiteSorted(42), [])
  assert.deepEqual(finiteSorted("123"), [])
  assert.equal(boxStats(42), null)
})


test("finiteSorted keeps finite numbers, ascending, and drops everything else", () => {
  assert.deepEqual(finiteSorted([3, NaN, 1, Infinity, null, undefined, "4", -Infinity, 2, 0]), [0, 1, 2, 3])
  assert.deepEqual(finiteSorted(undefined), [])
})

// --- quantile ---

test("quantile type 7 matches R's quantile(1:10)", () => {
  const x = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
  // R: quantile(1:10, c(0, .1, .25, .5, .75, 1)) -> 1.00 1.90 3.25 5.50 7.75 10.00
  for (const [p, expected] of [[0, 1], [0.1, 1.9], [0.25, 3.25], [0.5, 5.5], [0.75, 7.75], [1, 10]]) near(quantile(x, p), expected, `p=${p}`)
})

test("quantile type 7 on an odd sample lands on order statistics", () => {
  // R: quantile(c(1:10, 100)) -> 1.0 3.5 6.0 8.5 100.0
  const x = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 100]
  assert.deepEqual([0, 0.25, 0.5, 0.75, 1].map((p) => quantile(x, p)), [1, 3.5, 6, 8.5, 100])
})

test("quantile of a duplicated-run sample interpolates inside the run", () => {
  // R: quantile(c(2, 4, 4, 4, 5, 5, 7, 9)) -> 2.0 4.0 4.5 5.5 9.0
  const x = [2, 4, 4, 4, 5, 5, 7, 9]
  assert.deepEqual([0, 0.25, 0.5, 0.75, 1].map((p) => quantile(x, p)), [2, 4, 4.5, 5.5, 9])
})

test("quantile of one value is that value; of nothing is NaN; p is held to [0, 1]", () => {
  assert.equal(quantile([7], 0.3), 7)
  assert.ok(Number.isNaN(quantile([], 0.5)))
  assert.equal(quantile([1, 3], 0.5), 2)
  assert.equal(quantile([1, 3], -1), 1)
  assert.equal(quantile([1, 3], 2), 3)
})

// --- boxStats ---

test("boxStats: Tukey whiskers end on the last value inside 1.5 IQR and the rest are outliers", () => {
  // q1 3.5, q3 8.5, IQR 5, fences -4 and 16: 100 is out.
  const s = boxStats([100, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
  assert.deepEqual(
    { n: s.n, min: s.min, max: s.max, q1: s.q1, median: s.median, q3: s.q3, low: s.low, high: s.high, outliers: s.outliers },
    { n: 11, min: 1, max: 100, q1: 3.5, median: 6, q3: 8.5, low: 1, high: 10, outliers: [100] },
  )
})

test("boxStats: outliers on both sides, whiskers on the nearest value inside the fence", () => {
  // q1 4, q3 5.5, IQR 1.5, fences 1.75 and 7.75: 9 is out, 2 stays in.
  const s = boxStats([2, 4, 4, 4, 5, 5, 7, 9])
  assert.deepEqual([s.low, s.high, s.outliers], [2, 7, [9]])
  const t = boxStats([-50, 4, 4, 4, 5, 5, 7, 80])
  assert.deepEqual([t.low, t.high, t.outliers], [4, 7, [-50, 80]])
})

test("boxStats: minmax runs the whiskers to the extremes and reports no outliers", () => {
  const s = boxStats([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 100], { whiskers: "minmax" })
  assert.deepEqual([s.low, s.high, s.outliers], [1, 100, []])
})

test("boxStats: a wider range moves the fences; 0 leaves only the box's own span", () => {
  const x = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 100]
  assert.deepEqual(boxStats(x, { range: 100 }).outliers, [])
  assert.deepEqual(boxStats(x, { range: 0 }).outliers, [1, 2, 3, 9, 10, 100])
  assert.deepEqual(boxStats(x, { range: -1 }).outliers, [100], "a negative range falls back to 1.5")
})

test("boxStats: when no sample is inside the fences the whiskers end at the quartiles", () => {
  const s = boxStats([10, 20], { range: 0 })
  assert.deepEqual([s.low, s.high, s.outliers], [12.5, 17.5, [10, 20]])
})

test("boxStats: a whisker never ends inside the box", () => {
  // Ties: q1 75, q3 100, and the only sample inside the fences below q3 is 100.
  const s = boxStats([0, 100, 100, 100])
  assert.deepEqual([s.q1, s.q3, s.low, s.high, s.outliers], [75, 100, 75, 100, [0]])
  // range 0 on 1..10, 100: the nearest inside samples, 4 and 8, sit within the box of 3.5 to 8.5.
  const t = boxStats([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 100], { range: 0 })
  assert.deepEqual([t.low, t.high], [3.5, 8.5])
})

test("boxStats: non-finite values are dropped before anything is computed", () => {
  const s = boxStats([1, NaN, 2, 3, null, 4, Infinity, "5", 5])
  assert.equal(s.n, 5)
  assert.deepEqual([s.min, s.median, s.max], [1, 3, 5])
})

test("boxStats: nothing finite is null; one value is a flat box", () => {
  assert.equal(boxStats([]), null)
  assert.equal(boxStats([NaN, null]), null)
  const s = boxStats([4])
  assert.deepEqual([s.q1, s.median, s.q3, s.low, s.high, s.outliers], [4, 4, 4, 4, 4, []])
})

console.log(`\nchart-stats: ${passed} passed, ${failed} failed`)
if (failed > 0) process.exit(1)
