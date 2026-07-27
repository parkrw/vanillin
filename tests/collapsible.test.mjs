export default async function run({ page, baseUrl, test, eq }) {
  await page.goto(`${baseUrl}/#collapsible`)
  await page.waitForSelector(".collapsible")

  const first = page.locator(".collapsible").first()
  const trigger = first.locator('[aria-label="Toggle"]')

  await test("initial state: closed", async () => {
    eq(await trigger.getAttribute("aria-expanded"), "false")
    eq(await trigger.getAttribute("data-state"), "closed")
    eq(await first.getAttribute("data-state"), "closed")
    eq(await first.locator(".collapsible-content").count(), 0)
  })

  await test("click opens and shows content", async () => {
    eq(await trigger.getAttribute("aria-expanded"), "false")
    await trigger.click()
    eq(await trigger.getAttribute("aria-expanded"), "true")
    eq(await first.getAttribute("data-state"), "open")
    const content = first.locator(".collapsible-content")
    await content.waitFor({ state: "attached" })
    eq(await content.getAttribute("data-state"), "open")
  })

  await test("click again closes content", async () => {
    eq(await trigger.getAttribute("data-state"), "open")
    await trigger.click()
    eq(await trigger.getAttribute("aria-expanded"), "false")
    eq(await trigger.getAttribute("data-state"), "closed")
    await page.waitForSelector('.collapsible:first-of-type .collapsible-content', { state: "detached", timeout: 3000 }).catch(() => {})
    // data-state goes to closed; presence unmounts after animation
    eq(await first.getAttribute("data-state"), "closed")
  })

  await test("trigger aria-controls points to content id", async () => {
    await trigger.click()
    await page.waitForSelector('.collapsible-content[data-state="open"]')
    const controlsId = await trigger.getAttribute("aria-controls")
    const content = first.locator(".collapsible-content")
    eq(await content.getAttribute("id"), controlsId)
    await trigger.click()
  })

  await test("defaultOpen starts expanded", async () => {
    const second = page.locator(".collapsible").nth(1)
    eq(await second.getAttribute("data-state"), "open")
    const t = second.locator(".collapsible-trigger")
    eq(await t.getAttribute("aria-expanded"), "true")
    eq(await second.locator(".collapsible-content").isVisible(), true)
  })

  await test("defaultOpen can be closed", async () => {
    const second = page.locator(".collapsible").nth(1)
    const t = second.locator(".collapsible-trigger")
    eq(await t.getAttribute("data-state"), "open")
    await t.click()
    eq(await t.getAttribute("aria-expanded"), "false")
    eq(await second.getAttribute("data-state"), "closed")
  })
}
