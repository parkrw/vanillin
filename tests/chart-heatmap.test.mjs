export default async function run({ page, baseUrl, test, eq: strictEq, near }) {
  const eq = (actual, expected, message) =>
    strictEq(typeof actual === "object" && actual !== null ? JSON.stringify(actual) : actual, typeof expected === "object" && expected !== null ? JSON.stringify(expected) : expected, message)
  await page.goto(`${baseUrl}/#chart-heatmap`)
  await page.waitForSelector('[data-pg="heatmap-calendar-monday"] .chart-heatmap-cell')
  await page.waitForFunction(() =>
    [...document.querySelectorAll('[data-pg^="heatmap-"] .chart-surface')].every((svg) => svg.getAttribute("width") !== "320"),
  )

  const pg = (name) => `[data-pg="${name}"]`
  const cell = (name, index) => page.locator(`${pg(name)} .chart-heatmap-cell[data-index="${index}"]`)
  const surface = (name) => page.locator(`${pg(name)} .chart-surface`)
  const tooltip = (name) => page.locator(`${pg(name)} .chart-tooltip`)

  const cellInfo = (name, index) =>
    cell(name, index).evaluate((el) => ({
      x: Number(el.getAttribute("x")),
      y: Number(el.getAttribute("y")),
      width: Number(el.getAttribute("width")),
      height: Number(el.getAttribute("height")),
      col: Number(el.dataset.col),
      row: Number(el.dataset.row),
      value: el.dataset.value,
      step: el.dataset.step,
      empty: el.hasAttribute("data-empty"),
      fill: getComputedStyle(el).fill,
    }))
  const svgSize = (name) =>
    surface(name).evaluate((el) => ({ width: Number(el.getAttribute("width")), height: Number(el.getAttribute("height")) }))
  const activeIndex = (name) =>
    page.locator(`${pg(name)} .chart-heatmap-cell[data-active]`).evaluateAll((els) => els.map((el) => Number(el.dataset.index)))
  // A probe resolves light-dark() and custom properties at the chart it is appended to (docs/QUIRKS.md).
  const tokenColour = (name, token) =>
    page.locator(`${pg(name)} .chart`).evaluate((host, token) => {
      const probe = document.createElement("span")
      probe.style.color = `var(${token})`
      host.appendChild(probe)
      const value = getComputedStyle(probe).color
      probe.remove()
      return value
    }, token)
  const hover = async (name, index) => {
    await cell(name, index).evaluate((el) => el.scrollIntoView({ block: "center" }))
    const box = await cell(name, index).boundingBox()
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  }
  const press = async (name, ...keys) => {
    for (const key of keys) await page.keyboard.press(key)
    return activeIndex(name)
  }
  const focusSurface = async (name) => {
    await surface(name).evaluate((el) => el.scrollIntoView({ block: "center" }))
    await surface(name).focus()
  }

  // ── Heatmap geometry ──

  await test("heatmap: 40 cells sit on the column and row bands", async () => {
    const name = "heatmap-default"
    eq(await page.locator(`${pg(name)} .chart-heatmap-cell`).count(), 40, "one cell per day and hour")
    const { width, height } = await svgSize(name)
    // margin 5, row labels 48 wide, column labels 24 high, 8 columns, 5 rows, gap 0.1.
    const plot = { x: 5 + 48, y: 5, width: width - 10 - 48, height: height - 10 - 24 }
    const stepX = plot.width / 8
    const stepY = plot.height / 5
    for (const index of [0, 7, 19, 20, 39]) {
      const info = await cellInfo(name, index)
      eq(info.col, index % 8, `col of ${index}`)
      eq(info.row, Math.floor(index / 8), `row of ${index}`)
      near(info.width, stepX * 0.9, 0.01, `width of ${index}`)
      near(info.height, stepY * 0.9, 0.01, `height of ${index}`)
      near(info.x, plot.x + info.col * stepX + stepX * 0.05, 0.01, `x of ${index}`)
      near(info.y, plot.y + info.row * stepY + stepY * 0.05, 0.01, `y of ${index}`)
    }
    const a = await cellInfo(name, 0)
    const b = await cellInfo(name, 1)
    near(b.x - (a.x + a.width), stepX * 0.1, 0.01, "gap between neighbours")
  })

  await test("heatmap: axis labels centre on their bands", async () => {
    const name = "heatmap-default"
    const labels = await page.locator(`${pg(name)} [data-axis="x"] text`).evaluateAll((els) => els.map((el) => [el.textContent, Number(el.getAttribute("x"))]))
    eq(labels.map((l) => l[0]).join(","), "09,10,11,12,13,14,15,16", "column labels")
    const first = await cellInfo(name, 0)
    near(labels[0][1], first.x + first.width / 2, 0.01, "first label under first column")
    const rows = await page.locator(`${pg(name)} [data-axis="y"] text`).evaluateAll((els) => els.map((el) => [el.textContent, Number(el.getAttribute("y"))]))
    eq(rows.map((l) => l[0]).join(","), "Mon,Tue,Wed,Thu,Fri", "row labels")
    const third = await cellInfo(name, 16)
    near(rows[2][1], third.y + third.height / 2, 0.01, "Wednesday label on the third row")
  })

  // ── Colour ──

  await test("heatmap: lowest and highest values take the config ends, the middle takes neither", async () => {
    const name = "heatmap-default"
    const low = await tokenColour(name, "--color-low")
    const high = await tokenColour(name, "--color-high")
    if (low === high) throw new Error("fixture ends must differ")
    const lowest = await cellInfo(name, 0)
    const highest = await cellInfo(name, 39)
    const middle = await cellInfo(name, 20)
    eq(lowest.value, "0", "lowest datum")
    eq(highest.value, "39", "highest datum")
    eq(lowest.fill, low, "lowest cell fill")
    eq(highest.fill, high, "highest cell fill")
    eq(lowest.step, "0", "lowest step")
    eq(highest.step, "4", "highest step")
    if (middle.fill === low || middle.fill === high) throw new Error(`middle cell fell on an end: ${middle.fill}`)
  })

  await test("heatmap: a pair with no datum is an outline, not the low colour", async () => {
    const name = "heatmap-default"
    const empty = await cellInfo(name, 19)
    eq(empty.empty, true, "Wednesday 12 is empty")
    eq(empty.value, undefined, "no value")
    eq(empty.fill, "rgba(0, 0, 0, 0)", "transparent fill")
    eq((await cellInfo(name, 18)).empty, false, "neighbour has a reading")
  })

  await test("legend: one swatch per step in the colours the grid uses, labelled with both ends", async () => {
    const name = "heatmap-default"
    const swatches = await page.locator(`${pg(name)} .chart-heatmap-legend-step`).evaluateAll((els) => els.map((el) => getComputedStyle(el).backgroundColor))
    eq(swatches.length, 5, "five steps")
    eq(swatches[0], await tokenColour(name, "--color-low"), "first swatch")
    eq(swatches[4], await tokenColour(name, "--color-high"), "last swatch")
    eq(swatches[0] === swatches[2] || swatches[2] === swatches[4], false, "middle swatch differs")
    for (const [step, index] of [[0, 0], [4, 39], [2, 20]]) {
      eq((await cellInfo(name, index)).fill, swatches[step], `cell ${index} matches swatch ${step}`)
    }
    const labels = await page.locator(`${pg(name)} .chart-heatmap-legend-label`).allTextContents()
    eq(labels.join("|"), "0|39", "end labels")
  })

  await test("heatmap: domain pins the scale and steps sets the shades", async () => {
    const name = "heatmap-domain"
    eq(await page.locator(`${pg(name)} .chart-heatmap-legend-step`).count(), 8, "eight swatches")
    const highest = await cellInfo(name, 39)
    eq(highest.value, "39", "same datum as the default chart")
    eq(highest.step, "3", "39 of 0 to 80 in 8 steps is step 3, not the top")
    eq((await cellInfo(name, 0)).step, "0", "zero is the bottom step")
    eq((await page.locator(`${pg(name)} .chart-heatmap-legend-label`).allTextContents()).join("|"), "0|80", "pinned labels")
  })

  // ── Tooltip ──

  await test("heatmap: hovering a cell shows its row, column and value", async () => {
    const name = "heatmap-default"
    await page.mouse.move(0, 0)
    eq(await tooltip(name).count(), 0, "no tooltip before hover")
    await hover(name, 10)
    await tooltip(name).waitFor()
    eq(await page.locator(`${pg(name)} .chart-tooltip-label`).textContent(), "Tue · 11", "label")
    eq(await page.locator(`${pg(name)} .chart-tooltip-name`).textContent(), "Visits", "series name from the config")
    eq(await page.locator(`${pg(name)} .chart-tooltip-value`).textContent(), "10", "value")
    eq(await activeIndex(name), [10], "hovered cell is marked")
    await hover(name, 33)
    await page.waitForFunction(() => document.querySelector('[data-pg="heatmap-default"] .chart-tooltip-value')?.textContent === "33")
    await page.mouse.move(0, 0)
    await tooltip(name).waitFor({ state: "detached" })
  })

  await test("heatmap: an empty cell shows its label and no value; the label gutter shows nothing", async () => {
    const name = "heatmap-default"
    await hover(name, 19)
    await tooltip(name).waitFor()
    eq(await page.locator(`${pg(name)} .chart-tooltip-label`).textContent(), "Wed · 12", "label")
    eq(await page.locator(`${pg(name)} .chart-tooltip-value`).count(), 0, "no value")
    const box = await surface(name).boundingBox()
    const row = await cell(name, 0).boundingBox()
    await page.mouse.move(box.x + 10, row.y + row.height / 2)
    await tooltip(name).waitFor({ state: "detached" })
    await page.mouse.move(0, 0)
  })

  // ── Keyboard ──

  await test("heatmap: arrows move across columns and down rows; edges hold", async () => {
    const name = "heatmap-default"
    await focusSurface(name)
    eq(await activeIndex(name), [0], "focus lands on the first cell")
    eq(await press(name, "ArrowRight"), [1], "right is the next column")
    eq(await press(name, "ArrowDown"), [9], "down is a whole row on, not the next cell")
    eq(await press(name, "ArrowDown", "ArrowRight"), [18], "down then right")
    eq(await press(name, "ArrowRight"), [19], "an empty cell can hold the focus")
    eq(await press(name, "ArrowUp"), [11], "up is a row back")
    eq(await press(name, "ArrowUp", "ArrowUp"), [3], "up stops on the first row")
    eq(await press(name, "ArrowLeft", "ArrowLeft", "ArrowLeft", "ArrowLeft"), [0], "left stops on the first column")
    eq(await press(name, "ArrowUp"), [0], "up from the corner stays")
    eq(await press(name, "End"), [39], "End is the last cell")
    eq(await press(name, "ArrowRight", "ArrowDown"), [39], "right and down from the corner stay")
    eq(await press(name, "Home"), [0], "Home is the first cell")
    await page.waitForSelector(`${pg(name)} .chart-tooltip`)
    eq(await page.locator(`${pg(name)} .chart-tooltip-value`).textContent(), "0", "tooltip follows the keyboard")
    await press(name, "Escape")
    eq(await activeIndex(name), [], "Escape clears the active cell")
    await page.locator(`${pg(name)} .chart-surface`).evaluate((el) => el.blur())
  })

  // ── Calendar placement, 2024 ──

  await test("calendar: 2024 has 366 days in 53 weeks, the first on a Monday under a Sunday start", async () => {
    const name = "heatmap-calendar"
    eq(await page.locator(`${pg(name)} .chart-heatmap-cell`).count(), 366, "leap year")
    const first = await cellInfo(name, 0)
    eq([first.col, first.row], [0, 1], "1 Jan 2024 is a Monday: column 0, second row")
    const leap = await cellInfo(name, 59)
    eq([leap.col, leap.row], [8, 4], "29 Feb 2024 is a Thursday in the ninth week")
    const march = await cellInfo(name, 60)
    eq([march.col, march.row], [8, 5], "1 Mar follows it down the column")
    const sunday = await cellInfo(name, 6)
    eq([sunday.col, sunday.row], [1, 0], "Sunday 7 Jan starts the second week")
    const last = await cellInfo(name, 365)
    eq([last.col, last.row], [52, 2], "31 Dec 2024 is a Tuesday in the 53rd week")
    eq(await page.locator(`${pg(name)} .chart-heatmap-cell[data-col="52"]`).count(), 3, "last week holds three days")
    eq(await page.locator(`${pg(name)} .chart-heatmap-cell[data-col="0"]`).count(), 6, "first week holds six days")
    eq(await page.locator(`${pg(name)} .chart-heatmap-cell[data-col="53"]`).count(), 0, "no 54th week")
  })

  await test("calendar: a Monday start moves 1 Jan to the top row and the year's end up a row", async () => {
    const name = "heatmap-calendar-monday"
    eq(await page.locator(`${pg(name)} .chart-heatmap-cell`).count(), 366, "leap year")
    const first = await cellInfo(name, 0)
    eq([first.col, first.row], [0, 0], "1 Jan 2024: column 0, top row")
    const sunday = await cellInfo(name, 6)
    eq([sunday.col, sunday.row], [0, 6], "7 Jan closes the first week")
    const last = await cellInfo(name, 365)
    eq([last.col, last.row], [52, 1], "31 Dec 2024: 53rd week, second row")
    eq(await page.locator(`${pg(name)} .chart-heatmap-cell[data-col="0"]`).count(), 7, "first week is full")
    eq(await page.locator(`${pg(name)} .chart-heatmap-cell[data-col="52"]`).count(), 2, "last week holds two days")
  })

  await test("calendar: cells are squares on a common pitch; month and weekday labels sit on their cells", async () => {
    const name = "heatmap-calendar"
    const a = await cellInfo(name, 0)
    const b = await cellInfo(name, 7)
    const c = await cellInfo(name, 1)
    near(a.width, a.height, 0.01, "square")
    near(b.x - a.x, c.y - a.y, 0.01, "week pitch equals day pitch")
    eq(a.y < c.y, true, "weekdays run down the screen")
    const months = await page.locator(`${pg(name)} [data-axis="x"] text`).evaluateAll((els) => els.map((el) => [el.textContent, Number(el.getAttribute("x"))]))
    const jan = months.find((m) => m[0] === "Jan")
    const feb = months.find((m) => m[0] === "Feb")
    near(jan[1], a.x + a.width / 2, 0.01, "Jan over the first week")
    const febFirst = await cellInfo(name, 31)
    eq(febFirst.col, 4, "1 Feb falls in the fifth week")
    near(feb[1], febFirst.x + febFirst.width / 2, 0.01, "Feb over the week holding the 1st")
    const days = await page.locator(`${pg(name)} [data-axis="y"] text`).evaluateAll((els) => els.map((el) => [el.textContent, Number(el.getAttribute("y"))]))
    eq(days.map((d) => d[0]).join(","), "Mon,Wed,Fri", "labels")
    near(days[0][1], a.y + a.height / 2, 0.01, "Mon on the second row, beside 1 Jan")
    const mondayStart = await page.locator(`${pg("heatmap-calendar-monday")} [data-axis="y"] text`).allTextContents()
    eq(mondayStart.join(","), "Tue,Thu,Sat", "a Monday start shifts the labels")
  })

  await test("calendar: hovering a day shows its date and count; a day with no datum shows the date alone", async () => {
    const name = "heatmap-calendar"
    await hover(name, 59)
    await tooltip(name).waitFor()
    eq(await page.locator(`${pg(name)} .chart-tooltip-label`).textContent(), "Feb 29, 2024", "date")
    eq(await page.locator(`${pg(name)} .chart-tooltip-value`).textContent(), "3", "count")
    await hover(name, 63)
    await page.waitForFunction(() => document.querySelector('[data-pg="heatmap-calendar"] .chart-tooltip-label')?.textContent === "Mar 4, 2024")
    eq(await page.locator(`${pg(name)} .chart-tooltip-value`).count(), 0, "day 63 has no reading")
    eq((await cellInfo(name, 63)).empty, true, "drawn as an outline")
    await page.mouse.move(0, 0)
  })

  await test("calendar: up and down walk a week, left and right step a week; absent days and edges hold", async () => {
    const name = "heatmap-calendar"
    await focusSurface(name)
    eq(await activeIndex(name), [0], "focus lands on 1 Jan")
    eq(await press(name, "ArrowUp"), [0], "no Sunday before 1 Jan to move to")
    eq(await press(name, "ArrowLeft"), [0], "no week before the first")
    eq(await press(name, "ArrowDown"), [1], "down is the next day")
    eq(await press(name, "ArrowRight"), [8], "right is the same weekday a week on")
    eq(await press(name, "ArrowUp"), [7], "up is the day before")
    eq(await press(name, "ArrowUp"), [6], "up reaches the Sunday row")
    eq(await press(name, "ArrowUp"), [6], "and stops")
    eq(await press(name, "End"), [365], "End is 31 Dec")
    eq(await press(name, "ArrowDown"), [365], "no cell below the last day")
    eq(await press(name, "ArrowRight"), [365], "no week after the last")
    eq(await press(name, "ArrowLeft"), [358], "left is a week back")
    await page.waitForSelector(`${pg(name)} .chart-tooltip`)
    eq(await page.locator(`${pg(name)} .chart-tooltip-label`).textContent(), "Dec 24, 2024", "tooltip follows")
    await page.locator(`${pg(name)} .chart-surface`).evaluate((el) => el.blur())
  })

  // ── Domains, formatters, axis sizes ──

  await test("heatmap: xDomain and yDomain set the order and drop data they do not name", async () => {
    const name = "heatmap-order"
    eq(await page.locator(`${pg(name)} .chart-heatmap-cell`).count(), 24, "8 columns by 3 rows; the Saturday datum has no row")
    eq(await page.locator(`${pg(name)} .chart-heatmap-cell[data-value="99"]`).count(), 0, "the unnamed row's value is not drawn")
    const xs = await page.locator(`${pg(name)} [data-axis="x"] text`).allTextContents()
    eq(xs.join(","), "16,15,14,13,12,11,10,09", "columns reversed")
    const ys = await page.locator(`${pg(name)} [data-axis="y"] text`).allTextContents()
    eq(ys.join(","), "Fri,Wed,Mon", "rows in the order given, Tue and Thu left out")
    eq((await cellInfo(name, 0)).value, "39", "Friday 16 is the top-left cell")
    eq((await cellInfo(name, 7)).value, "32", "Friday 09 is the top-right cell")
    eq((await cellInfo(name, 16)).value, "7", "Monday 16 is on the bottom row")
    eq((await cellInfo(name, 12)).empty, true, "Wednesday 12 moved with its column")
    eq((await cellInfo("heatmap-default", 12)).empty, false, "the default order has a reading there")
  })

  await test("heatmap: the legend and tooltip formatters shape their text", async () => {
    const name = "heatmap-order"
    eq((await page.locator(`${pg(name)} .chart-heatmap-legend-label`).allTextContents()).join("|"), "0 visits|39 visits", "legend ends")
    eq((await page.locator("[data-pg=\"heatmap-default\"] .chart-heatmap-legend-label").allTextContents()).join("|"), "0|39", "the default legend is plain")
    await hover(name, 0)
    await tooltip(name).waitFor()
    eq((await tooltip(name).textContent()).includes("39 visits"), true, "tooltip row")
    await page.mouse.move(0, 0)
  })

  await test("heatmap: an axis size of 0 leaves that axis's labels out and gives the grid the room", async () => {
    const bare = "heatmap-bare"
    eq(await page.locator(`${pg(bare)} [data-axis] text`).count(), 0, "no tick text on either axis")
    eq(await page.locator(`${pg("heatmap-default")} [data-axis] text`).count() > 0, true, "the default draws them")
    const { width } = await svgSize(bare)
    const first = await cellInfo(bare, 0)
    near(first.x, 5 + (width - 10) / 8 * 0.05, 0.01, "grid starts at the margin")
  })

  // ── Loose props, Date data, linked charts ──

  await test("calendar: year and weekStart as strings behave as numbers; a Date is read in UTC", async () => {
    const name = "heatmap-dates"
    eq(await page.locator(`${pg(name)} .chart-heatmap-cell`).count(), 366, "year=\"2024\" is 366 days, not a concatenated year")
    const first = await cellInfo(name, 0)
    eq([first.col, first.row], [0, 0], "weekStart=\"1\" puts the Monday on the top row")
    eq((await page.locator(`${pg(name)} [data-axis="y"] text`).allTextContents()).join(","), "Tue,Thu,Sat", "labels follow the Monday start")
    eq(await page.locator(`${pg(name)} .chart-heatmap-cell:not([data-empty])`).count(), 2, "two Date data placed")
    eq((await cellInfo(name, 64)).value, "7", "5 March 2024 is day 64")
    eq((await cellInfo(name, 65)).value, "2", "6 March 2024 is day 65")
    eq((await cellInfo(name, 63)).empty, true, "4 March has no datum")
    await hover(name, 64)
    await tooltip(name).waitFor()
    eq(await page.locator(`${pg(name)} .chart-tooltip-label`).textContent(), "Mar 5, 2024", "tooltip date")
    eq(await page.locator(`${pg(name)} .chart-tooltip-value`).textContent(), "7", "tooltip value")
    await page.mouse.move(0, 0)
    eq(await page.locator(`${pg("heatmap-sync-calendar")} .chart-heatmap-cell`).count(), 366, "the same string props on the linked calendar")
  })

  await test("linked charts: an index past this grid's end does not break the arrow keys", async () => {
    const errors = []
    const onError = (error) => errors.push(error.message)
    page.on("pageerror", onError)
    try {
      const grid = "heatmap-sync-grid"
      const calendar = "heatmap-sync-calendar"
      await hover(calendar, 200)
      await page.waitForFunction(() => document.querySelector('[data-pg="heatmap-sync-calendar"] .chart-heatmap-cell[data-active]')?.dataset.index === "200")
      eq(await activeIndex(calendar), [200], "the calendar holds day 200, a cell the 40-cell grid lacks")
      await surface(grid).evaluate((el) => el.focus({ preventScroll: true }))
      eq(await activeIndex(grid), [], "focus finds the synced index already set, so it activates nothing")
      eq(await press(grid, "ArrowRight"), [0], "an arrow from an index past the end lands on a real cell")
      eq(await press(grid, "ArrowDown"), [8], "and walks from there")
      eq(await page.locator(`${pg(grid)} .chart-heatmap-cell`).count(), 40, "the grid is still drawn")
      eq(errors, [], "no error thrown")
      await surface(grid).evaluate((el) => el.blur())
      await page.mouse.move(0, 0)
    } finally {
      page.off("pageerror", onError)
    }
  })

  await test("heatmap: a scale with no range paints every cell the low shade", async () => {
    const steps = (name) => page.locator(`${pg(name)} .chart-heatmap-cell:not([data-empty])`).evaluateAll((els) => [...new Set(els.map((el) => el.dataset.step))])
    eq(await steps("heatmap-default"), ["0", "1", "2", "3", "4"], "the default fixture spans every step")
    eq(await steps("heatmap-flat"), ["0"], "equal readings all take the low end")
    eq(await page.locator(`${pg("heatmap-flat")} .chart-heatmap-legend-label`).allTextContents(), ["5", "5"])
    eq(await steps("heatmap-floor"), ["0"], "a pinned floor above every reading leaves all of them at the floor")
    eq(await page.locator(`${pg("heatmap-floor")} .chart-heatmap-legend-label`).allTextContents(), ["50", "50"], "the fallback ceiling does not cross the pinned floor")
  })

  await test("heatmap: right to left keeps the columns left to right, and the arrows follow the screen", async () => {
    const name = "heatmap-rtl"
    eq(await surface(name).evaluate((el) => getComputedStyle(el).direction), "rtl", "the fixture is right to left")
    const [first, second] = [await cellInfo(name, 0), await cellInfo(name, 1)]
    eq(second.x > first.x, true, "the second column is drawn right of the first")
    await focusSurface(name)
    eq(await activeIndex(name), [0])
    eq(await press(name, "ArrowRight"), [1], "ArrowRight moves to the cell on the right")
    eq(await press(name, "ArrowLeft"), [0], "ArrowLeft moves back")
    await press(name, "Escape")
    await surface(name).evaluate((el) => el.blur())
  })

  await test("forced-colors: cells and legend swatches keep their shades, cells take an edge", async () => {
    await page.emulateMedia({ forcedColors: "active" })
    try {
      const name = "heatmap-default"
      const high = cell(name, 39)
      eq(await high.evaluate((el) => getComputedStyle(el).forcedColorAdjust), "none")
      eq(await high.evaluate((el) => getComputedStyle(el).strokeWidth), "1px", "a filled cell takes a CanvasText edge")
      const swatches = page.locator(`${pg(name)} .chart-heatmap-legend-step`)
      eq(await swatches.first().evaluate((el) => getComputedStyle(el).forcedColorAdjust), "none", "legend swatches opt out too")
      await high.evaluate((el) => el.scrollIntoView({ block: "center" }))
      const box = await high.boundingBox()
      const shot = await page.screenshot({ clip: { x: Math.round(box.x + box.width / 2) - 2, y: Math.round(box.y + box.height / 2) - 2, width: 4, height: 4 } })
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
      eq(chroma > 60, true, `the high cell paints in colour under forced-colors, got rgb(${r},${g},${b})`)
    } finally {
      await page.emulateMedia({ forcedColors: null })
    }
  })

  await test("heatmap: new data redraws the grid; a null domain end comes from the data", async () => {
    const live = "heatmap-live"
    eq([(await cellInfo(live, 0)).step, (await cellInfo(live, 39)).step], ["0", "4"], "Mon 09 is lowest and Fri 16 highest before the swap")
    eq(await page.locator(`${pg(live)} .chart-heatmap-legend-label`).allTextContents(), ["0", "39"], "the legend's high end is the data's maximum, not null")
    eq(await page.locator(`${pg(live)} .chart-heatmap-cell[data-step="NaN"]`).count(), 0, "no cell is binned NaN")
    await page.locator(`${pg(live)} button`).click()
    await page.waitForFunction(() => document.querySelector('[data-pg="heatmap-live"] .chart-heatmap-cell[data-index="0"]')?.dataset.step === "4")
    eq([(await cellInfo(live, 0)).step, (await cellInfo(live, 39)).step], ["4", "0"], "the mirrored readings repaint both corners")
    eq(await page.locator(`${pg(live)} .chart-heatmap-legend-label`).allTextContents(), ["0", "39"], "the scale still spans the data")
    await page.locator(`${pg(live)} button`).click()
    await page.waitForFunction(() => document.querySelector('[data-pg="heatmap-live"] .chart-heatmap-cell[data-index="0"]')?.dataset.step === "0")
  })
}
