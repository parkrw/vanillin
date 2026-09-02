// Manifest reader/writer for .van.json sidecars: one per ui/<slug>, plus one
// each for the lib/ and styles/ substrate directories.
//
// CLI:
//   node scripts/manifest.mjs          — dry run (list what would change)
//   node scripts/manifest.mjs --write  — create/refresh every .van.json

import { createHash } from "node:crypto"
import { readdirSync, readFileSync, writeFileSync } from "node:fs"
import { basename, join, resolve, dirname } from "node:path"
import { fileURLToPath } from "node:url"

// Canonical key order for deterministic output. A substrate sidecar carries
// only kitVersion/source/files, and writeManifest skips absent keys, so both
// shapes order deterministically from this one list.
const CANONICAL_KEYS = ["name", "kitVersion", "source", "requires", "files"]

/**
 * Stylesheets the kit ships to a consumer, in the order globals.css expects.
 *
 * Explicit rather than a directory walk: styles/van.css is generated per
 * consumer by `van build`, so it is not substrate and must never be tracked
 * or overwritten. typeset.css is standalone — globals.css does not @import it
 * — so the import graph cannot derive this list either.
 */
export const STYLESHEETS = ["globals.css", "defaults.css", "forced-colors.css", "typeset.css"]

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
export function hashBytes(bytes) {
  return `sha256-${createHash("sha256").update(bytes).digest("base64")}`
}

export function hashFile(filePath) {
  return hashBytes(readFileSync(filePath))
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
 * Derive sorted unique array of lib/ files this component imports directly.
 * Names are bare filenames ("cn.js"), matching the flat lib/ layout.
 * Not recorded in the manifest (lib/ is substrate covered by kitVersion) —
 * the registry needs it so `van add` can copy a component's primitives.
 */
export function deriveLibs(componentDir) {
  const libs = new Set()
  for (const file of listRegularFiles(componentDir)) {
    const ext = file.split(".").pop()
    if (ext !== "jsx" && ext !== "js" && ext !== "mjs") continue
    const content = readFileSync(join(componentDir, file), "utf8").replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, "")
    const re = /\bfrom\s+["'](?:\.\.\/)+lib\/([^/"']+)["']/g
    let m
    while ((m = re.exec(content)) !== null) libs.add(m[1])
  }
  return [...libs].sort()
}

/**
 * Derive sorted unique array of sibling lib/ files a lib/ file imports.
 * Flat layout, so only `./name.js` edges exist.
 */
export function deriveLibDeps(libFile) {
  const content = readFileSync(libFile, "utf8").replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, "")
  const deps = new Set()
  const re = /\bfrom\s+["']\.\/([^/"']+)["']/g
  let m
  while ((m = re.exec(content)) !== null) deps.add(m[1])
  return [...deps].sort()
}

/**
 * List regular files in a component dir (recursively), excluding .van.json.
 * Paths are relative to componentDir with forward slashes.
 */
export function listRegularFiles(dir, prefix = "") {
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

/**
 * List the kit's lib/ files, sorted. Flat layout, so no recursion.
 */
export function listLibFiles(libDir) {
  return readdirSync(libDir, { withFileTypes: true })
    .filter((e) => e.isFile() && e.name !== ".van.json")
    .map((e) => e.name)
    .sort()
}

/**
 * Generate a manifest for a substrate directory — lib/ or styles/.
 *
 * No `name` and no `requires`: neither directory is a component, and neither
 * has sibling edges to derive. `files` comes from an explicit list rather than
 * a tree walk, because the kit's styles/ holds more than it ships.
 */
export function generateDirManifest(dir, files, { kitVersion, source }) {
  const out = {}
  for (const file of [...files].sort()) out[file] = hashFile(join(dir, file))
  return { kitVersion, source, files: out }
}

/**
 * Refresh a substrate sidecar, preserving unknown fields the way
 * refreshManifest does for components.
 */
export function refreshDirManifest(dir, files, { kitVersion, source }) {
  const existing = readManifest(dir) || {}
  const merged = { ...existing, ...generateDirManifest(dir, files, { kitVersion, source }) }
  writeManifest(dir, merged)
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

  // Substrate sidecars. Reported like the component ones so a dry run shows
  // every artifact `--write` would touch.
  for (const [label, dir, files] of [
    ["lib", join(repoRoot, "lib"), listLibFiles(join(repoRoot, "lib"))],
    ["styles", join(repoRoot, "styles"), STYLESHEETS],
  ]) {
    const existing = readManifest(dir)
    const fresh = generateDirManifest(dir, files, { kitVersion, source })

    if (!existing) {
      anyChange = true
      if (write) {
        refreshDirManifest(dir, files, { kitVersion, source })
        console.log(`${label}/: created`)
      } else {
        console.log(`${label}/: would create`)
      }
      continue
    }

    const changes = CANONICAL_KEYS.filter(
      (key) => key in fresh && JSON.stringify(existing[key]) !== JSON.stringify(fresh[key]),
    )
    if (changes.length) {
      anyChange = true
      if (write) {
        refreshDirManifest(dir, files, { kitVersion, source })
        console.log(`${label}/: updated (${changes.join(", ")})`)
      } else {
        console.log(`${label}/: would update (${changes.join(", ")})`)
      }
    }
  }

  if (!anyChange) {
    console.log("All manifests up to date.")
  }
}
