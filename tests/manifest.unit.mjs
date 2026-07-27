/**
 * Pure-node tests for scripts/manifest.mjs.
 * Named .unit.mjs so the browser test runner ignores it.
 */

import assert from "node:assert/strict"
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"
import {
  readManifest,
  writeManifest,
  hashFile,
  deriveRequires,
  generateManifest,
  refreshManifest,
} from "../scripts/manifest.mjs"

let passed = 0
let failed = 0
const tests = []

function test(name, fn) {
  tests.push([name, fn])
}

function makeTmpDir() {
  return mkdtempSync(join(tmpdir(), "vanillin-manifest-test-"))
}

// ---------------------------------------------------------------------------
// round-trip: write, read back, deep-equal
// ---------------------------------------------------------------------------

test("round-trip: write then read back is deep-equal", () => {
  const dir = makeTmpDir()
  const manifest = {
    name: "button",
    kitVersion: "0.1.0",
    source: "github:parkrw/vanillin@v0.1.0",
    requires: ["tooltip"],
    files: { "button.jsx": "sha256-abc123", "button.css": "sha256-def456" },
  }
  writeManifest(dir, manifest)
  const read = readManifest(dir)
  assert.deepEqual(read, manifest)
  rmSync(dir, { recursive: true })
})

// ---------------------------------------------------------------------------
// readManifest returns null for missing sidecar
// ---------------------------------------------------------------------------

test("readManifest returns null when .van.json is absent", () => {
  const dir = makeTmpDir()
  assert.equal(readManifest(dir), null)
  rmSync(dir, { recursive: true })
})

// ---------------------------------------------------------------------------
// unknown fields survive a refresh
// ---------------------------------------------------------------------------

test("unknown fields survive a refresh and key order stays deterministic", () => {
  const dir = makeTmpDir()
  writeFileSync(join(dir, "comp.jsx"), "export function Comp() {}")

  // Write an initial manifest with an unknown field.
  const initial = {
    name: "comp",
    kitVersion: "0.1.0",
    source: "github:parkrw/vanillin@v0.1.0",
    requires: [],
    files: {},
    customField: "preserve-me",
    anotherCustom: 42,
  }
  writeManifest(dir, initial)

  // Refresh over it — unknown fields must survive.
  refreshManifest(dir, { kitVersion: "0.1.0", source: "github:parkrw/vanillin@v0.1.0" })
  const result = readManifest(dir)

  assert.equal(result.customField, "preserve-me")
  assert.equal(result.anotherCustom, 42)

  // Verify canonical keys come first in the JSON.
  const raw = readFileSync(join(dir, ".van.json"), "utf8")
  const keys = Object.keys(JSON.parse(raw))
  const canonicalEnd = keys.indexOf("files")
  const customStart = keys.indexOf("customField")
  assert.ok(canonicalEnd < customStart, "canonical keys must precede unknown keys")

  rmSync(dir, { recursive: true })
})

// ---------------------------------------------------------------------------
// hashFile
// ---------------------------------------------------------------------------

test("hashFile produces sha256- prefix", () => {
  const dir = makeTmpDir()
  const file = join(dir, "test.txt")
  writeFileSync(file, "hello world")
  const hash = hashFile(file)
  assert.ok(hash.startsWith("sha256-"), `expected sha256- prefix, got ${hash}`)
  rmSync(dir, { recursive: true })
})

test("hashFile changes when file content changes", () => {
  const dir = makeTmpDir()
  const file = join(dir, "test.txt")
  writeFileSync(file, "version 1")
  const hash1 = hashFile(file)
  writeFileSync(file, "version 2")
  const hash2 = hashFile(file)
  assert.notEqual(hash1, hash2)
  rmSync(dir, { recursive: true })
})

// ---------------------------------------------------------------------------
// deriveRequires
// ---------------------------------------------------------------------------

test("deriveRequires finds import-from edges", () => {
  const root = makeTmpDir()
  const compDir = join(root, "my-comp")
  mkdirSync(compDir)
  writeFileSync(
    join(compDir, "my-comp.jsx"),
    `import { Button } from "../button/button.jsx"\nimport { cn } from "../../lib/cn.js"\n`
  )
  const requires = deriveRequires(compDir)
  assert.deepEqual(requires, ["button"])
  rmSync(root, { recursive: true })
})

test("deriveRequires finds export-from edges", () => {
  const root = makeTmpDir()
  const compDir = join(root, "my-comp")
  mkdirSync(compDir)
  writeFileSync(
    join(compDir, "my-comp.jsx"),
    `export { DropdownMenuItem } from "../dropdown-menu/dropdown-menu.jsx"\n`
  )
  const requires = deriveRequires(compDir)
  assert.deepEqual(requires, ["dropdown-menu"])
  rmSync(root, { recursive: true })
})

test("deriveRequires finds CSS @import edges", () => {
  const root = makeTmpDir()
  const compDir = join(root, "my-comp")
  mkdirSync(compDir)
  writeFileSync(join(compDir, "my-comp.css"), `@import "../badge/badge.css";\n`)
  const requires = deriveRequires(compDir)
  assert.deepEqual(requires, ["badge"])
  rmSync(root, { recursive: true })
})

