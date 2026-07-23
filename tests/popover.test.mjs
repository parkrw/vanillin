export default async function run({ page, baseUrl, test, eq }) {
  await page.goto(`${baseUrl}/#popover`)

  const trigger = page.locator('button:has-text("Open popover")')

  // Helper: wait for exactly one :popover-open, return it.
  const waitOpen = () => page.waitForSelector(".popover:popover-open")
  // Helper: wait until no popover is :popover-open AND React has synced
  // (data-state="closed"). The native hide happens before React re-renders,
  // so checking :popover-open alone would race.
  const waitClosed = () =>
    page.waitForFunction(() => {
      const popovers = document.querySelectorAll(".popover")
      return (
        popovers.length > 0 &&
        [...popovers].every(
          (el) => !el.matches(":popover-open") && el.dataset.state === "closed"
        )
      )
    })

  await test("trigger click opens with :popover-open, data-state, positioned below trigger", async () => {
    await trigger.click()
    const el = await waitOpen()
    eq(await el.evaluate((e) => e.matches(":popover-open")), true, ":popover-open")
    eq(await el.getAttribute("data-state"), "open", "data-state")
    eq(await el.getAttribute("data-side"), "bottom", "data-side")

    const positions = await page.evaluate(() => {
      const t = document.querySelector('[data-pg="popover-trigger"]')
      const c = document.querySelector(".popover:popover-open")
      const tr = t.getBoundingClientRect()
      const cr = c.getBoundingClientRect()
      return { triggerBottom: tr.bottom, contentTop: cr.top }
    })
    eq(positions.contentTop >= positions.triggerBottom, true, "below trigger")
  })

  await test("Escape closes and state syncs (can reopen)", async () => {
    await page.keyboard.press("Escape")
    await waitClosed()

    // reopen to prove state synced back
    await trigger.click()
    const el = await waitOpen()
    eq(await el.evaluate((e) => e.matches(":popover-open")), true, "reopened")
    await page.keyboard.press("Escape")
    await waitClosed()
  })

  await test("outside click closes and state syncs (can reopen)", async () => {
    await trigger.click()
    await waitOpen()

    // click well outside
    await page.mouse.click(5, 5)
    await waitClosed()

    // reopen to confirm state sync
    await trigger.click()
    const el = await waitOpen()
    eq(await el.getAttribute("data-state"), "open", "reopened after outside click")
    await page.keyboard.press("Escape")
    await waitClosed()
  })

  await test("side and align props respected", async () => {
    const rightTrigger = page.locator('button:has-text("Right-start")')
    await rightTrigger.click()
    const el = await waitOpen()

    eq(await el.getAttribute("data-side"), "right", "data-side=right")
    eq(await el.getAttribute("data-align"), "start", "data-align=start")

    const positions = await page.evaluate(() => {
      const t = document.querySelector('[data-pg="right-trigger"]')
      const c = document.querySelector(".popover:popover-open")
      const tr = t.getBoundingClientRect()
      const cr = c.getBoundingClientRect()
      return { triggerRight: tr.right, contentLeft: cr.left }
    })
    eq(positions.contentLeft >= positions.triggerRight, true, "right of trigger")

    await page.keyboard.press("Escape")
    await waitClosed()
  })

  await test("controlled open/onOpenChange", async () => {
    const readout = page.locator('[data-pg="controlled-popover-state"]')
    eq(await readout.textContent(), "closed", "initially closed")

    await page.locator('button:has-text("Open controlled")').click()
    await waitOpen()
    eq(await readout.textContent(), "open", "state says open")

    await page.keyboard.press("Escape")
    await waitClosed()
    eq(await readout.textContent(), "closed", "state says closed after Esc")
  })

  await test("focus is NOT trapped - tab moves out of popover", async () => {
    await trigger.click()
    await waitOpen()

    // Tab repeatedly to move focus past popover contents and out
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press("Tab")
    }

    const focusInPopover = await page.evaluate(() => {
      const popover = document.querySelector(".popover:popover-open")
      return popover && popover.contains(document.activeElement)
    })
    eq(focusInPopover, false, "focus escaped popover")

    await page.keyboard.press("Escape")
    await waitClosed()
  })

  await test("trigger has correct aria attributes", async () => {
    eq(await trigger.getAttribute("aria-haspopup"), "dialog", "aria-haspopup")
    eq(await trigger.getAttribute("aria-expanded"), "false", "aria-expanded when closed")

    await trigger.click()
    await waitOpen()
    eq(await trigger.getAttribute("aria-expanded"), "true", "aria-expanded when open")

    const controls = await trigger.getAttribute("aria-controls")
    const controlledEl = await page.evaluate((id) => !!document.getElementById(id), controls)
    eq(controlledEl, true, "aria-controls points to real element")

    await page.keyboard.press("Escape")
    await waitClosed()
  })

  await test("content has aria-labelledby and aria-describedby", async () => {
    await trigger.click()
    const el = await waitOpen()

    const [title, desc] = await el.evaluate((e) => [
      document.getElementById(e.getAttribute("aria-labelledby"))?.textContent,
      document.getElementById(e.getAttribute("aria-describedby"))?.textContent,
    ])
    eq(title, "Popover title", "labelledby")
    eq(desc, "Popover description text.", "describedby")

    await page.keyboard.press("Escape")
    await waitClosed()
  })

  await test("close triggers an exit animation", async () => {
    // Playwright defaults to prefers-reduced-motion: no-preference,
    // so transitions play normally.
    await trigger.click()
    await waitOpen()

    // Close via Escape — hidePopover fires, exit transition begins
    await page.keyboard.press("Escape")

    // Immediately after Esc, the element should be animating (exit transition
    // on opacity/transform while overlay keeps it in the top layer).
    const animating = await page.evaluate(() => {
      const el = document.querySelector('[data-pg="popover-trigger"]')
        ?.closest("section")
        ?.querySelector(".popover")
      if (!el) return false
      return el.getAnimations().length > 0
    })
    eq(animating, true, "exit animation running")

    await waitClosed()
  })
}
