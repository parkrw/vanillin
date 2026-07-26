import { useEffect, useRef, useState, useCallback } from "react"
import { useLocale } from "../../lib/direction.jsx"
import {
  formatRelativeTime,
  formatBytes as fmtBytes,
  formatDuration as fmtDuration,
  formatCost as fmtCost,
} from "../../lib/format.js"
import { cn } from "../../lib/cn.js"

// ---------------------------------------------------------------------------
// Shared tick scheduler
//
// One interval for all mounted live RelativeTime instances. Cadence backs off
// with magnitude: seconds -> 5 s, minutes -> 30 s, hours+ -> 5 min.
// ---------------------------------------------------------------------------

const subscribers = new Set()
let tickTimer = null

function tickCadence(unit) {
  if (unit === "second") return 5_000
  if (unit === "minute") return 30_000
  return 300_000
}

function tick() {
  let nextMs = 300_000
  for (const fn of subscribers) {
    const ms = fn()
    if (ms < nextMs) nextMs = ms
  }
  clearInterval(tickTimer)
  tickTimer = setInterval(tick, nextMs)
}

function subscribe(fn) {
  subscribers.add(fn)
  if (subscribers.size === 1) {
    tickTimer = setInterval(tick, 5_000)
  }
  return () => {
    subscribers.delete(fn)
    if (subscribers.size === 0) {
      clearInterval(tickTimer)
      tickTimer = null
    }
  }
}

// ---------------------------------------------------------------------------
// RelativeTime
// ---------------------------------------------------------------------------

/**
 * Renders a relative time string inside a <time> element.
 * `date` is a Date or epoch ms. When `live` is true the display updates
 * automatically via one shared interval (not a per-instance timer).
 */
export function RelativeTime({
  date,
  live = false,
  className,
  ...rest
}) {
  const locale = useLocale()
  const dateMs = typeof date === "number" ? date : date?.getTime()
  const isoStr = date != null ? new Date(dateMs).toISOString() : undefined

  // Initial render uses date prop as "now" basis to avoid SSR/hydration mismatch
  const [result, setResult] = useState(() =>
    date != null ? formatRelativeTime(dateMs, locale) : { text: "", unit: "second" }
  )

  const localeRef = useRef(locale)
  localeRef.current = locale
  const dateRef = useRef(dateMs)
  dateRef.current = dateMs

  // Update when locale or date changes (non-live)
  useEffect(() => {
    if (date != null) {
      setResult(formatRelativeTime(dateMs, locale))
    }
  }, [dateMs, locale]) // eslint-disable-line react-hooks/exhaustive-deps

  // Live ticking
  useEffect(() => {
    if (!live || date == null) return
    // Immediately compute with real Date.now()
    const r = formatRelativeTime(dateRef.current, localeRef.current)
    setResult(r)

    const unsub = subscribe(() => {
      const r = formatRelativeTime(dateRef.current, localeRef.current)
      setResult(r)
      return tickCadence(r.unit)
    })
    return unsub
  }, [live, date != null]) // eslint-disable-line react-hooks/exhaustive-deps

  const absTitle =
    date != null ? new Date(dateMs).toLocaleString(locale) : undefined

  return (
    <time
      dateTime={isoStr}
      title={absTitle}
      className={cn("format-relative", className)}
      {...rest}
    >
      {result.text}
    </time>
  )
}

// ---------------------------------------------------------------------------
// Bytes
// ---------------------------------------------------------------------------

/**
 * Display a byte count with correct IEC or SI suffixes.
 * Defaults to `iec` (base 1024, KiB/MiB) — the correct labelling for
 * binary-based values.
 */
export function Bytes({
  value,
  base = "iec",
  decimals,
  className,
  ...rest
}) {
  const locale = useLocale()
  const text = fmtBytes(value, { locale, base, decimals })
  return (
    <span className={cn("format-bytes", className)} {...rest}>
      {text}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Duration
// ---------------------------------------------------------------------------

/**
 * Display a duration in milliseconds as a human-readable string.
 * Uses Intl.DurationFormat where available, falls back to
 * Intl.NumberFormat + Intl.ListFormat composition.
 */
export function Duration({
  value,
  style = "narrow",
  className,
  ...rest
}) {
  const locale = useLocale()
  const text = fmtDuration(value, { locale, style })
  return (
    <span className={cn("format-duration", className)} {...rest}>
      {text}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Cost
// ---------------------------------------------------------------------------

/**
 * Display a currency value. Automatically picks extra fraction digits for
 * micro-prices (cloud per-request billing), overridable via props.
 */
export function Cost({
  value,
  currency = "USD",
  minimumFractionDigits,
  maximumFractionDigits,
  className,
  ...rest
}) {
  const locale = useLocale()
  const text = fmtCost(value, {
    locale,
    currency,
    minimumFractionDigits,
    maximumFractionDigits,
  })
  return (
    <span className={cn("format-cost", className)} {...rest}>
      {text}
    </span>
  )
}
