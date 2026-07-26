import { parseDate } from "../lib/parse-date.js"

/**
 * Table-driven tests for lib/parse-date.js.
 * Run with plain `node tests/parse-date.unit.mjs` — no browser needed.
 * The `.unit.mjs` suffix keeps it out of tests/run.mjs, which imports every
 * `*.test.mjs` and calls its default export.
 */

// Fixed reference: Wednesday 2026-03-04 (March 4, a Wednesday)
const REF = new Date(2026, 2, 4)

let passed = 0
let failed = 0

function test(name, fn) {
  try {
    fn()
    passed++
  } catch (e) {
    failed++
    console.error(`FAIL: ${name}\n  ${e.message}`)
  }
}

function eq(actual, expected, label = "") {
  if (actual !== expected) {
    throw new Error(`${label ? label + ": " : ""}expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`)
  }
}

function dateEq(result, y, m, d, label) {
  if (!result) throw new Error(`${label}: expected a result, got null`)
  const dt = result.date
  eq(dt.getFullYear(), y, `${label} year`)
  eq(dt.getMonth(), m, `${label} month`)
  eq(dt.getDate(), d, `${label} day`)
}

/* ------------------------------------------------------------------ */
/*  Keywords                                                          */
/* ------------------------------------------------------------------ */

test("today", () => {
  dateEq(parseDate("today", { referenceDate: REF }), 2026, 2, 4, "today")
})

test("tomorrow", () => {
  dateEq(parseDate("tomorrow", { referenceDate: REF }), 2026, 2, 5, "tomorrow")
})

test("yesterday", () => {
  dateEq(parseDate("yesterday", { referenceDate: REF }), 2026, 2, 3, "yesterday")
})

test("TODAY (case-insensitive)", () => {
  dateEq(parseDate("TODAY", { referenceDate: REF }), 2026, 2, 4, "TODAY")
})

/* ------------------------------------------------------------------ */
/*  Relative expressions                                              */
/* ------------------------------------------------------------------ */

test("in 3 days", () => {
  dateEq(parseDate("in 3 days", { referenceDate: REF }), 2026, 2, 7, "in 3 days")
})

test("in 1 day", () => {
  dateEq(parseDate("in 1 day", { referenceDate: REF }), 2026, 2, 5, "in 1 day")
})

test("in 2 weeks", () => {
  dateEq(parseDate("in 2 weeks", { referenceDate: REF }), 2026, 2, 18, "in 2 weeks")
})

test("in 1 month", () => {
  dateEq(parseDate("in 1 month", { referenceDate: REF }), 2026, 3, 4, "in 1 month")
})

test("5 days ago", () => {
  dateEq(parseDate("5 days ago", { referenceDate: REF }), 2026, 1, 27, "5 days ago")
})

test("2 weeks ago", () => {
  dateEq(parseDate("2 weeks ago", { referenceDate: REF }), 2026, 1, 18, "2 weeks ago")
})

test("3 months ago", () => {
  dateEq(parseDate("3 months ago", { referenceDate: REF }), 2025, 11, 4, "3 months ago")
})

/* ------------------------------------------------------------------ */
/*  Weekday names                                                     */
/* ------------------------------------------------------------------ */

test("friday (bare = next occurrence)", () => {
  // ref is Wed Mar 4 -> next Friday is Mar 6
  dateEq(parseDate("friday", { referenceDate: REF }), 2026, 2, 6, "friday")
})

test("next friday", () => {
  dateEq(parseDate("next friday", { referenceDate: REF }), 2026, 2, 6, "next friday")
})

test("last monday", () => {
  // ref is Wed Mar 4 -> last Monday is Mar 2
  dateEq(parseDate("last monday", { referenceDate: REF }), 2026, 2, 2, "last monday")
})

test("last wednesday (same weekday = 7 days back)", () => {
  dateEq(parseDate("last wednesday", { referenceDate: REF }), 2026, 1, 25, "last wed")
})

test("next wednesday (same weekday = 7 days forward)", () => {
  dateEq(parseDate("next wednesday", { referenceDate: REF }), 2026, 2, 11, "next wed")
})

test("next fri (short name)", () => {
  dateEq(parseDate("next fri", { referenceDate: REF }), 2026, 2, 6, "next fri short")
})

/* ------------------------------------------------------------------ */
/*  Month-name forms                                                  */
/* ------------------------------------------------------------------ */

test("4 mar", () => {
  dateEq(parseDate("4 mar", { referenceDate: REF }), 2026, 2, 4, "4 mar")
})

test("mar 4", () => {
  dateEq(parseDate("mar 4", { referenceDate: REF }), 2026, 2, 4, "mar 4")
})

test("march 4 2025", () => {
  dateEq(parseDate("march 4 2025", { referenceDate: REF }), 2025, 2, 4, "march 4 2025")
})

test("march 4, 2025 (comma)", () => {
  dateEq(parseDate("march 4, 2025", { referenceDate: REF }), 2025, 2, 4, "comma form")
})

test("4 march 25 (two-digit year)", () => {
  dateEq(parseDate("4 march 25", { referenceDate: REF }), 2025, 2, 4, "4 march 25")
})

