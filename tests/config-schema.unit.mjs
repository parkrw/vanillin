/**
 * Pure-node tests for config-schema.mjs.
 * Named .unit.mjs so the browser test runner ignores it.
 */

import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { resolve, dirname } from "node:path"
import { fileURLToPath } from "node:url"
import {
  validate,
  isSafeCSSValue,
  parseOklch,
  parseColorTokens,
  expandProperty,
  DENSITY_PRESETS,
  DENSITY_RANGE,
  MOTION_SCALE_RANGE,
  FRAMEWORKS,
  PATH_KEYS,
  PATH_DEFAULTS,
  BRAND_KEYS,
  THEME_KEYS,
  MOTION_KEYS,
  FONT_KEYS,
  COMPONENT_SECTION_KEYS,
} from "../scripts/config-schema.mjs"

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

// Load known colour tokens from globals.css for context-aware tests
const globalsCss = readFileSync(resolve(ROOT, "styles/globals.css"), "utf-8")
const colorTokens = parseColorTokens(globalsCss)

// ---------------------------------------------------------------------------
// isSafeCSSValue
// ---------------------------------------------------------------------------

test("safe: plain value", () => {
  assert.ok(isSafeCSSValue("0.5rem"))
})

test("safe: oklch colour", () => {
  assert.ok(isSafeCSSValue("oklch(0.55 0.2 265)"))
})

test("safe: var() reference", () => {
  assert.ok(isSafeCSSValue("var(--primary)"))
})

test("safe: calc()", () => {
  assert.ok(isSafeCSSValue("calc(100% - 2rem)"))
})

test("safe: color-mix()", () => {
  assert.ok(isSafeCSSValue("color-mix(in oklab, var(--primary) 50%, transparent)"))
})

test("safe: light-dark()", () => {
  assert.ok(isSafeCSSValue("light-dark(oklch(0.55 0.2 265), oklch(0.85 0.17 265))"))
})

test("unsafe: semicolon", () => {
  assert.ok(!isSafeCSSValue("red; background: url(evil)"))
})

test("unsafe: opening brace", () => {
  assert.ok(!isSafeCSSValue("red } .x { color: red"))
})

test("unsafe: closing brace", () => {
  assert.ok(!isSafeCSSValue("red }"))
})

test("unsafe: angle bracket", () => {
  assert.ok(!isSafeCSSValue("<script>"))
})

test("unsafe: at-rule", () => {
  assert.ok(!isSafeCSSValue("@import 'evil.css'"))
})

test("unsafe: comment open", () => {
  assert.ok(!isSafeCSSValue("/* comment"))
})

test("unsafe: comment close", () => {
  assert.ok(!isSafeCSSValue("value */"))
})

test("unsafe: url()", () => {
  assert.ok(!isSafeCSSValue("url(https://evil.com/exfil)"))
})

test("unsafe: url() case-insensitive", () => {
  assert.ok(!isSafeCSSValue("URL(data:text/css,body{})"))
})

test("unsafe: non-string", () => {
  assert.ok(!isSafeCSSValue(42))
})

test("unsafe: null", () => {
  assert.ok(!isSafeCSSValue(null))
})

// ---------------------------------------------------------------------------
// parseOklch
// ---------------------------------------------------------------------------

test("parseOklch: valid", () => {
  const c = parseOklch("oklch(0.55 0.2 265)")
  assert.deepEqual(c, { l: 0.55, c: 0.2, h: 265 })
})

test("parseOklch: with whitespace", () => {
  const c = parseOklch("  oklch( 0.55   0.2   265 )  ")
  assert.deepEqual(c, { l: 0.55, c: 0.2, h: 265 })
})

test("parseOklch: rejects hex", () => {
  assert.equal(parseOklch("#ff0000"), null)
})

test("parseOklch: rejects rgb", () => {
  assert.equal(parseOklch("rgb(255, 0, 0)"), null)
})

test("parseOklch: rejects alpha form", () => {
  assert.equal(parseOklch("oklch(0.55 0.2 265 / 0.5)"), null)
})

test("parseOklch: rejects non-string", () => {
  assert.equal(parseOklch(42), null)
})

// ---------------------------------------------------------------------------
// parseColorTokens
// ---------------------------------------------------------------------------

