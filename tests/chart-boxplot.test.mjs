export default async function run({ page, baseUrl, test, eq: strictEq, near }) {
  const eq = (actual, expected, message) =>
    strictEq(typeof actual === "object" && actual !== null ? JSON.stringify(actual) : actual, typeof expected === "object" && expected !== null ? JSON.stringify(expected) : expected, message)
  const pageErrors = []
  page.on("pageerror", (e) => pageErrors.push(e.message))

  await page.goto(`${baseUrl}/#chart-boxplot`)
  await page.waitForSelector('[data-pg="boxplot-bare"] .chart-boxplot-box')
  await page.waitForFunction(() =>
    [...document.querySelectorAll('[data-pg^="boxplot-"] .chart-surface')].every((svg) => svg.getAttribute("width") !== "320"),
  )

  const pg = (name) => `[data-pg="${name}"]`
  const group = (name, index) => `${pg(name)} .chart-boxplot-box-group[data-index="${index}"]`
  const svgSize = (name) =>
    page.locator(`${pg(name)} .chart-surface`).evaluate((el) => ({ width: Number(el.getAttribute("width")), height: Number(el.getAttribute("height")) }))
  const attrs = (locator, names) =>
    locator.evaluate((el, names) => Object.fromEntries(names.map((n) => [n, Number(el.getAttribute(n))])), names)
  const box = (name, index) => attrs(page.locator(`${group(name, index)} .chart-boxplot-box`), ["x", "y", "width", "height"])
  const median = (name, index) => attrs(page.locator(`${group(name, index)} .chart-boxplot-median`), ["x1", "x2", "y1", "y2"])
  const whisker = (name, index, end) => attrs(page.locator(`${group(name, index)} .chart-boxplot-whisker[data-end="${end}"]`), ["x1", "x2", "y1", "y2"])
  const cap = (name, index, end) => attrs(page.locator(`${group(name, index)} .chart-boxplot-cap[data-end="${end}"]`), ["x1", "x2", "y1", "y2"])
  const dots = (name, index) =>
    page.locator(`${group(name, index)} .chart-boxplot-outlier`).evaluateAll((els) => els.map((el) => ({ cx: Number(el.getAttribute("cx")), cy: Number(el.getAttribute("cy")), r: Number(el.getAttribute("r")), value: Number(el.dataset.value) })))
  const activeIndex = (name) =>
    page.locator(`${pg(name)} .chart-boxplot-box-group[data-active]`).evaluateAll((els) => els.map((el) => Number(el.dataset.index)))
  const valueTicks = async (name) => {
    const texts = await page.locator(`${pg(name)} [data-axis="value"] text`).allTextContents()
    return texts.map((t) => Number(t.replace(/,/g, "")))
  }
  const tooltip = (name) => page.locator(`${pg(name)} .chart-tooltip`)
  const hoverBox = async (name, index) => {
    await page.locator(`${group(name, index)} .chart-boxplot-box`).evaluate((el) => el.scrollIntoView({ block: "center" }))
    const b = await page.locator(`${group(name, index)} .chart-boxplot-box`).boundingBox()
    await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2)
  }
  const press = async (name, ...keys) => {
    for (const key of keys) await page.keyboard.press(key)
    return activeIndex(name)
  }
  const focusSurface = async (name) => {
    await page.locator(`${pg(name)} .chart-surface`).evaluate((el) => el.scrollIntoView({ block: "center" }))
    await page.locator(`${pg(name)} .chart-surface`).focus()
  }

  // The vertical demos: margin 5, value labels 48 wide, group labels 24 high, four boxes, gap 0.4.
  const vertical = async (name) => {
    const { width, height } = await svgSize(name)
    const plot = { x: 5 + 48, y: 5, width: width - 10 - 48, height: height - 10 - 24 }
    const ticks = await valueTicks(name)
    const [lo, hi] = [ticks[0], ticks[ticks.length - 1]]
    const y = (v) => plot.y + plot.height * (1 - (v - lo) / (hi - lo))
    const step = plot.width / 4
    const bw = step * 0.6
    const left = (i) => plot.x + (step - bw) / 2 + i * step
    return { plot, ticks, y, step, bw, left, mid: (i) => left(i) + bw / 2 }
  }

  // ── Geometry ──

  await test("box plot: box, median, whiskers and caps sit on the value scale", async () => {
    const name = "boxplot-default"
    const g = await vertical(name)
    // Alpha: R's quantile(c(12,14,15,15,16,17,18,19,20,21,45), type = 7) is 15, 17, 19.5; fences 8.25 and 26.25.
    eq(g.ticks[0] <= 2 && g.ticks[g.ticks.length - 1] >= 52, true, `axis covers the data: ${g.ticks}`)
    eq(await page.locator(`${pg(name)} .chart-boxplot-box`).count(), 4, "four boxes")
    const b = await box(name, 0)
    near(b.x, g.left(0), 0.01, "box left")
    near(b.width, g.bw, 0.01, "box width is the band")
    near(b.y, g.y(19.5), 0.01, "box top is Q3")
    near(b.height, g.y(15) - g.y(19.5), 0.01, "box height is the IQR")
    const m = await median(name, 0)
    near(m.y1, g.y(17), 0.01, "median height")
    eq(m.y1 === m.y2, true, "median is level")
    near(m.x1, g.left(0), 0.01, "median spans the box, left")
    near(m.x2, g.left(0) + g.bw, 0.01, "median spans the box, right")
    const high = await whisker(name, 0, "high")
    near(high.y1, g.y(19.5), 0.01, "upper whisker leaves the box top")
    near(high.y2, g.y(21), 0.01, "and ends at 21, the last value inside the fence, not the sample maximum 45")
    near(high.x1, g.mid(0), 0.01, "on the centre line")
    const low = await whisker(name, 0, "low")
    near(low.y2, g.y(15), 0.01, "lower whisker leaves the box bottom")
    near(low.y1, g.y(12), 0.01, "ends at the sample minimum")
    const capHigh = await cap(name, 0, "high")
    near(capHigh.y1, g.y(21), 0.01, "cap at the whisker end")
    near(capHigh.x2 - capHigh.x1, g.bw / 2, 0.01, "cap is half the box wide")
    near((capHigh.x1 + capHigh.x2) / 2, g.mid(0), 0.01, "centred")
    const beta = await box(name, 1)
    near(beta.x, g.left(1), 0.01, "second box on the second band")
    near(beta.y, g.y(35.25), 0.01, "Beta Q3 by type 7 interpolation: 33 + 0.75 * (36 - 33)")
    near((await median(name, 1)).y1, g.y(30.5), 0.01, "Beta median is the mean of 30 and 31")
  })

  await test("box plot: outliers are dots beyond the whiskers; a clean sample has none", async () => {
    const name = "boxplot-default"
    const g = await vertical(name)
    const alpha = await dots(name, 0)
    eq(alpha.length, 1, "Alpha has one outlier")
    near(alpha[0].cy, g.y(45), 0.01, "at its value")
    near(alpha[0].cx, g.mid(0), 0.01, "on the centre line")
    eq(alpha[0].r, 3, "radius")
    eq(alpha[0].cy < (await whisker(name, 0, "high")).y2, true, "above the whisker end")
    eq((await dots(name, 1)).length, 0, "Beta has none")
    const gamma = await dots(name, 2)
    eq(gamma.map((d) => d.value), [2], "Gamma's low outlier")
    near(gamma[0].cy, g.y(2), 0.01, "placed at 2")
  })

  await test("box plot: precomputed quartiles are drawn as given, with their own whiskers and outliers", async () => {
    const name = "boxplot-default"
    const g = await vertical(name)
    const b = await box(name, 3)
    near(b.y, g.y(33), 0.01, "Q3 as given")
    near(b.y + b.height, g.y(24), 0.01, "Q1 as given")
    near((await median(name, 3)).y1, g.y(28), 0.01, "median as given")
    near((await whisker(name, 3, "high")).y2, g.y(44), 0.01, "max as given")
    near((await whisker(name, 3, "low")).y1, g.y(18), 0.01, "min as given")
    const out = await dots(name, 3)
    eq(out.map((d) => d.value), [52], "outlier as given")
    near(out[0].cy, g.y(52), 0.01, "placed at 52")
  })

  await test("box plot: non-finite and non-numeric samples are dropped before the quartiles", async () => {
    const name = "boxplot-default"
    const g = await vertical(name)
    // Gamma holds NaN, null, Infinity and the string "15" among its numbers; the finite ones are 2, 8, 9, 10, 11, 12, 13, 14.
    const b = await box(name, 2)
    near(b.y, g.y(12.25), 0.01, "Q3 of the eight finite values")
    near(b.y + b.height, g.y(8.75), 0.01, "Q1 of the eight finite values")
    near((await median(name, 2)).y1, g.y(10.5), 0.01, "median")
    near((await whisker(name, 2, "high")).y2, g.y(14), 0.01, "Infinity did not stretch the whisker")
    eq((await dots(name, 2)).length, 1, "and did not become an outlier")
  })

  await test("box plot: minmax whiskers run to the extremes and drop the outlier dots of raw samples", async () => {
    const name = "boxplot-minmax"
    const g = await vertical(name)
    near((await whisker(name, 0, "high")).y2, g.y(45), 0.01, "Alpha's whisker reaches 45")
    near((await whisker(name, 0, "low")).y1, g.y(12), 0.01, "and 12")
    eq((await dots(name, 0)).length, 0, "no dot for 45")
    eq((await dots(name, 2)).length, 0, "none for Gamma's 2")
    near((await whisker(name, 2, "low")).y1, g.y(2), 0.01, "Gamma's whisker reaches 2")
    eq((await dots(name, 3)).map((d) => d.value), [52], "precomputed outliers are kept")
    near((await whisker(name, 3, "high")).y2, g.y(44), 0.01, "and its whiskers")
    const b = await box(name, 0)
    near(b.y, g.y(19.5), 0.01, "the box does not move")
    eq((await dots("boxplot-default", 0)).length, 1, "the default mode drew the dot")
  })

  await test("box plot: horizontal runs the value axis along the bottom and the groups down the left", async () => {
    const name = "boxplot-horizontal"
    const { width, height } = await svgSize(name)
    const plot = { x: 5 + 64, y: 5, width: width - 10 - 64, height: height - 10 - 24 }
    const x = (v) => plot.x + (plot.width * v) / 60
    const step = plot.height / 2
    const bw = step * 0.6
    const top = (i) => plot.y + (step - bw) / 2 + i * step
    eq(await valueTicks(name), [0, 10, 20, 30, 40, 50, 60], "domain [0, 60] ticks")
    const b = await box(name, 0)
    near(b.x, x(15), 0.01, "box starts at Q1")
    near(b.width, x(19.5) - x(15), 0.01, "and spans the IQR")
    near(b.y, top(0), 0.01, "first group on the first row")
    near(b.height, bw, 0.01, "thickness is the band")
    near((await box(name, 1)).y, top(1), 0.01, "second group below it")
    const m = await median(name, 0)
    near(m.x1, x(17), 0.01, "median across the box")
    near(m.y2 - m.y1, bw, 0.01, "spanning its thickness")
    const high = await whisker(name, 0, "high")
    near(high.x1, x(19.5), 0.01, "whisker leaves the box end")
    near(high.x2, x(45), 0.01, "whiskerRange 6 puts 45 inside the fence, so it ends the whisker")
    eq((await dots(name, 0)).length, 0, "so there is no dot (the default range drew one)")
    const names = await page.locator(`${pg(name)} [data-axis="category"] text`).allTextContents()
    eq(names, ["Alpha", "Beta"], "group names")
  })

  await test("box plot: an axis size of 0 leaves that axis's labels out", async () => {
    eq(await page.locator(`${pg("boxplot-bare")} [data-axis] text`).count(), 0, "no tick text")
    eq(await page.locator(`${pg("boxplot-default")} [data-axis] text`).count() > 0, true, "the default has labels")
    const { width } = await svgSize("boxplot-bare")
    const b = await box("boxplot-bare", 0)
    near(b.x, 5 + ((width - 10) / 2) * 0.2, 0.01, "plot starts at the margin")
  })

  // ── Tooltip and keyboard ──

  await test("box plot: the tooltip lists the five numbers and the outlier count", async () => {
    const name = "boxplot-default"
    await page.mouse.move(0, 0)
    eq(await tooltip(name).count(), 0, "none before hover")
    await hoverBox(name, 0)
    await tooltip(name).waitFor()
    eq(await page.locator(`${pg(name)} .chart-tooltip-label`).textContent(), "Alpha", "group name")
    eq(await page.locator(`${pg(name)} .chart-tooltip-name`).allTextContents(), ["Upper whisker", "Upper quartile", "Median", "Lower quartile", "Lower whisker", "Outliers"], "rows")
    eq(await page.locator(`${pg(name)} .chart-tooltip-value`).allTextContents(), ["21", "19.5", "17", "15", "12", "1"], "Alpha's numbers")
    eq(await activeIndex(name), [0], "the hovered box is marked")
    await hoverBox(name, 2)
    await page.waitForFunction(() => document.querySelector('[data-pg="boxplot-default"] .chart-tooltip-label')?.textContent === "Gamma")
    eq(await page.locator(`${pg(name)} .chart-tooltip-value`).allTextContents(), ["14", "12.25", "10.5", "8.75", "8", "1"], "Gamma's numbers, junk entries excluded")
    await hoverBox(name, 1)
    await page.waitForFunction(() => document.querySelector('[data-pg="boxplot-default"] .chart-tooltip-label')?.textContent === "Beta")
    eq((await page.locator(`${pg(name)} .chart-tooltip-value`).allTextContents()).pop(), "0", "no outliers is a count of 0")
    const surface = await page.locator(`${pg(name)} .chart-surface`).boundingBox()
    await page.mouse.move(surface.x + 10, surface.y + 60)
    await tooltip(name).waitFor({ state: "detached" })
    await page.mouse.move(0, 0)
    eq(await page.locator(`${pg("boxplot-minmax")} .chart-tooltip-name`).count(), 0, "another chart shows nothing")
    await hoverBox("boxplot-minmax", 0)
    await tooltip("boxplot-minmax").waitFor()
    eq((await page.locator(`${pg("boxplot-minmax")} .chart-tooltip-name`).first().textContent()), "Maximum", "minmax names the whisker ends")
    eq((await page.locator(`${pg("boxplot-minmax")} .chart-tooltip-value`).first().textContent()), "45", "Alpha's maximum")
    await hoverBox("boxplot-minmax", 3)
    await page.waitForFunction(() => document.querySelector('[data-pg="boxplot-minmax"] .chart-tooltip-label')?.textContent === "Delta")
    eq((await page.locator(`${pg("boxplot-minmax")} .chart-tooltip-name`).first().textContent()), "Upper whisker", "a precomputed box keeps its whisker names under minmax")
    await page.mouse.move(0, 0)
  })

  await test("box plot: precomputed quartiles with no min or max end the whiskers on the box", async () => {
    const name = "boxplot-quartiles-only"
    const b = await box(name, 0)
    near((await whisker(name, 0, "high")).y2, b.y, 0.01, "upper whisker ends at Q3")
    near((await whisker(name, 0, "low")).y1, b.y + b.height, 0.01, "lower whisker ends at Q1")
    await hoverBox(name, 0)
    await tooltip(name).waitFor()
    eq(await page.locator(`${pg(name)} .chart-tooltip-value`).allTextContents(), ["15", "15", "12", "10", "10", "0"], "whisker values are the quartiles")
    await page.mouse.move(0, 0)
  })

  await test("box plot: arrows step between boxes and hold at the ends", async () => {
    const name = "boxplot-default"
    await focusSurface(name)
    eq(await activeIndex(name), [0], "focus lands on the first box")
    eq(await press(name, "ArrowRight"), [1], "right")
    eq(await press(name, "ArrowRight", "ArrowRight"), [3], "to the last")
    eq(await press(name, "ArrowRight"), [3], "stops at the end")
    eq(await press(name, "ArrowLeft"), [2], "left")
    eq(await press(name, "Home"), [0], "Home")
    eq(await press(name, "ArrowLeft"), [0], "stops at the start")
    eq(await press(name, "End"), [3], "End")
    await page.waitForSelector(`${pg(name)} .chart-tooltip`)
    eq(await page.locator(`${pg(name)} .chart-tooltip-label`).textContent(), "Delta", "tooltip follows the keyboard")
    eq(await press(name, "Escape"), [], "Escape clears")
    await page.locator(`${pg(name)} .chart-surface`).evaluate((el) => el.blur())
  })

  await test("box plot: horizontal charts also step on the up and down arrows", async () => {
    const name = "boxplot-horizontal"
    await focusSurface(name)
    eq(await activeIndex(name), [0], "focus lands on the first box")
    eq(await press(name, "ArrowDown"), [1], "down is the next group")
    eq(await press(name, "ArrowDown"), [1], "stops at the last")
    eq(await press(name, "ArrowUp"), [0], "up")
    eq(await press(name, "ArrowUp"), [0], "stops at the first")
    eq(await press(name, "ArrowRight"), [1], "left and right still step")
    await page.locator(`${pg(name)} .chart-surface`).evaluate((el) => el.blur())
  })
  await test("box plot: right to left keeps the boxes left to right, and the arrows follow the screen", async () => {
    const name = "boxplot-rtl"
    eq(await page.locator(pg(name)).evaluate((el) => getComputedStyle(el).direction), "rtl", "the fixture is right to left")
    eq(await page.locator(`${pg(name)} .chart-surface`).evaluate((el) => getComputedStyle(el).direction), "ltr", "the svg keeps the plot's own direction")
    const [first, second] = [await box(name, 0), await box(name, 1)]
    eq(second.x > first.x, true, "the second box is drawn right of the first")
    await focusSurface(name)
    eq(await activeIndex(name), [0])
    eq(await press(name, "ArrowRight"), [1], "ArrowRight moves to the box on the right")
    eq(await press(name, "ArrowLeft"), [0], "ArrowLeft moves back")
    await press(name, "Escape")
    await page.locator(`${pg(name)} .chart-surface`).evaluate((el) => el.blur())
  })

  await test("box plot: ChartLegend lists the box entry under its config label, in the config colour", async () => {
    const name = "boxplot-legend"
    eq(await page.locator(`${pg(name)} .chart-legend-item`).allTextContents(), ["Latency"])
    eq(await page.locator(`${pg(name)} .chart-legend-swatch`).evaluate((el) => getComputedStyle(el).backgroundColor), "rgb(200, 30, 30)")
  })

  await test("box plot: a config colour other than the fallback paints the box, whiskers and dots", async () => {
    const paint = (selector, prop) => page.locator(`${group("boxplot-legend", 0)} ${selector}`).first().evaluate((el, prop) => getComputedStyle(el)[prop], prop)
    eq(await paint(".chart-boxplot-box", "stroke"), "rgb(200, 30, 30)")
    eq(await paint(".chart-boxplot-whisker", "stroke"), "rgb(200, 30, 30)")
    eq(await paint(".chart-boxplot-outlier", "stroke"), "rgb(200, 30, 30)")
    eq((await paint(".chart-boxplot-box", "stroke")) === (await page.locator(`${group("boxplot-default", 0)} .chart-boxplot-box`).evaluate((el) => getComputedStyle(el).stroke)), false, "the default fixture keeps the palette colour")
  })

  await test("box plot: syncId shares the active box between charts, by index", async () => {
    await hoverBox("boxplot-sync-a", 1)
    await page.waitForFunction(() => document.querySelector('[data-pg="boxplot-sync-b"] .chart-boxplot-box-group[data-active]'))
    eq(await activeIndex("boxplot-sync-a"), [1])
    eq(await activeIndex("boxplot-sync-b"), [1], "the second chart marks the same index")
    await page.mouse.move(0, 0)
    await page.waitForFunction(() => !document.querySelector('[data-pg^="boxplot-sync"] .chart-boxplot-box-group[data-active]'))
  })

  await test("forced-colors: box, whiskers, median and dots stroke in the text colour", async () => {
    const stroke = (selector) => page.locator(`${group("boxplot-default", 0)} ${selector}`).first().evaluate((el) => getComputedStyle(el).stroke)
    const boxStroke = await stroke(".chart-boxplot-box")
    eq(boxStroke === "rgb(0, 0, 0)" || boxStroke === "rgb(255, 255, 255)", false, "precondition: outside forced colours the edge is the palette colour")
    await page.emulateMedia({ forcedColors: "active" })
    try {
      const canvasText = await page.locator(`${group("boxplot-default", 0)} .chart-boxplot-box`).evaluate((el) => {
        const probe = document.createElementNS("http://www.w3.org/2000/svg", "rect")
        probe.style.stroke = "CanvasText"
        el.parentNode.appendChild(probe)
        const c = getComputedStyle(probe).stroke
        probe.remove()
        return c
      })
      const canvas = await page.locator(`${group("boxplot-default", 0)} .chart-boxplot-box`).evaluate((el) => {
        const probe = document.createElementNS("http://www.w3.org/2000/svg", "rect")
        probe.style.fill = "Canvas"
        el.parentNode.appendChild(probe)
        const c = getComputedStyle(probe).fill
        probe.remove()
        return c
      })
      for (const selector of [".chart-boxplot-box", ".chart-boxplot-outlier"]) {
        eq(await page.locator(`${group("boxplot-default", 0)} ${selector}`).first().evaluate((el) => getComputedStyle(el).fill), canvas, `${selector} fills with Canvas`)
      }
      for (const selector of [".chart-boxplot-box", ".chart-boxplot-whisker", ".chart-boxplot-cap", ".chart-boxplot-median", ".chart-boxplot-outlier"]) {
        eq(await stroke(selector), canvasText, `${selector} strokes in CanvasText`)
      }
    } finally {
      await page.emulateMedia({ forcedColors: null })
    }
  })

  await test("box plot: a group of only junk samples keeps its slot and name, draws no box, and the keyboard steps through it", async () => {
    const name = "boxplot-junk"
    const errors = []
    const onError = (e) => errors.push(e.message)
    page.on("pageerror", onError)
    try {
      const { width } = await svgSize(name)
      const plotWidth = width - 10 - 48
      const step = plotWidth / 3
      const bw = step * 0.6
      eq(await page.locator(`${pg(name)} .chart-boxplot-box`).count(), 2, "two boxes, none for the empty group")
      eq(await page.locator(`${group(name, 1)} .chart-boxplot-box`).count(), 0)
      eq(await page.locator(`${pg(name)} [data-axis="category"] text`).allTextContents(), ["Alpha", "Empty", "Beta"], "the empty group keeps its label")
      near((await box(name, 0)).x, 5 + 48 + (step - bw) / 2, 0.01, "first box in its slot")
      near((await box(name, 2)).x, 5 + 48 + (step - bw) / 2 + 2 * step, 0.01, "third box in the third slot")
      await focusSurface(name)
      eq(await press(name, "ArrowRight"), [], "the empty slot is a stop with no box to mark")
      eq(await press(name, "ArrowRight"), [2], "and the next arrow reaches the real box")
      await press(name, "Escape")
      await page.locator(`${pg(name)} .chart-surface`).evaluate((el) => el.blur())
      eq(errors, [], "no error thrown")
    } finally {
      page.off("pageerror", onError)
    }
  })

  await test("box plot: values or outliers that are not arrays draw nothing and throw nothing", async () => {
    const name = "boxplot-odd-values"
    eq(await page.locator(`${pg(name)} .chart-boxplot-box`).count(), 2, "Alpha and the quartile datum; the scalar group has no box")
    eq(await page.locator(`${group(name, 1)} .chart-boxplot-box`).count(), 0)
    eq(await page.locator(`${pg(name)} [data-axis="category"] text`).allTextContents(), ["Alpha", "Scalar", "Dots"])
    eq(await page.locator(`${group(name, 2)} .chart-boxplot-outlier`).count(), 0, "a scalar outliers draws no dots")
    eq(pageErrors, [], "no error thrown")
  })

  await test("box plot: a synced index past this chart's end counts as none on both arrow pairs", async () => {
    const big = "boxplot-sync-big"
    const small = "boxplot-sync-small"
    await hoverBox(big, 1)
    await page.waitForFunction(() => document.querySelector('[data-pg="boxplot-sync-small"] .chart-boxplot-box-group[data-active]')?.dataset.index === "1")
    eq(await activeIndex(small), [1], "precondition: the small chart receives the shared index")
    await page.mouse.move(0, 0)
    await page.waitForFunction(() => !document.querySelector('[data-pg="boxplot-sync-small"] .chart-boxplot-box-group[data-active]'))
    const land = async (key) => {
      await hoverBox(big, 3)
      await page.waitForFunction(() => document.querySelector('[data-pg="boxplot-sync-big"] .chart-boxplot-box-group[data-active]')?.dataset.index === "3")
      eq(await activeIndex(small), [], "the small chart holds an index it has no box for")
      await page.locator(`${pg(small)} .chart-surface`).evaluate((el) => el.focus({ preventScroll: true }))
      const result = await press(small, key)
      await page.locator(`${pg(small)} .chart-surface`).evaluate((el) => el.blur())
      await page.mouse.move(0, 0)
      return result
    }
    const down = await land("ArrowDown")
    const right = await land("ArrowRight")
    eq(down, right, "ArrowDown and ArrowRight agree")
    eq(down, [0], "an index past the end counts as none, so forward lands on the first box")
    const up = await land("ArrowUp")
    const left = await land("ArrowLeft")
    eq(up, left, "ArrowUp and ArrowLeft agree")
    eq(up, [1], "and back lands on the last box")
  })

  await test("box plot: the active box is stroked in the foreground, 2 wide; in forced colours, in Highlight", async () => {
    const name = "boxplot-default"
    const paint = (index) => page.locator(`${group(name, index)} .chart-boxplot-box`).evaluate((el) => ({ stroke: getComputedStyle(el).stroke, width: getComputedStyle(el).strokeWidth }))
    const resolved = (index, value) =>
      page.locator(`${group(name, index)} .chart-boxplot-box`).evaluate((el, value) => {
        const probe = document.createElementNS("http://www.w3.org/2000/svg", "rect")
        probe.style.stroke = value
        el.parentNode.appendChild(probe)
        const c = getComputedStyle(probe).stroke
        probe.remove()
        return c
      }, value)
    await focusSurface(name)
    try {
      eq(await activeIndex(name), [0])
      const [active, inactive] = [await paint(0), await paint(1)]
      eq(active.stroke, await resolved(0, "var(--foreground)"), "active box stroke is --foreground")
      eq(active.width, "2px")
      eq(inactive.stroke === active.stroke, false, "counter-precondition: an inactive box keeps its own colour")
      eq(inactive.width, "1.5px")
      await page.emulateMedia({ forcedColors: "active" })
      try {
        eq((await paint(0)).stroke, await resolved(0, "Highlight"), "active box stroke is Highlight")
        eq((await paint(1)).stroke, await resolved(1, "CanvasText"), "an inactive box stays CanvasText")
      } finally {
        await page.emulateMedia({ forcedColors: null })
      }
    } finally {
      await page.locator(`${pg(name)} .chart-surface`).evaluate((el) => el.blur())
    }
  })

  await test("box plot: categoryKey, valuesKey, tickCount, categoryGap and margin shape the plot", async () => {
    const name = "boxplot-options"
    const ref = "boxplot-default"
    eq(await page.locator(`${pg(name)} .chart-boxplot-box`).count(), 3, "a box per datum, read from its own fields")
    eq(await page.locator(`${pg(name)} [data-axis="category"] text`).allTextContents(), ["North", "South", "East"])
    const ticks = await valueTicks(name)
    eq(ticks.length < (await valueTicks(ref)).length, true, `tickCount 3 gives fewer ticks than the default 5: ${ticks} vs ${await valueTicks(ref)}`)
    const { width } = await svgSize(name)
    const plotWidth = width - 20 - 20 - 48
    const step = plotWidth / 3
    const bw = step * 0.9
    const b = await box(name, 0)
    near(b.width, bw, 0.01, "categoryGap 0.1 leaves 90% of the slot to the box")
    near(b.x, 20 + 48 + (step - bw) / 2, 0.01, "the left margin of 20 moves the plot in")
    const refBox = await box(ref, 0)
    const refWidth = (await svgSize(ref)).width
    near(refBox.width, ((refWidth - 10 - 48) / 4) * 0.6, 0.01, "the default gap leaves 60%")
    const grid = await page.locator(`${pg(name)} .chart-grid`).first().evaluate((el) => ({ x1: Number(el.getAttribute("x1")), x2: Number(el.getAttribute("x2")) }))
    near(grid.x1, 68, 0.01, "grid starts at margin plus value axis")
    near(grid.x2, width - 20, 0.01, "and ends at the right margin")
    const topLine = await page.locator(`${pg(name)} .chart-grid`).evaluateAll((els) => Math.min(...els.map((el) => Number(el.getAttribute("y1")))))
    eq(topLine >= 10, true, "the top margin of 10 keeps the plot below it")
  })
}
