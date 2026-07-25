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

  await test("controlled value + hidden form input (items prop, function list)", async () => {
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
      const el = document.querySelector('[data-pg="cbx-form"] input[name="timezone"]')
      return el ? { type: el.type, value: el.value } : null
    })
    eq(hidden?.type, "hidden", "hidden input rendered")
    eq(hidden?.value, "est", "hidden input carries the value")
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
}
