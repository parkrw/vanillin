export default async function run({ page, baseUrl, test, eq }) {
  await page.goto(`${baseUrl}/#dropdown-menu`)

  const trigger = page.locator('[data-pg="dropdown-trigger"]')

  // Helper: wait for the menu to be :popover-open with role="menu"
  const waitOpen = () =>
    page.waitForSelector('.dropdown-menu[role="menu"]:popover-open')
  // Helper: wait until menu is closed (not :popover-open AND data-state="closed")
  const waitClosed = () =>
    page.waitForFunction(() => {
      const menus = document.querySelectorAll('.dropdown-menu[role="menu"]')
      return (
        menus.length > 0 &&
        [...menus].every(
          (el) => !el.matches(":popover-open") && el.dataset.state === "closed"
        )
      )
    })

  // Helper: get all non-disabled menuitems in the open menu
  const getItems = () =>
    page.evaluate(() => {
      const menu = document.querySelector('.dropdown-menu[role="menu"]:popover-open')
      if (!menu) return []
      return [...menu.querySelectorAll('[role="menuitem"]')]
        .filter((el) => el.closest('[role="menu"]') === menu && !el.hasAttribute("aria-disabled"))
        .map((el) => el.textContent.trim())
    })

  await test("trigger click opens role=menu below trigger with first item focused", async () => {
    await trigger.click()
    const menu = await waitOpen()
    eq(await menu.evaluate((e) => e.matches(":popover-open")), true, ":popover-open")
    eq(await menu.getAttribute("role"), "menu", "role=menu")
    eq(await menu.getAttribute("data-state"), "open", "data-state=open")
    eq(await menu.getAttribute("data-side"), "bottom", "data-side=bottom")

    // first non-disabled item is focused
    const focusedRole = await page.evaluate(() => document.activeElement?.getAttribute("role"))
    eq(focusedRole, "menuitem", "focused element is menuitem")

    // menu is positioned below trigger
    const below = await page.evaluate(() => {
      const t = document.querySelector('[data-pg="dropdown-trigger"]')
      const m = document.querySelector('.dropdown-menu[role="menu"]:popover-open')
      return m.getBoundingClientRect().top >= t.getBoundingClientRect().bottom
    })
    eq(below, true, "menu below trigger")
  })

  await test("ArrowDown/ArrowUp loop through items, skipping disabled", async () => {
    // menu is already open from previous test, first item focused
    const items = await getItems()

    // ArrowDown to second
    await page.keyboard.press("ArrowDown")
    let focused = await page.evaluate(() => document.activeElement?.textContent?.trim())
    // Should be second non-disabled item
    eq(focused, items[1], "ArrowDown to second")

    // Keep pressing ArrowDown to the end, it should loop to first
    for (let i = 2; i < items.length; i++) {
      await page.keyboard.press("ArrowDown")
    }
    // Now at last item, one more ArrowDown loops to first
    await page.keyboard.press("ArrowDown")
    focused = await page.evaluate(() => document.activeElement?.textContent?.trim())
    eq(focused, items[0], "ArrowDown loops to first")

    // ArrowUp from first loops to last
    await page.keyboard.press("ArrowUp")
    focused = await page.evaluate(() => document.activeElement?.textContent?.trim())
    eq(focused, items[items.length - 1], "ArrowUp loops to last")
  })

  await test("Home/End jump to first/last item", async () => {
    await page.keyboard.press("Home")
    let focused = await page.evaluate(() => document.activeElement?.textContent?.trim())
    const items = await getItems()
    eq(focused, items[0], "Home focuses first")

    await page.keyboard.press("End")
    focused = await page.evaluate(() => document.activeElement?.textContent?.trim())
    eq(focused, items[items.length - 1], "End focuses last")

    // close for next test
    await page.keyboard.press("Escape")
    await waitClosed()
  })

  await test("Enter on item fires onSelect, closes menu, returns focus to trigger", async () => {
    await trigger.click()
    await waitOpen()

    // Focus first item (should already be focused), press Enter
    await page.keyboard.press("Enter")
    await waitClosed()

    // Readout updated
    const readout = await page.locator('[data-pg="dropdown-readout"]').textContent()
    eq(readout.length > 0, true, "readout has content")

    // Focus returned to trigger
    const focusOnTrigger = await page.evaluate(() =>
      document.activeElement === document.querySelector('[data-pg="dropdown-trigger"]')
    )
    eq(focusOnTrigger, true, "focus returned to trigger")
  })

  await test("click on item fires onSelect, closes menu, returns focus to trigger", async () => {
    await trigger.click()
    await waitOpen()

    // Click the first menuitem
    const firstItem = page.locator('.dropdown-menu[role="menu"]:popover-open [role="menuitem"]').first()
    await firstItem.click()
    await waitClosed()

    // Focus returned to trigger
    const focusOnTrigger = await page.evaluate(() =>
      document.activeElement === document.querySelector('[data-pg="dropdown-trigger"]')
    )
    eq(focusOnTrigger, true, "focus returned to trigger after click")
  })

  await test("onSelect preventDefault keeps menu open", async () => {
    await trigger.click()
    await waitOpen()

    // The demo has an item with data-pg="prevent-close-item" that calls preventDefault
    const preventItem = page.locator('[data-pg="prevent-close-item"]')
    await preventItem.click()

    // Menu should still be open
    const stillOpen = await page.evaluate(() => {
      const menu = document.querySelector('.dropdown-menu[role="menu"]')
      return menu?.matches(":popover-open")
    })
    eq(stillOpen, true, "menu stays open after preventDefault")

    await page.keyboard.press("Escape")
    await waitClosed()
  })

  await test("Escape closes and syncs state (can reopen)", async () => {
    await trigger.click()
    await waitOpen()
    await page.keyboard.press("Escape")
    await waitClosed()

    // Reopen to prove state synced
    await trigger.click()
    const el = await waitOpen()
    eq(await el.evaluate((e) => e.matches(":popover-open")), true, "reopened after Esc")
    await page.keyboard.press("Escape")
    await waitClosed()
  })

  await test("outside click closes and syncs state", async () => {
    await trigger.click()
    await waitOpen()
    await page.mouse.click(5, 5)
    await waitClosed()

    // Reopen
    await trigger.click()
    const el = await waitOpen()
    eq(await el.getAttribute("data-state"), "open", "reopened after outside click")
    await page.keyboard.press("Escape")
    await waitClosed()
  })

  await test("Tab closes menu and returns focus to trigger", async () => {
    await trigger.click()
    await waitOpen()
    await page.keyboard.press("Tab")
    await waitClosed()

    const focusOnTrigger = await page.evaluate(() =>
      document.activeElement === document.querySelector('[data-pg="dropdown-trigger"]')
    )
    eq(focusOnTrigger, true, "focus on trigger after Tab")
  })

  await test("trigger has correct aria attributes", async () => {
    eq(await trigger.getAttribute("aria-haspopup"), "menu", "aria-haspopup=menu")
    eq(await trigger.getAttribute("aria-expanded"), "false", "aria-expanded=false when closed")

    await trigger.click()
    await waitOpen()
    eq(await trigger.getAttribute("aria-expanded"), "true", "aria-expanded=true when open")

    const controls = await trigger.getAttribute("aria-controls")
    const exists = await page.evaluate((id) => !!document.getElementById(id), controls)
    eq(exists, true, "aria-controls points to real element")

    await page.keyboard.press("Escape")
    await waitClosed()
  })

  await test("ArrowDown on trigger opens menu focusing first item", async () => {
    await trigger.press("ArrowDown")
    await waitOpen()

    const items = await getItems()
    const focused = await page.evaluate(() => document.activeElement?.textContent?.trim())
    eq(focused, items[0], "first item focused on ArrowDown open")

    await page.keyboard.press("Escape")
    await waitClosed()
  })

  await test("ArrowUp on trigger opens menu focusing last item", async () => {
    await trigger.press("ArrowUp")
    await waitOpen()

    const items = await getItems()
    const focused = await page.evaluate(() => document.activeElement?.textContent?.trim())
    eq(focused, items[items.length - 1], "last item focused on ArrowUp open")

    await page.keyboard.press("Escape")
    await waitClosed()
  })

  await test("exit transition plays on close", async () => {
    await trigger.click()
    await waitOpen()
    await page.keyboard.press("Escape")

    const animating = await page.evaluate(() => {
      const el = document.querySelector('.dropdown-menu[role="menu"]')
      if (!el) return false
      return el.getAnimations().length > 0
    })
    eq(animating, true, "exit animation running")

    await waitClosed()
  })

  await test("Space on item fires onSelect and closes menu", async () => {
    await trigger.click()
    await waitOpen()

    // Clear readout first by checking what it had, then navigate to an item
    await page.keyboard.press("Space")
    await waitClosed()

    const focusOnTrigger = await page.evaluate(() =>
      document.activeElement === document.querySelector('[data-pg="dropdown-trigger"]')
    )
    eq(focusOnTrigger, true, "focus returned to trigger after Space select")
  })
}
