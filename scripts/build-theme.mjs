#!/usr/bin/env node
/**
 * vanillin theme generator.
 *
 * Two jobs, same code path:
 *
 *  - `--defaults`: van.defaults.json -> styles/defaults.css, the kit's own
 *    token values. globals.css @imports that file, so this is the one
 *    authoritative :root of token values -- there is no hand-written copy to
 *    drift from.
 *  - default: van.config.json -> styles/van.css, a consumer's overrides.
 *    Import it after globals.css:
 *
 *      import "../styles/globals.css"
 *      import "../styles/van.css"
 *
 * The output is deterministic: same config -> byte-identical CSS. Consumers
 * should commit van.css; the generator is a dev-time tool.
 *
 * Interface for the CLI (bin/van.mjs):
 *   - generate(config, { root, uiDir, globals }) -> string  (CSS text)
 *   - buildDefaults({ root })    -> string   (writes styles/defaults.css)
 *   - discoverComponents(root, uiDir) -> Map  (slug -> blockClass)
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

/** The kit's own defaults: config in, generated stylesheet out. */
export const DEFAULTS_CONFIG = "van.defaults.json"
export const DEFAULTS_OUTPUT = "styles/defaults.css"

/** Stylesheets whose :root blocks hold the current token values. */
const TOKEN_SOURCES = [DEFAULTS_OUTPUT, "styles/globals.css"]

/** Concatenate the token-source stylesheets that exist, in cascade order. */
function readTokenSources(root, sources) {
  return sources
    .map((rel) => resolve(root, rel))
    .filter((path) => existsSync(path))
    .map((path) => readFileSync(path, "utf-8"))
    .join("\n")
}

// ---------------------------------------------------------------------------
// Component discovery
// ---------------------------------------------------------------------------

/**
 * Components whose block class is not their directory slug. Mirrors the
 * conformance suite's BLOCK_CLASS_ALLOWLIST (tests/conformance.unit.mjs):
 * every entry names the class a `components.<slug>` override must target and
 * why the slug is not enough on its own.
 */
const BLOCK_CLASS_OVERRIDES = {
  "alert-dialog": {
    blockClass: "alert-dialog",
    reason: "re-exports dialog; the element carries `dialog alert-dialog`, so alert-dialog.css defines no block class of its own",
  },
  breadcrumb: {
    blockClass: "breadcrumb",
    reason: "the JSX renders .breadcrumb; the CSS styles only its .breadcrumb-* subparts",
  },
  button: { blockClass: "btn", reason: "block class is .btn (upstream convention)" },
  "button-group": { blockClass: "btn-group", reason: "block class is .btn-group, matching button's .btn prefix" },
  collapsible: {
    blockClass: "collapsible",
    reason: "the JSX renders .collapsible; the CSS styles .collapsible-content",
  },
  combobox: {
    blockClass: "combobox-input-group",
    reason: "composite; the input group is the visible root, not a bare .combobox",
  },
  "context-menu": {
    blockClass: "context-menu",
    reason: "re-exports dropdown-menu; the element carries both classes and context-menu.css defines no block class",
  },
  "date-picker": {
    blockClass: "date-picker-trigger",
    reason: "CSS-only composition of popover + calendar; the trigger is its only root",
  },
  "form-fields": {
    blockClass: "form-field",
    reason: "composite wrappers; the singular .form-field is the block class",
  },
  resizable: { blockClass: "resizable-group", reason: "composite; the group is the outermost styled part" },
  select: { blockClass: "select-trigger", reason: "composite; the trigger is the visible root (there is no bare .select)" },
}

function stripComments(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, "")
}

/** Does `css` define `.name` as a block class? Same test conformance applies. */
function definesBlockClass(css, name) {
  return new RegExp(`\\.${name.replace(/-/g, "\\-")}(?=[\\s{:,\\[])`).test(css)
}

/**
 * Resolve one component's block class, in precedence order:
 *
 *   1. BLOCK_CLASS_OVERRIDES  — an explicit, reviewed exception.
 *   2. the dir slug           — what conformance already enforces.
 *   3. the first class in the file — a warned fallback only.
 *
 * Rule order inside a component's CSS is cosmetic, so deriving the selector
 * from it means a reordering nobody would flag silently re-points every
 * consumer override: their van.css still compiles and styles nothing.
 */
