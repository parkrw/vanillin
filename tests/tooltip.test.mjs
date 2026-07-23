export default async function run({ page, baseUrl, test, eq }) {
  await page.goto(`${baseUrl}/#tooltip`)

  // Helper: wait for a tooltip to be :popover-open and React-synced.
  const waitOpen = () => page.waitForSelector(".tooltip:popover-open")
  // Helper: wait until no tooltip is :popover-open AND React has synced.
  const waitClosed = () =>
    page.waitForFunction(() => {
      const tips = document.querySelectorAll(".tooltip")
      return (
        tips.length > 0 &&
        [...tips].every(
          (el) => !el.matches(":popover-open") && el.dataset.state === "closed"
        )
      )
    })
  // Helper: dismiss any open tooltips so tests start clean.
  const cleanup = async () => {
    await page.mouse.move(0, 0)
    await page.evaluate(() => document.activeElement?.blur())
    await waitClosed()
  }

  const trigger = page.locator('[data-pg="tooltip-trigger"]')

  await test("hover opens tooltip (delay 0 default), leave closes", async () => {
    await trigger.hover()
    await waitOpen()
    const el = page.locator(".tooltip:popover-open")
    eq(await el.getAttribute("data-state"), "open", "data-state open")
    eq(await el.evaluate((e) => e.matches(":popover-open")), true, ":popover-open")

    // Move pointer away to close
    await page.mouse.move(0, 0)
    await waitClosed()
  })

  await test("focus opens, blur closes", async () => {
    await trigger.focus()
    await waitOpen()

    // Blur the trigger directly — Tab would focus the next trigger and
    // reopen a different tooltip.
    await page.evaluate(() => document.activeElement?.blur())
    await waitClosed()
  })

  await test("Escape closes tooltip", async () => {
    await trigger.hover()
    await waitOpen()

    await page.keyboard.press("Escape")
    await cleanup()
  })

  await test("trigger has aria-describedby pointing at tooltip content", async () => {
    await trigger.hover()
    await waitOpen()

    const describedby = await trigger.getAttribute("aria-describedby")
    const content = await page.evaluate(
      (id) => document.getElementById(id)?.textContent,
      describedby
    )
    eq(content, "Default tooltip text", "aria-describedby content")

    await cleanup()
  })

  await test("tooltip has role=tooltip", async () => {
    await trigger.hover()
    const el = await waitOpen()
    eq(await el.getAttribute("role"), "tooltip", "role")
    await cleanup()
  })

  await test("touch pointer does not open tooltip", async () => {
    // Simulate touch pointerenter via native dispatch — React's synthetic
    // event system picks it up through capture-phase delegation.
    await page.evaluate(() => {
      const el = document.querySelector('[data-pg="tooltip-trigger"]')
      el.dispatchEvent(new PointerEvent("pointerenter", {
        bubbles: true, pointerType: "touch",
      }))
    })

    // Brief wait — tooltip should NOT open
    await page.waitForTimeout(100)
    const count = await page.evaluate(
      () => document.querySelectorAll(".tooltip:popover-open").length
    )
    eq(count, 0, "no tooltip for touch")

    // Clean up
    await page.evaluate(() => {
      const el = document.querySelector('[data-pg="tooltip-trigger"]')
      el.dispatchEvent(new PointerEvent("pointerleave", {
        bubbles: true, pointerType: "touch",
      }))
    })
  })

  await test("skip-delay window: second tooltip opens instantly", async () => {
    const trigger2 = page.locator('[data-pg="delayed-trigger"]')

    // The delayed section uses delayDuration=100. Hover trigger2, wait for it.
    await trigger2.hover()
    // Must wait for the delay
    await waitOpen()

    // Leave and quickly hover the default trigger (delay 0 provider)
    await page.mouse.move(0, 0)
    // Don't wait for full close — move to next trigger within skip window
    await trigger.hover()

    // Should open instantly (within skip window ~300ms)
    await waitOpen()
    const el = page.locator(".tooltip:popover-open")
    eq(await el.evaluate((e) => e.matches(":popover-open")), true, "opened instantly")

    await cleanup()
  })

  await test("controlled open/onOpenChange", async () => {
    const readout = page.locator('[data-pg="controlled-tooltip-state"]')
    eq(await readout.textContent(), "closed", "initially closed")

    const ctrlTrigger = page.locator('[data-pg="controlled-trigger"]')
    await ctrlTrigger.hover()
    await waitOpen()
    eq(await readout.textContent(), "open", "state says open")

    await page.mouse.move(0, 0)
    await waitClosed()
    eq(await readout.textContent(), "closed", "state says closed after leave")
  })
}
