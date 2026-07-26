export default async function run({ page, baseUrl, test, eq, near }) {
  await page.goto(`${baseUrl}/#drawer`)

  const drawer = page.locator(".drawer")

  const settle = (locator) =>
    locator.evaluate((el) => Promise.all(el.getAnimations().map((a) => a.finished)))

  await test("opens flush to the bottom edge by default", async () => {
    await page.locator('button:has-text("Open down")').click()
    await page.waitForSelector('.drawer[data-state="open"]')
    await settle(drawer)
    eq(await drawer.evaluate((el) => el.classList.contains("drawer--down")), true)
    eq(await drawer.evaluate((el) => el.matches(":modal")), true, "modal")
    const [bottom, viewport] = await drawer.evaluate((el) => [
      el.getBoundingClientRect().bottom,
      window.innerHeight,
    ])
    near(bottom, viewport, 1, "flush bottom")
  })

  await test("shows the swipe handle by default", async () => {
    eq(await drawer.locator(".drawer-handle").count(), 1)
  })

  await test("title and description are wired via aria", async () => {
    const [title, description] = await drawer.evaluate((el) => [
      document.getElementById(el.getAttribute("aria-labelledby"))?.textContent,
      document.getElementById(el.getAttribute("aria-describedby"))?.textContent,
    ])
    eq(title, "Move goal", "labelledby")
    eq(description, "Set your daily activity goal.", "describedby")
  })

  await test("backdrop click closes", async () => {
    await page.mouse.click(5, 5)
    await page.waitForSelector(".drawer", { state: "detached" })
  })

  await test("Escape closes", async () => {
    await page.locator('button:has-text("Open down")').click()
    await page.waitForSelector('.drawer[data-state="open"]')
    await page.keyboard.press("Escape")
    await page.waitForSelector(".drawer", { state: "detached" })
  })

  await test("drag past a quarter of its size dismisses", async () => {
    await page.locator('button:has-text("Open down")').click()
    await page.waitForSelector('.drawer[data-state="open"]')
    await settle(drawer)
    const box = await drawer.boundingBox()
    const x = box.x + box.width / 2
    const y = box.y + 10
    await page.mouse.move(x, y)
    await page.mouse.down()
    await page.mouse.move(x, y + box.height * 0.5, { steps: 10 })
    await page.mouse.up()
    await page.waitForSelector(".drawer", { state: "detached" })
  })

  await test("a short drag sets data-swiping, then springs back", async () => {
    await page.locator('button:has-text("Open down")').click()
    await page.waitForSelector('.drawer[data-state="open"]')
    await settle(drawer)
    const box = await drawer.boundingBox()
    const x = box.x + box.width / 2
    const y = box.y + 10
    await page.mouse.move(x, y)
    await page.mouse.down()
    await page.mouse.move(x, y + box.height * 0.1, { steps: 5 })
    eq(await drawer.evaluate((el) => el.hasAttribute("data-swiping")), true, "swiping")
    await page.mouse.up()
    eq(await drawer.getAttribute("data-state"), "open", "stays open")
    await settle(drawer)
    eq(await drawer.evaluate((el) => getComputedStyle(el).transform), "none", "sprang back")
    await page.keyboard.press("Escape")
    await page.waitForSelector(".drawer", { state: "detached" })
  })

  await test("a drag starting on a button does not dismiss", async () => {
    await page.locator('button:has-text("Open up")').click()
    await page.waitForSelector('.drawer--up[data-state="open"]')
    const up = page.locator(".drawer--up")
    await settle(up)
    const box = await up.boundingBox()
    const submit = await up.locator('button:has-text("Submit")').boundingBox()
    const x = submit.x + submit.width / 2
    const y = submit.y + submit.height / 2
    await page.mouse.move(x, y)
    await page.mouse.down()
    await page.mouse.move(x, y - box.height * 0.5, { steps: 10 })
    await page.mouse.up()
    eq(await up.getAttribute("data-state"), "open", "stays open")
    await page.keyboard.press("Escape")
    await page.waitForSelector(".drawer", { state: "detached" })
  })

  await test("direction variants anchor to their edges", async () => {
    for (const [direction, edge] of [
      ["up", "top"],
      ["left", "left"],
      ["right", "right"],
    ]) {
      await page.locator(`button:has-text("Open ${direction}")`).click()
      await page.waitForSelector(`.drawer--${direction}[data-state="open"]`)
      await settle(page.locator(`.drawer--${direction}`))
      const offset = await page.locator(`.drawer--${direction}`).evaluate((el, which) => {
        const rect = el.getBoundingClientRect()
        if (which === "top") return rect.top
        if (which === "left") return rect.left
        return window.innerWidth - rect.right
      }, edge)
      near(offset, 0, 1, `flush ${edge}`)
      await page.keyboard.press("Escape")
      await page.waitForSelector(".drawer", { state: "detached" })
    }
  })

  // ── Swipe velocity tests ──────────────────────────────────────────
  // The drawer is a modal <dialog> whose React handlers are unreachable
  // via dispatchEvent, so these tests use Playwright's mouse API.
  // Fast swipes use few large steps; slow swipes use small steps with
  // explicit delays between them.

  await test("fast short swipe (velocity) dismisses drawer", async () => {
    await page.locator('button:has-text("Open down")').click()
    await page.waitForSelector('.drawer[data-state="open"]')
    await settle(drawer)
    const box = await drawer.boundingBox()
    const x = box.x + box.width / 2
    const y = box.y + 10

    // 50px downward in 3 fast steps (~2.5 px/ms, above 1.0 threshold)
    // but under 25% of drawer height (~58px)
    await page.mouse.move(x, y)
    await page.mouse.down()
    await page.mouse.move(x, y + 50, { steps: 3 })
    await page.mouse.up()

    await page.waitForSelector(".drawer", { state: "detached" })
  })

  await test("same distance dragged slowly keeps drawer open", async () => {
    await page.locator('button:has-text("Open down")').click()
    await page.waitForSelector('.drawer[data-state="open"]')
    await settle(drawer)
    const box = await drawer.boundingBox()
    const x = box.x + box.width / 2
    const y = box.y + 10

    // 50px downward over ~300ms (~0.17 px/ms, well below threshold)
    await page.mouse.move(x, y)
    await page.mouse.down()
    for (let i = 1; i <= 10; i++) {
      await page.mouse.move(x, y + i * 5, { steps: 1 })
      await page.waitForTimeout(30)
    }
    await page.mouse.up()

    await page.waitForTimeout(200)
    eq(await drawer.getAttribute("data-state"), "open", "stays open")
    await page.keyboard.press("Escape")
    await page.waitForSelector(".drawer", { state: "detached" })
  })

  await test("fast swipe in wrong direction keeps drawer open", async () => {
    await page.locator('button:has-text("Open down")').click()
    await page.waitForSelector('.drawer[data-state="open"]')
    await settle(drawer)
    const box = await drawer.boundingBox()
    const x = box.x + box.width / 2
    const y = box.y + 40

    // 50px upward (wrong direction for down drawer) — fast
    await page.mouse.move(x, y)
    await page.mouse.down()
    await page.mouse.move(x, y - 50, { steps: 3 })
    await page.mouse.up()

    await page.waitForTimeout(200)
    eq(await drawer.getAttribute("data-state"), "open", "stays open")
    await page.keyboard.press("Escape")
    await page.waitForSelector(".drawer", { state: "detached" })
  })

  await test("long slow drag ending in flick dismisses drawer", async () => {
    await page.locator('button:has-text("Open down")').click()
    await page.waitForSelector('.drawer[data-state="open"]')
    await settle(drawer)
    const box = await drawer.boundingBox()
    const x = box.x + box.width / 2
    const y = box.y + 10

    // Slow phase: 20px over ~400ms
    await page.mouse.move(x, y)
    await page.mouse.down()
    for (let i = 1; i <= 4; i++) {
      await page.mouse.move(x, y + i * 5, { steps: 1 })
      await page.waitForTimeout(100)
    }
    // Pause so slow samples fall outside the 100ms velocity window
    await page.waitForTimeout(120)
    // Fast phase: 30px in 3 rapid steps (~1.5+ px/ms)
    await page.mouse.move(x, y + 50, { steps: 3 })
    await page.mouse.up()

    await page.waitForSelector(".drawer", { state: "detached" })
  })

  await test("held still before lift does not dismiss drawer", async () => {
    await page.locator('button:has-text("Open down")').click()
    await page.waitForSelector('.drawer[data-state="open"]')
    await settle(drawer)
    const box = await drawer.boundingBox()
    const x = box.x + box.width / 2
    const y = box.y + 10

    // Move 20px quickly, then hold still for 200ms (> 100ms window)
    await page.mouse.move(x, y)
    await page.mouse.down()
    await page.mouse.move(x, y + 20, { steps: 2 })
    await page.waitForTimeout(200)
    await page.mouse.up()

    await page.waitForTimeout(200)
    eq(await drawer.getAttribute("data-state"), "open", "stays open")
    await page.keyboard.press("Escape")
    await page.waitForSelector(".drawer", { state: "detached" })
  })
}
