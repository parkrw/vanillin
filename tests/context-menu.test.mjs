export default async function run({ page, baseUrl, test, eq }) {
  await page.goto(`${baseUrl}/#context-menu`)

  const trigger = page.locator('[data-pg="context-trigger"]')

  const waitOpen = () => page.waitForSelector('[data-pg="context-menu"]:popover-open')
  const waitClosed = () =>
    page.waitForFunction(() => {
      const el = document.querySelector('[data-pg="context-menu"]')
      return el && !el.matches(":popover-open") && el.dataset.state === "closed"
    })

  // Record whether the contextmenu default was prevented (document bubble
  // listener runs after React's root handlers).
  await page.evaluate(() => {
    window.__ctxPrevented = null
    document.addEventListener("contextmenu", (e) => {
      window.__ctxPrevented = e.defaultPrevented
    })
  })

  // Helper: right-click at viewport coords and wait for the menu.
  const rightClickAt = async (x, y) => {
    await page.mouse.click(x, y, { button: "right" })
    await waitOpen()
  }

  // Helper: positionAnchored writes px left/top styles — read those (rects
  // are skewed by the entry scale transform).
  const menuPos = () =>
    page.evaluate(() => {
      const el = document.querySelector('[data-pg="context-menu"]')
      return {
        left: parseFloat(el.style.left),
        top: parseFloat(el.style.top),
        width: el.offsetWidth,
        height: el.offsetHeight,
        side: el.dataset.side,
        vw: document.documentElement.clientWidth,
        vh: document.documentElement.clientHeight,
      }
    })

  await test("right-click opens role=menu at pointer coords with first item focused", async () => {
    const box = await trigger.boundingBox()
    const x = Math.round(box.x + box.width / 2)
    const y = Math.round(box.y + box.height / 2)
    await rightClickAt(x, y)

    const menu = page.locator('[data-pg="context-menu"]')
    eq(await menu.getAttribute("role"), "menu", "role=menu")
    eq(await menu.getAttribute("data-state"), "open", "data-state=open")
    eq(await page.evaluate(() => window.__ctxPrevented), true, "native menu suppressed")

    // Cursor sits 2px inside the top-left corner (see ContextMenuContent);
    // top is cross-axis clamped to the viewport (positionAnchored formula).
    // Positioning settles a frame after :popover-open (ResizeObserver), so poll.
    await page.waitForFunction((expectedLeft) => {
      const el = document.querySelector('[data-pg="context-menu"]')
      return Math.abs(parseFloat(el.style.left) - expectedLeft) < 1
    }, x - 2)
    const pos = await menuPos()
    const expectedTop = Math.max(8, Math.min(y - 2, Math.max(8, pos.vh - pos.height - 8)))
    eq(Math.abs(pos.top - expectedTop) < 1, true, `top ~ clamped click y (${pos.top} vs ${expectedTop})`)

    const focusedRole = await page.evaluate(() => document.activeElement?.getAttribute("role"))
    eq(focusedRole, "menuitem", "first item focused")
  })

  await test("right-click at a second spot repositions the menu", async () => {
    // Menu is open from the previous test; right-click elsewhere in the area.
    const box = await trigger.boundingBox()
    const x = Math.round(box.x + box.width / 4)
    const y = Math.round(box.y + box.height / 4)
    await page.mouse.click(x, y, { button: "right" })

    await page.waitForFunction((expectedLeft) => {
      const el = document.querySelector('[data-pg="context-menu"]')
      return (
        el?.matches(":popover-open") && Math.abs(parseFloat(el.style.left) - expectedLeft) < 1
      )
    }, x - 2)

    await page.keyboard.press("Escape")
    await waitClosed()
  })

  await test("arrow nav + Enter selects item, updates readout, closes", async () => {
    const box = await trigger.boundingBox()
    await rightClickAt(Math.round(box.x + 40), Math.round(box.y + 40))

    // First focused item is "Back"; ArrowDown skips disabled "Forward" to "Reload".
    await page.keyboard.press("ArrowDown")
    const focused = await page.evaluate(() => document.activeElement?.textContent?.trim())
    eq(focused.startsWith("Reload"), true, "ArrowDown skips disabled item")

    await page.keyboard.press("Enter")
    await waitClosed()
    const readout = await page.locator('[data-pg="context-readout"]').textContent()
    eq(readout, "reload", "readout updated")
  })

  await test("Escape closes and state syncs (can reopen)", async () => {
    const box = await trigger.boundingBox()
    await rightClickAt(Math.round(box.x + 40), Math.round(box.y + 40))
    await page.keyboard.press("Escape")
    await waitClosed()

    await rightClickAt(Math.round(box.x + 60), Math.round(box.y + 60))
    await page.keyboard.press("Escape")
    await waitClosed()
  })

  await test("outside click closes and state syncs", async () => {
    const box = await trigger.boundingBox()
    await rightClickAt(Math.round(box.x + 40), Math.round(box.y + 40))
    await page.mouse.click(5, 5)
    await waitClosed()
  })

  await test("menu flips near the right viewport edge", async () => {
    const box = await trigger.boundingBox()
    const vw = await page.evaluate(() => document.documentElement.clientWidth)
    // Click as close to the right edge as the trigger area allows.
    const x = Math.round(Math.min(vw - 20, box.x + box.width - 5))
    const y = Math.round(box.y + box.height / 2)
    await rightClickAt(x, y)

    // Position settles a frame after open — poll until side + bounds match
    // what the final size dictates (flip near the edge, always in-viewport).
    await page.waitForFunction((clickX) => {
      const el = document.querySelector('[data-pg="context-menu"]')
      if (!el?.matches(":popover-open") || el.offsetWidth === 0) return false
      const vw = document.documentElement.clientWidth
      const fitsRight = clickX - 2 + el.offsetWidth <= vw - 8
      const left = parseFloat(el.style.left)
      return el.dataset.side === (fitsRight ? "right" : "left") && left + el.offsetWidth <= vw
    }, x)

    await page.keyboard.press("Escape")
    await waitClosed()
  })

  // ── Sub-task 2: long-press + re-export coverage ─────────────────────

  // Synthetic touch pointer events — Playwright's mouse is pointerType
  // "mouse", so dispatch PointerEvents directly to exercise the touch path.
  const touchEvent = (type, x, y) =>
    page.evaluate(
      ([type, x, y]) => {
        document.querySelector('[data-pg="context-trigger"]').dispatchEvent(
          new PointerEvent(type, {
            pointerType: "touch",
            clientX: x,
            clientY: y,
            bubbles: true,
          })
        )
      },
      [type, x, y]
    )

  await test("touch long-press (700ms) opens at the press point", async () => {
    const box = await trigger.boundingBox()
    const x = Math.round(box.x + 60)
    const y = Math.round(box.y + 60)
    await touchEvent("pointerdown", x, y)
    await page.waitForTimeout(800)
    await waitOpen()

    await page.waitForFunction((expectedLeft) => {
      const el = document.querySelector('[data-pg="context-menu"]')
      return Math.abs(parseFloat(el.style.left) - expectedLeft) < 1
    }, x - 2)

    await touchEvent("pointerup", x, y)
    await page.keyboard.press("Escape")
    await waitClosed()
  })

  await test("early release or move cancels the long-press", async () => {
    const box = await trigger.boundingBox()
    const x = Math.round(box.x + 60)
    const y = Math.round(box.y + 60)

    await touchEvent("pointerdown", x, y)
    await page.waitForTimeout(200)
    await touchEvent("pointerup", x, y)
    await page.waitForTimeout(700)
    let open = await page.evaluate(() =>
      document.querySelector('[data-pg="context-menu"]').matches(":popover-open")
    )
    eq(open, false, "released early — no open")

    await touchEvent("pointerdown", x, y)
    await page.waitForTimeout(200)
    await touchEvent("pointermove", x + 20, y)
    await page.waitForTimeout(700)
    open = await page.evaluate(() =>
      document.querySelector('[data-pg="context-menu"]').matches(":popover-open")
    )
    eq(open, false, "moved — no open")
  })

  await test("checkbox item toggles and persists on reopen (re-export wiring)", async () => {
    const box = await trigger.boundingBox()
    await rightClickAt(Math.round(box.x + 40), Math.round(box.y + 40))

    const cb = page.locator('[data-pg="ctx-cb-bookmarks"]')
    eq(await cb.getAttribute("role"), "menuitemcheckbox", "role=menuitemcheckbox")
    eq(await cb.getAttribute("aria-checked"), "true", "starts checked")

    await cb.click()
    await waitClosed()
    eq(
      await page.locator('[data-pg="ctx-cb-readout"]').textContent(),
      "off",
      "readout toggled"
    )

    await rightClickAt(Math.round(box.x + 40), Math.round(box.y + 40))
    eq(await cb.getAttribute("aria-checked"), "false", "persists on reopen")

    await page.keyboard.press("Escape")
    await waitClosed()
  })

  await test("radio group single-selects (re-export wiring)", async () => {
    const box = await trigger.boundingBox()
    await rightClickAt(Math.round(box.x + 40), Math.round(box.y + 40))

    await page.locator('[role="menuitemradio"][aria-checked="false"]').first().click()
    await waitClosed()
    eq(
      await page.locator('[data-pg="ctx-radio-readout"]').textContent(),
      "colm",
      "radio value changed"
    )
  })

  await test("submenu opens with ArrowRight, Escape closes the whole stack", async () => {
    const box = await trigger.boundingBox()
    await rightClickAt(Math.round(box.x + 40), Math.round(box.y + 40))

    await page.locator('[data-pg="ctx-sub-trigger"]').focus()
    await page.keyboard.press("ArrowRight")
    await page.waitForSelector('[data-pg="ctx-sub-content"]:popover-open')

    const focusedRole = await page.evaluate(() => {
      const sub = document.querySelector('[data-pg="ctx-sub-content"]')
      return sub.contains(document.activeElement)
        ? document.activeElement.getAttribute("role")
        : null
    })
    eq(focusedRole, "menuitem", "first submenu item focused")

    await page.keyboard.press("Escape")
    await waitClosed()
    const subClosed = await page.evaluate(
      () => !document.querySelector('[data-pg="ctx-sub-content"]').matches(":popover-open")
    )
    eq(subClosed, true, "submenu closed with the stack")
  })

  await test("disabled trigger lets the native context menu through", async () => {
    const disabledArea = page.locator('[data-pg="context-disabled-trigger"]')
    await disabledArea.scrollIntoViewIfNeeded()
    const box = await disabledArea.boundingBox()
    await page.mouse.click(
      Math.round(box.x + box.width / 2),
      Math.round(box.y + box.height / 2),
      { button: "right" }
    )

    eq(await page.evaluate(() => window.__ctxPrevented), false, "default not prevented")
    const opened = await page.evaluate(() =>
      [...document.querySelectorAll('[role="menu"]')].some((el) => el.matches(":popover-open"))
    )
    eq(opened, false, "our menu did not open")
  })
}