test("invalid month-name day (feb 30) returns null", () => {
  eq(parseDate("feb 30", { referenceDate: REF }), null, "feb 30")
})

/* ------------------------------------------------------------------ */
/*  Numeric dates — locale-dependent field order                      */
/* ------------------------------------------------------------------ */

test("3/4/25 in en-US = March 4", () => {
  dateEq(parseDate("3/4/25", { locale: "en-US", referenceDate: REF }), 2025, 2, 4, "en-US 3/4/25")
})

test("3/4/25 in en-GB = 3 April (day/month/year)", () => {
  dateEq(parseDate("3/4/25", { locale: "en-GB", referenceDate: REF }), 2025, 3, 3, "en-GB 3/4/25")
})

test("03/04/2025 in en-US = March 4", () => {
  dateEq(parseDate("03/04/2025", { locale: "en-US", referenceDate: REF }), 2025, 2, 4, "en-US padded")
})

test("2025-03-04 in de-DE (year.month.day order via Intl)", () => {
  // de-DE numeric order is day.month.year
  dateEq(parseDate("4.3.2025", { locale: "de-DE", referenceDate: REF }), 2025, 2, 4, "de-DE dot")
})

test("12/25 in en-US = Dec 25 of ref year", () => {
  dateEq(parseDate("12/25", { locale: "en-US", referenceDate: REF }), 2026, 11, 25, "two-part en-US")
})

test("25/12 in en-GB = 25 Dec of ref year", () => {
  dateEq(parseDate("25/12", { locale: "en-GB", referenceDate: REF }), 2026, 11, 25, "two-part en-GB")
})

test("dash separator works: 3-4-25 in en-US", () => {
  dateEq(parseDate("3-4-25", { locale: "en-US", referenceDate: REF }), 2025, 2, 4, "dash sep")
})

test("invalid numeric date (13/32/25) returns null", () => {
  eq(parseDate("13/32/25", { locale: "en-US", referenceDate: REF }), null, "invalid")
})

test("invalid numeric date (0/4/25) returns null", () => {
  eq(parseDate("0/4/25", { locale: "en-US", referenceDate: REF }), null, "zero month")
})

/* ------------------------------------------------------------------ */
/*  Two-digit year window                                             */
/* ------------------------------------------------------------------ */

test("two-digit year 25 -> 2025 (within +20 window)", () => {
  dateEq(parseDate("1/1/25", { locale: "en-US", referenceDate: REF }), 2025, 0, 1, "yr 25")
})

test("two-digit year 46 -> 2046 (at +20 boundary)", () => {
  dateEq(parseDate("1/1/46", { locale: "en-US", referenceDate: REF }), 2046, 0, 1, "yr 46")
})

test("two-digit year 47 -> 1947 (past +20 window)", () => {
  dateEq(parseDate("1/1/47", { locale: "en-US", referenceDate: REF }), 1947, 0, 1, "yr 47")
})

test("two-digit year 99 -> 1999", () => {
  dateEq(parseDate("1/1/99", { locale: "en-US", referenceDate: REF }), 1999, 0, 1, "yr 99")
})

test("two-digit year 00 -> 2000", () => {
  dateEq(parseDate("1/1/00", { locale: "en-US", referenceDate: REF }), 2000, 0, 1, "yr 00")
})

/* ------------------------------------------------------------------ */
/*  Edge cases and rejections                                         */
/* ------------------------------------------------------------------ */

test("empty string returns null", () => {
  eq(parseDate("", { referenceDate: REF }), null, "empty")
})

test("whitespace-only returns null", () => {
  eq(parseDate("   ", { referenceDate: REF }), null, "whitespace")
})

test("non-string returns null", () => {
  eq(parseDate(null, { referenceDate: REF }), null, "null input")
  eq(parseDate(undefined, { referenceDate: REF }), null, "undefined input")
  eq(parseDate(42, { referenceDate: REF }), null, "number input")
})

test("nonsense returns null", () => {
  eq(parseDate("not a date", { referenceDate: REF }), null, "nonsense")
})

test("time-of-day is out of scope", () => {
  eq(parseDate("3pm", { referenceDate: REF }), null, "time only")
  eq(parseDate("march 4 2025 3pm", { referenceDate: REF }), null, "date with time")
})

test("confidence is always 'exact'", () => {
  eq(parseDate("today", { referenceDate: REF }).confidence, "exact", "confidence")
})

/* ------------------------------------------------------------------ */
/*  Locale: month names from Intl                                     */
/* ------------------------------------------------------------------ */

test("de-DE month name: 4 März (German)", () => {
  // In de-DE, "märz" is March
  dateEq(parseDate("4 märz", { locale: "de-DE", referenceDate: REF }), 2026, 2, 4, "de-DE month")
})

test("de-DE short month name: 4 mär", () => {
  dateEq(parseDate("4 mär", { locale: "de-DE", referenceDate: REF }), 2026, 2, 4, "de-DE short month")
})

/* ------------------------------------------------------------------ */
/*  Summary                                                           */
/* ------------------------------------------------------------------ */

console.log(`\n${passed} passed, ${failed} failed, ${passed + failed} total`)
if (failed > 0) process.exit(1)
