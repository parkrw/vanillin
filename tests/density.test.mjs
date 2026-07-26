/*
 * Density mode tests (task 36).
 *
 * Verifies:
 * 1. Each mode produces distinct computed padding on a table cell and a button.
 * 2. A nested data-density overrides its ancestor.
 * 3. Font size is unchanged across all three modes.
 * 4. Touch targets (checkbox, switch, button) stay >= 24px in compact.
 */

export default async function run({ page, baseUrl, test, eq }) {
  /** Parse a CSS px value like "12px" to a number. */
  function px(v) { return parseFloat(v) }

  /** Set data-density on :root and wait for reflow. */
  async function setRootDensity(mode) {
    await page.evaluate(
      (m) => document.documentElement.setAttribute("data-density", m),
      mode
    )
    await page.waitForTimeout(50)
  }

  /** Remove data-density from :root. */
  async function clearRootDensity() {
    await page.evaluate(() =>
      document.documentElement.removeAttribute("data-density")
    )
    await page.waitForTimeout(50)
  }

  /* ------------------------------------------------------------------ */
  /* 1. Table cell padding differs across modes                         */
  /* ------------------------------------------------------------------ */
  await page.goto(`${baseUrl}/#table`)
  await page.waitForSelector(".table-cell")

  await test("table cell padding differs across all three density modes", async () => {
    const paddings = {}
    for (const mode of ["compact", "comfortable", "spacious"]) {
      await setRootDensity(mode)
      paddings[mode] = await page.evaluate(() => {
        const cell = document.querySelector(".table-cell")
        return parseFloat(getComputedStyle(cell).paddingTop)
      })
    }
    await clearRootDensity()

    eq(paddings.compact < paddings.comfortable, true,
      `compact (${paddings.compact}) < comfortable (${paddings.comfortable})`)
    eq(paddings.comfortable < paddings.spacious, true,
      `comfortable (${paddings.comfortable}) < spacious (${paddings.spacious})`)
  })

  /* ------------------------------------------------------------------ */
  /* 2. Button padding differs across modes                             */
  /* ------------------------------------------------------------------ */
  await page.goto(`${baseUrl}/#button`)
  await page.waitForSelector(".btn")

  await test("button padding differs across all three density modes", async () => {
    const paddings = {}
    for (const mode of ["compact", "comfortable", "spacious"]) {
      await setRootDensity(mode)
      paddings[mode] = await page.evaluate(() => {
        const btn = document.querySelector(".btn")
        return parseFloat(getComputedStyle(btn).paddingLeft)
      })
    }
    await clearRootDensity()

    eq(paddings.compact < paddings.comfortable, true,
      `compact (${paddings.compact}) < comfortable (${paddings.comfortable})`)
    eq(paddings.comfortable < paddings.spacious, true,
      `comfortable (${paddings.comfortable}) < spacious (${paddings.spacious})`)
  })

  /* ------------------------------------------------------------------ */
  /* 3. Nested data-density overrides ancestor                          */
  /* ------------------------------------------------------------------ */
  await page.goto(`${baseUrl}/#density`)
  await page.waitForSelector("[data-testid='density-outer']")

  await test("nested data-density overrides its ancestor", async () => {
    // The demo page has outer=spacious, inner=compact by default.
    // Measure button padding in the outer scope vs inner scope.
    const outerPad = await page.evaluate(() => {
      const outer = document.querySelector("[data-testid='density-outer']")
      const btn = outer.querySelector(".btn")
      return parseFloat(getComputedStyle(btn).paddingLeft)
    })

    const innerPad = await page.evaluate(() => {
      const inner = document.querySelector("[data-testid='density-inner']")
      const btn = inner.querySelector(".btn")
      return parseFloat(getComputedStyle(btn).paddingLeft)
    })

    // Inner is compact (0.875), outer is spacious (1.25), so inner < outer
    eq(innerPad < outerPad, true,
      `inner compact (${innerPad}) < outer spacious (${outerPad})`)
  })

  /* ------------------------------------------------------------------ */
  /* 4. Font size unchanged across modes                                */
  /* ------------------------------------------------------------------ */
  await page.goto(`${baseUrl}/#button`)
  await page.waitForSelector(".btn")

  await test("font size unchanged across all three density modes", async () => {
    const sizes = {}
    for (const mode of ["compact", "comfortable", "spacious"]) {
      await setRootDensity(mode)
      sizes[mode] = await page.evaluate(() => {
        const btn = document.querySelector(".btn")
        return getComputedStyle(btn).fontSize
      })
    }
    await clearRootDensity()

    eq(sizes.compact, sizes.comfortable, "compact font-size == comfortable")
    eq(sizes.comfortable, sizes.spacious, "comfortable font-size == spacious")
  })

  /* ------------------------------------------------------------------ */
  /* 5. Touch targets stay >= 24px in compact                           */
  /* ------------------------------------------------------------------ */
  await test("button height stays >= 24px in compact mode", async () => {
    await setRootDensity("compact")
    const height = await page.evaluate(() => {
      const btn = document.querySelector(".btn")
      return btn.getBoundingClientRect().height
    })
    await clearRootDensity()

    eq(height >= 24, true, `button height ${height}px >= 24px`)
  })

  await page.goto(`${baseUrl}/#checkbox`)
  await page.waitForSelector(".checkbox")

  await test("checkbox size stays >= 24px hit area in compact mode", async () => {
    // The checkbox visual is 16px but the touch-target clamp enforces
    // min-height/min-width: 24px inside [data-density].
    await setRootDensity("compact")
    const size = await page.evaluate(() => {
      const cb = document.querySelector(".checkbox")
      const rect = cb.getBoundingClientRect()
      return { w: rect.width, h: rect.height }
    })
    await clearRootDensity()

    eq(size.h >= 24, true, `checkbox height ${size.h}px >= 24px`)
    eq(size.w >= 24, true, `checkbox width ${size.w}px >= 24px`)
  })

  await page.goto(`${baseUrl}/#switch`)
  await page.waitForSelector(".switch")

  await test("switch height stays >= 24px in compact mode", async () => {
    await setRootDensity("compact")
    const height = await page.evaluate(() => {
      const sw = document.querySelector(".switch")
      return sw.getBoundingClientRect().height
    })
    await clearRootDensity()

    eq(height >= 24, true, `switch height ${height}px >= 24px`)
  })
}
