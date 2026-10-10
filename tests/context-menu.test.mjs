export default async function run({ page, baseUrl, test, eq }) {
  await page.goto(`${baseUrl}/#context-menu`)

  const trigger = page.locator('[data-pg="context-trigger"]')

  const waitOpen = () => page.waitForSelector('[data-pg="context-menu"]:popover-open')
  const waitClosed = () =>
    page.waitForFunction(() => {
      const el = document.querySelector('[data-pg="context-menu"]')
      return el && !el.matches(":popover-open") && el.dataset.state === "closed"
    })

  const isClosed = () =>
    page.evaluate(() => {
      const el = document.querySelector('[data-pg="context-menu"]')
      return !el || (!el.matches(":popover-open") && el.dataset.state === "closed")
    })

  // All suites share one page: a test that opens from a menu left open by
  // the one before measures that leftover, not its own gesture.
  const menuTest = (name, fn) =>
    test(name, async () => {
      eq(await isClosed(), true, "starts with the menu closed")
      await fn()
    })

  const waitLeft = (expectedLeft) =>
    page.waitForFunction((expectedLeft) => {
      const el = document.querySelector('[data-pg="context-menu"]')
      return el?.matches(":popover-open") && Math.abs(parseFloat(el.style.left) - expectedLeft) < 1
    }, expectedLeft)

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

  await menuTest("right-click opens role=menu at pointer coords with first item focused", async () => {
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

    await page.keyboard.press("Escape")
    await waitClosed()
  })

  await menuTest("right-click at a second spot repositions the menu", async () => {
    const box = await trigger.boundingBox()
    const firstX = Math.round(box.x + box.width / 2)
    await rightClickAt(firstX, Math.round(box.y + box.height / 2))
    await waitLeft(firstX - 2)

    const x = Math.round(box.x + box.width / 4)
    const y = Math.round(box.y + box.height / 4)
    eq(x !== firstX, true, `second spot (${x}) differs from the first (${firstX})`)
    await page.mouse.click(x, y, { button: "right" })
    await waitLeft(x - 2)

    await page.keyboard.press("Escape")
    await waitClosed()
  })

  await menuTest("Escape right after a right-click on the open menu closes it; the deferred open does not re-show it", async () => {
    const box = await trigger.boundingBox()
    await rightClickAt(Math.round(box.x + box.width / 2), Math.round(box.y + box.height / 2))
    // One task, before the deferred open runs: a right-click while open
    // (Windows order, contextmenu after the release, so it opens at once),
    // then the user's Escape. A synthetic Escape does not light-dismiss, so
    // the native hide it would cause is done by hand.
    const x = Math.round(box.x + (box.width * 3) / 4)
    const y = Math.round(box.y + (box.height * 3) / 4)
    const wasOpen = await page.evaluate(({ x, y }) => {
      const menu = document.querySelector('[data-pg="context-menu"]')
      const open = menu.matches(":popover-open")
      document
        .querySelector('[data-pg="context-trigger"]')
        .dispatchEvent(new MouseEvent("contextmenu", { bubbles: true, cancelable: true, clientX: x, clientY: y, buttons: 0 }))
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }))
      menu.hidePopover()
      return open
    }, { x, y })
    eq(wasOpen, true, "the menu was open when the second right-click landed")
    await page.waitForFunction((expectedLeft) => Math.abs(parseFloat(document.querySelector('[data-pg="context-menu"]').style.left) - expectedLeft) < 1, x - 2)
    await waitClosed()
    await page.waitForTimeout(100)
    eq(await page.evaluate(() => document.querySelector('[data-pg="context-menu"]').matches(":popover-open")), false, "still closed once the deferred open has run")
  })

  await menuTest("arrow nav + Enter selects item, updates readout, closes", async () => {
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

  await menuTest("Escape closes and state syncs (can reopen)", async () => {
    const box = await trigger.boundingBox()
    await rightClickAt(Math.round(box.x + 40), Math.round(box.y + 40))
    await page.keyboard.press("Escape")
    await waitClosed()

    await rightClickAt(Math.round(box.x + 60), Math.round(box.y + 60))
    await page.keyboard.press("Escape")
    await waitClosed()
  })

  await menuTest("outside click closes and state syncs", async () => {
    const box = await trigger.boundingBox()
    await rightClickAt(Math.round(box.x + 40), Math.round(box.y + 40))
    await page.mouse.click(5, 5)
    await waitClosed()
  })

  await menuTest("menu flips near the right viewport edge", async () => {
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

  await menuTest("hover highlights items in menu and submenu", async () => {
    const box = await trigger.boundingBox()
    await rightClickAt(Math.round(box.x + 40), Math.round(box.y + 40))

    const reload = page.locator('[data-pg="context-menu"] [role="menuitem"]', {
      hasText: "Reload",
    })
    await reload.hover()
    const focused = await page.evaluate(() => document.activeElement?.textContent?.trim())
    eq(focused.startsWith("Reload"), true, "hovered item highlighted")

    await page.locator('[data-pg="ctx-sub-trigger"]').hover()
    await page.waitForSelector('[data-pg="ctx-sub-content"]:popover-open')
    await page.locator('[data-pg="ctx-sub-content"] [role="menuitem"]').first().hover()
    const inSub = await page.evaluate(() => {
      const sub = document.querySelector('[data-pg="ctx-sub-content"]')
      return sub.contains(document.activeElement)
        ? document.activeElement.getAttribute("role")
        : null
    })
    eq(inSub, "menuitem", "hovered submenu item highlighted")

    await page.keyboard.press("Escape")
    await waitClosed()
  })

  await menuTest("held right-click with drift survives the release (light-dismiss race)", async () => {
    // Real gesture: contextmenu fires on the press (macOS), the hand drifts a
    // few px, and the release lands mid entry animation. Regression: the menu
    // used to flash open then light-dismiss on that pointerup.
    const box = await trigger.boundingBox()
    const x = Math.round(box.x + box.width / 2)
    const y = Math.round(box.y + box.height / 2)
    await page.mouse.move(x, y)
    await page.mouse.down({ button: "right" })
    await page.waitForTimeout(120)
    await page.mouse.move(x - 4, y - 4)
    await page.mouse.up({ button: "right" })
    await waitOpen()
    await page.waitForTimeout(400)
    eq(
      await page.evaluate(() =>
        document.querySelector('[data-pg="context-menu"]').matches(":popover-open")
      ),
      true,
      "menu still open after release"
    )

    // Anchored at the press point, not the release point.
    await page.waitForFunction((expectedLeft) => {
      const el = document.querySelector('[data-pg="context-menu"]')
      return Math.abs(parseFloat(el.style.left) - expectedLeft) < 1
    }, x - 2)

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

  await menuTest("touch long-press (700ms) opens at the press point on release", async () => {
    const box = await trigger.boundingBox()
    const x = Math.round(box.x + 60)
    const y = Math.round(box.y + 60)
    await touchEvent("pointerdown", x, y)
    await page.waitForTimeout(800)
    // Open is deferred to the gesture end (see openOnGestureEnd) — the lift
    // triggers it, anchored at the press point.
    await touchEvent("pointerup", x, y)
    await waitOpen()

    await page.waitForFunction((expectedLeft) => {
      const el = document.querySelector('[data-pg="context-menu"]')
      return Math.abs(parseFloat(el.style.left) - expectedLeft) < 1
    }, x - 2)

    await page.keyboard.press("Escape")
    await waitClosed()
  })

  await menuTest("early release or move cancels the long-press", async () => {
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

  await menuTest("checkbox item toggles and persists on reopen (re-export wiring)", async () => {
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

  await menuTest("radio group single-selects (re-export wiring)", async () => {
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

  await menuTest("submenu opens with ArrowRight, Escape closes the whole stack", async () => {
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

  await menuTest("disabled trigger lets the native context menu through", async () => {
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
