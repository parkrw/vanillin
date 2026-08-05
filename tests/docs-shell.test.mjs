export default async function run({ page, baseUrl, test, eq }) {
  await test("empty hash routes to the home page", async () => {
    await page.goto(`${baseUrl}/`)
    await page.waitForSelector(".pg-home")
    const title = await page.locator(".pg-hero-title").textContent()
    eq(title, "vanillin")
  })

  await test("docs sidebar is grouped", async () => {
    await page.goto(`${baseUrl}/#introduction`)
    await page.waitForSelector(".pg-nav-group")
    const labels = await page.locator(".pg-nav-group > .pg-nav-label").allTextContents()
    eq(labels.join("|"), "Get started")
    eq(await page.locator(".pg-nav-group").first().locator(".pg-nav-link").count(), 5)
  })

  await test("docs links route to the stub pages", async () => {
    await page.click('a[href="#installation"]')
    await page.waitForFunction(
      () => document.querySelector(".pg-main > h2")?.textContent === "Installation"
    )
    await page.click('a[href="#theming"]')
    await page.waitForFunction(
      () => document.querySelector(".pg-main > h2")?.textContent === "Theming"
    )
    await page.click('a[href="#schema"]')
    await page.waitForFunction(
      () => document.querySelector(".pg-main > h2")?.textContent === "Schema"
    )
    eq(await page.locator('.pg-nav-link[data-active="true"]').textContent(), "Schema")
  })

  await test("component sidebar is grouped by category", async () => {
    await page.goto(`${baseUrl}/#button`)
    await page.waitForFunction(
      () => document.querySelector(".pg-main > h2")?.textContent === "Button"
    )
    await page.waitForSelector(".pg-nav-group")
    const labels = await page.locator(".pg-nav-group > .pg-nav-label").allTextContents()
    eq(labels.length >= 5, true, `expected ≥5 categories, got ${labels.length}`)
    eq(labels[0], "Forms")
  })

  await test("component routes still resolve", async () => {
    await page.goto(`${baseUrl}/#accordion`)
    await page.waitForFunction(
      () => document.querySelector(".pg-main > h2")?.textContent === "Accordion"
    )
    eq(await page.locator('.pg-nav-link[data-active="true"]').textContent(), "Accordion")
  })

  await test("top navbar renders with logo and navigation menu", async () => {
    const logo = page.locator('[data-pg="logo"]')
    eq(await logo.count(), 1)
    eq(await logo.textContent(), "vanillin")
    eq(await page.locator('[data-pg="search-trigger"]').count(), 1)
  })

  await test("breadcrumb shows category for component pages", async () => {
    await page.goto(`${baseUrl}/#button`)
    await page.waitForSelector(".pg-breadcrumb")
    const items = await page.locator(".breadcrumb-item").allTextContents()
    eq(items.length >= 3, true, `expected ≥3 breadcrumb items, got ${items.length}`)
  })

  await test("command palette opens with keyboard shortcut", async () => {
    await page.keyboard.press("Meta+k")
    await page.waitForSelector('[data-pg="cmd-palette"]', { timeout: 2000 })
    eq(await page.locator('[data-pg="cmd-palette"]').count(), 1)
    await page.keyboard.press("Escape")
  })

  await test("page has exactly one h2", async () => {
    await page.goto(`${baseUrl}/#button`)
    await page.waitForSelector(".btn")
    eq(await page.locator(".pg-main > h2").count(), 1)
  })
}
