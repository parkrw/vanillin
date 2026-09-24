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

/*
 * Sub-task 1 (task123): the @property initial-value IS the fallback value.
 * Safari 17.0–17.4, an invalid consumer token and a missing defaults.css all
 * land on it, so a stale initial-value silently reinstates whatever the
 * shipped theme has since fixed — here, the WCAG non-text-contrast repairs of
 * tasks 71/72. Nothing renders visibly broken when that happens, so the only
 * possible guard is an equality test between the two files.
 */
const globalsCss = readFileSync(
  fileURLToPath(new URL("../styles/globals.css", import.meta.url)),
  "utf8"
)
const defaultsCss = readFileSync(
  fileURLToPath(new URL("../styles/defaults.css", import.meta.url)),
  "utf8"
)

const collapse = (value) => value.trim().replace(/\s+/g, " ")

/** name → { syntax, initialValue } for every @property in globals.css. */
function parseRegistrations(css) {
  const out = new Map()
  for (const [, name, body] of css.matchAll(/@property\s+(--[\w-]+)\s*\{([^}]*)\}/g)) {
    const syntax = body.match(/syntax:\s*"([^"]*)"/)
    const initial = body.match(/initial-value:\s*([^;]+);/)
    out.set(name, {
      syntax: syntax ? syntax[1] : null,
      initialValue: initial ? collapse(initial[1]) : null,
    })
  }
  return out
}

/** name → declared value for every token in the generated :root block. */
function parseDeclarations(css) {
  const out = new Map()
  const root = css.match(/:root\s*\{([\s\S]*?)\n\}/)
  if (!root) throw new Error("defaults.css has no :root block")
  for (const [, name, value] of root[1].matchAll(/(--[\w-]+):\s*([^;]+);/g)) {
    out.set(name, collapse(value))
  }
  return out
}

/*
 * The light arm of `light-dark(light, dark)`. Split at depth zero — several
 * tokens carry a nested `color-mix(in oklab, …)` whose comma is not the
 * argument separator.
 */
