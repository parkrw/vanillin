import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"

const snapshotPath = fileURLToPath(
  new URL("./token-snapshot-before.json", import.meta.url)
)
const snapshot = JSON.parse(readFileSync(snapshotPath, "utf8"))

/*
 * Tokens whose computed-value representation changes under @property
 * registration (e.g. oklch alpha 10% → 0.1, rem → px, color-mix → resolved).
 * We normalise both snapshot and live values through the same CSS property
 * so the comparison tests visual equivalence, not string identity.
 */
const LENGTH_TOKENS = new Set([
  "--radius", "--radius-sm", "--radius-md", "--radius-lg", "--radius-xl",
])
const SKIP_TOKENS = new Set([
  // Playground-only tokens — not part of globals.css
  "--pg-accent",
])

/** Tokens that are not colours or lengths — compare as raw strings. */
const STRING_TOKENS = new Set([
  "--font-sans", "--font-mono",
  "--shadow-sm", "--shadow-md", "--shadow-lg",
  "--motion-ease", "--motion-fast", "--motion-medium",
  "--motion-scale",
])

export default async function run({ page, baseUrl, test, eq }) {
  await page.goto(baseUrl)

  /* ------------------------------------------------------------------ */
  /* Helper: normalise a value through a real CSS property               */
  /* ------------------------------------------------------------------ */
  async function normaliseColor(value) {
    return page.evaluate((v) => {
      const el = document.createElement("div")
      el.style.color = v
      document.body.appendChild(el)
      const result = getComputedStyle(el).color
      el.remove()
      return result
    }, value)
  }

  async function normaliseLength(value) {
    return page.evaluate((v) => {
      const el = document.createElement("div")
      el.style.width = v
      document.body.appendChild(el)
      const result = getComputedStyle(el).width
      el.remove()
      return result
    }, value)
  }

  /* ------------------------------------------------------------------ */
  /* Gather the set of tokens defined in the before-snapshot             */
  /* ------------------------------------------------------------------ */
  const tokenNames = Object.keys(snapshot.light).filter(
    (n) => !SKIP_TOKENS.has(n)
  )

  /* ------------------------------------------------------------------ */
  /* 1. Non-breaking: light-mode computed values match the snapshot       */
  /* ------------------------------------------------------------------ */
  await test("light-mode tokens match the before-snapshot", async () => {
    // Ensure we are in light mode
    await page.evaluate(() =>
      document.documentElement.classList.remove("dark")
    )
    await page.waitForTimeout(50)

    const results = await page.evaluate((names) => {
      const style = getComputedStyle(document.documentElement)
      const out = {}
      for (const name of names) {
        out[name] = style.getPropertyValue(name).trim()
      }
      return out
    }, tokenNames)

    for (const name of tokenNames) {
      const live = results[name]
      const expected = snapshot.light[name]

      if (STRING_TOKENS.has(name)) {
        eq(live, expected, `light ${name}`)
      } else if (LENGTH_TOKENS.has(name)) {
        const normLive = await normaliseLength(live)
        const normExpected = await normaliseLength(expected)
        eq(normLive, normExpected, `light ${name}`)
      } else {
        // Colour — normalise both through computed color
        const normLive = await normaliseColor(live)
        const normExpected = await normaliseColor(expected)
        eq(normLive, normExpected, `light ${name}`)
      }
    }
  })

  /* ------------------------------------------------------------------ */
  /* 2. Non-breaking: dark-mode computed values match the snapshot        */
  /* ------------------------------------------------------------------ */
  await test("dark-mode tokens match the before-snapshot", async () => {
    await page.evaluate(() =>
      document.documentElement.classList.add("dark")
    )
    await page.waitForTimeout(50)

    const results = await page.evaluate((names) => {
      const style = getComputedStyle(document.documentElement)
      const out = {}
      for (const name of names) {
        out[name] = style.getPropertyValue(name).trim()
      }
      return out
    }, tokenNames)

    for (const name of tokenNames) {
      const live = results[name]
      const expected = snapshot.dark[name]

      if (STRING_TOKENS.has(name)) {
        eq(live, expected, `dark ${name}`)
      } else if (LENGTH_TOKENS.has(name)) {
        const normLive = await normaliseLength(live)
        const normExpected = await normaliseLength(expected)
        eq(normLive, normExpected, `dark ${name}`)
      } else {
        const normLive = await normaliseColor(live)
        const normExpected = await normaliseColor(expected)
        eq(normLive, normExpected, `dark ${name}`)
      }
    }

    // Clean up
    await page.evaluate(() =>
      document.documentElement.classList.remove("dark")
    )
  })

  /* ------------------------------------------------------------------ */
  /* 3. .dark overrides regardless of emulated OS colour scheme           */
  /* ------------------------------------------------------------------ */
  await test(".dark class overrides OS light preference", async () => {
    await page.emulateMedia({ colorScheme: "light" })
    await page.evaluate(() =>
      document.documentElement.classList.add("dark")
    )
    await page.waitForTimeout(50)

    const bg = await page.evaluate(() =>
      getComputedStyle(document.documentElement)
        .getPropertyValue("--background")
        .trim()
    )
    // dark --background should resolve to the dark value
    const normBg = await normaliseColor(bg)
    const normExpected = await normaliseColor("oklch(0.145 0 0)")
    eq(normBg, normExpected, "dark bg with OS light")

    await page.evaluate(() =>
      document.documentElement.classList.remove("dark")
    )
  })

  await test(".dark class overrides OS dark preference", async () => {
    await page.emulateMedia({ colorScheme: "dark" })
    await page.evaluate(() =>
      document.documentElement.classList.add("dark")
    )
    await page.waitForTimeout(50)

    const bg = await page.evaluate(() =>
      getComputedStyle(document.documentElement)
        .getPropertyValue("--background")
        .trim()
    )
    const normBg = await normaliseColor(bg)
    const normExpected = await normaliseColor("oklch(0.145 0 0)")
    eq(normBg, normExpected, "dark bg with OS dark")

    await page.evaluate(() =>
      document.documentElement.classList.remove("dark")
    )
  })

  await test("no .dark class + OS dark stays light", async () => {
    await page.emulateMedia({ colorScheme: "dark" })
    await page.evaluate(() =>
      document.documentElement.classList.remove("dark")
    )
    await page.waitForTimeout(50)

    const bg = await page.evaluate(() =>
      getComputedStyle(document.documentElement)
        .getPropertyValue("--background")
        .trim()
    )
    const normBg = await normaliseColor(bg)
    const normExpected = await normaliseColor("oklch(1 0 0)")
    eq(normBg, normExpected, "light bg with OS dark")
  })

  /* ------------------------------------------------------------------ */
  /* 4. @property fallback: invalid value reverts to initial-value        */
  /* ------------------------------------------------------------------ */
  await test("invalid @property value falls back to initial-value", async () => {
    // Reset media and mode
    await page.emulateMedia({ colorScheme: "light" })
    await page.evaluate(() =>
      document.documentElement.classList.remove("dark")
    )

    const result = await page.evaluate(() => {
      const el = document.createElement("div")
      document.body.appendChild(el)
      // Set an invalid color value on a registered <color> property
      el.style.setProperty("--primary", "not-a-color")
      const computed = getComputedStyle(el).getPropertyValue("--primary").trim()
      el.remove()
      return computed
    })

    // Should fall back to @property initial-value, not "not-a-color"
    const normResult = await normaliseColor(result)
    const normExpected = await normaliseColor("oklch(0.205 0 0)")
    eq(normResult, normExpected, "@property fallback for --primary")
  })

  await test("invalid @property value falls back for length tokens", async () => {
    const result = await page.evaluate(() => {
      const el = document.createElement("div")
      document.body.appendChild(el)
      el.style.setProperty("--radius", "not-a-length")
      const computed = getComputedStyle(el).getPropertyValue("--radius").trim()
      el.remove()
      return computed
    })

    const normResult = await normaliseLength(result)
    const normExpected = await normaliseLength("10px")
    eq(normResult, normExpected, "@property fallback for --radius")
  })

  /* ------------------------------------------------------------------ */
  /* 5. Derived hover tokens resolve to a valid colour                   */
  /* ------------------------------------------------------------------ */
  await test("derived hover tokens produce valid colours", async () => {
    await page.emulateMedia({ colorScheme: "light" })
    await page.evaluate(() =>
      document.documentElement.classList.remove("dark")
    )
    await page.waitForTimeout(50)

    const hovers = await page.evaluate(() => {
      const style = getComputedStyle(document.documentElement)
      return [
        "--primary-hover",
        "--secondary-hover",
        "--accent-hover",
        "--destructive-hover",
        "--muted-hover",
      ].map((name) => ({
        name,
        value: style.getPropertyValue(name).trim(),
      }))
    })

    for (const { name, value } of hovers) {
      // Must be non-empty and resolve to a real colour (not the literal expression)
      eq(value !== "", true, `${name} is non-empty`)
      eq(
        !value.includes("oklch(from"),
        true,
        `${name} is resolved, not raw expression`
      )
    }
  })
}
