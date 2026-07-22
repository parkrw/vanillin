export default async function run({ page, baseUrl, test, eq }) {
  await page.goto(`${baseUrl}/#toggle-group`)
  await page.waitForSelector(".toggle-group")

  const single = page.locator('[aria-label="Text alignment"]')
  const multiple = page.locator('[aria-label="Text formatting"]')

  await test("group role and item states", async () => {
    eq(await single.getAttribute("role"), "group")
    const left = single.locator('button[aria-label="Align left"]')
    eq(await left.getAttribute("aria-pressed"), "true")
    eq(await left.getAttribute("data-state"), "on")
    eq(await single.locator('button[aria-label="Align center"]').getAttribute("data-state"), "off")
  })

  await test("single: selecting one deselects the other", async () => {
    await single.locator('button[aria-label="Align center"]').click()
    eq(await single.locator('button[aria-label="Align center"]').getAttribute("data-state"), "on")
    eq(await single.locator('button[aria-label="Align left"]').getAttribute("data-state"), "off")
    eq(await single.locator('button[data-state="on"]').count(), 1)
  })

  await test("single: clicking the active item deselects it", async () => {
    await single.locator('button[aria-label="Align center"]').click()
    eq(await single.locator('button[data-state="on"]').count(), 0)
    await single.locator('button[aria-label="Align left"]').click()
  })

  await test("multiple: several items stay on", async () => {
    await multiple.locator('button[aria-label="Toggle italic"]').click()
    eq(await multiple.locator('button[data-state="on"]').count(), 2, "bold + italic")
    await multiple.locator('button[aria-label="Toggle bold"]').click()
    eq(await multiple.locator('button[data-state="on"]').count(), 1, "italic only")
  })

  await test("arrow keys rove focus within the group", async () => {
    await single.locator('button[aria-label="Align left"]').focus()
    await page.keyboard.press("ArrowRight")
    eq(await page.evaluate(() => document.activeElement.getAttribute("aria-label")), "Align center")
    eq(await page.evaluate(() => document.activeElement.tabIndex), 0)
    eq(await single.locator('button[aria-label="Align left"]').evaluate((el) => el.tabIndex), -1)
    await page.keyboard.press("End")
    eq(await page.evaluate(() => document.activeElement.getAttribute("aria-label")), "Align right")
  })

  await test("items reuse toggle styling", async () => {
    const item = single.locator('button[aria-label="Align left"]')
    eq(await item.evaluate((el) => el.classList.contains("toggle")), true)
    eq(await item.evaluate((el) => el.classList.contains("toggle-group-item")), true)
  })

  await test("disabled group disables items", async () => {
    const disabled = page.locator('[aria-label="Disabled group"] button').first()
    eq(await disabled.isDisabled(), true)
  })
}
