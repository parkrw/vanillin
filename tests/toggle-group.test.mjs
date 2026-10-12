export default async function run({ page, baseUrl, test, eq }) {
  await page.goto(`${baseUrl}/#toggle-group`)
  await page.waitForSelector(".toggle-group")

  const single = page.locator('[aria-label="Text alignment"]')
  const multiple = page.locator('[aria-label="Text formatting"]')

  await test("group role and item states", async () => {
    eq(await single.getAttribute("role"), "group")
    const left = single.locator('button[aria-label="Align left"]')
    eq(await left.getAttribute("aria-pressed"), "true")
    eq(await left.getAttribute("data-state"), "on")
    eq(await single.locator('button[aria-label="Align center"]').getAttribute("data-state"), "off")
  })

  await test("single: selecting one deselects the other", async () => {
    await single.locator('button[aria-label="Align center"]').click()
    eq(await single.locator('button[aria-label="Align center"]').getAttribute("data-state"), "on")
    eq(await single.locator('button[aria-label="Align left"]').getAttribute("data-state"), "off")
    eq(await single.locator('button[data-state="on"]').count(), 1)
  })

  await test("single: clicking the active item deselects it", async () => {
    await single.locator('button[aria-label="Align center"]').click()
    eq(await single.locator('button[data-state="on"]').count(), 0)
    await single.locator('button[aria-label="Align left"]').click()
  })

  await test("multiple: several items stay on", async () => {
    await multiple.locator('button[aria-label="Toggle italic"]').click()
    eq(await multiple.locator('button[data-state="on"]').count(), 2, "bold + italic")
    await multiple.locator('button[aria-label="Toggle bold"]').click()
    eq(await multiple.locator('button[data-state="on"]').count(), 1, "italic only")
  })

  await test("arrow keys rove focus within the group", async () => {
    await single.locator('button[aria-label="Align left"]').focus()
    await page.keyboard.press("ArrowRight")
    eq(await page.evaluate(() => document.activeElement.getAttribute("aria-label")), "Align center")
    eq(await page.evaluate(() => document.activeElement.tabIndex), 0)
    eq(await single.locator('button[aria-label="Align left"]').evaluate((el) => el.tabIndex), -1)
    await page.keyboard.press("End")
    eq(await page.evaluate(() => document.activeElement.getAttribute("aria-label")), "Align right")
  })

  const focusCenterFromKeyboard = async () => {
    await single.locator('button[aria-label="Align left"]').focus()
    await page.keyboard.press("ArrowRight")
    eq(await page.evaluate(() => document.activeElement.matches('[aria-label="Align center"]:focus-visible')), true, "Align center focused from the keyboard")
  }

  await test("a focused item's ring paints over the next item", async () => {
    const right = single.locator('button[aria-label="Align right"]')
    await right.click()
    await page.mouse.move(0, 0)
    try {
      await focusCenterFromKeyboard()
      await page.waitForFunction(() => !document.getAnimations().some((a) => a instanceof CSSTransition))
      await single.scrollIntoViewIfNeeded()
      const box = await right.evaluate((el) => {
        const r = el.getBoundingClientRect()
        return { x: r.left, y: r.top, height: r.height }
      })
      const png = (await page.screenshot()).toString("base64")
      // The pressed item's --accent fill would cover the ring if the focused
      // item were not raised above it.
      const departure = await page.evaluate(
        async ({ png, box }) => {
          const img = new Image()
          img.src = `data:image/png;base64,${png}`
          await img.decode()
          const canvas = document.createElement("canvas")
          canvas.width = img.width
          canvas.height = img.height
          const ctx = canvas.getContext("2d")
          ctx.drawImage(img, 0, 0)
          const scale = img.width / window.innerWidth
          const y = Math.round((box.y + box.height / 2) * scale)
          const at = (x) => ctx.getImageData(Math.round(x * scale), y, 1, 1).data
          const fill = at(box.x + 8)
          const ring = at(box.x + 1)
          return Math.max(...[0, 1, 2].map((c) => Math.abs(ring[c] - fill[c])))
        },
        { png, box },
      )
      eq(departure > 40, true, `ring departs from the pressed fill, got ${departure}`)
    } finally {
      await single.locator('button[aria-label="Align left"]').click()
    }
  })

  await test("a focused item stays under a layer at the same z-index outside the group", async () => {
    await focusCenterFromKeyboard()
    await single.scrollIntoViewIfNeeded()
    const hits = await single.evaluate((group) => {
      const r = group.getBoundingClientRect()
      const layer = document.createElement("div")
      layer.id = "toggle-group-layer"
      Object.assign(layer.style, {
        position: "fixed",
        left: `${r.left}px`,
        top: `${r.top}px`,
        width: `${r.width}px`,
        height: `${r.height}px`,
        zIndex: "1",
      })
      group.before(layer)
      const at = (item) => {
        const b = item.getBoundingClientRect()
        const hit = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2)
        return hit?.id || hit?.closest("button")?.getAttribute("aria-label") || null
      }
      const [left, center] = group.querySelectorAll("button")
      const result = { left: at(left), center: at(center) }
      layer.remove()
      return result
    })
    eq(hits.left, "toggle-group-layer", "layer covers an unfocused item")
    eq(hits.center, "toggle-group-layer", "layer covers the focused item too")
  })

  await test("items reuse toggle styling", async () => {
    const item = single.locator('button[aria-label="Align left"]')
    eq(await item.evaluate((el) => el.classList.contains("toggle")), true)
    eq(await item.evaluate((el) => el.classList.contains("toggle-group-item")), true)
  })

  await test("disabled group disables items", async () => {
    const disabled = page.locator('[aria-label="Disabled group"] button').first()
    eq(await disabled.isDisabled(), true)
  })
}
