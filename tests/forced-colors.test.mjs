export default async function run({ page, baseUrl, test, eq }) {
  /* ================================================================
     forced-colors: active
     ================================================================ */

  // Force a real document load before measuring focus rings. Earlier files
  // (dropdown-menu) leave the browser's input modality set to "pointer", and
  // because this playground is a hash-based SPA, page.goto("#…") is only a
  // hash change — the modality survives it. Programmatic .focus() then fails to
  // match :focus-visible on non-input elements, so the repair layer's outlines
  // read as "none". about:blank resets it.
  await page.goto("about:blank")

  await page.emulateMedia({ forcedColors: "active" })

  // ── Focus outlines survive on every focusable family ──

  await page.goto(`${baseUrl}/#button`)
  await page.waitForSelector(".btn")

  await test("forced-colors: button has outline on focus", async () => {
    const btn = page.locator(".btn").first()
    await btn.focus()
    const { style, width } = await btn.evaluate((el) => {
      const s = getComputedStyle(el)
      return { style: s.outlineStyle, width: parseFloat(s.outlineWidth) }
    })
    eq(style !== "none", true, `outline-style is "${style}"`)
    eq(width >= 2, true, `outline-width is ${width}px`)
  })

  await page.goto(`${baseUrl}/#input`)
  await page.waitForSelector(".input")

  await test("forced-colors: input has outline on focus", async () => {
    const input = page.locator(".input").first()
    await input.focus()
    const { style, width } = await input.evaluate((el) => {
      const s = getComputedStyle(el)
      return { style: s.outlineStyle, width: parseFloat(s.outlineWidth) }
    })
    eq(style !== "none", true, `outline-style is "${style}"`)
    eq(width >= 2, true, `outline-width is ${width}px`)
  })

  await page.goto(`${baseUrl}/#checkbox`)
  await page.waitForSelector(".checkbox")

  await test("forced-colors: checkbox has outline on focus", async () => {
    const cb = page.locator(".checkbox").first()
    await cb.focus()
    const { style, width } = await cb.evaluate((el) => {
      const s = getComputedStyle(el)
      return { style: s.outlineStyle, width: parseFloat(s.outlineWidth) }
    })
    eq(style !== "none", true, `outline-style is "${style}"`)
    eq(width >= 2, true, `outline-width is ${width}px`)
  })

  await page.goto(`${baseUrl}/#switch`)
  await page.waitForSelector(".switch")

  await test("forced-colors: switch has outline on focus", async () => {
    const sw = page.locator(".switch").first()
    await sw.focus()
    const { style, width } = await sw.evaluate((el) => {
      const s = getComputedStyle(el)
      return { style: s.outlineStyle, width: parseFloat(s.outlineWidth) }
    })
    eq(style !== "none", true, `outline-style is "${style}"`)
    eq(width >= 2, true, `outline-width is ${width}px`)
  })

  await page.goto(`${baseUrl}/#tabs`)
  await page.waitForSelector(".tabs-trigger")

  await test("forced-colors: tabs-trigger has outline on focus", async () => {
    const tab = page.locator(".tabs-trigger").first()
    await tab.focus()
    const { style, width } = await tab.evaluate((el) => {
      const s = getComputedStyle(el)
      return { style: s.outlineStyle, width: parseFloat(s.outlineWidth) }
    })
    eq(style !== "none", true, `outline-style is "${style}"`)
    eq(width >= 2, true, `outline-width is ${width}px`)
  })

  await page.goto(`${baseUrl}/#slider`)
  await page.waitForSelector(".slider-thumb")

  await test("forced-colors: slider-thumb has outline on focus", async () => {
    const thumb = page.locator(".slider-thumb").first()
    await thumb.focus()
    const { style, width } = await thumb.evaluate((el) => {
      const s = getComputedStyle(el)
      return { style: s.outlineStyle, width: parseFloat(s.outlineWidth) }
    })
    eq(style !== "none", true, `outline-style is "${style}"`)
    eq(width >= 2, true, `outline-width is ${width}px`)
  })

  await page.goto(`${baseUrl}/#select`)
  await page.waitForSelector(".select-trigger")

  await test("forced-colors: select-trigger has outline on focus", async () => {
    const trigger = page.locator(".select-trigger").first()
    await trigger.focus()
    const { style, width } = await trigger.evaluate((el) => {
      const s = getComputedStyle(el)
      return { style: s.outlineStyle, width: parseFloat(s.outlineWidth) }
    })
    eq(style !== "none", true, `outline-style is "${style}"`)
    eq(width >= 2, true, `outline-width is ${width}px`)
  })

  // ── Surfaces have visible borders ──

  await page.goto(`${baseUrl}/#badge`)
  await page.waitForSelector(".badge")

  await test("forced-colors: badge has visible border", async () => {
    const border = await page.locator(".badge").first().evaluate((el) => {
      return getComputedStyle(el).borderStyle
    })
    eq(border !== "none", true, `border-style is "${border}"`)
  })

  await page.goto(`${baseUrl}/#tabs`)
  await page.waitForSelector(".tabs-list")

  await test("forced-colors: tabs-list has visible border", async () => {
    const border = await page.locator(".tabs-list").first().evaluate((el) => {
      return getComputedStyle(el).borderStyle
    })
    eq(border !== "none", true, `border-style is "${border}"`)
  })

  await page.goto(`${baseUrl}/#switch`)
  await page.waitForSelector(".switch")

  await test("forced-colors: switch has visible border", async () => {
    const border = await page.locator(".switch").first().evaluate((el) => {
      return getComputedStyle(el).borderStyle
    })
    eq(border !== "none", true, `border-style is "${border}"`)
  })

  // ── Per-component forced-color-adjust: none ──

  await page.goto(`${baseUrl}/#status-dot`)
  await page.waitForSelector(".status-dot")

  await test("forced-colors: status-dot has forced-color-adjust: none", async () => {
    const val = await page.locator(".status-dot").first().evaluate((el) => {
      return getComputedStyle(el).forcedColorAdjust
    })
    eq(val, "none", `forced-color-adjust is "${val}"`)
  })

  await test("forced-colors: status-dot warning is diamond (border-radius near 0)", async () => {
    const r = await page.locator('.status-dot[data-status="warning"]').first().evaluate((el) => {
      return parseFloat(getComputedStyle(el).borderRadius)
    })
    eq(r < 5, true, `border-radius is ${r}px (should be ~1px for diamond)`)
  })

  await test("forced-colors: status-dot error is square (border-radius near 0)", async () => {
    const r = await page.locator('.status-dot[data-status="error"]').first().evaluate((el) => {
      return parseFloat(getComputedStyle(el).borderRadius)
    })
    eq(r < 5, true, `border-radius is ${r}px (should be ~1px for square)`)
  })

  await test("forced-colors: status-dot success stays circular", async () => {
    const r = await page.locator('.status-dot[data-status="success"]').first().evaluate((el) => {
      return parseFloat(getComputedStyle(el).borderRadius)
    })
    eq(r > 100, true, `border-radius is ${r}px (should be 9999px for circle)`)
  })

  await page.goto(`${baseUrl}/#progress`)
  await page.waitForSelector(".progress")

  await test("forced-colors: progress has forced-color-adjust: none", async () => {
    const val = await page.locator(".progress").first().evaluate((el) => {
      return getComputedStyle(el).forcedColorAdjust
    })
    eq(val, "none", `forced-color-adjust is "${val}"`)
  })

  await test("forced-colors: progress has visible border", async () => {
    const border = await page.locator(".progress").first().evaluate((el) => {
      return getComputedStyle(el).borderStyle
    })
    eq(border !== "none", true, `border-style is "${border}"`)
  })

  await page.goto(`${baseUrl}/#slider`)
  await page.waitForSelector(".slider-track")

  await test("forced-colors: slider-track has forced-color-adjust: none", async () => {
    const val = await page.locator(".slider-track").first().evaluate((el) => {
      return getComputedStyle(el).forcedColorAdjust
    })
    eq(val, "none", `forced-color-adjust is "${val}"`)
  })

  await test("forced-colors: slider-track has visible border", async () => {
    const border = await page.locator(".slider-track").first().evaluate((el) => {
      return getComputedStyle(el).borderStyle
    })
    eq(border !== "none", true, `border-style is "${border}"`)
  })

  /* ================================================================
     prefers-reduced-transparency: reduce
     ================================================================ */

  await page.emulateMedia({ forcedColors: "none", reducedTransparency: "reduce" })

  await page.goto(`${baseUrl}/#progress`)
  await page.waitForSelector(".progress")

  await test("reduced-transparency: progress track bg is opaque", async () => {
    const bg = await page.locator(".progress").first().evaluate((el) => {
      return getComputedStyle(el).backgroundColor
    })
    // The opaque fallback should not contain "0)" (fully transparent) or low alpha
    const isTransparent = bg.includes("/ 0)") || bg === "rgba(0, 0, 0, 0)"
    eq(isTransparent, false, `background is opaque: "${bg}"`)
  })

  /* ================================================================
     prefers-contrast: more
     ================================================================ */

  await page.emulateMedia({ reducedTransparency: "no-preference", contrast: "more" })

  await page.goto(`${baseUrl}/#button`)
  await page.waitForSelector(".btn")

  await test("high-contrast: focus outline is at least 3px", async () => {
    const btn = page.locator(".btn").first()
    await btn.focus()
    const width = await btn.evaluate((el) => {
      return parseFloat(getComputedStyle(el).outlineWidth)
    })
    eq(width >= 3, true, `outline-width is ${width}px (want >= 3)`)
  })

  // ── Reset all media emulation for downstream tests ──
  await page.emulateMedia({
    forcedColors: null,
    contrast: null,
    reducedTransparency: null,
    reducedMotion: null,
    colorScheme: null,
  })
  // Navigate to a blank page + reload to flush any stale layout state
  // left by forcedColors emulation.
  await page.goto("about:blank")
}
