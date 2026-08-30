/**
 * Locale-aware formatting helpers built on Intl.
 *
 * Every function is pure — no React, no DOM. Components in ui/format/
 * are thin wrappers that pull locale from context and render the result.
 *
 * Formatter instances are cached by (locale, optionsKey) so table-scale
 * rendering doesn't pay the constructor cost per cell.
 */

// ---------------------------------------------------------------------------
// Formatter cache
// ---------------------------------------------------------------------------

const cache = new Map()

function cached(Ctor, locale, options) {
  const key = `${Ctor.name || Ctor}:${locale ?? ""}:${JSON.stringify(options)}`
  let fmt = cache.get(key)
  if (!fmt) {
    fmt = new Ctor(locale, options)
    cache.set(key, fmt)
  }
  return fmt
}

// ---------------------------------------------------------------------------
// Intl.DurationFormat support check
// ---------------------------------------------------------------------------

/**
 * Whether this runtime has `Intl.DurationFormat`. A capability probe, not a
 * default: the answer differs between a Node 22 server and the browser
 * hydrating its output, so `formatDuration` composes the portable path unless
 * a caller opts in with `engine: "auto"`.
 */
export const hasDurationFormat = typeof Intl !== "undefined" && typeof Intl.DurationFormat === "function"

// ---------------------------------------------------------------------------
// formatRelativeTime
// ---------------------------------------------------------------------------

const UNITS = [
  { unit: "year", ms: 365.25 * 24 * 60 * 60 * 1000 },
  { unit: "month", ms: 30.44 * 24 * 60 * 60 * 1000 },
  { unit: "week", ms: 7 * 24 * 60 * 60 * 1000 },
  { unit: "day", ms: 24 * 60 * 60 * 1000 },
  { unit: "hour", ms: 60 * 60 * 1000 },
  { unit: "minute", ms: 60 * 1000 },
  { unit: "second", ms: 1000 },
]

/**
 * Format a date relative to `now`.
 *
 * Pass `now` when the result is server-rendered: left out, it reads the clock,
 * and the server's reading and the browser's are never the same instant, so
 * the hydrated text disagrees with the markup.
 *
 * @param {Date|number} date
 * @param {string} [locale]
 * @param {Date|number} [now] Basis for the comparison; defaults to `Date.now()`
 * @returns {{ text: string, unit: string }}
 */
export function formatRelativeTime(date, locale, now) {
  const ms = (typeof date === "number" ? date : date.getTime()) - (now != null ? +now : Date.now())
  const absMs = Math.abs(ms)

  for (const { unit, ms: threshold } of UNITS) {
    if (absMs >= threshold || unit === "second") {
      const value = Math.round(ms / threshold)
      const fmt = cached(Intl.RelativeTimeFormat, locale, { numeric: "auto" })
      return { text: fmt.format(value, unit), unit }
    }
  }
  /* istanbul ignore next — unreachable, loop always returns at "second" */
  return { text: "", unit: "second" }
}

// ---------------------------------------------------------------------------
// formatBytes
// ---------------------------------------------------------------------------

const SI_SUFFIXES = ["B", "kB", "MB", "GB", "TB", "PB", "EB"]
const IEC_SUFFIXES = ["B", "KiB", "MiB", "GiB", "TiB", "PiB", "EiB"]

/**
 * Format a byte count.
 * @param {number} bytes
 * @param {{ locale?: string, base?: "iec"|"si", decimals?: number }} [opts]
 * @returns {string}
 */
export function formatBytes(bytes, opts = {}) {
  const { locale, base = "iec", decimals = 1 } = opts
  const divisor = base === "si" ? 1000 : 1024
  const suffixes = base === "si" ? SI_SUFFIXES : IEC_SUFFIXES

  if (bytes === 0) return `0 ${suffixes[0]}`

  const negative = bytes < 0
  let abs = Math.abs(bytes)
  let i = 0
  while (abs >= divisor && i < suffixes.length - 1) {
    abs /= divisor
    i++
  }

  const nf = cached(Intl.NumberFormat, locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: i === 0 ? 0 : decimals,
  })
  return `${negative ? "-" : ""}${nf.format(abs)} ${suffixes[i]}`
}

// ---------------------------------------------------------------------------
// formatDuration
// ---------------------------------------------------------------------------

