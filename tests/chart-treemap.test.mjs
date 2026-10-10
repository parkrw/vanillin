import { treemapLayout } from "../lib/chart-treemap.js"

// Mirrors the page's `disk` fixture; sizes in gigabytes.
const disk = {
  name: "Disk",
  children: [
    { name: "Media", children: [{ name: "Video", value: 640 }, { name: "Photos", value: 420 }, { name: "Music", value: 180 }] },
    {
      name: "Documents",
      children: [
        { name: "Reports", children: [{ name: "Q1", value: 60 }, { name: "Q2", value: 80 }, { name: "Q3", value: 95 }] },
        { name: "Contracts", value: 40 },
        { name: "Notes", value: 25 },
      ],
    },
    { name: "Code", children: [{ name: "Repos", value: 300 }, { name: "Build", value: 150 }, { name: "Deps", children: [{ name: "node", value: 220 }, { name: "vendor", value: 90 }] }] },
    { name: "System", value: 260 },
    { name: "Cache", children: [{ name: "tmp", value: 4 }, { name: "logs", value: 3 }] },
  ],
}

export default async function run({ page, baseUrl, test, eq: strictEq, near }) {
  const eq = (actual, expected, message) =>
    strictEq(typeof actual === "object" && actual !== null ? JSON.stringify(actual) : actual, typeof expected === "object" && expected !== null ? JSON.stringify(expected) : expected, message)
  const pageErrors = []
  page.on("pageerror", (e) => pageErrors.push(e.message))

  await page.goto(`${baseUrl}/#chart-treemap`)
  await page.waitForSelector('[data-pg="treemap-default"] .chart-treemap-tile')
  await page.waitForFunction(() =>
    [...document.querySelectorAll('[data-pg^="treemap-"] .chart-surface')].every((svg) => svg.getAttribute("width") !== "320"),
  )

  const pg = (name) => `[data-pg="${name}"]`
  const surface = (name) => page.locator(`${pg(name)} .chart-surface`)
  const tile = (name, index) => page.locator(`${pg(name)} .chart-treemap-tile[data-index="${index}"]`)
  const tooltip = (name) => page.locator(`${pg(name)} .chart-tooltip`)
  const tiles = (name) =>
    page.locator(`${pg(name)} .chart-treemap-tile`).evaluateAll((els) =>
      els.map((el) => ({
        index: Number(el.dataset.index),
        x: Number(el.getAttribute("x")),
        y: Number(el.getAttribute("y")),
        width: Number(el.getAttribute("width")),
        height: Number(el.getAttribute("height")),
        depth: Number(el.dataset.depth),
        kind: el.dataset.kind,
        value: Number(el.dataset.value),
        fill: getComputedStyle(el).fill,
        stroke: getComputedStyle(el).stroke,
      })),
    )
  const svgSize = (name) => surface(name).evaluate((el) => ({ width: Number(el.getAttribute("width")), height: Number(el.getAttribute("height")) }))
  const activeIndex = (name) => page.locator(`${pg(name)} .chart-treemap-tile[data-active]`).evaluateAll((els) => els.map((el) => Number(el.dataset.index)))
  const labels = (name) =>
    page.locator(`${pg(name)} .chart-treemap-label`).evaluateAll((els) =>
      els.map((el) => {
        const box = el.getBBox()
        return { index: Number(el.dataset.index), part: el.dataset.part, text: el.textContent, left: box.x, right: box.x + box.width, top: box.y, bottom: box.y + box.height }
      }),
    )
  const press = async (name, ...keys) => {
    for (const key of keys) await page.keyboard.press(key)
    return activeIndex(name)
  }
  const focusSurface = async (name) => {
    await surface(name).evaluate((el) => el.scrollIntoView({ block: "center" }))
    await surface(name).focus()
  }
  const release = async (name) => {
    await page.keyboard.press("Escape")
    await surface(name).evaluate((el) => el.blur())
  }
  const indexOfPath = (rects, ...path) => rects.findIndex((r) => r.path.join("/") === path.join("/"))

  // ── Geometry ──

  await test("treemap: every tile sits where the squarified layout puts it", async () => {
    const name = "treemap-default"
    const { width, height } = await svgSize(name)
    const expected = treemapLayout(disk, { width: width - 4, height: height - 4, padding: 2, header: 20 })
    const actual = await tiles(name)
    eq(actual.length, expected.length, "one tile per node, groups included")
    expected.forEach((want, i) => {
      near(actual[i].x, want.x + 2, `x of ${want.path.join("/")}`)
      near(actual[i].y, want.y + 2, `y of ${want.path.join("/")}`)
      near(actual[i].width, want.width, `width of ${want.path.join("/")}`)
      near(actual[i].height, want.height, `height of ${want.path.join("/")}`)
      eq(actual[i].kind, want.leaf ? "leaf" : "group", `kind of ${want.path.join("/")}`)
      eq(actual[i].value, want.value, `value of ${want.path.join("/")}`)
    })
  })

  await test("treemap: leaf areas are proportional to value and children sit inside their group", async () => {
    const rects = await tiles("treemap-default")
    const leaves = rects.filter((r) => r.kind === "leaf")
    const [video, notes] = [leaves.find((r) => r.value === 640), leaves.find((r) => r.value === 25)]
    near((video.width * video.height) / (notes.width * notes.height), 640 / 25, "area ratio is the value ratio")
    const media = rects[1]
    for (const r of rects.slice(2, 5)) {
      eq(r.x >= media.x - 1e-6 && r.y >= media.y + 20 - 1e-6 && r.x + r.width <= media.x + media.width + 1e-6 && r.y + r.height <= media.y + media.height + 1e-6, true, "inside Media, under its header")
    }
  })

  // ── Labels ──

  await test("treemap: a group's header and a roomy leaf are named, each name inside its own tile", async () => {
    const name = "treemap-default"
    const [rects, text] = [await tiles(name), await labels(name)]
    const byName = (n, part = "name") => text.find((l) => l.text === n && l.part === part)
    eq(byName("Media") != null, true, "the group header is named")
    eq(byName("Video") != null, true, "a large leaf is named")
    eq(byName("640 GB", "value") != null, true, "a tile with the height for it also shows its value")
    for (const l of text) {
      const r = rects[l.index]
      eq(l.left >= r.x && l.right <= r.x + r.width + 0.5 && l.top >= r.y && l.bottom <= r.y + r.height + 0.5, true, `"${l.text}" lies inside its tile`)
    }
  })

  await test("treemap: a label that does not fit is not drawn, and the tile stays", async () => {
    const name = "treemap-default"
    const [rects, text] = [await tiles(name), await labels(name)]
    const tiny = rects.findIndex((r) => r.kind === "leaf" && r.value === 3)
    eq(rects[tiny].width * rects[tiny].height < 400, true, "precondition: the logs tile is a sliver")
    eq(text.some((l) => l.index === tiny), false, "no label on the sliver")
    eq(text.some((l) => l.text === "logs"), false, "its name is nowhere")
  })

  await test("treemap: in a small chart the small tiles go unnamed, and headerHeight 0 leaves no group names", async () => {
    const name = "treemap-small"
    const [rects, text] = [await tiles(name), await labels(name)]
    eq(rects.length, 22, "the tiles are all still drawn")
    eq(new Set(text.map((l) => l.index)).size <= rects.length / 2, true, "at most half the tiles carry a name")
    eq(text.some((l) => ["tmp", "logs", "Contracts", "Notes"].includes(l.text)), false, "the small tiles are unnamed")
    eq(text.some((l) => ["Media", "Documents", "Code", "Cache"].includes(l.text)), false, "no group has a header")
    for (const l of text) {
      const r = rects[l.index]
      eq(l.right <= r.x + r.width + 0.5 && l.bottom <= r.y + r.height + 0.5, true, `"${l.text}" is not clipped`)
    }
  })

  // ── Colour ──

  await test("treemap: items share their top-level group's colour and groups differ from each other", async () => {
    const rects = await tiles("treemap-default")
    const expected = treemapLayout(disk, { width: 100, height: 100 })
    const strokeOf = (...path) => rects[indexOfPath(expected, ...path)].stroke
    eq(strokeOf("Disk", "Media", "Video"), strokeOf("Disk", "Media", "Music"), "siblings match")
    eq(strokeOf("Disk", "Documents", "Reports", "Q1"), strokeOf("Disk", "Documents", "Notes"), "a nested group's items take the top-level colour")
    eq(strokeOf("Disk", "Media", "Video") === strokeOf("Disk", "Code", "Repos"), false, "different groups differ")
    eq(strokeOf("Disk", "Media", "Video") === strokeOf("Disk", "System"), false, "a top-level item has its own colour")
  })

  await test("treemap: by value, a larger item is shaded further along the scale and groups stay neutral", async () => {
    const name = "treemap-value"
    const rects = await tiles(name)
    const leaves = rects.filter((r) => r.kind === "leaf")
    const [big, small] = [leaves.find((r) => r.value === 640), leaves.find((r) => r.value === 3)]
    eq(big.fill === small.fill, false, "fills differ across the range")
    eq(big.stroke, small.stroke, "every item has the same edge, so a pale tile keeps an outline")
    const groups = rects.filter((r) => r.kind === "group")
    eq(new Set(groups.map((g) => g.fill)).size, 1, "every group has the neutral fill")
    eq(groups[0].fill === big.fill, false, "and it is not an item's")
    eq(await page.locator(`${pg(name)} .chart-treemap-legend-label`).allTextContents(), ["0 GB", "700 GB"], "the legend names the pinned ends")
    eq(await page.locator(`${pg(name)} .chart-treemap-legend-ramp`).count(), 1, "and draws a ramp")
  })

  await test("treemap: the legend names the top-level groups, largest first, in their colours", async () => {
    const name = "treemap-default"
    eq(await page.locator(`${pg(name)} .chart-legend-item`).allTextContents(), ["Media", "Code", "Documents", "System", "Cache"])
    const swatches = await page.locator(`${pg(name)} .chart-legend-swatch`).evaluateAll((els) => els.map((el) => getComputedStyle(el).backgroundColor))
    eq(new Set(swatches).size, 5, "five distinct colours")
  })

  // ── Tooltip ──

  await test("treemap: the tooltip is titled with the path and shows the value", async () => {
    const name = "treemap-default"
    const rects = await tiles(name)
    const expected = treemapLayout(disk, { width: 100, height: 100 })
    const video = rects[indexOfPath(expected, "Disk", "Media", "Video")]
    await surface(name).evaluate((el) => el.scrollIntoView({ block: "center" }))
    const box = await surface(name).boundingBox()
    await page.mouse.move(box.x + video.x + video.width / 2, box.y + video.y + video.height / 2)
    await tooltip(name).waitFor()
    eq(await page.locator(`${pg(name)} .chart-tooltip-label`).textContent(), "Disk › Media › Video")
    eq((await tooltip(name).textContent()).includes("640"), true, "the value")
    eq((await tooltip(name).textContent()).includes("Size (GB)"), true, "named by the config label")
    const media = rects[indexOfPath(expected, "Disk", "Media")]
    await page.mouse.move(box.x + media.x + media.width / 2, box.y + media.y + 5)
    await page.waitForFunction(() => document.querySelector('[data-pg="treemap-default"] .chart-tooltip-label')?.textContent === "Disk › Media")
    eq((await tooltip(name).textContent()).includes("1,240"), true, "a group shows the sum of what it holds")
    await page.mouse.move(0, 0)
    await tooltip(name).waitFor({ state: "detached" })
  })

  // ── Keyboard ──

  await test("treemap: the arrows walk the tiles in layout order, Home and End jump, and the ends hold", async () => {
    const name = "treemap-zoom"
    const count = (await tiles(name)).length
    await focusSurface(name)
    eq(await activeIndex(name), [0], "focus lands on the first tile")
    eq(await press(name, "ArrowRight"), [1])
    eq(await press(name, "ArrowDown"), [2])
    eq(await press(name, "ArrowLeft"), [1])
    eq(await press(name, "ArrowUp"), [0])
    eq(await press(name, "ArrowLeft"), [0], "back stops at the first")
    eq(await press(name, "End"), [count - 1])
    eq(await press(name, "ArrowRight"), [count - 1], "forward stops at the last")
    eq(await press(name, "Home"), [0])
    await release(name)
  })

  await test("treemap: Enter zooms into a group, Escape climbs out and keeps the group focused", async () => {
    const name = "treemap-zoom"
    const full = await tiles(name)
    const expected = treemapLayout(disk, { width: 100, height: 100 })
    const media = indexOfPath(expected, "Disk", "Media")
    await focusSurface(name)
    await press(name, ...Array(media).fill("ArrowRight"))
    eq(await activeIndex(name), [media])
    await page.keyboard.press("Enter")
    eq(await tiles(name).then((t) => t.length), 4, "the view is Media and its three items")
    eq(await page.locator(`${pg(name)} .chart-treemap`).evaluate((el) => el.dataset.zoomed), "true", "the chart says it is zoomed")
    eq(await activeIndex(name), [0], "focus is on the zoomed group")
    const zoomed = await tiles(name)
    const { width, height } = await svgSize(name)
    near(zoomed[0].width, width - 4, "the group fills the chart")
    near(zoomed[0].height, height - 4)
    const headline = (await labels(name)).find((l) => l.index === 0)
    eq(headline.text, "Disk › Media", "the header shows the path")
    near(zoomed[1].width * zoomed[1].height / (zoomed[3].width * zoomed[3].height), 640 / 180, "items keep their proportions in the larger box")
    eq(zoomed[1].width > full[media + 1].width, true, "and have more room")

    await page.keyboard.press("Escape")
    eq((await tiles(name)).length, full.length, "back to the whole tree")
    eq(await activeIndex(name), [media], "the group we left is the focused tile")
    eq(await page.locator(`${pg(name)} .chart-treemap`).evaluate((el) => el.hasAttribute("data-zoomed")), false)
    await release(name)
  })

  await test("treemap: Enter on an item or on the zoomed root does nothing, and zooming nests two levels", async () => {
    const name = "treemap-zoom"
    const full = (await tiles(name)).length
    const expected = treemapLayout(disk, { width: 100, height: 100 })
    await focusSurface(name)
    await press(name, "Home")
    await page.keyboard.press("Enter")
    eq((await tiles(name)).length, full, "the root of the whole tree is already the view")
    await press(name, "ArrowRight", "ArrowRight")
    eq(expected[2].leaf, true, "precondition: tile 2 is an item")
    await page.keyboard.press("Enter")
    eq((await tiles(name)).length, full, "an item has nothing to zoom into")

    await press(name, "Home")
    await press(name, ...Array(indexOfPath(expected, "Disk", "Documents")).fill("ArrowRight"))
    await page.keyboard.press("Enter")
    const documents = await tiles(name)
    eq(documents.length, 7, "Documents, Reports with three items, Contracts and Notes")
    await press(name, "ArrowRight")
    eq(documents[1].kind, "group", "precondition: tile 1 is the nested group")
    await page.keyboard.press("Enter")
    eq((await tiles(name)).length, 4, "Reports and its three items")
    eq((await labels(name)).find((l) => l.index === 0).text, "Disk › Documents › Reports")
    await page.keyboard.press("Escape")
    eq((await tiles(name)).length, 7, "one level out")
    eq(await activeIndex(name), [1], "on the group we left")
    await page.keyboard.press("Escape")
    eq((await tiles(name)).length, full, "two levels out")
    eq((await activeIndex(name)).length, 1, "still focused after climbing")
    await page.keyboard.press("Escape")
    eq(await activeIndex(name), [], "Escape at the top dismisses as on any chart")
    await release(name)
  })

  await test("treemap: double-clicking a group zooms in and double-clicking the zoomed header climbs out", async () => {
    const name = "treemap-zoom"
    const full = (await tiles(name)).length
    const expected = treemapLayout(disk, { width: 100, height: 100 })
    const code = (await tiles(name))[indexOfPath(expected, "Disk", "Code")]
    await surface(name).evaluate((el) => el.scrollIntoView({ block: "center" }))
    const box = await surface(name).boundingBox()
    await page.mouse.dblclick(box.x + code.x + code.width / 2, box.y + code.y + 5)
    await page.waitForFunction(() => document.querySelectorAll('[data-pg="treemap-zoom"] .chart-treemap-tile').length < 22)
    eq((await tiles(name)).length, 6, "Code, Repos, Build, and Deps with its two")
    await page.mouse.dblclick(box.x + 30, box.y + 12)
    await page.waitForFunction((n) => document.querySelectorAll('[data-pg="treemap-zoom"] .chart-treemap-tile').length === n, full)
    await page.mouse.move(0, 0)
  })

  await test("treemap: right to left keeps the tiles where they are and the arrows follow the screen", async () => {
    const name = "treemap-rtl"
    eq(await page.locator(pg(name)).evaluate((el) => getComputedStyle(el).direction), "rtl", "the fixture is right to left")
    eq(await surface(name).evaluate((el) => getComputedStyle(el).direction), "ltr", "the svg keeps the plot's own direction")
    const [rtl, ltr] = [await tiles(name), await tiles("treemap-zoom")]
    eq(rtl.length, ltr.length)
    near(rtl[1].x / (await svgSize(name)).width, ltr[1].x / (await svgSize("treemap-zoom")).width, "the first group sits at the same place in the box")
    await focusSurface(name)
    eq(await activeIndex(name), [0])
    eq(await press(name, "ArrowRight"), [1], "ArrowRight is forward")
    eq(await press(name, "ArrowLeft"), [0], "ArrowLeft is back")
    await release(name)
  })

  // ── Accessibility ──

  await test("treemap: accessibilityLayer wires a generated summary that is read once", async () => {
    const name = "treemap-default"
    const id = await surface(name).getAttribute("aria-describedby")
    const summary = page.locator(`${pg(name)} #${id}`)
    const text = await summary.textContent()
    eq(text.startsWith("Treemap of Disk, 2,567 GB in 15 items across 6 groups."), true, text)
    eq(text.includes("Largest: Media 1,240 GB, Code 760 GB, Documents 300 GB."), true, text)
    eq(await summary.evaluate((el) => el.hidden), true, "kept out of the page")
    eq(await surface(name).getAttribute("role"), "application")
    eq(await surface(name).getAttribute("aria-roledescription"), "chart")
    eq(await surface(name).getAttribute("tabindex"), "0")
    eq(await surface("treemap-small").getAttribute("aria-describedby"), null, "no layer, no summary")
    eq(await surface("treemap-small").getAttribute("tabindex"), null, "and not focusable")
    eq(await page.locator(`${pg("treemap-small")} .chart-treemap-summary`).count(), 0)
  })

  await test("treemap: the labels are hidden from the accessibility tree", async () => {
    eq(await page.locator(`${pg("treemap-default")} .chart-treemap-labels`).getAttribute("aria-hidden"), "true")
  })

  // ── Forced colours ──

  await test("forced-colors: tiles fill with Canvas and edge in CanvasText", async () => {
    const name = "treemap-default"
    const read = (prop, color) =>
      tile(name, 2).evaluate((el, [prop, color]) => {
        const probe = document.createElementNS("http://www.w3.org/2000/svg", "rect")
        probe.style[prop] = color
        el.parentNode.appendChild(probe)
        const c = getComputedStyle(probe)[prop]
        probe.remove()
        return c
      }, [prop, color])
    const before = await tile(name, 2).evaluate((el) => ({ fill: getComputedStyle(el).fill, stroke: getComputedStyle(el).stroke }))
    eq(before.stroke === "rgb(0, 0, 0)" || before.stroke === "rgb(255, 255, 255)", false, "precondition: outside forced colours the edge is the palette colour")
    await page.emulateMedia({ forcedColors: "active" })
    try {
      const during = await tile(name, 2).evaluate((el) => ({ fill: getComputedStyle(el).fill, stroke: getComputedStyle(el).stroke }))
      eq(during.fill, await read("fill", "Canvas"), "Canvas fill")
      eq(during.stroke, await read("stroke", "CanvasText"), "CanvasText edge")
    } finally {
      await page.emulateMedia({ forcedColors: null })
    }
  })

  // ── Edge cases ──

  await test("treemap: a tree with nothing drawable draws no tiles and raises no error", async () => {
    eq(await page.locator(`${pg("treemap-empty")} .chart-treemap-tile`).count(), 0)
    eq(await page.locator(`${pg("treemap-empty")} .chart-surface`).count(), 1, "the chart itself is there")
    eq(pageErrors, [], "no page error")
  })
}
