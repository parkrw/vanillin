export default async function run({ page, baseUrl, test, eq }) {
  await test("empty hash routes to the home page", async () => {
    await page.goto(`${baseUrl}/`)
    await page.waitForSelector(".pg-home")
    const title = await page.locator(".pg-hero-title").textContent()
    eq(title, "vanillin")
  })

  await test("sidebar shows all three groups on any docs page", async () => {
    await page.goto(`${baseUrl}/#introduction`)
    await page.waitForSelector(".pg-nav-group")
    const labels = await page.locator(".pg-nav-group > .pg-nav-label").allTextContents()
    eq(labels.join("|"), "Get started|Components|Docs")
  })

  await test("docs links route to their pages", async () => {
    await page.click('.pg-nav a[href="#installation"]')
    await page.waitForFunction(
      () => document.querySelector(".pg-main > h2")?.textContent === "Installation"
    )
    await page.click('.pg-nav a[href="#theming"]')
    await page.waitForFunction(
      () => document.querySelector(".pg-main > h2")?.textContent === "Theming"
    )
    await page.click('.pg-nav a[href="#schema"]')
    await page.waitForFunction(
      () => document.querySelector(".pg-main > h2")?.textContent === "Schema"
    )
    eq(await page.locator('.pg-nav-link[data-active="true"]').textContent(), "Schema")
  })

  await test("category containing the active route auto-opens", async () => {
    await page.goto(`${baseUrl}/#button`)
    await page.waitForFunction(
      () => document.querySelector(".pg-main > h2")?.textContent === "Button"
    )
    const open = page.locator('.pg-nav-cat[data-open="true"]')
    eq(await open.count(), 1)
    eq((await open.locator(".pg-nav-cat-btn").textContent()).trim(), "Forms")
    eq(await page.locator('.pg-nav-link[data-active="true"]').isVisible(), true)
  })

  await test("category collapses and reopens on click", async () => {
    const formsBtn = page.locator(".pg-nav-cat-btn", { hasText: "Forms" })
    const inputLink = page.locator('.pg-nav a[href="#input"]')
    await formsBtn.click()
    await inputLink.waitFor({ state: "hidden" })
    await formsBtn.click()
    await inputLink.waitFor({ state: "visible" })
  })

  await test("sidebar resizes by dragging the handle", async () => {
    const sidebar = page.locator(".pg-sidebar")
    const before = (await sidebar.boundingBox()).width
    const handle = await page.locator('[data-pg="sidebar-handle"]').boundingBox()
    const x = handle.x + handle.width / 2
    const y = handle.y + handle.height / 2
    await page.mouse.move(x, y)
    await page.mouse.down()
    await page.mouse.move(x + 80, y)
    await page.mouse.up()
    const after = (await sidebar.boundingBox()).width
    eq(after > before, true, `expected width to grow, ${before} → ${after}`)
    await page.evaluate(() => localStorage.removeItem("pg-sidebar-width"))
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

  await test("topnav turns opaque once the page scrolls", async () => {
    await page.goto(`${baseUrl}/#home`)
    await page.waitForSelector(".pg-home-cat-grid")
    eq(await page.locator(".pg-topnav").getAttribute("data-scrolled"), "false")
    await page.evaluate(() => window.scrollTo(0, 600))
    await page.waitForFunction(
      () => document.querySelector(".pg-topnav")?.dataset.scrolled === "true"
    )
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
