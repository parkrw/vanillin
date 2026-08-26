export default async function run({ page, baseUrl, test, eq, near }) {
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

  await test("controlled value + hidden native select", async () => {
    const readout = page.locator('[data-pg="sel-ctrl-state"]')
    eq(await readout.textContent(), "none", "initially none")
    await page.locator('[data-pg="sel-ctrl-trigger"]').click()
    await page.waitForSelector('[role="listbox"]:popover-open')
    await page.locator('[data-pg="sel-item-cat"]').click()
    await waitAllClosed()
    eq(await readout.textContent(), "cat", "onValueChange fired")
    const native = await page.evaluate(() => {
      const sel = document.querySelector('[data-pg="sel-form"] select[name="pet"]')
      return sel ? { tag: sel.tagName, value: sel.value } : null
    })
    eq(native?.tag, "SELECT", "hidden native select rendered")
    eq(native?.value, "cat", "hidden native select carries the value")
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

  // -- Item-aligned positioning tests --

  await test("item-aligned mode places selected item near the trigger", async () => {
    const alignedTrigger = page.locator('[data-pg="sel-aligned-trigger"]')
    await alignedTrigger.click()
    await waitOpen("sel-aligned-content")

    const diff = await page.evaluate(() => {
      const trigger = document.querySelector('[data-pg="sel-aligned-trigger"]')
      const item = document.querySelector('[data-pg="sel-aligned-item-15"]')
      const tr = trigger.getBoundingClientRect()
      const ir = item.getBoundingClientRect()
      return Math.abs(tr.top - ir.top)
    })
    eq(diff < 10, true, `selected item within 10px of trigger (got ${diff.toFixed(1)})`)

    await page.keyboard.press("Escape")
    await waitAllClosed()
  })

  await test("item-aligned mode holds alignment when the trigger sits low in the viewport", async () => {
    // Regression: the bottom-viewport clamp used to shift the box up AND
    // scroll the content — a double shift that moved the item off the
    // trigger by 2× the overflow. Only reproduces with the trigger below
    // the selected item's natural offset, so pin it near the fold.
    await page.evaluate(() => {
      const trigger = document.querySelector('[data-pg="sel-aligned-trigger"]')
      const r = trigger.getBoundingClientRect()
      window.scrollTo(0, window.scrollY + r.bottom - window.innerHeight + 60)
    })
    const alignedTrigger = page.locator('[data-pg="sel-aligned-trigger"]')
    await alignedTrigger.click()
    await waitOpen("sel-aligned-content")

    const m = await page.evaluate(() => {
      const trigger = document.querySelector('[data-pg="sel-aligned-trigger"]')
      const item = document.querySelector('[data-pg="sel-aligned-item-15"]')
      const content = document.querySelector('[data-pg="sel-aligned-content"]')
      return {
        diff: Math.abs(trigger.getBoundingClientRect().top - item.getBoundingClientRect().top),
        bottom: content.getBoundingClientRect().bottom,
        vh: window.innerHeight,
      }
    })
    eq(m.diff < 10, true, `selected item within 10px of trigger (got ${m.diff.toFixed(1)})`)
    eq(m.bottom <= m.vh, true, `content bottom within viewport (${m.bottom} <= ${m.vh})`)

    await page.keyboard.press("Escape")
    await waitAllClosed()
    await page.evaluate(() => window.scrollTo(0, 0))
  })

  await test("item-aligned mode clamps to viewport and enables scroll buttons", async () => {
    // Scroll buttons on both ends need the content scrolled, which needs the
    // trigger above the selected item's natural offset — pin it high.
    await page.evaluate(() => {
      const trigger = document.querySelector('[data-pg="sel-aligned-trigger"]')
      window.scrollTo(0, window.scrollY + trigger.getBoundingClientRect().top - 250)
    })
    const alignedTrigger = page.locator('[data-pg="sel-aligned-trigger"]')
    await alignedTrigger.click()
    await waitOpen("sel-aligned-content")

    // Content should be within the viewport
    const contentRect = await page.evaluate(() => {
      const el = document.querySelector('[data-pg="sel-aligned-content"]')
      const r = el.getBoundingClientRect()
      return { top: r.top, bottom: r.bottom }
    })
    eq(contentRect.top >= 0, true, "content top within viewport")
    eq(
      contentRect.bottom <= await page.evaluate(() => window.innerHeight),
      true,
      "content bottom within viewport"
    )

    // Scroll buttons should be visible since item 15 is in the middle. Their
    // state comes from an IntersectionObserver, so it is not on the element the
    // instant the listbox opens — wait for it the way the next test does. This
    // sample is docs/ISSUES.md G7: it read "hidden" on a loaded runner, and the
    // failure skipped the Escape below, so the still-open listbox then ate the
    // next test's click as a 30s timeout.
    await page.waitForFunction(
      () =>
        document.querySelector('[data-pg="sel-scroll-up"]')?.dataset.state === "visible" &&
        document.querySelector('[data-pg="sel-scroll-down"]')?.dataset.state === "visible",
      null,
      { timeout: 5000 },
    )
    eq(
      await page.locator('[data-pg="sel-scroll-up"]').getAttribute("data-state"),
      "visible",
      "scroll-up visible",
    )
    eq(
      await page.locator('[data-pg="sel-scroll-down"]').getAttribute("data-state"),
      "visible",
      "scroll-down visible",
    )

    await page.keyboard.press("Escape")
    await waitAllClosed()
  })

  await test("scroll buttons hide at each scroll extreme", async () => {
    const scrollTrigger = page.locator('[data-pg="sel-scroll-trigger"]')
    await scrollTrigger.click()
    await waitOpen("sel-scroll-content")

    // At the top: up button hidden, down button visible
    const content = page.locator('[data-pg="sel-scroll-content"]')
    await page.evaluate(() => {
      document.querySelector('[data-pg="sel-scroll-content"]').scrollTop = 0
    })
    // Wait for IntersectionObserver to fire
    await page.waitForFunction(() => {
      const up = document.querySelector('[data-pg="sel-scroll-up-popper"]')
      return up && up.dataset.state === "hidden"
    })
    eq(
      await page.locator('[data-pg="sel-scroll-up-popper"]').getAttribute("data-state"),
      "hidden",
      "up button hidden at top"
    )
    eq(
      await page.locator('[data-pg="sel-scroll-down-popper"]').getAttribute("data-state"),
      "visible",
      "down button visible at top"
    )

    // Scroll to the bottom
    await page.evaluate(() => {
      const el = document.querySelector('[data-pg="sel-scroll-content"]')
      el.scrollTop = el.scrollHeight
    })
    await page.waitForFunction(() => {
      const down = document.querySelector('[data-pg="sel-scroll-down-popper"]')
      return down && down.dataset.state === "hidden"
    })
    eq(
      await page.locator('[data-pg="sel-scroll-up-popper"]').getAttribute("data-state"),
      "visible",
      "up button visible at bottom"
    )
    eq(
      await page.locator('[data-pg="sel-scroll-down-popper"]').getAttribute("data-state"),
      "hidden",
      "down button hidden at bottom"
    )

    await page.keyboard.press("Escape")
    await waitAllClosed()
  })

  // -- Constraint validation tests --

  await test("required empty select blocks form.requestSubmit() and reports invalid", async () => {
    // Reset: navigate away and back to clear the pet selection
    await page.goto(`${baseUrl}/#button`)
    await page.waitForSelector("h2")
    await page.goto(`${baseUrl}/#select`)
    await page.waitForSelector('[data-pg="sel-form"]')

    const isValid = await page.evaluate(() => {
      const form = document.querySelector('[data-pg="sel-form"]')
      return form.checkValidity()
    })
    eq(isValid, false, "empty required select is invalid")

    // Try submitting — should not produce a result
    const hadResult = await page.evaluate(() => {
      const form = document.querySelector('[data-pg="sel-form"]')
      let submitted = false
      const handler = () => { submitted = true }
      form.addEventListener("submit", handler)
      try { form.requestSubmit() } catch {}
      form.removeEventListener("submit", handler)
      return submitted
    })
    eq(hadResult, false, "requestSubmit blocked by validation")
  })

  await test("value posts under name after form submission", async () => {
    // Select a pet
    await page.locator('[data-pg="sel-ctrl-trigger"]').click()
    await page.waitForSelector('[role="listbox"]:popover-open')
    await page.locator('[data-pg="sel-item-dog"]').click()
    await waitAllClosed()

    // Verify the form is now valid
    const isValid = await page.evaluate(() => {
      const form = document.querySelector('[data-pg="sel-form"]')
      return form.checkValidity()
    })
    eq(isValid, true, "form valid after selecting dog")

    // Submit the form
    await page.locator('[data-pg="sel-submit"]').click()
    await page.waitForSelector('[data-pg="sel-form-result"]')
    const result = await page.locator('[data-pg="sel-form-result"]').textContent()
    eq(result.includes('"pet":"dog"'), true, "value posted under name")
  })

  await test("existing popper behaviour unchanged", async () => {
    // The default select (popper mode) should still work as before
    await trigger.click()
    await waitOpen()

    // Content should have data-side (set by positionAnchored in popper mode)
    const side = await page.evaluate(() =>
      document.querySelector('[data-pg="sel-content"]').dataset.side
    )
    eq(side === "bottom" || side === "top", true, "data-side set in popper mode")

    await page.keyboard.press("Escape")
    await waitAllClosed()
  })
}
