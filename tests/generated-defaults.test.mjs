/**
 * The kit's own theme is generator output.
 *
 * Runs in the browser test runner (Playwright) so it can check the cascade in
 * a real document, but most of it is node-side: the split between generated
 * token values and hand-written machinery is a property of the two files.
 */

import { readFileSync } from "node:fs"
import { resolve } from "node:path"

/** Token names declared in every :root block of a stylesheet. */
function rootTokens(extract, css) {
  return new Set(Object.keys(extract(css)))
}

export default async function ({ page, baseUrl, repoRoot, test, eq }) {
  const { buildDefaults, extractTokenDefaults, DEFAULTS_OUTPUT } = await import(
    resolve(repoRoot, "scripts/build-theme.mjs")
  )
  const { parseColorTokens } = await import(resolve(repoRoot, "scripts/config-schema.mjs"))

  const read = (rel) => readFileSync(resolve(repoRoot, rel), "utf-8")
  const defaultsCss = read(DEFAULTS_OUTPUT)
  const globalsCss = read("styles/globals.css")
  const snapshot = JSON.parse(read("tests/token-snapshot-before.json"))

  // -------------------------------------------------------------------------
  // The committed output is what the generator produces
  // -------------------------------------------------------------------------

  await test("committed defaults.css is byte-identical to a fresh build", async () => {
    eq(buildDefaults({ root: repoRoot }), defaultsCss, "run `npm run theme:defaults` and commit")
  })

  // -------------------------------------------------------------------------
  // Byte-identity with the pre-task-60 :root
  // -------------------------------------------------------------------------

  await test("every generated token reproduces its pre-task-60 value", async () => {
    const generated = extractTokenDefaults(defaultsCss)
    // The snapshot was taken in the docs site, whose own :root re-declares a
    // few tokens (slower demo motion). Those say nothing about the kit's
    // defaults.
    const siteOverrides = extractTokenDefaults(read("site/site.css"))
    // The snapshot holds the computed values of the hand-written :root as it
    // stood before the split. light-dark() collapses to one side per mode, so
    // each generated pair is checked against the matching snapshot mode.
    for (const [name, { light, dark }] of Object.entries(generated)) {
      const key = `--${name}`
      if (!(key in snapshot.light) || name in siteOverrides) continue
      // A value referencing another token computes to the substituted result,
      // so it cannot be string-compared here. tokens.test.mjs checks those
      // through a real CSS property in the browser.
      if (light.includes("var(") || dark.includes("var(")) continue
      eq(light, snapshot.light[key], `light ${key}`)
      eq(dark, snapshot.dark[key], `dark ${key}`)
    }
  })

  await test("no colour token was dropped in the split", async () => {
    const generated = extractTokenDefaults(defaultsCss)
    // Hover tokens are machinery: relative-colour derivations off the base
    // families, so they follow any brand rather than being generated.
    const derived = new Set(
      ["primary", "secondary", "accent", "destructive", "muted"].map((k) => `${k}-hover`),
    )
    for (const token of parseColorTokens(globalsCss)) {
      if (derived.has(token)) continue
      eq(token in generated, true, `--${token} has no generated value`)
    }
  })

  // -------------------------------------------------------------------------
  // Exactly one source per token
  // -------------------------------------------------------------------------

  await test("generated values and hand-written machinery are disjoint", async () => {
    const values = rootTokens(extractTokenDefaults, defaultsCss)
    const machinery = rootTokens(extractTokenDefaults, globalsCss)
    const both = [...values].filter((t) => machinery.has(t))
    eq(both.join(", "), "", "declared in both defaults.css and globals.css")
  })

  // -------------------------------------------------------------------------
  // A non-default config moves values, never machinery
  // -------------------------------------------------------------------------

  await test("a non-default config changes tokens without touching machinery", async () => {
    const { generate } = await import(resolve(repoRoot, "scripts/build-theme.mjs"))
    // No light/dark literals: those take precedence over brand derivation,
    // which is what van.defaults.json uses to pin the kit's own greyscale.
    const retheme = {
      theme: { brand: "oklch(0.55 0.2 265)", radius: "1rem", density: "spacious" },
    }
    const css = generate(retheme, { root: repoRoot })
    const tokens = extractTokenDefaults(css)

    eq(tokens.primary.light, "oklch(0.55 0.2 265)", "brand did not reach --primary")
    eq(tokens.radius.light, "1rem", "radius did not change")
    eq(tokens["density-scale"].light, "1.25", "density preset did not resolve")

    // Machinery must never appear in generator output: the ramps and hover
    // derivations exist so that changing a root value is enough.
    const MACHINERY = [
      "radius-sm", "radius-md", "radius-lg", "radius-xl",
      "shadow-sm", "shadow-md", "shadow-lg",
      "motion-fast", "motion-medium",
      "primary-hover", "secondary-hover", "accent-hover", "destructive-hover", "muted-hover",
      "space-1", "space-2", "space-4", "space-8",
    ]
    for (const token of MACHINERY) {
      eq(token in tokens, false, `--${token} is machinery but was generated`)
    }
  })

  // -------------------------------------------------------------------------
  // The regression the old double-:root caused: it only shows at the root
  // -------------------------------------------------------------------------

  await test("data-density on <html> still overrides the generated scale", async () => {
    await page.goto(baseUrl)
    const measure = (mode) =>
      page.evaluate((m) => {
        const html = document.documentElement
        if (m) html.setAttribute("data-density", m)
        else html.removeAttribute("data-density")
        const probe = document.createElement("div")
        probe.style.width = "var(--space-4)"
        document.body.appendChild(probe)
        const width = getComputedStyle(probe).width
        probe.remove()
        return width
      }, mode)

    const comfortable = await measure("comfortable")
    const compact = await measure("compact")
    const spacious = await measure("spacious")
    await measure(null)

    eq(compact !== comfortable, true, `compact ${compact} vs comfortable ${comfortable}`)
    eq(spacious !== comfortable, true, `spacious ${spacious} vs comfortable ${comfortable}`)
    eq(parseFloat(compact) < parseFloat(spacious), true, `${compact} should be under ${spacious}`)
  })
}
