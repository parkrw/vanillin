export default async function run({ page, baseUrl, test, eq }) {
  await page.goto(`${baseUrl}/#tabs`)
  await page.waitForSelector(".tabs")

  const tablist = page.locator('[role="tablist"]').first()
  const account = tablist.locator('[role="tab"]:has-text("Account")')
  const password = tablist.locator('[role="tab"]:has-text("Password")')

  await test("initial state: account tab selected", async () => {
    eq(await account.getAttribute("aria-selected"), "true")
    eq(await account.getAttribute("data-state"), "active")
    eq(await password.getAttribute("aria-selected"), "false")
    eq(await password.getAttribute("data-state"), "inactive")
  })

  await test("tab panel is visible and wired via aria", async () => {
    const panelId = await account.getAttribute("aria-controls")
    const panel = page.locator(`#${panelId}`)
    eq(await panel.getAttribute("role"), "tabpanel")
    eq(await panel.isVisible(), true)
    eq(await panel.getAttribute("aria-labelledby"), await account.getAttribute("id"))
  })

  await test("clicking a tab switches content", async () => {
    const accountPanelId = await account.getAttribute("aria-controls")
    eq(await page.locator(`#${accountPanelId}`).isVisible(), true)
    await password.click()
    eq(await password.getAttribute("data-state"), "active")
    eq(await account.getAttribute("data-state"), "inactive")
    const passwordPanelId = await password.getAttribute("aria-controls")
    eq(await page.locator(`#${passwordPanelId}`).isVisible(), true)
    eq(await page.locator(`#${accountPanelId}`).count(), 0)
  })

  await test("arrow keys rove focus and activate tabs", async () => {
    await account.click()
    eq(await account.getAttribute("data-state"), "active")
    await page.keyboard.press("ArrowRight")
    eq(await page.evaluate(() => document.activeElement.textContent), "Password")
    eq(await password.getAttribute("data-state"), "active")
    await page.keyboard.press("ArrowLeft")
    eq(await page.evaluate(() => document.activeElement.textContent), "Account")
    eq(await account.getAttribute("data-state"), "active")
  })

  await test("roving tabindex: active tab has tabIndex 0, others -1", async () => {
    eq(await account.evaluate((el) => el.tabIndex), 0)
    eq(await password.evaluate((el) => el.tabIndex), -1)
  })

  await test("disabled trigger is skipped by arrow keys", async () => {
    const disabledList = page.locator('.pg-section:has(h3:has-text("Disabled")) [role="tablist"]')
    const active = disabledList.locator('[role="tab"]:has-text("Active")')
    const disabled = disabledList.locator('[role="tab"]:has-text("Disabled")')
    eq(await disabled.isDisabled(), true)
    await active.click()
    await page.keyboard.press("ArrowRight")
    eq(await page.evaluate(() => document.activeElement.textContent), "Active", "wraps past disabled")
  })

  await test("tabpanel has tabIndex 0 for keyboard access", async () => {
    const panelId = await account.getAttribute("aria-controls")
    eq(await page.locator(`#${panelId}`).getAttribute("tabindex"), "0")
  })
}
