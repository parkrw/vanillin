/**
 * Parse a date string into a Date, supporting natural-language keywords,
 * relative expressions, and locale-aware numeric dates.
 *
 * Pure function — no global state, no side effects. Clock is injectable
 * via `referenceDate` for deterministic testing.
 *
 * @param {string} input        — the raw string the user typed
 * @param {object} [opts]
 * @param {string} [opts.locale]         — BCP 47 locale tag (default "en-US")
 * @param {Date}   [opts.referenceDate]  — "now" for relative calculations
 * @returns {{ date: Date, confidence: "exact"|"inferred" } | null}
 */
export function parseDate(input, { locale = "en-US", referenceDate } = {}) {
  if (typeof input !== "string") return null
  const trimmed = input.trim()
  if (!trimmed) return null

  const ref = referenceDate ?? new Date()

  return (
    tryKeyword(trimmed, ref) ??
    tryRelativeExpression(trimmed, ref) ??
    tryWeekday(trimmed, ref, locale) ??
    tryMonthName(trimmed, ref, locale) ??
    tryNumeric(trimmed, ref, locale)
  )
}

/* ------------------------------------------------------------------ */
/*  Keyword: today, tomorrow, yesterday                               */
/* ------------------------------------------------------------------ */

function tryKeyword(s, ref) {
  const lower = s.toLowerCase()
  if (lower === "today") return exact(cloneDay(ref, 0))
  if (lower === "tomorrow") return exact(cloneDay(ref, 1))
  if (lower === "yesterday") return exact(cloneDay(ref, -1))
  return null
}

/* ------------------------------------------------------------------ */
/*  Relative: "in N days/weeks/months", "N days/weeks/months ago"     */
/* ------------------------------------------------------------------ */

const RE_IN_N = /^in\s+(\d+)\s+(day|days|week|weeks|month|months)$/i
const RE_N_AGO = /^(\d+)\s+(day|days|week|weeks|month|months)\s+ago$/i

function tryRelativeExpression(s, ref) {
  const lower = s.toLowerCase()
  let m = lower.match(RE_IN_N)
  if (m) return exact(shiftDate(ref, +parseInt(m[1], 10), normalizeUnit(m[2])))
  m = lower.match(RE_N_AGO)
  if (m) return exact(shiftDate(ref, -parseInt(m[1], 10), normalizeUnit(m[2])))
  return null
}

function normalizeUnit(u) {
  if (u.startsWith("day")) return "day"
  if (u.startsWith("week")) return "week"
  if (u.startsWith("month")) return "month"
  return u
}

function shiftDate(ref, n, unit) {
  const d = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate())
  if (unit === "day") d.setDate(d.getDate() + n)
  else if (unit === "week") d.setDate(d.getDate() + n * 7)
  else if (unit === "month") d.setMonth(d.getMonth() + n)
  return d
}

/* ------------------------------------------------------------------ */
/*  Weekday: "friday", "next friday", "last monday"                   */
/* ------------------------------------------------------------------ */

function tryWeekday(s, ref, locale) {
  const lower = s.toLowerCase().trim()
  const weekdayNames = getWeekdayNames(locale)

  let modifier = "next" // bare weekday name means "next occurrence"
  let weekdayStr = lower

  if (lower.startsWith("next ")) {
    modifier = "next"
    weekdayStr = lower.slice(5).trim()
  } else if (lower.startsWith("last ")) {
    modifier = "last"
    weekdayStr = lower.slice(5).trim()
  }

  const targetDay = weekdayNames.get(weekdayStr)
  if (targetDay === undefined) return null

  const refDay = ref.getDay()
  let diff

  if (modifier === "next") {
    diff = ((targetDay - refDay + 7) % 7) || 7 // always forward, at least 1
  } else {
    diff = -(((refDay - targetDay + 7) % 7) || 7) // always backward, at least -1
  }

  return exact(cloneDay(ref, diff))
}

/** Map of lowercase weekday name (long + short) -> JS day index. Cached per locale. */
const weekdayCache = new Map()
function getWeekdayNames(locale) {
  if (weekdayCache.has(locale)) return weekdayCache.get(locale)
  const map = new Map()
  // Generate names from a known Sunday (Jan 4 1970 is a Sunday)
  for (let i = 0; i < 7; i++) {
    const d = new Date(1970, 0, 4 + i)
    const long = new Intl.DateTimeFormat(locale, { weekday: "long" }).format(d).toLowerCase()
    const short = new Intl.DateTimeFormat(locale, { weekday: "short" }).format(d).toLowerCase()
    map.set(long, i)
    if (short !== long) map.set(short, i)
    // Also strip trailing period from short forms (e.g. "lun." in French)
    const noDot = short.replace(/\.$/, "")
    if (noDot !== short) map.set(noDot, i)
  }
  weekdayCache.set(locale, map)
  return map
}

