#!/usr/bin/env node
/**
 * Vanillin theme generator.
 *
 * Reads vanillin.config.json and produces styles/vanillin.css -- a static CSS
 * file that overrides the project's design tokens. Import it after globals.css:
 *
 *   import "../styles/globals.css"
 *   import "../styles/vanillin.css"
 *
 * The output is deterministic: same config -> byte-identical CSS. Consumers
 * should commit vanillin.css; the generator is a dev-time tool.
 *
 * Interface for task 38 (CLI):
 *   - generate(config, { root }) -> string   (CSS text)
 *   - discoverComponents(root)   -> Map       (slug -> blockClass)
 *   - extractTokenDefaults(css)  -> object    (token -> { light, dark })
 *   The CLI should read the config, call generate(), and write the result.
 *   Validation errors throw with a human-readable message.
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs"
import { resolve, dirname } from "node:path"
import { fileURLToPath } from "node:url"
import { validate, parseOklch, parseColorTokens } from "./config-schema.mjs"

const __dirname = dirname(fileURLToPath(import.meta.url))
const VERSION = "0.1.0"

// ---------------------------------------------------------------------------
// Component discovery
// ---------------------------------------------------------------------------

/**
 * Scan ui/ to build a slug -> CSS block-class map.
 * The block class is the first class selector in the component's CSS file.
 */
