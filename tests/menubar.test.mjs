export default async function run({ page, baseUrl, test, eq }) {
  await page.goto(`${baseUrl}/#menubar`)

  const fileTrigger = page.locator('[data-pg="mb-trigger-file"]')
  const editTrigger = page.locator('[data-pg="mb-trigger-edit"]')
  const profilesTrigger = page.locator('[data-pg="mb-trigger-profiles"]')

  const waitOpen = (pg) => page.waitForSelector(`[data-pg="${pg}"]:popover-open`)
  const waitClosed = (pg) =>
    page.waitForFunction((sel) => {
      const el = document.querySelector(sel)
      return el && !el.matches(":popover-open") && el.dataset.state === "closed"
    }, `[data-pg="${pg}"]`)
  const anyMenuOpen = () =>
    page.evaluate(() =>
      [...document.querySelectorAll('[role="menu"]')].some((el) => el.matches(":popover-open"))
    )
  const focusedText = () => page.evaluate(() => document.activeElement?.textContent?.trim())

  await test("menubar row: roles + roving tabindex, arrows move focus without opening", async () => {
    const bar = page.locator('[data-pg="menubar"]')
    eq(await bar.getAttribute("role"), "menubar", "role=menubar")

    const triggerInfo = await page.evaluate(() => {
      const els = [...document.querySelectorAll('[data-pg="menubar"] [data-menubar-trigger]')]
      return {
        count: els.length,
        roles: [...new Set(els.map((el) => el.getAttribute("role")))],
        tabbable: els.filter((el) => el.tabIndex === 0).length,
      }
    })
    eq(triggerInfo.count, 4, "four triggers")
    eq(triggerInfo.roles.join(","), "menuitem", "triggers are menuitems")
    eq(triggerInfo.tabbable, 1, "exactly one tabbable trigger")

    await fileTrigger.focus()
    await page.keyboard.press("ArrowRight")
    eq(await focusedText(), "Edit", "ArrowRight moves trigger focus")
    await page.keyboard.press("End")
    eq(await focusedText(), "Profiles", "End focuses last trigger")
    await page.keyboard.press("Home")
    eq(await focusedText(), "File", "Home focuses first trigger")
    eq(await anyMenuOpen(), false, "no menu opened by trigger nav")
  })

  await test("click opens menu below trigger with first item focused; click again closes", async () => {
    await fileTrigger.click()
    const menu = await waitOpen("mb-menu-file")
    eq(await menu.getAttribute("role"), "menu", "role=menu")
    eq(await fileTrigger.getAttribute("aria-expanded"), "true", "trigger expanded")

    // positionAnchored writes px styles; wait for it to settle below the bar.
    const box = await fileTrigger.boundingBox()
    await page.waitForFunction((bottom) => {
      const el = document.querySelector('[data-pg="mb-menu-file"]')
      return parseFloat(el.style.top) >= bottom - 1
    }, box.y + box.height)

    const focused = await page.evaluate(() => ({
      role: document.activeElement?.getAttribute("role"),
      inMenu: document.querySelector('[data-pg="mb-menu-file"]').contains(document.activeElement),
      text: document.activeElement?.textContent?.trim(),
    }))
    eq(focused.role, "menuitem", "a menuitem focused")
    eq(focused.inMenu, true, "focus inside the file menu")
    eq(focused.text.startsWith("New Tab"), true, "first item focused")

    // Toggle closed — and stay closed (regression: light dismiss on pointerdown
    // syncs state before click, so a naive click toggle reopens the menu).
    await fileTrigger.click()
    await waitClosed("mb-menu-file")
    await page.waitForTimeout(300)
    eq(await anyMenuOpen(), false, "menu stays closed after toggle click")
  })

  await test("ArrowDown opens focusing first item, ArrowUp last; Esc refocuses trigger", async () => {
    await fileTrigger.focus()
    await page.keyboard.press("ArrowDown")
    await waitOpen("mb-menu-file")
    eq((await focusedText()).startsWith("New Tab"), true, "ArrowDown focuses first item")

    await page.keyboard.press("Escape")
    await waitClosed("mb-menu-file")
    eq(
      await page.evaluate(() => document.activeElement?.dataset.pg),
      "mb-trigger-file",
      "Esc returns focus to trigger"
    )

    await page.keyboard.press("ArrowUp")
    await waitOpen("mb-menu-file")
    eq((await focusedText()).startsWith("Print"), true, "ArrowUp focuses last item")
    await page.keyboard.press("Escape")
    await waitClosed("mb-menu-file")
  })

  await test("hover only switches menus while one is open, without item highlight", async () => {
    await page.mouse.move(5, 5)
    await editTrigger.hover()
    await page.waitForTimeout(250)
    eq(await anyMenuOpen(), false, "hover with nothing open does not open")

    await page.mouse.move(5, 5)
    await fileTrigger.click()
    await waitOpen("mb-menu-file")

    await editTrigger.hover()
    await waitOpen("mb-menu-edit")
    await waitClosed("mb-menu-file")
    eq(
      await page.evaluate(() => document.activeElement?.dataset.pg),
      "mb-menu-edit",
      "hover switch focuses the menu itself, not an item"
    )

    await page.keyboard.press("Escape")
    await waitClosed("mb-menu-edit")
  })

  await test("ArrowRight/Left inside content move across menus and wrap", async () => {
    await page.mouse.move(5, 5)
    await fileTrigger.click()
    await waitOpen("mb-menu-file")

    await page.keyboard.press("ArrowRight")
    await waitOpen("mb-menu-edit")
    await waitClosed("mb-menu-file")
    eq((await focusedText()).startsWith("Undo"), true, "next menu opens with first item focused")

    await page.keyboard.press("ArrowLeft")
    await waitOpen("mb-menu-file")
    await waitClosed("mb-menu-edit")
    eq((await focusedText()).startsWith("New Tab"), true, "prev menu opens with first item focused")

    await page.keyboard.press("Escape")
    await waitClosed("mb-menu-file")

    await profilesTrigger.click()
    await waitOpen("mb-menu-profiles")
    await page.keyboard.press("ArrowRight")
    await waitOpen("mb-menu-file")
    await waitClosed("mb-menu-profiles")
    eq((await focusedText()).startsWith("New Tab"), true, "wraps from last menu to first")

    await page.keyboard.press("Escape")
    await waitClosed("mb-menu-file")
  })

  await test("select closes the menu, clears the bar, reopen works", async () => {
    await page.mouse.move(5, 5)
    await editTrigger.click()
    await waitOpen("mb-menu-edit")
    await page.locator('[data-pg="mb-menu-edit"] [role="menuitem"]', { hasText: "Undo" }).click()
    await waitClosed("mb-menu-edit")
    eq(await page.locator('[data-pg="mb-readout"]').textContent(), "undo", "readout updated")
    eq(await anyMenuOpen(), false, "all menus closed")

    await editTrigger.click()
    await waitOpen("mb-menu-edit")
    await page.keyboard.press("Escape")
    await waitClosed("mb-menu-edit")
  })

  // ── Sub-task 2: submenu vs cross-menu arrows + re-export coverage ────

  await test("ArrowRight on a SubTrigger opens the submenu, not the next menu", async () => {
    await page.mouse.move(5, 5)
    await fileTrigger.click()
    await waitOpen("mb-menu-file")

    await page.locator('[data-pg="mb-sub-trigger"]').focus()
    await page.keyboard.press("ArrowRight")
    await waitOpen("mb-sub-content")
    eq(
      await page.evaluate(() =>
        document.querySelector('[data-pg="mb-menu-edit"]').matches(":popover-open")
      ),
      false,
      "next menu did not open"
    )
    eq((await focusedText()).startsWith("Email link"), true, "first submenu item focused")
  })

  await test("ArrowLeft inside the submenu closes only the sub", async () => {
    // Submenu is open from the previous test.
    await page.keyboard.press("ArrowLeft")
    await waitClosed("mb-sub-content")
    eq(
      await page.evaluate(() =>
        document.querySelector('[data-pg="mb-menu-file"]').matches(":popover-open")
      ),
      true,
      "parent menu still open"
    )
    eq(
      await page.evaluate(() => document.activeElement?.dataset.pg),
      "mb-sub-trigger",
      "focus back on the sub trigger"
    )
  })

  await test("ArrowRight on a plain submenu item jumps to the next menu", async () => {
    // Parent menu still open, focus on the sub trigger — reopen the sub.
    await page.keyboard.press("ArrowRight")
    await waitOpen("mb-sub-content")

    await page.keyboard.press("ArrowRight")
    await waitOpen("mb-menu-edit")
    await waitClosed("mb-menu-file")
    await waitClosed("mb-sub-content")
    eq((await focusedText()).startsWith("Undo"), true, "next menu opens with first item focused")

    await page.keyboard.press("Escape")
    await waitClosed("mb-menu-edit")
  })

  await test("checkbox item toggles, closes, persists on reopen (re-export wiring)", async () => {
    await page.mouse.move(5, 5)
    const viewTrigger = page.locator('[data-pg="mb-trigger-view"]')
    await viewTrigger.click()
    await waitOpen("mb-menu-view")

    const cb = page.locator('[data-pg="mb-cb-bookmarks"]')
    eq(await cb.getAttribute("role"), "menuitemcheckbox", "role=menuitemcheckbox")
    eq(await cb.getAttribute("aria-checked"), "true", "starts checked")

    await cb.click()
    await waitClosed("mb-menu-view")
    eq(await page.locator('[data-pg="mb-cb-readout"]').textContent(), "off", "readout toggled")

    await viewTrigger.click()
    await waitOpen("mb-menu-view")
    eq(await cb.getAttribute("aria-checked"), "false", "persists on reopen")

    await page.keyboard.press("Escape")
    await waitClosed("mb-menu-view")
  })

  await test("radio group single-selects (re-export wiring)", async () => {
    await page.mouse.move(5, 5)
    await profilesTrigger.click()
    await waitOpen("mb-menu-profiles")

    await page
      .locator('[data-pg="mb-menu-profiles"] [role="menuitemradio"]', { hasText: "Andy" })
      .click()
    await waitClosed("mb-menu-profiles")
    eq(
      await page.locator('[data-pg="mb-radio-readout"]').textContent(),
      "andy",
      "radio value changed"
    )

    await profilesTrigger.click()
    await waitOpen("mb-menu-profiles")
    const checked = await page.evaluate(
      () =>
        [...document.querySelectorAll('[data-pg="mb-menu-profiles"] [role="menuitemradio"]')]
          .filter((el) => el.getAttribute("aria-checked") === "true")
          .map((el) => el.textContent.trim())
    )
    eq(checked.join(","), "Andy", "exactly one checked")

    await page.keyboard.press("Escape")
    await waitClosed("mb-menu-profiles")
  })
}
