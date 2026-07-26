/**
 * Vanillin config schema and validator.
 *
 * Validates van.config.json structure, rejects CSS injection vectors,
 * clamps numeric ranges, expands property shorthands, and enforces
 * derivation-vs-literal precedence.
 *
 * Pure module -- no filesystem I/O. Context-aware checks (known tokens,
 * known components) are passed in via the options object.
 */

// ---------------------------------------------------------------------------
// CSS injection guard
// ---------------------------------------------------------------------------

const UNSAFE_VALUE = /[;{}<@]|\/\*|\*\//
const UNSAFE_URL = /url\s*\(/i

/** Reject values that could break out of a CSS declaration. */
export function isSafeCSSValue(v) {
  return typeof v === "string" && !UNSAFE_VALUE.test(v) && !UNSAFE_URL.test(v)
}

function isCSSPropertyName(name) {
  return typeof name === "string" && /^[a-z][a-z0-9-]*$/.test(name)
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const DENSITY_PRESETS = { compact: 0.875, comfortable: 1, spacious: 1.25 }
export const DENSITY_RANGE = [0.75, 1.5]
export const MOTION_SCALE_RANGE = [0, 3]

const THEME_KEYS = new Set(["brand", "radius", "density", "motion", "font", "light", "dark"])
/** Keys allowed in the object form of theme.brand. */
export const BRAND_KEYS = new Set(["primary", "secondary", "accent", "neutral"])
const MOTION_KEYS = new Set(["scale", "ease"])
const FONT_KEYS = new Set(["sans", "mono"])
const COMPONENT_SECTION_KEYS = new Set(["tokens", "variants", "sizes"])

/** Shorthand token names -> CSS property names. */
const PROPERTY_SHORTHANDS = {
  bg: "background-color",
  fg: "color",
  radius: "border-radius",
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Parse a simple oklch() colour string.
 * Accepts only the three-argument form: oklch(L C H).
 * Returns { l, c, h } or null.
 */
export function parseOklch(str) {
  if (typeof str !== "string") return null
  const m = str.trim().match(/^oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*\)$/)
  if (!m) return null
  return { l: +m[1], c: +m[2], h: +m[3] }
}

/**
 * Extract all @property declarations with syntax: "<color>" from a CSS string.
 * Returns a Set of token names (without the -- prefix).
 */
export function parseColorTokens(css) {
  const tokens = new Set()
  for (const m of css.matchAll(/@property\s+--([\w-]+)\s*\{[^}]*syntax:\s*"<color>"[^}]*\}/g)) {
    tokens.add(m[1])
  }
  return tokens
}

/** Expand a property shorthand (bg -> background-color), or pass through. */
export function expandProperty(name) {
  return PROPERTY_SHORTHANDS[name] || name
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value))
}

function isPlainObject(v) {
  return v !== null && typeof v === "object" && !Array.isArray(v)
}

// ---------------------------------------------------------------------------
// Property-map validation (shared by tokens, variants, sizes)
// ---------------------------------------------------------------------------

function validatePropertyMap(map, path, errors) {
  const out = {}
  for (const [prop, val] of Object.entries(map)) {
    const expanded = expandProperty(prop)
    if (!isCSSPropertyName(expanded)) {
      errors.push(`${path}: invalid CSS property "${prop}"`)
    } else if (typeof val !== "string") {
      errors.push(`${path}.${prop} must be a string`)
    } else if (!isSafeCSSValue(val)) {
      errors.push(`${path}.${prop} contains unsafe characters`)
    } else {
      out[expanded] = val
    }
  }
  return out
}

/** Validate one brand colour value; returns it, or undefined after pushing an error. */
function validateBrandColor(value, path, errors) {
  if (typeof value !== "string") {
    errors.push(`${path} must be a string`)
  } else if (!parseOklch(value)) {
    errors.push(`${path} must be a simple oklch() colour, e.g. "oklch(0.55 0.2 265)"`)
  } else if (!isSafeCSSValue(value)) {
    errors.push(`${path} contains unsafe characters`)
  } else {
    return value
  }
  return undefined
}

