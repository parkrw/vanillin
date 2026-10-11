export default async function run({ page, baseUrl, test, eq }) {
  await page.goto(`${baseUrl}/#meter`)
  await page.waitForSelector(".meter")

  const attrs = (selector) =>
    page.locator(selector).first().evaluate((el) => ({
      role: el.getAttribute("role"),
      min: el.getAttribute("aria-valuemin"),
      max: el.getAttribute("aria-valuemax"),
      now: el.getAttribute("aria-valuenow"),
      text: el.getAttribute("aria-valuetext"),
    }))
  const fill = (selector) =>
    page.locator(`${selector} .meter-indicator`).first().evaluate((el) => ({
      width: el.getBoundingClientRect().width,
      track: el.parentElement.getBoundingClientRect().width,
      bg: getComputedStyle(el).backgroundColor,
    }))

  await test("role and aria values", async () => {
    eq(JSON.stringify(await attrs('.meter[aria-label="Storage used"]')), JSON.stringify({
      role: "meter", min: "0", max: "50", now: "41", text: "82%",
    }))
  })

  await test("valuetext: a caller string where given, the percentage otherwise", async () => {
    eq((await attrs('.meter[aria-label="Coolant"]')).text, "68 °C")
    eq((await attrs('.meter[aria-label="Past the end"]')).text, "100%")
  })

  await test("a caller's aria-valuetext replaces the default", async () => {
    eq((await attrs('[data-pg="meter-readout"] .meter')).text, "41 of 50 GB")
    eq((await attrs('.meter[aria-label="Storage used"]')).text !== "41 of 50 GB", true)
  })

  await test("a value outside the range rests on the end", async () => {
    const a = await attrs('.meter[aria-label="Past the end"]')
    eq(a.now, "100")
    const f = await fill('.meter[aria-label="Past the end"]')
    eq(Math.abs(f.width - f.track) < 1, true, `${f.width} of ${f.track}`)
  })

  await test("a value below the range rests on the minimum, and a max below the min is raised to it", async () => {
    eq((await attrs('.meter[aria-label="Below the start"]')).now, "0")
    eq((await fill('.meter[aria-label="Below the start"]')).width, 0)
    const swapped = await attrs('.meter[aria-label="Max below min"]')
    eq(JSON.stringify([swapped.min, swapped.max, swapped.now]), JSON.stringify(["10", "10", "10"]))
  })

  await test("fill width follows the value over a range that starts above zero", async () => {
    const f = await fill('.meter[aria-label="Coolant"]')
    eq(Math.abs(f.width / f.track - 0.56) < 0.01, true, `${f.width / f.track}`)
  })

  const readoutTones = () =>
    page.locator('[data-pg="meter-thresholds"] .meter').evaluateAll((els) =>
      els.map((el) => ({ cls: [...el.classList].filter((c) => c.startsWith("meter--")), region: el.dataset.region })))

  await test("tone and region come from low, high and optimum", async () => {
    eq(JSON.stringify(await readoutTones()), JSON.stringify([
      { cls: ["meter--success"], region: "low" },
      { cls: ["meter--warning"], region: "middle" },
      { cls: ["meter--error"], region: "high" },
    ]))
  })

  await test("tone at the thresholds: the edge beside the optimum is the optimum's part, the far edge the middle; an unset optimum is the range midpoint", async () => {
    const tones = await page.locator('[data-pg="meter-edges"] .meter').evaluateAll((els) =>
      Object.fromEntries(els.map((el) => [el.getAttribute("aria-label"), el.className.match(/meter--(\w+)/)?.[1] ?? null]).sort(([a], [b]) => a.localeCompare(b))))
    const sorted = (o) => Object.fromEntries(Object.entries(o).sort(([a], [b]) => a.localeCompare(b)))
    eq(JSON.stringify(tones), JSON.stringify(sorted({
      "74.9, optimum 0": "success", "75, optimum 0": "success", "75.1, optimum 0": "warning",
      "90, optimum 0": "warning", "90.1, optimum 0": "error", "90, optimum 100": "success",
      "50, optimum 100": "error", "95, optimum 100": "success", "80, optimum unset": "warning",
      "95, tone success": "success", "95, no thresholds": null,
      "24 within 25-75": "warning", "25 within 25-75": "success", "75 within 25-75": "success",
      "76 within 25-75": "warning", "90 within 25-75": "warning", "thresholds past max, 80": "success", "low past max, 80": "warning", "optimum below min, 20": "success", "swapped low 90 high 75, 80": "error", "optimum alone, 60": "success",
    })))
  })

  await test("a missing value rests on the minimum, an empty range reads empty, data-region only with low or high", async () => {
    const read = (label) =>
      page.locator(`.meter[aria-label="${label}"]`).evaluate((el) => ({
        now: el.getAttribute("aria-valuenow"),
        text: el.getAttribute("aria-valuetext"),
        width: el.firstElementChild.getBoundingClientRect().width,
        region: el.dataset.region ?? null,
      }))
    const none = await read("No reading")
    eq(none.now, "0")
    eq(none.width, 0)
    const empty = await read("Empty range")
    eq(empty.text, "0%")
    eq(empty.width, 0)
    eq((await read("95, no thresholds")).region, null)
    eq((await read("optimum alone, 60")).region, null)
    eq((await read("75, optimum 0")).region, "low")
  })

  await test("tones paint different fills, and an untoned bar differs from them", async () => {
    const [ok, warn, bad, plain] = await Promise.all(
      ["success", "warning", "error"].map((t) => fill(`[data-pg="meter-tone"] .meter--${t}`)).concat(
        fill('[data-pg="meter-tone"] .meter[aria-label="No tone"]')),
    )
    eq(new Set([ok.bg, warn.bg, bad.bg, plain.bg]).size, 4)
  })

  await test("forced colours: track opts out of adjustment, has an edge, and the width still shows the level", async () => {
    const normal = await page.locator(".meter").first().evaluate((el) => getComputedStyle(el).forcedColorAdjust)
    eq(normal === "none", false, "precondition: not opted out without forced colours")
    await page.emulateMedia({ forcedColors: "active" })
    try {
      const r = await page.locator('.meter[aria-label="Storage used"]').evaluate((el) => {
        const s = getComputedStyle(el)
        const i = el.firstElementChild.getBoundingClientRect()
        const swatch = document.createElement("span")
        swatch.style.backgroundColor = "Highlight"
        document.body.append(swatch)
        const highlight = getComputedStyle(swatch).backgroundColor
        swatch.remove()
        return {
          adjust: s.forcedColorAdjust, border: s.borderStyle, ratio: i.width / el.getBoundingClientRect().width,
          fill: getComputedStyle(el.firstElementChild).backgroundColor, highlight, track: s.backgroundColor,
        }
      })
      eq(r.fill, r.highlight)
      eq(r.fill !== r.track, true, "fill is told apart from the track")
      eq(r.adjust, "none")
      eq(r.border !== "none", true)
      eq(r.ratio > 0.7 && r.ratio < 0.9, true, `${r.ratio}`)
    } finally {
      await page.emulateMedia({ forcedColors: "none" })
    }
  })

  await test("the fill starts at the right in right-to-left text", async () => {
    const r = await page.locator('[data-pg="meter-rtl"] .meter').evaluate((el) => {
      const t = el.getBoundingClientRect()
      const i = el.firstElementChild.getBoundingClientRect()
      return { rightGap: Math.abs(t.right - i.right), leftGap: i.left - t.left }
    })
    eq(r.rightGap < 3, true, `${r.rightGap}`)
    eq(r.leftGap > 10, true, `${r.leftGap}`)
  })

  await test("every meter on the page has a name that resolves", async () => {
    const unnamed = await page.locator(".meter").evaluateAll((els) =>
      els.filter((el) => {
        const ids = (el.getAttribute("aria-labelledby") ?? "").split(/\s+/).filter(Boolean)
        const named = ids.length > 0 && ids.every((id) => document.getElementById(id)?.textContent)
        return !named && !el.getAttribute("aria-label")
      }).length)
    eq(unnamed, 0)
  })

  await test("no progressbar role on the page", async () => {
    eq(await page.locator('[role="progressbar"]').count(), 0)
    eq(await page.locator('[role="meter"]').count() > 0, true)
  })
}
