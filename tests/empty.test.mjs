export default async function run({ page, baseUrl, test, eq, near }) {
  await page.goto(`${baseUrl}/#empty`)
  await page.waitForSelector(".empty")

  const frame = page.locator('[data-pg="empty-frame"]')
  const empty = page.locator('[data-pg="empty-default"]')
  const heading = page.locator(".pg-section > h3").first()

  const box = (locator) => locator.boundingBox()

  // A frame with `border-width: 0` still reports its left edge on the page
  // grid, so alignment alone cannot tell a real container from no container —
  // the defect this covers (D8) had every box already aligned. Sample the
  // painted pixels across the left edge instead.
  const paintedEdge = async () => {
    const rect = await box(frame)
    const png = (await page.screenshot()).toString("base64")
    return page.evaluate(
      async ({ png, rect }) => {
        const img = new Image()
        img.src = `data:image/png;base64,${png}`
        await img.decode()
        const canvas = document.createElement("canvas")
        canvas.width = img.width
        canvas.height = img.height
        const ctx = canvas.getContext("2d")
        ctx.drawImage(img, 0, 0)
        const scale = img.width / window.innerWidth
        const at = (x, y) => ctx.getImageData(Math.round(x * scale), Math.round(y * scale), 1, 1).data
        // The border is dashed: a single sample can land in a gap, so walk the
        // whole edge and keep the strongest departure from the interior.
        let strongest = 0
        for (let y = rect.y + 4; y < rect.y + rect.height - 4; y += 2) {
          const background = at(rect.x + 8, y)
          for (let step = -1; step <= 2; step++) {
            const pixel = at(rect.x + step, y)
            for (const channel of [0, 1, 2])
              strongest = Math.max(strongest, Math.abs(pixel[channel] - background[channel]))
          }
        }
        return strongest
      },
      { png, rect },
    )
  }

  await test("demo frame paints a boundary on the page grid", async () => {
    const frameBox = await box(frame)
    const headingBox = await box(heading)
    near(frameBox.x, headingBox.x, 1, "frame starts where the section heading does")
    eq((await paintedEdge()) > 10, true, "frame's left edge is painted, not a zero-width border")
  })

  await test("empty fills the frame and centres its content within it", async () => {
    const frameBox = await box(frame)
    const emptyBox = await box(empty)
    const titleBox = await box(empty.locator(".empty-title"))
    near(emptyBox.width, frameBox.width - 2, 2, "empty spans the frame's content box")
    near(
      titleBox.x + titleBox.width / 2,
      frameBox.x + frameBox.width / 2,
      2,
      "title is centred in the frame",
    )
  })

  await test("every empty demo is framed", async () => {
    const frames = await page.locator(".pg-empty-frame").count()
    eq(frames, await page.locator(".empty").count(), "one frame per empty demo")
  })

  await test("icon variant renders its media as a filled circle", async () => {
    const media = page.locator(".empty-media--icon").first()
    const styles = await media.evaluate((el) => {
      const cs = getComputedStyle(el)
      return { radius: cs.borderRadius, background: cs.backgroundColor }
    })
    eq(styles.radius, "50%")
    eq(styles.background !== "rgba(0, 0, 0, 0)", true, "icon media has a background")
  })
}
