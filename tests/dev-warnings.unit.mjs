/**
 * Every console.warn/console.error under ui/ and lib/ must sit inside an
 * `if (process.env.NODE_ENV !== "production")` block, which bundlers strip
 * statically — otherwise the dev-only strings ship to consumers. Pure text and
 * brace matching, no build.
 *
 * What this can and cannot see: it recognizes exactly one guard shape — a
 * lexically enclosing `if (process.env.NODE_ENV !== "production")` (either
 * quote style, either operand order), block-bodied or single-statement. A
 * warn reached only through a differently-shaped guard (a hoisted boolean, an
 * early return, a build-time define under another name) reads as unguarded
 * here and fails loud rather than passing on trust.
 */

import assert from "node:assert/strict"
import { readdirSync, readFileSync } from "node:fs"
import { join, relative } from "node:path"
import { fileURLToPath } from "node:url"

const repoRoot = fileURLToPath(new URL("..", import.meta.url))
const SCAN_DIRS = ["ui", "lib"]

let passed = 0
let failed = 0
const tests = []
function test(name, fn) {
  tests.push([name, fn])
}

// ── Helpers ─────────────────────────────────────────────────────────

function listSourceFiles(dir) {
  const out = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      out.push(...listSourceFiles(full))
    } else if (entry.isFile() && (entry.name.endsWith(".js") || entry.name.endsWith(".jsx"))) {
      out.push(full)
    }
  }
  return out
}

// Comments are blanked, not removed, so reported line numbers stay true.
function stripComments(js) {
  return js
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ""))
    .replace(/\/\/.*/g, "")
}

function lineOf(content, index) {
  return content.slice(0, index).split("\n").length
}

// Find the index one past the matching close-brace for the `{` at
// content[openIndex], quote-aware so a brace inside a string/template
// literal doesn't desync the count. Backticks are treated as opaque (no
// ${...} interpolation tracking) — none of today's guards need it, and a
// stray brace inside one would only make this check MORE conservative
// (report a false unguarded), never silently pass something unguarded.
function matchBrace(content, openIndex) {
  let depth = 0
  let quote = null
  for (let i = openIndex; i < content.length; i++) {
    const ch = content[i]
    if (quote) {
      if (ch === "\\") i++
      else if (ch === quote) quote = null
      continue
    }
    if (ch === '"' || ch === "'" || ch === "`") {
      quote = ch
      continue
    }
    if (ch === "{") depth++
    else if (ch === "}") {
      depth--
      if (depth === 0) return i + 1
    }
  }
  return content.length
}

// Single-statement `if (...) console.warn(...)` with no braces: guarded
// range ends at the next top-level `;` (not inside nested parens/braces).
function matchStatementEnd(content, fromIndex) {
  let depth = 0
  let quote = null
  for (let i = fromIndex; i < content.length; i++) {
    const ch = content[i]
    if (quote) {
      if (ch === "\\") i++
      else if (ch === quote) quote = null
      continue
    }
    if (ch === '"' || ch === "'" || ch === "`") {
      quote = ch
      continue
    }
    if (ch === "(" || ch === "{" || ch === "[") depth++
    else if (ch === ")" || ch === "}" || ch === "]") depth--
    else if (ch === ";" && depth <= 0) return i + 1
  }
  return content.length
}

const GUARD_RE =
  /if\s*\(\s*(?:process\.env\.NODE_ENV\s*!==\s*(["'])production\1|(["'])production\2\s*!==\s*process\.env\.NODE_ENV)\s*\)/g

// Every `if (process.env.NODE_ENV !== "production")` span in the file, as
// [start, end) character ranges covering whatever the if-guard governs.
function guardedRanges(content) {
  const ranges = []
  let m
  GUARD_RE.lastIndex = 0
  while ((m = GUARD_RE.exec(content)) !== null) {
    let i = m.index + m[0].length
    while (/\s/.test(content[i])) i++
    if (content[i] === "{") {
      ranges.push([i + 1, matchBrace(content, i)])
    } else {
      ranges.push([i, matchStatementEnd(content, i)])
    }
  }
  return ranges
}

const CALL_RE = /console\.(warn|error)\s*\(/g

function findCallSites(content) {
  const out = []
  let m
  CALL_RE.lastIndex = 0
  while ((m = CALL_RE.exec(content)) !== null) {
    out.push({ method: m[1], index: m.index, line: lineOf(content, m.index) })
  }
  return out
}

function insideAnyRange(index, ranges) {
  return ranges.some(([start, end]) => index >= start && index < end)
}

// ── Inventory (shared by both tests, computed once) ──────────────────

function inventory() {
  const sites = []
  for (const dir of SCAN_DIRS) {
    for (const file of listSourceFiles(join(repoRoot, dir))) {
      const raw = readFileSync(file, "utf8")
      const content = stripComments(raw)
      const ranges = guardedRanges(content)
      for (const site of findCallSites(content)) {
        sites.push({
          file: relative(repoRoot, file),
          line: site.line,
          method: site.method,
          guarded: insideAnyRange(site.index, ranges),
        })
      }
    }
  }
  return sites
}

// ── Tests ───────────────────────────────────────────────────────────

test("dev-warnings: the scan sees the known call sites, guarded", () => {
  // Precondition for the test below: a walk or regex that matches nothing
  // would pass it vacuously.
  const sites = inventory()
  for (const file of ["ui/dialog/dialog.jsx", "ui/popover/popover.jsx", "lib/use-controllable-state.js"]) {
    const hits = sites.filter((s) => s.file === file)
    assert.ok(hits.length > 0, `no console.warn found in ${file} — the scan is broken, not the file clean`)
    assert.ok(hits.some((s) => s.guarded), `${file}: no call reads as guarded — the guard matcher is broken`)
  }
})

test("dev-warnings: every console.warn/console.error sits inside a NODE_ENV !== \"production\" guard", () => {
  const sites = inventory()
  const unguarded = sites.filter((s) => !s.guarded)
  const detail = unguarded
    .map(
      (s) =>
        `${s.file}:${s.line} — console.${s.method}(...) is not lexically inside an ` +
        `\`if (process.env.NODE_ENV !== "production")\` block. vite strips the guarded form ` +
        `statically; an unguarded call ships the string (and the call) to production consumers. ` +
        `Wrap it in the guard, or in a helper that is itself wrapped in one.`
    )
    .join("\n  ")
  assert.equal(unguarded.length, 0, "dev-warnings (unguarded):\n  " + detail)
})

// ── Run ─────────────────────────────────────────────────────────────

for (const [name, fn] of tests) {
  try {
    fn()
    passed++
  } catch (e) {
    failed++
    console.error(`FAIL: ${name}`)
    console.error("  ", e.message)
  }
}

console.log(`\ndev-warnings: ${passed}/${passed + failed} passed`)
if (failed) process.exit(1)
