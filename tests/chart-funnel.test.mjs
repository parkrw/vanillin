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

  // The default fixture: margin 5, labels 240 wide, four stages, gap 4.
  const layout = async (name, { labels = 240, gap = 4, count = 4 } = {}) => {
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

  await test("funnel: a rate near 0% or 100% widens its decimals rather than print as either", async () => {
    const name = "funnel-precise"
    eq(await texts(name, 1, "chart-funnel-rate"), ["99.96% of previous · 99.96% of first"], "9996 in 10000 is not 100%")
    eq(await texts(name, 2, "chart-funnel-rate"), ["0.03% of previous · 0.03% of first"], "300 in a million is not 0%")
    eq(await texts("funnel-odd", 1, "chart-funnel-rate"), ["150% of previous · 150% of first"], "counter-precondition: a rate far from the ends keeps one decimal at most")
  })

  await test("funnel: at the default labelSize every label line ends inside the chart", async () => {
    for (const name of ["funnel-default", "funnel-odd", "funnel-precise"]) {
      const overflow = await page.locator(pg(name)).evaluate((frame) => {
        const svg = frame.querySelector(".chart-surface")
        const right = svg.getBoundingClientRect().right
        const lines = [...svg.querySelectorAll(".chart-funnel-label, .chart-funnel-rate")]
        return { count: lines.length, past: lines.filter((el) => el.getBoundingClientRect().right > right + 0.5).map((el) => el.textContent) }
      })
      eq(overflow.count > 0, true, `precondition: ${name} has labels`)
      eq(overflow.past, [], `${name}: no line runs past the svg`)
    }
  })

  await test("funnel: margin insets the plot, a bad stageGap or labelSize is tamed, the legend sits on top, aria-labelledby names it", async () => {
    const name = "funnel-margin"
    const { width, height } = await svgSize(name)
    const plot = { x: 40, y: 24, width: width - 40 - 5 - 240, height: height - 24 - 5 }
    const step = plot.height / 4
    const first = await shape(name, 0)
    near(first.points[0][1], plot.y, 0.01, "the first stage starts at margin.top")
    near(first.top, plot.width, 0.01, "the widest stage spans the plot, so a labelSize that is not a number fell back to 240")
    near((first.points[0][0] + first.points[1][0]) / 2, plot.x + plot.width / 2, 0.01, "centred on a plot inset by margin.left")
    near(first.points[3][1] - first.points[0][1], step, 0.01, "a negative stageGap counts as 0")
    const def = await shape("funnel-default", 0)
    near(def.points[0][1], 5, 0.01, "counter-precondition: the default chart starts at 5")
    const order = await page.locator(`${pg(name)} .chart-funnel`).evaluate((root) => {
      const legend = root.querySelector(".chart-legend")
      const plotEl = root.querySelector(".chart-plot")
      return { legendFirst: Boolean(legend && legend.compareDocumentPosition(plotEl) & Node.DOCUMENT_POSITION_FOLLOWING), above: legend.getBoundingClientRect().bottom <= plotEl.getBoundingClientRect().top + 0.5 }
    })
    eq(order, { legendFirst: true, above: true }, "the legend comes before the plot and sits above it")
    const below = await page.locator(`${pg("funnel-legend")} .chart-funnel`).evaluate((root) => root.lastElementChild.classList.contains("chart-legend") || root.querySelector(".chart-plot").compareDocumentPosition(root.querySelector(".chart-legend")) & Node.DOCUMENT_POSITION_FOLLOWING)
    eq(Boolean(below), true, "counter-precondition: the default legend follows the plot")
    const svg = page.locator(`${pg(name)} .chart-surface`)
    eq(await svg.getAttribute("aria-labelledby"), "funnel-margin-title")
    eq(await page.locator("#funnel-margin-title").textContent(), "Customers by stage", "the title it points at exists")
    eq(await svg.getAttribute("aria-label"), null, "and no aria-label competes with it")
  })

  // ── Tooltip and keyboard ──

  await test("funnel: short rows drop the rate line, then the labels, and no two stages' lines overlap", async () => {
    const pitch = async (name) => {
      const { height } = await svgSize(name)
      return (height - 10) / 8
    }
    const lines = (name) =>
      page.locator(`${pg(name)} .chart-funnel-stage-group`).evaluateAll((groups) =>
        groups.map((g) => [...g.querySelectorAll(".chart-funnel-label, .chart-funnel-rate")].map((el) => {
          const r = el.getBoundingClientRect()
          return { cls: el.getAttribute("class"), top: r.top, bottom: r.bottom }
        })),
      )
    const compact = await pitch("funnel-compact")
    eq(compact >= 16 && compact < 32, true, `precondition: funnel-compact's row pitch, ${compact}, is under two lines`)
    const rows = await lines("funnel-compact")
    eq(rows.every((r) => r.length === 1 && r[0].cls === "chart-funnel-label"), true, "one line per stage: the name, no rates")
    const tiny = await pitch("funnel-tiny")
    eq(tiny < 16, true, `precondition: funnel-tiny's row pitch, ${tiny}, is under one line`)
    eq(await page.locator(`${pg("funnel-tiny")} .chart-funnel-label, ${pg("funnel-tiny")} .chart-funnel-rate`).count(), 0, "no labels at all")
    eq((await page.locator(`${pg("funnel-tiny")} .chart-surface`).getAttribute("aria-describedby")) != null, true, "the summary still carries them")
    eq(await page.locator(`${pg("funnel-default")} .chart-funnel-rate`).count(), 3, "counter-precondition: tall rows keep the rate line")
    for (const name of ["funnel-default", "funnel-compact"]) {
      const spans = (await lines(name)).map((r) => ({ top: Math.min(...r.map((l) => l.top)), bottom: Math.max(...r.map((l) => l.bottom)) }))
      eq(spans.every((s, i) => i === 0 || s.top >= spans[i - 1].bottom - 0.5), true, `${name}: each stage's lines clear the stage above`)
    }
  })

  await test("funnel: the summary reads one stage, or none", async () => {
    const summaryOf = async (name) => page.locator(`#${await page.locator(`${pg(name)} .chart-surface`).getAttribute("aria-describedby")}`).textContent()
    eq(await summaryOf("funnel-single"), "Funnel of 1 stage. Visits 1,000.")
    eq(await page.locator(`${pg("funnel-single")} .chart-funnel-rate`).count(), 0, "one stage has no rates")
    eq(await summaryOf("funnel-empty"), "Funnel with no stages.")
    eq(await page.locator(`${pg("funnel-empty")} .chart-funnel-stage-group`).count(), 0, "and draws none")
  })

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

  await test("funnel: formatter writes the tooltip and summary values; a stage with no value says so in both", async () => {
    const summaryOf = async (name) => page.locator(`#${await page.locator(`${pg(name)} .chart-surface`).getAttribute("aria-describedby")}`).textContent()
    const options = await summaryOf("funnel-options")
    eq(options.startsWith("Funnel of "), true, "precondition: the formatted chart has a generated summary")
    eq(/\d orders/.test(options), true, "the summary writes values through formatter")
    await hoverStage("funnel-options", 1)
    await tooltip("funnel-options").waitFor()
    eq((await page.locator(`${pg("funnel-options")} .chart-tooltip-value`).first().textContent()).endsWith(" orders"), true, "so does the tooltip")
    await page.mouse.move(0, 0)
    await tooltip("funnel-options").waitFor({ state: "detached" })
    eq((await summaryOf("funnel-default")).includes("orders"), false, "counter-precondition: the default formatter adds nothing")
    eq((await summaryOf("funnel-odd")).includes("Missing has no value"), true, "a stage with no value reads as such in the summary")
    await focusSurface("funnel-odd")
    try {
      eq(await press("funnel-odd", "ArrowDown", "ArrowDown"), [2], "precondition: the keyboard reaches the stage with no shape")
      await tooltip("funnel-odd").waitFor()
      eq(await page.locator(`${pg("funnel-odd")} .chart-tooltip-value`).allTextContents(), ["No value"], "and its tooltip says No value, with no rates")
    } finally {
      await page.keyboard.press("Escape")
      await blur("funnel-odd")
    }
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
    eq(await land("ArrowRight"), [0], "ArrowRight, forward, lands on the first stage")
    eq(await land("ArrowLeft"), [1], "ArrowLeft, back, lands on the last")
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
      const fill = (index) => page.locator(`${group(name, index)} .chart-funnel-stage`).evaluate((el) => getComputedStyle(el).fill)
      const chart1 = await page.locator(`${group(name, 0)} .chart-funnel-stage`).evaluate((el) => {
        const probe = document.createElementNS("http://www.w3.org/2000/svg", "rect")
        probe.style.fill = "var(--chart-1)"
        el.parentNode.appendChild(probe)
        const c = getComputedStyle(probe).fill
        probe.remove()
        return c
      })
      eq(await fill(1), chart1, "precondition: the stage fill is --chart-1")
      await page.emulateMedia({ forcedColors: "active" })
      try {
        eq(await page.evaluate(() => matchMedia("(forced-colors: active)").matches), true, "precondition: forced colours are on")
        eq(await fill(1), chart1, "the fill is the datum and keeps --chart-1")
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
