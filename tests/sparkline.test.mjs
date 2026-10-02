// Sparkline: the x scale spans inset → width - inset, the y scale puts the
// last value where the dot sits, one point is a dot alone, and the svg is
// always hidden from the accessibility tree.

export default async function run({ page, baseUrl, test, eq, near }) {
  await page.goto(`${baseUrl}/#sparkline`)
  const spark = page.locator('[data-pg="spark-default"] .sparkline')
  await spark.waitFor()

  // Mirrors the demo page's series and the component defaults.
  const points = [12, 18, 9, 24, 20, 35, 27, 31]
  const width = 72
  const height = 24
  const inset = 2
  const last = points[points.length - 1]
  const max = Math.max(...points)
  const expectedCy = height - inset - (last / max) * (height - 2 * inset)

  const lineXs = async (sel) =>
    page.$eval(sel, (el) =>
      [...el.getAttribute("d").matchAll(/[ML] ([\d.]+) ([\d.]+)/g)].map((m) => [Number(m[1]), Number(m[2])]),
    )

  await test("the line runs from inset to width - inset", async () => {
    const coords = await lineXs('[data-pg="spark-default"] .sparkline-line')
    eq(coords.length, points.length, "one vertex per point")
    eq(coords[0][0], inset, "first x")
    eq(coords[coords.length - 1][0], width - inset, "last x")
    for (let i = 1; i < coords.length; i++) {
      if (!(coords[i][0] > coords[i - 1][0])) throw new Error(`x not increasing at ${i}`)
    }
  })

  await test("the dot sits on the last value", async () => {
    const dot = page.locator('[data-pg="spark-default"] .sparkline-dot')
    eq(await dot.count(), 1, "one dot")
    eq(Number(await dot.getAttribute("cx")), width - inset, "cx")
    near(Number(await dot.getAttribute("cy")), expectedCy, 0.01, "cy")
    // The last value is neither the extreme nor the baseline, so a dot pinned
    // to an edge would fail here rather than coincide.
    if (expectedCy === inset || expectedCy === height - inset) throw new Error("fixture lands on an edge")
    eq(Number(await dot.getAttribute("r")), inset, "r")
    const coords = await lineXs('[data-pg="spark-default"] .sparkline-line')
    near(coords[coords.length - 1][1], expectedCy, 0.01, "line ends at the dot")
  })

  await test("the area closes on the bottom edge under the line", async () => {
    const d = await page.$eval('[data-pg="spark-default"] .sparkline-area', (el) => el.getAttribute("d"))
    eq(d.endsWith(` L ${width - inset} ${height} L ${inset} ${height} Z`), true, `area tail: ${d}`)
  })

  await test("area={false} and dot={false} drop their parts", async () => {
    const svgs = page.locator('[data-pg="spark-noarea"] .sparkline')
    eq(await svgs.count(), 2)
    eq(await svgs.nth(0).locator(".sparkline-area").count(), 0, "no area")
    eq(await svgs.nth(0).locator(".sparkline-line").count(), 1, "line kept")
    eq(await svgs.nth(0).locator(".sparkline-dot").count(), 1, "dot kept")
    eq(await svgs.nth(1).locator(".sparkline-dot").count(), 0, "no dot")
    eq(await svgs.nth(1).locator(".sparkline-line").count(), 1, "line kept")
  })

  await test("a single point renders one centred dot and no path", async () => {
    const svg = page.locator('[data-pg="spark-single"] .sparkline')
    eq(await svg.locator("path").count(), 0, "no path")
    const dot = svg.locator(".sparkline-dot")
    eq(await dot.count(), 1, "one dot")
    eq(Number(await dot.getAttribute("cx")), width / 2, "cx centred")
    // max defaults to the lone value, so it sits at the top inset.
    eq(Number(await dot.getAttribute("cy")), inset, "cy")
  })

  await test("an empty series renders the box and nothing else", async () => {
    const svg = page.locator('[data-pg="spark-empty"] .sparkline')
    eq(await svg.count(), 1)
    eq(await svg.evaluate((el) => el.childElementCount), 0, "no children")
    const box = await svg.evaluate((el) => el.getBoundingClientRect())
    near(box.width, width, 0.5, "width")
    near(box.height, height, 0.5, "height")
  })

  await test("every sparkline is aria-hidden", async () => {
    const all = page.locator(".sparkline")
    const n = await all.count()
    if (n < 8) throw new Error(`expected the page's sparklines, got ${n}`)
    for (let i = 0; i < n; i++) eq(await all.nth(i).getAttribute("aria-hidden"), "true", `svg ${i}`)
  })

  await test("the stroke takes the parent's colour and the dot its token", async () => {
    const [stroke, color, dot, dotToken] = await page.$eval('[data-pg="spark-figure"]', (host) => {
      const tinted = host.querySelector("[style*='--sparkline-dot']")
      const line = tinted.querySelector(".sparkline-line")
      const dot = tinted.querySelector(".sparkline-dot")
      const probe = document.createElement("span")
      probe.style.color = "var(--chart-2)"
      tinted.appendChild(probe)
      const dotToken = getComputedStyle(probe).color
      probe.remove()
      return [getComputedStyle(line).stroke, getComputedStyle(tinted).color, getComputedStyle(dot).fill, dotToken]
    })
    eq(stroke, color, "stroke = parent color")
    eq(dot, dotToken, "dot = --sparkline-dot")
    if (stroke === dot) throw new Error("fixture: stroke and dot colours coincide")
  })
}
