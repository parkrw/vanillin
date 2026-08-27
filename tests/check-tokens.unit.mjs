/**
 * Pure-node tests for check-tokens.mjs.
 * Named .unit.mjs so the browser test runner ignores it.
 *
 * The fixtures build a throwaway tree under os.tmpdir() rather than editing
 * `styles/defaults.css`: a committed deliberate break is a trap for the next
 * person, and the checker's whole contract is "given a root, what is missing".
 */

import assert from "node:assert/strict"
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, resolve, dirname } from "node:path"
import { fileURLToPath } from "node:url"
import { checkTokens } from "../scripts/check-tokens.mjs"

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, "..")

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

const roots = []
/** Build a fixture tree: `files` maps repo-relative path → contents. */
function fixture(files) {
  const root = mkdtempSync(join(tmpdir(), "check-tokens-"))
  roots.push(root)
  for (const [rel, body] of Object.entries(files)) {
    const path = join(root, rel)
    mkdirSync(dirname(path), { recursive: true })
    writeFileSync(path, body)
  }
  return root
}

const tokensOf = (root) => checkTokens(root).findings.map((f) => f.token)

// ---------------------------------------------------------------------------
// The reported bug: a read with nothing behind it
// ---------------------------------------------------------------------------

const READ = ".x { font-size: calc(var(--missing) * 2); }\n"

test("reports a read that nothing defines", () => {
  const root = fixture({ "styles/typeset.css": READ })
  const { findings } = checkTokens(root)
  assert.deepEqual(
    findings.map((f) => f.token),
    ["--missing"],
  )
  assert.deepEqual(findings[0].sites, ["styles/typeset.css:1"])
})

test("silent when CSS declares the token", () => {
  const root = fixture({ "styles/typeset.css": READ, "styles/defaults.css": ":root { --missing: 1rem; }\n" })
  assert.deepEqual(tokensOf(root), [])
})

test("silent when only an @property declares the token", () => {
  const root = fixture({
    "styles/typeset.css": READ,
    "styles/globals.css": '@property --missing { syntax: "*"; inherits: true; initial-value: 1px; }\n',
  })
  assert.deepEqual(tokensOf(root), [])
})

test("silent when only a .jsx names the token", () => {
  const root = fixture({
    "styles/typeset.css": READ,
    "ui/thing/thing.jsx": 'el.style.setProperty("--missing", "1rem")\n',
  })
  assert.deepEqual(tokensOf(root), [])
})

// The two shapes a naive `setProperty\(\s*"` regex misses. Both are real:
// ui/scroll-area/scroll-area.jsx:99 passes a ternary, and eight tokens arrive
// only as inline JSX style keys.
test("silent when a .jsx sets the token through a ternary", () => {
  const root = fixture({
    "styles/typeset.css": READ,
    "ui/thing/thing.jsx": 'el.style.setProperty(tall ? "--missing" : "--other", n)\n',
  })
  assert.deepEqual(tokensOf(root), [])
})

test("silent when the token comes from an inline JSX style object", () => {
  const root = fixture({
    "styles/typeset.css": READ,
    "ui/thing/thing.jsx": 'return <div style={{ "--missing": w + "px" }} />\n',
  })
  assert.deepEqual(tokensOf(root), [])
})

test("silent when lib/ names the token", () => {
  const root = fixture({ "styles/typeset.css": READ, "lib/use-thing.js": 'const K = "--missing"\n' })
  assert.deepEqual(tokensOf(root), [])
})

// ---------------------------------------------------------------------------
// Fallbacks — a var() with one cannot invalidate, whatever the token does
// ---------------------------------------------------------------------------

test("silent when the read supplies a fallback", () => {
  const root = fixture({ "ui/thing/thing.css": ".x { color: var(--missing, red); }\n" })
  assert.deepEqual(tokensOf(root), [])
})

test("silent when a nested fallback token is itself defined", () => {
  const root = fixture({
    "ui/thing/thing.css": ".x { color: var(--missing, var(--warning)); }\n",
    "styles/defaults.css": ":root { --warning: red; }\n",
  })
  assert.deepEqual(tokensOf(root), [])
})

// The fallback is what gets substituted, so an undefined token *inside* one
// invalidates the declaration just as an undefined outer token would.
test("reports an undefined token used as a fallback", () => {
  const root = fixture({ "ui/thing/thing.css": ".x { color: var(--missing, var(--warning)); }\n" })
  assert.deepEqual(tokensOf(root), ["--warning"])
})

test("still reports the outer token when only the inner one has a fallback", () => {
  const root = fixture({ "ui/thing/thing.css": ".x { color: var(--outer); --y: var(--inner, red); }\n" })
  assert.deepEqual(tokensOf(root), ["--outer"])
})

// ---------------------------------------------------------------------------
// Scanning boundaries
// ---------------------------------------------------------------------------

test("ignores reads inside a CSS comment", () => {
  const root = fixture({ "styles/typeset.css": "/* was var(--gone) */\n.x { color: red; }\n" })
  assert.deepEqual(tokensOf(root), [])
})

test("a stripped comment does not shift the reported line number", () => {
  const root = fixture({ "styles/typeset.css": "/* two\n   lines */\n.x { color: var(--missing); }\n" })
  assert.deepEqual(checkTokens(root).findings[0].sites, ["styles/typeset.css:3"])
})

test("site/ stylesheets are out of scope", () => {
  const root = fixture({ "site/site.css": ".x { color: var(--missing); }\n" })
  assert.deepEqual(tokensOf(root), [])
})

test("names every site of a token read from more than one file", () => {
  const root = fixture({ "styles/typeset.css": READ, "ui/thing/thing.css": ".y { top: var(--missing); }\n" })
  assert.deepEqual(checkTokens(root).findings[0].sites, [
    "styles/typeset.css:1",
    "ui/thing/thing.css:1",
  ])
})

// ---------------------------------------------------------------------------
// The real tree
// ---------------------------------------------------------------------------

test("the repo itself is clean", () => {
  const { findings, stats } = checkTokens(ROOT)
  assert.deepEqual(findings, [], `findings: ${findings.map((f) => f.token).join(", ")}`)
  assert.ok(stats.reads > 50, `expected the scan to find real reads, got ${stats.reads}`)
  assert.ok(stats.cssFiles > 50, `expected the scan to find real stylesheets, got ${stats.cssFiles}`)
})

test("the three typeset font tokens are registered with @property", () => {
  const globals = readFileSync(resolve(ROOT, "styles/globals.css"), "utf-8")
  for (const token of ["--typeset-font-body", "--typeset-font-heading", "--typeset-font-mono"])
    assert.match(globals, new RegExp(`@property ${token} \\{[^}]*initial-value:`))
})

for (const root of roots) rmSync(root, { recursive: true, force: true })

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

console.log(`\ncheck-tokens: ${passed}/${passed + failed} passed`)
if (failed) process.exit(1)
