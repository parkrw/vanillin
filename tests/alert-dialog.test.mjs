export default async function run({ page, baseUrl, test, eq }) {
  await page.goto(`${baseUrl}/#alert-dialog`)

  const trigger = page.locator('button:has-text("Delete account")')
  const dialog = page.locator(".alert-dialog")

  await test("opens with alertdialog role and no X button", async () => {
    await trigger.click()
    await page.waitForSelector('.alert-dialog[data-state="open"]')
    eq(await dialog.getAttribute("role"), "alertdialog")
    eq(await dialog.evaluate((el) => el.matches(":modal")), true, "modal")
    eq(await dialog.locator(".dialog-close").count(), 0, "no X")
  })

  await test("title and description are wired via aria", async () => {
    const [title, description] = await dialog.evaluate((el) => [
      document.getElementById(el.getAttribute("aria-labelledby"))?.textContent,
      document.getElementById(el.getAttribute("aria-describedby"))?.textContent,
    ])
    eq(title, "Are you absolutely sure?", "labelledby")
    eq(
      description,
      "This action cannot be undone. This will permanently delete your account.",
      "describedby"
    )
  })

  await test("backdrop click does not close", async () => {
    await page.mouse.click(5, 5)
    await page.waitForTimeout(100)
    eq(await dialog.getAttribute("data-state"), "open")
  })

  await test("Escape closes", async () => {
    await page.keyboard.press("Escape")
    await page.waitForSelector(".alert-dialog", { state: "detached" })
  })

  await test("Cancel closes", async () => {
    await trigger.click()
    await page.waitForSelector('.alert-dialog[data-state="open"]')
    await dialog.locator('button:has-text("Cancel")').click()
    await page.waitForSelector(".alert-dialog", { state: "detached" })
  })

  await test("Action closes", async () => {
    await trigger.click()
    await page.waitForSelector('.alert-dialog[data-state="open"]')
    await dialog.locator('button:has-text("Continue")').click()
    await page.waitForSelector(".alert-dialog", { state: "detached" })
  })
}
