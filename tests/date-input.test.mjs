export default async function run({ page, baseUrl, test, eq }) {
  await page.goto(`${baseUrl}/#date-picker`)
  await page.locator('[data-pg="dp-typed-input"]').waitFor()

  const input = () => page.locator('[data-pg="dp-typed-input"]')
  const state = () => page.locator('[data-pg="dp-typed-state"]')

  await test("date-input: typing 'tomorrow' and blurring parses to a date", async () => {
    await input().fill("tomorrow")
    await input().blur()
    const val = await state().textContent()
    eq(val !== "none", true, "state shows a date")
    // The input should have been reformatted (not still "tomorrow")
    const fieldVal = await input().inputValue()
    eq(fieldVal.includes("tomorrow"), false, "input reformatted")
  })

  await test("date-input: typing 'next fri' and blurring parses", async () => {
    await input().fill("next fri")
    await input().blur()
    const val = await state().textContent()
    eq(val !== "none", true, "state shows a date for 'next fri'")
  })

  await test("date-input: typing numeric date parses in en-US order", async () => {
    await input().fill("3/4/2026")
    await input().blur()
    const val = await state().textContent()
    eq(val, "2026-03-04", "3/4/2026 parsed as March 4")
  })

  await test("date-input: calendar syncs with typed date", async () => {
    // Type a known date
    await input().fill("1/15/2026")
    await input().blur()
    eq(await state().textContent(), "2026-01-15", "Jan 15 parsed")

    // Open calendar and check it shows the right month
    await page.locator('[data-pg="dp-typed-trigger"]').click()
    await page.waitForFunction(() => {
      const el = document.querySelector('[data-pg="dp-typed-content"]')
      return el && el.matches(":popover-open")
    })
    // The selected day should be visible
    const selected = page.locator('[data-pg="dp-typed-calendar"] .calendar-day-button[aria-selected="true"]')
    eq(await selected.count(), 1, "one day selected in calendar")
    // Close
    await page.keyboard.press("Escape")
  })

  await test("date-input: unparseable text stays as typed with aria-invalid", async () => {
    await input().fill("not a real date")
    await input().blur()
    const fieldVal = await input().inputValue()
    eq(fieldVal, "not a real date", "text preserved")
    eq(await input().getAttribute("aria-invalid"), "true", "aria-invalid set")
    eq(await state().textContent(), "none", "state cleared on invalid")
  })

  await test("date-input: live region announces interpretation", async () => {
    // Type a valid date to get the announcement
    await input().fill("today")
    await input().blur()
    // Find the live region (sibling of input)
    const live = page.locator(".date-input-live")
    const text = await live.first().textContent()
    eq(text.startsWith("Date set to"), true, "announces 'Date set to ...'")
  })

  await test("date-input: live region announces error for bad input", async () => {
    await input().fill("xyz")
    await input().blur()
    const live = page.locator(".date-input-live")
    const text = await live.first().textContent()
    eq(text, "Unrecognised date format", "error announced")
  })

  await test("date-input: clearing the field resets state", async () => {
    // First set a value
    await input().fill("today")
    await input().blur()
    eq((await state().textContent()) !== "none", true, "has value")
    // Now clear
    await input().fill("")
    await input().blur()
    eq(await state().textContent(), "none", "cleared")
    eq(await input().getAttribute("aria-invalid"), null, "aria-invalid removed")
  })
}
