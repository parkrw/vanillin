export default async function run({ page, baseUrl, test, eq: strictEq, near }) {
  const eq = (actual, expected, message) =>
    strictEq(typeof actual === "object" && actual !== null ? JSON.stringify(actual) : actual, typeof expected === "object" && expected !== null ? JSON.stringify(expected) : expected, message)
  await page.goto(`${baseUrl}/#chart-gauge`)
  await page.waitForSelector('[data-pg="gauge-wide"] .chart-gauge-fill')
  await page.waitForFunction(() =>
    [...document.querySelectorAll('[data-pg^="bullet-"] .chart-surface, [data-pg^="gauge-"] .chart-surface')].every((svg) => svg.getAttribute("width") !== "320"),
  )

  const pg = (name) => `[data-pg="${name}"]`
  const svgSize = (name) =>
    page.locator(`${pg(name)} .chart-surface`).evaluate((el) => ({ width: Number(el.getAttribute("width")), height: Number(el.getAttribute("height")) }))
  const rectOf = (name, selector, index = 0) =>
    page.locator(`${pg(name)} ${selector}`).nth(index).evaluate((el) => ({
      x: Number(el.getAttribute("x")),
      y: Number(el.getAttribute("y")),
      width: Number(el.getAttribute("width")),
      height: Number(el.getAttribute("height")),
    }))
  const boxOf = (name, selector, index = 0) =>
    page.locator(`${pg(name)} ${selector}`).nth(index).evaluate((el) => {
      const b = el.getBBox()
      return { left: b.x, right: b.x + b.width, top: b.y, bottom: b.y + b.height }
    })
  const dial = (name) =>
    page.locator(`${pg(name)} .chart-gauge-dial`).evaluate((el) => ({ cx: Number(el.dataset.cx), cy: Number(el.dataset.cy), radius: Number(el.dataset.radius) }))
  const text = (name, selector) => page.locator(`${pg(name)} ${selector}`).allTextContents()
  const tokenColour = (name, token) =>
    page.locator(`${pg(name)} .chart`).evaluate((host, token) => {
      const probe = document.createElement("span")
      probe.style.color = `var(${token})`
      host.appendChild(probe)
      const value = getComputedStyle(probe).color
      probe.remove()
      return value
    }, token)
  const fillOf = (name, selector, index = 0) => page.locator(`${pg(name)} ${selector}`).nth(index).evaluate((el) => getComputedStyle(el).fill)

  // ── Bullet, horizontal ──

  await test("bullet: bands, measure and target sit on the scale along a line", async () => {
    const name = "bullet-horizontal"
    const { width, height } = await svgSize(name)
    // margin 5, scale labels 24 high; the plot is what is left.
    const plot = { x: 5, y: 5, width: width - 10, height: height - 10 - 24 }
    const at = (v) => plot.x + (v / 100) * plot.width
    eq(await page.locator(`${pg(name)} .chart-gauge-band`).count(), 3, "three bands")
    for (const [index, from, to] of [[0, 0, 50], [1, 50, 80], [2, 80, 100]]) {
      const r = await rectOf(name, ".chart-gauge-band", index)
      near(r.x, at(from), 0.01, `band ${index} start`)
      near(r.width, at(to) - at(from), 0.01, `band ${index} width`)
      near(r.y, plot.y, 0.01, `band ${index} top`)
      near(r.height, plot.height, 0.01, `band ${index} height`)
    }
    const measure = await rectOf(name, ".chart-gauge-measure")
    near(measure.x, at(0), 0.01, "measure starts at the scale's low end")
    near(measure.width, at(72) - at(0), 0.01, "measure runs to 72")
    near(measure.height, plot.height / 3, 0.01, "measure is a third of the band")
    near(measure.y, plot.y + plot.height / 3, 0.01, "and centred in it")
    const target = await rectOf(name, ".chart-gauge-target")
    near(target.x + target.width / 2, at(85), 0.01, "target tick at 85")
    near(target.height, (plot.height * 2) / 3, 0.01, "tick is two thirds of the band")
    if (!(target.x > measure.x + measure.width)) throw new Error("target 85 must lie beyond the measure 72")
    const labels = await page.locator(`${pg(name)} [data-axis="x"] text`).evaluateAll((els) => els.map((el) => [el.textContent, Number(el.getAttribute("x"))]))
    eq(labels.map((l) => l[0]).join(","), "0,20,40,60,80,100", "scale labels")
    near(labels[3][1], at(60), 0.01, "label 60 under 60")
  })

  await test("bullet: the value, its range name and the caption are printed", async () => {
    const name = "bullet-horizontal"
    eq(await text(name, ".chart-gauge-value"), ["72"], "value")
    eq(await text(name, ".chart-gauge-band-label"), ["Fair"], "72 is in the middle range")
    eq(await text(name, ".chart-gauge-label"), ["Revenue"], "caption")
    eq(await text("gauge-needle", ".chart-gauge-band-label"), ["Fair"], "same value, same range on the gauge")
  })

  await test("bullet: bands are graded neutrals in a strict order, the measure is not one of them", async () => {
    const name = "bullet-horizontal"
    const bands = await page.locator(`${pg(name)} .chart-gauge-band`).evaluateAll((els) => els.map((el) => getComputedStyle(el).fill))
    eq(new Set(bands).size, 3, "three distinct shades")
    const lightness = await page.evaluate((colours) => {
      const ctx = document.createElement("canvas").getContext("2d", { willReadFrequently: true })
      return colours.map((c) => {
        ctx.clearRect(0, 0, 1, 1)
        ctx.fillStyle = c
        ctx.fillRect(0, 0, 1, 1)
        const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data
        return r + g + b
      })
    }, bands)
    const rising = lightness[0] < lightness[1] && lightness[1] < lightness[2]
    const falling = lightness[0] > lightness[1] && lightness[1] > lightness[2]
    eq(rising || falling, true, `shades step one way: ${lightness}`)
    const measure = await fillOf(name, ".chart-gauge-measure")
    eq(bands.includes(measure), false, "the measure is its own colour")
    eq(measure, await tokenColour(name, "--foreground"), "strong foreground by default")
  })

  // ── Bullet, vertical ──

  await test("bullet: vertical puts the low end at the bottom and the measure and target on the scale", async () => {
    const name = "bullet-vertical"
    const { width, height } = await svgSize(name)
    // margin 5, scale labels 40 wide on the left.
    const plot = { x: 5 + 40, y: 5, width: width - 10 - 40, height: height - 10 }
    const at = (v) => plot.y + plot.height - (v / 100) * plot.height
    const bands = []
    for (let i = 0; i < 3; i++) bands.push(await rectOf(name, ".chart-gauge-band", i))
    near(bands[0].y + bands[0].height, at(0), 0.01, "lowest band sits on the bottom")
    near(bands[0].y, at(50), 0.01, "lowest band reaches 50")
    near(bands[2].y, at(100), 0.01, "highest band reaches the top")
    for (const band of bands) {
      near(band.x, plot.x, 0.01, "band left edge")
      near(band.width, plot.width, 0.01, "band spans the plot width")
    }
    const measure = await rectOf(name, ".chart-gauge-measure")
    near(measure.y, at(72), 0.01, "measure top at 72")
    near(measure.y + measure.height, at(0), 0.01, "measure stands on the bottom")
    near(measure.width, plot.width / 3, 0.01, "a third of the band wide")
    near(measure.x, plot.x + plot.width / 3, 0.01, "centred")
    const target = await rectOf(name, ".chart-gauge-target")
    near(target.y + target.height / 2, at(85), 0.01, "target tick at 85")
    near(target.width, (plot.width * 2) / 3, 0.01, "tick is two thirds of the band")
    const labels = await page.locator(`${pg(name)} [data-axis="y"] text`).evaluateAll((els) => els.map((el) => [el.textContent, Number(el.getAttribute("y"))]))
    eq(labels[0][0], "0", "first label is 0")
    near(labels[0][1], at(0), 0.01, "0 at the bottom")
    near(labels[labels.length - 1][1], at(100), 0.01, "100 at the top")
    const horizontal = await rectOf("bullet-horizontal", ".chart-gauge-measure")
    if (horizontal.width <= horizontal.height) throw new Error("horizontal measure must be wider than tall")
    if (measure.height <= measure.width) throw new Error("vertical measure must be taller than wide")
  })

  // ── Gauge ──

  await test("gauge: the needle points at the angle of the value on a 180 to 0 sweep", async () => {
    const name = "gauge-needle"
    const { cx, cy, radius } = await dial(name)
    const needle = await page.locator(`${pg(name)} .chart-gauge-needle`).evaluate((el) => ({
      x1: Number(el.getAttribute("x1")),
      y1: Number(el.getAttribute("y1")),
      x2: Number(el.getAttribute("x2")),
      y2: Number(el.getAttribute("y2")),
      angle: Number(el.dataset.angle),
    }))
    near(needle.x1, cx, 0.01, "needle starts at the hub")
    near(needle.y1, cy, 0.01, "hub height")
    const measured = (Math.atan2(needle.y1 - needle.y2, needle.x2 - needle.x1) * 180) / Math.PI
    near(measured, 180 - 0.72 * 180, 0.05, "72 of 100 on 180 to 0 is 50.4 degrees")
    near(needle.angle, 50.4, 0.01, "the angle it reports")
    near(Math.hypot(needle.x2 - needle.x1, needle.y2 - needle.y1), radius * (1 - 0.22 / 2), 0.05, "reaches the middle of the ring")
  })

  await test("gauge: a value past the end rests on the end, and is still printed as given", async () => {
    const name = "gauge-over"
    const needle = await page.locator(`${pg(name)} .chart-gauge-needle`).evaluate((el) => Number(el.dataset.angle))
    near(needle, 0, 0.01, "130 of 100 points at the end, 0 degrees")
    eq(await text(name, ".chart-gauge-value"), ["130"], "the reading is not rewritten")
    const normal = await page.locator(`${pg("gauge-needle")} .chart-gauge-needle`).evaluate((el) => Number(el.dataset.angle))
    if (Math.abs(normal) < 1) throw new Error("an in-range value must not sit on the end")
  })

  await test("gauge: threshold bands cover the ring from their own angles", async () => {
    const name = "gauge-needle"
    const { cx, cy, radius } = await dial(name)
    const inner = radius * (1 - 0.22)
    const rad = (deg) => (deg * Math.PI) / 180
    eq(await page.locator(`${pg(name)} .chart-gauge-band`).count(), 3, "three bands")
    const span = await page.locator(`${pg(name)} .chart-gauge-band`).evaluateAll((els) => els.map((el) => [Number(el.dataset.start), Number(el.dataset.end)]))
    eq(span, [[180, 90], [90, 36], [36, 0]], "50, 80 and 100 of 100 on the 180 sweep")
    const first = await boxOf(name, ".chart-gauge-band", 0)
    near(first.left, cx - radius, 0.1, "first band starts at the left end")
    near(first.right, cx, 0.1, "and ends at the top")
    near(first.bottom, cy, 0.1, "resting on the baseline")
    const second = await boxOf(name, ".chart-gauge-band", 1)
    near(second.left, cx, 0.1, "second starts at the top")
    near(second.right, cx + radius * Math.cos(rad(36)), 0.1, "and ends at 36 degrees")
    near(second.bottom, cy - inner * Math.sin(rad(36)), 0.1, "its low edge is the inner arc at 36")
    const third = await boxOf(name, ".chart-gauge-band", 2)
    near(third.right, cx + radius, 0.1, "third reaches the right end")
    near(third.left, cx + inner * Math.cos(rad(36)), 0.1, "and starts at the inner arc at 36")
    const fills = await page.locator(`${pg(name)} .chart-gauge-band`).evaluateAll((els) => els.map((el) => getComputedStyle(el).fill))
    eq(new Set(fills).size, 3, "three shades")
    eq(await page.locator(`${pg(name)} .chart-gauge-fill`).count(), 0, "a needle gauge has no fill arc")
  })

  await test("gauge: fill takes the colour of the band the value is in and marks where bands meet", async () => {
    const name = "gauge-fill"
    const { cx, cy, radius } = await dial(name)
    eq(await page.locator(`${pg(name)} .chart-gauge-needle`).count(), 0, "no needle on a fill gauge")
    const fill = await fillOf(name, ".chart-gauge-fill")
    const warning = await page.locator(`${pg(name)} .chart`).evaluate((host) => {
      const probe = document.createElement("span")
      probe.style.color = "light-dark(color-mix(in oklab, var(--warning) 70%, var(--warning-foreground) 30%), var(--warning))"
      host.appendChild(probe)
      const value = getComputedStyle(probe).color
      probe.remove()
      return value
    })
    eq(fill, warning, "72 is in the warning band")
    eq(fill === (await tokenColour(name, "--success")) || fill === (await tokenColour(name, "--destructive")), false, "not another band's colour")
    eq(Number(await page.locator(`${pg(name)} .chart-gauge-fill`).getAttribute("data-end")), 50.4, "fill ends at the value's angle")
    const box = await boxOf(name, ".chart-gauge-fill")
    near(box.left, cx - radius, 0.1, "fill starts at the left end")
    near(box.bottom, cy, 0.1, "on the baseline")
    const dividers = await page.locator(`${pg(name)} .chart-gauge-divider`).evaluateAll((els) =>
      els.map((el) => {
        const [x1, y1, x2, y2] = ["x1", "y1", "x2", "y2"].map((a) => Number(el.getAttribute(a)))
        return Math.atan2(y1 - y2, x2 - x1) * (180 / Math.PI)
      }),
    )
    eq(dividers.length, 2, "two dividers for three bands")
    // the first band edge, 60 of 100, is at 180 - 108 degrees; the second, 85, at 27.
    near(dividers[0], 72, 0.05, "divider at 60")
    near(dividers[1], 27, 0.05, "divider at 85")
    eq(await text(name, ".chart-gauge-band-label"), ["Warning"], "the band is named beside the value")
  })

  await test("gauge: a 270 degree sweep fits the plot and ends at the value's angle", async () => {
    const name = "gauge-wide"
    const { width, height } = await svgSize(name)
    eq(Number(await page.locator(`${pg(name)} .chart-gauge-fill`).getAttribute("data-end")), 117, "40 of 100 on 225 to -45 is 117 degrees")
    const track = await boxOf(name, ".chart-gauge-track")
    if (track.left < 0 || track.top < 0 || track.right > width || track.bottom > height) throw new Error(`arc leaves the svg: ${JSON.stringify(track)} in ${width}x${height}`)
    if (track.right - track.left < Math.min(width, height) * 0.7) throw new Error("arc should use most of the plot")
    eq(await text(name, ".chart-gauge-value"), ["40%"], "formatter shapes the value")
    eq(await text("gauge-needle", ".chart-gauge-value"), ["72"], "the default prints the plain number")
  })

  // ── Summary and aria-describedby ──

  await test("summary: accessibilityLayer wires a generated summary to the svg", async () => {
    const name = "bullet-horizontal"
    const svg = page.locator(`${pg(name)} .chart-surface`)
    const id = await svg.getAttribute("aria-describedby")
    if (!id) throw new Error("svg has no aria-describedby")
    eq(await svg.getAttribute("role"), "img", "role")
    const summary = page.locator(`${pg(name)} .chart-gauge-summary`)
    eq(await summary.getAttribute("id"), id, "points at the summary")
    eq(
      await summary.textContent(),
      "72 on a scale from 0 to 100, in the Fair range. Target 85, 13 short. Ranges: Poor 0 to 50; Fair 50 to 80; Good 80 to 100.",
      "summary text",
    )
    const gauge = await page.locator(`${pg("gauge-layer")} .chart-gauge-summary`).textContent()
    eq(gauge, "72 on a scale from 0 to 100, in the Fair range. Ranges: Poor 0 to 50; Fair 50 to 80; Good 80 to 100.", "a gauge has no target sentence")
  })

  await test("summary: without accessibilityLayer nothing is added; a consumer aria-describedby wins", async () => {
    const plain = "gauge-needle"
    eq(await page.locator(`${pg(plain)} .chart-gauge-summary`).count(), 0, "no summary element")
    eq(await page.locator(`${pg(plain)} .chart-surface`).getAttribute("aria-describedby"), null, "no aria-describedby")
    eq(await page.locator(`${pg(plain)} .chart-surface`).getAttribute("role"), null, "no role")
    eq(await page.locator(`${pg(plain)} .chart-gauge-value`).count(), 1, "the printed value is there regardless")
    const own = "bullet-vertical"
    eq(await page.locator(`${pg(own)} .chart-surface`).getAttribute("aria-describedby"), "bullet-note", "the consumer's id")
    eq(await page.locator(`${pg(own)} .chart-gauge-summary`).count(), 0, "no generated summary beside it")
    eq(await page.locator(`${pg(own)} .chart-surface`).getAttribute("role"), "img", "still an image under the layer")
    const noted = await page.locator("#bullet-note").textContent()
    eq(noted.includes("72"), true, "and the consumer's text exists")
  })

  await test("summary: a target past the end is compared as given, and drawn on the end", async () => {
    const summary = await page.locator(`${pg("bullet-over")} .chart-gauge-summary`).textContent()
    eq(summary.includes("Target 120, 15 short."), true, `105 against 120 is not met: ${summary}`)
    eq(summary.includes("met."), false, "not read as met")
    const { width } = await svgSize("bullet-over")
    const target = await rectOf("bullet-over", ".chart-gauge-target")
    near(target.x + target.width / 2, 5 + (width - 10), 0.01, "tick rests on the scale's end")
    const scaled = await page.locator(`${pg("bullet-scale")} .chart-gauge-summary`).textContent()
    eq(scaled.includes("Target 70, 60 short."), true, "a target beyond max keeps its own number")
  })

  await test("gauge: the hub sits inside the svg when the plot is wide and short", async () => {
    const { width, height } = await svgSize("gauge-flat")
    const hub = await boxOf("gauge-flat", ".chart-gauge-hub")
    if (hub.bottom > height - 5 + 0.01 || hub.top < 0 || hub.left < 5 - 0.01 || hub.right > width - 5 + 0.01) throw new Error(`hub leaves the margin box: ${JSON.stringify(hub)} in ${width}x${height}`)
    const track = await boxOf("gauge-flat", ".chart-gauge-track")
    if (track.top < 5 - 0.01) throw new Error("arc leaves the top margin")
  })

  await test("a missing value draws no measure, needle or fill and reads as no value", async () => {
    eq(await page.locator(`${pg("bullet-empty")} .chart-gauge-measure`).count(), 0, "no bullet measure")
    eq(await page.locator(`${pg("gauge-empty")} .chart-gauge-fill`).count(), 0, "no gauge fill for NaN")
    eq(await text("bullet-empty", ".chart-gauge-value"), ["No value"], "bullet readout")
    eq(await text("gauge-empty", ".chart-gauge-value"), ["No value"], "gauge readout")
    eq(await text("bullet-empty", ".chart-gauge-band-label"), [], "no range is claimed")
    eq(await page.locator(`${pg("bullet-empty")} .chart-gauge-target`).count(), 1, "the target tick is still drawn")
    eq(
      await page.locator(`${pg("bullet-empty")} .chart-gauge-summary`).textContent(),
      "No value on a scale from 0 to 100. Target 85. Ranges: Poor 0 to 50; Fair 50 to 80; Good 80 to 100.",
      "summary names the drawn target, with no shortfall",
    )
  })

  await test("bullet: bare-number bands are sorted into ascending ranges on a non-default scale", async () => {
    const name = "bullet-scale"
    const spans = await page.locator(`${pg(name)} .chart-gauge-band`).evaluateAll((els) => els.map((el) => [Number(el.dataset.from), Number(el.dataset.to)]))
    eq(spans, [[-50, -20], [-20, 0], [0, 50]], "given 50, 0, -20")
    const { width } = await svgSize(name)
    const at = (v) => 5 + ((v + 50) / 100) * (width - 10)
    const measure = await rectOf(name, ".chart-gauge-measure")
    near(measure.x, at(-50), 0.01, "measure starts at min")
    near(measure.width, at(10) - at(-50), 0.01, "and runs to 10")
    const labels = await page.locator(`${pg(name)} [data-axis="x"] text`).evaluateAll((els) => els.map((el) => [el.textContent, Number(el.getAttribute("x"))]))
    eq(labels[0][0], "-40", "first nice tick above min")
    near(labels[0][1], at(-40), 0.01, "placed on the offset scale")
    eq(labels[labels.length - 1][0], "40", "last nice tick below max")
  })

  await test("bullet: axisSize 0 leaves out the scale labels and gives the bands the room", async () => {
    const name = "bullet-bare"
    eq(await page.locator(`${pg(name)} [data-axis="x"] text`).count(), 0, "no labels")
    const { height } = await svgSize(name)
    near((await rectOf(name, ".chart-gauge-band", 0)).height, height - 10, 0.01, "band fills the plot height")
  })

  await test("bullet: aria-labelledby is passed to the svg and makes it an image", async () => {
    const svg = page.locator(`${pg("bullet-bare")} .chart-surface`)
    eq(await svg.getAttribute("aria-labelledby"), "bullet-bare-title", "id")
    eq(await svg.getAttribute("role"), "img", "role")
  })

  await test("gauge: a fill with no bands falls back to the first chart colour", async () => {
    eq(await fillOf("gauge-wide", ".chart-gauge-fill"), await tokenColour("gauge-wide", "--chart-1"), "--chart-1")
  })

  await test("a gauge ignores target; a formatter shapes scale labels and the shortfall without float noise", async () => {
    eq(await page.locator(`${pg("gauge-target")} .chart-gauge-summary`).textContent(), "72 on a scale from 0 to 100.", "no target sentence on a gauge")
    const labels = await page.locator(`${pg("bullet-unit")} [data-axis="x"] text`).allTextContents()
    eq(labels, ["0%", "20%", "40%", "60%", "80%", "100%"], "scale labels pass through the formatter")
    eq(
      await page.locator(`${pg("bullet-unit")} .chart-gauge-summary`).textContent(),
      "72.1% on a scale from 0% to 100%. Target 85.3%, 13.2% short.",
      "72.1 against 85.3 is 13.2 short",
    )
  })

  await test("summary: a value at or above the target reads met", async () => {
    eq((await page.locator(`${pg("bullet-met")} .chart-gauge-summary`).textContent()).includes("Target 85, met."), true, "equal is met")
    eq((await page.locator(`${pg("bullet-past")} .chart-gauge-summary`).textContent()).includes("Target 85, met."), true, "above is met")
  })

  await test("gauge: a sweep under 180 degrees keeps the whole ring inside the svg", async () => {
    const { width, height } = await svgSize("gauge-short")
    const track = await boxOf("gauge-short", ".chart-gauge-track")
    if (track.left < 5 - 0.01 || track.top < 5 - 0.01 || track.right > width - 5 + 0.01 || track.bottom > height - 5 + 0.01) throw new Error(`ring leaves the margin box: ${JSON.stringify(track)} in ${width}x${height}`)
  })

  await test("a stray scale prop does not displace the shell's own", async () => {
    eq(await text("bullet-stray", ".chart-gauge-value"), ["72"], "value")
    eq(await page.locator(`${pg("bullet-stray")} .chart-gauge-summary`).textContent(), "72 on a scale from 0 to 100.", "summary")
  })

  await test("unlabelled bands are named by their span in the readout and summary", async () => {
    eq(await text("bullet-unnamed", ".chart-gauge-band-label"), ["50–80"], "readout")
    eq(
      await page.locator(`${pg("bullet-unnamed")} .chart-gauge-summary`).textContent(),
      "72 on a scale from 0 to 100, in the 50 to 80 range. Ranges: 0 to 50; 50 to 80; 80 to 100.",
      "summary",
    )
  })

  await test("accessibilityLayer names the svg when no label is given", async () => {
    eq(await page.locator(`${pg("bullet-unnamed")} .chart-surface`).getAttribute("aria-label"), "Bullet chart", "bullet fallback")
    eq(await page.locator(`${pg("gauge-unnamed")} .chart-surface`).getAttribute("aria-label"), "Load", "the caption names it")
    eq(await page.locator(`${pg("bullet-over")} .chart-surface`).getAttribute("aria-label"), "Over the scale", "a given name wins")
  })

  await test("summary: tiny and fractional differences keep their own precision", async () => {
    const tiny = await page.locator(`${pg("bullet-tiny")} .chart-gauge-summary`).textContent()
    eq(tiny.includes("Target 0.0000003, 0.0000002 short."), true, tiny)
  })

  await test("bullet: min above max is read as the same scale swapped", async () => {
    const name = "bullet-swapped"
    const { width } = await svgSize(name)
    const measure = await rectOf(name, ".chart-gauge-measure")
    near(measure.x, 5, 0.01, "starts at the low end")
    near(measure.width, 0.72 * (width - 10), 0.01, "runs to 72")
    eq((await text(name, ".chart-gauge-value"))[0], "72", "value")
  })

  await test("a band's own colour is drawn; its neighbour stays neutral", async () => {
    for (const name of ["bullet-colour", "gauge-colour"]) {
      const fills = await page.locator(`${pg(name)} .chart-gauge-band`).evaluateAll((els) => els.map((el) => getComputedStyle(el).fill))
      eq(fills[0], "rgb(255, 0, 0)", `${name} band 0`)
      eq(fills[1] === "rgb(255, 0, 0)", false, `${name} band 1`)
    }
  })

  await test("gauge: thickness sets the ring width as a share of the radius", async () => {
    const { cx, cy, radius } = await dial("gauge-wide")
    const covers = (r) =>
      page.locator(`${pg("gauge-wide")} .chart-gauge-track`).evaluate((el, [x, y]) => el.isPointInFill(new DOMPoint(x, y)), [cx, cy - r])
    eq(await covers(radius * 0.85 + 0.5), true, "just inside the outer edge of a 0.15 ring")
    eq(await covers(radius * 0.85 - 0.5), false, "just inside the inner edge, empty")
    eq(await covers(radius + 0.5), false, "outside the ring")
  })

  await test("summary: a shortfall far below a billionth is never printed as zero", async () => {
    const summary = await page.locator(`${pg("bullet-sliver")} .chart-gauge-summary`).textContent()
    eq(summary.includes("0.00000000002 short."), true, summary)
  })

  await test("gauge: a huge sweep renders without error and stays inside the svg", async () => {
    const { width, height } = await svgSize("gauge-huge")
    const track = await boxOf("gauge-huge", ".chart-gauge-track")
    if (track.left < -0.01 || track.top < -0.01 || track.right > width + 0.01 || track.bottom > height + 0.01) throw new Error(`ring leaves the svg: ${JSON.stringify(track)}`)
  })

  await test("gauge: a needle gauge with no value draws no needle or hub and reads no value", async () => {
    eq(await page.locator(`${pg("gauge-hollow")} .chart-gauge-needle`).count(), 0, "no needle")
    eq(await page.locator(`${pg("gauge-hollow")} .chart-gauge-hub`).count(), 0, "no hub")
    eq(await text("gauge-hollow", ".chart-gauge-value"), ["No value"], "readout")
  })

  await test("accessibilityLayer names an unlabelled gauge", async () => {
    eq(await page.locator(`${pg("gauge-bare")} .chart-surface`).getAttribute("aria-label"), "Gauge", "fallback name")
  })

  await test("gauge: a custom margin moves the drawing", async () => {
    const plain = await boxOf("gauge-flat", ".chart-gauge-track")
    const moved = await boxOf("gauge-margin", ".chart-gauge-track")
    eq((await svgSize("gauge-margin")).width, (await svgSize("gauge-flat")).width, "same width")
    near(moved.left - plain.left, 17.5, 0.5, "a 40px left margin in place of 5 shifts the centred ring by half the 35px difference")
  })

  await test("summary: the generated paragraph is hidden from the reading order but still describes the svg", async () => {
    const name = "bullet-horizontal"
    const described = await page.locator(`${pg(name)} .chart-surface`).evaluate((svg) => {
      const el = document.getElementById(svg.getAttribute("aria-describedby"))
      return { hidden: el.hidden, text: el.textContent, visible: el.getClientRects().length }
    })
    eq(described.hidden, true, "hidden attribute")
    eq(described.visible, 0, "takes no space")
    eq(described.text.startsWith("72 on a scale from 0 to 100"), true, "the description is its text")
  })

  await test("summary: a shortfall below 1e-100 is not printed as zero", async () => {
    const summary = await page.locator(`${pg("bullet-minute")} .chart-gauge-summary`).textContent()
    eq(summary.includes("Target"), true, summary)
    eq(summary.includes(", 0 short"), false, summary)
  })

  await test("bullet: bands past the end are clamped; bands at the start or repeated are dropped", async () => {
    const spans = await page.locator(`${pg("bullet-clamp")} .chart-gauge-band`).evaluateAll((els) => els.map((el) => [Number(el.dataset.from), Number(el.dataset.to), Number(el.getAttribute("width"))]))
    eq(spans.map((s) => [s[0], s[1]]), [[0, 30], [30, 70], [70, 100]], "given 0, 30, 30, 70, 150")
    eq(spans.every((s) => s[2] > 0), true, "no zero-width band is drawn")
  })

  await test("the container's measure colour paints the bullet measure and the gauge fill", async () => {
    eq(await fillOf("bullet-measure-colour", ".chart-gauge-measure"), "rgb(200, 30, 30)", "measure")
    eq(await fillOf("gauge-measure-colour", ".chart-gauge-fill"), "rgb(200, 30, 30)", "fill")
    eq((await fillOf("bullet-horizontal", ".chart-gauge-measure")) === "rgb(200, 30, 30)", false, "other charts keep the default")
  })

  await test("forced-colors: marks opt out of adjustment, keep a toned fill's colour and take an edge", async () => {
    const marks = [
      ["bullet-horizontal", ".chart-gauge-band"],
      ["bullet-horizontal", ".chart-gauge-measure"],
      ["gauge-fill", ".chart-gauge-fill"],
      ["gauge-fill", ".chart-gauge-track"],
    ]
    const adjust = (name, sel) => page.locator(`${pg(name)} ${sel}`).first().evaluate((el) => getComputedStyle(el).forcedColorAdjust)
    for (const [name, sel] of marks) eq((await adjust(name, sel)) === "none", false, `${sel} is adjustable outside forced colours`)
    try {
      await page.emulateMedia({ forcedColors: "active" })
      for (const [name, sel] of marks) eq(await adjust(name, sel), "none", `${sel} opts out`)
      eq(await page.locator(`${pg("gauge-fill")} .chart-gauge-fill`).evaluate((el) => getComputedStyle(el).strokeWidth), "1px", "edge")
      const { cx, cy, radius } = await dial("gauge-fill")
      const at = await page.locator(`${pg("gauge-fill")} .chart-surface`).evaluate((svg, [cx, cy, r]) => {
        svg.scrollIntoView({ block: "center" })
        const box = svg.getBoundingClientRect()
        const a = (120 * Math.PI) / 180
        return { x: Math.round(box.x + cx + r * Math.cos(a)) - 2, y: Math.round(box.y + cy - r * Math.sin(a)) - 2, width: 4, height: 4 }
      }, [cx, cy, radius * (1 - 0.11)])
      const shot = await page.screenshot({ clip: at })
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
      eq(Math.max(r, g, b) - Math.min(r, g, b) > 60, true, `fill paints in colour under forced-colors, got rgb(${r},${g},${b})`)
    } finally {
      await page.emulateMedia({ forcedColors: null })
    }
  })

  await test("bullet: a line is drawn on each interior band boundary, in both layouts", async () => {
    const h = "bullet-horizontal"
    const hs = await svgSize(h)
    const hLines = await page.locator(`${pg(h)} .chart-gauge-boundary`).evaluateAll((els) => els.map((el) => ["x1", "x2", "y1", "y2"].map((a) => Number(el.getAttribute(a)))))
    eq(hLines.length, 2, "three bands, two boundaries")
    const hBand = await rectOf(h, ".chart-gauge-band", 0)
    for (const [k, v] of [[0, 50], [1, 80]]) {
      const x = 5 + (v / 100) * (hs.width - 10)
      near(hLines[k][0], x, 0.01, `boundary ${v} x1`)
      near(hLines[k][1], x, 0.01, `boundary ${v} x2`)
      near(hLines[k][2], hBand.y, 0.01, "from the top of the bands")
      near(hLines[k][3], hBand.y + hBand.height, 0.01, "to the bottom")
    }
    const v = "bullet-vertical"
    const vs = await svgSize(v)
    const vLines = await page.locator(`${pg(v)} .chart-gauge-boundary`).evaluateAll((els) => els.map((el) => ["x1", "x2", "y1", "y2"].map((a) => Number(el.getAttribute(a)))))
    eq(vLines.length, 2, "two boundaries")
    const vBand = await rectOf(v, ".chart-gauge-band", 0)
    for (const [k, val] of [[0, 50], [1, 80]]) {
      const y = 5 + vs.height - 10 - (val / 100) * (vs.height - 10)
      near(vLines[k][2], y, 0.01, `boundary ${val} y1`)
      near(vLines[k][3], y, 0.01, `boundary ${val} y2`)
      near(vLines[k][0], vBand.x, 0.01, "from the band's left edge")
      near(vLines[k][1], vBand.x + vBand.width, 0.01, "to its right edge")
    }
  })

  await test("gauge: a needle gauge has a line on each interior band boundary, a fill gauge none of its own", async () => {
    const name = "gauge-needle"
    const { cx, cy, radius } = await dial(name)
    const inner = radius * (1 - 0.22)
    const lines = await page.locator(`${pg(name)} .chart-gauge-boundary`).evaluateAll((els) => els.map((el) => ["x1", "y1", "x2", "y2"].map((a) => Number(el.getAttribute(a)))))
    eq(lines.length, 2, "two boundaries")
    for (const [k, deg] of [[0, 90], [1, 36]]) {
      const [x1, y1, x2, y2] = lines[k]
      near((Math.atan2(cy - y2, x2 - cx) * 180) / Math.PI, deg, 0.05, `outer end at ${deg} degrees`)
      near(Math.hypot(x1 - cx, y1 - cy), inner, 0.05, "inner end on the inner arc")
      near(Math.hypot(x2 - cx, y2 - cy), radius, 0.05, "outer end on the outer arc")
    }
    eq(await page.locator(`${pg("gauge-fill")} .chart-gauge-boundary`).count(), 0, "the fill variant keeps its own dividers")
  })

  await test("the band boundary line clears 3:1 against both bands beside it and the page, in light and dark", async () => {
    const measure = () =>
      page.evaluate(() => {
        const ctx = document.createElement("canvas").getContext("2d", { willReadFrequently: true })
        const rgb = (css) => {
          ctx.clearRect(0, 0, 1, 1)
          ctx.fillStyle = css
          ctx.fillRect(0, 0, 1, 1)
          return [...ctx.getImageData(0, 0, 1, 1).data].slice(0, 3)
        }
        const lum = (c) => {
          const [r, g, b] = c.map((v) => {
            const x = v / 255
            return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4
          })
          return 0.2126 * r + 0.7152 * g + 0.0722 * b
        }
        const ratio = (a, b) => {
          const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x)
          return (hi + 0.05) / (lo + 0.05)
        }
        const page = rgb(getComputedStyle(document.body).backgroundColor)
        const out = []
        for (const name of ["bullet-horizontal", "bullet-vertical", "gauge-needle"]) {
          const root = document.querySelector(`[data-pg="${name}"]`)
          const bands = [...root.querySelectorAll(".chart-gauge-band")].map((el) => rgb(getComputedStyle(el).fill))
          const lines = [...root.querySelectorAll(".chart-gauge-boundary")].map((el) => rgb(getComputedStyle(el).stroke))
          lines.forEach((line, k) => out.push({ name, k, low: ratio(line, bands[k]), high: ratio(line, bands[k + 1]), page: ratio(line, page) }))
        }
        return out
      })
    try {
      for (const scheme of ["light", "dark"]) {
        await page.emulateMedia({ colorScheme: scheme })
        await page.goto("about:blank")
        await page.goto(`${baseUrl}/#chart-gauge`)
        await page.waitForSelector('[data-pg="gauge-needle"] .chart-gauge-boundary', { state: "attached" })
        eq(await page.evaluate(() => document.documentElement.classList.contains("dark")), scheme === "dark", `the ${scheme} scheme is in effect`)
        await page.waitForFunction(() => [...document.querySelectorAll('[data-pg^="bullet-"] .chart-surface, [data-pg^="gauge-"] .chart-surface')].every((svg) => svg.getAttribute("width") !== "320"))
        for (const r of await measure()) {
          for (const [what, ratio] of [["lower band", r.low], ["upper band", r.high], ["page", r.page]]) {
            if (ratio < 3) throw new Error(`${scheme} ${r.name} boundary ${r.k} against the ${what} is ${ratio.toFixed(2)}:1`)
          }
        }
      }
    } finally {
      await page.emulateMedia({ colorScheme: "light" })
      await page.goto("about:blank")
      await page.goto(`${baseUrl}/#chart-gauge`)
      await page.waitForSelector('[data-pg="gauge-wide"] .chart-gauge-fill')
    }
  })

  await test("summary: a fractional shortfall prints at the precision of the values", async () => {
    const summary = await page.locator(`${pg("bullet-fraction")} .chart-gauge-summary`).textContent()
    eq(summary.startsWith("0.0015 on a scale"), true, summary)
    eq(summary.includes("Target 0.0019, 0.0004 short."), true, summary)
  })

  await test("accessibilityLayer marks the svg as a chart", async () => {
    eq(await page.locator(`${pg("bullet-horizontal")} .chart-surface`).getAttribute("aria-roledescription"), "chart", "with the layer")
    eq(await page.locator(`${pg("gauge-needle")} .chart-surface`).getAttribute("aria-roledescription"), null, "without it")
  })

  await test("the readout sits above a bullet's plot and below a gauge's", async () => {
    const rects = (name) =>
      page.locator(`${pg(name)} .chart-layout`).evaluate((root) => {
        const r = (sel) => root.querySelector(sel).getBoundingClientRect()
        return { readout: { top: r(".chart-gauge-readout").top, bottom: r(".chart-gauge-readout").bottom }, plot: { top: r(".chart-plot").top, bottom: r(".chart-plot").bottom } }
      })
    const bullet = await rects("bullet-horizontal")
    if (!(bullet.readout.bottom <= bullet.plot.top + 0.5)) throw new Error(`bullet readout is not above its plot: ${JSON.stringify(bullet)}`)
    const gauge = await rects("gauge-needle")
    if (!(gauge.readout.top >= gauge.plot.bottom - 0.5)) throw new Error(`gauge readout is not below its plot: ${JSON.stringify(gauge)}`)
  })

  await test("a band's colour beats the container's measure colour on a fill gauge", async () => {
    const banded = await fillOf("gauge-tone-over", ".chart-gauge-fill")
    eq(banded, await fillOf("gauge-fill", ".chart-gauge-fill"), "the warning band's colour")
    eq(banded === "rgb(200, 30, 30)", false, "not the container's measure colour")
  })

  await test("summary: a reported shortfall never prints the value and target alike", async () => {
    for (const name of ["bullet-near", "bullet-near-one"]) {
      const summary = await page.locator(`${pg(name)} .chart-gauge-summary`).textContent()
      const [, value, target] = summary.match(/^(\S+) on a scale.* Target (\S+),/)
      eq(value !== target, true, summary)
    }
    const near5 = await page.locator(`${pg("bullet-near")} .chart-gauge-summary`).textContent()
    eq(near5.includes("Target 5.0004, 0.0004 short."), true, near5)
  })

  await test("gauge: the needle angle follows a non-default or swapped scale", async () => {
    const angle = (name) => page.locator(`${pg(name)} .chart-gauge-needle`).evaluate((el) => Number(el.dataset.angle))
    near(await angle("gauge-offset"), 45, 0.01, "25 on -50 to 50 is three quarters round: 45 degrees")
    near(await angle("gauge-reversed"), 135, 0.01, "25 on 100 to 0 is read on 0 to 100: 135 degrees")
  })
}
