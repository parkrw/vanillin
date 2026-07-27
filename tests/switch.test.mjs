export default async function run({ page, baseUrl, test, eq }) {
  await page.goto(`${baseUrl}/#switch`)
  await page.waitForSelector(".switch")

  const airplane = page.locator("#airplane-mode")

  await test("initial state: unchecked with switch role", async () => {
    eq(await airplane.getAttribute("role"), "switch")
    eq(await airplane.getAttribute("aria-checked"), "false")
    eq(await airplane.getAttribute("data-state"), "unchecked")
  })

  await test("click toggles checked", async () => {
    eq(await airplane.getAttribute("data-state"), "unchecked")
    await airplane.click()
    eq(await airplane.getAttribute("aria-checked"), "true")
    eq(await airplane.getAttribute("data-state"), "checked")
    await airplane.click()
    eq(await airplane.getAttribute("aria-checked"), "false")
    eq(await airplane.getAttribute("data-state"), "unchecked")
  })

  await test("defaultChecked starts checked", async () => {
    const checked = page.locator('[aria-label="Checked by default"]')
    eq(await checked.getAttribute("aria-checked"), "true")
    eq(await checked.getAttribute("data-state"), "checked")
  })

  await test("disabled switch cannot be clicked", async () => {
    const disabled = page.locator('[aria-label="Disabled"]')
    eq(await disabled.isDisabled(), true)
    eq(await disabled.getAttribute("data-state"), "unchecked")
  })

  await test("disabled + checked", async () => {
    const dc = page.locator('[aria-label="Disabled checked"]')
    eq(await dc.isDisabled(), true)
    eq(await dc.getAttribute("data-state"), "checked")
  })

  await test("controlled mode syncs label", async () => {
    const sw = page.locator("#notifications")
    const label = page.locator('label[for="notifications"]')
    eq(await sw.getAttribute("data-state"), "checked")
    eq((await label.textContent()).includes("on"), true)
    await sw.click()
    eq(await sw.getAttribute("data-state"), "unchecked")
    eq((await label.textContent()).includes("off"), true)
    await sw.click()
    eq(await sw.getAttribute("data-state"), "checked")
  })

  await test("thumb element is present", async () => {
    eq(await airplane.locator(".switch-thumb").count(), 1)
  })
}