export function discoverComponents(root) {
  const uiDir = resolve(root, "ui")
  const map = new Map()
  let dirs
  try {
    dirs = readdirSync(uiDir, { withFileTypes: true })
  } catch {
    return map
  }
  for (const d of dirs) {
    if (!d.isDirectory()) continue
    const cssPath = resolve(uiDir, d.name, `${d.name}.css`)
    if (!existsSync(cssPath)) continue
    const css = readFileSync(cssPath, "utf-8")
    const m = css.match(/^\.([\w-]+)\s*[{,]/m)
    if (m) map.set(d.name, m[1])
  }
  return map
}

// ---------------------------------------------------------------------------
// Globals.css defaults extraction
// ---------------------------------------------------------------------------

/**
 * Split a light-dark(L, D) value, handling nested parentheses.
 * Returns { light, dark } or null.
 */
function splitLightDark(value) {
  if (!value.startsWith("light-dark(")) return null
  const start = "light-dark(".length
  let depth = 0
  let commaPos = -1
  for (let i = start; i < value.length; i++) {
    const ch = value[i]
    if (ch === "(") depth++
    else if (ch === ")") {
      if (depth === 0) break
      depth--
    } else if (ch === "," && depth === 0) {
      commaPos = i
      break
    }
  }
  if (commaPos === -1) return null
  const endParen = value.lastIndexOf(")")
  return {
    light: value.slice(start, commaPos).trim(),
    dark: value.slice(commaPos + 1, endParen).trim(),
  }
}

/**
 * Parse the :root block of globals.css to extract token defaults.
 * Returns { tokenName: { light, dark } } for each custom property.
 */
export function extractTokenDefaults(css) {
  const defaults = {}
  // Find the :root { ... } block
  const rootIdx = css.indexOf(":root {")
  if (rootIdx === -1) return defaults

  let braceDepth = 0
  let blockStart = -1
  let blockEnd = -1
  for (let i = rootIdx; i < css.length; i++) {
    if (css[i] === "{") {
      if (braceDepth === 0) blockStart = i + 1
      braceDepth++
    } else if (css[i] === "}") {
      braceDepth--
      if (braceDepth === 0) {
        blockEnd = i
        break
      }
    }
  }
  if (blockStart === -1 || blockEnd === -1) return defaults

  const block = css.slice(blockStart, blockEnd)

  // Parse each custom property declaration, handling nested parens for values
  const re = /--([\w-]+)\s*:\s*/g
  let match
  while ((match = re.exec(block))) {
    const name = match[1]
    const valueStart = match.index + match[0].length
    let depth = 0
    let end = block.length
    for (let i = valueStart; i < block.length; i++) {
      if (block[i] === "(") depth++
      else if (block[i] === ")") depth--
      else if (block[i] === ";" && depth === 0) {
        end = i
        break
      }
    }
    const value = block.slice(valueStart, end).trim()
    const ld = splitLightDark(value)
    if (ld) {
      defaults[name] = ld
    } else {
      defaults[name] = { light: value, dark: value }
    }
  }
  return defaults
}

// ---------------------------------------------------------------------------
// Brand derivation
// ---------------------------------------------------------------------------

function fmtNum(n) {
  return parseFloat(n.toFixed(4)).toString()
}

function fmtOklch(l, c, h) {
  return `oklch(${fmtNum(l)} ${fmtNum(c)} ${fmtNum(h)})`
}

/**
 * From a single brand oklch colour, derive primary, primary-foreground,
 * and ring tokens for both light and dark modes.
 *
 * --primary-hover is NOT emitted here because globals.css already defines it
 * as `oklch(from var(--primary) calc(l - 0.05) c h)`, which auto-derives
 * from whatever --primary resolves to.
 */
function deriveBrand(brandStr) {
  const { l, c, h } = parseOklch(brandStr)

  // Dark mode: boost lightness, slightly reduce chroma for legibility
  const darkL = Math.min(l + 0.3, 0.85)
  const darkC = c * 0.85

  // Foreground: pick for contrast against the respective background
  const lightFg = l < 0.6 ? "oklch(0.985 0 0)" : "oklch(0.205 0 0)"
  const darkFg = darkL < 0.6 ? "oklch(0.985 0 0)" : "oklch(0.205 0 0)"

  return {
    primary: `light-dark(${fmtOklch(l, c, h)}, ${fmtOklch(darkL, darkC, h)})`,
    "primary-foreground": `light-dark(${lightFg}, ${darkFg})`,
    ring: `light-dark(${fmtOklch(l, c, h)}, ${fmtOklch(darkL, darkC, h)})`,
  }
}

// ---------------------------------------------------------------------------
// CSS generation
// ---------------------------------------------------------------------------

/**
 * Generate vanillin.css content from a validated config.
 *
 * @param {object} config - Raw config object (will be validated internally).
 * @param {object} opts
 * @param {string} opts.root - Repo root path (for discovering components and
 *   reading globals.css). Defaults to one directory above scripts/.
 * @returns {string} The complete CSS file content.
 * @throws {Error} If validation fails.
 */
export function generate(config, { root } = {}) {
  root = root || resolve(__dirname, "..")

  // Context for validation
  const globalsCss = readFileSync(resolve(root, "styles/globals.css"), "utf-8")
  const colorTokens = parseColorTokens(globalsCss)
  const componentMap = discoverComponents(root)
  const knownComponents = new Set(componentMap.keys())
  const tokenDefaults = extractTokenDefaults(globalsCss)

  // Validate
  const result = validate(config, { colorTokens, knownComponents })
  if (!result.ok) {
    const msg = result.errors.map((e) => `  - ${e}`).join("\n")
    throw new Error(`Config validation failed:\n${msg}`)
  }

  const cfg = result.config
  const sections = []

  // Header
  sections.push(`/* Generated by vanillin v${VERSION} -- do not edit by hand. */`)

  // Collect :root overrides (sorted for determinism)
  const rootProps = new Map()

  if (cfg.theme) {
    // Brand derivation (applied first; literal overrides win by overwriting)
    if (cfg.theme.brand) {
      const derived = deriveBrand(cfg.theme.brand)
      for (const [token, value] of Object.entries(derived)) {
        rootProps.set(`--${token}`, value)
      }
    }

    // Radius
    if (cfg.theme.radius) {
      rootProps.set("--radius", cfg.theme.radius)
    }

    // Density
    if (cfg.theme.density !== undefined) {
      rootProps.set("--density-scale", String(cfg.theme.density))
    }

    // Motion
    if (cfg.theme.motion) {
      if (cfg.theme.motion.scale !== undefined) {
        rootProps.set("--motion-scale", String(cfg.theme.motion.scale))
      }
      if (cfg.theme.motion.ease) {
        rootProps.set("--motion-ease", cfg.theme.motion.ease)
      }
    }

    // Font
    if (cfg.theme.font) {
      if (cfg.theme.font.sans) rootProps.set("--font-sans", cfg.theme.font.sans)
      if (cfg.theme.font.mono) rootProps.set("--font-mono", cfg.theme.font.mono)
    }

    // Light/dark overrides -- literal wins over derivation.
    // For each overridden token, we need both mode values to emit light-dark().
    // If only one mode is specified, the other comes from globals.css defaults.
    const lightOverrides = cfg.theme.light || {}
    const darkOverrides = cfg.theme.dark || {}
    const allOverriddenTokens = new Set([
      ...Object.keys(lightOverrides),
      ...Object.keys(darkOverrides),
    ])

    for (const token of [...allOverriddenTokens].sort()) {
      const hasLight = token in lightOverrides
      const hasDark = token in darkOverrides

      let lightVal, darkVal
      if (hasLight && hasDark) {
        lightVal = lightOverrides[token]
        darkVal = darkOverrides[token]
      } else {
        // Fill the missing mode from globals.css defaults
        const defaults = tokenDefaults[token]
        if (hasLight) {
          lightVal = lightOverrides[token]
          darkVal = defaults ? defaults.dark : lightOverrides[token]
        } else {
          lightVal = defaults ? defaults.light : darkOverrides[token]
          darkVal = darkOverrides[token]
        }
      }
      rootProps.set(`--${token}`, `light-dark(${lightVal}, ${darkVal})`)
    }
  }

  // Emit :root block
  if (rootProps.size > 0) {
    const lines = []
    lines.push("")
    lines.push(":root {")
    for (const [prop, value] of [...rootProps.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
      lines.push(`  ${prop}: ${value};`)
    }
    lines.push("}")
    sections.push(lines.join("\n"))
  }

  // Component sections (sorted by slug for determinism)
  if (cfg.components) {
    for (const slug of Object.keys(cfg.components).sort()) {
      const comp = cfg.components[slug]
      const blockClass = componentMap.get(slug) || slug
      const compLines = []

      // Base token overrides
      if (comp.tokens && Object.keys(comp.tokens).length > 0) {
        compLines.push("")
        compLines.push(`.${blockClass} {`)
        for (const [prop, val] of Object.entries(comp.tokens).sort((a, b) => a[0].localeCompare(b[0]))) {
          compLines.push(`  ${prop}: ${val};`)
        }
        compLines.push("}")
      }

      // Variants (sorted by variant name)
      if (comp.variants) {
        for (const name of Object.keys(comp.variants).sort()) {
          const props = comp.variants[name]
          if (Object.keys(props).length === 0) continue
          compLines.push("")
          compLines.push(`.${blockClass}--${name} {`)
          for (const [prop, val] of Object.entries(props).sort((a, b) => a[0].localeCompare(b[0]))) {
            compLines.push(`  ${prop}: ${val};`)
          }
          compLines.push("}")
        }
      }

      // Sizes (sorted by size name)
      if (comp.sizes) {
        for (const name of Object.keys(comp.sizes).sort()) {
          const props = comp.sizes[name]
          if (Object.keys(props).length === 0) continue
          compLines.push("")
          compLines.push(`.${blockClass}--${name} {`)
          for (const [prop, val] of Object.entries(props).sort((a, b) => a[0].localeCompare(b[0]))) {
            compLines.push(`  ${prop}: ${val};`)
          }
          compLines.push("}")
        }
      }

      if (compLines.length > 0) {
        sections.push(compLines.join("\n"))
      }
    }
  }

  return sections.join("\n") + "\n"
}

// ---------------------------------------------------------------------------
// CLI entry point
// ---------------------------------------------------------------------------

function main() {
  const root = resolve(__dirname, "..")
  const configPath = resolve(root, "vanillin.config.json")

  let raw
  try {
    raw = readFileSync(configPath, "utf-8")
  } catch (err) {
    if (err.code === "ENOENT") {
      console.error(`No config file found at ${configPath}`)
      console.error("Create vanillin.config.json or run with --help.")
      process.exit(1)
    }
    throw err
  }

  let config
  try {
    config = JSON.parse(raw)
  } catch (err) {
    console.error(`Invalid JSON in ${configPath}: ${err.message}`)
    process.exit(1)
  }

  let css
  try {
    css = generate(config, { root })
  } catch (err) {
    console.error(err.message)
    process.exit(1)
  }

  const outPath = resolve(root, "styles/vanillin.css")
  writeFileSync(outPath, css)
  console.log(`vanillin.css written (${css.length} bytes)`)
}

// Run when invoked directly (not imported)
const isMain = process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))
if (isMain) {
  main()
}
