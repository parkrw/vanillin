export default async function run({ page, baseUrl, test, eq }) {
  await page.goto(`${baseUrl}/#command`)

  const input = page.locator('[data-pg="cmd-input"]')
  const last = page.locator('[data-pg="cmd-last"]')

  const highlightedPg = () =>
    page.evaluate(() => {
      const id = document.activeElement?.getAttribute("aria-activedescendant")
      return id ? document.getElementById(id)?.getAttribute("data-pg") : null
    })
  const visibleItems = (pg) =>
    page.evaluate(
      (sel) =>
        [
          ...document.querySelectorAll(`[data-pg="${sel}"] [role="option"]:not([hidden])`),
        ].map((el) => el.dataset.value),
      pg
    )

  await test("wiring: roles, list id, first item auto-highlighted", async () => {
    eq(await input.getAttribute("role"), "combobox", "role combobox")
    eq(await input.getAttribute("aria-autocomplete"), "list", "aria-autocomplete")
    const list = page.locator('[data-pg="cmd-list"]')
    eq(await list.getAttribute("role"), "listbox", "list is a listbox")
    eq(await input.getAttribute("aria-controls"), await list.getAttribute("id"), "aria-controls")
    await input.click()
    eq(await highlightedPg(), "cmd-item-calendar", "first item highlighted on mount")
    eq(
      await page.locator('[data-pg="cmd-item-calendar"]').getAttribute("aria-selected"),
      "true",
      "aria-selected on the highlight"
    )
  })

  await test("typing filters; hidden items are display:none; empty state", async () => {
    await input.fill("bil")
    await page.waitForFunction(() => {
      const els = document.querySelectorAll('[data-pg="cmd-list"] [role="option"]:not([hidden])')
      return els.length === 1 && els[0].dataset.value === "billing"
    })
    const filteredDisplay = await page.evaluate(
      () => getComputedStyle(document.querySelector('[data-pg="cmd-item-calendar"]')).display
    )
    eq(filteredDisplay, "none", "filtered item is actually display:none")
    eq(await highlightedPg(), "cmd-item-billing", "highlight moved to the only match")
    const suggestionsHidden = await page.evaluate(
      () =>
        getComputedStyle(document.querySelector('[data-pg="cmd-group-suggestions"]')).display ===
        "none"
    )
    eq(suggestionsHidden, true, "group with no matches hidden via :has()")
    eq(
      await page.locator('[data-pg="cmd-separator"]').count(),
      0,
      "separator hidden while searching"
    )
    await input.fill("zzz")
    await page.waitForSelector('[data-pg="cmd-empty"]')
    eq((await visibleItems("cmd-list")).length, 0, "nothing visible")
    eq(await input.getAttribute("aria-activedescendant"), null, "highlight cleared")
    await input.fill("")
    await page.waitForFunction(() => !document.querySelector('[data-pg="cmd-empty"]'))
    eq((await visibleItems("cmd-list")).join(","), "calendar,emoji,launch,profile,billing", "all back")
    eq(await page.locator('[data-pg="cmd-separator"]').count(), 1, "separator back")
  })

  await test("keywords match text that is not in the label", async () => {
    await input.fill("account")
    await page.waitForFunction(() => {
      const els = document.querySelectorAll('[data-pg="cmd-list"] [role="option"]:not([hidden])')
      return els.length === 1 && els[0].dataset.value === "profile"
    })
    await input.fill("")
  })

  await test("arrows and Home/End move the highlight; ends clamp without loop", async () => {
    await input.click()
    await page.keyboard.press("ArrowUp")
    eq(await highlightedPg(), "cmd-item-calendar", "ArrowUp at the first item clamps")
    await page.keyboard.press("ArrowDown")
    eq(await highlightedPg(), "cmd-item-emoji", "next enabled item")
    await page.keyboard.press("ArrowDown")
    eq(await highlightedPg(), "cmd-item-profile", "disabled item skipped")
    await page.keyboard.press("End")
    eq(await highlightedPg(), "cmd-item-billing", "End jumps to the last")
    await page.keyboard.press("ArrowDown")
    eq(await highlightedPg(), "cmd-item-billing", "ArrowDown at the last clamps")
    await page.keyboard.press("Home")
    eq(await highlightedPg(), "cmd-item-calendar", "Home jumps to the first")
  })

  await test("Ctrl+N / Ctrl+P vim bindings move the highlight", async () => {
    await page.keyboard.press("Control+n")
    eq(await highlightedPg(), "cmd-item-emoji", "Ctrl+N moves down")
    await page.keyboard.press("Control+p")
    eq(await highlightedPg(), "cmd-item-calendar", "Ctrl+P moves up")
  })

  await test("Enter activates the highlighted item; click activates too", async () => {
    await page.keyboard.press("ArrowDown")
    await page.keyboard.press("Enter")
    eq(await last.textContent(), "emoji", "Enter fired onSelect")
    await page.locator('[data-pg="cmd-item-billing"]').click()
    eq(await last.textContent(), "billing", "click fired onSelect")
  })

  await test("disabled item does not activate on click", async () => {
    await page.locator('[data-pg="cmd-item-launch"]').click({ force: true })
    eq(await last.textContent(), "billing", "onSelect not fired for a disabled item")
  })

  await test("loop wraps at both ends; controlled value reports the highlight", async () => {
    const loopInput = page.locator('[data-pg="cmd-loop-input"]')
    const state = page.locator('[data-pg="cmd-loop-state"]')
    await loopInput.click()
    eq(await state.textContent(), "one", "controlled value auto-highlighted")
    await page.keyboard.press("ArrowUp")
    eq(await state.textContent(), "three", "ArrowUp wraps to the last")
    await page.keyboard.press("ArrowDown")
    eq(await state.textContent(), "one", "ArrowDown wraps to the first")
  })

  await test("shouldFilter={false} leaves every item visible", async () => {
    const nofilter = page.locator('[data-pg="cmd-nofilter-input"]')
    await nofilter.fill("zzz")
    await page.waitForTimeout(50)
    eq((await visibleItems("cmd-nofilter-list")).join(","), "alpha,beta", "nothing filtered")
    eq(
      await page.locator('[data-pg="cmd-nofilter-list"] .command-empty').count(),
      0,
      "no empty state"
    )
    await nofilter.fill("")
  })

  await test("CommandDialog: opens focused on the input, Enter selects and closes", async () => {
    await page.locator('[data-pg="cmd-dialog-trigger"]').click()
    await page.waitForSelector('[data-pg="cmd-dialog"][open]')
    const focusIsDialogInput = await page.evaluate(
      () => document.activeElement?.getAttribute("data-pg") === "cmd-dialog-input"
    )
    eq(focusIsDialogInput, true, "showModal() lands on the input")
    await page.locator('[data-pg="cmd-dialog-input"]').fill("docs")
    await page.waitForFunction(() => {
      const els = document.querySelectorAll(
        '[data-pg="cmd-dialog-list"] [role="option"]:not([hidden])'
      )
      return els.length === 1 && els[0].dataset.value === "go-docs"
    })
    await page.keyboard.press("Enter")
    await page.waitForSelector('[data-pg="cmd-dialog"]', { state: "detached" })
    eq(await last.textContent(), "go-docs", "dialog item fired onSelect")
  })

  await test("CommandDialog: Escape closes", async () => {
    await page.locator('[data-pg="cmd-dialog-trigger"]').click()
    await page.waitForSelector('[data-pg="cmd-dialog"][open]')
    await page.keyboard.press("Escape")
    await page.waitForSelector('[data-pg="cmd-dialog"]', { state: "detached" })
  })

  // --- fuzzy scoring + re-sort ---

  const fuzzyInput = page.locator('[data-pg="cmd-fuzzy-input"]')

  /** Visible items in the fuzzy demo, sorted by computed CSS order (visual). */
  const fuzzyVisual = () =>
    page.evaluate(() => {
      const els = document.querySelectorAll(
        '[data-pg="cmd-fuzzy-list"] [role="option"]:not([hidden])'
      )
      return [...els]
        .sort(
          (a, b) =>
            (parseInt(getComputedStyle(a).order, 10) || 0) -
            (parseInt(getComputedStyle(b).order, 10) || 0)
        )
        .map((el) => el.dataset.value)
    })

  await test("fuzzy: 'gp' ranks Git Push first", async () => {
    await fuzzyInput.fill("gp")
    await page.waitForFunction(() => {
      const el = document.querySelector('[data-pg="cmd-fuzzy-list"] [role="option"]:not([hidden])')
      return el && el.dataset.value
    })
    const items = await fuzzyVisual()
    eq(items[0], "Git Push", "Git Push is the top result for 'gp'")
    eq(items.includes("Grep"), true, "Grep also matches")
  })

  await test("fuzzy: groups re-order by best member score", async () => {
    // "gp" -> Git group has Git Push (word boundary), Tools has Grep (prefix).
    // Git Push scores higher, so its parent group should appear first visually.
    const groupOrder = await page.evaluate(() => {
      const groups = document.querySelectorAll('[data-pg="cmd-fuzzy-list"] [role="group"]')
      return [...groups]
        .filter((g) => g.querySelector('[role="option"]:not([hidden])'))
        .sort(
          (a, b) =>
            (parseInt(getComputedStyle(a).order, 10) || 0) -
            (parseInt(getComputedStyle(b).order, 10) || 0)
        )
        .map((g) => g.getAttribute("aria-labelledby"))
        .map((id) => document.getElementById(id)?.textContent)
    })
    eq(groupOrder[0], "Git", "Git group appears first for 'gp'")
  })

  await test("fuzzy: ties keep authored (DOM) order", async () => {
    await fuzzyInput.fill("")
    await page.waitForFunction(() => {
      const els = document.querySelectorAll(
        '[data-pg="cmd-fuzzy-list"] [role="option"]:not([hidden])'
      )
      return els.length === 6
    })
    const items = await fuzzyVisual()
    eq(items[0], "Git Status", "first authored item stays first with empty search")
    eq(items[5], "Generate Report", "last authored item stays last")
  })

  await test("fuzzy: arrow keys traverse visual order after re-sort", async () => {
    await fuzzyInput.fill("gp")
    await page.waitForFunction(() => {
      const els = document.querySelectorAll(
        '[data-pg="cmd-fuzzy-list"] [role="option"]:not([hidden])'
      )
      return els.length > 0
    })
    await fuzzyInput.click()
    // First highlight should be the visually-first item (Git Push).
    const firstHighlight = await page.evaluate(() => {
      const id = document.activeElement?.getAttribute("aria-activedescendant")
      return id ? document.getElementById(id)?.dataset.value : null
    })
    eq(firstHighlight, "Git Push", "highlight starts on the top-scored item")
    // ArrowDown should move to the next in visual order.
    await page.keyboard.press("ArrowDown")
    const secondHighlight = await page.evaluate(() => {
      const id = document.activeElement?.getAttribute("aria-activedescendant")
      return id ? document.getElementById(id)?.dataset.value : null
    })
    const visual = await fuzzyVisual()
    eq(secondHighlight, visual[1], "ArrowDown moves to the next in visual order")
    await fuzzyInput.fill("")
  })

  await test("shouldFilter={false} does not reorder items", async () => {
    const nofilter = page.locator('[data-pg="cmd-nofilter-input"]')
    await nofilter.fill("zzz")
    await page.waitForTimeout(50)
    eq((await visibleItems("cmd-nofilter-list")).join(","), "alpha,beta", "nothing filtered or reordered")
    await nofilter.fill("")
  })

  await test("CommandLoading: announces and does not trigger CommandEmpty", async () => {
    const asyncInput = page.locator('[data-pg="cmd-async-input"]')
    await asyncInput.fill("xyz")
    // Loading should appear before the fake fetch resolves.
    await page.waitForSelector('[data-pg="cmd-async-loading"]')
    const role = await page.locator('[data-pg="cmd-async-loading"]').getAttribute("role")
    eq(role, "status", "loading has role=status")
    const live = await page.locator('[data-pg="cmd-async-loading"]').getAttribute("aria-live")
    eq(live, "polite", "loading has aria-live=polite")
    // Empty state must NOT show while loading is mounted.
    const emptyCount = await page.locator('[data-pg="cmd-async-empty"]').count()
    eq(emptyCount, 0, "CommandEmpty suppressed while loading")
    await asyncInput.fill("")
  })
}