function lightArm(value) {
  const inner = value.match(/^light-dark\(([\s\S]*)\)$/)
  if (!inner) return value
  let depth = 0
  for (let i = 0; i < inner[1].length; i++) {
    const c = inner[1][i]
    if (c === "(") depth++
    else if (c === ")") depth--
    else if (c === "," && depth === 0) return inner[1].slice(0, i).trim()
  }
  return inner[1].trim()
}

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
  /*
   * Reaching `initial-value` takes a value that is invalid at *computed-value*
   * time, on the root element:
   *   - CSSOM setProperty() with syntax-garbage ("not-a-color") is rejected at
   *     parse time, so the declaration never lands and the shipped value
   *     stands — a test written that way passes without a fallback ever
   *     occurring;
   *   - a reference to an undefined token parses, then fails to compute;
   *   - and on a *child*, `inherits: true` resolves that failure to the
   *     inherited value, so only the root reaches `initial-value`.
   * Root + undefined-var is also the shape of the real failures being guarded:
   * Safari 17.0-17.4 and a missing defaults.css both lose the whole :root
   * declaration.
   */
  const UNDEFINED_TOKEN = "var(--vanillin-undefined-token)"

  async function fallbackValueOf(name) {
    return page.evaluate(
      ([token, invalid]) => {
        const root = document.documentElement
        root.style.setProperty(token, invalid)
        const value = getComputedStyle(root).getPropertyValue(token).trim()
        root.style.removeProperty(token)
        return value
      },
      [name, UNDEFINED_TOKEN]
    )
  }

  await test("invalid @property value falls back to initial-value", async () => {
    await page.emulateMedia({ colorScheme: "light" })
    await page.evaluate(() => document.documentElement.classList.remove("dark"))

    eq(
      await normaliseColor(await fallbackValueOf("--primary")),
      await normaliseColor("oklch(0.205 0 0)"),
      "@property fallback for --primary"
    )
  })

  await test("an invalid value on a child inherits rather than resetting", async () => {
    const inherited = await page.evaluate(
      (invalid) => {
        const child = document.createElement("div")
        document.body.appendChild(child)
        child.style.setProperty("--primary", invalid)
        const value = getComputedStyle(child).getPropertyValue("--primary").trim()
        child.remove()
        return value
      },
      UNDEFINED_TOKEN
    )
    const shipped = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue("--primary").trim()
    )
    eq(
      await normaliseColor(inherited),
      await normaliseColor(shipped),
      "child keeps the inherited value"
    )
  })

  await test("invalid @property value falls back for length tokens", async () => {
    eq(
      await normaliseLength(await fallbackValueOf("--radius")),
      await normaliseLength("10px"),
      "@property fallback for --radius"
    )
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

  /* ------------------------------------------------------------------ */
  /* 6. @property initial-value agrees with the shipped light theme      */
  /* ------------------------------------------------------------------ */
  await test("@property initial-values match defaults.css light values", async () => {
    const registrations = parseRegistrations(globalsCss)
    const declarations = parseDeclarations(defaultsCss)
    eq(registrations.size > 0, true, "globals.css has @property registrations")
    eq(declarations.size > 0, true, "defaults.css declares tokens")

    // `initial-value` may not contain var(), so a token generated as
    // `var(--font-sans)` has its stack written out literally. Resolve one
    // level of indirection against defaults.css before comparing.
    const deref = (value) =>
      value.replace(/var\((--[\w-]+)\)/g, (whole, name) =>
        declarations.has(name) ? declarations.get(name) : whole
      )

    let compared = 0
    for (const [name, { syntax, initialValue }] of registrations) {
      // Derived tokens (--radius-*, --*-hover) are computed in globals.css and
      // have no generated declaration; test 7 covers those end-to-end.
      if (!declarations.has(name)) continue
      eq(initialValue !== null, true, `${name} has an initial-value`)

      const shipped = deref(lightArm(declarations.get(name)))
      compared++

      if (syntax === "<color>") {
        eq(
          await normaliseColor(initialValue),
          await normaliseColor(shipped),
          `${name} initial-value vs light value`
        )
      } else if (syntax === "<length>") {
        // rem is not computationally independent, so registrations carry px
        // where the generator emits rem. Compare resolved lengths, not text.
        eq(
          await normaliseLength(initialValue),
          await normaliseLength(shipped),
          `${name} initial-value vs light value`
        )
      } else {
        eq(initialValue, shipped, `${name} initial-value vs light value`)
      }
    }
    eq(compared > 40, true, `compared ${compared} tokens`)
  })

  /* ------------------------------------------------------------------ */
  /* 7. Every registration is actually accepted by the browser           */
  /* ------------------------------------------------------------------ */
  await test("every @property registration is accepted by the engine", async () => {
    // An @property rule with an invalid initial-value is dropped whole, so the
    // token silently keeps no type guard and no fallback. Nothing renders
    // differently when that happens; only the accepted-rule list shows it.
    const accepted = await page.evaluate(() => {
      const names = []
      const walk = (rules) => {
        for (const rule of rules) {
          if (rule.constructor.name === "CSSPropertyRule") names.push(rule.name)
          else if (rule.cssRules) walk(rule.cssRules)
        }
      }
      for (const sheet of document.styleSheets) {
        try {
          walk(sheet.cssRules)
        } catch {}
      }
      return names
    })

    const declared = [...parseRegistrations(globalsCss).keys()]
    const dropped = declared.filter((name) => !accepted.includes(name))
    eq(dropped.join(", "), "", "@property rules the engine rejected")
  })

  /* ------------------------------------------------------------------ */
  /* 8. …and the fallback a browser reaches is that initial-value        */
  /* ------------------------------------------------------------------ */
  await test("registered fallback equals the declared initial-value", async () => {
    await page.emulateMedia({ colorScheme: "light" })
    await page.evaluate(() => document.documentElement.classList.remove("dark"))
    await page.waitForTimeout(50)

    /*
     * Deliberately compared against globals.css rather than the live root:
     * the docs site overrides some tokens for its own demos (site.css sets
     * --motion-scale), so the root is not the shipped theme. Test 6 ties the
     * initial-value to the shipped theme; this ties the engine's real
     * fallback to the initial-value. The two together give
     * fallback === shipped light value, which is the property that matters.
     */
    const registrations = [...parseRegistrations(globalsCss).entries()]
    const fallbacks = await page.evaluate(
      ([names, invalid]) => {
        const root = document.documentElement
        const out = {}
        for (const name of names) {
          root.style.setProperty(name, invalid)
          out[name] = getComputedStyle(root).getPropertyValue(name).trim()
          root.style.removeProperty(name)
        }
        return out
      },
      [registrations.map(([name]) => name), UNDEFINED_TOKEN]
    )

    const mismatches = []
    for (const [name, { syntax, initialValue }] of registrations) {
      let a
      let b
      if (syntax === "<color>") {
        a = await normaliseColor(fallbacks[name])
        b = await normaliseColor(initialValue)
      } else if (syntax === "<length>") {
        a = await normaliseLength(fallbacks[name])
        b = await normaliseLength(initialValue)
      } else if (syntax === "*") {
        // Universal-syntax registrations get no fallback at all — measured,
        // and pinned by the test below. Nothing to compare here until that
        // changes; see docs/QUIRKS.md.
        continue
      } else {
        a = collapse(fallbacks[name])
        b = collapse(initialValue)
      }
      if (a !== b) mismatches.push(`${name}: fallback ${a} vs initial-value ${b}`)
    }
    eq(mismatches.join("; "), "", "fallback matches the declared initial-value")
  })

  /* ------------------------------------------------------------------ */
  /* 9. Pin the universal-syntax gap this task measured                  */
  /* ------------------------------------------------------------------ */
  await test("universal-syntax tokens inherit rather than falling back", async () => {
    /*
     * `@property … syntax: "*"` with an initial-value looks like a fallback
     * guarantee and is not one: the token reads back empty and every
     * declaration using it goes invalid-at-computed-value-time, so an
     * inherited value wins instead. A `<color>` registration does fall back,
     * which is what makes the gap easy to miss.
     *
     * This pins the measured behaviour rather than the intended one. It turns
     * red if an engine starts honouring `*` initial-values — a change worth
     * noticing, because the repair tracked in docs/QUIRKS.md could then be
     * dropped.
     */
    const measured = await page.evaluate(() => {
      const root = document.documentElement
      const box = document.createElement("div")
      // Neither the sans nor the mono stack, so an inherited value and a
      // fallback value can never be confused for one another.
      box.style.fontFamily = "cursive"
      const el = document.createElement("p")
      el.style.fontFamily = "var(--typeset-font-mono)"
      box.appendChild(el)
      document.body.appendChild(box)

      const withToken = getComputedStyle(el).fontFamily
      root.style.setProperty("--typeset-font-mono", "var(--vanillin-undefined-token)")
      const withoutToken = getComputedStyle(el).fontFamily
      root.style.removeProperty("--typeset-font-mono")
      box.remove()
      return { withToken, withoutToken }
    })

    eq(
      measured.withToken.startsWith("ui-monospace"),
      true,
      "the token resolves normally when defined"
    )
    eq(measured.withoutToken, "cursive", "an undefined token inherits, not initial-value")
  })

  await test("a var() fallback at the consumption site beats the cursive inherit (#56)", async () => {
    /*
     * `.typeset code` now reads `var(--typeset-font-mono, <mono stack>)`
     * (styles/typeset.css:153). Same invalidation as the test above, but
     * through the real consumption site rather than an inline style, so the
     * repair is measured where it actually lives.
     */
    const measured = await page.evaluate(() => {
      const root = document.documentElement
      const box = document.createElement("div")
      box.className = "typeset"
      // Same distinctive control as the test above — never the mono stack
      // and never the fallback, so an inherit and a fallback can't be confused.
      box.style.fontFamily = "cursive"
      const code = document.createElement("code")
      box.appendChild(code)
      document.body.appendChild(box)

      const withToken = getComputedStyle(code).fontFamily
      root.style.setProperty("--typeset-font-mono", "var(--vanillin-undefined-token)")
      const invalidated = getComputedStyle(root).getPropertyValue("--typeset-font-mono").trim()
      const withoutToken = getComputedStyle(code).fontFamily
      root.style.removeProperty("--typeset-font-mono")
      box.remove()
      return { withToken, invalidated, withoutToken }
    })

    eq(
      measured.withToken.startsWith("ui-monospace"),
      true,
      "the token resolves normally when defined"
    )
    // Counter-precondition: the token itself is actually invalid/empty here,
    // not silently still valid — matches the gap the test above pins.
    eq(measured.invalidated, "", "the token reads back empty once invalidated")
    eq(
      measured.withoutToken.startsWith("ui-monospace"),
      true,
      "the var() fallback wins — the mono stack, not the inherited cursive"
    )
  })

  /* ------------------------------------------------------------------ */
  /* 10. Dark mode is root-only — measured, not assumed                  */
  /* ------------------------------------------------------------------ */
  await test("a scoped .dark subtree does not get dark colours", async () => {
    await page.emulateMedia({ colorScheme: "light" })
    await page.evaluate(() => document.documentElement.classList.remove("dark"))
    await page.waitForTimeout(50)

    /*
     * `.dark` flips `color-scheme`, and every colour token rides
     * `light-dark()` off that. On a subtree it half-works: the registered
     * properties were already computed against the *root's* light
     * color-scheme and inherit as resolved values, so descendants get light
     * colours with dark-styled form controls. Root-only dark is therefore the
     * supported model; see docs/QUIRKS.md.
     */
    const scoped = await page.evaluate(() => {
      const wrap = document.createElement("div")
      wrap.className = "dark"
      const child = document.createElement("div")
      child.style.backgroundColor = "var(--card)"
      wrap.appendChild(child)
      document.body.appendChild(wrap)
      const style = getComputedStyle(child)
      const result = {
        colorScheme: style.colorScheme,
        card: style.getPropertyValue("--card").trim(),
        rendered: style.backgroundColor,
      }
      wrap.remove()
      return result
    })

    const lightCard = await normaliseColor("oklch(1 0 0)")
    eq(scoped.colorScheme, "dark", "color-scheme does flip on the subtree")
    eq(
      await normaliseColor(scoped.rendered),
      lightCard,
      "…but the colour tokens stay light — dark is root-only"
    )
  })

  await test("dark on the root element does get dark colours", async () => {
    const rooted = await page.evaluate(() => {
      document.documentElement.classList.add("dark")
      const child = document.createElement("div")
      child.style.backgroundColor = "var(--card)"
      document.body.appendChild(child)
      const rendered = getComputedStyle(child).backgroundColor
      child.remove()
      document.documentElement.classList.remove("dark")
      return rendered
    })
    eq(
      await normaliseColor(rooted),
      await normaliseColor("oklch(0.205 0 0)"),
      "root .dark resolves the dark arm"
    )
  })

  /* ------------------------------------------------------------------ */
  /* 11. .btn--outline's dark lift is aimed at <html>, not any ancestor  */
  /*     with a .dark class (#57)                                        */
  /* ------------------------------------------------------------------ */
  await page.goto(`${baseUrl}#button`)
  await page.waitForSelector(".btn--outline")

  await test("outline button in a scoped .dark div matches the light outline button", async () => {
    await page.evaluate(() => document.documentElement.classList.remove("dark"))
    await page.waitForTimeout(50)

    /*
     * `:where(html).dark` only matches when .dark sits on the <html> element
     * itself, so a div carrying the class — the scoped pattern #57 outlaws —
     * must render identically to the plain light button, not pick up the
     * --input-background lift meant for root dark mode.
     */
    const rendered = await page.evaluate(() => {
      const light = document.querySelector(".btn--outline")
      const lightStyle = getComputedStyle(light)

      const wrap = document.createElement("div")
      wrap.className = "dark"
      const scoped = document.createElement("button")
      scoped.className = "btn btn--outline"
      wrap.appendChild(scoped)
      document.body.appendChild(wrap)
      const scopedStyle = getComputedStyle(scoped)

      const result = {
        lightBg: lightStyle.backgroundColor,
        lightBorder: lightStyle.borderColor,
        scopedBg: scopedStyle.backgroundColor,
        scopedBorder: scopedStyle.borderColor,
      }
      wrap.remove()
      return result
    })

    eq(
      await normaliseColor(rendered.scopedBg),
      await normaliseColor(rendered.lightBg),
      "scoped .dark background matches the light outline button — no dark lift"
    )
    eq(
      await normaliseColor(rendered.scopedBorder),
      await normaliseColor(rendered.lightBorder),
      "scoped .dark border matches the light outline button"
    )
  })

  await test("outline button on a dark <html> does get the dark lift (counter-precondition)", async () => {
    // If root dark stopped changing the button, the test above would pass
    // for the wrong reason — the rule not matching anywhere, not just off
    // a scoped ancestor.
    const rendered = await page.evaluate(() => {
      const btn = document.querySelector(".btn--outline")
      const lightBg = getComputedStyle(btn).backgroundColor
      document.documentElement.classList.add("dark")
      const darkBg = getComputedStyle(btn).backgroundColor
      document.documentElement.classList.remove("dark")
      return { lightBg, darkBg }
    })

    const normLight = await normaliseColor(rendered.lightBg)
    const normDark = await normaliseColor(rendered.darkBg)
    eq(
      normLight === normDark,
      false,
      ".dark on <html> changes the outline button's background — the lift applies at the root"
    )
  })

  await test("outline button hover still wins over the dark lift in root dark mode", async () => {
    // .btn transitions background-color, so a colour read right after a
    // hover is the transition's start value, not the target (docs/QUIRKS.md).
    // Wait for the CSSTransition to finish before reading.
    const settled = () =>
      page.waitForFunction(
        () => !document.getAnimations().some((a) => a instanceof CSSTransition)
      )

    await page.evaluate(() => document.documentElement.classList.add("dark"))
    await settled()

    const outline = page.locator(".btn--outline").first()
    const lifted = await outline.evaluate((el) => getComputedStyle(el).backgroundColor)
    await outline.hover()
    await settled()
    const hovered = await outline.evaluate((el) => getComputedStyle(el).backgroundColor)
    await page.mouse.move(0, 0)

    const accent = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue("--accent").trim()
    )

    eq(
      await normaliseColor(hovered) === (await normaliseColor(lifted)),
      false,
      "hover changes the outline button's background in dark mode"
    )
    eq(
      await normaliseColor(hovered),
      await normaliseColor(accent),
      "hover resolves to --accent, not the --input-background dark lift — (0,2,0) ties preserve source order"
    )

    await page.evaluate(() => document.documentElement.classList.remove("dark"))
  })

  // Restore the page other suites expect after this file's #button detour.
  await page.goto(baseUrl)
}
