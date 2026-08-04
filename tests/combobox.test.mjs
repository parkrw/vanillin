export default async function run({ page, baseUrl, test, eq }) {
  await page.goto(`${baseUrl}/#combobox`)

  const input = page.locator('[data-pg="cbx-input"]')

  const waitOpen = (pg = "cbx-content") =>
    page.waitForSelector(`[data-pg="${pg}"]:popover-open`)
  const waitAllClosed = () =>
    page.waitForFunction(() => {
      const popups = document.querySelectorAll(".combobox-content")
      return (
        popups.length > 0 &&
        [...popups].every(
          (el) => !el.matches(":popover-open") && el.dataset.state === "closed"
        )
      )
    })
  const highlightedPg = () =>
    page.evaluate(() => {
      const active = document.activeElement
      const id = active?.getAttribute("aria-activedescendant")
      return id ? document.getElementById(id)?.getAttribute("data-pg") : null
    })
  const visibleItems = (pg) =>
    page.evaluate((sel) => {
      return [
        ...document.querySelectorAll(`[data-pg="${sel}"] [role="option"]:not([hidden])`),
      ].map((el) => el.dataset.value)
    }, pg)

  await test("wiring: click opens, all items visible, focus stays in input", async () => {
    eq(await input.getAttribute("role"), "combobox", "role combobox")
    eq(await input.getAttribute("aria-expanded"), "false", "closed initially")
    eq(await input.getAttribute("aria-autocomplete"), "list", "aria-autocomplete")
    await input.click()
    await waitOpen()
    eq(await input.getAttribute("aria-expanded"), "true", "aria-expanded true")
    eq(
      (await visibleItems("cbx-content")).join(","),
      "next,svelte,nuxt,remix,astro,ember",
      "all items visible"
    )
    const focusIsInput = await page.evaluate(
      () => document.activeElement?.getAttribute("data-pg") === "cbx-input"
    )
    eq(focusIsInput, true, "focus stays in the input")
  })

  await test("typing filters; empty state on no match; clearing restores", async () => {
    await input.fill("nu")
    await page.waitForFunction(() => {
      const els = document.querySelectorAll(
        '[data-pg="cbx-content"] [role="option"]:not([hidden])'
      )
      return els.length === 1 && els[0].dataset.value === "nuxt"
    })
    const filteredDisplay = await page.evaluate(
      () => getComputedStyle(document.querySelector('[data-pg="cbx-item-next"]')).display
    )
    eq(filteredDisplay, "none", "filtered item is actually display:none")
    await input.fill("zzz")
    await page.waitForSelector('[data-pg="cbx-empty"]')
    eq((await visibleItems("cbx-content")).length, 0, "nothing visible")
    await input.fill("")
    await page.waitForFunction(() => !document.querySelector('[data-pg="cbx-empty"]'))
    eq((await visibleItems("cbx-content")).length, 6, "all items back")
  })

  await test("arrows highlight (activedescendant), Enter selects and closes", async () => {
    await page.keyboard.press("ArrowDown")
    eq(await highlightedPg(), "cbx-item-next", "first option highlighted")
    await page.keyboard.press("ArrowDown")
    eq(await highlightedPg(), "cbx-item-svelte", "second option highlighted")
    await page.keyboard.press("Enter")
    await waitAllClosed()
    eq(await input.inputValue(), "SvelteKit", "input shows selected label")
    eq(await input.getAttribute("aria-expanded"), "false", "closed")
    const focusIsInput = await page.evaluate(
      () => document.activeElement?.getAttribute("data-pg") === "cbx-input"
    )
    eq(focusIsInput, true, "focus still in the input")
  })

  await test("reopen shows all items (query reset) and marks selection", async () => {
    await input.click()
    await waitOpen()
    eq((await visibleItems("cbx-content")).length, 6, "selected label does not filter")
    const svelte = page.locator('[data-pg="cbx-item-svelte"]')
    eq(await svelte.getAttribute("aria-selected"), "true", "aria-selected")
    eq(await svelte.getAttribute("data-state"), "checked", "data-state checked")
  })

  await test("Escape closes and reverts typed text to the selected label", async () => {
    await input.fill("rem")
    await page.waitForFunction(() => {
      const els = document.querySelectorAll(
        '[data-pg="cbx-content"] [role="option"]:not([hidden])'
      )
      return els.length === 1 && els[0].dataset.value === "remix"
    })
    await page.keyboard.press("Escape")
    await waitAllClosed()
    eq(await input.inputValue(), "SvelteKit", "reverted to selected label")
  })

  await test("disabled item is skipped by arrow navigation", async () => {
    await input.click()
    await waitOpen()
    await page.keyboard.press("End") // caret move — no highlight yet, not hijacked
    await page.keyboard.press("ArrowUp")
    eq(await highlightedPg(), "cbx-item-astro", "wraps to last enabled (Ember skipped)")
    await page.keyboard.press("Escape")
    await waitAllClosed()
  })

  await test("input click while open keeps it open; outside click closes", async () => {
    await input.click()
    await waitOpen()
    await input.click()
    await page.waitForTimeout(150)
    eq(await input.getAttribute("aria-expanded"), "true", "still open after input click")
    await page.locator("h2").click()
    await waitAllClosed()
    eq(await input.getAttribute("aria-expanded"), "false", "state synced closed")
  })

  await test("click on an option selects it", async () => {
    await input.click()
    await waitOpen()
    await page.locator('[data-pg="cbx-item-next"]').click()
    await waitAllClosed()
    eq(await input.inputValue(), "Next.js", "clicked option selected")
  })

  await test("autoHighlight: typing highlights first match, group hides", async () => {
    const ahInput = page.locator('[data-pg="cbx-ah-input"]')
    await ahInput.click()
    await waitOpen("cbx-ah-content")
    await ahInput.fill("ba")
    await page.waitForFunction(() => {
      const id = document
        .querySelector('[data-pg="cbx-ah-input"]')
        ?.getAttribute("aria-activedescendant")
      return id && document.getElementById(id)?.getAttribute("data-pg") === "cbx-item-banana"
    })
    const vegGroupHidden = await page.evaluate(() => {
      const group = document.querySelector('[data-pg="cbx-group-vegetables"]')
      return getComputedStyle(group).display === "none"
    })
    eq(vegGroupHidden, true, "empty group hidden via :has()")
    await page.keyboard.press("Enter")
    await waitAllClosed()
    eq(await ahInput.inputValue(), "Banana", "autoHighlighted option selected")
  })

  await test("controlled value + native select for validation (items prop, function list)", async () => {
    const readout = page.locator('[data-pg="cbx-ctrl-state"]')
    eq(await readout.textContent(), "none", "initially none")
    const ctrlInput = page.locator('[data-pg="cbx-ctrl-input"]')
    await ctrlInput.click()
    await waitOpen("cbx-ctrl-content")
    await ctrlInput.fill("east")
    await page.waitForFunction(() => {
      const els = document.querySelectorAll(
        '[data-pg="cbx-ctrl-content"] [role="option"]:not([hidden])'
      )
      return els.length === 1 && els[0].dataset.value === "est"
    })
    await page.locator('[data-pg="cbx-item-est"]').click()
    await waitAllClosed()
    eq(await readout.textContent(), "est", "onValueChange fired")
    eq(await ctrlInput.inputValue(), "Eastern (EST)", "items-prop label shown")
    const hidden = await page.evaluate(() => {
      const el = document.querySelector('[data-pg="cbx-form"] select[name="timezone"]')
      return el ? { tag: el.tagName, value: el.value, hidden: el.getAttribute("aria-hidden") } : null
    })
    eq(hidden?.tag, "SELECT", "native select rendered")
    eq(hidden?.value, "est", "native select carries the value")
    eq(hidden?.hidden, "true", "aria-hidden on native select")
  })

  await test("disabled combobox does not open; shows items-prop label", async () => {
    const disabledInput = page.locator('[data-pg="cbx-disabled-input"]')
    eq(await disabledInput.inputValue(), "UTC", "defaultValue label shown")
    await disabledInput.click({ force: true })
    await page.waitForTimeout(150)
    const openCount = await page.evaluate(
      () => document.querySelectorAll(".combobox-content:popover-open").length
    )
    eq(openCount, 0, "stays closed")
  })

  // ---- multiple-select tests ----

  const multiInput = page.locator('[data-pg="cbx-multi-input"]')
  const multiState = page.locator('[data-pg="cbx-multi-state"]')
  const waitMultiOpen = () =>
    page.waitForSelector('[data-pg="cbx-multi-content"]:popover-open')

  await test("multi: select two items → two chips, popup stays open", async () => {
    await multiInput.click()
    await waitMultiOpen()
    await page.locator('[data-pg="cbx-item-js"]').click()
    // Popup stays open after first selection
    await page.waitForTimeout(100)
    eq(
      await multiInput.getAttribute("aria-expanded"),
      "true",
      "still open after first pick"
    )
    await page.locator('[data-pg="cbx-item-ts"]').click()
    await page.waitForTimeout(100)
    eq(await multiState.textContent(), "js, ts", "two values selected")
    const chipCount = await page.evaluate(
      () => document.querySelectorAll('[data-pg="cbx-multi-input"] ~ .combobox-chip, .combobox-input-group .combobox-chip').length
    )
    // Count chips by looking inside the input group that contains the multi input
    const chips = await page.evaluate(() => {
      const group = document.querySelector('[data-pg="cbx-multi-input"]')?.closest('.combobox-input-group')
      return group ? [...group.querySelectorAll('.combobox-chip')].map(c => c.textContent.trim()) : []
    })
    eq(chips.length, 2, "two chips rendered")
    // aria-multiselectable on the listbox
    const multisel = await page.evaluate(() => {
      const list = document.querySelector('[data-pg="cbx-multi-content"] [role="listbox"]')
      return list?.getAttribute("aria-multiselectable")
    })
    eq(multisel, "true", "aria-multiselectable on listbox")
    // Close the popup for next test
    await page.keyboard.press("Escape")
    await waitAllClosed()
  })

  await test("multi: Backspace on empty input removes the last chip", async () => {
    eq(await multiState.textContent(), "js, ts", "starts with two")
    await multiInput.click()
    await waitMultiOpen()
    // Input should be empty (query mode in multiple)
    eq(await multiInput.inputValue(), "", "input is empty query field")
    await page.keyboard.press("Backspace")
    await page.waitForTimeout(100)
    eq(await multiState.textContent(), "js", "last chip removed")
    await page.keyboard.press("Escape")
    await waitAllClosed()
  })

  await test("multi: showClear empties the control", async () => {
    eq(await multiState.textContent(), "js", "starts with one")
    const clearBtn = page.locator(
      '[data-pg="cbx-multi-input"]'
    ).locator('..').locator('.combobox-clear')
    // Use evaluate to find the clear button in the same input-group
    const cleared = await page.evaluate(() => {
      const input = document.querySelector('[data-pg="cbx-multi-input"]')
      const group = input?.closest('.combobox-input-group')
      const btn = group?.querySelector('.combobox-clear')
      if (btn) { btn.click(); return true }
      return false
    })
    eq(cleared, true, "clear button found and clicked")
    await page.waitForTimeout(100)
    eq(await multiState.textContent(), "none", "value cleared")
  })

  await test("multi: toggle deselects a checked item", async () => {
    await multiInput.click()
    await waitMultiOpen()
    // Select go and py
    await page.locator('[data-pg="cbx-item-go"]').click()
    await page.locator('[data-pg="cbx-item-py"]').click()
    await page.waitForTimeout(100)
    eq(await multiState.textContent(), "go, py", "two selected")
    // Deselect go
    await page.locator('[data-pg="cbx-item-go"]').click()
    await page.waitForTimeout(100)
    eq(await multiState.textContent(), "py", "go deselected")
    // Clean up
    await page.locator('[data-pg="cbx-item-py"]').click()
    await page.keyboard.press("Escape")
    await waitAllClosed()
  })

  await test("showClear single: appears after selection, clears value", async () => {
    const clearInput = page.locator('[data-pg="cbx-clear-input"]')
    // No clear button initially (nothing selected)
    const noClear = await page.evaluate(() => {
      const group = document.querySelector('[data-pg="cbx-clear-input"]')?.closest('.combobox-input-group')
      return group?.querySelector('.combobox-clear') === null
    })
    eq(noClear, true, "no clear button when empty")
    // Select something
    await clearInput.click()
    await page.waitForSelector('[data-pg="cbx-clear-content"]:popover-open')
    await page.locator('[data-pg="cbx-clear-item-next"]').click()
    await waitAllClosed()
    eq(await clearInput.inputValue(), "Next.js", "value selected")
    // Clear button should now exist
    const hasBtn = await page.evaluate(() => {
      const group = document.querySelector('[data-pg="cbx-clear-input"]')?.closest('.combobox-input-group')
      return group?.querySelector('.combobox-clear') != null
    })
    eq(hasBtn, true, "clear button appears")
    // Click clear
    await page.evaluate(() => {
      const group = document.querySelector('[data-pg="cbx-clear-input"]')?.closest('.combobox-input-group')
      group?.querySelector('.combobox-clear')?.click()
    })
    await page.waitForTimeout(100)
    eq(await clearInput.inputValue(), "", "input cleared")
  })

  await test("required empty multi-combobox blocks form submission", async () => {
    // The required form has no selections yet — submit should be blocked
    const reqSubmit = page.locator('[data-pg="cbx-req-submit"]')
    await reqSubmit.click()
    await page.waitForTimeout(200)
    // No result should appear since the form is invalid
    const hasResult = await page.evaluate(
      () => document.querySelector('[data-pg="cbx-req-result"]') !== null
    )
    eq(hasResult, false, "submission blocked when empty")
    // Select an item and submit
    const reqInput = page.locator('[data-pg="cbx-req-input"]')
    await reqInput.click()
    await page.waitForSelector('[data-pg="cbx-req-content"]:popover-open')
    await page.locator('[data-pg="cbx-req-item-rs"]').click()
    await page.keyboard.press("Escape")
    await waitAllClosed()
    await reqSubmit.click()
    await page.waitForSelector('[data-pg="cbx-req-result"]')
    const result = await page.locator('[data-pg="cbx-req-result"]').textContent()
    eq(result.includes("rs"), true, "form submitted with value")
  })

  await test("dropdown is anchored below the input", async () => {
    await input.click()
    await waitOpen()
    const content = page.locator('[data-pg="cbx-content"]:popover-open')
    eq(await content.getAttribute("data-side"), "bottom", "data-side is bottom")
    const anchorBox = await input.evaluate((el) => {
      const rect = el.closest(".combobox-input-group").getBoundingClientRect()
      return { y: rect.y, height: rect.height }
    })
    const contentBox = await content.boundingBox()
    eq(contentBox.y >= anchorBox.y + anchorBox.height - 2, true, "dropdown is below the input")
    await page.keyboard.press("Escape")
    await waitAllClosed()
  })

  await test("setCustomValidity surfaces a custom message via ref", async () => {
    // Click the "Set custom error" button
    await page.locator('[data-pg="cbx-req-custom"]').click()
    await page.waitForTimeout(100)
    const validity = await page.evaluate(() => {
      const form = document.querySelector('[data-pg="cbx-req-form"]')
      const sel = form?.querySelector('select[name="langs"]')
      return sel ? { valid: sel.validity.valid, msg: sel.validationMessage } : null
    })
    eq(validity?.valid, false, "select is invalid after setCustomValidity")
    eq(validity?.msg, "Custom error", "custom message set")
  })
}