test("parseColorTokens: finds colour tokens from globals.css", () => {
  assert.ok(colorTokens.has("primary"))
  assert.ok(colorTokens.has("destructive"))
  assert.ok(colorTokens.has("ring"))
  assert.ok(colorTokens.has("primary-hover"))
  assert.ok(colorTokens.has("sidebar-accent-foreground"))
})

test("parseColorTokens: excludes non-colour tokens", () => {
  assert.ok(!colorTokens.has("radius"))
  assert.ok(!colorTokens.has("motion-scale"))
  assert.ok(!colorTokens.has("density-scale"))
})

// ---------------------------------------------------------------------------
// expandProperty
// ---------------------------------------------------------------------------

test("expandProperty: bg -> background-color", () => {
  assert.equal(expandProperty("bg"), "background-color")
})

test("expandProperty: fg -> color", () => {
  assert.equal(expandProperty("fg"), "color")
})

test("expandProperty: radius -> border-radius", () => {
  assert.equal(expandProperty("radius"), "border-radius")
})

test("expandProperty: passthrough CSS property", () => {
  assert.equal(expandProperty("padding-inline"), "padding-inline")
})

// ---------------------------------------------------------------------------
// validate: structure
// ---------------------------------------------------------------------------

test("validate: empty config passes", () => {
  const r = validate({})
  assert.ok(r.ok)
  assert.equal(r.errors.length, 0)
})

test("validate: non-object fails", () => {
  const r = validate("not an object")
  assert.ok(!r.ok)
  assert.ok(r.errors[0].includes("plain object"))
})

test("validate: array fails", () => {
  const r = validate([1, 2, 3])
  assert.ok(!r.ok)
})

test("validate: null fails", () => {
  const r = validate(null)
  assert.ok(!r.ok)
})

test("validate: unknown top-level key errors", () => {
  const r = validate({ bogus: true })
  assert.ok(!r.ok)
  assert.ok(r.errors.some((e) => e.includes('"bogus"')))
})

test("validate: unknown theme key errors", () => {
  const r = validate({ theme: { bogus: true } })
  assert.ok(!r.ok)
  assert.ok(r.errors.some((e) => e.includes('"bogus"')))
})

test("validate: unknown motion key errors", () => {
  const r = validate({ theme: { motion: { bogus: 1 } } })
  assert.ok(!r.ok)
  assert.ok(r.errors.some((e) => e.includes('"bogus"')))
})

test("validate: unknown font key errors", () => {
  const r = validate({ theme: { font: { bogus: "x" } } })
  assert.ok(!r.ok)
  assert.ok(r.errors.some((e) => e.includes('"bogus"')))
})

test("validate: unknown component key errors", () => {
  const r = validate({ components: { button: { bogus: {} } } })
  assert.ok(!r.ok)
  assert.ok(r.errors.some((e) => e.includes('"bogus"')))
})

// ---------------------------------------------------------------------------
// validate: brand
// ---------------------------------------------------------------------------

test("validate: valid brand", () => {
  const r = validate({ theme: { brand: "oklch(0.55 0.2 265)" } })
  assert.ok(r.ok)
  assert.equal(r.config.theme.brand, "oklch(0.55 0.2 265)")
})

test("validate: brand must be oklch", () => {
  const r = validate({ theme: { brand: "#ff0000" } })
  assert.ok(!r.ok)
  assert.ok(r.errors.some((e) => e.includes("oklch()")))
})

test("validate: brand injection", () => {
  const r = validate({ theme: { brand: "oklch(0.55 0.2 265); --evil: red" } })
  assert.ok(!r.ok)
})

test("validate: brand object with all keys", () => {
  const r = validate({
    theme: {
      brand: {
        primary: "oklch(0.55 0.2 265)",
        secondary: "oklch(0.65 0.14 190)",
        accent: "oklch(0.7 0.15 320)",
        neutral: "oklch(0.55 0.01 265)",
      },
    },
  })
  assert.ok(r.ok)
  assert.equal(r.config.theme.brand.secondary, "oklch(0.65 0.14 190)")
  assert.equal(r.config.theme.brand.neutral, "oklch(0.55 0.01 265)")
})

test("validate: brand object with a subset of keys", () => {
  const r = validate({ theme: { brand: { secondary: "oklch(0.65 0.14 190)" } } })
  assert.ok(r.ok)
  assert.deepEqual(r.config.theme.brand, { secondary: "oklch(0.65 0.14 190)" })
})

