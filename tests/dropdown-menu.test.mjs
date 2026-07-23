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

  await test("hover highlights item via focus; leaving parks focus on the menu", async () => {
    await trigger.click()
    await waitOpen()
    const items = await getItems()
    const target = page
      .locator(
        '.dropdown-menu[role="menu"]:popover-open [role="menuitem"]:not([aria-disabled])'
      )
      .nth(1)
    await target.hover()
    let focused = await page.evaluate(() => document.activeElement?.textContent?.trim())
    eq(focused, items[1], "hovered item focused")

    // Leave onto the menu padding — highlight clears, focus stays in the menu.
    const menuBox = await page
      .locator('.dropdown-menu[role="menu"]:popover-open')
      .boundingBox()
    await page.mouse.move(menuBox.x + menuBox.width / 2, menuBox.y + 2)
    const focusedRole = await page.evaluate(() => document.activeElement?.getAttribute("role"))
    eq(focusedRole, "menu", "focus parked on the menu")

    // Keyboard picks up from the top after a hover reset.
    await page.keyboard.press("ArrowDown")
    focused = await page.evaluate(() => document.activeElement?.textContent?.trim())
    eq(focused, items[0], "ArrowDown resumes at first item")

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

  // ── Sub-task 2: Checkbox + Radio items ──────────────────────────────

  const cbTrigger = page.locator('[data-pg="checkbox-trigger"]')

  const waitCbOpen = () =>
    page.waitForSelector('[data-pg="checkbox-menu"]:popover-open')
  const waitCbClosed = () =>
    page.waitForFunction(() => {
      const el = document.querySelector('[data-pg="checkbox-menu"]')
      return el && !el.matches(":popover-open") && el.dataset.state === "closed"
    })

  await test("checkbox item toggles aria-checked, closes, state persists on reopen", async () => {
    await cbTrigger.click()
    await waitCbOpen()

    // The first checkbox item should start unchecked
    const cbItem = page.locator('[data-pg="cb-statusbar"]')
    eq(await cbItem.getAttribute("role"), "menuitemcheckbox", "role=menuitemcheckbox")
    eq(await cbItem.getAttribute("aria-checked"), "false", "initially unchecked")
    eq(await cbItem.getAttribute("data-state"), "unchecked", "data-state=unchecked")

    // indicator hidden when unchecked
    const indicatorHidden = await cbItem.evaluate((el) => {
      const ind = el.querySelector(".dropdown-menu-item-indicator")
      if (!ind) return true
      const style = getComputedStyle(ind)
      return style.display === "none" || style.visibility === "hidden"
    })
    eq(indicatorHidden, true, "indicator hidden when unchecked")

    // Click to check — should toggle, close menu
    await cbItem.click()
    await waitCbClosed()

    // Reopen — state should persist
    await cbTrigger.click()
    await waitCbOpen()
    eq(await cbItem.getAttribute("aria-checked"), "true", "checked after toggle")
    eq(await cbItem.getAttribute("data-state"), "checked", "data-state=checked")

    // indicator visible when checked
    const indicatorVisible = await cbItem.evaluate((el) => {
      const ind = el.querySelector(".dropdown-menu-item-indicator")
      if (!ind) return false
      const style = getComputedStyle(ind)
      return style.display !== "none" && style.visibility !== "hidden"
    })
    eq(indicatorVisible, true, "indicator visible when checked")

    // Toggle back off
    await cbItem.click()
    await waitCbClosed()
    await cbTrigger.click()
    await waitCbOpen()
    eq(await cbItem.getAttribute("aria-checked"), "false", "unchecked after second toggle")

    // readout reflects state
    const readout = await page.locator('[data-pg="cb-readout"]').textContent()
    eq(readout.includes("statusbar:off"), true, "readout shows unchecked")

    await page.keyboard.press("Escape")
    await waitCbClosed()
  })

  await test("controlled checkbox checked/onCheckedChange", async () => {
    // The demo has a controlled checkbox item (activity bar)
    await cbTrigger.click()
    await waitCbOpen()

    const controlled = page.locator('[data-pg="cb-activity"]')
    eq(await controlled.getAttribute("aria-checked"), "true", "controlled starts checked")

    // Click toggles via onCheckedChange
    await controlled.click()
    await waitCbClosed()

    // Readout updated
    const readout = await page.locator('[data-pg="cb-readout"]').textContent()
    eq(readout.includes("activity:off"), true, "controlled toggled off")

    // Reopen and verify
    await cbTrigger.click()
    await waitCbOpen()
    eq(await controlled.getAttribute("aria-checked"), "false", "controlled now unchecked")

    await page.keyboard.press("Escape")
    await waitCbClosed()
  })

  const radioTrigger = page.locator('[data-pg="radio-trigger"]')

  const waitRadioOpen = () =>
    page.waitForSelector('[data-pg="radio-menu"]:popover-open')
  const waitRadioClosed = () =>
    page.waitForFunction(() => {
      const el = document.querySelector('[data-pg="radio-menu"]')
      return el && !el.matches(":popover-open") && el.dataset.state === "closed"
    })

  await test("radio group is single-select with menuitemradio roles", async () => {
    await radioTrigger.click()
    await waitRadioOpen()

    const items = await page.evaluate(() => {
      const menu = document.querySelector('[data-pg="radio-menu"]:popover-open')
      return [...menu.querySelectorAll('[role="menuitemradio"]')].map((el) => ({
        text: el.textContent.trim(),
        checked: el.getAttribute("aria-checked"),
        state: el.dataset.state,
      }))
    })

    // Should have radio items
    eq(items.length >= 2, true, "has radio items")
    // Initially one should be checked (the default)
    const checkedCount = items.filter((i) => i.checked === "true").length
    eq(checkedCount, 1, "exactly one checked")

    // Click a different item
    const uncheckedItem = page.locator('[role="menuitemradio"][aria-checked="false"]').first()
    await uncheckedItem.click()
    await waitRadioClosed()

    // Readout should show the new value
    const readout = await page.locator('[data-pg="radio-readout"]').textContent()
    eq(readout.length > 0, true, "radio readout updated")

    // Reopen — the newly selected should be checked, old deselected
    await radioTrigger.click()
    await waitRadioOpen()

    const newChecked = await page.evaluate(() => {
      const menu = document.querySelector('[data-pg="radio-menu"]:popover-open')
      return [...menu.querySelectorAll('[role="menuitemradio"]')]
        .filter((el) => el.getAttribute("aria-checked") === "true")
        .map((el) => el.textContent.trim())
    })
    eq(newChecked.length, 1, "still exactly one checked after change")

    await page.keyboard.press("Escape")
    await waitRadioClosed()
  })

  await test("radio item indicator visible only when checked", async () => {
    await radioTrigger.click()
    await waitRadioOpen()

    // checked item should have visible indicator
    const checkedIndicator = await page.evaluate(() => {
      const item = document.querySelector('[role="menuitemradio"][aria-checked="true"]')
      if (!item) return false
      const ind = item.querySelector(".dropdown-menu-item-indicator")
      if (!ind) return false
      return getComputedStyle(ind).display !== "none"
    })
    eq(checkedIndicator, true, "checked radio indicator visible")

    // unchecked item should have hidden indicator
    const uncheckedIndicator = await page.evaluate(() => {
      const item = document.querySelector('[role="menuitemradio"][aria-checked="false"]')
      if (!item) return true
      const ind = item.querySelector(".dropdown-menu-item-indicator")
      if (!ind) return true
      return getComputedStyle(ind).display === "none"
    })
    eq(uncheckedIndicator, true, "unchecked radio indicator hidden")

    await page.keyboard.press("Escape")
    await waitRadioClosed()
  })

  await test("checkbox keyboard nav includes menuitemcheckbox items", async () => {
    await cbTrigger.click()
    await waitCbOpen()

    // The first focused item should be a menuitemcheckbox
    const role = await page.evaluate(() => document.activeElement?.getAttribute("role"))
    eq(role, "menuitemcheckbox", "first focused is menuitemcheckbox")

    // ArrowDown should move to next item
    await page.keyboard.press("ArrowDown")
    const nextRole = await page.evaluate(() => document.activeElement?.getAttribute("role"))
    eq(nextRole === "menuitemcheckbox" || nextRole === "menuitem", true, "arrow navigates to next item")

    // Enter toggles checkbox
    await page.keyboard.press("Home")
    const beforeChecked = await page.evaluate(() =>
      document.activeElement?.getAttribute("aria-checked")
    )
    await page.keyboard.press("Enter")
    await waitCbClosed()

    // Reopen to verify toggle happened
    await cbTrigger.click()
    await waitCbOpen()
    const afterChecked = await page.evaluate(() => {
      const item = document.querySelector('[data-pg="cb-statusbar"]')
      return item?.getAttribute("aria-checked")
    })
    eq(afterChecked !== beforeChecked, true, "Enter toggled checkbox")

    await page.keyboard.press("Escape")
    await waitCbClosed()
  })

  // ── Sub-task 3: Submenu + safe triangle ─────────────────────────────

  const subTrigger = page.locator('[data-pg="sub-trigger"]')

  // Helper: wait for the submenu content to be :popover-open
  const waitSubOpen = () =>
    page.waitForSelector('[data-pg="sub-content"]:popover-open')
  const waitSubClosed = () =>
    page.waitForFunction(() => {
      const el = document.querySelector('[data-pg="sub-content"]')
      return el && !el.matches(":popover-open") && el.dataset.state === "closed"
    })

  await test("ArrowRight on SubTrigger opens SubContent with first item focused", async () => {
    // Open the parent menu first
    const subMenuTrigger = page.locator('[data-pg="submenu-trigger"]')
    await subMenuTrigger.click()
    await page.waitForSelector('[data-pg="submenu-menu"]:popover-open')

    // Navigate to the SubTrigger
    await subTrigger.focus()

    // ArrowRight should open the submenu
    await page.keyboard.press("ArrowRight")
    await waitSubOpen()

    // First item in the submenu should be focused
    const focused = await page.evaluate(() => {
      const el = document.activeElement
      if (!el) return null
      const subContent = document.querySelector('[data-pg="sub-content"]:popover-open')
      if (!subContent) return null
      return subContent.contains(el) ? el.getAttribute("role") : null
    })
    eq(focused, "menuitem", "first submenu item focused")

    // Clean up — Escape closes the whole stack
    await page.keyboard.press("Escape")
    await waitClosed()
  })

  await test("ArrowLeft inside SubContent closes it and refocuses SubTrigger", async () => {
    const subMenuTrigger = page.locator('[data-pg="submenu-trigger"]')
    await subMenuTrigger.click()
    await page.waitForSelector('[data-pg="submenu-menu"]:popover-open')

    await subTrigger.focus()
    await page.keyboard.press("ArrowRight")
    await waitSubOpen()

    // ArrowLeft should close submenu and refocus SubTrigger
    await page.keyboard.press("ArrowLeft")
    await waitSubClosed()

    const focusedPg = await page.evaluate(() =>
      document.activeElement?.getAttribute("data-pg")
    )
    eq(focusedPg, "sub-trigger", "focus back on SubTrigger")

    await page.keyboard.press("Escape")
    await waitClosed()
  })

  await test("hover on SubTrigger opens submenu after delay", async () => {
    const subMenuTrigger = page.locator('[data-pg="submenu-trigger"]')
    await subMenuTrigger.click()
    await page.waitForSelector('[data-pg="submenu-menu"]:popover-open')

    // Hover over SubTrigger
    await subTrigger.hover()

    // Not open immediately
    const immediateOpen = await page.evaluate(() => {
      const el = document.querySelector('[data-pg="sub-content"]')
      return el?.matches(":popover-open")
    })
    eq(immediateOpen, false, "not open immediately on hover")

    // Wait for the delay (100ms + margin)
    await page.waitForTimeout(200)
    await waitSubOpen()

    // Move pointer away to close
    await page.mouse.move(5, 5)
    await page.waitForTimeout(200)

    await page.keyboard.press("Escape")
    await waitClosed()
  })

  await test("hover-open keeps highlight on SubTrigger; sub items highlight on hover", async () => {
    const subMenuTrigger = page.locator('[data-pg="submenu-trigger"]')
    await subMenuTrigger.click()
    await page.waitForSelector('[data-pg="submenu-menu"]:popover-open')

    await subTrigger.hover()
    await page.waitForTimeout(200)
    await waitSubOpen()

    // Hover-open must not steal focus into the submenu.
    const focusedPg = await page.evaluate(() => document.activeElement?.dataset?.pg)
    eq(focusedPg, "sub-trigger", "focus stays on SubTrigger after hover-open")

    await page.locator('[data-pg="sub-content"] [role="menuitem"]').first().hover()
    const focusedRole = await page.evaluate(() =>
      document.activeElement?.closest('[data-pg="sub-content"]')
        ? document.activeElement.getAttribute("role")
        : null
    )
    eq(focusedRole, "menuitem", "hovered submenu item focused")

    await page.keyboard.press("Escape")
    await waitClosed()
  })

  await test("safe triangle: diagonal move from SubTrigger into SubContent keeps it open", async () => {
    const subMenuTrigger = page.locator('[data-pg="submenu-trigger"]')
    await subMenuTrigger.click()
    await page.waitForSelector('[data-pg="submenu-menu"]:popover-open')

    // Hover SubTrigger to open submenu
    await subTrigger.hover()
    await page.waitForTimeout(200)
    await waitSubOpen()

    // Get SubTrigger and SubContent bounding boxes
    const boxes = await page.evaluate(() => {
      const trigger = document.querySelector('[data-pg="sub-trigger"]')
      const content = document.querySelector('[data-pg="sub-content"]')
      const tr = trigger.getBoundingClientRect()
      const cr = content.getBoundingClientRect()
      return {
        triggerRight: tr.right,
        triggerCenterY: tr.top + tr.height / 2,
        contentLeft: cr.left,
        contentCenterY: cr.top + cr.height / 2,
        contentTop: cr.top,
        contentBottom: cr.bottom,
      }
    })

    // Move diagonally from trigger toward the subcontent at human speed
    // (~320ms total, well past the 100ms close delay) — the safe triangle
    // must keep deferring the close for the whole travel.
    const startX = boxes.triggerRight - 2
    const startY = boxes.triggerCenterY
    const endX = boxes.contentLeft + 10
    const endY = boxes.contentCenterY

    await page.mouse.move(startX, startY)
    for (let i = 1; i <= 8; i++) {
      await page.mouse.move(
        startX + ((endX - startX) * i) / 8,
        startY + ((endY - startY) * i) / 8
      )
      await page.waitForTimeout(40)
    }

    // Submenu should still be open after the diagonal move
    const stillOpen = await page.evaluate(() => {
      const el = document.querySelector('[data-pg="sub-content"]')
      return el?.matches(":popover-open")
    })
    eq(stillOpen, true, "submenu stays open during diagonal move")

    await page.keyboard.press("Escape")
    await waitClosed()
  })

  await test("moving straight down to sibling item closes submenu", async () => {
    const subMenuTrigger = page.locator('[data-pg="submenu-trigger"]')
    await subMenuTrigger.click()
    await page.waitForSelector('[data-pg="submenu-menu"]:popover-open')

    // Hover SubTrigger to open submenu
    await subTrigger.hover()
    await page.waitForTimeout(200)
    await waitSubOpen()

    // Move straight down to a sibling item below the SubTrigger
    const siblingItem = page.locator('[data-pg="after-sub-item"]')
    await siblingItem.hover()

    // Wait for the close to happen
    await waitSubClosed()

    await page.keyboard.press("Escape")
    await waitClosed()
  })

  await test("Escape inside SubContent closes the whole stack and refocuses root trigger", async () => {
    const subMenuTrigger = page.locator('[data-pg="submenu-trigger"]')
    await subMenuTrigger.click()
    await page.waitForSelector('[data-pg="submenu-menu"]:popover-open')

    await subTrigger.focus()
    await page.keyboard.press("ArrowRight")
    await waitSubOpen()

    // Escape should close everything
    await page.keyboard.press("Escape")
    await waitClosed()

    // SubContent should also be closed
    const subClosed = await page.evaluate(() => {
      const el = document.querySelector('[data-pg="sub-content"]')
      return el && !el.matches(":popover-open")
    })
    eq(subClosed, true, "subcontent closed")

    // Focus should be back on the root trigger
    const focusedPg = await page.evaluate(() =>
      document.activeElement?.getAttribute("data-pg")
    )
    eq(focusedPg, "submenu-trigger", "focus on root trigger after Esc")
  })
}
