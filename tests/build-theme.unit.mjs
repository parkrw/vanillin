/**
 * Pure-node tests for build-theme.mjs.
 * Named .unit.mjs so the browser test runner ignores it.
 */

import assert from "node:assert/strict"
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { resolve, dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { generate, discoverComponents } from "../scripts/build-theme.mjs"

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

// ---------------------------------------------------------------------------
// Fixture tree: a throwaway root with just the files generate() reads.
// ---------------------------------------------------------------------------

const FIXTURE_GLOBALS = `
@property --brand { syntax: "<color>"; inherits: true; initial-value: oklch(0.5 0 0); }
@property --surface { syntax: "<color>"; inherits: true; initial-value: oklch(1 0 0); }
:root { --brand: light-dark(oklch(0.5 0 0), oklch(0.8 0 0)); }
`

/** Build a fixture root; `components` maps slug -> CSS text. Returns its path. */
function fixtureRoot(components = {}, globalsCss = FIXTURE_GLOBALS) {
  const root = mkdtempSync(join(tmpdir(), "van-theme-"))
  mkdirSync(join(root, "styles"), { recursive: true })
  writeFileSync(join(root, "styles/globals.css"), globalsCss)
  for (const [slug, css] of Object.entries(components)) {
    mkdirSync(join(root, "ui", slug), { recursive: true })
    writeFileSync(join(root, "ui", slug, `${slug}.css`), css)
  }
  roots.push(root)
  return root
}

const roots = []

/** Run `fn` with console.warn captured; returns the collected messages. */
function captureWarnings(fn) {
  const warnings = []
  const real = console.warn
  console.warn = (...args) => warnings.push(args.join(" "))
  try {
    fn()
  } finally {
    console.warn = real
  }
  return warnings
}

const OVERRIDE_CONFIG = { components: { widget: { tokens: { "border-radius": "1rem" } } } }

// ---------------------------------------------------------------------------
// Block class: derived from the slug, not from rule order
// ---------------------------------------------------------------------------

test("block class: rule order does not move the emitted selector", () => {
  const partFirst = ".widget-part {\n  color: red;\n}\n\n.widget {\n  color: blue;\n}\n"
  const blockFirst = ".widget {\n  color: blue;\n}\n\n.widget-part {\n  color: red;\n}\n"
  const a = generate(OVERRIDE_CONFIG, { root: fixtureRoot({ widget: partFirst }), tokenSources: [] })
  const b = generate(OVERRIDE_CONFIG, { root: fixtureRoot({ widget: blockFirst }), tokenSources: [] })
  assert.equal(a, b, "reordering the component's CSS changed the generated file")
  assert.match(a, /^\.widget \{$/m)
  assert.doesNotMatch(a, /^\.widget-part \{$/m)
})

test("block class: a leading comment does not become the block class", () => {
  const css = "/* .widget-legacy {} */\n.widget-part {\n  color: red;\n}\n\n.widget {\n  color: blue;\n}\n"
  const root = fixtureRoot({ widget: css })
  assert.equal(discoverComponents(root).get("widget"), "widget")
})

test("block class: variant-first CSS still resolves to the slug", () => {
  // The shape that was broken in the kit: drawer.css opens with `.drawer--down`.
  const css = ".widget--down {\n  inset: 0;\n}\n\n.widget {\n  color: blue;\n}\n"
  assert.equal(discoverComponents(fixtureRoot({ widget: css })).get("widget"), "widget")
})

test("block class: the kit's own components resolve to their slug", () => {
  const map = discoverComponents(ROOT)
  for (const slug of ["drawer", "sheet", "sidebar", "table", "toast", "dialog"]) {
    assert.equal(map.get(slug), slug, `${slug} should anchor on .${slug}`)
  }
})

test("block class: allowlisted exceptions keep their reviewed class", () => {
  const map = discoverComponents(ROOT)
  assert.equal(map.get("button"), "btn")
  assert.equal(map.get("button-group"), "btn-group")
  assert.equal(map.get("select"), "select-trigger")
  assert.equal(map.get("alert-dialog"), "alert-dialog")
})

test("block class: no slug class and no allowlist entry warns and falls back", () => {
  const root = fixtureRoot({ widget: ".widget-part {\n  color: red;\n}\n" })
  let css
  const warnings = captureWarnings(() => {
    css = generate(OVERRIDE_CONFIG, { root, tokenSources: [] })
  })
  assert.match(css, /^\.widget-part \{$/m)
  assert.equal(warnings.length, 1)
  assert.match(warnings[0], /no \.widget block class/)
  assert.match(warnings[0], /BLOCK_CLASS_OVERRIDES/)
})

test("block class: a resolved component warns about nothing", () => {
  const root = fixtureRoot({ widget: ".widget {\n  color: blue;\n}\n" })
  const warnings = captureWarnings(() => generate(OVERRIDE_CONFIG, { root, tokenSources: [] }))
  assert.deepEqual(warnings, [])
})

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

for (const root of roots) rmSync(root, { recursive: true, force: true })

console.log(`\nbuild-theme: ${passed}/${passed + failed} passed`)
if (failed) process.exit(1)