test("validate: brand object unknown key errors", () => {
  const r = validate({ theme: { brand: { primary: "oklch(0.55 0.2 265)", tertiary: "oklch(0.6 0.1 100)" } } })
  assert.ok(!r.ok)
  assert.ok(r.errors.some((e) => e.includes('"tertiary"')))
})

test("validate: empty brand object errors", () => {
  const r = validate({ theme: { brand: {} } })
  assert.ok(!r.ok)
  assert.ok(r.errors.some((e) => e.includes("at least one key")))
})

test("validate: brand object key must be oklch", () => {
  const r = validate({ theme: { brand: { secondary: "#00ffcc" } } })
  assert.ok(!r.ok)
  assert.ok(r.errors.some((e) => e.includes("theme.brand.secondary") && e.includes("oklch()")))
})

test("validate: brand object key injection blocked", () => {
  const r = validate({ theme: { brand: { accent: "oklch(0.7 0.15 320); --evil: red" } } })
  assert.ok(!r.ok)
})

test("validate: brand object non-string value errors", () => {
  const r = validate({ theme: { brand: { primary: 42 } } })
  assert.ok(!r.ok)
  assert.ok(r.errors.some((e) => e.includes("theme.brand.primary must be a string")))
})

test("validate: brand neither string nor object errors", () => {
  const r = validate({ theme: { brand: 42 } })
  assert.ok(!r.ok)
  assert.ok(r.errors.some((e) => e.includes("string or an object")))
})

// ---------------------------------------------------------------------------
// validate: density
// ---------------------------------------------------------------------------

test("validate: density preset", () => {
  const r = validate({ theme: { density: "compact" } })
  assert.ok(r.ok)
  assert.equal(r.config.theme.density, DENSITY_PRESETS.compact)
})

test("validate: density number", () => {
  const r = validate({ theme: { density: 0.9 } })
  assert.ok(r.ok)
  assert.equal(r.config.theme.density, 0.9)
})

test("validate: density clamps low", () => {
  const r = validate({ theme: { density: 0.1 } })
  assert.ok(r.ok)
  assert.equal(r.config.theme.density, 0.75)
})

test("validate: density clamps high", () => {
  const r = validate({ theme: { density: 5 } })
  assert.ok(r.ok)
  assert.equal(r.config.theme.density, 1.5)
})

test("validate: density unknown preset errors", () => {
  const r = validate({ theme: { density: "tiny" } })
  assert.ok(!r.ok)
  assert.ok(r.errors.some((e) => e.includes('"tiny"')))
})

// ---------------------------------------------------------------------------
// validate: motion
// ---------------------------------------------------------------------------

test("validate: motion scale", () => {
  const r = validate({ theme: { motion: { scale: 1.5 } } })
  assert.ok(r.ok)
  assert.equal(r.config.theme.motion.scale, 1.5)
})

test("validate: motion scale clamps to 0", () => {
  const r = validate({ theme: { motion: { scale: -1 } } })
  assert.ok(r.ok)
  assert.equal(r.config.theme.motion.scale, 0)
})

test("validate: motion scale clamps to 3", () => {
  const r = validate({ theme: { motion: { scale: 10 } } })
  assert.ok(r.ok)
  assert.equal(r.config.theme.motion.scale, 3)
})

test("validate: motion ease", () => {
  const r = validate({ theme: { motion: { ease: "cubic-bezier(0.22, 1, 0.36, 1)" } } })
  assert.ok(r.ok)
  assert.equal(r.config.theme.motion.ease, "cubic-bezier(0.22, 1, 0.36, 1)")
})

// ---------------------------------------------------------------------------
// validate: light/dark overrides
// ---------------------------------------------------------------------------

test("validate: known colour token passes", () => {
  const r = validate({ theme: { light: { primary: "oklch(0.5 0.2 260)" } } }, { colorTokens })
  assert.ok(r.ok)
})

test("validate: unknown colour token errors", () => {
  const r = validate({ theme: { light: { bogus: "red" } } }, { colorTokens })
  assert.ok(!r.ok)
  assert.ok(r.errors.some((e) => e.includes('"bogus"')))
})

