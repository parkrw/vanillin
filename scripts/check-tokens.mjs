#!/usr/bin/env node
/**
 * Custom-property guard — a GATE, not an instrument. It exits non-zero on a
 * finding, unlike `sweep-pages.mjs` and `probe-stacking.mjs`, which measure and
 * always exit 0. That difference is deliberate: those two report judgement
 * calls a human ranks, this one reports a fact a build can act on. Leave it.
 *
 * Why it exists: a `var(--x)` that nothing defines is invalid at
 * computed-value time when it sits inside `calc()`. Neither `vite build` (it
 * never resolves custom properties) nor `tests/run.mjs` can see that, so the
 * seam between generated `styles/defaults.css` and the hand-written
 * `styles/typeset.css` plus 68 component stylesheets could drift in silence.
 *
 * A read is a finding only when all three of these are false:
 *
 *   1. the `var()` supplies a fallback — `var(--x, 1rem)` cannot invalidate,
 *      whatever `--x` does. This is how consumer-override hooks are written
 *      (`--live-value-up`, `ui/live-value/live-value.css:18`).
 *   2. some CSS declares it — a declaration in any block, or an `@property`.
 *   3. some JS names it — JS owns 10 tokens the CSS never declares
 *      (`--sidebar-width`, `--toast-offset`, …). Matching a bare token name
 *      anywhere in `ui/**\/*.jsx` or `lib/**` is cruder than parsing the call
 *      and right more often: `setProperty` is not always passed a literal
 *      (`ui/scroll-area/scroll-area.jsx:99` passes a ternary) and eight tokens
 *      arrive only as inline JSX `style={{"--x": …}}` keys.
 *
 * Drop rule 1 or 3 and it reports 19 tokens that are all correct — noise that
 * gets the gate ignored, which is the real risk here.
 *
 * Definitions are collected globally, not per file: a token declared in one
 * component's stylesheet counts as defined for every other. Cross-component
 * reads are not a thing the kit does, and scoping would need cascade
 * resolution this cannot do statically.
 *
 *   node scripts/check-tokens.mjs         # exit 0 clean, 1 with findings
 *   node scripts/check-tokens.mjs --json  # machine-readable
 *
 * Out of scope: whether a token's *value* is sensible, and `site/`, whose
 * tokens are the docs site's own and never shipped to a consumer.
 */

import { readFileSync, readdirSync } from "node:fs"
import { join, relative } from "node:path"
import { fileURLToPath } from "node:url"

const CSS_ROOTS = ["styles", "ui"]
const JS_ROOTS = ["ui", "lib"]
const SKIP_DIRS = new Set(["node_modules", ".git", "dist"])

function walk(dir, out = []) {
  let entries
  try {
    entries = readdirSync(dir, { withFileTypes: true })
  } catch {
    return out
  }
  for (const entry of entries) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) walk(path, out)
    } else out.push(path)
  }
  return out
}

const stripComments = (src) => src.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " "))

// Balanced-paren scan rather than a regex: the fallback of `var(--a, var(--b))`
// contains its own comma and parens, and only a top-level comma means the read
// has a fallback at all.
function readsIn(src) {
  const found = []
  const opener = /\bvar\(\s*(--[\w-]+)/g
  let match
  while ((match = opener.exec(src))) {
    let depth = 1
    let at = match.index + match[0].length
    let fallback = false
    while (at < src.length && depth > 0) {
      const ch = src[at]
      if (ch === "(") depth++
      else if (ch === ")") depth--
      else if (ch === "," && depth === 1) fallback = true
      at++
    }
    if (!fallback)
      found.push({ token: match[1], line: src.slice(0, match.index).split("\n").length })
  }
  return found
}

export function checkTokens(root) {
  const cssFiles = CSS_ROOTS.flatMap((dir) => walk(join(root, dir))).filter((f) =>
    f.endsWith(".css"),
  )
  const jsFiles = JS_ROOTS.flatMap((dir) => walk(join(root, dir))).filter((f) =>
    /\.(jsx|js|mjs)$/.test(f),
  )

  const reads = new Map()
  const defined = new Set()
  for (const file of cssFiles) {
    const src = stripComments(readFileSync(file, "utf8"))
    for (const { token, line } of readsIn(src)) {
      if (!reads.has(token)) reads.set(token, [])
      reads.get(token).push(`${relative(root, file)}:${line}`)
    }
    for (const m of src.matchAll(/(?:^|[;{\s])(--[\w-]+)\s*:/g)) defined.add(m[1])
    for (const m of src.matchAll(/@property\s+(--[\w-]+)/g)) defined.add(m[1])
  }

  const namedInJs = new Set()
  for (const file of jsFiles)
    for (const m of readFileSync(file, "utf8").matchAll(/--[\w-]+/g)) namedInJs.add(m[0])

  const findings = [...reads.keys()]
    .filter((token) => !defined.has(token) && !namedInJs.has(token))
    .sort()
    .map((token) => ({ token, sites: [...new Set(reads.get(token))] }))

  return {
    findings,
    stats: {
      cssFiles: cssFiles.length,
      jsFiles: jsFiles.length,
      reads: reads.size,
      defined: defined.size,
      namedInJs: namedInJs.size,
    },
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const root = fileURLToPath(new URL("..", import.meta.url))
  const { findings, stats } = checkTokens(root)
  if (process.argv.includes("--json")) {
    console.log(JSON.stringify({ findings, stats }, null, 2))
  } else if (findings.length) {
    console.error(`check-tokens: ${findings.length} custom propert${
      findings.length === 1 ? "y is" : "ies are"
    } read but never defined\n`)
    for (const { token, sites } of findings) console.error(`  ${token}\n      ${sites.join("\n      ")}`)
    console.error(
      "\nDefine it in CSS, give the var() a fallback, or set it from JS — whichever the token is for.",
    )
  } else {
    console.log(
      `check-tokens: clean — ${stats.reads} tokens read across ${stats.cssFiles} stylesheets, all defined`,
    )
  }
  process.exit(findings.length ? 1 : 0)
}
