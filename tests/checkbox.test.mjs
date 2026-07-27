export default async function run({ page, baseUrl, test, eq }) {
  await page.goto(`${baseUrl}/#checkbox`)
  await page.waitForSelector(".checkbox")

  const terms = page.locator("#terms")

  await test("initial state: unchecked", async () => {
    eq(await terms.getAttribute("role"), "checkbox")
    eq(await terms.getAttribute("aria-checked"), "false")
    eq(await terms.getAttribute("data-state"), "unchecked")
  })

  await test("click toggles checked", async () => {
    eq(await terms.getAttribute("data-state"), "unchecked")
    await terms.click()
    eq(await terms.getAttribute("aria-checked"), "true")
    eq(await terms.getAttribute("data-state"), "checked")
    await terms.click()
    eq(await terms.getAttribute("aria-checked"), "false")
    eq(await terms.getAttribute("data-state"), "unchecked")
  })

  await test("defaultChecked starts checked", async () => {
    const checked = page.locator('[aria-label="Checked by default"]')
    eq(await checked.getAttribute("aria-checked"), "true")
    eq(await checked.getAttribute("data-state"), "checked")
  })

  await test("disabled checkbox cannot be clicked", async () => {
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
    const cb = page.locator("#newsletter")
    const label = page.locator('label[for="newsletter"]')
    eq(await cb.getAttribute("data-state"), "checked")
    eq((await label.textContent()).includes("yes"), true)
    await cb.click()
    eq(await cb.getAttribute("data-state"), "unchecked")
    eq((await label.textContent()).includes("no"), true)
    await cb.click()
    eq(await cb.getAttribute("data-state"), "checked")
  })

  await test("aria-invalid is forwarded", async () => {
    const invalid = page.locator('[aria-label="Invalid"]')
    eq(await invalid.getAttribute("aria-invalid"), "true")
  })
}
