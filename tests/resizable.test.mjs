export default async function run({ page, baseUrl, test, eq, near }) {
  await page.goto(`${baseUrl}/#resizable`)
  await page.mouse.move(0, 0)

  // Wait for lazy-loaded page — panels mount after layout init.
  await page.locator('[data-pg="r-horizontal"] [data-panel]').first().waitFor()

  const handle = (pg) =>
    page.locator(`[data-pg="${pg}"] [role="separator"]`).first()
  const panel = (pg, id) => page.locator(`[data-pg="${pg}"] #${id}`)

  /** Measure a panel's rendered size on the relevant axis. */
  const panelDim = async (pg, id, axis = "width") => {
    const box = await panel(pg, id).boundingBox()
    return axis === "width" ? box.width : box.height
  }

  /**
   * Hash navigations are same-document: the component state persists on a
   * same-URL goto (calendar gotcha). To get a full remount, change to a
   * different route and wait for the old component to unmount, then navigate
   * back and wait for the target element.
   */
  const resetPage = async () => {
    await page.evaluate(() => { window.location.hash = "#primitives" })
    // Wait for unmount — the resizable panels should no longer be in the DOM.
    await page.locator('[data-pg="r-horizontal"]').waitFor({ state: "detached" })
    await page.evaluate(() => { window.location.hash = "#resizable" })
    await page.locator('[data-pg="r-horizontal"] [data-panel]').first().waitFor()
    await page.mouse.move(0, 0)
  }

  // ——— Drag resizes adjacent panels ———

  await test("drag resizes adjacent panels and respects min/max clamps", async () => {
    const h = handle("r-horizontal")
    const box = await h.boundingBox()
    const startX = box.x + box.width / 2
    const startY = box.y + box.height / 2

    const beforeOne = await panelDim("r-horizontal", "h-one")
    const beforeTwo = await panelDim("r-horizontal", "h-two")

    // Drag handle 60px to the right
    await page.mouse.move(startX, startY)
    await page.mouse.down()
    await page.mouse.move(startX + 60, startY, { steps: 5 })
    await page.mouse.up()

    const afterOne = await panelDim("r-horizontal", "h-one")
    const afterTwo = await panelDim("r-horizontal", "h-two")

    eq(afterOne > beforeOne, true, `panel one grew (${afterOne} > ${beforeOne})`)
    eq(afterTwo < beforeTwo, true, `panel two shrank (${afterTwo} < ${beforeTwo})`)
    near(afterOne - beforeOne, beforeTwo - afterTwo, 2, "sum preserved")

    // Drag far beyond max — should clamp (minSize=20 on both panels)
    await page.mouse.move(startX + 60, startY)
    await page.mouse.down()
    await page.mouse.move(startX + 5000, startY, { steps: 3 })
    await page.mouse.up()

    const clampedTwo = await panelDim("r-horizontal", "h-two")
    eq(clampedTwo > 0, true, `panel two didn't vanish (got ${clampedTwo}px)`)
  })

  // ——— Keyboard arrows ———

  await test("keyboard arrows on focused handle resize by the step", async () => {
    await resetPage()

    const h = handle("r-horizontal")
    await h.focus()

    // Verify clean state
    const start = Number(await h.getAttribute("aria-valuenow"))
    eq(start, 50, "starts at default 50 after reset")

    await page.keyboard.press("ArrowRight")
    const after = Number(await h.getAttribute("aria-valuenow"))
    eq(after, 55, "ArrowRight adds 5")

    await page.keyboard.press("ArrowLeft")
    const restored = Number(await h.getAttribute("aria-valuenow"))
    eq(restored, 50, "ArrowLeft reverses it")

    // ArrowUp/Down are no-ops for horizontal
    await page.keyboard.press("ArrowUp")
    const unchanged = Number(await h.getAttribute("aria-valuenow"))
    eq(unchanged, 50, "ArrowUp is a no-op for horizontal")
  })

  // ——— ARIA attributes ———

  await test("aria attributes: role, orientation, valuenow, controls", async () => {
    await resetPage()

    const h = handle("r-horizontal")
    eq(await h.getAttribute("role"), "separator", "role=separator")
    eq(
      await h.getAttribute("aria-orientation"),
      "vertical",
      "horizontal group -> vertical separator"
    )
    eq(
      await h.getAttribute("aria-controls"),
      "h-one",
      "controls the primary (preceding) panel"
    )

    const now = Number(await h.getAttribute("aria-valuenow"))
    const min = Number(await h.getAttribute("aria-valuemin"))
    const max = Number(await h.getAttribute("aria-valuemax"))
    eq(now >= min && now <= max, true, `valuenow ${now} is within [${min}, ${max}]`)
    eq(min, 20, "valuemin matches minSize")
    eq(max, 80, "valuemax = 100 - other panel's minSize")
  })

  await test("aria-valuenow updates after keyboard resize", async () => {
    // Use the vertical demo (untouched by earlier tests)
    const h = handle("r-vertical")
    await h.focus()

    const before = Number(await h.getAttribute("aria-valuenow"))
    await page.keyboard.press("ArrowDown")
    await page.keyboard.press("ArrowDown")
    const after = Number(await h.getAttribute("aria-valuenow"))
    eq(after, before + 10, "two ArrowDown presses add 10")

    // Undo for later tests
    await page.keyboard.press("ArrowUp")
    await page.keyboard.press("ArrowUp")
  })

  // ——— Home / End ———

  await test("Home/End move handle to limits", async () => {
    await resetPage()

    const h = handle("r-horizontal")
    await h.focus()

    await page.keyboard.press("End")
    const max = Number(await h.getAttribute("aria-valuenow"))
    eq(max, Number(await h.getAttribute("aria-valuemax")), "End -> max")

    await page.keyboard.press("Home")
    const min = Number(await h.getAttribute("aria-valuenow"))
    eq(min, Number(await h.getAttribute("aria-valuemin")), "Home -> min")
  })

  // ——— Collapsible + Enter ———

  await test("Enter toggles collapse on a collapsible panel", async () => {
    const h = handle("r-collapsible")
    await h.focus()

    const before = Number(await h.getAttribute("aria-valuenow"))
    eq(before, 30, "starts at defaultSize 30")

    // Collapse
    await page.keyboard.press("Enter")
    const collapsed = Number(await h.getAttribute("aria-valuenow"))
    eq(collapsed, 0, "collapsed to 0")
    eq(
      await panel("r-collapsible", "c-sidebar").getAttribute("data-state"),
      "collapsed",
      "data-state=collapsed"
    )

    // Expand back
    await page.keyboard.press("Enter")
    const expanded = Number(await h.getAttribute("aria-valuenow"))
    eq(expanded, 30, "restored to saved size")
    eq(
      await panel("r-collapsible", "c-sidebar").getAttribute("data-state"),
      "expanded",
      "data-state=expanded"
    )
  })

  // ——— data-separator states ———

  await test("data-separator reflects interaction state", async () => {
    await resetPage()

    const h = handle("r-horizontal")
    eq(await h.getAttribute("data-separator"), "inactive", "starts inactive")

    // Hover
    const box = await h.boundingBox()
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
    eq(await h.getAttribute("data-separator"), "hover", "hover state")

    // Drag
    await page.mouse.down()
    eq(await h.getAttribute("data-separator"), "active", "active during drag")
    await page.mouse.up()

    // Focus
    await page.mouse.move(0, 0)
    await h.focus()
    eq(await h.getAttribute("data-separator"), "focus", "focus state")
    await h.blur()
  })

  // ——— Vertical direction ———

  await test("vertical direction: ArrowDown/Up resize, ArrowLeft/Right are no-ops", async () => {
    await resetPage()
    const h = handle("r-vertical")
    await h.focus()

    eq(
      await h.getAttribute("aria-orientation"),
      "horizontal",
      "vertical group -> horizontal separator"
    )

    const before = Number(await h.getAttribute("aria-valuenow"))
    await page.keyboard.press("ArrowDown")
    const after = Number(await h.getAttribute("aria-valuenow"))
    eq(after, before + 5, "ArrowDown adds 5 in vertical")

    await page.keyboard.press("ArrowUp")
    eq(
      Number(await h.getAttribute("aria-valuenow")),
      before,
      "ArrowUp reverses it"
    )

    await page.keyboard.press("ArrowLeft")
    eq(
      Number(await h.getAttribute("aria-valuenow")),
      before,
      "ArrowLeft is a no-op for vertical"
    )
  })

  await test("vertical drag resizes panels", async () => {
    await resetPage()
    const h = handle("r-vertical")
    const box = await h.boundingBox()
    const cx = box.x + box.width / 2
    const cy = box.y + box.height / 2

    const beforeTop = await panelDim("r-vertical", "v-top", "height")

    await page.mouse.move(cx, cy)
    await page.mouse.down()
    await page.mouse.move(cx, cy + 40, { steps: 5 })
    await page.mouse.up()

    const afterTop = await panelDim("r-vertical", "v-top", "height")
    eq(afterTop > beforeTop, true, `top panel grew (${afterTop} > ${beforeTop})`)
  })

  // ——— Nested groups don't cross-talk ———

  await test("nested groups: inner drag doesn't affect outer panels", async () => {
    await resetPage()

    // Wait for the inner handle to be ready
    const innerHandle = page.locator(
      '[data-pg="r-nested"] #n-bottom [role="separator"]'
    )
    await innerHandle.waitFor()

    const outerTopBefore = await panelDim("r-nested", "n-top", "height")
    const innerLeftBefore = await panelDim("r-nested", "n-left")

    // Use keyboard on the inner handle — more reliable than drag for
    // verifying the isolation (avoids narrow-handle targeting).
    await innerHandle.focus()
    await page.keyboard.press("ArrowRight")
    await page.keyboard.press("ArrowRight")

    const innerLeftAfter = await panelDim("r-nested", "n-left")
    const outerTopAfter = await panelDim("r-nested", "n-top", "height")

    eq(
      innerLeftAfter > innerLeftBefore,
      true,
      `inner left panel grew (${innerLeftAfter} > ${innerLeftBefore})`
    )
    near(outerTopAfter, outerTopBefore, 1, "outer top panel unchanged")
  })

  // ——— withHandle renders grip icon ———

  await test("withHandle renders a grip icon element", async () => {
    const icon = page.locator('[data-pg="r-handle"] .resizable-handle-icon')
    eq(await icon.count(), 1, "grip icon present")
    const svg = page.locator('[data-pg="r-handle"] .resizable-handle-icon svg')
    eq(await svg.count(), 1, "svg inside the icon")
  })
}
