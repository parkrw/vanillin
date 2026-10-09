export default async function run({ page, baseUrl, test, eq, near }) {
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

  await test("content is anchored near the trigger", async () => {
    await trigger.hover()
    const tip = await waitOpen()
    eq(await tip.getAttribute("data-side"), "top", "data-side is set")
    const triggerBox = await trigger.boundingBox()
    const tipBox = await page.locator(".tooltip:popover-open").boundingBox()
    eq(tipBox.y + tipBox.height <= triggerBox.y + 2, true, "tip is above or adjacent to trigger")
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

  // The first frame an overlay paints, against the steady state. The rAF loop
  // is armed before the open, so its first read of the open popover is what
  // that frame paints — before the anchor hook's ResizeObserver has had a
  // frame to correct it. Layout values, not getBoundingClientRect: the
  // @starting-style scale skews the rect. It waits for display: none first:
  // an exit fade keeps a closed popover laid out, and a measure taken then
  // borrows the old box, which hides a position taken before the show.
  const armFirstFrame = async (selector) => {
    await page.waitForFunction(
      (sel) => [...document.querySelectorAll(sel)].every((el) => getComputedStyle(el).display === "none"),
      selector
    )
    await page.evaluate((sel) => {
      const box = (el) => ({
        left: parseFloat(getComputedStyle(el).left),
        top: parseFloat(getComputedStyle(el).top),
        width: el.offsetWidth,
        height: el.offsetHeight,
        side: el.dataset.side,
      })
      window.__firstFrame = new Promise((resolve) => {
        const tick = () => {
          const el = document.querySelector(`${sel}:popover-open`)
          if (!el) return requestAnimationFrame(tick)
          const first = box(el)
          let frames = 3
          const settle = () =>
            --frames ? requestAnimationFrame(settle) : resolve({ first, steady: box(el) })
          requestAnimationFrame(settle)
        }
        requestAnimationFrame(tick)
      })
    }, selector)
  }
  const expectFirstFrameInPlace = async (selector) => {
    await page.waitForSelector(`${selector}:popover-open`)
    const { first, steady } = await page.evaluate(() => window.__firstFrame)
    eq(first.width > 0 && first.height > 0, true, `laid out in the first frame (${first.width}×${first.height})`)
    near(first.left, steady.left, 1, "first-frame left")
    near(first.top, steady.top, 1, "first-frame top")
    eq(first.side, steady.side, "first-frame side")
    return steady
  }

  await test("first frame is already in place: shown before it is positioned", async () => {
    await armFirstFrame(".tooltip")
    await trigger.hover()
    await expectFirstFrameInPlace(".tooltip")
    await cleanup()
  })
}
