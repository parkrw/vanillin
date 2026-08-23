export default async function run({ page, baseUrl, test, eq }) {
  await page.goto(`${baseUrl}/#badge`)
  const chips = page.locator('[data-pg="badge-chips"]')
  await chips.waitFor()

  await test("as='a' renders a real anchor; the default stays a span", async () => {
    const links = page.locator('[data-pg="badge-links"] .badge')
    eq(await links.count(), 2)
    eq(
      await links.first().evaluate((el) => `${el.tagName} ${el.getAttribute("href")}`),
      "A #installation",
    )
    // Counter-precondition: without `as`, no anchor is produced.
    eq(
      await chips.locator(".badge--chip").first().evaluate((el) => el.tagName),
      "SPAN",
    )
  })

  await test("chip: renders as a secondary badge with the chip modifier", async () => {
    const cls = await chips.locator(".badge--chip").first().getAttribute("class")
    eq(cls.includes("badge"), true, `has badge base: ${cls}`)
    eq(cls.includes("badge--secondary"), true, `has secondary variant: ${cls}`)
  })

  await test("chip: static chip has no remove button", async () => {
    const count = await chips
      .locator('.badge--chip:has-text("Static") .badge-chip-remove')
      .count()
    eq(count, 0, "no remove button without onRemove")
  })

  await test("chip: remove button is named after the label and dismisses", async () => {
    const before = await chips.locator(".badge--chip").count()
    const remove = chips.getByRole("button", { name: "Remove Design" })
    await remove.waitFor()
    await remove.click()
    await chips.locator('.badge--chip:has-text("Design")').waitFor({ state: "detached" })
    const after = await chips.locator(".badge--chip").count()
    eq(after, before - 1, "one chip removed")
  })

  await test("chip: remove button is skipped by Tab", async () => {
    const tabIndex = await chips
      .locator(".badge-chip-remove")
      .first()
      .evaluate((el) => el.tabIndex)
    eq(tabIndex, -1, "remove button is tabIndex -1")
  })

  await test("chip: disabled disables the remove button, not the chip", async () => {
    const chip = chips.locator('.badge--chip:has-text("Disabled")')
    const isDisabled = await chip
      .locator(".badge-chip-remove")
      .evaluate((el) => el.disabled)
    eq(isDisabled, true, "remove button disabled")
    const chipDisabledAttr = await chip.getAttribute("disabled")
    eq(chipDisabledAttr, null, "chip span carries no disabled attribute")
  })

  await test("chip: long label truncates instead of growing the chip", async () => {
    const text = chips.locator('.badge--chip .badge-chip-text').last()
    const { clientWidth, scrollWidth, overflow } = await text.evaluate((el) => ({
      clientWidth: el.clientWidth,
      scrollWidth: el.scrollWidth,
      overflow: getComputedStyle(el).textOverflow,
    }))
    eq(scrollWidth > clientWidth, true, `label overflows: ${scrollWidth} > ${clientWidth}`)
    eq(overflow, "ellipsis", "ellipsis applied")
  })

  await test("chip: combobox uses the shared implementation", async () => {
    await page.goto(`${baseUrl}/#combobox`)
    const input = page.locator('[data-pg="cbx-multi-input"]')
    await input.waitFor()
    await input.click()
    await page.locator('[data-pg="cbx-item-ts"]').click()
    const cls = await page
      .locator(".combobox-chip")
      .first()
      .getAttribute("class")
    eq(cls.includes("badge--chip"), true, `combobox chip is a Chip: ${cls}`)
  })
}
