export default async function run({ page, baseUrl, test, eq, near }) {
  const open = async () => {
    await page.goto(`${baseUrl}/#chart`)
    await page.waitForSelector('[data-pg="chart-default"] .chart-bar')
  }
  await open()

  const pg = (name) => `[data-pg="${name}"]`
  const rect = (selector) =>
    page.locator(selector).first().evaluate((el) => {
      const r = el.getBoundingClientRect()
      return { x: r.x, y: r.y, width: r.width, height: r.height, bottom: r.bottom, right: r.right }
    })
  const barRects = (name, key) =>
    page.locator(`${pg(name)} .chart-series[data-key="${key}"] .chart-bar`).evaluateAll((els) =>
      els.map((el) => {
        const r = el.getBoundingClientRect()
        return { x: r.x, y: r.y, width: r.width, height: r.height, bottom: r.bottom }
      }),
    )
  // A colour probe resolves light-dark() at its own scheme, so it is appended
  // inside the chart it is compared against (docs/QUIRKS.md).
  const tokenColour = (name, token) =>
    page.locator(`${pg(name)} .chart`).evaluate((host, token) => {
      const probe = document.createElement("span")
      probe.style.color = `var(${token})`
      host.appendChild(probe)
      const value = getComputedStyle(probe).color
      probe.remove()
      return value
    }, token)
  const hoverBand = async (name, index, count = 6) => {
    await page.locator(`${pg(name)} .chart-surface`).evaluate((el) => el.scrollIntoView({ block: "center" }))
    const box = await rect(`${pg(name)} .chart-surface`)
    const plotLeft = box.x
    const step = box.width / count
    await page.mouse.move(plotLeft + step * (index + 0.5), box.y + box.height * 0.5)
  }
  const tooltip = (name) => page.locator(`${pg(name)} .chart-tooltip`)

  // ── Bars ──

  await test("bars: one path per datum per series, filled from the config colour", async () => {
    eq(await page.locator(`${pg("chart-default")} .chart-bar`).count(), 12, "bar count")
    const fill = await page.locator(`${pg("chart-default")} .chart-series[data-key="desktop"] .chart-bar`).first().evaluate((el) => getComputedStyle(el).fill)
    const expected = await tokenColour("chart-default", "--chart-1")
    eq(fill, expected, "desktop fill")
    const mobile = await page.locator(`${pg("chart-default")} .chart-series[data-key="mobile"] .chart-bar`).first().evaluate((el) => getComputedStyle(el).fill)
    eq(mobile !== fill, true, "mobile bars take a different series colour")
  })

  await test("bars: heights are proportional to the data", async () => {
    const [jan, feb] = await barRects("chart-default", "desktop")
    near(feb.height, jan.height * (305 / 186), 1, "Feb/Jan = 305/186")
  })

  await test("bars: unstacked series share the baseline; stacked ones sit on each other", async () => {
    const [d] = await barRects("chart-default", "desktop")
    const [m] = await barRects("chart-default", "mobile")
    near(m.bottom, d.bottom, 0.5, "unstacked bottoms")
    const [sd] = await barRects("chart-stacked", "desktop")
    const [sm] = await barRects("chart-stacked", "mobile")
    near(sm.bottom, sd.y, 0.5, "stacked mobile starts at the desktop top")
    eq(sm.bottom < sd.bottom, true, "stacked mobile is above the baseline")
  })

  await test("bars: layout=vertical runs the bars across from the plot's left edge", async () => {
    const across = await barRects("chart-horizontal", "desktop")
    eq(across.length, 6)
    for (const b of across) near(b.x, across[0].x, 0.5, "shared left edge")
    eq(new Set(across.map((b) => Math.round(b.y))).size, 6, "distinct rows")
    const upright = await barRects("chart-default", "desktop")
    for (const b of upright) near(b.bottom, upright[0].bottom, 0.5, "upright bars share a bottom")
    eq(new Set(upright.map((b) => Math.round(b.height))).size > 1, true, "upright bars differ in height")
  })

  await test("bars: negatives hang from the zero line", async () => {
    // The tick's y attribute is the scale's zero in svg units; the glyph box
    // centre is not.
    const zero = await page
      .locator(`${pg("chart-negative")} .chart-tick-text`)
      .evaluateAll((els) => {
        const t = els.find((el) => el.textContent === "0")
        return t ? t.ownerSVGElement.getBoundingClientRect().y + Number(t.getAttribute("y")) : null
      })
    eq(zero != null, true, "a 0 tick exists")
    const bars = await barRects("chart-negative", "visitors")
    near(bars[0].bottom, zero, 1, "positive bar bottom = zero line")
    near(bars[2].y, zero, 1, "negative bar top = zero line")
    eq(bars[2].bottom > zero + 20, true, "negative bar extends below")
  })

  // ── Axes ──

  await test("axis: tick text is the tickFormatter output at 12px; hide drops the axis", async () => {
    const labels = await page.locator(`${pg("chart-default")} .chart-axis[data-axis="x"] .chart-tick-text`).allTextContents()
    eq(labels.join(","), "Jan,Feb,Mar,Apr,May,Jun")
    const size = await page.locator(`${pg("chart-default")} .chart-tick-text`).first().evaluate((el) => getComputedStyle(el).fontSize)
    eq(size, "12px")
    eq(await page.locator(`${pg("chart-horizontal")} .chart-axis[data-axis="x"]`).count(), 0, "hidden value axis")
    eq(await page.locator(`${pg("chart-horizontal")} .chart-axis[data-axis="y"] .chart-tick-text`).count(), 6, "category axis on the left")
    const yTicks = await page.locator(`${pg("chart-negative")} .chart-axis[data-axis="y"] .chart-tick-text`).allTextContents()
    eq(yTicks.includes("0") && yTicks.length >= 4, true, `y ticks ${yTicks.join(",")}`)
  })

  // ── Lines and areas ──

  await test("line: monotone emits cubics, linear does not; dots follow the dot prop", async () => {
    const mono = await page.locator(`${pg("chart-line-monotone")} .chart-line`).first().getAttribute("d")
    const linear = await page.locator(`${pg("chart-line-linear")} .chart-line`).first().getAttribute("d")
    eq(mono.includes("C"), true, "monotone has C")
    eq(linear.includes("C"), false, "linear has no C")
    eq(linear.startsWith("M"), true)
    eq(await page.locator(`${pg("chart-line-dots")} .chart-dot`).count(), 6, "dots")
    eq(await page.locator(`${pg("chart-line-linear")} .chart-dot`).count(), 0, "dot={false}")
  })

  await test("line: edge points sit inside the surface", async () => {
    const svg = await rect(`${pg("chart-line-dots")} .chart-surface`)
    const dots = await page.locator(`${pg("chart-line-dots")} .chart-dot`).evaluateAll((els) =>
      els.map((el) => el.getBoundingClientRect()).map((r) => ({ x: r.x, right: r.right })),
    )
    eq(dots[0].x >= svg.x, true, "first dot inside")
    eq(dots.at(-1).right <= svg.right, true, "last dot inside")
  })

  await test("area: closed path filled from a gradient that exists in the surface", async () => {
    const d = await page.locator(`${pg("chart-area")} .chart-area`).first().getAttribute("d")
    eq(d.trim().endsWith("Z"), true, "closed")
    const fill = await page.locator(`${pg("chart-area")} .chart-area`).first().getAttribute("fill")
    const m = fill.match(/^url\(#([\w-]+)\)$/)
    eq(!!m, true, `gradient fill, got ${fill}`)
    eq(await page.locator(`${pg("chart-area")} linearGradient#${m[1]}`).count(), 1, "gradient present")
    const stacked = await page.locator(`${pg("chart-area-stacked")} .chart-area`).count()
    eq(stacked, 2)
  })

  // ── Tooltip ──

  await test("tooltip: absent until hover, then names the band and both series", async () => {
    eq(await tooltip("chart-default").count(), 0, "none before hover")
    await hoverBand("chart-default", 1)
    await tooltip("chart-default").waitFor()
    eq(await page.locator(`${pg("chart-default")} .chart-tooltip-label`).textContent(), "February")
    const values = await page.locator(`${pg("chart-default")} .chart-tooltip-value`).allTextContents()
    eq(values.join(","), "305,200")
    eq(await tooltip("chart-default").evaluate((el) => getComputedStyle(el.parentElement).pointerEvents), "none")
    await page.mouse.move(0, 0)
    await tooltip("chart-default").waitFor({ state: "detached" })
  })

  await test("tooltip: the last band keeps the tooltip inside the chart", async () => {
    await hoverBand("chart-default", 5)
    await tooltip("chart-default").waitFor()
    const tip = await rect(`${pg("chart-default")} .chart-tooltip`)
    const chart = await rect(`${pg("chart-default")} .chart`)
    eq(tip.right <= chart.right + 0.5, true, `tooltip right ${tip.right} within chart ${chart.right}`)
    eq(tip.x >= chart.x - 0.5, true, "tooltip left within chart")
    await page.mouse.move(0, 0)
  })

  await test("tooltip: cursor band under the pointer, none with cursor={false}", async () => {
    await hoverBand("chart-default", 0)
    await page.locator(`${pg("chart-default")} .chart-cursor`).waitFor()
    const cursor = await rect(`${pg("chart-default")} .chart-cursor`)
    const [jan] = await barRects("chart-default", "desktop")
    eq(cursor.x <= jan.x && cursor.right >= jan.x + jan.width, true, "cursor spans the first band")
    await page.mouse.move(0, 0)
    await hoverBand("chart-tooltip-nocursor", 0)
    await tooltip("chart-tooltip-nocursor").waitFor()
    eq(await page.locator(`${pg("chart-tooltip-nocursor")} .chart-cursor`).count(), 0, "no cursor")
    await page.mouse.move(0, 0)
  })

  await test("tooltip: indicator variants and hideLabel", async () => {
    await hoverBand("chart-tooltip-dashed", 2)
    await tooltip("chart-tooltip-dashed").waitFor()
    const dashed = page.locator(`${pg("chart-tooltip-dashed")} .chart-tooltip-indicator`).first()
    eq(await dashed.evaluate((el) => getComputedStyle(el).borderTopStyle), "dashed")
    eq(await dashed.evaluate((el) => parseFloat(getComputedStyle(el).borderTopWidth) > 0), true, "dashed border has width")
    eq(await page.locator(`${pg("chart-tooltip-dashed")} .chart-tooltip-label`).count(), 0, "hideLabel")
    // Leaving the chart removes its tooltip, so the dashed reads are done above.
    await page.mouse.move(0, 0)
    await hoverBand("chart-default", 2)
    await tooltip("chart-default").waitFor()
    const dot = page.locator(`${pg("chart-default")} .chart-tooltip-indicator`).first()
    // The site reset leaves every border `solid` at width 0, so the width is
    // the fact here, not the style.
    eq(await dot.evaluate((el) => getComputedStyle(el).borderTopWidth), "0px", "dot has no border")
    const dotColour = await dot.evaluate((el) => getComputedStyle(el).backgroundColor)
    eq(dotColour, await tokenColour("chart-default", "--chart-1"), "indicator carries the series colour")
    await page.mouse.move(0, 0)
  })

  await test("tooltip: formatter and labelFormatter replace the text", async () => {
    await hoverBand("chart-tooltip-formatter", 0)
    await tooltip("chart-tooltip-formatter").waitFor()
    eq(await page.locator(`${pg("chart-tooltip-formatter")} .chart-tooltip-label`).textContent(), "January 2024")
    const rows = await page.locator(`${pg("chart-tooltip-formatter")} .pg-chart-formatted`).allTextContents()
    eq(rows[0], "desktop: 186 visitors")
    await page.mouse.move(0, 0)
  })

  // ── Keyboard ──

  await test("keyboard: accessibilityLayer focuses the surface and steps the tooltip", async () => {
    const svg = page.locator(`${pg("chart-keyboard")} .chart-surface`)
    eq(await svg.getAttribute("tabindex"), "0")
    eq(await svg.getAttribute("role"), "application")
    await svg.focus()
    await tooltip("chart-keyboard").waitFor()
    const label = () => page.locator(`${pg("chart-keyboard")} .chart-tooltip-label`).textContent()
    eq(await label(), "January", "focus seeds the first category")
    await page.keyboard.press("ArrowRight")
    await page.keyboard.press("ArrowRight")
    eq(await label(), "March")
    await page.keyboard.press("End")
    eq(await label(), "June")
    await page.keyboard.press("Home")
    eq(await label(), "January")
    await page.keyboard.press("Escape")
    await tooltip("chart-keyboard").waitFor({ state: "detached" })
  })

  await test("keyboard: without accessibilityLayer nothing is focusable and arrows do nothing", async () => {
    const svg = page.locator(`${pg("chart-default")} .chart-surface`)
    eq(await svg.getAttribute("tabindex"), null)
    eq(await svg.getAttribute("role"), null)
    await svg.evaluate((el) => el.focus())
    await page.keyboard.press("ArrowRight")
    await page.waitForTimeout(50)
    eq(await tooltip("chart-default").count(), 0)
    const labelled = page.locator(`${pg("chart-keyboard")} .chart-surface`)
    eq((await labelled.getAttribute("aria-label")).length > 0, true)
  })

  // ── Responsive ──

  await test("responsive: the surface follows its container width", async () => {
    const host = page.locator(pg("chart-default"))
    const widthOf = () => page.locator(`${pg("chart-default")} .chart-surface`).evaluate((el) => Number(el.getAttribute("width")))
    const plotWidth = () => page.locator(`${pg("chart-default")} .chart-plot`).evaluate((el) => el.clientWidth)
    await host.evaluate((el) => {
      // Both widths fit inside the preview panel (574px at the test viewport),
      // so the frame, not the panel, decides the surface width.
      el.style.width = "350px"
      el.style.maxWidth = "none"
    })
    await page.waitForFunction(() => {
      const el = document.querySelector('[data-pg="chart-default"] .chart-surface')
      return Number(el.getAttribute("width")) <= 350
    })
    const narrow = await widthOf()
    eq(narrow, await plotWidth(), "svg width = plot width at 350")
    await host.evaluate((el) => {
      el.style.width = "550px"
    })
    await page.waitForFunction(
      (prev) => Number(document.querySelector('[data-pg="chart-default"] .chart-surface').getAttribute("width")) > prev,
      narrow,
    )
    const wide = await widthOf()
    eq(wide, await plotWidth(), "svg width = plot width at 550")
    near(wide - narrow, 200, 2, "grew with the container")
    await host.evaluate((el) => {
      el.style.width = ""
      el.style.maxWidth = ""
    })
  })

  // ── Theme ──

  const fillOf = (name, key) =>
    page.locator(`${pg(name)} .chart-series[data-key="${key}"] .chart-bar`).first().evaluate((el) => getComputedStyle(el).fill)
  const schemeFills = async (scheme) => {
    // The site seeds its scheme at import time: emulate, then a real
    // navigation, never a toggle on a loaded page (tests/contrast.test.mjs).
    await page.emulateMedia({ colorScheme: scheme })
    await page.goto("about:blank")
    await open()
    return {
      themed: await fillOf("chart-theme", "desktop"),
      plain: await fillOf("chart-theme", "mobile"),
      style: await page.locator(`${pg("chart-theme")} .chart style`).evaluate((el) => el.textContent),
    }
  }

  await test("theme: { light, dark } flips with the scheme through light-dark(), a plain colour does not", async () => {
    const light = await schemeFills("light")
    const dark = await schemeFills("dark")
    eq(light.themed !== dark.themed, true, `themed ${light.themed} vs ${dark.themed}`)
    eq(light.plain, dark.plain, "plain colour key is scheme-independent")
    eq(light.style.includes("light-dark("), true, "emits light-dark()")
    eq(light.style.includes(".dark"), false, "no .dark selector")
    eq((light.style.match(/\[data-chart=/g) || []).length, 1, "one scoped rule")
    await page.emulateMedia({ colorScheme: "light" })
    await page.goto("about:blank")
    await open()
  })

  // ── Forced colours ──

  await test("forced-colors: series fills survive, tick text does not opt out", async () => {
    await page.emulateMedia({ forcedColors: "active" })
    const bar = page.locator(`${pg("chart-default")} .chart-series[data-key="desktop"] .chart-bar`).first()
    eq(await bar.evaluate((el) => getComputedStyle(el).forcedColorAdjust), "none")
    // Chrome's UA sheet gives svg text `preserve-parent-color`; the point is
    // that it is not opted out.
    eq(await page.locator(`${pg("chart-default")} .chart-tick-text`).first().evaluate((el) => getComputedStyle(el).forcedColorAdjust) !== "none", true)
    await bar.evaluate((el) => el.scrollIntoView({ block: "center" }))
    const clip = await bar.evaluate((el) => {
      const r = el.getBoundingClientRect()
      return { x: Math.round(r.x + r.width / 2) - 2, y: Math.round(r.y + r.height / 2) - 2, width: 4, height: 4 }
    })
    const shot = await page.screenshot({ clip })
    const [r, g, b] = await page.evaluate(async (b64) => {
      const img = new Image()
      img.src = `data:image/png;base64,${b64}`
      await img.decode()
      const canvas = document.createElement("canvas")
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext("2d")
      ctx.drawImage(img, 0, 0)
      const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height)
      let sum = [0, 0, 0]
      for (let i = 0; i < data.length; i += 4) sum = [sum[0] + data[i], sum[1] + data[i + 1], sum[2] + data[i + 2]]
      const n = data.length / 4
      return sum.map((v) => v / n)
    }, shot.toString("base64"))
    const chroma = Math.max(r, g, b) - Math.min(r, g, b)
    eq(chroma > 60, true, `bar paints in colour under forced-colors, got rgb(${r},${g},${b})`)
    await page.emulateMedia({ forcedColors: null })
  })
}