test("validate: colour token injection blocked", () => {
  const r = validate({ theme: { dark: { primary: "red; --x: evil" } } }, { colorTokens })
  assert.ok(!r.ok)
  assert.ok(r.errors.some((e) => e.includes("unsafe")))
})

// ---------------------------------------------------------------------------
// validate: components
// ---------------------------------------------------------------------------

test("validate: component unknown slug errors when knownComponents set", () => {
  const known = new Set(["button", "badge"])
  const r = validate({ components: { nonexistent: { tokens: {} } } }, { knownComponents: known })
  assert.ok(!r.ok)
  assert.ok(r.errors.some((e) => e.includes('"nonexistent"')))
})

test("validate: component slug allowed when knownComponents not set", () => {
  const r = validate({ components: { anything: { tokens: {} } } })
  assert.ok(r.ok)
})

test("validate: component tokens expand shorthands", () => {
  const r = validate({ components: { button: { tokens: { bg: "red" } } } })
  assert.ok(r.ok)
  assert.ok("background-color" in r.config.components.button.tokens)
  assert.ok(!("bg" in r.config.components.button.tokens))
})

test("validate: component variant property expansion", () => {
  const r = validate({
    components: { button: { variants: { x: { fg: "white", radius: "8px" } } } },
  })
  assert.ok(r.ok)
  const v = r.config.components.button.variants.x
  assert.equal(v.color, "white")
  assert.equal(v["border-radius"], "8px")
})

test("validate: component size property expansion", () => {
  const r = validate({
    components: { button: { sizes: { xs: { "padding-inline": "0.5rem" } } } },
  })
  assert.ok(r.ok)
  assert.equal(r.config.components.button.sizes.xs["padding-inline"], "0.5rem")
})

test("validate: component token injection blocked", () => {
  const r = validate({
    components: { button: { tokens: { bg: "red; --evil: 1" } } },
  })
  assert.ok(!r.ok)
  assert.ok(r.errors.some((e) => e.includes("unsafe")))
})

test("validate: component variant injection blocked", () => {
  const r = validate({
    components: { button: { variants: { x: { bg: "url(https://evil.com)" } } } },
  })
  assert.ok(!r.ok)
  assert.ok(r.errors.some((e) => e.includes("unsafe")))
})

test("validate: invalid CSS property name errors", () => {
  const r = validate({
    components: { button: { tokens: { "123invalid": "red" } } },
  })
  assert.ok(!r.ok)
  assert.ok(r.errors.some((e) => e.includes("invalid CSS property")))
})

// ---------------------------------------------------------------------------
// validate: derivation-vs-literal precedence
// ---------------------------------------------------------------------------

test("validate: both brand and light.primary pass (generator handles precedence)", () => {
  const r = validate(
    {
      theme: {
        brand: "oklch(0.55 0.2 265)",
        light: { primary: "oklch(0.4 0.1 200)" },
      },
    },
    { colorTokens },
  )
  assert.ok(r.ok)
  // Both are present in normalised config -- generator applies literals last
  assert.ok(r.config.theme.brand)
  assert.ok(r.config.theme.light.primary)
})

// ---------------------------------------------------------------------------
// paths
// ---------------------------------------------------------------------------

test("validate: paths accepts project-relative dirs and strips trailing slash", () => {
  const r = validate({ paths: { ui: "components/ui/", lib: "components/lib", css: "app/van.css" } })
  assert.ok(r.ok, r.errors.join("; "))
  assert.equal(r.config.paths.ui, "components/ui")
  assert.equal(r.config.paths.css, "app/van.css")
})

test("validate: paths rejects escapes, absolutes and unknown keys", () => {
  for (const value of ["../outside", "/etc", "C:\\win", "", "a\\b"]) {
    const r = validate({ paths: { ui: value } })
    assert.ok(!r.ok, `accepted paths.ui = ${JSON.stringify(value)}`)
    assert.ok(r.errors.some((e) => e.startsWith("paths.ui")), r.errors.join("; "))
  }
  const unknown = validate({ paths: { bogus: "x" } })
  assert.ok(!unknown.ok)
  assert.ok(unknown.errors.some((e) => e.includes('"bogus"')))
})

