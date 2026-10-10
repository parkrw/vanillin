export default async function run({ page, baseUrl, test, eq: strictEq, near }) {
  const eq = (actual, expected, message) =>
    strictEq(typeof actual === "object" && actual !== null ? JSON.stringify(actual) : actual, typeof expected === "object" && expected !== null ? JSON.stringify(expected) : expected, message)
  const pageErrors = []
  page.on("pageerror", (e) => pageErrors.push(e.message))

  await page.goto(`${baseUrl}/#chart-funnel`)
  await page.waitForSelector('[data-pg="funnel-default"] .chart-funnel-stage')
  await page.waitForFunction(() =>
    [...document.querySelectorAll('[data-pg^="funnel-"] .chart-surface')].every((svg) => svg.getAttribute("width") !== "320"),
  )

  const pg = (name) => `[data-pg="${name}"]`
  const group = (name, index) => `${pg(name)} .chart-funnel-stage-group[data-index="${index}"]`
  const svgSize = (name) =>
    page.locator(`${pg(name)} .chart-surface`).evaluate((el) => ({ width: Number(el.getAttribute("width")), height: Number(el.getAttribute("height")) }))
  const shape = (name, index) =>
    page.locator(`${group(name, index)} .chart-funnel-stage`).evaluate((el) => ({
      points: el.getAttribute("points").split(" ").map((p) => p.split(",").map(Number)),
      top: Number(el.dataset.topWidth),
      bottom: Number(el.dataset.bottomWidth),
    }))
  const stageData = (name, index) => page.locator(group(name, index)).evaluate((el) => ({ ...el.dataset }))
  const texts = (name, index, cls) => page.locator(`${group(name, index)} .${cls}`).allTextContents()
  const activeIndex = (name) =>
    page.locator(`${pg(name)} .chart-funnel-stage-group[data-active]`).evaluateAll((els) => els.map((el) => Number(el.dataset.index)))
  const tooltip = (name) => page.locator(`${pg(name)} .chart-tooltip`)
  const hoverStage = async (name, index) => {
    await page.locator(`${group(name, index)} .chart-funnel-stage`).evaluate((el) => el.scrollIntoView({ block: "center" }))
    const b = await page.locator(`${group(name, index)} .chart-funnel-stage`).boundingBox()
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
  const blur = (name) => page.locator(`${pg(name)} .chart-surface`).evaluate((el) => el.blur())

  // The default fixture: margin 5, labels 168 wide, four stages, gap 4.
  const layout = async (name, { labels = 168, gap = 4, count = 4 } = {}) => {
    const { width, height } = await svgSize(name)
    const plot = { x: 5, y: 5, width: width - 10 - labels, height: height - 10 }
    const step = plot.height / count
    return { plot, step, row: step - gap, centre: plot.x + plot.width / 2, top: (i) => plot.y + i * step }
  }

  // ── Geometry ──

  await test("funnel: each stage's top edge is as wide as its value, centred on the plot", async () => {
    const name = "funnel-default"
    const g = await layout(name)
    eq(await page.locator(`${pg(name)} .chart-funnel-stage`).count(), 4, "four stages")
    for (const [i, value] of [1000, 400, 200, 50].entries()) {
      const s = await shape(name, i)
      near(s.top, (g.plot.width * value) / 1000, 0.01, `stage ${i} top width is ${value} / 1000 of the plot`)
      near(s.points[1][0] - s.points[0][0], s.top, 0.01, `stage ${i} drawn top edge matches`)
      near((s.points[0][0] + s.points[1][0]) / 2, g.centre, 0.01, `stage ${i} centred`)
      near(s.points[0][1], g.top(i), 0.01, `stage ${i} top y`)
      near(s.points[2][1] - s.points[0][1], g.row, 0.01, `stage ${i} height is the step less the gap`)
    }
    const [a, b] = [await shape(name, 0), await shape(name, 1)]
    near(b.top / a.top, 0.4, 0.001, "widths are in the ratio of the values")
    eq(g.plot.width > 100, true, "precondition: the plot is wide enough for the ratios to be measurable")
  })

  await test("funnel: a stage's bottom edge meets the next stage's top; the last is a rectangle", async () => {
    const name = "funnel-default"
    for (const i of [0, 1, 2]) {
      const [s, next] = [await shape(name, i), await shape(name, i + 1)]
      near(s.bottom, next.top, 0.01, `stage ${i} bottom is stage ${i + 1} top`)
      near(s.points[2][0] - s.points[3][0], s.bottom, 0.01, `stage ${i} drawn bottom edge matches`)
      eq(s.bottom < s.top, true, `stage ${i} narrows`)
    }
    const last = await shape(name, 3)
    near(last.bottom, last.top, 0.01, "the last stage keeps its width")
    near(last.points[3][0], last.points[0][0], 0.01, "square on the left")
  })

  await test("funnel: labels give name, value, and conversion from the previous stage and from the first", async () => {
    const name = "funnel-default"
    eq(await texts(name, 0, "chart-funnel-label"), ["Visits: 1,000"], "first label")
    eq(await texts(name, 0, "chart-funnel-rate"), [], "the first stage has no rate")
    eq(await texts(name, 1, "chart-funnel-rate"), ["40% of previous · 40% of first"])
    eq(await texts(name, 2, "chart-funnel-rate"), ["50% of previous · 20% of first"])
    eq(await texts(name, 3, "chart-funnel-label"), ["Paid: 50"])
    eq(await texts(name, 3, "chart-funnel-rate"), ["25% of previous · 5% of first"])
    const d = await stageData(name, 2)
    eq([d.value, d.stepRate, d.overallRate], ["200", "50", "20"], "the same figures as data attributes")
    eq((await stageData(name, 0)).overallRate, undefined, "counter-precondition: the first stage carries no overall rate")
  })

  await test("funnel: nameKey, valueKey, formatter, stageGap and labelSize shape the chart", async () => {
    const name = "funnel-options"
    const g = await layout(name, { labels: 200, gap: 12, count: 3 })
    eq(await texts(name, 0, "chart-funnel-label"), ["Quoted: 80 orders"])
    eq(await texts(name, 1, "chart-funnel-rate"), ["75% of previous · 75% of first"])
    const s = await shape(name, 1)
    near(s.top, (g.plot.width * 60) / 80, 0.01, "widths follow valueKey")
    near(s.points[2][1] - s.points[0][1], g.row, 0.01, "the gap is 12")
    const bare = "funnel-bare"
    const b = await layout(bare, { labels: 0 })
    eq(await page.locator(`${pg(bare)} .chart-funnel-label`).count(), 0, "labelSize 0 leaves the labels out")
    eq(await page.locator(`${pg(bare)} .chart-funnel-rate`).count(), 0)
    near((await shape(bare, 0)).top, b.plot.width, 0.01, "and gives the plot the room")
    eq(await page.locator(`${pg("funnel-default")} .chart-funnel-label`).count(), 4, "counter-precondition: the default chart keeps its labels")
  })

  await test("funnel: a stage that grew, or has no usable value, is drawn as given with blank rates", async () => {
    const name = "funnel-odd"
    eq(await page.locator(`${pg(name)} .chart-funnel-stage`).count(), 3, "Missing and Negative have no shape")
    eq(await page.locator(`${group(name, 2)} .chart-funnel-stage`).count(), 0, "precondition: the stage is there, without a shape")
    eq(await texts(name, 2, "chart-funnel-label"), ["Missing: No value"])
    eq(await texts(name, 3, "chart-funnel-label"), ["Negative: No value"])
    eq(await texts(name, 1, "chart-funnel-rate"), ["150% of previous · 150% of first"], "growth is over 100%")
    const [seen, grew] = [await shape(name, 0), await shape(name, 1)]
    near(grew.top / seen.top, 1.5, 0.001, "and wider than the stage before")
    near(grew.bottom, grew.top, 0.01, "a stage followed by one with no value is a rectangle")
    eq(await texts(name, 4, "chart-funnel-rate"), ["0% of first"], "no rate against a stage with no value, but zero of the first is 0%")
    eq((await shape(name, 4)).top, 0, "a zero stage has no width")
  })

  // ── Tooltip and keyboard ──

  await test("funnel: the tooltip lists the value and both conversion rates", async () => {
    const name = "funnel-default"
    await page.mouse.move(0, 0)
    eq(await tooltip(name).count(), 0, "none before hover")
    await hoverStage(name, 1)
    await tooltip(name).waitFor()
    eq(await page.locator(`${pg(name)} .chart-tooltip-label`).textContent(), "Sign-ups", "stage name")
    eq(await page.locator(`${pg(name)} .chart-tooltip-name`).allTextContents(), ["Sign-ups", "Of previous stage", "Of first stage"])
    eq(await page.locator(`${pg(name)} .chart-tooltip-value`).allTextContents(), ["400", "40%", "40%"])
    eq(await activeIndex(name), [1], "the hovered stage is marked")
    await hoverStage(name, 0)
    await page.waitForFunction(() => document.querySelector('[data-pg="funnel-default"] .chart-tooltip-label')?.textContent === "Visits")
    eq(await page.locator(`${pg(name)} .chart-tooltip-name`).allTextContents(), ["Visits"], "the first stage has no rates")
    await page.mouse.move(0, 0)
    await tooltip(name).waitFor({ state: "detached" })
  })

  await test("funnel: arrows step down the stages and hold at the ends", async () => {
    const name = "funnel-default"
    await focusSurface(name)
    eq(await activeIndex(name), [0], "focus lands on the first stage")
    eq(await press(name, "ArrowDown"), [1], "down")
    eq(await press(name, "ArrowDown", "ArrowDown"), [3], "to the last")
    eq(await press(name, "ArrowDown"), [3], "stops at the end")
    eq(await press(name, "ArrowUp"), [2], "up")
    eq(await press(name, "Home"), [0], "Home")
    eq(await press(name, "ArrowUp"), [0], "stops at the start")
    eq(await press(name, "ArrowRight"), [1], "right also steps forward")
    eq(await press(name, "ArrowLeft"), [0], "left steps back")
    eq(await press(name, "End"), [3], "End")
    await page.waitForSelector(`${pg(name)} .chart-tooltip`)
    eq(await page.locator(`${pg(name)} .chart-tooltip-label`).textContent(), "Paid", "tooltip follows the keyboard")
    eq(await press(name, "Escape"), [], "Escape clears")
    await blur(name)
    eq(await page.locator(`${pg("funnel-bare")} .chart-surface`).getAttribute("tabindex"), null, "counter-precondition: a chart without accessibilityLayer is not focusable")
  })

  await test("funnel: a generated summary is wired to the chart unless the page supplies one", async () => {
    const name = "funnel-default"
    const svg = page.locator(`${pg(name)} .chart-surface`)
    const id = await svg.getAttribute("aria-describedby")
    eq(Boolean(id), true, "described")
    const summary = page.locator(`#${id}`)
    eq(await summary.evaluate((el) => el.hidden), true, "hidden from sight")
    eq(
      await summary.textContent(),
      "Funnel of 4 stages. Visits 1,000; Sign-ups 400, 40% of previous, 40% of first; Trials 200, 50% of previous, 20% of first; Paid 50, 25% of previous, 5% of first.",
    )
    eq(await page.locator(`${pg("funnel-described")} .chart-surface`).getAttribute("aria-describedby"), "funnel-note", "the page's own summary wins")
    eq(await page.locator(`${pg("funnel-described")} .chart-funnel-summary`).count(), 0, "and nothing is generated beside it")
    eq(await page.locator(`${pg("funnel-bare")} .chart-surface`).getAttribute("aria-describedby"), null, "counter-precondition: no layer, no summary")
  })

  // ── Colour, direction, sync ──

  await test("funnel: ChartLegend lists the funnel entry, and its config colour paints the stages", async () => {
    const name = "funnel-legend"
    eq(await page.locator(`${pg(name)} .chart-legend-item`).allTextContents(), ["Customers"])
    const fill = (n) => page.locator(`${group(n, 0)} .chart-funnel-stage`).evaluate((el) => getComputedStyle(el).fill)
    eq(await fill(name), "rgb(200, 30, 30)")
    eq((await fill("funnel-default")) === "rgb(200, 30, 30)", false, "the default fixture keeps the palette colour")
  })

  await test("funnel: right to left keeps the plot as drawn, and the arrows keep their order", async () => {
    const name = "funnel-rtl"
    eq(await page.locator(pg(name)).evaluate((el) => getComputedStyle(el).direction), "rtl", "the fixture is right to left")
    eq(await page.locator(`${pg(name)} .chart-surface`).evaluate((el) => getComputedStyle(el).direction), "ltr", "the svg keeps the plot's direction")
    const g = await layout(name)
    near((await shape(name, 0)).points[0][0], g.centre - (await shape(name, 0)).top / 2, 0.01, "stage still centred on the plot")
    await focusSurface(name)
    eq(await activeIndex(name), [0])
    eq(await press(name, "ArrowRight"), [1], "ArrowRight still moves forward: the stages run down, not across")
    eq(await press(name, "ArrowLeft"), [0], "ArrowLeft moves back")
    eq(await press(name, "ArrowDown"), [1], "down still goes to the next stage")
    await press(name, "Escape")
    await blur(name)
  })

  await test("funnel: syncId shares the active stage, and an index past the smaller chart counts as none", async () => {
    const [big, small] = ["funnel-sync-a", "funnel-sync-b"]
    await hoverStage(big, 1)
    await page.waitForFunction(() => document.querySelector('[data-pg="funnel-sync-b"] .chart-funnel-stage-group[data-active]'))
    eq(await activeIndex(small), [1], "the second chart marks the same index")
    await page.mouse.move(0, 0)
    await page.waitForFunction(() => !document.querySelector('[data-pg^="funnel-sync"] .chart-funnel-stage-group[data-active]'))
    const land = async (key) => {
      await hoverStage(big, 3)
      await page.waitForFunction(() => document.querySelector('[data-pg="funnel-sync-a"] .chart-funnel-stage-group[data-active]')?.dataset.index === "3")
      eq(await activeIndex(small), [], "the small chart holds an index it has no stage for")
      await page.locator(`${pg(small)} .chart-surface`).evaluate((el) => el.focus({ preventScroll: true }))
      const result = await press(small, key)
      await blur(small)
      await page.mouse.move(0, 0)
      return result
    }
    eq(await land("ArrowDown"), [0], "forward lands on the first stage")
    eq(await land("ArrowUp"), [1], "back lands on the last")
  })

  await test("funnel: the active stage is stroked in the foreground, 2 wide; in forced colours, in Highlight", async () => {
    const name = "funnel-default"
    const paint = (index) => page.locator(`${group(name, index)} .chart-funnel-stage`).evaluate((el) => ({ stroke: getComputedStyle(el).stroke, width: getComputedStyle(el).strokeWidth }))
    const resolved = (value) =>
      page.locator(`${group(name, 0)} .chart-funnel-stage`).evaluate((el, value) => {
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
      eq(active.stroke, await resolved("var(--foreground)"), "active stage stroke is --foreground")
      eq(active.width, "2px")
      eq(inactive.stroke, "none", "counter-precondition: an inactive stage has no stroke")
      await page.emulateMedia({ forcedColors: "active" })
      try {
        eq((await paint(0)).stroke, await resolved("Highlight"), "active stage stroke is Highlight")
        eq((await paint(1)).stroke, await resolved("CanvasText"), "an inactive stage is edged in CanvasText")
      } finally {
        await page.emulateMedia({ forcedColors: null })
      }
    } finally {
      await blur(name)
    }
  })

  await test("funnel: the page raised no errors", async () => {
    eq(pageErrors, [])
  })
}
