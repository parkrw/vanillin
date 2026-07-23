export default async function run({ page, baseUrl, test, eq, near }) {
  await page.goto(`${baseUrl}/#sheet`)

  const sheet = page.locator(".sheet")

  const settle = (locator) =>
    locator.evaluate((el) => Promise.all(el.getAnimations().map((a) => a.finished)))

  await test("opens flush to the right edge by default", async () => {
    await page.locator('button:has-text("Open right")').click()
    await page.waitForSelector('.sheet[data-state="open"]')
    await settle(sheet)
    eq(await sheet.evaluate((el) => el.classList.contains("sheet--right")), true)
    eq(await sheet.evaluate((el) => el.matches(":modal")), true, "modal")
    const [right, viewport] = await sheet.evaluate((el) => [
      el.getBoundingClientRect().right,
      window.innerWidth,
    ])
    near(right, viewport, 1, "flush right")
  })

  await test("title and description are wired via aria", async () => {
    const [title, description] = await sheet.evaluate((el) => [
      document.getElementById(el.getAttribute("aria-labelledby"))?.textContent,
      document.getElementById(el.getAttribute("aria-describedby"))?.textContent,
    ])
    eq(title, "Edit profile", "labelledby")
    eq(description, "Make changes to your profile here.", "describedby")
  })

  await test("the X button closes", async () => {
    await sheet.locator(".dialog-close").click()
    await page.waitForSelector(".sheet", { state: "detached" })
  })

  await test("backdrop click closes", async () => {
    await page.locator('button:has-text("Open right")').click()
    await page.waitForSelector('.sheet[data-state="open"]')
    await page.mouse.click(5, 5)
    await page.waitForSelector(".sheet", { state: "detached" })
  })

  await test("side variants anchor to their edges", async () => {
    for (const side of ["left", "top", "bottom"]) {
      await page.locator(`button:has-text("Open ${side}")`).click()
      await page.waitForSelector(`.sheet--${side}[data-state="open"]`)
      await settle(page.locator(`.sheet--${side}`))
      const offset = await page.locator(`.sheet--${side}`).evaluate((el, which) => {
        const rect = el.getBoundingClientRect()
        if (which === "left") return rect.left
        if (which === "top") return rect.top
        return window.innerHeight - rect.bottom
      }, side)
      near(offset, 0, 1, `flush ${side}`)
      await page.keyboard.press("Escape")
      await page.waitForSelector(".sheet", { state: "detached" })
    }
  })
}