test("deriveRequires dedupes, sorts, excludes self", () => {
  const root = makeTmpDir()
  const compDir = join(root, "sidebar")
  mkdirSync(compDir)
  writeFileSync(
    join(compDir, "sidebar.jsx"),
    [
      `import { Input } from "../input/input.jsx"`,
      `import { Tooltip } from "../tooltip/tooltip.jsx"`,
      `import { Input as I2 } from "../input/input.jsx"`,
      `import { Self } from "../sidebar/sidebar.jsx"`,
    ].join("\n") + "\n"
  )
  writeFileSync(join(compDir, "sidebar.css"), `@import "../tooltip/tooltip.css";\n`)
  const requires = deriveRequires(compDir)
  assert.deepEqual(requires, ["input", "tooltip"])
  rmSync(root, { recursive: true })
})

test("deriveRequires excludes lib/ imports", () => {
  const root = makeTmpDir()
  const compDir = join(root, "tabs")
  mkdirSync(compDir)
  writeFileSync(
    join(compDir, "tabs.jsx"),
    `import { cn } from "../../lib/cn.js"\nimport { useControllableState } from "../../lib/use-controllable-state.js"\n`
  )
  const requires = deriveRequires(compDir)
  assert.deepEqual(requires, [])
  rmSync(root, { recursive: true })
})

// ---------------------------------------------------------------------------
// generateManifest
// ---------------------------------------------------------------------------

test("generateManifest lists all files except .van.json", () => {
  const dir = makeTmpDir()
  writeFileSync(join(dir, "comp.jsx"), "export function Comp() {}")
  writeFileSync(join(dir, "comp.css"), ".comp {}")
  writeFileSync(join(dir, ".van.json"), "{}")
  const manifest = generateManifest(dir, {
    kitVersion: "0.1.0",
    source: "github:parkrw/vanillin@v0.1.0",
  })
  const fileKeys = Object.keys(manifest.files)
  assert.ok(fileKeys.includes("comp.jsx"))
  assert.ok(fileKeys.includes("comp.css"))
  assert.ok(!fileKeys.includes(".van.json"))
  rmSync(dir, { recursive: true })
})

test("generateManifest includes files in subdirectories", () => {
  const dir = makeTmpDir()
  writeFileSync(join(dir, "comp.jsx"), "export function Comp() {}")
  mkdirSync(join(dir, "plugins"))
  writeFileSync(join(dir, "plugins", "auto.js"), "export default {}")
  const manifest = generateManifest(dir, {
    kitVersion: "0.1.0",
    source: "github:parkrw/vanillin@v0.1.0",
  })
  assert.ok("plugins/auto.js" in manifest.files)
  rmSync(dir, { recursive: true })
})

// ---------------------------------------------------------------------------
// writeManifest byte stability
// ---------------------------------------------------------------------------

test("writeManifest is byte-stable: two writes produce identical bytes", () => {
  const dir = makeTmpDir()
  const manifest = {
    name: "card",
    kitVersion: "0.1.0",
    source: "github:parkrw/vanillin@v0.1.0",
    requires: ["button", "avatar"],
    files: { "card.css": "sha256-aaa", "card.jsx": "sha256-bbb" },
  }
  writeManifest(dir, manifest)
  const bytes1 = readFileSync(join(dir, ".van.json"))
  writeManifest(dir, manifest)
  const bytes2 = readFileSync(join(dir, ".van.json"))
  assert.deepEqual(bytes1, bytes2)
  rmSync(dir, { recursive: true })
})

test("writeManifest canonical key order regardless of input key order", () => {
  const dir = makeTmpDir()
  // Provide keys in reverse order.
  const manifest = {
    files: { "a.jsx": "sha256-x" },
    requires: [],
    source: "github:parkrw/vanillin@v0.1.0",
    kitVersion: "0.1.0",
    name: "reversed",
  }
  writeManifest(dir, manifest)
  const raw = readFileSync(join(dir, ".van.json"), "utf8")
  const keys = Object.keys(JSON.parse(raw))
  assert.deepEqual(keys, ["name", "kitVersion", "source", "requires", "files"])
  rmSync(dir, { recursive: true })
})

test("writeManifest sorts requires and files keys", () => {
  const dir = makeTmpDir()
  const manifest = {
    name: "test",
    kitVersion: "0.1.0",
    source: "x",
    requires: ["zebra", "alpha", "middle"],
    files: { "z.css": "sha256-z", "a.jsx": "sha256-a", "m.js": "sha256-m" },
  }
  writeManifest(dir, manifest)
  const result = readManifest(dir)
  assert.deepEqual(result.requires, ["alpha", "middle", "zebra"])
  assert.deepEqual(Object.keys(result.files), ["a.jsx", "m.js", "z.css"])
  rmSync(dir, { recursive: true })
})

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------

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

console.log(`\nmanifest: ${passed}/${passed + failed} passed`)
if (failed) process.exit(1)
