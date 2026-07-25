export default async function run({ page, baseUrl, test, eq }) {
  await page.goto(`${baseUrl}/#toast`)

  // Park the mouse away — pointer position carries over between test files
  await page.mouse.move(0, 0)

  const allToasts = () => page.locator(".toast")
  const firstToast = () => page.locator(".toast").first()

  const settle = (locator) =>
    locator.evaluate((el) => Promise.all(el.getAnimations().map((a) => a.finished)))

  /** Wait until a condition is met (polling, not fixed sleep). */
  const waitFor = async (fn, timeout = 5000) => {
    const deadline = Date.now() + timeout
    while (Date.now() < deadline) {
      try {
        const result = await fn()
        if (result) return result
      } catch {}
      await page.waitForTimeout(50)
    }
    throw new Error("waitFor timed out")
  }

  /** Dismiss all toasts via the imperative API exposed on window. */
  const clearAll = async () => {
    await page.mouse.move(0, 0)
    await page.evaluate(() => window.__toast?.dismiss())
    try {
      await page.waitForFunction(
        () => document.querySelectorAll(".toast").length === 0,
        { timeout: 4000 }
      )
    } catch {}
    await page.waitForTimeout(100)
  }

  // -- Tests --

  await test("toast renders with role and aria attributes", async () => {
    await page.locator('button:has-text("Default")').click()
    await waitFor(async () => (await allToasts().count()) > 0)
    const t = firstToast()
    eq(await t.getAttribute("role"), "status", "role=status")
    eq(await t.getAttribute("aria-live"), "polite", "aria-live=polite")
    eq(await t.getAttribute("aria-atomic"), "true", "aria-atomic")
    eq((await t.locator(".toast-title").textContent()).includes("Event has been created"), true, "title")
    await clearAll()
  })

  await test("auto-dismiss after duration", async () => {
    await page.locator('[data-pg="short"]').click()
    await waitFor(async () => (await allToasts().count()) > 0)
    eq(await firstToast().locator(".toast-title").textContent(), "Quick toast", "toast appeared")
    // Wait for auto-dismiss (800ms + exit animation time)
    await waitFor(async () => (await allToasts().count()) === 0, 5000)
    eq(await allToasts().count(), 0, "toast dismissed after duration")
  })

  await test("hover pauses the auto-dismiss timer", async () => {
    await page.mouse.move(0, 0)
    await page.locator('[data-pg="short"]').click()
    await waitFor(async () => (await allToasts().count()) > 0)
    const t = firstToast()
    await settle(t)

    // Hover over the toaster region to pause the timer
    const box = await t.boundingBox()
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)

    // Wait longer than the 800ms duration
    await page.waitForTimeout(1200)
    eq(await allToasts().count() > 0, true, "still visible while hovered")

    // Move away — timer should resume and dismiss
    await page.mouse.move(0, 0)
    await waitFor(async () => (await allToasts().count()) === 0, 5000)
    eq(await allToasts().count(), 0, "dismissed after mouse left")
  })

  await test("queue limit: at most visibleToasts visible, rest hidden", async () => {
    // Fire 5 toasts rapidly
    for (let i = 0; i < 5; i++) {
      await page.locator('button:has-text("Default")').click()
      await page.waitForTimeout(30)
    }
    await waitFor(async () => (await allToasts().count()) >= 5)

    const visibleCount = await page.evaluate(() => {
      let visible = 0
      for (const t of document.querySelectorAll(".toast")) {
        if (!t.hasAttribute("data-limited")) visible++
      }
      return visible
    })
    eq(visibleCount <= 3, true, `at most 3 visible (got ${visibleCount})`)

    const limitedCount = await page.evaluate(() =>
      document.querySelectorAll(".toast[data-limited]").length
    )
    eq(limitedCount >= 2, true, `at least 2 limited (got ${limitedCount})`)

    await clearAll()
  })

  await test("action button fires callback and dismisses", async () => {
    await page.locator('button:has-text("With action")').first().click()
    await waitFor(async () => (await allToasts().count()) > 0)
    const t = firstToast()
    await settle(t)

    const actionBtn = t.locator(".toast-action")
    eq(await actionBtn.count(), 1, "action button rendered")
    eq(await actionBtn.textContent(), "Undo", "action label")
    await actionBtn.click()

    // The callback fires toast.info("Undone!")
    await waitFor(async () => {
      const titles = await page.evaluate(() =>
        Array.from(document.querySelectorAll(".toast-title")).map((el) => el.textContent)
      )
      return titles.includes("Undone!")
    })
    eq(true, true, "callback fired")

    await clearAll()
  })

  await test("swipe past 25% dismisses the toast", async () => {
    await page.mouse.move(0, 0)
    await page.locator('button:has-text("Default")').click()
    await waitFor(async () => (await allToasts().count()) > 0)
    const t = firstToast()
    await settle(t)

    const box = await t.boundingBox()
    const startX = box.x + 20
    const y = box.y + box.height / 2

    await page.mouse.move(startX, y)
    await page.mouse.down()
    // Swipe right past 25% of width
    await page.mouse.move(startX + box.width * 0.5, y, { steps: 10 })
    await page.mouse.up()

    await waitFor(async () => (await allToasts().count()) === 0, 5000)
    eq(await allToasts().count(), 0, "dismissed after swipe")
  })

  await test("swipe under 25% snaps back", async () => {
    await page.mouse.move(0, 0)
    await page.locator('button:has-text("Default")').click()
    await waitFor(async () => (await allToasts().count()) > 0)
    const t = firstToast()
    await settle(t)

    const box = await t.boundingBox()
    const startX = box.x + 20
    const y = box.y + box.height / 2

    await page.mouse.move(startX, y)
    await page.mouse.down()
    // Swipe right only ~10% of width
    await page.mouse.move(startX + box.width * 0.1, y, { steps: 5 })
    eq(await t.evaluate((el) => el.hasAttribute("data-swiping")), true, "swiping attr set")
    await page.mouse.up()

    eq(await allToasts().count() > 0, true, "still visible")
    await settle(t)
    eq(
      await t.evaluate((el) => el.style.transform === "" || el.style.transform === "none"),
      true,
      "transform cleared"
    )

    await clearAll()
  })

  await test("close button dismisses the toast", async () => {
    await page.mouse.move(0, 0)
    await page.locator('button:has-text("Default")').click()
    await waitFor(async () => (await allToasts().count()) > 0)
    const t = firstToast()
    await settle(t)

    // Hover to reveal close button
    const box = await t.boundingBox()
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
    await page.waitForTimeout(100)

    const closeBtn = t.locator(".toast-close")
    eq(await closeBtn.count(), 1, "close button exists")
    await closeBtn.click()

    await waitFor(async () => (await allToasts().count()) === 0, 5000)
    eq(await allToasts().count(), 0, "dismissed via close button")
  })

  await test("success/error/warning/info render with correct type", async () => {
    for (const type of ["Success", "Error", "Warning", "Info"]) {
      await page.locator(`button:has-text("${type}")`).click()
      await page.waitForTimeout(50)
    }
    await waitFor(async () => (await allToasts().count()) >= 4)

    const types = await page.evaluate(() =>
      Array.from(document.querySelectorAll(".toast")).map((el) => el.getAttribute("data-type"))
    )
    eq(types.includes("success"), true, "success type")
    eq(types.includes("error"), true, "error type")
    eq(types.includes("warning"), true, "warning type")
    eq(types.includes("info"), true, "info type")

    await clearAll()
  })

  await test("promise toast transitions from loading to success", async () => {
    await page.locator('button:has-text("Save with promise")').click()
    await waitFor(async () => (await allToasts().count()) > 0)

    eq(await firstToast().getAttribute("data-type"), "loading", "starts as loading")

    await waitFor(async () => {
      const type = await firstToast().getAttribute("data-type")
      return type === "success"
    }, 5000)
    eq(await firstToast().getAttribute("data-type"), "success", "resolved to success")

    await clearAll()
  })
}
