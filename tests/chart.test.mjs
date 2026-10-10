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
  // Boxes and label attributes in svg units, so they compare exactly with
  // the attributes the chart wrote.
  const bboxes = (selector) =>
    page.locator(selector).evaluateAll((els) =>
      els.map((el) => {
        const b = el.getBBox()
        return { x: b.x, y: b.y, width: b.width, height: b.height, right: b.x + b.width, bottom: b.y + b.height }
      }),
    )
  const labelsOf = (locator) =>
    locator.evaluateAll((els) =>
      els.map((el) => {
        const glyphs = el.getBoundingClientRect()
        const svg = el.ownerSVGElement.getBoundingClientRect()
        return {
          text: el.textContent,
          x: Number(el.getAttribute("x")),
          y: Number(el.getAttribute("y")),
          anchor: el.getAttribute("text-anchor"),
          baseline: el.getAttribute("dominant-baseline"),
          fill: getComputedStyle(el).fill,
          top: glyphs.y - svg.y,
          bottom: glyphs.bottom - svg.y,
        }
      }),
    )
  const fillsOf = (selector) => page.locator(selector).evaluateAll((els) => els.map((el) => getComputedStyle(el).fill))
  const tooltipValues = async (name, index, count) => {
    await hoverBand(name, index, count)
    await tooltip(name).waitFor()
    const values = await page.locator(`${pg(name)} .chart-tooltip-value`).allTextContents()
    await page.mouse.move(0, 0)
    await tooltip(name).waitFor({ state: "detached" })
    return values
  }

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

  await test("bars: a radius list flips with a negative bar, so the value end stays rounded", async () => {
    const bars = await page.locator(`${pg("chart-negative")} .chart-bar`).evaluateAll((els) =>
      els.map((el) => {
        const b = el.getBBox()
        const ends = [...el.getAttribute("d").matchAll(/A [\d.]+ [\d.]+ 0 0 1 [-\d.]+ ([-\d.]+)/g)].map((m) => Number(m[1]))
        return { top: b.y, bottom: b.y + b.height, ends }
      }),
    )
    for (const i of [0, 2]) eq(bars[i].ends.length, 2, `bar ${i} has two rounded corners`)
    for (const y of bars[0].ends) eq(y <= bars[0].top + 4.01, true, `positive bar: corner at ${y} is on its top ${bars[0].top}`)
    for (const y of bars[2].ends) eq(y >= bars[2].bottom - 4.01, true, `negative bar: corner at ${y} is on its bottom ${bars[2].bottom}`)
  })

  await test('bars: stackOffset="expand" stacks every month to the full value axis; the tooltip keeps the counts', async () => {
    const name = "chart-bar-expand"
    const series = async (chart, key) => bboxes(`${pg(chart)} .chart-series[data-key="${key}"] .chart-bar`)
    const [desktop, other] = [await series(name, "desktop"), await series(name, "other")]
    const ticks = await page.locator(`${pg(name)} .chart-axis[data-axis="y"] .chart-tick-text`).evaluateAll((els) =>
      els.map((el) => ({ text: el.textContent, y: Number(el.getAttribute("y")) })),
    )
    eq(ticks.map((t) => t.text).join(","), "0%,20%,40%,60%,80%,100%")
    const zero = ticks[0].y
    const one = ticks.at(-1).y
    for (let i = 0; i < 6; i++) {
      near(desktop[i].bottom, zero, 0.01, `month ${i} starts at 0%`)
      near(other[i].y, one, 0.01, `month ${i} tops out at 100%`)
    }
    near(desktop[0].height / (zero - one), 186 / 311, 0.001, "January's desktop share")
    const plain = await series("chart-stacked", "mobile")
    eq(new Set(plain.map((b) => Math.round(b.y))).size > 1, true, "without expand the stacks differ in height")
    const values = await tooltipValues(name, 0)
    for (const v of ["186", "80", "45"]) eq(values.includes(v), true, `tooltip shows ${v}, got ${values}`)
  })

  await test("bars: a Cell per row colours that bar; a negative bar's top label hangs below it", async () => {
    const name = "chart-bar-negative"
    const bars = await bboxes(`${pg(name)} .chart-bar`)
    const [one, two] = [await tokenColour(name, "--chart-1"), await tokenColour(name, "--chart-2")]
    eq((await fillsOf(`${pg(name)} .chart-bar`)).join(" | "), [one, one, two, one, two, one].join(" | "), "fill by sign")
    const labels = await labelsOf(page.locator(`${pg(name)} .chart-label`))
    eq(labels.map((l) => l.text).join(","), "January,February,March,April,May,June", "labelled by month, not by value")
    for (const [i, l] of labels.entries()) {
      const b = bars[i]
      near(l.x, b.x + b.width / 2, 0.01, `label ${i} centred on its bar`)
      eq(l.anchor, "middle")
      if (i === 2 || i === 4) {
        near(l.y, b.bottom + 5, 0.01, `negative label ${i} is 5px past the value end`)
        eq(l.baseline, "hanging")
        eq(l.top >= b.bottom, true, `negative label ${i} glyphs sit below the bar`)
      } else {
        near(l.y, b.y - 5, 0.01, `positive label ${i} is 5px past the value end`)
        eq(l.baseline, "auto")
        eq(l.bottom <= b.y + 1, true, `positive label ${i} glyphs sit above the bar`)
      }
    }
  })

  await test("bars: each bar takes its row's fill", async () => {
    const name = "chart-bar-mixed"
    const fills = await fillsOf(`${pg(name)} .chart-bar`)
    for (let n = 1; n <= 5; n++) eq(fills[n - 1], await tokenColour(name, `--chart-${n}`), `bar ${n}`)
    eq(new Set(fills).size, 5, "five distinct colours")
    const bars = await bboxes(`${pg(name)} .chart-bar`)
    near(bars[1].width / bars[0].width, 200 / 275, 0.001, "lengths follow the values")
  })

  await test("bars: activeBar redraws the pinned bar through Rectangle, and the pointer does not move it", async () => {
    const name = "chart-bar-active"
    const shaped = page.locator(`${pg(name)} .chart-bar-shape`)
    eq(await shaped.count(), 1, "only the active bar is redrawn")
    eq(await shaped.getAttribute("data-index"), "2")
    const style = (locator) =>
      locator.evaluate((el) => {
        const cs = getComputedStyle(el)
        return { fill: cs.fill, fillOpacity: cs.fillOpacity, stroke: cs.stroke, dash: cs.strokeDasharray, width: cs.strokeWidth }
      })
    const active = await style(shaped.locator(".chart-bar"))
    const firefox = await tokenColour(name, "--chart-3")
    eq(active.fill, firefox, "fill from the row")
    eq(active.stroke, firefox, "stroke from the row through payload")
    eq(active.dash, "4px")
    eq(active.fillOpacity, "0.8")
    eq(active.width, "2px", "the Bar's strokeWidth reaches the shape")
    const plain = await style(page.locator(`${pg(name)} .chart-series > .chart-bar`).first())
    eq(plain.stroke, "none", "a plain bar has no outline")
    eq(plain.fillOpacity, "1")
    const bars = await bboxes(`${pg(name)} .chart-bar`)
    eq(bars.length, 5)
    for (const b of bars) near(b.bottom, bars[0].bottom, 0.01, "the redrawn bar keeps the plain bar's box")
    await hoverBand(name, 0, 5)
    await tooltip(name).waitFor()
    eq(await shaped.getAttribute("data-index"), "2", "activeIndex wins over the pointer")
    await page.mouse.move(0, 0)
    await tooltip(name).waitFor({ state: "detached" })
  })

  await test("bars: shape draws every bar from its box and colour", async () => {
    const name = "chart-bar-shape"
    eq(await page.locator(`${pg(name)} .chart-bar`).count(), 0, "the shape replaces the plain bar")
    const shapes = await page.locator(`${pg(name)} .chart-bar-shape path`).evaluateAll((els) =>
      els.map((el) => {
        const b = el.getBBox()
        return { vertices: (el.getAttribute("d").match(/ L /g) || []).length + 1, height: b.height, bottom: b.y + b.height, fill: getComputedStyle(el).fill }
      }),
    )
    eq(shapes.length, 6)
    for (const t of shapes) {
      eq(t.vertices, 3, "a triangle")
      near(t.bottom, shapes[0].bottom, 0.01, "standing on the baseline")
    }
    near(shapes[1].height / shapes[0].height, 305 / 186, 0.001, "heights follow the values")
    eq(shapes[0].fill, await tokenColour(name, "--chart-1"))
  })

  await test("labels: two LabelLists on a vertical bar, the month inside its start in the label colour, the value past its end", async () => {
    const name = "chart-bar-label-custom"
    const bars = await bboxes(`${pg(name)} .chart-bar`)
    const groups = page.locator(`${pg(name)} .chart-labels`)
    const months = await labelsOf(groups.nth(0).locator(".chart-label"))
    const values = await labelsOf(groups.nth(1).locator(".chart-label"))
    eq(months.map((l) => l.text).join(","), "January,February,March,April,May,June")
    eq(values.map((l) => l.text).join(","), "186,305,237,73,209,214")
    for (const [i, b] of bars.entries()) {
      near(months[i].x, b.x + 8, 0.01, `month ${i} is 8px inside the bar's start`)
      near(values[i].x, b.right + 8, 0.01, `value ${i} is 8px past the bar's end`)
      near(months[i].y, b.y + b.height / 2, 0.01, `month ${i} centred across the bar`)
      eq(months[i].anchor, "start")
      eq(values[i].anchor, "start")
    }
    eq(months[0].fill, await tokenColour(name, "--background"), "fill colours the month")
    eq(values[0].fill, await tokenColour(name, "--foreground"), "the value keeps the label colour")
  })

  await test("labels: content draws each label from the bar's box and value", async () => {
    const name = "chart-label-content"
    eq(await page.locator(`${pg(name)} .chart-labels .chart-label`).count(), 0, "content replaces the built-in text")
    const bars = await bboxes(`${pg(name)} .chart-bar`)
    const badges = await page.locator(`${pg(name)} .chart-label-shape`).evaluateAll((els) =>
      els.map((el) => {
        const r = el.querySelector("rect")
        return { index: Number(el.dataset.index), text: el.textContent, x: Number(r.getAttribute("x")), y: Number(r.getAttribute("y")) }
      }),
    )
    eq(badges.map((b) => b.text).join(","), "186,305,237,73,209,214")
    for (const [i, b] of bars.entries()) {
      eq(badges[i].index, i)
      near(badges[i].x + 20, b.x + b.width / 2, 0.01, `badge ${i} centred on its bar`)
      near(badges[i].y, b.y - 26, 0.01, `badge ${i} sits on the bar's top`)
    }
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

  await test("line: a dot function draws each marker at its point instead of the built-in circle", async () => {
    const name = "chart-line-dots-custom"
    eq(await page.locator(`${pg(name)} .chart-dot`).count(), 0, "no built-in dots")
    const marks = await page.locator(`${pg(name)} .chart-dot-shape > svg`).evaluateAll((els) =>
      els.map((el) => [Number(el.getAttribute("x")) + 12, Number(el.getAttribute("y")) + 12]),
    )
    eq(marks.length, 6)
    const numbers = (await page.locator(`${pg(name)} .chart-line`).getAttribute("d")).match(/-?[\d.]+/g).map(Number)
    near(marks[0][0], numbers[0], 0.01, "first marker on the first point")
    near(marks[0][1], numbers[1], 0.01)
    near(marks[5][0], numbers.at(-2), 0.01, "last marker on the last point")
    near(marks[5][1], numbers.at(-1), 0.01)
    eq(marks[1][1] < marks[0][1], true, "February (305) above January (186)")
  })

  await test("line: Dot from a dot function takes each row's colour", async () => {
    const name = "chart-line-dots-colors"
    const dots = await page.locator(`${pg(name)} .chart-dot-shape .chart-dot`).evaluateAll((els) =>
      els.map((el) => ({ r: el.getAttribute("r"), fill: getComputedStyle(el).fill, stroke: getComputedStyle(el).stroke })),
    )
    eq(dots.length, 5)
    for (const [i, d] of dots.entries()) {
      const colour = await tokenColour(name, `--chart-${i + 1}`)
      eq(d.fill, colour, `dot ${i} fill`)
      eq(d.stroke, colour, `dot ${i} stroke`)
      eq(d.r, "5")
    }
    eq(await page.locator(`${pg(name)} .chart-line`).evaluate((el) => getComputedStyle(el).stroke), await tokenColour(name, "--chart-2"), "the line keeps the series colour")
  })

  await test("line: a LabelList reads another field through formatter, 12px above each point", async () => {
    const name = "chart-line-label-custom"
    const labels = await labelsOf(page.locator(`${pg(name)} .chart-label`))
    eq(labels.map((l) => l.text).join(","), "Chrome,Safari,Firefox,Edge,Other")
    const dots = await page.locator(`${pg(name)} .chart-dot:not(.chart-dot--active)`).evaluateAll((els) =>
      els.map((el) => [Number(el.getAttribute("cx")), Number(el.getAttribute("cy"))]),
    )
    eq(dots.length, 5)
    for (const [i, [cx, cy]] of dots.entries()) {
      near(labels[i].x, cx, 0.01, `label ${i} over its point`)
      near(labels[i].y, cy - 12, 0.01, `label ${i} 12px up`)
      eq(labels[i].anchor, "middle")
    }
  })

  await test('area: stackOffset="expand" fills the plot with every stack; the tooltip keeps the counts', async () => {
    const name = "chart-area-expand"
    const grid = (await bboxes(`${pg(name)} .chart-grid line`)).map((b) => b.y).sort((a, b) => a - b)
    const [top] = await bboxes(`${pg(name)} .chart-series[data-key="desktop"] .chart-line`)
    near(top.height, 0, 0.01, "the top edge is flat")
    near(top.y, grid[0], 0.01, "at the top of the value axis")
    const [floor] = await bboxes(`${pg(name)} .chart-series[data-key="other"] .chart-area`)
    near(floor.bottom, grid.at(-1), 0.01, "the bottom band starts at 0")
    const [plain] = await bboxes(`${pg("chart-area-stacked")} .chart-series[data-key="desktop"] .chart-line`)
    eq(plain.height > 10, true, "without expand the top edge follows the totals")
    const values = await tooltipValues(name, 0)
    for (const v of ["186", "80", "45"]) eq(values.includes(v), true, `tooltip shows ${v}, got ${values}`)
  })

  await test("composed: a line's points sit on the bar band centres and one tooltip names both", async () => {
    const bars = await barRects("chart-composed", "desktop")
    const dots = await page.locator(`${pg("chart-composed")} .chart-series[data-key="mobile"] .chart-dot`).evaluateAll((els) =>
      els.map((el) => {
        const r = el.getBoundingClientRect()
        return r.x + r.width / 2
      }),
    )
    eq(bars.length, 6)
    eq(dots.length, 6)
    dots.forEach((cx, i) => near(cx, bars[i].x + bars[i].width / 2, 0.5, `dot ${i} on band centre`))
    eq(bars[0].width > 20, true, "the lone bar takes the band, not a point")
    await hoverBand("chart-composed", 2)
    await tooltip("chart-composed").waitFor()
    eq(await page.locator(`${pg("chart-composed")} .chart-tooltip-label`).textContent(), "March")
    eq(await page.locator(`${pg("chart-composed")} .chart-tooltip-name`).allTextContents().then((t) => t.join(",")), "Desktop,Mobile")
    await page.mouse.move(0, 0)
    await tooltip("chart-composed").waitFor({ state: "detached" })
  })

  await test("scatter: a dot per row at the numeric x and y, sized by ZAxis area, on number ticks", async () => {
    const name = "chart-scatter"
    const dots = await page.locator(`${pg(name)} .chart-series[data-key="a"] .chart-dot`).evaluateAll((els) =>
      els.map((el) => ({ cx: Number(el.getAttribute("cx")), cy: Number(el.getAttribute("cy")), r: Number(el.getAttribute("r")) })),
    )
    eq(dots.length, 6)
    eq(dots[2].cx > dots[1].cx && dots[1].cx > dots[0].cx, true, "cx grows with x")
    eq(dots[4].cy < dots[2].cy && dots[2].cy < dots[1].cy, true, "cy falls as y grows")
    near(dots[0].cx + ((dots[2].cx - dots[0].cx) * (120 - 100)) / (170 - 100), dots[1].cx, 0.05, "x is linear")
    near(dots[1].cy + ((dots[4].cy - dots[1].cy) * (300 - 100)) / (400 - 100), dots[2].cy, 0.05, "y is linear")
    eq(dots[4].r > dots[2].r && dots[2].r > dots[0].r, true, "r grows with z")
    near(dots[0].r, dots[5].r, 0.001, "equal z, equal r")
    near(dots[0].r, Math.sqrt(60 / Math.PI), 0.01, "the smallest z takes the bottom of the area range")
    near(dots[4].r, Math.sqrt(400 / Math.PI), 0.01, "the largest z takes the top")
    const numeric = (texts) => texts.length >= 3 && texts.every((t) => Number.isFinite(Number(t.replace(/,/g, ""))))
    const xt = await page.locator(`${pg(name)} .chart-axis[data-axis="x"] .chart-tick-text`).allTextContents()
    const yt = await page.locator(`${pg(name)} .chart-axis[data-axis="y"] .chart-tick-text`).allTextContents()
    eq(numeric(xt), true, `numeric x ticks: ${xt.join(",")}`)
    eq(numeric(yt), true, `numeric y ticks: ${yt.join(",")}`)
    eq(await page.locator(`${pg(name)} .chart-legend-item`).allTextContents().then((t) => t.join(",")), "School A,School B")
  })

  await test("scatter: the nearest dot of any series drives the tooltip; the keys step the first series", async () => {
    const name = "chart-scatter"
    await page.locator(`${pg(name)} .chart-surface`).evaluate((el) => el.scrollIntoView({ block: "center" }))
    const centre = (key, i) =>
      page.locator(`${pg(name)} .chart-series[data-key="${key}"] .chart-dot[data-index="${i}"]`).evaluate((el) => {
        const r = el.getBoundingClientRect()
        return { x: r.x + r.width / 2, y: r.y + r.height / 2 }
      })
    const names = () => page.locator(`${pg(name)} .chart-tooltip-name`).allTextContents().then((t) => t.join(","))
    const values = () => page.locator(`${pg(name)} .chart-tooltip-value`).allTextContents().then((t) => t.join(","))
    const b2 = await centre("b", 2)
    await page.mouse.move(b2.x, b2.y)
    await tooltip(name).waitFor()
    eq(await page.locator(`${pg(name)} .chart-tooltip-label`).textContent(), "School B")
    eq(await names(), "Stature,Weight,Score")
    eq(await values(), "190,290,250")
    eq(await page.locator(`${pg(name)} .chart-series[data-key="b"] .chart-dot--active`).getAttribute("data-index"), "2", "the hovered dot is marked")
    eq(await page.locator(`${pg(name)} .chart-series[data-key="a"] .chart-dot--active`).count(), 0, "only on its own series")
    eq(await page.locator(`${pg(name)} .chart-cursor`).count(), 0, "no cursor band")
    const svg = await rect(`${pg(name)} .chart-surface`)
    await page.mouse.move(svg.x + 2, svg.y + 2)
    await tooltip(name).waitFor({ state: "detached" })
    await page.locator(`${pg(name)} .chart-surface`).focus()
    await tooltip(name).waitFor()
    eq(await page.locator(`${pg(name)} .chart-tooltip-label`).textContent(), "School A", "focus seeds the first series")
    await page.keyboard.press("End")
    eq(await values(), "110,280,200")
    await page.keyboard.press("Escape")
    await tooltip(name).waitFor({ state: "detached" })
    await page.locator("h2").click()
  })

  // ── Reference marks ──

  const attrs = (selector, names) =>
    page.locator(selector).evaluateAll((els, names) => els.map((el) => Object.fromEntries(names.map((n) => [n, el.getAttribute(n)]))), names)
  const shape = async (selector, names) =>
    (await attrs(selector, names)).map((row) => Object.fromEntries(Object.entries(row).map(([k, v]) => [k, Number(v)])))
  // The axis's own value → px map, read off its first and last numeric ticks.
  const valueScale = async (name, axis) => {
    const ticks = await page
      .locator(`${pg(name)} .chart-axis[data-axis="${axis}"] .chart-tick-text`)
      .evaluateAll((els, axis) => els.map((el) => [Number(el.textContent.replace(/,/g, "")), Number(el.getAttribute(axis))]), axis)
    const [[v0, p0], [v1, p1]] = [ticks[0], ticks.at(-1)]
    return (v) => p0 + ((v - v0) * (p1 - p0)) / (v1 - v0)
  }
  const tickAt = (name, axis, text) =>
    page.locator(`${pg(name)} .chart-axis[data-axis="${axis}"] .chart-tick-text`, { hasText: text }).evaluate((el) => Number(el.getAttribute("x")))
  const referenceLabels = (name) => attrs(`${pg(name)} .chart-reference .chart-label`, ["x", "y", "text-anchor", "dominant-baseline"])

  await test("reference: an area, two lines and a dot land on the value scale and the category points", async () => {
    const name = "chart-reference"
    const y = await valueScale(name, "y")
    const [grid] = await shape(`${pg(name)} .chart-grid line`, ["x1", "x2"])
    const [area] = await shape(`${pg(name)} .chart-reference-area`, ["x", "y", "width", "height"])
    near(area.y, y(250), 0.01, "area top at y2")
    near(area.y + area.height, y(150), 0.01, "area bottom at y1")
    near(area.x, grid.x1, 0.01, "no x1: from the plot's left edge")
    near(area.x + area.width, grid.x2, 0.01, "no x2: to its right edge")
    const [goal, outage] = await shape(`${pg(name)} .chart-reference-line`, ["x1", "x2", "y1", "y2"])
    near(goal.y1, y(300), 0.01, "y={300} across the plot")
    near(goal.y2, goal.y1, 0.001)
    near(goal.x1, grid.x1, 0.01)
    near(goal.x2, grid.x2, 0.01)
    const april = await tickAt(name, "x", "Apr")
    near(outage.x1, april, 0.01, 'x="April" on the April point')
    near(outage.x2, april, 0.01)
    near(outage.y2 - outage.y1, y(0) - y(350), 0.01, "down the full plot")
    const [dot] = await shape(`${pg(name)} .chart-reference-dot`, ["cx", "cy", "r"])
    near(dot.cx, await tickAt(name, "x", "Feb"), 0.01)
    near(dot.cy, y(305), 0.01)
    eq(dot.r, 6)
    const order = await page
      .locator(`${pg(name)} .chart-surface`)
      .evaluate((svg) => [...svg.querySelectorAll(".chart-reference-area, .chart-line, .chart-reference-line, .chart-reference-dot")].map((el) => el.classList[0]))
    eq(order.join(","), "chart-reference-area,chart-line,chart-reference-line,chart-reference-line,chart-reference-dot", "the area beneath the series, lines and dot over it")
    const [normal, goalLabel] = await referenceLabels(name)
    near(Number(normal.x), area.x + 5, 0.01, "insideTopLeft: 5px in from the left")
    near(Number(normal.y), area.y + 5, 0.01, "and down from the top")
    eq(`${normal["text-anchor"]} ${normal["dominant-baseline"]}`, "start hanging")
    near(Number(goalLabel.x), grid.x2 - 5, 0.01, "insideBottomRight: 5px in from the right")
    near(Number(goalLabel.y), goal.y1 - 5, 0.01, "and above the line")
    eq(`${goalLabel["text-anchor"]} ${goalLabel["dominant-baseline"]}`, "end auto")
  })

  await test("reference: on vertical bars x is a value and y a category band", async () => {
    const name = "chart-reference-vertical"
    const bars = await bboxes(`${pg(name)} .chart-bar`)
    eq(bars.length, 6)
    const [area] = await shape(`${pg(name)} .chart-reference-area`, ["x", "y", "width", "height"])
    near(area.y, bars[2].y, 0.01, "from the start of the March band")
    near(area.y + area.height, bars[3].bottom, 0.01, "to the end of the April band")
    near(area.x, bars[0].x, 0.01, "no x1: from the value axis's zero")
    eq(area.x + area.width > bars[1].right, true, "no x2: past the longest bar to the plot's end")
    const [line] = await shape(`${pg(name)} .chart-reference-line`, ["x1", "x2", "y1", "y2"])
    near(line.x1, bars[0].x + (200 * bars[0].width) / 186, 0.01, "x={200} on the value scale the bars use")
    near(line.x2, line.x1, 0.001, "drawn down, not across")
    eq(line.y1 <= bars[0].y && line.y2 >= bars[5].bottom, true, "over every band")
    const [label] = await referenceLabels(name)
    near(Number(label.x), line.x1, 0.01, "top: centred on the line")
    near(Number(label.y), line.y1 - 5, 0.01, "5px above its top end")
  })

  await test("reference: on a scatter a segment joins two value points, an area spans the height, and a dot rings a datum", async () => {
    const name = "chart-reference-scatter"
    const dots = await shape(`${pg(name)} .chart-series[data-key="a"] .chart-dot`, ["cx", "cy"])
    // School A's rows 0 and 2 are (100, 200) and (170, 300).
    const px = (v) => dots[0].cx + ((v - 100) * (dots[2].cx - dots[0].cx)) / 70
    const py = (v) => dots[0].cy + ((v - 200) * (dots[2].cy - dots[0].cy)) / 100
    const [segment] = await shape(`${pg(name)} .chart-reference-line`, ["x1", "y1", "x2", "y2"])
    near(segment.x1, px(100), 0.01)
    near(segment.y1, py(150), 0.01)
    near(segment.x2, px(170), 0.01)
    near(segment.y2, py(350), 0.01)
    const [area] = await shape(`${pg(name)} .chart-reference-area`, ["x", "y", "width", "height"])
    near(area.x, px(180), 0.01)
    near(area.x + area.width, px(250), 0.01)
    near(area.y, py(400), 0.01, "no y2: from the top of the value axis")
    near(area.y + area.height, py(0), 0.01, "no y1: to its bottom")
    const [ring] = await shape(`${pg(name)} .chart-reference-dot`, ["cx", "cy"])
    near(ring.cx, dots[4].cx, 0.01, "on School A's (150, 400)")
    near(ring.cy, dots[4].cy, 0.01)
    eq(await page.locator(`${pg(name)} .chart-reference-dot`).getAttribute("fill"), "none")
  })

  await test('reference: a value off the axis drops the mark, unless ifOverflow="extendDomain" widens the axis to it', async () => {
    const ticksOf = (name) => page.locator(`${pg(name)} .chart-axis[data-axis="y"] .chart-tick-text`).allTextContents()
    eq(await page.locator(`${pg("chart-reference-discard")} .chart-reference`).count(), 0, "discard: no mark")
    eq((await ticksOf("chart-reference-discard")).at(-1), "350", "and the axis still fits the data")
    eq(await page.locator(`${pg("chart-reference-extend")} .chart-reference`).count(), 1, "extendDomain: the mark is drawn")
    eq((await ticksOf("chart-reference-extend")).at(-1), "400", "on an axis that now reaches it")
    const y = await valueScale("chart-reference-extend", "y")
    const [line] = await shape(`${pg("chart-reference-extend")} .chart-reference-line`, ["y1"])
    near(line.y1, y(400), 0.01)
  })

  // ── Interactive ──

  // A natural or monotone path is "M x y C …, …, x y" with one C per segment.
  const pointCounts = (name) => page.locator(`${pg(name)} .chart-line`).evaluateAll((els) => els.map((el) => el.getAttribute("d").split("C").length))
  const seriesKeys = (name) => page.locator(`${pg(name)} .chart-series`).evaluateAll((els) => els.map((el) => el.dataset.key))
  const xTicks = (name) => page.locator(`${pg(name)} .chart-axis[data-axis="x"] .chart-tick-text`).allTextContents()

  await test("interactive area: the range select keeps the last 90, 30 or 7 days; the axis and tooltip write the dates", async () => {
    const name = "chart-area-interactive"
    const trigger = page.locator(`${pg(name)} [role="combobox"]`)
    const choose = async (label, points) => {
      await trigger.click()
      await page.locator(`${pg(name)} [role="option"]`, { hasText: label }).click()
      await page.waitForFunction(
        ([sel, n]) => document.querySelector(sel).getAttribute("d").split("C").length === n,
        [`${pg(name)} .chart-line`, points],
      )
      eq(await trigger.textContent(), label)
    }
    eq(await trigger.textContent(), "Last 3 months")
    eq((await pointCounts(name)).join(","), "90,90", "both series, 90 days")
    const all = await xTicks(name)
    eq(all[0], "Apr 2", "the first of the 90 days")
    eq(all.at(-1), "Jun 30")
    eq(all.length > 2 && all.length < 20, true, `minTickGap thins 90 dates, got ${all.join(",")}`)
    await choose("Last 30 days", 30)
    eq((await pointCounts(name)).join(","), "30,30")
    const month = await xTicks(name)
    eq([month[0], month.at(-1)].join(","), "Jun 1,Jun 30")
    await choose("Last 7 days", 7)
    eq((await xTicks(name)).join(","), "Jun 24,Jun 25,Jun 26,Jun 27,Jun 28,Jun 29,Jun 30", "a week has room for every date")
    await hoverBand(name, 6, 7)
    await tooltip(name).waitFor()
    eq(await page.locator(`${pg(name)} .chart-tooltip-label`).textContent(), "Jun 30", "labelFormatter writes the UTC date")
    eq((await page.locator(`${pg(name)} .chart-tooltip-value`).allTextContents()).sort().join(","), "400,446")
    await page.mouse.move(0, 0)
    await tooltip(name).waitFor({ state: "detached" })
    await choose("Last 3 months", 90)
  })

  const pressTotal = (name, label) => page.locator(`${pg(name)} .toggle-group-item`, { hasText: label }).click()
  const pressed = (name) =>
    page.locator(`${pg(name)} .toggle-group-item[aria-pressed="true"]`).evaluateAll((els) => els.map((el) => el.firstElementChild.textContent))

  await test("interactive bar: the pressed total picks the series the bars draw; the tooltip names page views under the full date", async () => {
    const name = "chart-bar-interactive"
    const totals = await page.locator(`${pg(name)} .toggle-group-item`).evaluateAll((els) => els.map((el) => [...el.children].map((s) => s.textContent).join(" ")))
    eq(totals.join("|"), "Desktop 24,828|Mobile 25,010")
    const bars = () => page.locator(`${pg(name)} .chart-bar`)
    const ratio = async () => {
      const [a, b] = await barRects(name, (await seriesKeys(name))[0])
      return a.height / b.height
    }
    eq((await pressed(name)).join(","), "Desktop")
    eq((await seriesKeys(name)).join(","), "desktop")
    eq(await bars().count(), 91)
    near(await ratio(), 222 / 97, 0.05, "Apr 1 over Apr 2, desktop")
    eq(await bars().first().evaluate((el) => getComputedStyle(el).fill), await tokenColour(name, "--chart-1"))
    await pressTotal(name, "Mobile")
    eq((await pressed(name)).join(","), "Mobile")
    eq((await seriesKeys(name)).join(","), "mobile", "the desktop bars are gone")
    eq(await bars().count(), 91)
    near(await ratio(), 150 / 180, 0.05, "Apr 1 over Apr 2, mobile")
    eq(await bars().first().evaluate((el) => getComputedStyle(el).fill), await tokenColour(name, "--chart-2"))
    await pressTotal(name, "Mobile")
    eq((await pressed(name)).join(","), "Mobile", "pressing the pressed total keeps it")
    eq((await seriesKeys(name)).join(","), "mobile")
    await page.locator(`${pg(name)} .chart-surface`).evaluate((el) => el.scrollIntoView({ block: "center" }))
    const first = await rect(`${pg(name)} .chart-bar`)
    await page.mouse.move(first.x + first.width / 2, first.y + first.height / 2)
    await tooltip(name).waitFor()
    eq(await page.locator(`${pg(name)} .chart-tooltip-label`).textContent(), "Apr 1, 2024")
    eq(await page.locator(`${pg(name)} .chart-tooltip-name`).textContent(), "Page views")
    eq(await page.locator(`${pg(name)} .chart-tooltip-value`).textContent(), "150")
    await page.mouse.move(0, 0)
    await tooltip(name).waitFor({ state: "detached" })
    await pressTotal(name, "Desktop")
    eq((await seriesKeys(name)).join(","), "desktop")
  })

  await test("interactive line: the pressed total picks the series the line draws", async () => {
    const name = "chart-line-interactive"
    const line = page.locator(`${pg(name)} .chart-line`)
    // Apr 1 then Apr 2: desktop falls 222 → 97, mobile rises 150 → 180.
    const firstStep = async () => {
      const n = (await line.getAttribute("d")).match(/-?[\d.]+/g).map(Number)
      return n[7] - n[1]
    }
    eq((await pressed(name)).join(","), "Desktop")
    eq((await seriesKeys(name)).join(","), "desktop")
    eq((await pointCounts(name)).join(","), "91")
    eq((await firstStep()) > 0, true, "desktop falls on Apr 2")
    eq(await line.evaluate((el) => getComputedStyle(el).stroke), await tokenColour(name, "--chart-1"))
    await pressTotal(name, "Mobile")
    eq((await seriesKeys(name)).join(","), "mobile")
    eq((await pointCounts(name)).join(","), "91")
    eq((await firstStep()) < 0, true, "mobile rises on Apr 2")
    eq(await line.evaluate((el) => getComputedStyle(el).stroke), await tokenColour(name, "--chart-2"))
    await pressTotal(name, "Desktop")
    eq((await seriesKeys(name)).join(","), "desktop")
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

  await test('tooltip: trigger="click" ignores hover, toggles on a press, and a press outside dismisses', async () => {
    const name = "chart-tooltip-click"
    await hoverBand(name, 1)
    eq(await tooltip(name).count(), 0, "hover alone shows nothing")
    const box = await rect(`${pg(name)} .chart-surface`)
    const at = (i) => [box.x + (box.width / 6) * (i + 0.5), box.y + box.height * 0.5]
    const label = () => page.locator(`${pg(name)} .chart-tooltip-label`).textContent()
    await page.mouse.click(...at(1))
    await tooltip(name).waitFor()
    eq(await label(), "February")
    eq(await page.locator(`${pg(name)} .chart-cursor`).count(), 1, "the cursor band marks the pressed band")
    await page.mouse.click(...at(2))
    await page.waitForFunction(() => document.querySelector('[data-pg="chart-tooltip-click"] .chart-tooltip-label')?.textContent === "March")
    await page.mouse.move(...at(4))
    eq(await label(), "March", "moving the pointer does not move it")
    await page.mouse.click(...at(2))
    await tooltip(name).waitFor({ state: "detached" })
    await page.mouse.click(...at(0))
    await tooltip(name).waitFor()
    eq(await label(), "January")
    await page.locator("h2").click()
    await tooltip(name).waitFor({ state: "detached" })
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

  // ── Summary and data table ──

  const tableText = async (name) => ({
    headers: await page.locator(`${pg(name)} .chart-data-table thead th`).allTextContents(),
    rows: await page.locator(`${pg(name)} .chart-data-table tbody tr`).evaluateAll((trs) => trs.map((tr) => [...tr.children].map((c) => c.textContent))),
  })

  await test("summary: accessibilityLayer writes the generated text and wires aria-describedby to it", async () => {
    const svg = page.locator(`${pg("chart-keyboard")} .chart-surface`)
    const id = await svg.getAttribute("aria-describedby")
    eq(id.endsWith("-summary"), true, `describedby ${id}`)
    const summary = page.locator(`${pg("chart-keyboard")} .chart-summary`)
    eq(await summary.getAttribute("id"), id)
    eq(
      await summary.textContent(),
      "Chart with 2 series over 6 categories, January to June. " +
        "Desktop: range 73 to 305, lowest in April, peak in February, from 186 to 214 (up 28). " +
        "Mobile: range 80 to 200, lowest in January, peak in February, from 80 to 140 (up 60).",
    )
    const box = await rect(`${pg("chart-keyboard")} .chart-summary`)
    eq(box.width <= 1 && box.height <= 1, true, "the summary is not painted")
  })

  await test("summary: without accessibilityLayer nothing is generated or wired", async () => {
    eq(await page.locator(`${pg("chart-default")} .chart-summary`).count(), 0)
    eq(await page.locator(`${pg("chart-default")} .chart-surface`).getAttribute("aria-describedby"), null)
    eq(await page.locator(`${pg("chart-default")} .chart-data`).count(), 0, "and no table unless one is composed")
  })

  await test("summary: a consumer aria-describedby wins and no summary is rendered", async () => {
    const svg = page.locator(`${pg("chart-table-custom")} .chart-surface`)
    eq(await svg.getAttribute("tabindex"), "0", "precondition: accessibilityLayer is on")
    eq(await svg.getAttribute("aria-describedby"), "chart-table-note")
    eq(await page.locator(`${pg("chart-table-custom")} .chart-summary`).count(), 0)
  })

  await test("summary: pie and scatter read from their own data", async () => {
    eq(
      await page.locator(`${pg("chart-pie")} .chart-summary`).textContent(),
      "Visitors: 5 slices, range 90 to 275, lowest Other, peak Chrome, total 925.",
    )
    eq(
      await page.locator(`${pg("chart-scatter")} .chart-summary`).textContent(),
      "School A: 6 points, Stature 100 to 170, Weight 100 to 400. School B: 6 points, Stature 180 to 240, Weight 220 to 290.",
    )
  })

  await test("table: headers from config labels, one row per category, values from the data", async () => {
    const { headers, rows } = await tableText("chart-table")
    eq(JSON.stringify(headers), JSON.stringify(["month", "Desktop", "Mobile"]))
    eq(rows.length, 6)
    eq(JSON.stringify(rows[0]), JSON.stringify(["January", "186", "80"]))
    eq(JSON.stringify(rows[5]), JSON.stringify(["June", "214", "140"]))
    eq(await page.locator(`${pg("chart-table")} .chart-data-table tbody th[scope="row"]`).count(), 6)
    eq(await page.locator(`${pg("chart-table")} .chart-data-table caption`).textContent(), "Visitors by month")
  })

  await test("table: closed it is in the page but not painted; open it covers the chart", async () => {
    const table = page.locator(`${pg("chart-table")} .chart-data`)
    eq(await table.getAttribute("data-state"), "closed")
    const hidden = await rect(`${pg("chart-table")} .chart-data`)
    eq(hidden.width <= 1 && hidden.height <= 1, true, "closed: one pixel")
    await page.locator(`${pg("chart-table")} .chart-data-table th`).first().waitFor({ state: "attached" })
    await page.getByRole("button", { name: "Show data table" }).click()
    eq(await table.getAttribute("data-state"), "open")
    const chart = await rect(`${pg("chart-table")} .chart`)
    const shown = await rect(`${pg("chart-table")} .chart-data`)
    near(shown.x, chart.x, 1)
    near(shown.width, chart.width, 1)
    near(shown.height, chart.height, 1)
    eq(await page.locator(`${pg("chart-table")} .chart-data-table`).isVisible(), true)
    await page.getByRole("button", { name: "Show data table" }).click()
    eq(await table.getAttribute("data-state"), "closed")
  })

  await test("table: pie rows are the slices, named by config label", async () => {
    const { headers, rows } = await tableText("chart-table-pie")
    eq(JSON.stringify(headers), JSON.stringify(["browser", "Visitors"]))
    eq(rows.length, 5)
    eq(JSON.stringify(rows[0]), JSON.stringify(["Chrome", "275"]))
    eq(JSON.stringify(rows[4]), JSON.stringify(["Other", "90"]))
  })

  await test("table: scatter with several series adds a Series column, and the formatter gets each item's own index", async () => {
    const { headers, rows } = await tableText("chart-table-scatter")
    eq(JSON.stringify(headers), JSON.stringify(["Series", "Stature", "Weight"]))
    eq(rows.length, 12)
    eq(JSON.stringify(rows[0]), JSON.stringify(["School A", "0: 100", "1: 200"]), "x is item 0, y is item 1, not the cell position")
    eq(JSON.stringify(rows[6]), JSON.stringify(["School B", "0: 200", "1: 260"]))
  })

  await test("table: several pies add a Series column beside Name and Value", async () => {
    const { headers, rows } = await tableText("chart-table-pies")
    eq(JSON.stringify(headers), JSON.stringify(["Name", "Series", "Value"]), "pies naming slices by different fields share a neutral heading")
    eq(rows.length, 11)
    eq(JSON.stringify(rows[0]), JSON.stringify(["Chrome", "Visitors", "275"]))
    eq(JSON.stringify(rows[5]), JSON.stringify(["January", "Desktop", "186"]))
  })

  await test("table: numeric categories head their own rows, not the first series' label", async () => {
    const { headers, rows } = await tableText("chart-table-years")
    eq(JSON.stringify(headers), JSON.stringify(["year", "Sales"]))
    eq(JSON.stringify(rows.map((r) => r[0])), JSON.stringify(["2021", "2022", "2023"]))
    eq(JSON.stringify(rows[1]), JSON.stringify(["2022", "14"]))
  })

  await test("table: with no category key the row heads are the indices, not the first series' label", async () => {
    const { headers, rows } = await tableText("chart-table-index")
    eq(JSON.stringify(headers), JSON.stringify(["Category", "Desktop"]))
    eq(JSON.stringify(rows.map((r) => r[0])), JSON.stringify(["0", "1", "2", "3", "4", "5"]))
  })

  await test("table: a pie's row heads go through the tooltip's labelFormatter", async () => {
    const { rows } = await tableText("chart-table-pie-labelled")
    eq(JSON.stringify(rows.map((r) => r[0])), JSON.stringify(["Browser: chrome", "Browser: safari", "Browser: firefox", "Browser: edge", "Browser: other"]))
    eq(rows[0][1], "275")
  })

  await test("table: radial rows are the rings, headed by the radius axis key and named by config label", async () => {
    const { headers, rows } = await tableText("chart-table-radial")
    eq(JSON.stringify(headers), JSON.stringify(["browser", "Visitors"]))
    eq(rows.length, 5)
    eq(JSON.stringify(rows[0]), JSON.stringify(["Chrome", "275"]))
  })

  await test("table: radar rows follow the angle axis", async () => {
    const { headers, rows } = await tableText("chart-table-radar")
    eq(JSON.stringify(headers), JSON.stringify(["month", "Desktop"]))
    eq(rows.length, 6)
    eq(JSON.stringify(rows[1]), JSON.stringify(["February", "305"]))
  })

  await test("table: cells and row heads use the tooltip's formatters", async () => {
    const { rows } = await tableText("chart-table-custom")
    eq(rows[0][0], "January 2024")
    eq(rows[0][1], "desktop: 186 visitors")
    eq(rows.length, 6)
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

  await test("radar: a tick function draws each spoke's label; text it leaves uncoloured takes the tick colour", async () => {
    const name = "chart-radar-label-custom"
    eq(await page.locator(`${pg(name)} .chart-axis[data-axis="angle"] .chart-tick-text`).count(), 0, "the function replaces the built-in text")
    const ticks = await page.locator(`${pg(name)} .chart-tick-shape text`).evaluateAll((els) =>
      els.map((el) => ({
        text: el.textContent,
        x: Number(el.getAttribute("x")),
        anchor: el.getAttribute("text-anchor"),
        value: getComputedStyle(el.children[0]).fill,
        slash: getComputedStyle(el.children[1]).fill,
      })),
    )
    eq(ticks.map((t) => t.text).join(","), "186/80January,305/200February,237/120March,73/190April,209/130May,214/140June")
    eq(ticks.map((t) => t.anchor).join(","), "middle,start,start,middle,end,end", "anchors read outward")
    const cx = await page.locator(`${pg(name)} .chart-polar-grid line`).first().evaluate((el) => Number(el.getAttribute("x1")))
    near(ticks[0].x, cx, 0.01, "January above the centre")
    near(ticks[3].x, cx, 0.01, "April below it")
    eq(ticks[0].value, await tokenColour(name, "--foreground"), "a coloured tspan keeps its colour")
    eq(ticks[0].slash, await tokenColour(name, "--muted-foreground"), "an uncoloured one inherits the tick colour")
  })

  await test("radar: PolarGrid fill and fillOpacity fill every polygon or circle ring", async () => {
    for (const [name, round] of [
      ["chart-radar-grid-fill", false],
      ["chart-radar-grid-circle-fill", true],
    ]) {
      const rings = await page.locator(`${pg(name)} .chart-polar-ring`).evaluateAll((els) =>
        els.map((el) => ({ fill: getComputedStyle(el).fill, opacity: getComputedStyle(el).fillOpacity, d: el.getAttribute("d") })),
      )
      eq(rings.length >= 3, true, `${name}: rings`)
      const colour = await tokenColour(name, "--chart-1")
      for (const r of rings) {
        eq(r.fill, colour, `${name}: ring fill`)
        eq(r.opacity, "0.2", `${name}: ring fill opacity`)
        eq(r.d.includes(" A "), round, `${name}: ${round ? "circle" : "polygon"} ring`)
      }
    }
    eq(await page.locator(`${pg("chart-radar")} .chart-polar-ring`).first().evaluate((el) => getComputedStyle(el).fill), "none", "an unfilled grid stays unfilled")
  })

  await test("radial: one ring per row, innermost first, angle proportional to value, a muted track behind each", async () => {
    const bars = await sectors("chart-radial")
    eq(bars.length, 5)
    near(sweep(bars[0]) / sweep(bars[1]), 275 / 200, 0.01, "chrome/safari = 275/200")
    eq(bars.every((b) => b.start === 0), true, "all start at 0°")
    near(sweep(bars[0]), 360, 0.01, "no angle axis: the largest value closes the circle")
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
    near(desktop.end, 180, 0.01, "no angle axis: the stacked total fills the 180° sweep")
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

  // ── Hide and sync ──

  const yTop = async (name) => Number((await page.locator(`${pg(name)} .chart-axis[data-axis="y"] .chart-tick-text`).allTextContents()).at(-1).replace(/,/g, ""))
  const legendItem = (name, label) => page.locator(`${pg(name)} .chart-legend-item`, { hasText: label })
  const shown = (name, label) => legendItem(name, label).getAttribute("aria-pressed")
  const waitForSeries = (name, keys) =>
    page.waitForFunction(
      ([sel, keys]) => [...document.querySelectorAll(sel)].map((el) => el.dataset.key).join() === keys,
      [`${pg(name)} .chart-series`, keys],
    )
  const hoverBar = async (name, key, index) => {
    await page.locator(`${pg(name)} .chart-surface`).evaluate((el) => el.scrollIntoView({ block: "center" }))
    const r = (await barRects(name, key))[index]
    await page.mouse.move(r.x + r.width / 2, r.y + r.height / 2)
  }

  await test("hide: a hidden series leaves the drawing, the domain, the stack and the tooltip; a legend click brings it back", async () => {
    const name = "chart-hide"
    eq(await page.locator(`${pg(name)} button.chart-legend-item`).count(), 2, "toggle: each entry is a button")
    eq(await shown(name, "Mobile"), "false", 'hide: Mobile starts hidden, its entry kept')
    eq(await shown(name, "Desktop"), "true")
    eq(await legendItem(name, "Mobile").evaluate((el) => getComputedStyle(el).textDecorationLine), "line-through")
    eq(await legendItem(name, "Desktop").evaluate((el) => getComputedStyle(el).textDecorationLine), "none")
    eq((await seriesKeys(name)).join(), "desktop", "nothing drawn for Mobile")
    const before = await yTop(name)
    eq(before >= 305 && before < 505, true, `the axis fits Desktop alone (305), not the stack (505): top tick ${before}`)
    await hoverBar(name, "desktop", 1)
    await tooltip(name).waitFor()
    eq((await tooltip(name).locator(".chart-tooltip-name").allTextContents()).join(), "Desktop", "no tooltip row for a hidden series")
    await page.mouse.move(0, 0)
    await tooltip(name).waitFor({ state: "detached" })

    await legendItem(name, "Mobile").click()
    await waitForSeries(name, "desktop,mobile")
    eq(await shown(name, "Mobile"), "true")
    const after = await yTop(name)
    eq(after >= 505, true, `shown, the stack reaches 505: top tick ${after}`)
    const y = await valueScale(name, "y")
    const [, feb] = await bboxes(`${pg(name)} .chart-series[data-key="mobile"] .chart-bar`)
    near(feb.y, y(505), 0.01, "February's Mobile stacks on Desktop's 305")
    near(feb.bottom, y(305), 0.01)

    await legendItem(name, "Mobile").click()
    await waitForSeries(name, "desktop")
    eq(await yTop(name), before, "hidden again, the axis returns")
  })

  await test("hide: Space and Enter on a legend entry toggle its series; the default legend stays plain items", async () => {
    const name = "chart-hide"
    await legendItem(name, "Mobile").click()
    await waitForSeries(name, "desktop,mobile")
    await legendItem(name, "Desktop").focus()
    await page.keyboard.press("Space")
    await waitForSeries(name, "mobile")
    eq(await shown(name, "Desktop"), "false")
    const top = await yTop(name)
    eq(top >= 200 && top < 305, true, `the axis fits Mobile alone (200): top tick ${top}`)
    const y = await valueScale(name, "y")
    const [, feb] = await bboxes(`${pg(name)} .chart-series[data-key="mobile"] .chart-bar`)
    near(feb.bottom, y(0), 0.01, "with Desktop out of the stack, Mobile stands on zero")
    near(feb.y, y(200), 0.01)
    await page.keyboard.press("Enter")
    await waitForSeries(name, "desktop,mobile")
    eq(await shown(name, "Desktop"), "true")
    await legendItem(name, "Mobile").click()
    await waitForSeries(name, "desktop")

    const plain = page.locator(`${pg("chart-stacked")} .chart-legend-item`)
    eq(await plain.count(), 2, "precondition: the stacked demo has a legend")
    eq((await plain.evaluateAll((els) => els.map((el) => `${el.tagName}:${el.hasAttribute("aria-pressed")}:${el.hasAttribute("data-inactive")}`))).join(), "DIV:false:false,DIV:false:false")
  })

  await test("syncId: pointing at one chart shows the tooltip and cursor on the other at the same index, anchored on its own layout", async () => {
    const [bar, line] = ["chart-sync-bar", "chart-sync-line"]
    eq(await tooltip(bar).count(), 0, "precondition: no tooltips")
    eq(await tooltip(line).count(), 0)
    await hoverBar(bar, "desktop", 2)
    await tooltip(bar).waitFor()
    await tooltip(line).waitFor()
    eq((await tooltip(bar).locator(".chart-tooltip-value").allTextContents()).join(), "237")
    eq((await tooltip(line).locator(".chart-tooltip-value").allTextContents()).join(), "120", "March in the line chart's own data")
    eq(await tooltip(line).locator(".chart-tooltip-label").textContent(), "March")
    const [cursor] = await shape(`${pg(line)} .chart-cursor`, ["x1"])
    near(cursor.x1, await tickAt(line, "x", "Mar"), 0.01, "the synced cursor on March")
    // The pointer's point is in the bar chart's coordinates, mid-bar; a synced
    // tooltip anchors at the top of its own plot instead (margin 5 + gap 12).
    const ty = (name) => page.locator(`${pg(name)} .chart-tooltip-anchor`).evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).f)
    near(await ty(line), 17, 0.5)
    eq((await ty(bar)) > 40, true, "the hovered chart still follows the pointer")
    eq(await tooltip("chart-composed").count(), 0, "counter-precondition: a chart without the syncId is untouched")
    await page.mouse.move(0, 0)
    await tooltip(bar).waitFor({ state: "detached" })
    await tooltip(line).waitFor({ state: "detached" })
  })

  await test("syncId: stepping one chart by keyboard steps the other, and leaving clears both", async () => {
    const [bar, line] = ["chart-sync-bar", "chart-sync-line"]
    await page.locator(`${pg(line)} .chart-surface`).focus()
    await tooltip(bar).waitFor()
    eq((await tooltip(bar).locator(".chart-tooltip-value").allTextContents()).join(), "186", "focus lands on January in both")
    await page.keyboard.press("End")
    await page.waitForFunction((sel) => document.querySelector(sel)?.textContent === "214", `${pg(bar)} .chart-tooltip-value`)
    eq((await tooltip(line).locator(".chart-tooltip-value").allTextContents()).join(), "140")
    await page.locator("h2").click()
    await tooltip(bar).waitFor({ state: "detached" })
    await tooltip(line).waitFor({ state: "detached" })
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
