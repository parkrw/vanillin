// Manifest reader/writer for ui/<slug>/.van.json sidecars.
//
// CLI:
//   node scripts/manifest.mjs          — dry run (list what would change)
//   node scripts/manifest.mjs --write  — create/refresh every .van.json

import { createHash } from "node:crypto"
import { readdirSync, readFileSync, writeFileSync } from "node:fs"
import { basename, join, resolve, dirname } from "node:path"
import { fileURLToPath } from "node:url"

// Canonical key order for deterministic output.
const CANONICAL_KEYS = ["name", "kitVersion", "source", "requires", "files"]

/**
 * Read and parse the .van.json sidecar, or null if absent.
 */
export function readManifest(componentDir) {
  const p = join(componentDir, ".van.json")
  try {
    return JSON.parse(readFileSync(p, "utf8"))
  } catch (e) {
    if (e.code === "ENOENT") return null
    throw e
  }
}

/**
 * Write .van.json with canonical key order and deterministic formatting.
 * Unknown keys are preserved after the canonical ones in their existing order.
 */
export function writeManifest(componentDir, manifest) {
  const ordered = {}

  // Canonical keys first, in fixed order.
  for (const key of CANONICAL_KEYS) {
    if (key in manifest) {
      let val = manifest[key]
      // Sort requires array.
      if (key === "requires") val = [...val].sort()
      // Sort files keys.
      if (key === "files") {
        const sorted = {}
        for (const k of Object.keys(val).sort()) sorted[k] = val[k]
        val = sorted
      }
      ordered[key] = val
    }
  }

  // Unknown keys in their existing order.
  for (const key of Object.keys(manifest)) {
    if (!CANONICAL_KEYS.includes(key)) ordered[key] = manifest[key]
  }

  writeFileSync(join(componentDir, ".van.json"), JSON.stringify(ordered, null, 2) + "\n")
}

/**
 * SRI-style hash: "sha256-" + base64 of the raw bytes.
 */
export function hashFile(filePath) {
  const hash = createHash("sha256").update(readFileSync(filePath)).digest("base64")
  return `sha256-${hash}`
}

/**
 * Derive sorted unique array of other ui/ slugs this component imports.
 * Detects JS import/export-from and CSS @import edges to sibling dirs.
 * lib/ imports are kit substrate covered by kitVersion, not recorded.
 */
export function deriveRequires(componentDir) {
  const self = basename(componentDir)
  const deps = new Set()

  const files = listRegularFiles(componentDir)
  for (const file of files) {
    const raw = readFileSync(join(componentDir, file), "utf8")
    const ext = file.split(".").pop()
    // Strip block and line comments to avoid false positives.
    const content = raw.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, "")

    if (ext === "jsx" || ext === "js" || ext === "mjs") {
      // Match `from "../<slug>/…"` — covers multi-line import/export.
      // [^./"'] as the first char excludes ".." so "../../lib/…" is skipped.
      const re = /\bfrom\s+["']\.\.\/([^./"'][^/"']*)\//g
      let m
      while ((m = re.exec(content)) !== null) {
        if (m[1] !== self) deps.add(m[1])
      }
    }

    if (ext === "css") {
      const re = /@import\s+["']\.\.\/([^./"'][^/"']*)\//g
      let m
      while ((m = re.exec(content)) !== null) {
        if (m[1] !== self) deps.add(m[1])
      }
    }
  }

  return [...deps].sort()
}

/**
 * List regular files in a component dir (recursively), excluding .van.json.
 * Paths are relative to componentDir with forward slashes.
 */
function listRegularFiles(dir, prefix = "") {
  const results = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name
    if (entry.isDirectory()) {
      results.push(...listRegularFiles(join(dir, entry.name), rel))
    } else if (entry.isFile() && entry.name !== ".van.json") {
      results.push(rel)
    }
  }
  return results.sort()
}

/**
 * Generate a full manifest object for a component directory.
 */
export function generateManifest(componentDir, { kitVersion, source }) {
  const name = basename(componentDir)
  const files = {}
  for (const file of listRegularFiles(componentDir)) {
    files[file] = hashFile(join(componentDir, file))
  }
  return {
    name,
    kitVersion,
    source,
    requires: deriveRequires(componentDir),
    files,
  }
}

/**
 * Refresh a manifest: generate fresh data, merge over the existing manifest
 * to preserve unknown fields, then write deterministically.
 */
export function refreshManifest(componentDir, { kitVersion, source }) {
  const existing = readManifest(componentDir) || {}
  const fresh = generateManifest(componentDir, { kitVersion, source })
  // Merge: fresh fields win, unknown fields from existing survive.
  const merged = { ...existing, ...fresh }
  writeManifest(componentDir, merged)
  return merged
}

// ── CLI ─────────────────────────────────────────────────────────────

const __filename = fileURLToPath(import.meta.url)

function isCLI() {
  return process.argv[1] && resolve(process.argv[1]) === resolve(__filename)
}

if (isCLI()) {
  const repoRoot = resolve(dirname(__filename), "..")
  const pkg = JSON.parse(readFileSync(join(repoRoot, "package.json"), "utf8"))
  const kitVersion = pkg.version
  const source = `github:parkrw/vanillin@v${kitVersion}`
  const uiDir = join(repoRoot, "ui")
  const write = process.argv.includes("--write")

  const dirs = readdirSync(uiDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => join(uiDir, d.name))
    .sort()

  let anyChange = false

  for (const dir of dirs) {
    const slug = basename(dir)
    const existing = readManifest(dir)
    const fresh = generateManifest(dir, { kitVersion, source })

    if (!existing) {
      anyChange = true
      if (write) {
        refreshManifest(dir, { kitVersion, source })
        console.log(`${slug}: created`)
      } else {
        console.log(`${slug}: would create`)
      }
      continue
    }

    // Diff known fields.
    const changes = []
    for (const key of CANONICAL_KEYS) {
      const a = JSON.stringify(existing[key])
      const b = JSON.stringify(fresh[key])
      if (a !== b) changes.push(key)
    }

    if (changes.length) {
      anyChange = true
      if (write) {
        refreshManifest(dir, { kitVersion, source })
        console.log(`${slug}: updated (${changes.join(", ")})`)
      } else {
        console.log(`${slug}: would update (${changes.join(", ")})`)
      }
    }
  }

  if (!anyChange) {
    console.log("All manifests up to date.")
  }
}