/* ------------------------------------------------------------------ */
/*  Month-name forms: "4 mar", "mar 4", "march 4 2025"               */
/* ------------------------------------------------------------------ */

function tryMonthName(s, ref, locale) {
  const months = getMonthNames(locale)
  const tokens = s.toLowerCase().split(/[\s,]+/).filter(Boolean)

  if (tokens.length < 2 || tokens.length > 3) return null

  let monthIdx = null
  let dayNum = null
  let yearNum = null

  // Try to identify month name and day number in any order
  for (const t of tokens) {
    if (months.has(t) && monthIdx === null) {
      monthIdx = months.get(t)
    } else {
      const n = parseInt(t, 10)
      if (!isNaN(n) && String(n) === t) {
        if (dayNum === null && n >= 1 && n <= 31) {
          dayNum = n
        } else if (yearNum === null) {
          yearNum = n
        }
      }
    }
  }

  if (monthIdx === null || dayNum === null) return null

  let year
  if (yearNum !== null) {
    year = yearNum < 100 ? resolveShortYear(yearNum, ref) : yearNum
  } else {
    year = ref.getFullYear()
  }

  if (!isValidDate(year, monthIdx, dayNum)) return null
  return exact(new Date(year, monthIdx, dayNum))
}

/** Map of lowercase month name (long + short) -> month index. Cached per locale. */
const monthCache = new Map()
function getMonthNames(locale) {
  if (monthCache.has(locale)) return monthCache.get(locale)
  const map = new Map()
  for (let i = 0; i < 12; i++) {
    const d = new Date(2000, i, 15)
    const long = new Intl.DateTimeFormat(locale, { month: "long" }).format(d).toLowerCase()
    const short = new Intl.DateTimeFormat(locale, { month: "short" }).format(d).toLowerCase()
    map.set(long, i)
    if (short !== long) map.set(short, i)
    const noDot = short.replace(/\.$/, "")
    if (noDot !== short) map.set(noDot, i)
  }
  monthCache.set(locale, map)
  return map
}

/* ------------------------------------------------------------------ */
/*  Numeric: locale-derived field order via Intl.DateTimeFormat        */
/* ------------------------------------------------------------------ */

function tryNumeric(s, ref, locale) {
  // Accept separators: / - .
  const parts = s.split(/[/\-.]/).map((p) => p.trim()).filter(Boolean)
  if (parts.length < 2 || parts.length > 3) return null

  // Every part must be numeric
  for (const p of parts) {
    if (!/^\d+$/.test(p)) return null
  }

  const nums = parts.map((p) => parseInt(p, 10))
  const order = getFieldOrder(locale)

  let month, day, year

  if (nums.length === 2) {
    // Two-part: month and day in locale order, year = reference year
    const fields = order.filter((f) => f !== "year")
    month = nums[fields.indexOf("month")]
    day = nums[fields.indexOf("day")]
    year = ref.getFullYear()
  } else {
    // Three-part: full date
    month = nums[order.indexOf("month")]
    day = nums[order.indexOf("day")]
    year = nums[order.indexOf("year")]
  }

  if (month === undefined || day === undefined) return null
  if (year !== undefined && year < 100) year = resolveShortYear(year, ref)
  if (year === undefined) year = ref.getFullYear()

  // month is 1-based from user input
  if (!isValidDate(year, month - 1, day)) return null
  return exact(new Date(year, month - 1, day))
}

/** Derive field order from Intl — the critical locale-aware bit. Cached. */
const orderCache = new Map()
function getFieldOrder(locale) {
  if (orderCache.has(locale)) return orderCache.get(locale)

  const parts = new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(new Date(2000, 0, 15))

  const order = []
  for (const p of parts) {
    if (p.type === "month" || p.type === "day" || p.type === "year") {
      order.push(p.type)
    }
  }
  orderCache.set(locale, order)
  return order
}

/* ------------------------------------------------------------------ */
/*  Two-digit year: sliding window (current year −80 / +20)           */
/* ------------------------------------------------------------------ */

function resolveShortYear(y, ref) {
  const century = Math.floor(ref.getFullYear() / 100) * 100
  const candidate = century + y
  const cutoff = ref.getFullYear() + 20
  return candidate > cutoff ? candidate - 100 : candidate
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function cloneDay(ref, offset) {
  const d = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate())
  if (offset) d.setDate(d.getDate() + offset)
  return d
}

function exact(date) {
  return { date, confidence: "exact" }
}

function isValidDate(year, month, day) {
  if (month < 0 || month > 11 || day < 1) return false
  const d = new Date(year, month, day)
  return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day
}

/**
 * Format a date in the locale's medium style — used by date-input for
 * blur canonicalisation. Exported for consistency.
 */
export function formatDateLocale(date, locale = "en-US") {
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(date)
}
