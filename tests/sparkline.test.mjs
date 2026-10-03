// Sparkline: the x scale spans inset → width - inset, the y scale puts the
// last value where the dot sits, one point is a dot alone, the svg is always
// hidden from the accessibility tree, and the colour props reach the part
// each one names.

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

  await test("a live series slides its window and the figure tracks the dot", async () => {
    const sel = '[data-pg="spark-live"] .sparkline-line'
    eq((await lineXs(sel)).length, 24, "24 vertices")
    const before = await page.$eval(sel, (el) => el.getAttribute("d"))
    await page.waitForFunction(
      ([s, d]) => document.querySelector(s).getAttribute("d") !== d,
      [sel, before],
      { timeout: 8000 },
    )
    eq((await lineXs(sel)).length, 24, "still 24 vertices after a tick")
    // Read the dot and the figure in one evaluate so a tick cannot land between them.
    const [cy, figure] = await page.$eval('[data-pg="spark-live"]', (host) => [
      Number(host.querySelector(".sparkline-dot").getAttribute("cy")),
      host.querySelector(".pg-stat-num").textContent,
    ])
    // max={100}, so the dot's y inverts to the value the figure shows.
    near(((height - inset - cy) / (height - 2 * inset)) * 100, Number(figure.replace("%", "")), 0.01, "figure = last point")
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

  // Computed colour of a CSS colour value, in the format getComputedStyle reports.
  const resolve = (values) =>
    page.evaluate((vs) => {
      const probe = document.createElement("span")
      document.body.appendChild(probe)
      const out = vs.map((v) => {
        probe.style.color = v
        return getComputedStyle(probe).color
      })
      probe.remove()
      return out
    }, values)
  const palette = await resolve([1, 2, 3, 4, 5].map((n) => `var(--chart-${n})`))

  const paint = (host) =>
    page.$$eval(`[data-pg="${host}"] .sparkline`, (svgs) =>
      svgs.map((svg) =>
        [...svg.querySelectorAll(".sparkline-series")].map((g) => {
          const cs = (sel) => {
            const el = g.querySelector(sel)
            return el && getComputedStyle(el)
          }
          return {
            stroke: cs(".sparkline-line")?.stroke,
            area: cs(".sparkline-area")?.fill,
            areaOpacity: cs(".sparkline-area")?.fillOpacity,
            dot: cs(".sparkline-dot")?.fill,
            cy: Number(g.querySelector(".sparkline-dot")?.getAttribute("cy")),
          }
        }),
      ),
    )

  await test("color tints the line, wash and dot; dotColor repaints only the dot", async () => {
    // Precondition: the five tokens are distinct, so a line stuck on one colour fails.
    eq(new Set(palette).size, 5, `palette ${palette}`)
    const svgs = await paint("spark-colors")
    eq(svgs.length, 6)
    for (let i = 0; i < 5; i++) {
      const [s] = svgs[i]
      eq(s.stroke, palette[i], `line ${i + 1}`)
      eq(s.area, palette[i], `wash ${i + 1}`)
      eq(s.dot, palette[i], `dot ${i + 1}`)
    }
    const [own] = svgs[5]
    eq(own.stroke, palette[2], "line keeps color")
    eq(own.area, palette[2], "wash keeps color")
    eq(own.dot, palette[0], "dot takes dotColor")
  })

  await test("areaColor and areaOpacity repaint the wash and nothing else", async () => {
    const [[base]] = await paint("spark-default")
    eq(base.areaOpacity, "0.12", "default wash strength")
    eq(base.area, base.stroke, "default wash = line colour")
    const [[strong], [own]] = await paint("spark-wash")
    eq(strong.areaOpacity, "0.3", "areaOpacity")
    eq(strong.area, palette[1], "wash keeps the line colour")
    eq(strong.stroke, palette[1], "line")
    eq(own.areaOpacity, "0.4", "areaOpacity")
    eq(own.area, palette[3], "wash takes areaColor")
    eq(own.stroke, palette[2], "line keeps color")
    eq(own.dot, palette[2], "dot keeps color")
  })

  await test("series share one scale and take the palette in order", async () => {
    const inbound = [30, 34, 28, 41, 38, 45, 40, 48]
    const outbound = [12, 15, 11, 18, 22, 19, 25, 21]
    const yAt = (v, top) => height - inset - (v / top) * (height - 2 * inset)
    const shared = yAt(outbound.at(-1), Math.max(...inbound, ...outbound))
    // Fixture: scaled to its own max the outbound dot would sit elsewhere.
    if (Math.abs(shared - yAt(outbound.at(-1), Math.max(...outbound))) < 1) throw new Error("fixture: scales coincide")

    const [auto, custom] = await paint("spark-series")
    eq(auto.length, 2, "two series")
    eq(auto.map((s) => s.stroke).join(" | "), [palette[0], palette[1]].join(" | "), "palette order")
    eq(auto.map((s) => s.dot).join(" | "), [palette[0], palette[1]].join(" | "), "dots follow")
    eq(auto[0].cy, inset, "the overall max sits at the top inset")
    near(auto[1].cy, shared, 0.01, "outbound on the shared scale")
    const lines = await page.$$eval('[data-pg="spark-series"] .sparkline:first-child .sparkline-line', (els) =>
      els.map((el) => el.getAttribute("d").match(/M [\d.]+ ([\d.]+)/)[1]),
    )
    near(Number(lines[0]), yAt(inbound[0], 48), 0.01, "first series painted first")

    eq(custom.map((s) => s.stroke).join(" | "), [palette[2], palette[4]].join(" | "), "item colours")
    eq(custom.map((s) => s.dot).join(" | "), [palette[2], palette[0]].join(" | "), "item dotColor")
    eq(custom.filter((s) => s.area !== undefined).length, 0, "area={false} applies to every series")
  })

  await test("theme switches the line with the colour scheme", async () => {
    const [light, dark] = await resolve(["oklch(0.55 0.2 250)", "oklch(0.78 0.14 250)"])
    // The site seeds its scheme at import time: emulate, then navigate.
    const strokeIn = async (scheme) => {
      await page.emulateMedia({ colorScheme: scheme })
      await page.goto("about:blank")
      await page.goto(`${baseUrl}/#sparkline`)
      await page.locator('[data-pg="spark-theme"] .sparkline-line').waitFor()
      const [[s]] = await paint("spark-theme")
      return s.stroke
    }
    try {
      eq(await strokeIn("light"), light, "light")
      eq(await strokeIn("dark"), dark, "dark")
    } finally {
      await page.emulateMedia({ colorScheme: "light" })
    }
  })
}