function resolveBlockClass(slug, css) {
  const stripped = stripComments(css)
  const firstClass = stripped.match(/^\s*\.([\w-]+)\s*[{,]/m)?.[1] ?? null
  const override = BLOCK_CLASS_OVERRIDES[slug]
  if (override) return { blockClass: override.blockClass, source: "allowlist", firstClass }
  if (definesBlockClass(stripped, slug)) return { blockClass: slug, source: "slug", firstClass }
  return { blockClass: firstClass || slug, source: "fallback", firstClass }
}

/** Scan ui/ to a slug -> { blockClass, source, firstClass } map. */
function scanComponents(root, ui = "ui") {
  const uiDir = resolve(root, ui)
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
    map.set(d.name, resolveBlockClass(d.name, readFileSync(cssPath, "utf-8")))
  }
  return map
}

/**
 * Scan ui/ to build a slug -> CSS block-class map.
 * The block class is the dir slug, or the reviewed exception in
 * BLOCK_CLASS_OVERRIDES; see resolveBlockClass for the fallback.
 */
export function discoverComponents(root, ui = "ui") {
  const map = new Map()
  for (const [slug, info] of scanComponents(root, ui)) map.set(slug, info.blockClass)
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
 * Parse every :root block in a CSS string to extract token defaults.
 * Returns { tokenName: { light, dark } } for each custom property.
 *
 * All blocks, not just the first: since task 60 the kit's token values live in
 * the generated styles/defaults.css and globals.css keeps a second :root for
 * machinery. Later declarations win, matching the cascade.
 */
export function extractTokenDefaults(css) {
  const defaults = {}
  for (const m of css.matchAll(/:root\s*\{/g)) {
    collectRootBlock(css, m.index, defaults)
  }
  return defaults
}

/** Parse one :root block starting at `rootIdx`, merging into `defaults`. */
function collectRootBlock(css, rootIdx, defaults) {
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
  if (blockStart === -1 || blockEnd === -1) return

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

// ---------------------------------------------------------------------------
// Contrast measurement (WCAG 2.x)
// ---------------------------------------------------------------------------

const DEG = Math.PI / 180

/**
 * WCAG relative luminance of an oklch colour, gamut-clipped to sRGB.
 * oklch -> OKLab -> LMS -> linear sRGB, then the WCAG luminance weights
 * (which are defined over linear sRGB channels).
 */
export function relativeLuminance({ l, c, h }) {
  const a = c * Math.cos(h * DEG)
  const b = c * Math.sin(h * DEG)
  const lm = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const mm = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const sm = (l - 0.0894841775 * a - 1.291485548 * b) ** 3
  const clip = (v) => Math.min(1, Math.max(0, v))
  const r = clip(4.0767416621 * lm - 3.3077115913 * mm + 0.2309699292 * sm)
  const g = clip(-1.2684380046 * lm + 2.6097574011 * mm - 0.3413193965 * sm)
  const bl = clip(-0.0041960863 * lm - 0.7034186147 * mm + 1.707614701 * sm)
  return 0.2126 * r + 0.7152 * g + 0.0722 * bl
}

/** WCAG contrast ratio between two oklch colours ({l,c,h} or oklch() strings). */
export function contrastRatio(fg, bg) {
  const ya = relativeLuminance(typeof fg === "string" ? parseOklch(fg) : fg)
  const yb = relativeLuminance(typeof bg === "string" ? parseOklch(bg) : bg)
  const [hi, lo] = ya >= yb ? [ya, yb] : [yb, ya]
  return (hi + 0.05) / (lo + 0.05)
}

const FG_CANDIDATES = [
  { l: 0.985, c: 0, h: 0 },
  { l: 0.205, c: 0, h: 0 },
]
const MIN_CONTRAST = 4.5

function bestForeground(bg) {
  let best = null
  for (const fg of FG_CANDIDATES) {
    const ratio = contrastRatio(fg, bg)
    if (!best || ratio > best.ratio) best = { fg, ratio }
  }
  return best
}

/**
 * Pick the foreground candidate with the highest measured contrast against
 * the background; throw if not even the best one reaches 4.5:1.
 */
function pickForeground(bg, label) {
  const best = bestForeground(bg)
  if (best.ratio < MIN_CONTRAST) {
    throw new Error(
      `${label}: no derivable foreground reaches ${MIN_CONTRAST}:1 against ` +
        `${fmtOklch(bg.l, bg.c, bg.h)} (best candidate measures ${best.ratio.toFixed(2)}:1); ` +
        `adjust the colour's lightness away from the middle of the range`,
    )
  }
  return fmtOklch(best.fg.l, best.fg.c, best.fg.h)
}

/**
 * From one brand oklch colour, derive the token and its -foreground for both
 * modes (plus ring for primary).
 *
 * -hover tokens are NOT emitted here because globals.css already defines
 * them as `oklch(from var(--<key>) calc(l - 0.05) c h)`, which auto-derives
 * from whatever the base token resolves to.
 */
function deriveBrandColor(key, colorStr) {
  const { l, c, h } = parseOklch(colorStr)

  // Dark mode: boost lightness, slightly reduce chroma for legibility.
  // The boost is a starting point, not a contract — this colour is derived,
  // not user-specified, so keep raising lightness until a foreground
  // candidate measures 4.5:1 (a mid-lightness start can fail both).
  const dark = { l: Math.min(l + 0.3, 0.85), c: c * 0.85, h }
  while (bestForeground(dark).ratio < MIN_CONTRAST && dark.l < 0.985) {
    dark.l = Math.min(dark.l + 0.01, 0.985)
  }

  // Foreground: measured contrast against the respective background
  const lightFg = pickForeground({ l, c, h }, `theme.brand.${key} (light)`)
  const darkFg = pickForeground(dark, `theme.brand.${key} (dark)`)

  const base = `light-dark(${fmtOklch(l, c, h)}, ${fmtOklch(dark.l, dark.c, dark.h)})`
  const tokens = {
    [key]: base,
    [`${key}-foreground`]: `light-dark(${lightFg}, ${darkFg})`,
  }
  if (key === "primary") tokens.ring = base
  return tokens
}

/**
 * Nudge a foreground's lightness away from the background until the pair
 * measures 4.5:1. Used where the starting point comes from the kit's own
 * lightness ramp rather than user input.
 */
function ensureContrast(fg, bg, label) {
  const out = { ...fg }
  const dir = relativeLuminance(out) >= relativeLuminance(bg) ? 1 : -1
  while (contrastRatio(out, bg) < MIN_CONTRAST) {
    const next = out.l + dir * 0.005
    if (next <= 0 || next >= 1) {
      throw new Error(`${label}: cannot reach ${MIN_CONTRAST}:1 against ${fmtOklch(bg.l, bg.c, bg.h)}`)
    }
    out.l = next
  }
  return out
}

// Tinting caps chroma: the greys must stay greys that lean toward the brand
// hue, and higher chroma pushes the l=0.97 tints out of sRGB gamut.
const NEUTRAL_TINT_CHROMA = 0.03

// The kit's grey ramp from globals.css; neutral keeps these lightness values
// and threads its hue (and capped chroma) through them.
const NEUTRAL_RAMP = {
  secondary: { light: 0.97, dark: 0.269, fgLight: 0.205, fgDark: 0.985 },
  muted: { light: 0.97, dark: 0.269, fgLight: 0.556, fgDark: 0.708 },
  accent: { light: 0.97, dark: 0.269, fgLight: 0.205, fgDark: 0.985 },
}

/**
 * Tint the grey families toward the brand hue. Only hue and (capped) chroma
 * are taken from the neutral colour — its lightness is ignored so the
 * surface hierarchy keeps the kit's ramp. Foregrounds are contrast-corrected
 * (the default muted pair sits just under 4.5:1; tinting is the moment we
 * start deriving it, so it must pass).
 */
function deriveNeutral(colorStr) {
  const { c, h } = parseOklch(colorStr)
  const tc = Math.min(c, NEUTRAL_TINT_CHROMA)
  const tokens = {}
  for (const [key, ramp] of Object.entries(NEUTRAL_RAMP)) {
    const bgLight = { l: ramp.light, c: tc, h }
    const bgDark = { l: ramp.dark, c: tc, h }
    const fgLight = ensureContrast({ l: ramp.fgLight, c: tc, h }, bgLight, `theme.brand.neutral (${key}, light)`)
    const fgDark = ensureContrast({ l: ramp.fgDark, c: tc, h }, bgDark, `theme.brand.neutral (${key}, dark)`)
    tokens[key] = `light-dark(${fmtOklch(bgLight.l, bgLight.c, bgLight.h)}, ${fmtOklch(bgDark.l, bgDark.c, bgDark.h)})`
    tokens[`${key}-foreground`] = `light-dark(${fmtOklch(fgLight.l, fgLight.c, fgLight.h)}, ${fmtOklch(fgDark.l, fgDark.c, fgDark.h)})`
  }
  return tokens
}

/**
 * Derive tokens from theme.brand. A string is sugar for { primary }.
 * neutral runs first so explicit secondary/accent keys overwrite its tints.
 */
function deriveBrand(brand) {
  if (typeof brand === "string") brand = { primary: brand }
  const tokens = {}
  if (brand.neutral) Object.assign(tokens, deriveNeutral(brand.neutral))
  for (const key of ["primary", "secondary", "accent"]) {
    if (brand[key]) Object.assign(tokens, deriveBrandColor(key, brand[key]))
  }
  return tokens
}

// ---------------------------------------------------------------------------
// CSS generation
// ---------------------------------------------------------------------------

/**
 * Generate van.css content from a validated config.
 *
 * @param {object} config - Raw config object (will be validated internally).
 * @param {object} opts
 * @param {string} opts.root - Repo root path (for discovering components and
 *   reading globals.css). Defaults to one directory above scripts/.
 * @param {string[]} opts.tokenSources - CSS files, relative to root, whose
 *   :root blocks supply the current token values. A one-mode override
 *   (theme.light without theme.dark) fills the missing mode from these.
 *   Defaults to the kit's stylesheets. The defaults build passes globals.css
 *   only: reading its own previous output would make the result depend on
 *   what was on disk.
 * @param {string} opts.source - Config filename to name in the header banner.
 * @param {string} opts.uiDir - Component directory, relative to root. A
 *   consumer's tree is `components/ui`, not the kit's `ui`.
 * @param {string} opts.globals - Path to globals.css, relative to root. Its
 *   @property declarations are the known-token list validation runs against,
 *   and its directory is where the default tokenSources are looked for.
 * @returns {string} The complete CSS file content.
 * @throws {Error} If validation fails.
 */
export function generate(config, { root, tokenSources, source, uiDir = "ui", globals = "styles/globals.css" } = {}) {
  root = root || resolve(__dirname, "..")

  // Default token sources sit beside globals.css, wherever the consumer put it.
  if (!tokenSources) {
    const dir = globals.slice(0, globals.lastIndexOf("/") + 1)
    tokenSources = globals === "styles/globals.css" ? TOKEN_SOURCES : [`${dir}defaults.css`, globals]
  }

  // Context for validation
  const globalsCss = readFileSync(resolve(root, globals), "utf-8")
  const colorTokens = parseColorTokens(globalsCss)
  const componentMap = scanComponents(root, uiDir)
  const knownComponents = new Set(componentMap.keys())
  const tokenDefaults = extractTokenDefaults(readTokenSources(root, tokenSources))

  // Validate
  const result = validate(config, { colorTokens, knownComponents })
  if (!result.ok) {
    const msg = result.errors.map((e) => `  - ${e}`).join("\n")
    throw new Error(`Config validation failed:\n${msg}`)
  }

  const cfg = result.config
  const sections = []

  // Header
  const from = source ? ` from ${source}` : ""
  sections.push(`/* Generated by van v${VERSION}${from} -- do not edit by hand. */`)

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

    // Typeset
    if (cfg.theme.typeset) {
      const ts = cfg.theme.typeset
      if (ts.size) rootProps.set("--typeset-size", ts.size)
      if (ts.leading !== undefined) rootProps.set("--typeset-leading", String(ts.leading))
      if (ts.flow) rootProps.set("--typeset-flow", ts.flow)
      if (ts.font) {
        if (ts.font.body) rootProps.set("--typeset-font-body", ts.font.body)
        if (ts.font.heading) rootProps.set("--typeset-font-heading", ts.font.heading)
        if (ts.font.mono) rootProps.set("--typeset-font-mono", ts.font.mono)
      }
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

  // Typeset presets (sorted by name for determinism)
  if (cfg.theme?.typeset?.presets) {
    for (const name of Object.keys(cfg.theme.typeset.presets).sort()) {
      const preset = cfg.theme.typeset.presets[name]
      const props = []
      if (preset.size) props.push(`  --typeset-size: ${preset.size};`)
      if (preset.leading !== undefined) props.push(`  --typeset-leading: ${preset.leading};`)
      if (preset.flow) props.push(`  --typeset-flow: ${preset.flow};`)
      if (props.length > 0) {
        sections.push(`\n.typeset-${name} {\n${props.join("\n")}\n}`)
      }
    }
  }

  // Component sections (sorted by slug for determinism)
  if (cfg.components) {
    for (const slug of Object.keys(cfg.components).sort()) {
      const comp = cfg.components[slug]
      const info = componentMap.get(slug)
      const blockClass = info?.blockClass || slug
      if (info?.source === "fallback") {
        console.warn(
          `warning: ${uiDir}/${slug}/${slug}.css defines no .${slug} block class, so overrides for ` +
            `"${slug}" target .${blockClass} — the first class in the file, which moves when its rules are ` +
            `reordered. Add a .${slug} block class, or add "${slug}" to BLOCK_CLASS_OVERRIDES with a reason.`,
        )
      }
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
// Defaults build
// ---------------------------------------------------------------------------

/**
 * Regenerate styles/defaults.css from van.defaults.json -- the kit's own
 * token values, which globals.css @imports. Called by the vite plugin before
 * anything resolves globals.css, and by `npm run theme:defaults`.
 *
 * Writes only when the content changed, so a dev-server boot does not touch
 * the file's mtime and retrigger its own HMR.
 *
 * @returns {string} The generated CSS.
 */
export function buildDefaults({ root } = {}) {
  root = root || resolve(__dirname, "..")
  const config = JSON.parse(readFileSync(resolve(root, DEFAULTS_CONFIG), "utf-8"))
  const css = generate(config, {
    root,
    // Not DEFAULTS_OUTPUT: reading the previous build would make this one
    // depend on what happened to be on disk.
    tokenSources: ["styles/globals.css"],
    source: DEFAULTS_CONFIG,
  })
  const outPath = resolve(root, DEFAULTS_OUTPUT)
  if (!existsSync(outPath) || readFileSync(outPath, "utf-8") !== css) {
    writeFileSync(outPath, css)
  }
  return css
}

// ---------------------------------------------------------------------------
// CLI entry point
// ---------------------------------------------------------------------------

function main() {
  const root = resolve(__dirname, "..")

  if (process.argv.includes("--defaults")) {
    let css
    try {
      css = buildDefaults({ root })
    } catch (err) {
      console.error(err.message)
      process.exit(1)
    }
    console.log(`${DEFAULTS_OUTPUT} written (${css.length} bytes)`)
    return
  }

  const configPath = resolve(root, "van.config.json")

  let raw
  try {
    raw = readFileSync(configPath, "utf-8")
  } catch (err) {
    if (err.code === "ENOENT") {
      console.error(`No config file found at ${configPath}`)
      console.error("Create van.config.json or run with --help.")
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
    // Same banner as `van build`, so the two paths cannot drift the output.
    css = generate(config, { root, source: "van.config.json" })
  } catch (err) {
    console.error(err.message)
    process.exit(1)
  }

  const outPath = resolve(root, "styles/van.css")
  writeFileSync(outPath, css)
  console.log(`van.css written (${css.length} bytes)`)
}

// Run when invoked directly (not imported)
const isMain = process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))
if (isMain) {
  main()
}
