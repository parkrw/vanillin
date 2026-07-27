export default async function run({ page, baseUrl, test, eq }) {
  await page.goto(`${baseUrl}/#radio-group`)
  await page.waitForSelector(".radio-group")

  const group = page.locator('[role="radiogroup"]').first()

  await test("radiogroup role and default selection", async () => {
    eq(await group.getAttribute("role"), "radiogroup")
    const comfortable = group.locator('#rg-comfortable')
    eq(await comfortable.getAttribute("aria-checked"), "true")
    eq(await comfortable.getAttribute("data-state"), "checked")
    const def = group.locator('#rg-default')
    eq(await def.getAttribute("aria-checked"), "false")
    eq(await def.getAttribute("data-state"), "unchecked")
  })

  await test("clicking a radio selects it and deselects others", async () => {
    const def = group.locator('#rg-default')
    const comfortable = group.locator('#rg-comfortable')
    eq(await comfortable.getAttribute("data-state"), "checked")
    await def.click()
    eq(await def.getAttribute("aria-checked"), "true")
    eq(await def.getAttribute("data-state"), "checked")
    eq(await comfortable.getAttribute("aria-checked"), "false")
    eq(await comfortable.getAttribute("data-state"), "unchecked")
  })

  await test("arrow keys rove focus and select", async () => {
    const def = group.locator('#rg-default')
    await def.focus()
    await page.keyboard.press("ArrowDown")
    eq(await page.evaluate(() => document.activeElement.id), "rg-comfortable")
    eq(await group.locator('#rg-comfortable').getAttribute("aria-checked"), "true")
  })

  await test("roving tabindex: selected has 0, others -1", async () => {
    const comfortable = group.locator('#rg-comfortable')
    const compact = group.locator('#rg-compact')
    eq(await comfortable.evaluate((el) => el.tabIndex), 0)
    eq(await compact.evaluate((el) => el.tabIndex), -1)
  })

  await test("disabled item is not focusable via arrow keys", async () => {
    const disabledGroup = page.locator('.pg-section:has(h3:has-text("Disabled")) [role="radiogroup"]')
    const active = disabledGroup.locator('#rg-active')
    const disabled = disabledGroup.locator('#rg-disabled')
    eq(await disabled.isDisabled(), true)
    await active.focus()
    await page.keyboard.press("ArrowDown")
    eq(await page.evaluate(() => document.activeElement.id), "rg-active", "wraps past disabled")
  })

  await test("controlled mode reflects selection in text", async () => {
    const controlledSection = page.locator('.pg-section:has(h3:has-text("Controlled"))')
    const status = controlledSection.locator("p")
    eq((await status.textContent()).includes("comfortable"), true)
    await controlledSection.locator('#rgc-default').click()
    eq((await status.textContent()).includes("default"), true)
  })
}
