// Deterministic "live" numbers for the console mock. A metric wanders
// smoothly around its base instead of jumping, and the same key at the same
// tick reads the same everywhere, so tick 0 renders identically in tests.

function hashKey(key) {
  let h = 2166136261
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/**
 * A value that drifts around `base` within ±`spread`, clamped to [min, max].
 * Returns a sampler for `LiveValue` or for `useTicker` consumers.
 */
export function drift(key, base, { spread = 6, min = 0, max = 100 } = {}) {
  const phase = (hashKey(key) % 628) / 100
  return (tick) => {
    const wobble = Math.sin(tick / 3 + phase) * 0.6 + Math.sin(tick / 7 + phase * 2) * 0.4
    return Math.min(max, Math.max(min, Math.round(base + wobble * spread)))
  }
}

/** The last `length` samples of a drift, oldest first, for sparklines. */
export function history(sampler, tick, length = 24) {
  const points = []
  for (let i = length - 1; i >= 0; i--) points.push(sampler(tick - i))
  return points
}
