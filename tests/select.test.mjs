export default async function run({ page, baseUrl, test, eq }) {
  await page.goto(`${baseUrl}/#select`)

  const trigger = page.locator('[data-pg="sel-trigger"]')

  const waitOpen = (pg = "sel-content") =>
    page.waitForSelector(`[data-pg="${pg}"]:popover-open`)
  const waitAllClosed = () =>
    page.waitForFunction(() => {
      const boxes = document.querySelectorAll('[role="listbox"]')
      return (
        boxes.length > 0 &&
        [...boxes].every(
          (el) => !el.matches(":popover-open") && el.dataset.state === "closed"
        )
      )
    })
  const focusedPg = () =>
    page.evaluate(() => document.activeElement?.getAttribute("data-pg"))

  await test("placeholder + combobox wiring; click opens listbox", async () => {
    eq(await trigger.textContent(), "Select a fruit", "placeholder shown")
    eq(await trigger.getAttribute("role"), "combobox", "role combobox")
    eq(await trigger.getAttribute("aria-expanded"), "false", "closed initially")
    eq(await trigger.getAttribute("data-placeholder"), "", "data-placeholder set")
    await trigger.click()
    await waitOpen()
    eq(await trigger.getAttribute("aria-expanded"), "true", "aria-expanded true")
    eq(await focusedPg(), "sel-item-apple", "first option focused (no value yet)")
  })

  await test("clicking an option selects it, closes, refocuses trigger", async () => {
    await page.locator('[data-pg="sel-item-banana"]').click()
    await waitAllClosed()
    eq(await trigger.textContent(), "Banana", "trigger shows selected label")
    eq(await trigger.getAttribute("data-placeholder"), null, "placeholder attr gone")
    eq(await focusedPg(), "sel-trigger", "focus back on trigger")
  })

  await test("reopening focuses the selected option", async () => {
    await trigger.click()
    await waitOpen()
    eq(await focusedPg(), "sel-item-banana", "selected option focused")
    const banana = page.locator('[data-pg="sel-item-banana"]')
    eq(await banana.getAttribute("aria-selected"), "true", "aria-selected")
    eq(await banana.getAttribute("data-state"), "checked", "data-state checked")
    await page.keyboard.press("Escape")
    await waitAllClosed()
  })

  await test("keyboard: ArrowDown opens, arrows skip disabled, Enter selects", async () => {
    await trigger.focus()
    await page.keyboard.press("ArrowDown")
    await waitOpen()
    eq(await focusedPg(), "sel-item-banana", "opens on selected")
    await page.keyboard.press("ArrowDown")
    eq(await focusedPg(), "sel-item-cherry", "disabled Blueberry skipped")
    await page.keyboard.press("Enter")
    await waitAllClosed()
    eq(await trigger.textContent(), "Cherry", "Enter selected Cherry")
    eq(await focusedPg(), "sel-trigger", "focus back on trigger")
  })

  await test("Escape closes without changing value, outside click closes", async () => {
    await trigger.click()
    await waitOpen()
    await page.keyboard.press("ArrowUp")
    await page.keyboard.press("Escape")
    await waitAllClosed()
    eq(await trigger.textContent(), "Cherry", "value unchanged after Esc")
    eq(await focusedPg(), "sel-trigger", "trigger refocused")

    await trigger.click()
    await waitOpen()
    await page.locator("h2").click()
    await waitAllClosed()
    eq(await trigger.getAttribute("aria-expanded"), "false", "state synced")
  })

  await test("open typeahead focuses the matching option", async () => {
    await trigger.click()
    await waitOpen()
    await page.keyboard.type("ap")
    eq(await focusedPg(), "sel-item-apple", "Apple focused by typeahead")
    await page.keyboard.press("Escape")
    await waitAllClosed()
  })

  await test("closed typeahead selects without opening", async () => {
    await trigger.focus()
    await page.keyboard.press("b")
    await page.waitForFunction(
      () => document.querySelector('[data-pg="sel-trigger"]').textContent === "Banana"
    )
    const openCount = await page.evaluate(
      () => document.querySelectorAll('[role="listbox"]:popover-open').length
    )
    eq(openCount, 0, "listbox stayed closed")
  })

  await test("long list scrolls the focused option into view", async () => {
    await page.locator('[data-pg="sel-long-trigger"]').click()
    await waitOpen("sel-long-content")
    await page.keyboard.press("End")
    await page.waitForFunction(() => {
      const el = document.querySelector('[data-pg="sel-long-content"]')
      return el.scrollTop > 0 && document.activeElement?.textContent === "Number 40"
    })
    await page.keyboard.press("Escape")
    await waitAllClosed()
  })

  await test("controlled value + hidden form input", async () => {
    const readout = page.locator('[data-pg="sel-ctrl-state"]')
    eq(await readout.textContent(), "none", "initially none")
    await page.locator('[data-pg="sel-ctrl-trigger"]').click()
    await page.waitForSelector('[role="listbox"]:popover-open')
    await page.locator('[data-pg="sel-item-cat"]').click()
    await waitAllClosed()
    eq(await readout.textContent(), "cat", "onValueChange fired")
    const hidden = await page.evaluate(() => {
      const input = document.querySelector('[data-pg="sel-form"] input[name="pet"]')
      return input ? { type: input.type, value: input.value } : null
    })
    eq(hidden?.type, "hidden", "hidden input rendered")
    eq(hidden?.value, "cat", "hidden input carries the value")
  })

  await test("click on the open trigger closes it", async () => {
    await trigger.click()
    await waitOpen()
    await trigger.click()
    await waitAllClosed()
    eq(await trigger.getAttribute("aria-expanded"), "false", "closed after second click")
  })

  await test("disabled trigger does not open", async () => {
    const disabledTrigger = page.locator('[data-pg="sel-disabled-trigger"]')
    eq(await disabledTrigger.textContent(), "Apple", "items-prop label shown")
    await disabledTrigger.click({ force: true })
    await page.waitForTimeout(150)
    const openCount = await page.evaluate(
      () => document.querySelectorAll('[role="listbox"]:popover-open').length
    )
    eq(openCount, 0, "stays closed")
  })
}
