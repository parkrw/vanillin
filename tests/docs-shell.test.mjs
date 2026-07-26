export default async function run({ page, baseUrl, test, eq }) {
  await page.goto(`${baseUrl}/`)
  await page.waitForSelector(".pg-nav-group")

  await test("empty hash routes to the introduction page", async () => {
    await page.waitForFunction(
      () => document.querySelector(".pg-main > h2")?.textContent === "Introduction"
    )
    const active = page.locator('.pg-nav-link[data-active="true"]')
    eq(await active.count(), 1)
    eq(await active.textContent(), "Introduction")
  })

  await test("nav is grouped into get started + components", async () => {
    const labels = await page.locator(".pg-nav-group > .pg-nav-label").allTextContents()
    eq(labels.join("|"), "Get started|Components")
    eq(await page.locator(".pg-nav-group").first().locator(".pg-nav-link").count(), 4)
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

  await test("component routes still resolve", async () => {
    await page.goto(`${baseUrl}/#button`)
    await page.waitForSelector(".btn")
    eq(await page.locator(".pg-main > h2").textContent(), "Button")
    eq(await page.locator('.pg-nav-link[data-active="true"]').textContent(), "Button")
  })
}
