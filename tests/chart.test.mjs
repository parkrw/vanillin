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

  // ── Polar ──

  const polarSeries = (name) =>
    page.locator(`${pg(name)} .chart-series`).first().evaluate((el) => {
      const svg = el.ownerSVGElement.getBoundingClientRect()
      return {
        cx: Number(el.dataset.cx),
        cy: Number(el.dataset.cy),
        inner: Number(el.dataset.inner),
        outer: Number(el.dataset.outer),
        svgX: svg.x,
        svgY: svg.y,
      }
    })
  const sectors = (name, key) =>
    page.locator(`${pg(name)} .chart-series${key ? `[data-key="${key}"]` : ""} .chart-sector:not(.chart-sector--background)`).evaluateAll((els) =>
      els.map((el) => ({
        index: Number(el.dataset.index),
        start: Number(el.dataset.start),
        end: Number(el.dataset.end),
        fill: getComputedStyle(el).fill,
        d: el.getAttribute("d"),
      })),
    )
  // Page coordinates of a point at `share` of the way out along `angle`.
  const polarPoint = (frame, radius, angle) => {
    const rad = (angle * Math.PI) / 180
    return { x: frame.svgX + frame.cx + Math.cos(rad) * radius, y: frame.svgY + frame.cy - Math.sin(rad) * radius }
  }
  const hoverSlice = async (name, index) => {
    await page.locator(`${pg(name)} .chart-surface`).evaluate((el) => el.scrollIntoView({ block: "center" }))
    const frame = await polarSeries(name)
    const slice = (await sectors(name)).find((s) => s.index === index)
    const p = polarPoint(frame, (frame.inner + frame.outer) / 2, (slice.start + slice.end) / 2)
    await page.mouse.move(p.x, p.y)
  }
  const sweep = (s) => Math.abs(s.end - s.start)

  await page.waitForSelector(`${pg("chart-pie")} .chart-sector`)

  await test("pie: one sector per row, contiguous from 3 o'clock counter-clockwise, sized by value", async () => {
    const slices = await sectors("chart-pie")
    eq(slices.length, 5)
    eq(slices[0].start, 0, "first slice starts at 0°")
    for (let i = 1; i < slices.length; i++) near(slices[i].start, slices[i - 1].end, 0.01, `slice ${i} follows ${i - 1}`)
    near(slices.at(-1).end, 360, 0.01, "last slice ends at 360°")
    near(sweep(slices[0]) / sweep(slices[1]), 275 / 200, 0.01, "chrome/safari = 275/200")
    const frame = await polarSeries("chart-pie")
    const first = slices[0].d.split(" ")
    near(Number(first[1]), frame.cx + frame.outer, 0.02, "path starts at the outer radius")
    near(Number(first[2]), frame.cy, 0.02, "on the horizontal through the centre")
    eq(slices[0].d.trim().endsWith("Z"), true, "closed")
  })

  await test("pie: a slice fills with the colour its row points at, and hit-testing follows the slice", async () => {
    const slices = await sectors("chart-pie")
    eq(slices[0].fill, await tokenColour("chart-pie", "--chart-1"), "chrome is --chart-1")
    eq(slices[4].fill, await tokenColour("chart-pie", "--chart-5"), "other is --chart-5")
    await page.locator(`${pg("chart-pie")} .chart-surface`).evaluate((el) => el.scrollIntoView({ block: "center" }))
    const frame = await polarSeries("chart-pie")
    const probe = polarPoint(frame, frame.outer * 0.7, (slices[2].start + slices[2].end) / 2)
    const hit = await page.evaluate(({ x, y }) => document.elementFromPoint(x, y)?.dataset.index, probe)
    eq(hit, "2", "the element at the firefox mid-angle is the firefox sector")
  })

  await test("pie: hovering a slice shows its tooltip; leaving the disc removes it", async () => {
    eq(await tooltip("chart-pie").count(), 0, "none before hover")
    await hoverSlice("chart-pie", 1)
    await tooltip("chart-pie").waitFor()
    eq(await page.locator(`${pg("chart-pie")} .chart-tooltip-label`).count(), 0, "hideLabel")
    eq(await page.locator(`${pg("chart-pie")} .chart-tooltip-name`).textContent(), "Safari")
    eq(await page.locator(`${pg("chart-pie")} .chart-tooltip-value`).textContent(), "200")
    const swatch = await page.locator(`${pg("chart-pie")} .chart-tooltip-indicator`).evaluate((el) => getComputedStyle(el).backgroundColor)
    eq(swatch, await tokenColour("chart-pie", "--chart-2"), "indicator carries the slice colour")
    await hoverSlice("chart-pie", 3)
    await page.waitForFunction(() => document.querySelector('[data-pg="chart-pie"] .chart-tooltip-name')?.textContent === "Edge")
    // Still inside the surface, past the outer radius: nothing under the pointer.
    const frame = await polarSeries("chart-pie")
    const outside = polarPoint(frame, frame.outer + 12, 45)
    await page.mouse.move(outside.x, outside.y)
    await tooltip("chart-pie").waitFor({ state: "detached" })
    eq(await page.locator(`${pg("chart-pie")} .chart-cursor`).count(), 0, "polar draws no cursor")
    await page.mouse.move(0, 0)
  })

  await test("pie: keyboard steps the slices and the tooltip anchors inside the chart", async () => {
    const svg = page.locator(`${pg("chart-pie")} .chart-surface`)
    eq(await svg.getAttribute("role"), "application")
    await svg.focus()
    await tooltip("chart-pie").waitFor()
    const name = () => page.locator(`${pg("chart-pie")} .chart-tooltip-name`).textContent()
    eq(await name(), "Chrome", "focus seeds the first slice")
    await page.keyboard.press("ArrowRight")
    eq(await name(), "Safari")
    await page.keyboard.press("End")
    eq(await name(), "Other")
    const tip = await rect(`${pg("chart-pie")} .chart-tooltip`)
    const chart = await rect(`${pg("chart-pie")} .chart`)
    eq(tip.x >= chart.x - 0.5 && tip.right <= chart.right + 0.5, true, "tooltip inside the chart")
    await page.keyboard.press("Escape")
    await tooltip("chart-pie").waitFor({ state: "detached" })
    await page.locator("h2").click()
  })

  await test("donut: the hole is empty and the Label content reads the pie's centre", async () => {
    const frame = await polarSeries("chart-donut")
    eq(frame.inner, 60, "innerRadius 60")
    const slices = await sectors("chart-donut")
    eq(slices.every((s) => (s.d.match(/ A /g) || []).length === 2), true, "every slice has an outer and an inner arc")
    await page.locator(`${pg("chart-donut")} .chart-surface`).evaluate((el) => el.scrollIntoView({ block: "center" }))
    const centre = polarPoint(frame, 0, 0)
    const atCentre = await page.evaluate(({ x, y }) => document.elementFromPoint(x, y)?.className?.baseVal ?? document.elementFromPoint(x, y)?.className, centre)
    eq(String(atCentre).includes("chart-sector"), false, `centre is not a sector, got ${atCentre}`)
    const tspans = await page.locator(`${pg("chart-donut")} .chart-series text tspan`).evaluateAll((els) =>
      els.map((el) => ({ text: el.textContent, x: Number(el.getAttribute("x")), y: Number(el.getAttribute("y")), size: getComputedStyle(el).fontSize })),
    )
    eq(tspans[0].text, "1,125")
    eq(tspans[1].text, "Visitors")
    near(tspans[0].x, frame.cx, 0.01, "label x = cx")
    near(tspans[0].y, frame.cy, 0.01, "label y = cy")
    eq(tspans[0].size, "30px", "the strong tspan's inline size applies")
    const gap = await page.locator(`${pg("chart-donut")} .chart-sector`).first().evaluate((el) => [el.getAttribute("stroke-width"), getComputedStyle(el).strokeWidth])
    eq(gap[0], "5")
    eq(gap[1], "5px")
    await page.mouse.move(0, 0)
  })

  await test("radar: a closed six-vertex polygon, first spoke at the top, spokes clockwise", async () => {
    const d = await page.locator(`${pg("chart-radar")} .chart-radar`).getAttribute("d")
    eq((d.match(/ L /g) || []).length, 5, "six vertices")
    eq(d.trim().endsWith("Z"), true, "closed")
    const [cx, cy] = await page.locator(`${pg("chart-radar")} .chart-polar-grid line`).first().evaluate((el) => [Number(el.getAttribute("x1")), Number(el.getAttribute("y1"))])
    const [x0, y0] = d.split(" ").slice(1, 3).map(Number)
    near(x0, cx, 0.02, "January sits on the vertical through the centre")
    eq(y0 < cy, true, "and above it")
    const [x1] = d.split(" L ")[1].split(" ").map(Number)
    eq(x1 > cx, true, "February is to the right: clockwise")
    eq(await page.locator(`${pg("chart-radar")} .chart-polar-grid line`).count(), 6, "one spoke per row")
    eq((await page.locator(`${pg("chart-radar")} .chart-polar-ring`).count()) >= 3, true, "a ring per value tick")
    const labels = await page.locator(`${pg("chart-radar")} .chart-axis[data-axis="angle"] .chart-tick-text`).allTextContents()
    eq(labels.join(","), "January,February,March,April,May,June")
    const fill = await page.locator(`${pg("chart-radar")} .chart-radar`).evaluate((el) => [getComputedStyle(el).fill, getComputedStyle(el).fillOpacity])
    eq(fill[0], await tokenColour("chart-radar", "--chart-1"))
    eq(fill[1], "0.6")
  })

  await test("radar: hovering near a spoke names that month", async () => {
    await page.locator(`${pg("chart-radar")} .chart-surface`).evaluate((el) => el.scrollIntoView({ block: "center" }))
    const spoke = await page.locator(`${pg("chart-radar")} .chart-polar-grid line`).nth(2).evaluate((el) => {
      const svg = el.ownerSVGElement.getBoundingClientRect()
      return { x1: svg.x + Number(el.getAttribute("x1")), y1: svg.y + Number(el.getAttribute("y1")), x2: svg.x + Number(el.getAttribute("x2")), y2: svg.y + Number(el.getAttribute("y2")) }
    })
    await page.mouse.move((spoke.x1 + spoke.x2) / 2, (spoke.y1 + spoke.y2) / 2)
    await tooltip("chart-radar").waitFor()
    eq(await page.locator(`${pg("chart-radar")} .chart-tooltip-label`).textContent(), "March")
    eq(await page.locator(`${pg("chart-radar")} .chart-tooltip-value`).textContent(), "237")
    await page.mouse.move(0, 0)
    await tooltip("chart-radar").waitFor({ state: "detached" })
  })

  await test("radial: one ring per row, innermost first, angle proportional to value, a muted track behind each", async () => {
    const bars = await sectors("chart-radial")
    eq(bars.length, 5)
    near(sweep(bars[0]) / sweep(bars[1]), 275 / 200, 0.01, "chrome/safari = 275/200")
    eq(bars.every((b) => b.start === 0), true, "all start at 0°")
    eq(sweep(bars[0]) < 360, true, "the largest value is short of the full circle (nice domain)")
    const radii = await page.locator(`${pg("chart-radial")} .chart-sector:not(.chart-sector--background)`).evaluateAll((els) => els.map((el) => el.getBBox().width))
    eq(radii[0] < radii[1], true, "chrome is the inner ring")
    const tracks = page.locator(`${pg("chart-radial")} .chart-sector--background`)
    eq(await tracks.count(), 5)
    eq(await tracks.first().evaluate((el) => getComputedStyle(el).fill), await tokenColour("chart-radial", "--muted"))
    const order = await page.locator(`${pg("chart-radial")} .chart-surface`).evaluate((svg) => {
      const bg = svg.querySelector(".chart-background")
      const series = svg.querySelector(".chart-series")
      return bg.compareDocumentPosition(series) & Node.DOCUMENT_POSITION_FOLLOWING ? "tracks first" : "bars first"
    })
    eq(order, "tracks first")
  })

  await test("radial: hovering a ring names it through nameKey", async () => {
    await page.locator(`${pg("chart-radial")} .chart-surface`).evaluate((el) => el.scrollIntoView({ block: "center" }))
    const frame = await polarSeries("chart-radial")
    // A full-sweep track's box is its outer diameter; 2px inside that edge is in the ring.
    const outer = await page.locator(`${pg("chart-radial")} .chart-sector--background`).nth(3).evaluate((el) => el.getBBox().width / 2)
    const p = polarPoint(frame, outer - 2, 180)
    await page.mouse.move(p.x, p.y)
    await tooltip("chart-radial").waitFor()
    eq(await page.locator(`${pg("chart-radial")} .chart-tooltip-name`).textContent(), "Edge")
    eq(await page.locator(`${pg("chart-radial")} .chart-tooltip-value`).textContent(), "173")
    await page.mouse.move(0, 0)
    await tooltip("chart-radial").waitFor({ state: "detached" })
  })

  await test("radial stacked: bars sharing a stackId share a ring and follow each other within the sweep", async () => {
    const [mobile] = await sectors("chart-radial-stacked", "mobile")
    const [desktop] = await sectors("chart-radial-stacked", "desktop")
    eq(mobile.start, 0, "mobile starts at 0°")
    near(desktop.start, mobile.end, 0.01, "desktop starts where mobile ends")
    eq(desktop.end <= 180, true, `stack ends inside the 180° sweep, got ${desktop.end}`)
    near(sweep(desktop) / sweep(mobile), 1260 / 570, 0.01, "desktop/mobile = 1260/570")
    eq((mobile.d.match(/ A /g) || []).length, 6, "cornerRadius rounds all four corners")
    // Every point a path names lies between the ring's radii, so the farthest
    // one is the ring's outer edge — the same ring for both bars.
    const frame = await polarSeries("chart-radial-stacked")
    const reach = (d) => {
      const pairs = d.split(/[MLAZ]/).filter((part) => part.trim()).map((part) => part.trim().split(/\s+/).map(Number).slice(-2))
      return Math.max(...pairs.map(([x, y]) => Math.hypot(x - frame.cx, y - frame.cy)))
    }
    const ring = reach(mobile.d)
    near(reach(desktop.d), ring, 0.05, "desktop reaches the same outer edge as mobile")
    // The band keeps barCategoryGap's share inside outerRadius, as bars do inside a band.
    eq(ring < 110 && ring > 100, true, `the ring sits just inside outerRadius 110, got ${ring}`)
    const text = await page.locator(`${pg("chart-radial-stacked")} .chart-axis[data-axis="radius"] tspan`).allTextContents()
    eq(text.join("|"), "1,830|Visitors")
    eq(await page.locator(`${pg("chart-radial-stacked")} .chart-axis[data-axis="radius"] line`).count(), 0, "axis line and ticks off")
  })

  await test("two pies: the legend lists every pie's slices, each name once, in the first pie's colours", async () => {
    const name = "chart-pie-two"
    const items = await page.locator(`${pg(name)} .chart-legend-item`).evaluateAll((els) =>
      els.map((el) => ({ text: el.textContent.trim(), swatch: getComputedStyle(el.querySelector(".chart-legend-swatch")).backgroundColor })),
    )
    eq(items.map((item) => item.text).join(","), "January,February,March,April,May", "five months, not ten")
    eq(items[0].swatch, await tokenColour(name, "--chart-1"))
    eq(items[4].swatch, await tokenColour(name, "--chart-5"))
    const legend = await rect(`${pg(name)} .chart-legend`)
    const plot = await rect(`${pg(name)} .chart-plot`)
    eq(legend.y >= plot.bottom - 0.5, true, "the legend sits under the plot")
  })

  await test("polar: the radius follows the container width", async () => {
    const host = page.locator(pg("chart-pie"))
    const outer = async () => (await polarSeries("chart-pie")).outer
    const wide = await outer()
    await host.evaluate((el) => {
      el.style.maxWidth = "160px"
    })
    await page.waitForFunction((prev) => Number(document.querySelector('[data-pg="chart-pie"] .chart-series').dataset.outer) < prev, wide)
    const narrow = await outer()
    const plot = await page.locator(`${pg("chart-pie")} .chart-plot`).evaluate((el) => Math.min(el.clientWidth, el.clientHeight))
    near(narrow, (plot - 10) * 0.4, 0.5, "outerRadius = 80% of half the plot inside the 5px margins")
    await host.evaluate((el) => {
      el.style.maxWidth = ""
    })
    await page.waitForFunction((prev) => Number(document.querySelector('[data-pg="chart-pie"] .chart-series').dataset.outer) > prev, narrow)
  })

  await test("pie labels: a value past each slice's edge along its middle, joined by a line in the slice colour", async () => {
    eq(await page.locator(`${pg("chart-pie")} .chart-pie-label`).count(), 0, "label is off by default")
    const frame = await polarSeries("chart-pie-labels")
    const slices = await sectors("chart-pie-labels")
    const labels = await page.locator(`${pg("chart-pie-labels")} .chart-pie-label`).evaluateAll((els) =>
      els.map((el) => {
        const text = el.querySelector("text")
        const line = el.querySelector(".chart-label-line")
        return {
          index: Number(el.dataset.index),
          text: text.textContent,
          x: Number(text.getAttribute("x")),
          y: Number(text.getAttribute("y")),
          anchor: text.getAttribute("text-anchor"),
          fill: getComputedStyle(text).fill,
          d: line.getAttribute("d"),
          stroke: getComputedStyle(line).stroke,
        }
      }),
    )
    eq(labels.length, 5)
    eq(labels.map((l) => l.text).join(","), "275,200,187,173,90")
    eq(labels[0].fill, await tokenColour("chart-pie-labels", "--foreground"), "label text is the foreground")
    for (const l of labels) {
      const slice = slices.find((s) => s.index === l.index)
      const rad = (((slice.start + slice.end) / 2) * Math.PI) / 180
      near(l.x, frame.cx + Math.cos(rad) * (frame.outer + 20), 0.05, `label ${l.index} sits 20px past the edge`)
      near(l.y, frame.cy - Math.sin(rad) * (frame.outer + 20), 0.05, `label ${l.index} y`)
      const [, x1, y1, , x2, y2] = l.d.split(" ")
      near(Number(x1), frame.cx + Math.cos(rad) * frame.outer, 0.05, `line ${l.index} starts at the edge`)
      near(Number(y1), frame.cy - Math.sin(rad) * frame.outer, 0.05, `line ${l.index} starts at the edge`)
      near(Number(x2), l.x, 0.05, `line ${l.index} ends at the label`)
      near(Number(y2), l.y, 0.05, `line ${l.index} ends at the label`)
      eq(l.stroke, slice.fill, `line ${l.index} takes the slice colour`)
    }
    eq(labels.map((l) => l.anchor).join(","), "start,end,end,start,start", "text reads away from the centre")
  })

  await test("pie active: the slice under the pointer renders through activeShape, the rest stay plain; the keys move it", async () => {
    const name = "chart-pie-active"
    const active = page.locator(`${pg(name)} .chart-sector-active`)
    eq(await active.count(), 0, "nothing raised at rest")
    eq(await page.locator(`${pg(name)} .chart-sector`).count(), 5)
    await hoverSlice(name, 2)
    await active.waitFor()
    eq(await active.getAttribute("data-index"), "2")
    eq(await page.locator(`${pg(name)} .chart-tooltip-name`).textContent(), "Firefox")
    const frame = await polarSeries(name)
    const raised = await active.locator(".chart-sector").evaluateAll((els) => els.map((el) => ({ d: el.getAttribute("d"), fill: getComputedStyle(el).fill })))
    eq(raised.length, 2, "the shape draws two sectors")
    const reach = (d) => {
      const pairs = d.split(/[MLAZ]/).filter((part) => part.trim()).map((part) => part.trim().split(/\s+/).map(Number).slice(-2))
      return Math.max(...pairs.map(([x, y]) => Math.hypot(x - frame.cx, y - frame.cy)))
    }
    near(reach(raised[0].d), frame.outer + 10, 0.05, "the slice grows by 10")
    near(reach(raised[1].d), frame.outer + 25, 0.05, "the ring reaches outer + 25")
    eq(raised[0].fill, await tokenColour(name, "--chart-3"), "firefox keeps its colour")
    const plain = await page.locator(`${pg(name)} .chart-sector`).evaluateAll((els) => els.filter((el) => !el.closest(".chart-sector-active")).length)
    eq(plain, 4, "the other four slices are plain")
    const outside = polarPoint(frame, frame.outer + 40, 45)
    await page.mouse.move(outside.x, outside.y)
    await active.waitFor({ state: "detached" })
    await page.locator(`${pg(name)} .chart-surface`).focus()
    await active.waitFor()
    eq(await active.getAttribute("data-index"), "0", "focus raises the first slice")
    await page.keyboard.press("ArrowRight")
    eq(await active.getAttribute("data-index"), "1")
    await page.keyboard.press("Escape")
    await active.waitFor({ state: "detached" })
    await page.locator("h2").click()
  })

  await test("pie inactive: the other slices fade through inactiveShape only while one is active", async () => {
    const name = "chart-pie-active"
    const inactive = page.locator(`${pg(name)} .chart-sector-inactive`)
    const opacities = () => page.locator(`${pg(name)} .chart-sector`).evaluateAll((els) => els.map((el) => getComputedStyle(el).fillOpacity))
    eq(await inactive.count(), 0, "nothing faded at rest")
    eq((await opacities()).every((o) => o === "1"), true, "every slice opaque at rest")
    await hoverSlice(name, 1)
    await inactive.first().waitFor()
    eq(await inactive.count(), 4, "the four other slices")
    eq(await inactive.evaluateAll((els) => els.map((el) => el.dataset.index).join(",")), "0,2,3,4")
    eq(await inactive.first().locator(".chart-sector").evaluate((el) => getComputedStyle(el).fillOpacity), "0.4")
    const raised = await page.locator(`${pg(name)} .chart-sector-active .chart-sector`).evaluateAll((els) => els.map((el) => getComputedStyle(el).fillOpacity))
    eq(raised.join(","), "1,1", "the active slice stays opaque")
    const frame = await polarSeries(name)
    const outside = polarPoint(frame, frame.outer + 40, 45)
    await page.mouse.move(outside.x, outside.y)
    await inactive.first().waitFor({ state: "detached" })
    eq((await opacities()).every((o) => o === "1"), true, "opaque again after leaving")
  })

  await test("pie pinned: activeIndex holds the raised slice while the pointer drives the tooltip; the select moves it", async () => {
    const name = "chart-pie-pinned"
    const active = page.locator(`${pg(name)} .chart-sector-active`)
    const centre = () => page.locator(`${pg(name)} .chart-series text tspan`).first().textContent()
    eq(await active.getAttribute("data-index"), "0", "chrome raised at rest")
    eq(await centre(), "275")
    await hoverSlice(name, 3)
    await tooltip(name).waitFor()
    eq(await page.locator(`${pg(name)} .chart-tooltip-name`).textContent(), "Edge")
    eq(await active.getAttribute("data-index"), "0", "the pointer does not move a pinned slice")
    await page.mouse.move(0, 0)
    await tooltip(name).waitFor({ state: "detached" })
    await page.locator(`${pg(name)} select`).selectOption("firefox")
    await page.waitForFunction(() => document.querySelector('[data-pg="chart-pie-pinned"] .chart-sector-active')?.dataset.index === "2")
    eq(await centre(), "187", "the centre reads the pinned slice")
    await page.locator(`${pg(name)} select`).selectOption("chrome")
    await page.waitForFunction(() => document.querySelector('[data-pg="chart-pie-pinned"] .chart-sector-active')?.dataset.index === "0")
  })

  await test("two pies: the pointer picks a pie by radius and the tooltip reads that pie's slice; the keys step the first", async () => {
    const name = "chart-pie-two"
    const frames = await page.locator(`${pg(name)} .chart-series`).evaluateAll((els) =>
      els.map((el) => ({ key: el.dataset.key, inner: Number(el.dataset.inner), outer: Number(el.dataset.outer) })),
    )
    eq(frames.map((f) => `${f.key}:${f.inner}-${f.outer}`).join(","), "desktop:0-60,mobile:70-90")
    await page.locator(`${pg(name)} .chart-surface`).evaluate((el) => el.scrollIntoView({ block: "center" }))
    const frame = await polarSeries(name)
    const read = async () => ({
      label: await page.locator(`${pg(name)} .chart-tooltip-label`).textContent(),
      name: await page.locator(`${pg(name)} .chart-tooltip-name`).textContent(),
      value: await page.locator(`${pg(name)} .chart-tooltip-value`).textContent(),
    })
    const inner = (await sectors(name, "desktop")).find((s) => s.index === 1)
    const p1 = polarPoint(frame, 30, (inner.start + inner.end) / 2)
    await page.mouse.move(p1.x, p1.y)
    await tooltip(name).waitFor()
    let tip = await read()
    eq(`${tip.label} ${tip.name} ${tip.value}`, "Desktop February 305")
    const covers = (s, angle) => (((angle - Math.min(s.start, s.end)) % 360) + 360) % 360 <= Math.abs(s.end - s.start)
    const ring = (await sectors(name, "mobile")).find((s) => covers(s, 180))
    const p2 = polarPoint(frame, 80, 180)
    await page.mouse.move(p2.x, p2.y)
    await page.waitForFunction(() => document.querySelector('[data-pg="chart-pie-two"] .chart-tooltip-label')?.textContent === "Mobile")
    tip = await read()
    const months = ["January", "February", "March", "April", "May"]
    const mobile = [80, 200, 120, 190, 130]
    eq(`${tip.name} ${tip.value}`, `${months[ring.index]} ${mobile[ring.index]}`, "the outer ring's own slice")
    const gap = polarPoint(frame, 66, 180)
    await page.mouse.move(gap.x, gap.y)
    await tooltip(name).waitFor({ state: "detached" })
    await page.locator(`${pg(name)} .chart-surface`).focus()
    await tooltip(name).waitFor()
    await page.keyboard.press("End")
    tip = await read()
    eq(`${tip.label} ${tip.name} ${tip.value}`, "Desktop May 209", "the keys step the first pie")
    await page.keyboard.press("Escape")
    await tooltip(name).waitFor({ state: "detached" })
    await page.locator("h2").click()
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
    const sector = page.locator(`${pg("chart-pie")} .chart-sector`).first()
    eq(await sector.evaluate((el) => getComputedStyle(el).forcedColorAdjust), "none", "sectors opt out too")
    eq(await sector.evaluate((el) => getComputedStyle(el).strokeWidth), "1px", "and take a CanvasText edge")
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
