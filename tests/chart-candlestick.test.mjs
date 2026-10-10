export default async function run({ page, baseUrl, test, eq: strictEq, near }) {
  const eq = (actual, expected, message) =>
    strictEq(typeof actual === "object" && actual !== null ? JSON.stringify(actual) : actual, typeof expected === "object" && expected !== null ? JSON.stringify(expected) : expected, message)
  const pageErrors = []
  page.on("pageerror", (e) => pageErrors.push(e.message))

  await page.goto(`${baseUrl}/#chart-candlestick`)
  await page.waitForSelector('[data-pg="candlestick-default"] .chart-candlestick-body')
  await page.waitForFunction(() =>
    [...document.querySelectorAll('[data-pg^="candlestick-"] .chart-surface')].every((svg) => svg.getAttribute("width") !== "320"),
  )

  const pg = (name) => `[data-pg="${name}"]`
  const pane = (name, which = "price") => `${pg(name)} [data-pane="${which}"]`
  const mark = (name, index) => `${pane(name)} .chart-candlestick-mark[data-index="${index}"]`
  const svgSize = (name, which = "price") =>
    page.locator(`${pane(name, which)} .chart-surface`).evaluate((el) => ({ width: Number(el.getAttribute("width")), height: Number(el.getAttribute("height")) }))
  const attrs = (locator, names) => locator.evaluate((el, names) => Object.fromEntries(names.map((n) => [n, Number(el.getAttribute(n))])), names)
  const body = (name, index) => attrs(page.locator(`${mark(name, index)} .chart-candlestick-body`), ["x", "y", "width", "height"])
  const wick = (name, index) => attrs(page.locator(`${mark(name, index)} .chart-candlestick-wick`), ["x1", "x2", "y1", "y2"])
  const paint = (selector) =>
    page.locator(selector).evaluate((el) => {
      const s = getComputedStyle(el)
      return { fill: s.fill, stroke: s.stroke }
    })
  const valueTicks = async (name, which = "price") => {
    const texts = await page.locator(`${pane(name, which)} [data-axis="value"] text`).allTextContents()
    return texts.map((t) => Number(t.replace(/,/g, "")))
  }
  // What a colour expression computes to, resolved inside the chart so scoped tokens apply.
  const resolved = (name, expression) =>
    page.locator(`${pane(name)}`).evaluate((el, expression) => {
      const probe = document.createElement("span")
      probe.style.color = expression
      el.appendChild(probe)
      const colour = getComputedStyle(probe).color
      probe.remove()
      return colour
    }, expression)
  const activeMarks = (name) => page.locator(`${pane(name)} .chart-candlestick-mark[data-active]`).evaluateAll((els) => els.map((el) => Number(el.dataset.index)))
  const activeBars = (name) => page.locator(`${pane(name, "volume")} .chart-candlestick-volume-bar[data-active]`).evaluateAll((els) => els.map((el) => Number(el.dataset.index)))
  const hover = async (selector) => {
    await page.locator(selector).evaluate((el) => el.scrollIntoView({ block: "center" }))
    const b = await page.locator(selector).boundingBox()
    await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2)
  }
  const focusSurface = async (name, which = "price") => {
    await page.locator(`${pane(name, which)} .chart-surface`).evaluate((el) => el.scrollIntoView({ block: "center" }))
    await page.locator(`${pane(name, which)} .chart-surface`).focus()
  }

  // Price pane of a demo with row labels: margin 5, price labels 56 wide, row labels 24 high, eight rows, gap 0.3.
  const geometry = async (name, labels = true) => {
    const { width, height } = await svgSize(name)
    const plot = { x: 5 + 56, y: 5, width: width - 10 - 56, height: height - 10 - (labels ? 24 : 0) }
    const ticks = await valueTicks(name)
    const [lo, hi] = [ticks[0], ticks[ticks.length - 1]]
    const y = (v) => plot.y + plot.height * (1 - (v - lo) / (hi - lo))
    const step = plot.width / 8
    const bw = step * 0.7
    const left = (i) => plot.x + (step - bw) / 2 + i * step
    return { plot, ticks, y, step, bw, left, mid: (i) => left(i) + bw / 2 }
  }

  await test("candlestick: body and wick sit on the price scale", async () => {
    const name = "candlestick-default"
    const g = await geometry(name)
    eq(g.ticks[0] <= 98 && g.ticks[g.ticks.length - 1] >= 120, true, `axis covers the lows and highs: ${g.ticks}`)
    eq(await page.locator(`${pane(name)} .chart-candlestick-body`).count(), 7, "seven candles; the row with no prices has none")
    // Rising: 100 to 110, wick 98 to 112.
    const up = await body(name, 0)
    near(up.x, g.left(0), 0.01, "body left is the band start")
    near(up.width, g.bw, 0.01, "body width is the band")
    near(up.y, g.y(110), 0.01, "body top is the close of a rising row")
    near(up.height, g.y(100) - g.y(110), 0.01, "body height is open to close")
    const w = await wick(name, 0)
    near(w.x1, g.mid(0), 0.01, "wick on the centre line")
    eq(w.x1 === w.x2, true, "wick is vertical")
    near(w.y1, g.y(112), 0.01, "wick starts at the high")
    near(w.y2, g.y(98), 0.01, "wick ends at the low")
    // Falling: 110 to 104, so the open is the top.
    const down = await body(name, 1)
    near(down.y, g.y(110), 0.01, "body top is the open of a falling row")
    near(down.height, g.y(104) - g.y(110), 0.01, "body height is close to open")
    near((await wick(name, 1)).y1, g.y(115), 0.01, "second wick high")
    near(down.x, g.left(1), 0.01, "second candle on the second band")
  })

  await test("candlestick: rising rows are tinted in the up colour, falling rows solid in the down colour", async () => {
    const name = "candlestick-default"
    const upColour = await resolved(name, "var(--chart-2)")
    const downColour = await resolved(name, "var(--chart-1)")
    eq(upColour !== downColour, true, "precondition: the two colours differ")
    const up = await paint(`${mark(name, 0)} .chart-candlestick-body`)
    const down = await paint(`${mark(name, 1)} .chart-candlestick-body`)
    eq(up.stroke, upColour, "rising outline is the up colour")
    eq(down.stroke, downColour, "falling outline is the down colour")
    eq(down.fill, downColour, "falling body is solid")
    eq(up.fill !== upColour, true, "rising body is a tint, not solid: direction is not hue alone")
    eq((await paint(`${mark(name, 0)} .chart-candlestick-wick`)).stroke, upColour, "wick follows the direction, rising")
    eq((await paint(`${mark(name, 1)} .chart-candlestick-wick`)).stroke, downColour, "wick follows the direction, falling")
    eq(await page.locator(mark(name, 0)).getAttribute("data-direction"), "up", "direction attribute, rising")
    eq(await page.locator(mark(name, 1)).getAttribute("data-direction"), "down", "direction attribute, falling")
  })

  await test("candlestick: colours come from the config entries, not fixed values", async () => {
    const name = "candlestick-legend"
    eq((await paint(`${mark(name, 0)} .chart-candlestick-body`)).stroke, "rgb(20, 120, 60)", "up entry colours a rising row")
    eq((await paint(`${mark(name, 1)} .chart-candlestick-body`)).stroke, "rgb(200, 30, 30)", "down entry colours a falling row")
    const swatches = await page.locator(`${pane(name)} .chart-legend-item`).allTextContents()
    eq(swatches.map((t) => t.trim()), ["Gain", "Loss"], "legend lists the config labels")
    const volume = await page.locator(`${pane(name, "volume")} .chart-legend-item`).allTextContents()
    eq(volume.map((t) => t.trim()), ["Gain", "Loss"], "the volume pane's legend lists the same entries")
    const swatchColours = await page.locator(`${pane(name, "volume")} .chart-legend-swatch`).evaluateAll((els) => els.map((el) => getComputedStyle(el).backgroundColor))
    const bars = page.locator(`${pane(name, "volume")} .chart-candlestick-volume-bar`)
    const barFill = (direction) => bars.and(page.locator(`[data-direction="${direction}"]`)).first().evaluate((el) => getComputedStyle(el).fill)
    eq(swatchColours, [await barFill("up"), await barFill("down")], "each swatch is the colour of its bars")
    eq(swatchColours[0] === swatchColours[1], false, "counter-precondition: rising and falling bars differ")
  })

  await test("candlestick: an open equal to the close is a flat body; a row without prices keeps its slot", async () => {
    const name = "candlestick-default"
    const g = await geometry(name)
    const flat = await body(name, 4)
    eq(flat.height, 0, "no body height")
    near(flat.y, g.y(108), 0.01, "at the price")
    eq(await page.locator(mark(name, 4)).getAttribute("data-direction"), "flat", "direction attribute")
    const foreground = await resolved(name, "var(--foreground)")
    eq((await paint(`${mark(name, 4)} .chart-candlestick-body`)).stroke, foreground, "drawn in the text colour")
    eq(await page.locator(mark(name, 5)).count(), 0, "no mark for the row without prices")
    near((await body(name, 6)).x, g.left(6), 0.01, "the row after it is still on its own band")
    const labels = await page.locator(`${pane(name)} [data-axis="category"] text`).allTextContents()
    eq(labels.includes("Mon 8"), true, "the empty row's label is still on the axis")
  })

  await test("candlestick: OHLC ticks point left at the open and right at the close", async () => {
    const name = "candlestick-ohlc"
    const { width, height } = await svgSize(name)
    const plot = { x: 61, y: 5, width: width - 66, height: height - 34 }
    const y = (v) => plot.y + plot.height * (1 - (v - 90) / 40)
    eq(await page.locator(`${pane(name)} .chart-candlestick-body`).count(), 0, "counter-precondition: no bodies")
    eq((await valueTicks(name)).slice(0, 1).concat((await valueTicks(name)).slice(-1)), [90, 130], "domain pinned")
    const step = plot.width / 8
    const mid = plot.x + step / 2
    const open = await attrs(page.locator(`${mark(name, 0)} .chart-candlestick-open`), ["x1", "x2", "y1", "y2"])
    const close = await attrs(page.locator(`${mark(name, 0)} .chart-candlestick-close`), ["x1", "x2", "y1", "y2"])
    near(open.y1, y(100), 0.01, "open tick at the open")
    near(open.x2, mid, 0.01, "open tick ends on the centre line")
    near(open.x1, mid - (step * 0.7) / 2, 0.01, "and reaches left")
    near(close.y1, y(110), 0.01, "close tick at the close")
    near(close.x1, mid, 0.01, "close tick starts on the centre line")
    near(close.x2, mid + (step * 0.7) / 2, 0.01, "and reaches right")
    const w = await wick(name, 0)
    near(w.y1, y(112), 0.01, "wick high")
    near(w.y2, y(98), 0.01, "wick low")
  })

  await test("candlestick: the volume pane's bars sit on a zero-based scale and line up with the candles", async () => {
    const name = "candlestick-linked"
    const { width, height } = await svgSize(name, "volume")
    const plot = { x: 61, y: 5, width: width - 66, height: height - 34 }
    const ticks = await valueTicks(name, "volume")
    eq(ticks[0], 0, "axis starts at zero")
    const top = ticks[ticks.length - 1]
    eq(top >= 3100, true, `axis reaches the largest volume: ${ticks}`)
    const y = (v) => plot.y + plot.height * (1 - v / top)
    const bar = (i) => attrs(page.locator(`${pane(name, "volume")} .chart-candlestick-volume-bar[data-index="${i}"]`), ["x", "y", "width", "height"])
    const b3 = await bar(3)
    near(b3.y, y(3100), 0.01, "bar top is the volume")
    near(b3.y + b3.height, y(0), 0.01, "bar sits on the zero line")
    near(b3.x, (await body(name, 3)).x, 0.01, "bar is under its candle, left edge")
    near(b3.width, (await body(name, 3)).width, 0.01, "and as wide")
    eq(await page.locator(`${pane(name, "volume")} .chart-candlestick-volume-bar`).count(), 8, "a bar per row, the zero-volume row included")
    eq((await bar(5)).height, 0, "zero volume has no height")
    const upColour = await resolved(name, "var(--chart-2)")
    const downColour = await resolved(name, "var(--chart-1)")
    eq((await paint(`${pane(name, "volume")} .chart-candlestick-volume-bar[data-index="0"]`)).fill, upColour, "a rising row's volume in the up colour")
    eq((await paint(`${pane(name, "volume")} .chart-candlestick-volume-bar[data-index="1"]`)).fill, downColour, "a falling row's in the down colour")
  })

  await test("candlestick: the linked panes share the active index, from either pane and from the keyboard", async () => {
    const name = "candlestick-linked"
    await page.mouse.move(0, 0)
    eq(await activeMarks(name), [], "precondition: no candle active")
    eq(await activeBars(name), [], "precondition: no bar active")
    await hover(`${mark(name, 3)} .chart-candlestick-body`)
    await page.waitForFunction((sel) => document.querySelector(sel), `${pane(name, "volume")} .chart-candlestick-volume-bar[data-active]`)
    eq(await activeMarks(name), [3], "hovered candle")
    eq(await activeBars(name), [3], "its volume bar follows")
    const tip = await page.locator(`${pane(name)} .chart-tooltip`).innerText()
    eq(/Open/.test(tip) && /108/.test(tip) && /118/.test(tip) && /117/.test(tip), true, `tooltip lists the prices: ${tip}`)
    await hover(`${pane(name, "volume")} .chart-candlestick-volume-bar[data-index="1"]`)
    await page.waitForFunction((sel) => document.querySelector(sel)?.dataset.index === "1", `${mark(name, 1)}[data-active]`)
    eq(await activeMarks(name), [1], "hovering a bar activates its candle")
    eq(await activeBars(name), [1], "and only that bar")
    const volumeTip = await page.locator(`${pane(name, "volume")} .chart-tooltip`).innerText()
    eq(/Volume/.test(volumeTip) && /2,400/.test(volumeTip), true, `volume tooltip: ${volumeTip}`)
    await page.mouse.move(0, 0)
    await page.waitForFunction((sel) => !document.querySelector(sel), `${pane(name, "volume")} .chart-candlestick-volume-bar[data-active]`)
    eq(await activeMarks(name), [], "leaving clears the candle")
    await focusSurface(name)
    eq(await activeBars(name), [0], "focus lands on the first row in both panes")
    await page.keyboard.press("ArrowRight")
    await page.keyboard.press("ArrowRight")
    eq(await activeMarks(name), [2], "the keyboard steps the price pane")
    eq(await activeBars(name), [2], "and the volume pane follows")
    await page.keyboard.press("ArrowRight")
    await page.keyboard.press("ArrowRight")
    eq(await activeMarks(name), [4], "precondition: a priced row")
    eq(await page.locator(`${pane(name)} .chart-tooltip-item`).count(), 4, "counter-precondition: its tooltip lists four prices")
    await page.keyboard.press("ArrowRight")
    eq(await activeBars(name), [5], "the row without prices is reachable")
    eq(await page.locator(`${pane(name)} .chart-tooltip-item`).count(), 0, "and its price tooltip lists nothing")
    eq(await page.locator(`${pane(name, "volume")} .chart-candlestick-volume-bar[data-index="5"]`).getAttribute("data-direction"), "flat", "its volume bar takes the flat colour")
    await page.keyboard.press("End")
    eq(await activeBars(name), [7], "End reaches the last row in both")
    await page.keyboard.press("Escape")
    eq(await activeBars(name), [], "Escape clears both")
    await page.locator(`${pane(name)} .chart-surface`).blur()
  })

  await test("candlestick: an index past a shorter linked chart's end counts as none for the arrows", async () => {
    const [long, short] = ["candlestick-sync-long", "candlestick-sync-short"]
    const land = async (key) => {
      await hover(`${mark(long, 10)} .chart-candlestick-body`)
      await page.waitForFunction((sel) => document.querySelector(sel), `${mark(long, 10)}[data-active]`)
      eq(await activeMarks(short), [], "precondition: the short chart holds an index it has no row for")
      await page.locator(`${pane(short)} .chart-surface`).evaluate((el) => el.focus({ preventScroll: true }))
      await page.keyboard.press(key)
      const result = await activeMarks(short)
      await page.locator(`${pane(short)} .chart-surface`).evaluate((el) => el.blur())
      await page.mouse.move(0, 0)
      return result
    }
    eq(await land("ArrowRight"), [0], "forward lands on the first row")
    eq(await land("ArrowLeft"), [7], "back lands on the last")
    await page.waitForFunction((sel) => !document.querySelector(sel), `${pane(long)} .chart-candlestick-mark[data-active]`)
    await focusSurface(short)
    await page.keyboard.press("ArrowRight")
    eq(await activeMarks(short), [1], "counter-precondition: an in-range index steps as usual")
    await page.keyboard.press("Escape")
    await page.locator(`${pane(short)} .chart-surface`).evaluate((el) => el.blur())
  })

  await test("candlestick: an unlinked chart is not driven by another's hover", async () => {
    await page.mouse.move(0, 0)
    await hover(`${mark("candlestick-default", 0)} .chart-candlestick-body`)
    await page.waitForFunction((sel) => document.querySelector(sel), `${mark("candlestick-default", 0)}[data-active]`)
    eq(await activeMarks("candlestick-default"), [0], "the hovered chart is active")
    eq(await activeMarks("candlestick-linked"), [], "an unlinked chart is not")
    eq(await activeBars("candlestick-linked"), [], "nor its volume pane")
    await page.mouse.move(0, 0)
  })

  await test("candlestick: right to left keeps the rows in order, and the arrows follow the screen", async () => {
    const name = "candlestick-rtl"
    const direction = (selector) => page.locator(selector).evaluate((el) => getComputedStyle(el).direction)
    eq(await direction(pg(name)), "rtl", "precondition: the fixture is right to left")
    eq(await direction(`${pane(name)}`), "rtl", "counter-precondition: the chart's own layout inherits it")
    eq(await direction(`${pane(name)} .chart-surface`), "ltr", "the svg keeps the plot's own direction")
    const xs = await page.locator(`${pane(name)} .chart-candlestick-body`).evaluateAll((els) => els.map((el) => Number(el.getAttribute("x"))))
    eq(xs.length, 7, "seven candles")
    eq(xs.every((x, i) => i === 0 || x > xs[i - 1]), true, `x ascends with the data: ${xs}`)
    await focusSurface(name)
    eq(await activeMarks(name), [0], "focus lands on the first row")
    await page.keyboard.press("ArrowRight")
    eq(await activeMarks(name), [1], "ArrowRight moves to the candle on the right")
    await page.keyboard.press("ArrowLeft")
    eq(await activeMarks(name), [0], "ArrowLeft moves back")
    await page.keyboard.press("Escape")
    await page.locator(`${pane(name)} .chart-surface`).blur()
  })

  await test("forced-colors: rising bodies are Canvas, falling bodies and volume bars CanvasText, the active mark Highlight", async () => {
    const name = "candlestick-default"
    const linked = "candlestick-linked"
    const barSelector = `${pane(linked, "volume")} .chart-candlestick-volume-bar[data-index="0"]`
    // What a system colour computes to on a mark's own parent, so the probe sits under the same cascade.
    const system = (selector, property, value) =>
      page.locator(selector).evaluate(
        (el, [property, value]) => {
          const probe = document.createElementNS("http://www.w3.org/2000/svg", "rect")
          probe.style.forcedColorAdjust = "none"
          probe.style[property] = value
          el.parentNode.appendChild(probe)
          const colour = getComputedStyle(probe)[property]
          probe.remove()
          return colour
        },
        [property, value],
      )
    const upBody = `${mark(name, 0)} .chart-candlestick-body`
    const downBody = `${mark(name, 1)} .chart-candlestick-body`
    const before = { up: await paint(upBody), down: await paint(downBody), bar: await paint(barSelector) }
    const downColour = await resolved(name, "var(--chart-1)")
    eq(before.down.fill, downColour, "precondition: outside forced colours a falling body is filled with the palette colour")
    eq(before.up.stroke === (await system(upBody, "stroke", "CanvasText")), false, "precondition: nor is its edge the text colour")
    eq(before.bar.fill === (await system(barSelector, "fill", "CanvasText")), false, "precondition: a volume bar is the palette colour too")
    await page.emulateMedia({ forcedColors: "active" })
    try {
      const canvas = await system(upBody, "fill", "Canvas")
      const canvasText = await system(upBody, "stroke", "CanvasText")
      const highlight = await system(upBody, "stroke", "Highlight")
      eq(canvas !== canvasText && canvasText !== highlight, true, `counter-precondition: the three system colours differ: ${canvas}, ${canvasText}, ${highlight}`)
      const up = await paint(upBody)
      const down = await paint(downBody)
      eq(up.fill, canvas, "a rising body fills with Canvas")
      eq(down.fill, canvasText, "a falling body fills with CanvasText")
      eq(up.stroke, canvasText, "a rising body's edge is CanvasText")
      eq(down.stroke, canvasText, "a falling body's edge is CanvasText")
      eq((await paint(`${mark(name, 0)} .chart-candlestick-wick`)).stroke, canvasText, "the wick is CanvasText")
      eq((await paint(`${mark("candlestick-ohlc", 0)} .chart-candlestick-open`)).stroke, canvasText, "an open tick is CanvasText")
      eq((await paint(`${mark("candlestick-ohlc", 0)} .chart-candlestick-close`)).stroke, canvasText, "a close tick is CanvasText")
      const bar = await paint(barSelector)
      eq(bar.fill, canvasText, "a volume bar fills with CanvasText")
      eq(bar.stroke, canvasText, "and has a CanvasText edge")
      await page.mouse.move(0, 0)
      eq(await activeMarks(name), [], "precondition: nothing is active")
      await hover(upBody)
      await page.waitForFunction((sel) => document.querySelector(sel), `${mark(name, 0)}[data-active]`)
      eq((await paint(upBody)).stroke, highlight, "the active body's edge is Highlight")
      eq((await paint(`${mark(name, 0)} .chart-candlestick-wick`)).stroke, highlight, "and so is its wick")
      await page.mouse.move(0, 0)
      const ohlc = `${mark("candlestick-ohlc", 0)} .chart-candlestick-wick`
      await hover(ohlc)
      await page.waitForFunction((sel) => document.querySelector(sel), `${mark("candlestick-ohlc", 0)}[data-active]`)
      for (const part of ["wick", "open", "close"]) eq((await paint(`${mark("candlestick-ohlc", 0)} .chart-candlestick-${part}`)).stroke, highlight, `the active OHLC ${part} is Highlight`)
      eq((await paint(`${mark("candlestick-ohlc", 1)} .chart-candlestick-open`)).stroke, canvasText, "counter-precondition: an inactive OHLC tick stays CanvasText")
      await page.mouse.move(0, 0)
      await hover(barSelector)
      await page.waitForFunction((sel) => document.querySelector(sel), `${pane(linked, "volume")} .chart-candlestick-volume-bar[data-active]`)
      eq((await paint(barSelector)).stroke, highlight, "the active volume bar's edge is Highlight")
    } finally {
      await page.emulateMedia({ forcedColors: null })
      await page.mouse.move(0, 0)
    }
    eq((await paint(downBody)).fill, downColour, "outside forced colours the palette colour is back")
  })

  await test("candlestick: without up and down in the config, rising rows take --chart-2 and falling rows --chart-1", async () => {
    const name = "candlestick-fallback"
    const custom = (n, property) => page.locator(pane(n)).evaluate((el, property) => getComputedStyle(el).getPropertyValue(property).trim(), property)
    eq(await custom(name, "--color-up"), "", "precondition: no up entry reaches the chart")
    eq(await custom(name, "--color-down"), "", "precondition: no down entry reaches the chart")
    eq((await custom("candlestick-legend", "--color-up")) !== "", true, "counter-precondition: a fixture with the entry does")
    const upColour = await resolved(name, "var(--chart-2)")
    const downColour = await resolved(name, "var(--chart-1)")
    eq(upColour !== downColour, true, "the two palette colours differ")
    const up = await paint(`${mark(name, 0)} .chart-candlestick-body`)
    const down = await paint(`${mark(name, 1)} .chart-candlestick-body`)
    eq(up.stroke, upColour, "a rising outline is --chart-2")
    eq(down.stroke, downColour, "a falling outline is --chart-1")
    eq(down.fill, downColour, "a falling body is solid in --chart-1")
    eq((await paint(`${mark(name, 0)} .chart-candlestick-wick`)).stroke, upColour, "a rising wick is --chart-2")
    eq((await paint(`${mark("candlestick-legend", 0)} .chart-candlestick-body`)).stroke === upColour, false, "a configured fixture does not fall back")
  })

  await test("candlestick: non-default field names draw the same geometry as the default ones", async () => {
    const read = (name) =>
      page.locator(pg(name)).evaluate((root) => {
        const pick = (selector, names) => [...root.querySelectorAll(selector)].map((el) => names.map((n) => el.getAttribute(n)))
        const texts = (selector) => [...root.querySelectorAll(selector)].map((t) => t.textContent)
        return {
          bodies: pick(".chart-candlestick-body", ["x", "y", "width", "height"]),
          wicks: pick(".chart-candlestick-wick", ["x1", "x2", "y1", "y2"]),
          marks: pick(".chart-candlestick-mark", ["data-index", "data-direction"]),
          bars: pick(".chart-candlestick-volume-bar", ["x", "y", "width", "height", "data-direction", "data-value"]),
          valueTicks: texts('[data-axis="value"] text'),
          categoryLabels: texts('[data-axis="category"] text'),
        }
      })
    const standard = await read("candlestick-linked")
    const renamed = await read("candlestick-fields")
    eq(standard.bodies.length, 7, "precondition: the default fixture draws seven candles")
    eq(standard.bars.length, 8, "precondition: and eight volume bars")
    eq(standard.categoryLabels.includes("Mon 8"), true, "precondition: with row labels")
    eq(renamed.bodies.length, 7, "the renamed fixture draws seven candles, none for the row without prices")
    eq(renamed.bars.length, 8, "and eight volume bars")
    eq(renamed.categoryLabels, standard.categoryLabels, "row labels read from categoryKey")
    eq(renamed.bodies, standard.bodies, "bodies from openKey and closeKey")
    eq(renamed.wicks, standard.wicks, "wicks from highKey and lowKey")
    eq(renamed.marks, standard.marks, "directions")
    eq(renamed.bars, standard.bars, "volume bars from volumeKey, directions from the same open and close keys")
    eq(renamed.valueTicks, standard.valueTicks, "the same axes")
  })

  await test("candlestick: a volume pane with nothing to show runs 0 to 1 with its baseline at the bottom", async () => {
    // Volume pane of a demo: margin 5, row labels 24 high.
    const bottom = async (name) => (await svgSize(name, "volume")).height - 10 - 24 + 5
    const baseline = (name) => attrs(page.locator(`${pane(name, "volume")} .chart-candlestick-baseline`), ["y1", "y2"])
    const heights = (name) => page.locator(`${pane(name, "volume")} .chart-candlestick-volume-bar`).evaluateAll((els) => els.map((el) => Number(el.getAttribute("height"))))
    const normal = "candlestick-linked"
    const normalTicks = await valueTicks(normal, "volume")
    eq(normalTicks[normalTicks.length - 1] >= 3100, true, "counter-precondition: a pane with volume reaches the largest")
    eq((await heights(normal)).some((h) => h > 0), true, "and draws bars")
    near((await baseline(normal)).y1, await bottom(normal), 0.01, "its baseline is at the plot bottom")
    eq(normalTicks[0], 0, "its axis starts at zero")

    const zero = "candlestick-zero-volume"
    const zeroHeights = await heights(zero)
    eq(zeroHeights.length, 8, "precondition: a bar for each row")
    eq(zeroHeights.every((h) => h === 0), true, "precondition: all of them empty")
    const zeroTicks = await valueTicks(zero, "volume")
    eq(zeroTicks.every((t) => t >= 0), true, `no negative tick: ${zeroTicks}`)
    eq([zeroTicks[0], zeroTicks[zeroTicks.length - 1]], [0, 1], "the axis runs 0 to 1")
    const zeroBaseline = await baseline(zero)
    near(zeroBaseline.y1, await bottom(zero), 0.01, "the baseline sits at the plot bottom")
    eq(zeroBaseline.y1, zeroBaseline.y2, "and is level")

    const empty = "candlestick-empty-volume"
    eq(await page.locator(`${pane(empty, "volume")} .chart-candlestick-volume-bar`).count(), 0, "precondition: no rows, no bars")
    const emptyTicks = await valueTicks(empty, "volume")
    eq(emptyTicks.every((t) => t >= 0), true, `no negative tick without rows: ${emptyTicks}`)
    eq([emptyTicks[0], emptyTicks[emptyTicks.length - 1]], [0, 1], "also 0 to 1")
    near((await baseline(empty)).y1, await bottom(empty), 0.01, "baseline at the plot bottom without rows")
  })

  await test("candlestick: no page errors", async () => {
    eq(pageErrors, [], "page errors")
  })
}
