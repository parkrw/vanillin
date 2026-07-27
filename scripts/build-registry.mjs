// Registry generator: walks ui/ and lib/ and emits registry.json, the graph
// `bin/van.mjs` resolves an `add` closure from.
//
// The graph is derived, never hand-maintained — the import statements are the
// only source of truth, and they move every time a component is edited. Both
// the component edges (`requires`) and the file list come from
// scripts/manifest.mjs, so the registry and the per-copy .van.json sidecars
// cannot disagree.
//
// CLI:
//   node scripts/build-registry.mjs          — dry run (report drift)
//   node scripts/build-registry.mjs --write  — write registry.json

import { readdirSync, readFileSync, writeFileSync, existsSync } from "node:fs"
import { basename, join, resolve, dirname } from "node:path"
import { fileURLToPath } from "node:url"
import { deriveRequires, deriveLibs, deriveLibDeps, listRegularFiles } from "./manifest.mjs"

export const REGISTRY_FILE = "registry.json"

/**
 * Build the registry object for a kit checkout.
 *
 * Shape:
 *   { kitVersion, source, components: { slug: { type, files, requires, lib } },
 *     lib: { "file.js": [sibling lib files it imports] } }
 *
 * `lib` is a flat file -> deps map rather than a closure per component so the
 * CLI closes it once, the same way it closes `requires`.
 */
export function buildRegistry(root) {
  const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"))
  const kitVersion = pkg.version
  const uiDir = join(root, "ui")
  const libDir = join(root, "lib")

  const components = {}
  for (const entry of readdirSync(uiDir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    if (!entry.isDirectory()) continue
    const dir = join(uiDir, entry.name)
    components[basename(dir)] = {
      type: "ui",
      files: listRegularFiles(dir),
      requires: deriveRequires(dir),
      lib: deriveLibs(dir),
    }
  }

  const lib = {}
  for (const name of readdirSync(libDir).sort()) {
    const path = join(libDir, name)
    if (!/\.(js|jsx|mjs)$/.test(name)) continue
    lib[name] = deriveLibDeps(path)
  }

  return {
    kitVersion,
    source: `github:parkrw/vanillin@v${kitVersion}`,
    components,
    lib,
  }
}

/** Serialise deterministically, with a trailing newline. */
export function serializeRegistry(registry) {
  return JSON.stringify(registry, null, 2) + "\n"
}

// ── CLI ─────────────────────────────────────────────────────────────

const __filename = fileURLToPath(import.meta.url)

if (process.argv[1] && resolve(process.argv[1]) === resolve(__filename)) {
  const root = resolve(dirname(__filename), "..")
  const outPath = join(root, REGISTRY_FILE)
  const fresh = serializeRegistry(buildRegistry(root))
  const current = existsSync(outPath) ? readFileSync(outPath, "utf8") : null

  if (current === fresh) {
    console.log(`${REGISTRY_FILE} up to date.`)
  } else if (process.argv.includes("--write")) {
    writeFileSync(outPath, fresh)
    console.log(`${REGISTRY_FILE} written (${fresh.length} bytes)`)
  } else {
    console.log(`${REGISTRY_FILE} is stale — run \`npm run contracts\`.`)
    process.exit(1)
  }
}
