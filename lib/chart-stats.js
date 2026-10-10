/**
 * Summary statistics for ui/chart-boxplot: quantiles and the box-and-whisker
 * numbers. No DOM, no React — runs under plain Node so the unit suite pins
 * each rule without a browser.
 */

/** The finite numbers of `values`, ascending; a non-array is empty rather than a throw in render. Anything else (null, NaN, ±Infinity, strings) is dropped. */
export function finiteSorted(values) {
  const out = []
  for (const v of Array.isArray(values) ? values : []) if (typeof v === "number" && Number.isFinite(v)) out.push(v)
  return out.sort((a, b) => a - b)
}

/**
 * Quantile p in [0, 1] of an ascending array, by linear interpolation between
 * order statistics at (n - 1) * p: type 7, the default of R's quantile() and
 * NumPy's percentile(). NaN for an empty array.
 */
export function quantile(sorted, p) {
  const n = sorted.length
  if (n === 0) return NaN
  const h = (n - 1) * Math.min(1, Math.max(0, p))
  const lo = Math.floor(h)
  const hi = Math.min(n - 1, lo + 1)
  return sorted[lo] + (h - lo) * (sorted[hi] - sorted[lo])
}

/**
 * The box-and-whisker summary of a sample, or null when no finite value is
 * left. whiskers "iqr" ends each whisker at the most extreme value within
 * `range` × IQR of the box, or on the box's edge when no sample lies between,
 * and returns the rest as outliers; "minmax" runs the whiskers to the extremes
 * and has no outliers.
 */
export function boxStats(values, { whiskers = "iqr", range = 1.5 } = {}) {
  const all = finiteSorted(values)
  const n = all.length
  if (n === 0) return null
  const q1 = quantile(all, 0.25)
  const median = quantile(all, 0.5)
  const q3 = quantile(all, 0.75)
  let low = all[0]
  let high = all[n - 1]
  let outliers = []
  if (whiskers !== "minmax") {
    const reach = (Number.isFinite(range) && range >= 0 ? range : 1.5) * (q3 - q1)
    const inside = all.filter((v) => v >= q1 - reach && v <= q3 + reach)
    // Ties or a narrow range can leave no sample between a fence and the box; a
    // whisker then ends on the box's edge rather than inside it, as matplotlib's boxplot_stats.
    low = Math.min(q1, inside[0] ?? q1)
    high = Math.max(q3, inside.at(-1) ?? q3)
    outliers = all.filter((v) => v < q1 - reach || v > q3 + reach)
  }
  return { n, min: all[0], max: all[n - 1], q1, median, q3, low, high, outliers }
}
