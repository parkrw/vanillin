import { firstFrame } from "./helpers/first-frame.mjs"

export default async function run({ page, baseUrl, test, eq, near }) {
  await page.goto(`${baseUrl}/#hover-card`)
  const { armFirstFrame, expectFirstFrameInPlace } = firstFrame({ page, eq, near })

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
    // Demo trigger uses openDelay=100, closeDelay=100 for test speed. The
    // delays are read from timestamps taken in the page, so a slow round trip
    // from the test cannot pass for an early open or an early close.
    await page.evaluate(() => {
      const marks = (window.__hoverMarks = {})
      const listening = (window.__hoverMarksDone = new AbortController())
      const opts = { capture: true, signal: listening.signal }
      const onTrigger = (e) => e.target instanceof Element && e.target.closest('[data-pg="hover-card-trigger"]')
      document.addEventListener("pointerover", (e) => { if (onTrigger(e)) marks.enter ??= e.timeStamp }, opts)
      document.addEventListener("pointerout", (e) => { if (onTrigger(e) && marks.open) marks.leave ??= e.timeStamp }, opts)
      // beforetoggle fires inside showPopover/hidePopover, at the moment itself.
      document.addEventListener("beforetoggle", (e) => {
        if (!e.target.matches?.(".hover-card")) return
        if (e.newState === "open") marks.open ??= performance.now()
        else if (marks.leave) marks.close ??= performance.now()
      }, opts)
    })
    try {
      await trigger.hover()
      const el = await waitOpen()
      eq(await el.getAttribute("data-state"), "open", "data-state open")
      await page.mouse.move(0, 0)
      await waitClosed()

      const m = await page.evaluate(() => window.__hoverMarks)
      eq(
        [m.enter, m.open, m.leave, m.close].every((t) => typeof t === "number"),
        true,
        `precondition: enter, open, leave and close all recorded (${JSON.stringify(m)})`
      )
      eq(m.open - m.enter >= 99, true, `opened ${Math.round(m.open - m.enter)}ms after the pointer entered, not before the delay`)
      eq(m.close - m.leave >= 99, true, `closed ${Math.round(m.close - m.leave)}ms after the pointer left, not before the grace`)
    } finally {
      await page.evaluate(() => window.__hoverMarksDone.abort())
    }
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

  await test("content is anchored below the trigger", async () => {
    await trigger.hover()
    const card = await waitOpen()
    eq(await card.getAttribute("data-side"), "bottom", "data-side is bottom")
    eq(await card.getAttribute("data-align"), "center", "data-align is center")
    const triggerBox = await trigger.boundingBox()
    const cardBox = await page.locator(".hover-card:popover-open").boundingBox()
    eq(cardBox.y > triggerBox.y, true, "card is below the trigger")
    await cleanup()
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

  await test("first frame is already in place: shown before it is positioned", async () => {
    await armFirstFrame(".hover-card")
    await trigger.hover()
    await expectFirstFrameInPlace(".hover-card")
    await cleanup()
  })
}
