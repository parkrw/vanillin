export default async function run({ page, baseUrl, test, eq }) {
  await page.goto(`${baseUrl}/#accordion`)
  await page.waitForSelector(".accordion")

  const single = page.locator(".accordion").first()

  await test("default value opens one item", async () => {
    const trigger = single.locator('.accordion-trigger:has-text("Is it accessible?")')
    eq(await trigger.getAttribute("aria-expanded"), "true")
    eq(await trigger.getAttribute("data-state"), "open")
    const contentId = await trigger.getAttribute("aria-controls")
    const content = page.locator(`#${contentId}`)
    eq(await content.getAttribute("role"), "region")
    eq(await content.isVisible(), true)
  })

  await test("other items start closed", async () => {
    const trigger = single.locator('.accordion-trigger:has-text("Is it styled?")')
    eq(await trigger.getAttribute("aria-expanded"), "false")
    eq(await trigger.getAttribute("data-state"), "closed")
  })

  await test("single: opening one closes the other", async () => {
    const accessible = single.locator('.accordion-trigger:has-text("Is it accessible?")')
    const styled = single.locator('.accordion-trigger:has-text("Is it styled?")')
    eq(await accessible.getAttribute("data-state"), "open")
    await styled.click()
    await styled.waitFor({ state: "attached" })
    // wait for state to transition
    while (await styled.getAttribute("data-state") !== "open") {
      await page.waitForTimeout(16)
    }
    eq(await styled.getAttribute("aria-expanded"), "true")
    eq(await accessible.getAttribute("aria-expanded"), "false")
  })

  await test("single collapsible: clicking the open item closes it", async () => {
    const styled = single.locator('.accordion-trigger:has-text("Is it styled?")')
    eq(await styled.getAttribute("data-state"), "open")
    await styled.click()
    eq(await styled.getAttribute("aria-expanded"), "false")
    eq(await styled.getAttribute("data-state"), "closed")
  })

  await test("multiple: several items open independently", async () => {
    const multi = page.locator(".accordion").nth(1)
    const a = multi.locator('.accordion-trigger:has-text("Can I open several")')
    const b = multi.locator('.accordion-trigger:has-text("Do they stay open")')
    eq(await a.getAttribute("aria-expanded"), "true")
    eq(await b.getAttribute("aria-expanded"), "true")
    const c = multi.locator('.accordion-trigger:has-text("Keyboard navigation")')
    eq(await c.getAttribute("aria-expanded"), "false")
    await c.click()
    eq(await c.getAttribute("aria-expanded"), "true")
    eq(await a.getAttribute("aria-expanded"), "true", "a still open")
    eq(await b.getAttribute("aria-expanded"), "true", "b still open")
  })

  await test("arrow keys navigate between triggers", async () => {
    const first = single.locator('.accordion-trigger:has-text("Is it accessible?")')
    await first.focus()
    await page.keyboard.press("ArrowDown")
    eq(
      await page.evaluate(() => document.activeElement.textContent.includes("Is it styled?")),
      true
    )
    await page.keyboard.press("End")
    eq(
      await page.evaluate(() => document.activeElement.textContent.includes("Is it animated?")),
      true
    )
    await page.keyboard.press("Home")
    eq(
      await page.evaluate(() => document.activeElement.textContent.includes("Is it accessible?")),
      true
    )
  })

  await test("disabled item cannot be toggled", async () => {
    const disabled = page.locator('.pg-section:has(h3:has-text("Disabled")) .accordion')
    const trigger = disabled.locator('.accordion-trigger:has-text("Disabled")')
    eq(await trigger.isDisabled(), true)
  })
}