/**
 * Break milliseconds into { hours, minutes, seconds }.
 * @param {number} ms
 * @returns {{ hours: number, minutes: number, seconds: number, negative: boolean }}
 */
function decompose(ms) {
  const negative = ms < 0
  let rem = Math.abs(Math.trunc(ms / 1000))
  const hours = Math.trunc(rem / 3600)
  rem %= 3600
  const minutes = Math.trunc(rem / 60)
  const seconds = rem % 60
  return { hours, minutes, seconds, negative }
}

/**
 * Format a duration in milliseconds.
 *
 * `engine` picks how the parts are assembled. `"portable"`, the default,
 * composes `Intl.NumberFormat` + `Intl.ListFormat`, which every supported
 * runtime has — so a server render and the browser hydrating it produce the
 * same string. `"auto"` uses `Intl.DurationFormat` where it exists; reach for
 * it only when the output is not hydrated, because the two engines word the
 * same duration differently.
 *
 * @param {number} ms
 * @param {{ locale?: string, style?: "long"|"short"|"narrow"|"digital", engine?: "portable"|"auto" }} [opts]
 * @returns {string}
 */
export function formatDuration(ms, opts = {}) {
  const { locale, style = "narrow", engine = "portable" } = opts
  const { hours, minutes, seconds, negative } = decompose(ms)
  const sign = negative ? "-" : ""

  if (hours === 0 && minutes === 0 && seconds === 0) {
    // Zero duration — Intl.DurationFormat returns "" for { seconds: 0 },
    // so always use NumberFormat unit style here.
    const display = style === "long" ? "long" : style === "short" ? "short" : "narrow"
    const nf = cached(Intl.NumberFormat, locale, { style: "unit", unit: "second", unitDisplay: display })
    return nf.format(0)
  }

  if (engine === "auto" && hasDurationFormat) {
    const duration = {}
    if (hours) duration.hours = hours
    if (minutes) duration.minutes = minutes
    if (seconds || (!hours && !minutes)) duration.seconds = seconds
    const fmt = cached(Intl.DurationFormat, locale, { style })
    return sign + fmt.format(duration)
  }

  // Portable path: Intl.NumberFormat unit style + Intl.ListFormat
  const parts = []
  if (hours) {
    const nf = cached(Intl.NumberFormat, locale, { style: "unit", unit: "hour", unitDisplay: style === "long" ? "long" : "short" })
    parts.push(nf.format(hours))
  }
  if (minutes) {
    const nf = cached(Intl.NumberFormat, locale, { style: "unit", unit: "minute", unitDisplay: style === "long" ? "long" : "short" })
    parts.push(nf.format(minutes))
  }
  if (seconds || parts.length === 0) {
    const nf = cached(Intl.NumberFormat, locale, { style: "unit", unit: "second", unitDisplay: style === "long" ? "long" : "short" })
    parts.push(nf.format(seconds))
  }

  if (parts.length === 1) return sign + parts[0]

  const lf = cached(Intl.ListFormat, locale, { type: "conjunction", style: style === "long" ? "long" : "narrow" })
  return sign + lf.format(parts)
}

// ---------------------------------------------------------------------------
// formatCost
// ---------------------------------------------------------------------------

/**
 * Format a currency value. Picks sensible fraction digits from magnitude:
 * values below 0.01 get up to 7 digits (cloud micro-pricing), otherwise 2.
 *
 * @param {number} value
 * @param {{ locale?: string, currency?: string, minimumFractionDigits?: number, maximumFractionDigits?: number }} [opts]
 * @returns {string}
 */
export function formatCost(value, opts = {}) {
  const { locale, currency = "USD", minimumFractionDigits, maximumFractionDigits } = opts

  const abs = Math.abs(value)
  let minFd = minimumFractionDigits
  let maxFd = maximumFractionDigits

  if (minFd == null || maxFd == null) {
    if (abs === 0 || abs >= 0.01) {
      if (minFd == null) minFd = 2
      if (maxFd == null) maxFd = 2
    } else if (abs >= 0.0001) {
      if (minFd == null) minFd = 2
      if (maxFd == null) maxFd = 4
    } else {
      if (minFd == null) minFd = 2
      if (maxFd == null) maxFd = 7
    }
  }

  const nf = cached(Intl.NumberFormat, locale, {
    style: "currency",
    currency,
    minimumFractionDigits: minFd,
    maximumFractionDigits: maxFd,
  })

  return nf.format(value)
}
