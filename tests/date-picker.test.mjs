export default async function run({ page, baseUrl, test, eq }) {
  await page.goto(`${baseUrl}/#date-picker`)

  const trigger = (pg) => page.locator(`[data-pg="${pg}"]`)
  const content = (pg) => page.locator(`[data-pg="${pg}"]`)
  const state = (pg) => page.locator(`[data-pg="${pg}"]`)
  const day = (pg, key) => page.locator(`[data-pg="${pg}"] [data-day-key="${key}"]`)

  const waitOpen = (pg) =>
    page.waitForFunction(
      (sel) => {
        const el = document.querySelector(`[data-pg="${sel}"]`)
        return el && el.matches(":popover-open")
      },
      pg
    )

  const waitClosed = (pg) =>
    page.waitForFunction(
      (sel) => {
        const el = document.querySelector(`[data-pg="${sel}"]`)
        return el && !el.matches(":popover-open") && el.dataset.state === "closed"
      },
      pg
    )

  await trigger("dp-single-trigger").waitFor()

  await test("single: trigger opens the popover with a calendar inside", async () => {
    await trigger("dp-single-trigger").click()
    await waitOpen("dp-single-content")
    const calendarVisible = await content("dp-single-calendar").isVisible()
    eq(calendarVisible, true, "calendar is visible inside popover")
    eq(
      await trigger("dp-single-trigger").getAttribute("aria-expanded"),
      "true",
      "trigger aria-expanded"
    )
  })

  await test("single: picking a day updates the trigger label and closes the popover", async () => {
    await day("dp-single-calendar", "2026-01-20").click()
    await waitClosed("dp-single-content")
    eq(await state("dp-single-state").textContent(), "2026-01-20", "state updated")
    eq(
      await trigger("dp-single-trigger").getAttribute("aria-expanded"),
      "false",
      "trigger shows closed"
    )
    // trigger text should contain the formatted date, not the placeholder
    const text = await trigger("dp-single-trigger").textContent()
    eq(text.includes("Pick a date"), false, "placeholder replaced")
    eq(
      await trigger("dp-single-trigger").getAttribute("data-empty"),
      null,
      "data-empty removed"
    )
  })

  await test("single: trigger initially shows placeholder with data-empty", async () => {
    // reopen and clear: pick the same day to deselect
    await trigger("dp-single-trigger").click()
    await waitOpen("dp-single-content")
    await day("dp-single-calendar", "2026-01-20").click()
    await waitClosed("dp-single-content")
    eq(await state("dp-single-state").textContent(), "none", "cleared")
    eq(
      await trigger("dp-single-trigger").getAttribute("data-empty"),
      "true",
      "data-empty restored"
    )
    const text = await trigger("dp-single-trigger").textContent()
    eq(text.includes("Pick a date"), true, "placeholder shown when empty")
  })

  await test("single: keyboard — open, arrows, Enter to select", async () => {
    // focus trigger and press Enter to open
    await trigger("dp-single-trigger").focus()
    await page.keyboard.press("Enter")
    await waitOpen("dp-single-content")

    // the calendar's roving tab stop should be today or first of month;
    // tab into the calendar grid and use arrows
    const firstButton = content("dp-single-calendar").locator(".calendar-day-button[tabindex='0']")
    await firstButton.focus()
    const startKey = await page.evaluate(() => document.activeElement?.dataset.dayKey ?? null)

    await page.keyboard.press("ArrowRight")
    const afterRight = await page.evaluate(() => document.activeElement?.dataset.dayKey ?? null)
    eq(afterRight !== startKey, true, "arrow moved focus")

    // press Enter to select
    await page.keyboard.press("Enter")
    await waitClosed("dp-single-content")
    eq(await state("dp-single-state").textContent() !== "none", true, "Enter selected a date")
  })

  // Reset single state for cleanliness: deselect
  await trigger("dp-single-trigger").click()
  await waitOpen("dp-single-content")
  const selectedKey = await state("dp-single-state").textContent()
  if (selectedKey !== "none") {
    await day("dp-single-calendar", selectedKey).click()
    await waitClosed("dp-single-content")
  } else {
    await page.keyboard.press("Escape")
    await waitClosed("dp-single-content")
  }

  await test("range: two clicks build the range and close", async () => {
    await trigger("dp-range-trigger").click()
    await waitOpen("dp-range-content")

    // pick start
    await day("dp-range-calendar", "2026-01-12").click()
    // popover should still be open (only from is set)
    eq(
      await content("dp-range-content").evaluate((el) => el.matches(":popover-open")),
      true,
      "stays open after first click"
    )
    eq(await state("dp-range-state").textContent(), "2026-01-12 → …", "from set, to pending")

    // pick end
    await day("dp-range-calendar", "2026-01-16").click()
    await waitClosed("dp-range-content")
    eq(
      await state("dp-range-state").textContent(),
      "2026-01-12 → 2026-01-16",
      "range complete, popover closed"
    )

    // trigger should show formatted range
    const text = await trigger("dp-range-trigger").textContent()
    eq(text.includes("Pick a date range"), false, "placeholder replaced by range")
  })

  await test("dob: dropdown caption is present, selecting closes", async () => {
    await trigger("dp-dob-trigger").click()
    await waitOpen("dp-dob-content")

    // dropdown caption should have month/year selects
    const dropdowns = content("dp-dob-calendar").locator(".calendar-dropdown")
    eq(await dropdowns.count(), 2, "month + year dropdowns")

    // pick a date
    await day("dp-dob-calendar", "1990-01-15").click()
    await waitClosed("dp-dob-content")
    eq(await state("dp-dob-state").textContent(), "1990-01-15", "dob set")
  })
}
