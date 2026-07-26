/*
 * Token-surface integration tests — verifies that surface/feedback components
 * resolve spacing through the --space-* density ramp, and that deliberate
 * overlay transparency is preserved after the token migration.
 */

export default async function run({ page, baseUrl, test, eq }) {
  /* ------------------------------------------------------------------ */
  /* Helpers                                                             */
  /* ------------------------------------------------------------------ */

  /** Set --density-scale on :root and wait for reflow. */
  async function setDensity(scale) {
    await page.evaluate(
      (s) => document.documentElement.style.setProperty("--density-scale", s),
      String(scale)
    )
    await page.waitForTimeout(50)
  }

  /** Remove the --density-scale override. */
  async function resetDensity() {
    await page.evaluate(() =>
      document.documentElement.style.removeProperty("--density-scale")
    )
    await page.waitForTimeout(50)
  }

  /** Parse a CSS px value like "12px" → 12. */
  function px(v) {
    return parseFloat(v)
  }

  /* ------------------------------------------------------------------ */
  /* 1. Table cell padding tracks --density-scale                        */
  /* ------------------------------------------------------------------ */
  await test("table cell padding scales with --density-scale", async () => {
    await page.goto(`${baseUrl}/#table`)
    await page.waitForSelector(".table-cell")

    // Measure at default scale (1)
    await resetDensity()
    const pad1 = await page.evaluate(() => {
      const cell = document.querySelector(".table-cell")
      return getComputedStyle(cell).paddingTop
    })

    // Measure at 0.75 scale
    await setDensity(0.75)
    const pad075 = await page.evaluate(() => {
      const cell = document.querySelector(".table-cell")
      return getComputedStyle(cell).paddingTop
    })

    // Padding should shrink when density-scale decreases
    eq(px(pad075) < px(pad1), true, "td padding shrinks at density 0.75")

    // Verify the ratio is roughly correct (0.75 of original)
    const ratio = px(pad075) / px(pad1)
    eq(
      Math.abs(ratio - 0.75) < 0.05,
      true,
      `td padding ratio ~0.75 (got ${ratio.toFixed(3)})`
    )

    await resetDensity()
  })

  /* ------------------------------------------------------------------ */
  /* 2. Table head padding also scales                                   */
  /* ------------------------------------------------------------------ */
  await test("table head inline padding scales with --density-scale", async () => {
    await page.waitForSelector(".table-head")

    await resetDensity()
    const padR1 = await page.evaluate(() => {
      const th = document.querySelector(".table-head")
      return getComputedStyle(th).paddingRight
    })

    await setDensity(0.75)
    const padR075 = await page.evaluate(() => {
      const th = document.querySelector(".table-head")
      return getComputedStyle(th).paddingRight
    })

    eq(px(padR075) < px(padR1), true, "th padding-right shrinks at density 0.75")
    await resetDensity()
  })

  /* ------------------------------------------------------------------ */
  /* 3. Dialog backdrop scrim is still translucent                       */
  /* ------------------------------------------------------------------ */
  await test("dialog scrim is translucent (overlay transparency preserved)", async () => {
    await page.goto(`${baseUrl}/#dialog`)

    // Open a dialog
    const trigger = page.locator("button", { hasText: /open|edit/i }).first()
    await trigger.click()
    await page.waitForSelector("dialog[open]")

    // Check that the backdrop is translucent via a probe element behind it
    const isTranslucent = await page.evaluate(() => {
      const dialog = document.querySelector("dialog[open]")
      if (!dialog) return false
      // The ::backdrop pseudo-element cannot be queried directly via JS,
      // but we can verify the dialog's backdrop style is set to a color-mix
      // by checking that the page behind the dialog is still partially visible.
      // We do this by checking computed backdrop styles on the dialog element.
      // Since ::backdrop is not accessible via getComputedStyle on the element,
      // we verify the CSS rule is present by checking the stylesheet.
      const sheets = Array.from(document.styleSheets)
      for (const sheet of sheets) {
        try {
          for (const rule of sheet.cssRules) {
            if (
              rule.selectorText &&
              rule.selectorText.includes("::backdrop") &&
              rule.style.backgroundColor &&
              rule.style.backgroundColor.includes("color-mix")
            ) {
              return true
            }
          }
        } catch {
          // cross-origin stylesheet
        }
      }
      return false
    })

    eq(isTranslucent, true, "dialog ::backdrop uses color-mix (translucent)")

    // Close
    await page.keyboard.press("Escape")
    await page.waitForTimeout(200)
  })

  /* ------------------------------------------------------------------ */
  /* 4. Tabs trigger padding scales with --density-scale                 */
  /* ------------------------------------------------------------------ */
  await test("tabs trigger padding scales with --density-scale", async () => {
    await page.goto(`${baseUrl}/#tabs`)
    await page.waitForSelector(".tabs-trigger")

    await resetDensity()
    const pad1 = await page.evaluate(() => {
      const trigger = document.querySelector(".tabs-trigger")
      return getComputedStyle(trigger).paddingLeft
    })

    await setDensity(0.75)
    const pad075 = await page.evaluate(() => {
      const trigger = document.querySelector(".tabs-trigger")
      return getComputedStyle(trigger).paddingLeft
    })

    eq(px(pad075) < px(pad1), true, "tabs trigger padding shrinks at density 0.75")
    await resetDensity()
  })

  /* ------------------------------------------------------------------ */
  /* 5. Toast padding scales with --density-scale                        */
  /* ------------------------------------------------------------------ */
  await test("toast padding scales with --density-scale", async () => {
    await page.goto(`${baseUrl}/#toast`)

    // Trigger a toast
    const trigger = page.locator("button", { hasText: /show|add|toast/i }).first()
    await trigger.click()
    await page.waitForSelector(".toast")

    await resetDensity()
    const pad1 = await page.evaluate(() => {
      const toast = document.querySelector(".toast")
      return getComputedStyle(toast).paddingTop
    })

    await setDensity(0.75)
    const pad075 = await page.evaluate(() => {
      const toast = document.querySelector(".toast")
      return getComputedStyle(toast).paddingTop
    })

    eq(px(pad075) < px(pad1), true, "toast padding shrinks at density 0.75")
    await resetDensity()
  })

  /* ------------------------------------------------------------------ */
  /* 6. Card padding scales with --density-scale                         */
  /* ------------------------------------------------------------------ */
  await test("card padding scales with --density-scale", async () => {
    await page.goto(`${baseUrl}/#card`)
    await page.waitForSelector(".card")

    await resetDensity()
    const pad1 = await page.evaluate(() => {
      const card = document.querySelector(".card")
      return getComputedStyle(card).paddingTop
    })

    await setDensity(0.75)
    const pad075 = await page.evaluate(() => {
      const card = document.querySelector(".card")
      return getComputedStyle(card).paddingTop
    })

    eq(px(pad075) < px(pad1), true, "card padding shrinks at density 0.75")

    const ratio = px(pad075) / px(pad1)
    eq(
      Math.abs(ratio - 0.75) < 0.05,
      true,
      `card padding ratio ~0.75 (got ${ratio.toFixed(3)})`
    )

    await resetDensity()
  })

  /* ------------------------------------------------------------------ */
  /* 7. Dialog padding scales with --density-scale                       */
  /* ------------------------------------------------------------------ */
  await test("dialog padding scales with --density-scale", async () => {
    await page.goto(`${baseUrl}/#dialog`)

    const trigger = page.locator("button", { hasText: /open|edit/i }).first()
    await trigger.click()
    await page.waitForSelector("dialog[open]")

    await resetDensity()
    const pad1 = await page.evaluate(() => {
      const dialog = document.querySelector("dialog[open]")
      return getComputedStyle(dialog).padding
    })

    await setDensity(0.75)
    const pad075 = await page.evaluate(() => {
      const dialog = document.querySelector("dialog[open]")
      return getComputedStyle(dialog).padding
    })

    eq(px(pad075) < px(pad1), true, "dialog padding shrinks at density 0.75")

    await page.keyboard.press("Escape")
    await page.waitForTimeout(200)
    await resetDensity()
  })
}