test("validate: framework and rsc", () => {
  const ok = validate({ framework: "next-app", rsc: true })
  assert.ok(ok.ok, ok.errors.join("; "))
  assert.equal(ok.config.framework, "next-app")
  assert.equal(ok.config.rsc, true)

  const bad = validate({ framework: "sveltekit", rsc: "yes" })
  assert.ok(!bad.ok)
  assert.ok(bad.errors.some((e) => e.startsWith("framework:")))
  assert.ok(bad.errors.some((e) => e.startsWith("rsc")))
})

// ---------------------------------------------------------------------------
// validate: $schema passthrough
// ---------------------------------------------------------------------------

test("validate: $schema key accepted without error", () => {
  const r = validate({ $schema: "./van.schema.json" })
  assert.ok(r.ok, r.errors.join("; "))
})

test("validate: $schema with other keys accepted", () => {
  const r = validate({ $schema: "./van.schema.json", framework: "vite", rsc: false })
  assert.ok(r.ok, r.errors.join("; "))
})

// ---------------------------------------------------------------------------
// van.schema.json — structural round-trip against config-schema.mjs constants
// ---------------------------------------------------------------------------

const schema = JSON.parse(readFileSync(resolve(ROOT, "van.schema.json"), "utf-8"))

test("schema: top-level is object with additionalProperties false", () => {
  assert.equal(schema.type, "object")
  assert.equal(schema.additionalProperties, false)
})

test("schema: framework enum matches FRAMEWORKS", () => {
  const enumValues = schema.properties.framework.enum
  assert.deepEqual(new Set(enumValues), FRAMEWORKS)
})

test("schema: rsc is boolean", () => {
  assert.equal(schema.properties.rsc.type, "boolean")
})

test("schema: paths properties match PATH_KEYS with correct defaults", () => {
  const pathProps = schema.properties.paths.properties
  assert.deepEqual(new Set(Object.keys(pathProps)), PATH_KEYS)
  for (const [k, v] of Object.entries(PATH_DEFAULTS)) {
    assert.equal(pathProps[k].default, v, `paths.${k} default`)
  }
})

test("schema: density accepts preset strings and number range", () => {
  const density = schema.properties.theme.properties.density
  assert.equal(density.oneOf.length, 2)
  const strOption = density.oneOf.find((o) => o.type === "string")
  const numOption = density.oneOf.find((o) => o.type === "number")
  assert.deepEqual(new Set(strOption.enum), new Set(Object.keys(DENSITY_PRESETS)))
  assert.equal(numOption.minimum, DENSITY_RANGE[0])
  assert.equal(numOption.maximum, DENSITY_RANGE[1])
})

test("schema: motion.scale range matches MOTION_SCALE_RANGE", () => {
  const scale = schema.properties.theme.properties.motion.properties.scale
  assert.equal(scale.minimum, MOTION_SCALE_RANGE[0])
  assert.equal(scale.maximum, MOTION_SCALE_RANGE[1])
})

test("schema: brand oneOf covers string and object with BRAND_KEYS", () => {
  const brand = schema.properties.theme.properties.brand
  assert.equal(brand.oneOf.length, 2)
  const objOption = brand.oneOf.find((o) => o.type === "object")
  assert.deepEqual(new Set(Object.keys(objOption.properties)), BRAND_KEYS)
})

test("schema: theme properties match THEME_KEYS", () => {
  assert.deepEqual(new Set(Object.keys(schema.properties.theme.properties)), THEME_KEYS)
})

test("schema: motion properties match MOTION_KEYS", () => {
  assert.deepEqual(
    new Set(Object.keys(schema.properties.theme.properties.motion.properties)),
    MOTION_KEYS,
  )
})

test("schema: font properties match FONT_KEYS", () => {
  assert.deepEqual(
    new Set(Object.keys(schema.properties.theme.properties.font.properties)),
    FONT_KEYS,
  )
})

test("schema: component sections match COMPONENT_SECTION_KEYS", () => {
  const compDef = schema.properties.components.additionalProperties
  assert.deepEqual(new Set(Object.keys(compDef.properties)), COMPONENT_SECTION_KEYS)
})

test("schema: kit van.config.json has $schema pointing at van.schema.json", () => {
  const kitConfig = JSON.parse(readFileSync(resolve(ROOT, "van.config.json"), "utf-8"))
  assert.equal(kitConfig.$schema, "./van.schema.json")
})

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

console.log(`\nconfig-schema: ${passed}/${passed + failed} passed`)
if (failed) process.exit(1)
