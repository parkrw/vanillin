export default async function run({ page, baseUrl, repoRoot, test, eq, near }) {
  await page.goto(`${baseUrl}/#slider`)
  await page.waitForSelector(".slider")

  const thumb = (label) => page.locator(`.slider[aria-label="${label}"] .slider-thumb`)
  const now = async (loc) => Number(await loc.getAttribute("aria-valuenow"))
  const clickAt = async (label, ratioX, ratioY = 0.5) => {
    const box = await page.locator(`.slider[aria-label="${label}"]`).boundingBox()
    await page.mouse.click(box.x + box.width * ratioX, box.y + box.height * ratioY)
  }

  await test("thumb aria", async () => {
    const t = thumb("Default")
    eq(await t.getAttribute("role"), "slider")
    eq(await t.getAttribute("aria-valuemin"), "0")
    eq(await t.getAttribute("aria-valuemax"), "100")
    eq(await t.getAttribute("aria-valuenow"), "33")
    eq(await t.getAttribute("aria-orientation"), "horizontal")
    eq(await t.getAttribute("tabindex"), "0")
  })

  await test("arrow keys", async () => {
    const t = thumb("Default")
    await t.focus()
    await page.keyboard.press("ArrowRight")
    eq(await now(t), 34, "ArrowRight")
    await page.keyboard.press("ArrowUp")
    eq(await now(t), 35, "ArrowUp")
    await page.keyboard.press("ArrowLeft")
    await page.keyboard.press("ArrowDown")
    eq(await now(t), 33, "ArrowLeft+ArrowDown")
  })

  await test("Shift+Arrow = 10 steps, PageUp/PageDown", async () => {
    const t = thumb("Default")
    await t.focus()
    await page.keyboard.press("Shift+ArrowRight")
    eq(await now(t), 43, "Shift+ArrowRight")
    await page.keyboard.press("PageDown")
    eq(await now(t), 33, "PageDown")
  })

  await test("Home/End clamp to min/max", async () => {
    const t = thumb("Default")
    await t.focus()
    await page.keyboard.press("End")
    eq(await now(t), 100, "End")
    await page.keyboard.press("ArrowRight")
    eq(await now(t), 100, "clamped at max")
    await page.keyboard.press("Home")
    eq(await now(t), 0, "Home")
    await page.keyboard.press("ArrowLeft")
    eq(await now(t), 0, "clamped at min")
  })

  await test("pointer click jumps nearest thumb", async () => {
    await clickAt("Default", 0.8)
    near(await now(thumb("Default")), 80, 2)
  })

  await test("pointer drag updates continuously", async () => {
    const box = await page.locator('.slider[aria-label="Default"]').boundingBox()
    const y = box.y + box.height / 2
    await page.mouse.move(box.x + box.width * 0.8, y)
    await page.mouse.down()
    await page.mouse.move(box.x + box.width * 0.3, y, { steps: 5 })
    const during = await now(thumb("Default"))
    await page.mouse.up()
    near(during, 30, 2, "mid-drag value")
  })

  await test("range thumbs clamp at each other", async () => {
    const thumbs = page.locator('.slider[aria-label="Range"] .slider-thumb')
    await thumbs.nth(1).focus()
    await page.keyboard.press("Home")
    eq(await now(thumbs.nth(1)), 25, "upper clamped to lower")
    await thumbs.nth(0).focus()
    await page.keyboard.press("End")
    eq(await now(thumbs.nth(0)), 25, "lower clamped to upper")
  })

  await test("range drag picks nearest thumb", async () => {
    await page.reload()
    await page.waitForSelector(".slider")
    await clickAt("Range", 0.9)
    const thumbs = page.locator('.slider[aria-label="Range"] .slider-thumb')
    eq(await now(thumbs.nth(0)), 25, "lower unchanged")
    near(await now(thumbs.nth(1)), 90, 2, "upper follows click")
  })

  await test("controlled demo updates output", async () => {
    await thumb("Volume").focus()
    await page.keyboard.press("ArrowRight")
    const text = await page
      .locator(".pg-section", { hasText: "Controlled" })
      .locator("span")
      .last()
      .textContent()
    eq(text, "51")
  })

  await test("onValueCommit fires on pointerup and keydown", async () => {
    await page.evaluate(async (sliderUrl) => {
      const reactModule = await import("/@id/react")
      const createElement = reactModule.createElement ?? reactModule.default.createElement
      const domModule = await import("/@id/react-dom/client")
      const createRoot = domModule.createRoot ?? domModule.default.createRoot
      const { Slider } = await import(sliderUrl)
      const host = document.createElement("div")
      host.style.width = "200px"
      document.body.appendChild(host)
      window.__commitLog = []
      createRoot(host).render(
        createElement(Slider, {
          defaultValue: [50],
          "aria-label": "commit-probe",
          onValueCommit: (v) => window.__commitLog.push(v),
        }),
      )
      await new Promise((resolve) => setTimeout(resolve, 50))
    }, `/@fs/${repoRoot.replace(/^\//, "")}ui/slider/slider.jsx`)
    await thumb("commit-probe").focus()
    await page.keyboard.press("ArrowRight")
    await clickAt("commit-probe", 0.25)
    const log = await page.evaluate(() => window.__commitLog)
    eq(log.length, 2, "commit count")
    eq(log[0][0], 51, "keyboard commit value")
  })

  await test("step snapping", async () => {
    await clickAt("Step 10", 0.44)
    const value = await now(thumb("Step 10"))
    eq(value % 10, 0, "multiple of step")
  })

  await test("disabled ignores pointer and keys", async () => {
    eq(await page.locator('.slider[aria-label="Disabled"]').getAttribute("data-disabled"), "")
    eq(await thumb("Disabled").getAttribute("tabindex"), null, "not tabbable")
    await clickAt("Disabled", 0.1)
    eq(await now(thumb("Disabled")), 60, "value unchanged")
  })

  await test("vertical orientation + keys", async () => {
    const t = thumb("Vertical")
    await t.focus()
    await page.keyboard.press("ArrowUp")
    eq(await now(t), 31, "ArrowUp increments")
    await page.keyboard.press("ArrowDown")
    eq(await now(t), 30, "ArrowDown decrements")
    await clickAt("Vertical", 0.5, 0.2)
    near(await now(t), 80, 3, "click near top")
  })

  await test("thumb position stays in track bounds", async () => {
    const t = thumb("Default")
    await t.focus()
    await page.keyboard.press("Home")
    const rootBox = await page.locator('.slider[aria-label="Default"]').boundingBox()
    let tb = await t.boundingBox()
    if (tb.x < rootBox.x - 0.5) throw new Error(`thumb overflows left: ${tb.x} < ${rootBox.x}`)
    await page.keyboard.press("End")
    tb = await t.boundingBox()
    if (tb.x + tb.width > rootBox.x + rootBox.width + 0.5)
      throw new Error("thumb overflows right")
  })
}
