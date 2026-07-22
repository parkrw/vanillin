export default async function run({ page, baseUrl, test, eq, near }) {
  await page.goto(`${baseUrl}/#direction`)
  await page.waitForSelector('[dir="rtl"] .slider', { timeout: 5000 })

  const thumb = page.locator('[dir="rtl"] .slider[aria-label="RTL"] .slider-thumb')
  const now = async () => Number(await thumb.getAttribute("aria-valuenow"))

  await test("DirectionProvider sets dir=rtl on wrapper", async () => {
    eq(await page.locator('[dir="rtl"]').first().getAttribute("dir"), "rtl")
  })

  await test("arrow keys invert under RTL", async () => {
    await thumb.focus()
    eq(await now(), 30, "initial")
    await page.keyboard.press("ArrowRight")
    eq(await now(), 29, "ArrowRight decrements")
    await page.keyboard.press("ArrowLeft")
    eq(await now(), 30, "ArrowLeft increments")
  })

  await test("pointer maps mirrored under RTL", async () => {
    const box = await page.locator('.slider[aria-label="RTL"]').boundingBox()
    await page.mouse.click(box.x + box.width * 0.1, box.y + box.height / 2)
    near(await now(), 90, 2, "click near left edge → high value")
  })

  await test("thumb renders mirrored (value 90 sits near left edge)", async () => {
    const rootBox = await page.locator('.slider[aria-label="RTL"]').boundingBox()
    const thumbBox = await thumb.boundingBox()
    const ratio = (thumbBox.x + thumbBox.width / 2 - rootBox.x) / rootBox.width
    near(ratio, 0.1, 0.05, "thumb near inline-start (right in LTR terms)")
  })
}