// ---------------------------------------------------------------------------
// Main validator
// ---------------------------------------------------------------------------

/**
 * Validate a parsed config object.
 *
 * Options:
 *   colorTokens  - Set<string> of known global colour-token names (from
 *                  globals.css @property declarations). When provided,
 *                  theme.light / theme.dark keys are validated against it.
 *   knownComponents - Set<string> of valid component slugs (from the ui/
 *                     directory). When provided, unknown slugs are errors.
 *
 * Returns { ok: boolean, errors: string[], config: object }.
 * The returned config is the normalised form (shorthands expanded, density
 * presets resolved to numbers, ranges clamped).
 */
export function validate(config, { colorTokens, knownComponents } = {}) {
  const errors = []
  const out = {}

  if (!isPlainObject(config)) {
    return { ok: false, errors: ["config must be a plain object"], config: {} }
  }

  // Unknown top-level keys
  for (const k of Object.keys(config)) {
    if (k !== "theme" && k !== "components") {
      errors.push(`unknown top-level key "${k}"`)
    }
  }

  // --- theme ---------------------------------------------------------------
  if (config.theme !== undefined) {
    if (!isPlainObject(config.theme)) {
      errors.push("theme must be an object")
    } else {
      const t = config.theme
      out.theme = {}

      for (const k of Object.keys(t)) {
        if (!THEME_KEYS.has(k)) errors.push(`unknown theme key "${k}"`)
      }

      // brand: a single oklch string (sugar for { primary }) or an object
      // keyed by BRAND_KEYS. Every value runs the same oklch + safety path.
      if (t.brand !== undefined) {
        if (typeof t.brand === "string") {
          const v = validateBrandColor(t.brand, "theme.brand", errors)
          if (v !== undefined) out.theme.brand = v
        } else if (isPlainObject(t.brand)) {
          const keys = Object.keys(t.brand)
          if (keys.length === 0) {
            errors.push("theme.brand object must set at least one key")
          }
          const brand = {}
          for (const k of keys) {
            if (!BRAND_KEYS.has(k)) {
              errors.push(`theme.brand: unknown key "${k}", expected: ${[...BRAND_KEYS].join(", ")}`)
              continue
            }
            const v = validateBrandColor(t.brand[k], `theme.brand.${k}`, errors)
            if (v !== undefined) brand[k] = v
          }
          out.theme.brand = brand
        } else {
          errors.push("theme.brand must be a string or an object")
        }
      }

      // radius
      if (t.radius !== undefined) {
        if (typeof t.radius !== "string") {
          errors.push("theme.radius must be a string")
        } else if (!isSafeCSSValue(t.radius)) {
          errors.push("theme.radius contains unsafe characters")
        } else {
          out.theme.radius = t.radius
        }
      }

      // density
      if (t.density !== undefined) {
        if (typeof t.density === "string") {
          if (!(t.density in DENSITY_PRESETS)) {
            errors.push(
              `theme.density: unknown preset "${t.density}", expected: ${Object.keys(DENSITY_PRESETS).join(", ")}`,
            )
          } else {
            out.theme.density = DENSITY_PRESETS[t.density]
          }
        } else if (typeof t.density === "number") {
          out.theme.density = clamp(t.density, ...DENSITY_RANGE)
        } else {
          errors.push("theme.density must be a preset name or a number")
        }
      }

      // motion
      if (t.motion !== undefined) {
        if (!isPlainObject(t.motion)) {
          errors.push("theme.motion must be an object")
        } else {
          out.theme.motion = {}
          for (const k of Object.keys(t.motion)) {
            if (!MOTION_KEYS.has(k)) errors.push(`unknown motion key "${k}"`)
          }
          if (t.motion.scale !== undefined) {
            if (typeof t.motion.scale !== "number") {
              errors.push("theme.motion.scale must be a number")
            } else {
              out.theme.motion.scale = clamp(t.motion.scale, ...MOTION_SCALE_RANGE)
            }
          }
          if (t.motion.ease !== undefined) {
            if (typeof t.motion.ease !== "string") {
              errors.push("theme.motion.ease must be a string")
            } else if (!isSafeCSSValue(t.motion.ease)) {
              errors.push("theme.motion.ease contains unsafe characters")
            } else {
              out.theme.motion.ease = t.motion.ease
            }
          }
        }
      }

      // font
      if (t.font !== undefined) {
        if (!isPlainObject(t.font)) {
          errors.push("theme.font must be an object")
        } else {
          out.theme.font = {}
          for (const k of Object.keys(t.font)) {
            if (!FONT_KEYS.has(k)) errors.push(`unknown font key "${k}"`)
          }
          for (const k of ["sans", "mono"]) {
            if (t.font[k] !== undefined) {
              if (typeof t.font[k] !== "string") {
                errors.push(`theme.font.${k} must be a string`)
              } else if (!isSafeCSSValue(t.font[k])) {
                errors.push(`theme.font.${k} contains unsafe characters`)
              } else {
                out.theme.font[k] = t.font[k]
              }
            }
          }
        }
      }

      // light / dark overrides
      for (const mode of ["light", "dark"]) {
        if (t[mode] !== undefined) {
          if (!isPlainObject(t[mode])) {
            errors.push(`theme.${mode} must be an object`)
          } else {
            out.theme[mode] = {}
            for (const [token, value] of Object.entries(t[mode])) {
              if (colorTokens && !colorTokens.has(token)) {
                errors.push(`theme.${mode}: unknown colour token "${token}"`)
              }
              if (typeof value !== "string") {
                errors.push(`theme.${mode}.${token} must be a string`)
              } else if (!isSafeCSSValue(value)) {
                errors.push(`theme.${mode}.${token} contains unsafe characters`)
              } else {
                out.theme[mode][token] = value
              }
            }
          }
        }
      }
    }
  }

  // --- components ----------------------------------------------------------
  if (config.components !== undefined) {
    if (!isPlainObject(config.components)) {
      errors.push("components must be an object")
    } else {
      out.components = {}
      for (const [slug, def] of Object.entries(config.components)) {
        if (knownComponents && !knownComponents.has(slug)) {
          errors.push(`components: unknown component "${slug}"`)
        }
        if (!isPlainObject(def)) {
          errors.push(`components.${slug} must be an object`)
          continue
        }
        out.components[slug] = {}
        for (const k of Object.keys(def)) {
          if (!COMPONENT_SECTION_KEYS.has(k)) {
            errors.push(`components.${slug}: unknown key "${k}"`)
          }
        }

        // tokens (base property overrides)
        if (def.tokens !== undefined) {
          if (!isPlainObject(def.tokens)) {
            errors.push(`components.${slug}.tokens must be an object`)
          } else {
            out.components[slug].tokens = validatePropertyMap(
              def.tokens,
              `components.${slug}.tokens`,
              errors,
            )
          }
        }

        // variants
        if (def.variants !== undefined) {
          if (!isPlainObject(def.variants)) {
            errors.push(`components.${slug}.variants must be an object`)
          } else {
            out.components[slug].variants = {}
            for (const [name, props] of Object.entries(def.variants)) {
              if (!isPlainObject(props)) {
                errors.push(`components.${slug}.variants.${name} must be an object`)
                continue
              }
              out.components[slug].variants[name] = validatePropertyMap(
                props,
                `components.${slug}.variants.${name}`,
                errors,
              )
            }
          }
        }

        // sizes
        if (def.sizes !== undefined) {
          if (!isPlainObject(def.sizes)) {
            errors.push(`components.${slug}.sizes must be an object`)
          } else {
            out.components[slug].sizes = {}
            for (const [name, props] of Object.entries(def.sizes)) {
              if (!isPlainObject(props)) {
                errors.push(`components.${slug}.sizes.${name} must be an object`)
                continue
              }
              out.components[slug].sizes[name] = validatePropertyMap(
                props,
                `components.${slug}.sizes.${name}`,
                errors,
              )
            }
          }
        }
      }
    }
  }

  return { ok: errors.length === 0, errors, config: out }
}
