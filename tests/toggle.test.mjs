export default async function run({ page, baseUrl, test, eq }) {
  await page.goto(`${baseUrl}/#toggle`)
  await page.waitForSelector(".toggle")

  const bold = page.locator('button[aria-label="Toggle bold"]').first()
  const controlled = page.locator('button:has-text("Controlled:")')

  await test("initial state: not pressed", async () => {
    eq(await bold.getAttribute("aria-pressed"), "false")
    eq(await bold.getAttribute("data-state"), "off")
  })

  await test("click toggles pressed state", async () => {
    eq(await bold.getAttribute("data-state"), "off")
    await bold.click()
    eq(await bold.getAttribute("aria-pressed"), "true")
    eq(await bold.getAttribute("data-state"), "on")
    await bold.click()
    eq(await bold.getAttribute("aria-pressed"), "false")
    eq(await bold.getAttribute("data-state"), "off")
  })

  await test("defaultPressed starts on", async () => {
    const pressed = page.locator('button:has-text("Pressed by default")')
    eq(await pressed.getAttribute("aria-pressed"), "true")
    eq(await pressed.getAttribute("data-state"), "on")
  })

  await test("disabled toggle cannot be clicked", async () => {
    const disabled = page.locator('.pg-section:has(h3:has-text("States")) button:has-text("Disabled")')
    eq(await disabled.isDisabled(), true)
    eq(await disabled.getAttribute("data-state"), "off")
  })

  await test("controlled mode syncs pressed state", async () => {
    eq(await controlled.getAttribute("data-state"), "off")
    await controlled.click()
    eq(await controlled.getAttribute("data-state"), "on")
    eq(await controlled.textContent(), "Controlled: on")
    await controlled.click()
    eq(await controlled.getAttribute("data-state"), "off")
    eq(await controlled.textContent(), "Controlled: off")
  })

  await test("variant=outline has the modifier class", async () => {
    const outline = page.locator('.pg-section:has(h3:has-text("Outline")) .toggle')
    eq(await outline.evaluate((el) => el.classList.contains("toggle--outline")), true)
  })

  await test("size modifier classes applied", async () => {
    const sm = page.locator('.pg-section:has(h3:has-text("Sizes")) .toggle').first()
    const lg = page.locator('.pg-section:has(h3:has-text("Sizes")) .toggle').last()
    eq(await sm.evaluate((el) => el.classList.contains("toggle--sm")), true)
    eq(await lg.evaluate((el) => el.classList.contains("toggle--lg")), true)
  })
}
