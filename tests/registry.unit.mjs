/**
 * registry.json freshness + shape.
 * Named .unit.mjs so the browser test runner ignores it.
 *
 * The on-disk registry must equal a fresh generation, byte for byte: `van add`
 * resolves its closure from the committed file, so a stale one ships the wrong
 * dependency graph to consumers.
 */

import assert from "node:assert/strict"
import { readFileSync, existsSync } from "node:fs"
import { join } from "node:path"
import { fileURLToPath } from "node:url"
import { buildRegistry, serializeRegistry, REGISTRY_FILE } from "../scripts/build-registry.mjs"
import { readManifest } from "../scripts/manifest.mjs"

const repoRoot = fileURLToPath(new URL("..", import.meta.url))
const registryPath = join(repoRoot, REGISTRY_FILE)

let passed = 0
let failed = 0

function test(name, fn) {
  try {
    fn()
    passed++
  } catch (err) {
    failed++
    console.error(`FAIL ${name}\n  ${err.message}`)
  }
}

const fresh = buildRegistry(repoRoot)

test("registry.json exists and is fresh", () => {
  assert.ok(existsSync(registryPath), `${REGISTRY_FILE} missing — run \`npm run contracts\``)
  assert.equal(
    readFileSync(registryPath, "utf8"),
    serializeRegistry(fresh),
    `${REGISTRY_FILE} is stale — run \`npm run contracts\``,
  )
})

test("every component entry is well formed", () => {
  const slugs = Object.keys(fresh.components)
  assert.ok(slugs.length > 50, `only ${slugs.length} components discovered`)
  for (const [slug, entry] of Object.entries(fresh.components)) {
    assert.equal(entry.type, "ui", `${slug}: unexpected type ${entry.type}`)
    // Every component ships <slug>.jsx, <slug>.css or both — date-picker and
    // typography are CSS-only patterns, density is JSX-only.
    assert.ok(
      entry.files.includes(`${slug}.jsx`) || entry.files.includes(`${slug}.css`),
      `${slug}: no ${slug}.jsx or ${slug}.css`,
    )
    assert.ok(!entry.files.includes(".van.json"), `${slug}: sidecar must not be a registry file`)
  }
})

test("requires edges point at known slugs, never at self", () => {
  for (const [slug, entry] of Object.entries(fresh.components)) {
    for (const dep of entry.requires) {
      assert.ok(fresh.components[dep], `${slug}: requires unknown component "${dep}"`)
      assert.notEqual(dep, slug, `${slug}: requires itself`)
    }
  }
})

test("lib edges point at files that exist in the lib map", () => {
  for (const [slug, entry] of Object.entries(fresh.components)) {
    for (const file of entry.lib) {
      assert.ok(file in fresh.lib, `${slug}: imports unknown lib file "${file}"`)
    }
  }
  for (const [file, deps] of Object.entries(fresh.lib)) {
    for (const dep of deps) {
      assert.ok(dep in fresh.lib, `lib/${file}: imports unknown sibling "${dep}"`)
    }
  }
})

test("registry requires matches each component's manifest requires", () => {
  for (const [slug, entry] of Object.entries(fresh.components)) {
    const manifest = readManifest(join(repoRoot, "ui", slug))
    assert.ok(manifest, `${slug}: no .van.json — run \`npm run contracts\``)
    assert.deepEqual(
      entry.requires,
      manifest.requires,
      `${slug}: registry and manifest disagree on requires`,
    )
  }
})

test("registry kitVersion matches package.json", () => {
  const pkg = JSON.parse(readFileSync(join(repoRoot, "package.json"), "utf8"))
  assert.equal(fresh.kitVersion, pkg.version)
})

console.log(`registry: ${passed} passed, ${failed} failed`)
if (failed) process.exit(1)
