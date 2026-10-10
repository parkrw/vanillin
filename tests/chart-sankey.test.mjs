import { sankeyLayout } from "../lib/chart-sankey.js"

const nodes = ["salary", "freelance", "interest", "budget", "housing", "food", "savings", "other"].map((id) => ({ id }))
const links = [
  { source: "salary", target: "budget", value: 60 },
  { source: "freelance", target: "budget", value: 20 },
  { source: "interest", target: "budget", value: 5 },
  { source: "budget", target: "housing", value: 35 },
  { source: "budget", target: "food", value: 15 },
  { source: "budget", target: "savings", value: 25 },
  { source: "budget", target: "other", value: 10 },
]
const shortcutLinks = [
  { source: "salary", target: "budget", value: 60 },
  { source: "freelance", target: "budget", value: 20 },
  { source: "interest", target: "savings", value: 5 },
  { source: "budget", target: "housing", value: 40 },
  { source: "budget", target: "food", value: 20 },
  { source: "budget", target: "other", value: 20 },
]

export default async function run({ page, baseUrl, test, eq: strictEq, near }) {
  const eq = (actual, expected, message) =>
    strictEq(typeof actual === "object" && actual !== null ? JSON.stringify(actual) : actual, typeof expected === "object" && expected !== null ? JSON.stringify(expected) : expected, message)
  const pageErrors = []
  page.on("pageerror", (e) => pageErrors.push(e.message))

  await page.goto(`${baseUrl}/#chart-sankey`)
  await page.waitForSelector('[data-pg="sankey-default"] .chart-sankey-node')
  await page.waitForFunction(() =>
    [...document.querySelectorAll('[data-pg^="sankey-"] .chart-surface')].every((svg) => svg.getAttribute("width") !== "320"),
  )

  const pg = (name) => `[data-pg="${name}"]`
  const surface = (name) => page.locator(`${pg(name)} .chart-surface`)
  const node = (name, index) => page.locator(`${pg(name)} .chart-sankey-node[data-index="${index}"]`)
  const link = (name, index) => page.locator(`${pg(name)} .chart-sankey-link[data-index="${index}"]`)
  const tooltip = (name) => page.locator(`${pg(name)} .chart-tooltip`)
  const svgSize = (name) =>
    surface(name).evaluate((el) => ({ width: Number(el.getAttribute("width")), height: Number(el.getAttribute("height")) }))
  const nodeBox = (name, index) =>
    node(name, index).evaluate((el) => Object.fromEntries(["x", "y", "width", "height"].map((a) => [a, Number(el.getAttribute(a))])))
  const activeLinks = (name) =>
    page.locator(`${pg(name)} .chart-sankey-link[data-active]`).evaluateAll((els) => els.map((el) => Number(el.dataset.index)))
  const linkedNodes = (name) =>
    page.locator(`${pg(name)} .chart-sankey-node[data-linked]`).evaluateAll((els) => els.map((el) => Number(el.dataset.index)))
  const current = (name) =>
    page.locator(`${pg(name)} [data-current]`).evaluateAll((els) => els.map((el) => `${el.classList.contains("chart-sankey-node") ? "node" : "link"}:${el.dataset.index}`))
  const expected = async (name, data = links, options = {}) => {
    const { width, height } = await svgSize(name)
    const labels = options.labelSize ?? 72
    const plot = { x: 5 + labels, y: 5, width: width - 10 - 2 * labels, height: height - 10 }
    return { plot, layout: sankeyLayout({ nodes, links: data, width: plot.width, height: plot.height, ...options.layout }) }
  }
  const scrollTo = (name) => surface(name).evaluate((el) => el.scrollIntoView({ block: "center" }))
  const hoverAt = async (name, x, y) => {
    await scrollTo(name)
    const b = await surface(name).boundingBox()
    await page.mouse.move(b.x + x, b.y + y)
  }
  const hoverNode = async (name, index) => {
    await scrollTo(name)
    const b = await node(name, index).boundingBox()
    await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2)
  }
  const press = async (name, ...keys) => {
    for (const key of keys) await page.keyboard.press(key)
    return current(name)
  }
  const focusSurface = async (name) => {
    await scrollTo(name)
    await surface(name).focus()
  }
  const blur = (name) => surface(name).evaluate((el) => el.blur())

  // ── Geometry ──

  await test("sankey: nodes and bands sit where the layout puts them", async () => {
    const name = "sankey-default"
    const { plot, layout } = await expected(name)
    eq(await page.locator(`${pg(name)} .chart-sankey-node`).count(), 8, "eight nodes")
    eq(await page.locator(`${pg(name)} .chart-sankey-link`).count(), 7, "seven bands")
    for (const n of layout.nodes) {
      const b = await nodeBox(name, n.index)
      near(b.x, n.x0, 0.01, `${n.id} x`)
      near(b.y, n.y0, 0.01, `${n.id} y`)
      near(b.width, n.x1 - n.x0, 0.01, `${n.id} width`)
      near(b.height, n.height, 0.01, `${n.id} height`)
    }
    for (const l of layout.links) {
      const el = link(name, l.index)
      eq(await el.getAttribute("d"), l.d, `band ${l.index} path`)
      near(Number(await el.getAttribute("stroke-width")), l.width, 0.01, `band ${l.index} width`)
    }
    const budget = await nodeBox(name, 3)
    const inflow = layout.links.filter((l) => l.target === 3).reduce((sum, l) => sum + l.width, 0)
    near(inflow, budget.height, 0.01, "the bands entering Budget fill its height")
    const origin = await page.locator(`${pg(name)} .chart-sankey-nodes`).evaluate((el) => el.parentNode.getAttribute("transform"))
    eq(origin, `translate(${plot.x} ${plot.y})`, "the diagram sits inside the label margins")
  })

  await test("sankey: a node's label stands beside its bar, first column left, the rest right", async () => {
    const name = "sankey-default"
    const { plot, layout } = await expected(name)
    const label = (i) => page.locator(`${pg(name)} .chart-sankey-label[data-index="${i}"]`).evaluate((el) => ({ text: el.textContent, x: Number(el.getAttribute("x")), anchor: el.getAttribute("text-anchor") }))
    const salary = await label(0)
    eq(salary.text, "Salary", "the name")
    eq(salary.anchor, "end", "first column names end at the bar")
    eq(salary.x < layout.nodes[0].x0, true, "and sit left of it")
    const housing = await label(4)
    eq(housing.anchor, "start", "last column names start at the bar")
    eq(housing.x > layout.nodes[4].x1, true, "and sit right of it")
    eq(plot.x + layout.nodes[4].x1 + 6 + 6 * 8 < (await svgSize(name)).width, true, "the right margin holds the name")
  })

  await test("sankey: nodeWidth, nodePadding and labelSize 0 reshape the diagram", async () => {
    const name = "sankey-bare"
    eq(await page.locator(`${pg(name)} .chart-sankey-label`).count(), 0, "no names with labelSize 0")
    const { plot, layout } = await expected(name, links, { labelSize: 0, layout: { nodeWidth: 24, nodePadding: 20 } })
    const salary = await nodeBox(name, 0)
    near(salary.width, 24, 0.01, "bars are 24 wide")
    near(salary.x, layout.nodes[0].x0, 0.01, "bars sit on the layout")
    const origin = await page.locator(`${pg(name)} .chart-sankey-nodes`).evaluate((el) => el.parentNode.getAttribute("transform"))
    eq(origin, `translate(${plot.x} ${plot.y})`, "and the diagram starts at the margin alone")
    const [first, second] = layout.columns[2]
    const [top, bottom] = [await nodeBox(name, first), await nodeBox(name, second)]
    near(bottom.y - (top.y + top.height), 20, 0.01, "nodes in a column are 20 apart")
  })

  await test("sankey: align left leaves a sink one column past its source", async () => {
    const name = "sankey-left"
    const { layout } = await expected(name, shortcutLinks, { layout: { align: "left" } })
    const justified = await expected(name, shortcutLinks)
    const savings = await nodeBox(name, 6)
    near(savings.x, layout.nodes[6].x0, 0.01, "savings at its own column")
    eq(layout.nodes[6].x0 < justified.layout.nodes[6].x0, true, "precondition: justified layout would push it to the last column")
    const housing = await nodeBox(name, 4)
    eq(savings.x < housing.x, true, "savings sits left of the outcomes")
  })

  // ── Colour ──

  await test("sankey: nodes take the chart palette in order and a source-coloured band matches its source", async () => {
    const name = "sankey-default"
    const fill = (i) => node(name, i).evaluate((el) => getComputedStyle(el).fill)
    const token = (v) => page.evaluate((v) => {
      const probe = document.createElement("div")
      probe.style.color = `var(${v})`
      document.body.appendChild(probe)
      const c = getComputedStyle(probe).color
      probe.remove()
      return c
    }, v)
    for (const i of [0, 3, 7]) eq(await fill(i), await token(`--chart-${(i % 5) + 1}`), `node ${i} colour`)
    eq(await fill(0) === (await fill(1)), false, "precondition: neighbouring nodes differ")
    eq(await link(name, 3).evaluate((el) => getComputedStyle(el).stroke), await fill(3), "Budget's band to Housing is Budget's colour")
    eq(await link(name, 0).evaluate((el) => getComputedStyle(el).stroke), await fill(0), "Salary's band is Salary's colour")
  })

  await test("sankey: linkColor target colours a band like the node it enters", async () => {
    const name = "sankey-target"
    const fill = (i) => node(name, i).evaluate((el) => getComputedStyle(el).fill)
    eq(await link(name, 0).evaluate((el) => getComputedStyle(el).stroke), await fill(3), "Salary to Budget takes Budget's colour")
    eq(await link(name, 3).evaluate((el) => getComputedStyle(el).stroke), await fill(4), "Budget to Housing takes Housing's colour")
    eq(await fill(0) === (await fill(3)), false, "precondition: the two ends differ")
  })

  await test("sankey: linkColor gradient fades from source to target along the band", async () => {
    const name = "sankey-gradient"
    const info = await link(name, 3).evaluate((el) => {
      const id = /url\("?#([^")]+)"?\)/.exec(getComputedStyle(el).stroke)?.[1]
      const grad = document.getElementById(id)
      const colour = (c) => {
        const probe = document.createElement("div")
        probe.style.color = c
        document.body.appendChild(probe)
        const out = getComputedStyle(probe).color
        probe.remove()
        return out
      }
      return {
        found: Boolean(grad),
        units: grad?.getAttribute("gradientUnits"),
        x1: Number(grad?.getAttribute("x1")),
        x2: Number(grad?.getAttribute("x2")),
        stops: [...(grad?.querySelectorAll("stop") ?? [])].map((s) => getComputedStyle(s).stopColor),
        d: el.getAttribute("d"),
        colour: colour("transparent"),
      }
    })
    eq(info.found, true, "the band strokes with a gradient that exists")
    eq(info.units, "userSpaceOnUse", "gradient spans the band's own x range")
    const { layout } = await expected(name)
    near(info.x1, layout.links[3].x0, 0.01, "starts at the source bar")
    near(info.x2, layout.links[3].x1, 0.01, "ends at the target bar")
    const [source, target] = [await node(name, 3).evaluate((el) => getComputedStyle(el).fill), await node(name, 4).evaluate((el) => getComputedStyle(el).fill)]
    eq(info.stops, [source, target], "from Budget's colour to Housing's")
  })

  await test("sankey: a config entry named by a node id sets its colour, and the legend lists every node", async () => {
    const name = "sankey-colors"
    const plain = await node("sankey-default", 4).evaluate((el) => getComputedStyle(el).fill)
    const themed = await node(name, 4).evaluate((el) => getComputedStyle(el).fill)
    eq(themed === plain, false, "Housing is no longer the fifth palette colour")
    eq((await node(name, 4).evaluate((el) => getComputedStyle(el).getPropertyValue("--sankey-color"))).includes("oklch(0.45 0.15 30)"), true, "it is the config's light colour, through the chart's own property")
    eq(await page.locator(`${pg(name)} .chart-legend-item`).allTextContents(), ["Salary", "Freelance", "Interest", "Budget", "Housing", "Food", "Savings", "Other"], "legend names each node, config labels first")
    eq(await page.locator(`${pg(name)} .chart-legend-item`).count(), 8, "one entry per node")
  })

  // ── Emphasis, tooltip, pointer ──

  await test("sankey: hovering a node brings its flows forward and fades the rest", async () => {
    const name = "sankey-default"
    await page.mouse.move(0, 0)
    eq(await activeLinks(name), [], "precondition: nothing emphasised at rest")
    eq(await page.locator(`${pg(name)} .chart-sankey-links[data-emphasis]`).count(), 0, "and nothing faded")
    const rest = await link(name, 1).evaluate((el) => Number(getComputedStyle(el).strokeOpacity))
    await hoverNode(name, 0)
    await page.waitForSelector(`${pg(name)} .chart-sankey-link[data-active]`)
    eq(await activeLinks(name), [0], "Salary has one flow")
    eq(await linkedNodes(name), [3], "the node at its far end is marked, the hovered one is current instead")
    eq(await current(name), ["node:0"], "the hovered node is current")
    await page.waitForFunction(
      (sel) => Number(getComputedStyle(document.querySelector(sel)).strokeOpacity) < 0.2,
      `${pg(name)} .chart-sankey-link[data-index="1"]`,
    )
    const faded = await link(name, 1).evaluate((el) => Number(getComputedStyle(el).strokeOpacity))
    const lit = await link(name, 0).evaluate((el) => Number(getComputedStyle(el).strokeOpacity))
    eq(faded < rest && rest < lit, true, `faded ${faded} < rest ${rest} < emphasised ${lit}`)
    await hoverNode(name, 3)
    await page.waitForFunction((sel) => document.querySelectorAll(sel).length === 7, `${pg(name)} .chart-sankey-link[data-active]`)
    eq((await activeLinks(name)).sort(), [0, 1, 2, 3, 4, 5, 6], "Budget touches every flow")
    await page.mouse.move(0, 0)
    await page.waitForFunction((sel) => !document.querySelector(sel), `${pg(name)} .chart-sankey-link[data-active]`)
  })

  await test("sankey: hovering a band emphasises that flow and marks its two ends", async () => {
    const name = "sankey-default"
    const { plot, layout } = await expected(name)
    const l = layout.links[3]
    await hoverAt(name, plot.x + (l.x0 + l.x1) / 2, plot.y + (l.y0 + l.y1) / 2)
    await page.waitForSelector(`${pg(name)} .chart-sankey-link[data-active]`)
    eq(await activeLinks(name), [3], "only the hovered band")
    eq((await linkedNodes(name)).sort(), [3, 4], "Budget and Housing")
    eq(await current(name), ["link:3"], "the band is current")
    eq(await page.locator(`${pg(name)} .chart-sankey-link-ring`).count(), 1, "the current band carries a ring")
    eq(await page.locator(`${pg(name)} .chart-sankey-link-ring`).getAttribute("d"), l.d, "on its own path")
    // The band's own edge, within its width but away from the centreline, still hits it; beyond it does not.
    await hoverAt(name, plot.x + (l.x0 + l.x1) / 2, plot.y + (l.y0 + l.y1) / 2 + l.width / 2 - 1)
    await page.waitForFunction(() => document.querySelector('[data-pg="sankey-default"] .chart-sankey-link[data-current]')?.dataset.index === "3")
    await hoverAt(name, plot.x + (l.x0 + l.x1) / 2, plot.y + 2)
    await page.waitForFunction(() => !document.querySelector('[data-pg="sankey-default"] .chart-sankey-link[data-active]'))
    eq(await tooltip(name).count(), 0, "empty space shows nothing")
    await page.mouse.move(0, 0)
  })

  await test("sankey: the tooltip lists a node's inflow and outflow and a band's flow", async () => {
    const name = "sankey-default"
    await page.mouse.move(0, 0)
    eq(await tooltip(name).count(), 0, "none before hover")
    await hoverNode(name, 3)
    await tooltip(name).waitFor()
    eq(await page.locator(`${pg(name)} .chart-tooltip-label`).textContent(), "Budget", "node name")
    eq(await page.locator(`${pg(name)} .chart-tooltip-name`).allTextContents(), ["Inflow", "Outflow"], "a middle node has both")
    eq(await page.locator(`${pg(name)} .chart-tooltip-value`).allTextContents(), ["85", "85"], "balanced at 85")
    await hoverNode(name, 0)
    await page.waitForFunction(() => document.querySelector('[data-pg="sankey-default"] .chart-tooltip-label')?.textContent === "Salary")
    eq(await page.locator(`${pg(name)} .chart-tooltip-name`).allTextContents(), ["Outflow"], "a source has only an outflow")
    eq(await page.locator(`${pg(name)} .chart-tooltip-value`).allTextContents(), ["60"], "Salary's 60")
    await hoverNode(name, 5)
    await page.waitForFunction(() => document.querySelector('[data-pg="sankey-default"] .chart-tooltip-label')?.textContent === "Food")
    eq(await page.locator(`${pg(name)} .chart-tooltip-name`).allTextContents(), ["Inflow"], "a sink has only an inflow")
    eq(await page.locator(`${pg(name)} .chart-tooltip-value`).allTextContents(), ["15"], "Food's 15")
    const { plot, layout } = await expected(name)
    const l = layout.links[5]
    await hoverAt(name, plot.x + (l.x0 + l.x1) / 2, plot.y + (l.y0 + l.y1) / 2)
    await page.waitForFunction(() => document.querySelector('[data-pg="sankey-default"] .chart-tooltip-label')?.textContent === "Budget → Savings")
    eq(await page.locator(`${pg(name)} .chart-tooltip-name`).allTextContents(), ["Flow"], "a band lists its flow")
    eq(await page.locator(`${pg(name)} .chart-tooltip-value`).allTextContents(), ["25"], "Budget to Savings is 25")
    await page.mouse.move(0, 0)
    await tooltip(name).waitFor({ state: "detached" })
  })

  // ── Keyboard ──

  await test("sankey: arrows walk nodes down a column, then along a flow and back", async () => {
    const name = "sankey-default"
    await focusSurface(name)
    eq(await current(name), ["node:0"], "focus lands on the first node, top of the first column")
    eq(await press(name, "ArrowDown"), ["node:1"], "down is the next node in the column")
    eq(await press(name, "ArrowDown", "ArrowDown"), ["node:2"], "to the last, and holds")
    eq(await press(name, "ArrowUp"), ["node:1"], "up")
    eq(await press(name, "ArrowRight"), ["link:1"], "right enters the node's first outgoing band")
    eq(await page.locator(`${pg(name)} .chart-tooltip-label`).textContent(), "Freelance → Budget", "the tooltip follows")
    eq(await press(name, "ArrowRight"), ["node:3"], "right again lands on the band's target")
    eq(await activeLinks(name).then((a) => a.length), 7, "Budget's flows are all emphasised")
    eq(await press(name, "ArrowRight"), ["link:3"], "Budget's first outgoing band is the one to the topmost target")
    const siblings = await press(name, "ArrowDown")
    eq(siblings.length === 1 && siblings[0].startsWith("link:") && siblings[0] !== "link:3", true, `down moves to the next band leaving Budget: ${siblings}`)
    eq(await press(name, "ArrowUp"), ["link:3"], "and up returns")
    eq(await press(name, "ArrowUp"), ["link:3"], "holding at the first band")
    eq(await press(name, "ArrowLeft"), ["node:3"], "left goes back to the source")
    eq(await press(name, "ArrowLeft"), ["link:0"], "left again is the first incoming band")
    eq(await press(name, "ArrowLeft"), ["node:0"], "and back to its source")
    eq(await press(name, "ArrowLeft"), ["node:0"], "a source has nothing upstream")
    await blur(name)
  })

  await test("sankey: Home and End jump to the first node and the last band, Escape dismisses", async () => {
    const name = "sankey-default"
    await focusSurface(name)
    const last = await press(name, "End")
    eq(last.length === 1 && last[0].startsWith("link:"), true, `End is a band: ${last}`)
    await page.waitForSelector(`${pg(name)} .chart-tooltip`)
    eq(await press(name, "Home"), ["node:0"], "Home")
    eq(await press(name, "Escape"), [], "Escape clears")
    eq(await tooltip(name).count(), 0, "and hides the tooltip")
    eq(await page.locator(`${pg(name)} .chart-sankey-link-ring`).count(), 0, "no ring at rest")
    await blur(name)
  })

  await test("sankey: a sink has no outgoing band to enter, and a source has none to come back along", async () => {
    const name = "sankey-default"
    await focusSurface(name)
    await press(name,  "Home", "ArrowRight", "ArrowRight", "ArrowRight", "ArrowLeft", "ArrowRight", "ArrowRight")
    eq(await current(name), ["node:4"], "Budget -> first band -> Housing")
    eq(await press(name, "ArrowRight"), ["node:4"], "a sink holds on right")
    const { layout } = await expected(name)
    const column = layout.columns[2]
    eq(column[0], 4, "precondition: Housing tops the last column")
    eq(await press(name, "ArrowDown"), [`node:${column[1]}`], "down is the next node in the last column, by position")
    await blur(name)
  })

  await test("sankey: right to left keeps the diagram left to right, and the arrows follow the screen", async () => {
    const name = "sankey-rtl"
    eq(await page.locator(pg(name)).evaluate((el) => getComputedStyle(el).direction), "rtl", "the fixture is right to left")
    eq(await surface(name).evaluate((el) => getComputedStyle(el).direction), "ltr", "the svg keeps the diagram's own direction")
    const [source, sink] = [await nodeBox(name, 0), await nodeBox(name, 4)]
    eq(sink.x > source.x, true, "sources are drawn left of outcomes")
    await focusSurface(name)
    eq(await current(name), ["node:0"], "focus lands on the first node")
    eq(await press(name, "ArrowRight"), ["link:0"], "ArrowRight goes downstream")
    eq(await press(name, "ArrowLeft"), ["node:0"], "ArrowLeft goes back")
    await blur(name)
  })

  // ── Accessibility ──

  await test("sankey: accessibilityLayer wires a generated summary to the svg, and without it there is none", async () => {
    const name = "sankey-default"
    const wired = await surface(name).evaluate((el) => {
      const p = document.getElementById(el.getAttribute("aria-describedby"))
      return { text: p?.textContent, hidden: p?.hidden, role: el.getAttribute("role"), tab: el.getAttribute("tabindex"), label: el.getAttribute("aria-label") }
    })
    eq(
      wired.text,
      "Flow diagram with 8 nodes and 7 flows, total 170. Starts: Salary 60, Freelance 20, Interest 5. Ends: Housing 35, Food 15, Savings 25, Other 10. Largest flow: Salary to Budget, 60.",
      "the summary",
    )
    eq(wired.hidden, true, "held in a hidden paragraph")
    eq([wired.role, wired.tab, wired.label], ["application", "0", "Where income goes"], "focusable with a name")
    const bare = "sankey-target"
    eq(await surface(bare).getAttribute("aria-describedby"), null, "no description without accessibilityLayer")
    eq(await page.locator(`${pg(bare)} .chart-sankey-summary`).count(), 0, "and no summary paragraph")
    eq(await surface(bare).getAttribute("tabindex"), null, "and not focusable")
  })

  await test("sankey: an empty chart draws nothing, says so, and throws nothing", async () => {
    const name = "sankey-empty"
    eq(await page.locator(`${pg(name)} .chart-sankey-node`).count(), 0, "no nodes")
    eq(await page.locator(`${pg(name)} .chart-sankey-link`).count(), 0, "no bands")
    eq(
      await surface(name).evaluate((el) => document.getElementById(el.getAttribute("aria-describedby")).textContent),
      "Flow diagram with nothing to draw.",
      "summary",
    )
    await focusSurface(name)
    await page.keyboard.press("ArrowRight")
    eq(await current(name), [], "arrows do nothing")
    await blur(name)
    eq(pageErrors, [], "no page errors")
  })

  await test("sankey: a loop in the links draws the empty chart and throws nothing", async () => {
    const name = "sankey-cycle"
    eq(await page.locator(`${pg(name)} .chart-sankey-node`).count(), 0, "no nodes")
    eq(await page.locator(`${pg(name)} .chart-sankey-link`).count(), 0, "no bands")
    eq(await surface(name).evaluate((el) => document.getElementById(el.getAttribute("aria-describedby")).textContent), "Flow diagram with nothing to draw.", "summary")
    eq(pageErrors, [], "no page errors")
  })

  await test("sankey: every band has an edge on both sides in a colour that holds 3:1, and emphasis does not fade it", async () => {
    const name = "sankey-default"
    const { layout } = await expected(name)
    eq(await page.locator(`${pg(name)} .chart-sankey-edge`).count(), 7, "one edge path per band")
    for (const l of layout.links) {
      const edge = page.locator(`${pg(name)} .chart-sankey-edge[data-index="${l.index}"]`)
      const h = l.width / 2
      const mid = (l.x0 + l.x1) / 2
      eq(
        await edge.getAttribute("d"),
        [-h, h].map((o) => `M ${l.x0} ${l.y0 + o} C ${mid} ${l.y0 + o} ${mid} ${l.y1 + o} ${l.x1} ${l.y1 + o}`).join(" "),
        `band ${l.index} edge runs along both sides of the band`,
      )
      eq(await edge.evaluate((el) => getComputedStyle(el).stroke), await link(name, l.index).evaluate((el) => getComputedStyle(el).stroke), `band ${l.index} edge is the band's colour at full strength`)
    }
    await hoverNode(name, 0)
    await page.waitForFunction((sel) => Number(getComputedStyle(document.querySelector(sel)).strokeOpacity) < 0.2, `${pg(name)} .chart-sankey-link[data-index="1"]`)
    eq(await page.locator(`${pg(name)} .chart-sankey-edge[data-index="1"]`).evaluate((el) => getComputedStyle(el).strokeOpacity), "1", "a faded band keeps its edge")
    await page.mouse.move(0, 0)
  })

  await test("forced-colors: nodes paint in the text colour and emphasised bands in Highlight", async () => {
    const name = "sankey-default"
    const paint = (selector, prop) => page.locator(`${pg(name)} ${selector}`).first().evaluate((el, prop) => getComputedStyle(el)[prop], prop)
    const sys = (color, prop) =>
      page.locator(`${pg(name)} .chart-sankey-node`).first().evaluate((el, [color, prop]) => {
        const probe = document.createElementNS("http://www.w3.org/2000/svg", "rect")
        probe.style[prop] = color
        el.parentNode.appendChild(probe)
        const c = getComputedStyle(probe)[prop]
        probe.remove()
        return c
      }, [color, prop])
    const before = await paint(".chart-sankey-node", "fill")
    eq(before === (await sys("CanvasText", "fill")), false, "precondition: outside forced colours nodes use the palette")
    await page.emulateMedia({ forcedColors: "active" })
    try {
      eq(await paint(".chart-sankey-node", "fill"), await sys("CanvasText", "fill"), "node fill is CanvasText")
      eq(await paint(".chart-sankey-link", "stroke"), await sys("CanvasText", "stroke"), "band stroke is CanvasText")
      await hoverNode(name, 0)
      await page.waitForSelector(`${pg(name)} .chart-sankey-link[data-active]`)
      eq(await page.locator(`${pg(name)} .chart-sankey-link[data-active]`).evaluate((el) => getComputedStyle(el).stroke), await sys("Highlight", "stroke"), "an emphasised band strokes in Highlight")
      eq(await node(name, 0).evaluate((el) => getComputedStyle(el).stroke), await sys("Highlight", "stroke"), "the current node is edged in Highlight")
      eq(await page.locator(`${pg(name)} .chart-sankey-edge[data-active]`).evaluate((el) => getComputedStyle(el).stroke), await sys("Highlight", "stroke"), "an emphasised band's edge is Highlight")
      eq(await page.locator(`${pg(name)} .chart-sankey-edge:not([data-active])`).first().evaluate((el) => getComputedStyle(el).stroke), await sys("CanvasText", "stroke"), "the others are CanvasText")
    } finally {
      await page.emulateMedia({ forcedColors: null })
      await page.mouse.move(0, 0)
    }
  })
}
