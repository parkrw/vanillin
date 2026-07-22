export default async function run({ page, baseUrl, test, eq }) {
  await page.goto(`${baseUrl}/#dialog`)

  const trigger = page.locator('button:has-text("Open dialog")')
  const dialog = page.locator(".dialog")

  await test("trigger opens a modal dialog", async () => {
    await trigger.click()
    await page.waitForSelector('.dialog[data-state="open"]')
    eq(await dialog.evaluate((el) => el.matches(":modal")), true, "modal")
    eq(
      await page.evaluate(() => getComputedStyle(document.body).overflow),
      "hidden",
      "body scroll locked"
    )
  })

  await test("Escape closes and returns focus to the trigger", async () => {
    await page.keyboard.press("Escape")
    await page.waitForSelector(".dialog", { state: "detached" })
    eq(
      await page.evaluate(() => getComputedStyle(document.body).overflow),
      "visible",
      "body scroll unlocked"
    )
    eq(
      await page.evaluate(() => document.activeElement.textContent),
      "Open dialog",
      "focus returned"
    )
  })

  await test("backdrop click closes", async () => {
    await trigger.click()
    await page.waitForSelector('.dialog[data-state="open"]')
    await page.mouse.click(5, 5)
    await page.waitForSelector(".dialog", { state: "detached" })
  })

  await test("click inside the content does not close", async () => {
    await trigger.click()
    await page.waitForSelector('.dialog[data-state="open"]')
    await dialog.locator("p").click()
    eq(await dialog.getAttribute("data-state"), "open")
    await page.keyboard.press("Escape")
    await page.waitForSelector(".dialog", { state: "detached" })
  })
}
