export default async function run({ page, baseUrl, test, eq }) {
  await page.goto(`${baseUrl}/#hover-card`)

  const waitOpen = () => page.waitForSelector(".hover-card:popover-open")
  const waitClosed = () =>
    page.waitForFunction(() => {
      const cards = document.querySelectorAll(".hover-card")
      return (
        cards.length > 0 &&
        [...cards].every(
          (el) => !el.matches(":popover-open") && el.dataset.state === "closed"
        )
      )
    })
  const cleanup = async () => {
    await page.mouse.move(0, 0)
    await page.evaluate(() => document.activeElement?.blur())
    await waitClosed()
  }

  const trigger = page.locator('[data-pg="hover-card-trigger"]')

  await test("hover opens after openDelay, leave closes after closeDelay", async () => {
    // Demo trigger uses openDelay=100, closeDelay=100 for test speed.
    await trigger.hover()
    // Not open immediately — the openDelay must elapse first.
    const immediate = await page.evaluate(
      () => document.querySelectorAll(".hover-card:popover-open").length
    )
    eq(immediate, 0, "not open before delay")
    const el = await waitOpen()
    eq(await el.getAttribute("data-state"), "open", "data-state open")

    await page.mouse.move(0, 0)
    // Still open during the closeDelay grace period.
    const stillOpen = await page.evaluate(
      () => document.querySelectorAll(".hover-card:popover-open").length
    )
    eq(stillOpen, 1, "open during closeDelay grace")
    await waitClosed()
  })

  await test("pointer moving into the content keeps it open", async () => {
    await trigger.hover()
    await waitOpen()

    // Move onto the open card — the pending close must be cancelled.
    await page.locator(".hover-card:popover-open").hover()
    await page.waitForTimeout(250) // > closeDelay (100)
    const count = await page.evaluate(
      () => document.querySelectorAll(".hover-card:popover-open").length
    )
    eq(count, 1, "stays open while pointer is over content")

    await cleanup()
  })

  await test("focus opens instantly, blur closes", async () => {
    await trigger.focus()
    await waitOpen()
    await page.evaluate(() => document.activeElement?.blur())
    await waitClosed()
  })

  await test("Escape closes", async () => {
    await trigger.hover()
    await waitOpen()
    await page.keyboard.press("Escape")
    await cleanup()
  })

  await test("touch pointer does not open", async () => {
    await page.evaluate(() => {
      const el = document.querySelector('[data-pg="hover-card-trigger"]')
      el.dispatchEvent(new PointerEvent("pointerenter", {
        bubbles: true, pointerType: "touch",
      }))
    })
    await page.waitForTimeout(250)
    const count = await page.evaluate(
      () => document.querySelectorAll(".hover-card:popover-open").length
    )
    eq(count, 0, "no hover card for touch")
    await page.evaluate(() => {
      const el = document.querySelector('[data-pg="hover-card-trigger"]')
      el.dispatchEvent(new PointerEvent("pointerleave", {
        bubbles: true, pointerType: "touch",
      }))
    })
  })

  await test("trigger defaults to an anchor with data-state", async () => {
    const tag = await trigger.evaluate((el) => el.tagName)
    eq(tag, "A", "renders <a> by default")
    eq(await trigger.getAttribute("data-state"), "closed", "data-state closed")
  })

  await test("controlled open/onOpenChange", async () => {
    const readout = page.locator('[data-pg="controlled-hover-card-state"]')
    eq(await readout.textContent(), "closed", "initially closed")

    const ctrlTrigger = page.locator('[data-pg="controlled-hover-trigger"]')
    await ctrlTrigger.hover()
    await waitOpen()
    eq(await readout.textContent(), "open", "state says open")

    await page.mouse.move(0, 0)
    await waitClosed()
    eq(await readout.textContent(), "closed", "state says closed after leave")
  })
}
