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
}
