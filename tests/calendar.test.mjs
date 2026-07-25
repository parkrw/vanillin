export default async function run({ page, baseUrl, test, eq }) {
  await page.goto(`${baseUrl}/#calendar`)

  const cal = (pg) => page.locator(`[data-pg="${pg}"]`)
  const day = (pg, key) => page.locator(`[data-pg="${pg}"] [data-day-key="${key}"]`)
  const focusedKey = () => page.evaluate(() => document.activeElement?.dataset.dayKey ?? null)

  await cal("cal-single").waitFor()

  await test("month grid: caption, weekday headers, the weeks of January 2026", async () => {
    eq(await cal("cal-single").locator(".calendar-caption-label").textContent(), "January 2026")
    eq(await cal("cal-single").locator(".calendar-weekday").count(), 7, "seven weekday headers")
    eq(
      await cal("cal-single").locator(".calendar-weekday").first().textContent(),
      "Sun",
      "en-US weeks start on Sunday"
    )
    eq(
      await cal("cal-single").locator(".calendar-weekday").first().getAttribute("abbr"),
      "Sunday",
      "abbr carries the long name"
    )
    eq(await cal("cal-single").locator("[role=grid]").count(), 1, "the month is a grid")
    eq(await cal("cal-single").locator(".calendar-week").count(), 5, "January 2026 spans 5 weeks")
    eq(
      await day("cal-single", "2025-12-28").getAttribute("data-outside"),
      "",
      "leading outside day rendered"
    )
  })

  await test("the selected day is marked and labelled", async () => {
    eq(await day("cal-single", "2026-01-15").getAttribute("data-selected-single"), "true", "selected")
    eq(await day("cal-single", "2026-01-15").getAttribute("aria-selected"), "true", "aria-selected")
    eq(
      await day("cal-single", "2026-01-15").getAttribute("aria-label"),
      "January 15, 2026",
      "long date label"
    )
    eq(await day("cal-single", "2026-01-16").getAttribute("data-selected-single"), null, "others not")
  })

  await test("clicking selects, clicking the selected day clears", async () => {
    await day("cal-single", "2026-01-20").click()
    eq(await cal("cal-single-state").textContent(), "2026-01-20", "state updated")
    await day("cal-single", "2026-01-20").click()
    eq(await cal("cal-single-state").textContent(), "none", "same day clears the selection")
    await day("cal-single", "2026-01-15").click()
    eq(await cal("cal-single-state").textContent(), "2026-01-15", "reselected")
  })

  await test("nav buttons move the displayed month", async () => {
    await cal("cal-single").locator('[aria-label="Next month"]').click()
    eq(await cal("cal-single").locator(".calendar-caption-label").textContent(), "February 2026")
    await cal("cal-single").locator('[aria-label="Previous month"]').click()
    await cal("cal-single").locator('[aria-label="Previous month"]').click()
    eq(await cal("cal-single").locator(".calendar-caption-label").textContent(), "December 2025")
    await cal("cal-single").locator('[aria-label="Next month"]').click()
    eq(await cal("cal-single").locator(".calendar-caption-label").textContent(), "January 2026")
  })

  await test("one tab stop: the selected day carries tabindex 0", async () => {
    eq(await day("cal-single", "2026-01-15").getAttribute("tabindex"), "0", "selected day roves")
    eq(await day("cal-single", "2026-01-16").getAttribute("tabindex"), "-1", "the rest are -1")
  })

  await test("arrows, Home/End and PageDown walk the grid", async () => {
    await day("cal-single", "2026-01-15").focus()
    await page.keyboard.press("ArrowRight")
    eq(await focusedKey(), "2026-01-16", "ArrowRight = next day")
    await page.keyboard.press("ArrowDown")
    eq(await focusedKey(), "2026-01-23", "ArrowDown = next week")
    await page.keyboard.press("ArrowUp")
    await page.keyboard.press("ArrowLeft")
    eq(await focusedKey(), "2026-01-15", "ArrowUp/ArrowLeft come back")
    await page.keyboard.press("Home")
    eq(await focusedKey(), "2026-01-11", "Home = start of the week")
    await page.keyboard.press("End")
    eq(await focusedKey(), "2026-01-17", "End = end of the week")
    await page.keyboard.press("PageDown")
    eq(await focusedKey(), "2026-02-17", "PageDown = same day next month")
    eq(
      await cal("cal-single").locator(".calendar-caption-label").textContent(),
      "February 2026",
      "the grid followed the focus"
    )
    await page.keyboard.down("Shift")
    await page.keyboard.press("PageUp")
    await page.keyboard.up("Shift")
    eq(await focusedKey(), "2025-02-17", "Shift+PageUp = same day a year back")
    // walk back to January 2026 for the remaining tests (a same-URL goto is a
    // same-document hash navigation — it would not reset the page)
    await page.keyboard.down("Shift")
    await page.keyboard.press("PageDown")
    await page.keyboard.up("Shift")
    await page.keyboard.press("PageUp")
    eq(await focusedKey(), "2026-01-17", "back in January 2026")
  })

  await test("focus stepping over the month edge navigates the grid", async () => {
    await day("cal-single", "2026-01-31").focus()
    await page.keyboard.press("ArrowRight")
    eq(await focusedKey(), "2026-02-01", "stepped into February")
    eq(await cal("cal-single").locator(".calendar-caption-label").textContent(), "February 2026")
  })

  await test("disabled matchers block selection", async () => {
    const saturday = day("cal-disabled", "2026-01-17")
    eq(await saturday.isDisabled(), true, "weekend disabled by dayOfWeek")
    eq(await saturday.getAttribute("aria-disabled"), "true", "aria-disabled")
    eq(await day("cal-disabled", "2026-01-05").isDisabled(), true, "before the cutoff disabled")
    eq(await day("cal-disabled", "2026-01-13").isDisabled(), false, "a Tuesday after it is enabled")
  })

  await test("today is marked in the current month", async () => {
    const key = await page.evaluate(() => {
      const now = new Date()
      const pad = (n) => String(n).padStart(2, "0")
      return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
    })
    eq(await day("cal-today", key).getAttribute("data-today"), "", "today's button marked")
    eq(await day("cal-today", key).getAttribute("tabindex"), "0", "today is the tab stop")
  })

  await test("bounds hide outside days and stop the nav", async () => {
    eq(
      await cal("cal-bounded").locator(".calendar-day--hidden").count() > 0,
      true,
      "outside days rendered as empty cells"
    )
    eq(
      await cal("cal-bounded").locator('[aria-label="Previous month"]').isDisabled(),
      true,
      "January 2026 is the start bound"
    )
    eq(
      await cal("cal-bounded").locator('[aria-label="Next month"]').isDisabled(),
      false,
      "next month is in bounds"
    )
  })

  await test("dropdown caption jumps month and year", async () => {
    const dropdowns = cal("cal-dropdown").locator(".calendar-dropdown")
    await dropdowns.first().selectOption("5")
    await dropdowns.last().selectOption("2027")
    eq(await day("cal-dropdown", "2027-06-15").count(), 1, "June 2027 rendered")
    eq(
      await dropdowns.first().locator("option").first().textContent(),
      "Jan",
      "months are short names"
    )
  })

  await test("multiple: days toggle independently", async () => {
    await day("cal-multiple", "2026-01-05").click()
    await day("cal-multiple", "2026-01-09").click()
    eq(await cal("cal-multiple-state").textContent(), "5,9", "both kept, sorted")
    await day("cal-multiple", "2026-01-05").click()
    eq(await cal("cal-multiple-state").textContent(), "9", "clicking again removes one")
    eq(
      await day("cal-multiple", "2026-01-09").getAttribute("data-selected-single"),
      "true",
      "each selected day is marked"
    )
  })

  await test("range: two clicks build it, a third restarts, an earlier click swaps", async () => {
    await day("cal-range", "2026-01-12").click()
    eq(await cal("cal-range-state").textContent(), "2026-01-12 → …", "first click sets from")
    await day("cal-range", "2026-01-16").click()
    eq(await cal("cal-range-state").textContent(), "2026-01-12 → 2026-01-16", "second completes it")
    eq(
      await day("cal-range", "2026-01-12").getAttribute("data-range-start"),
      "true",
      "start marked"
    )
    eq(await day("cal-range", "2026-01-14").getAttribute("data-range-middle"), "true", "middle")
    eq(await day("cal-range", "2026-01-16").getAttribute("data-range-end"), "true", "end marked")
    eq(
      await day("cal-range", "2026-01-14").getAttribute("data-selected-single"),
      null,
      "range days are not marked as single selections"
    )

    await day("cal-range", "2026-01-20").click()
    eq(await cal("cal-range-state").textContent(), "2026-01-20 → …", "third click restarts")
    await day("cal-range", "2026-01-18").click()
    eq(
      await cal("cal-range-state").textContent(),
      "2026-01-18 → 2026-01-20",
      "an earlier second click swaps the ends"
    )
  })

  await test("range: an in-progress range previews the hovered end", async () => {
    await day("cal-range", "2026-01-05").click()
    await day("cal-range", "2026-01-08").hover()
    eq(await day("cal-range", "2026-01-06").getAttribute("data-range-middle"), "true", "preview fill")
    eq(await day("cal-range", "2026-01-08").getAttribute("data-range-end"), "true", "preview end")
    eq(
      await day("cal-range", "2026-01-08").getAttribute("aria-selected"),
      null,
      "the preview is visual only — nothing is selected yet"
    )
    await page.mouse.move(0, 0)
    eq(
      await day("cal-range", "2026-01-06").getAttribute("data-range-middle"),
      null,
      "leaving clears the preview"
    )
  })

  await test("two months share one nav; week numbers label the rows", async () => {
    const captions = cal("cal-range").locator(".calendar-caption-label")
    eq(await captions.count(), 2, "two month grids")
    eq(await captions.first().textContent(), "January 2026")
    eq(await captions.last().textContent(), "February 2026")
    eq(await cal("cal-range").locator('[aria-label="Next month"]').count(), 1, "one nav")
    await cal("cal-range").locator('[aria-label="Next month"]').click()
    eq(await captions.first().textContent(), "February 2026", "the window slides by one month")
    eq(await captions.last().textContent(), "March 2026")
    await cal("cal-range").locator('[aria-label="Previous month"]').click()

    const weekNumbers = cal("cal-range").locator(".calendar-week-number")
    eq(await weekNumbers.first().textContent(), "1", "ISO week 1 holds 2026-01-01")
    eq(await weekNumbers.nth(1).textContent(), "2", "then week 2")
  })

  await test("rtl: arrow keys mirror and the locale sets the week start", async () => {
    eq(
      await cal("cal-rtl").locator(".calendar-weekday").first().getAttribute("abbr"),
      "السبت",
      "ar-EG weeks start on Saturday"
    )
    await day("cal-rtl", "2026-01-15").focus()
    await page.keyboard.press("ArrowLeft")
    eq(await focusedKey(), "2026-01-16", "ArrowLeft moves forward under rtl")
    await page.keyboard.press("ArrowRight")
    eq(await focusedKey(), "2026-01-15", "ArrowRight moves back")
  })
}
