export default async function run({ page, baseUrl, test, eq, near }) {
  await page.goto(`${baseUrl}/#carousel`)

  // Lazy-loaded page — wait for the carousel to mount
  await page.locator('[data-pg="c-basic"] .carousel-content').waitFor()
  // Park mouse so hover state from previous test files doesn't interfere
  await page.mouse.move(0, 0)

  const el = (pg, sel = "") => page.locator(`[data-pg="${pg}"] ${sel}`.trim())

  /** Wait for a scroll animation to settle by polling position stability. */
  const waitForSnap = async (pg, prop = "scrollLeft") => {
    await page.waitForTimeout(80) // let the scroll start
    await page.waitForFunction(
      ({ pg, prop }) => {
        const content = document.querySelector(`[data-pg="${pg}"] .carousel-content`)
        if (!content) return false
        const key = `__csnap_${pg}_${prop}`
        const cur = content[prop]
        if (window[key] === undefined) { window[key] = cur; return false }
        if (Math.abs(window[key] - cur) > 0.5) { window[key] = cur; return false }
        delete window[key]
        return true
      },
      { pg, prop },
      { polling: 100, timeout: 5000 }
    )
  }

  /** Reset scroll position to the start. */
  const resetScroll = async (pg) => {
    await page.evaluate(
      (pg) => {
        const c = document.querySelector(`[data-pg="${pg}"] .carousel-content`)
        c.scrollTo({ left: 0, top: 0 })
      },
      pg
    )
    await page.waitForTimeout(120)
  }

  // ---- ARIA ----

  await test("ARIA: root has role=region and aria-roledescription=carousel", async () => {
    eq(await el("c-basic").getAttribute("role"), "region")
    eq(await el("c-basic").getAttribute("aria-roledescription"), "carousel")
  })

  await test("ARIA: slides have role=group and aria-roledescription=slide", async () => {
    const items = el("c-basic", ".carousel-item")
    eq(await items.first().getAttribute("role"), "group")
    eq(await items.first().getAttribute("aria-roledescription"), "slide")
    eq(await items.count(), 5, "5 slides")
  })

  // ---- Prev / Next buttons ----

  await test("prev disabled at start, next enabled", async () => {
    await resetScroll("c-basic")
    eq(await el("c-basic", ".carousel-previous").isDisabled(), true, "prev disabled")
    eq(await el("c-basic", ".carousel-next").isDisabled(), false, "next enabled")
  })

  await test("clicking next advances the snap position", async () => {
    await resetScroll("c-basic")
    await el("c-basic", ".carousel-next").click()
    await waitForSnap("c-basic")
    const scroll = await page.evaluate(() =>
      document.querySelector('[data-pg="c-basic"] .carousel-content').scrollLeft
    )
    eq(scroll > 10, true, `scrollLeft increased (${scroll})`)
  })

  await test("clicking prev goes back to start", async () => {
    // at slide 2 from the previous test
    await el("c-basic", ".carousel-previous").click()
    await waitForSnap("c-basic")
    const scroll = await page.evaluate(() =>
      document.querySelector('[data-pg="c-basic"] .carousel-content').scrollLeft
    )
    near(scroll, 0, 2, "scrolled back to start")
  })

  await test("next disabled at the last slide", async () => {
    await resetScroll("c-basic")
    for (let i = 0; i < 4; i++) {
      await el("c-basic", ".carousel-next").click()
      await waitForSnap("c-basic")
    }
    eq(await el("c-basic", ".carousel-next").isDisabled(), true, "next disabled at end")
    eq(await el("c-basic", ".carousel-previous").isDisabled(), false, "prev still enabled")
  })

  // ---- Keyboard ----

  await test("keyboard ArrowRight advances, ArrowLeft goes back", async () => {
    await resetScroll("c-basic")
    await el("c-basic").focus()
    await page.keyboard.press("ArrowRight")
    await waitForSnap("c-basic")
    const after = await page.evaluate(() =>
      document.querySelector('[data-pg="c-basic"] .carousel-content').scrollLeft
    )
    eq(after > 10, true, `ArrowRight advanced (scrollLeft=${after})`)

    await page.keyboard.press("ArrowLeft")
    await waitForSnap("c-basic")
    const back = await page.evaluate(() =>
      document.querySelector('[data-pg="c-basic"] .carousel-content').scrollLeft
    )
    near(back, 0, 2, "ArrowLeft returned to start")
  })

  // ---- Pointer swipe ----

  await test("pointer swipe past threshold advances", async () => {
    await resetScroll("c-basic")
    const box = await el("c-basic", ".carousel-content").boundingBox()
    const cx = box.x + box.width / 2
    const cy = box.y + box.height / 2

    await page.mouse.move(cx, cy)
    await page.mouse.down()
    await page.mouse.move(cx - 80, cy, { steps: 5 })
    await page.mouse.up()
    await waitForSnap("c-basic")

    const scroll = await page.evaluate(() =>
      document.querySelector('[data-pg="c-basic"] .carousel-content').scrollLeft
    )
    eq(scroll > 10, true, `swipe advanced (scrollLeft=${scroll})`)
  })

  await test("small pointer drag snaps back", async () => {
    await resetScroll("c-basic")
    const box = await el("c-basic", ".carousel-content").boundingBox()
    const cx = box.x + box.width / 2
    const cy = box.y + box.height / 2

    await page.mouse.move(cx, cy)
    await page.mouse.down()
    await page.mouse.move(cx - 20, cy, { steps: 3 })
    await page.mouse.up()
    await waitForSnap("c-basic")

    const scroll = await page.evaluate(() =>
      document.querySelector('[data-pg="c-basic"] .carousel-content').scrollLeft
    )
    near(scroll, 0, 5, "snapped back to start")
  })

  // ---- Vertical ----

  await test("vertical: ArrowDown advances, ArrowUp returns", async () => {
    await resetScroll("c-vertical")
    await el("c-vertical").focus()
    await page.keyboard.press("ArrowDown")
    await waitForSnap("c-vertical", "scrollTop")
    const after = await page.evaluate(() =>
      document.querySelector('[data-pg="c-vertical"] .carousel-content').scrollTop
    )
    eq(after > 10, true, `ArrowDown advanced (scrollTop=${after})`)

    await page.keyboard.press("ArrowUp")
    await waitForSnap("c-vertical", "scrollTop")
    const back = await page.evaluate(() =>
      document.querySelector('[data-pg="c-vertical"] .carousel-content').scrollTop
    )
    near(back, 0, 2, "ArrowUp returned to start")
  })

  await test("vertical: prev disabled at start, next enabled", async () => {
    await resetScroll("c-vertical")
    eq(await el("c-vertical", ".carousel-previous").isDisabled(), true, "prev disabled")
    eq(await el("c-vertical", ".carousel-next").isDisabled(), false, "next enabled")
  })

  // ---- Click-through on interactive content inside slides ----

  await test("mouse click on a button inside a slide registers", async () => {
    const btn = page.locator('[data-pg="c-click-btn"]').first()
    await btn.waitFor()
    eq(await btn.getAttribute("data-clicks"), "0", "starts at 0")
    await btn.click()
    eq(await btn.getAttribute("data-clicks"), "1", "click registered")
    await btn.click()
    eq(await btn.getAttribute("data-clicks"), "2", "second click registered")
  })
}
