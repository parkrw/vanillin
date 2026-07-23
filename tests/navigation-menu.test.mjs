export default async function run({ page, baseUrl, test, eq }) {
  await page.goto(`${baseUrl}/#navigation-menu`)

  const waitOpen = (pg) =>
    page.waitForSelector(`[data-pg="${pg}"]:popover-open`)
  const waitAllClosed = () =>
    page.waitForFunction(() => {
      const panels = document.querySelectorAll(".navigation-menu-content")
      return (
        panels.length > 0 &&
        [...panels].every(
          (el) => !el.matches(":popover-open") && el.dataset.state === "closed"
        )
      )
    })
  const openCount = () =>
    page.evaluate(
      () => document.querySelectorAll(".navigation-menu-content:popover-open").length
    )
  const cleanup = async () => {
    await page.mouse.move(0, 0)
    await page.keyboard.press("Escape")
    await page.evaluate(() => document.activeElement?.blur())
    await waitAllClosed()
  }

  const learnTrigger = page.locator('[data-pg="nm-trigger-learn"]')
  const componentsTrigger = page.locator('[data-pg="nm-trigger-components"]')

  await test("hover opens after delay, leave closes after grace", async () => {
    // Demo uses delayDuration=100, closeDelay=100 for test speed.
    await learnTrigger.hover()
    eq(await openCount(), 0, "not open before delay")
    await waitOpen("nm-content-learn")
    eq(await learnTrigger.getAttribute("data-state"), "open", "trigger data-state open")
    eq(await learnTrigger.getAttribute("aria-expanded"), "true", "aria-expanded true")

    await page.mouse.move(0, 0)
    eq(await openCount(), 1, "still open during closeDelay grace")
    await waitAllClosed()
    eq(await learnTrigger.getAttribute("data-state"), "closed", "trigger data-state closed")
  })

  await test("hovering a second trigger switches with a single panel open", async () => {
    await learnTrigger.hover()
    await waitOpen("nm-content-learn")
    await componentsTrigger.hover()
    await waitOpen("nm-content-components")
    await page.waitForFunction(() =>
      !document
        .querySelector('[data-pg="nm-content-learn"]')
        .matches(":popover-open")
    )
    eq(await openCount(), 1, "exactly one panel open after switch")
    await cleanup()
  })

  await test("pointer into content keeps it open; link click closes", async () => {
    await learnTrigger.hover()
    await waitOpen("nm-content-learn")
    await page.locator('[data-pg="nm-link-intro"]').hover()
    await page.waitForTimeout(250) // > closeDelay (100)
    eq(await openCount(), 1, "stays open while pointer is over content")
    await page.locator('[data-pg="nm-link-intro"]').click()
    await waitAllClosed()
    await cleanup()
  })

  await test("click toggles open and closed", async () => {
    // Sit out the skip window (300ms) from the previous close — inside it,
    // click's own pointerenter hover-opens instantly and the click then
    // means close (Radix parity: clicking a hover-opened trigger closes).
    await page.waitForTimeout(350)
    await learnTrigger.click()
    await waitOpen("nm-content-learn")
    await learnTrigger.click()
    await waitAllClosed()
    await cleanup()
  })

  await test("outside click closes and syncs state", async () => {
    await page.waitForTimeout(350) // skip-window guard, see above
    await learnTrigger.click()
    await waitOpen("nm-content-learn")
    await page.locator("h2").click()
    await waitAllClosed()
    eq(await learnTrigger.getAttribute("aria-expanded"), "false", "aria-expanded false")
    await cleanup()
  })

  await test("ArrowDown opens and focuses first link, arrows cycle, Esc refocuses trigger", async () => {
    await learnTrigger.focus()
    await page.keyboard.press("ArrowDown")
    await waitOpen("nm-content-learn")
    await page.waitForFunction(
      () => document.activeElement?.dataset.pg === "nm-link-intro"
    )

    await page.keyboard.press("ArrowDown")
    const second = await page.evaluate(
      () => document.activeElement?.querySelector("div")?.textContent
    )
    eq(second, "Installation", "ArrowDown moves to second link")
    await page.keyboard.press("ArrowUp")
    await page.waitForFunction(
      () => document.activeElement?.dataset.pg === "nm-link-intro"
    )

    await page.keyboard.press("Escape")
    await waitAllClosed()
    await page.waitForFunction(
      () => document.activeElement?.dataset.pg === "nm-trigger-learn"
    )
    await cleanup()
  })

  await test("ArrowRight/Left move focus along the list", async () => {
    await learnTrigger.focus()
    await page.keyboard.press("ArrowRight")
    await page.waitForFunction(
      () => document.activeElement?.dataset.pg === "nm-trigger-components"
    )
    await page.keyboard.press("ArrowRight")
    await page.waitForFunction(
      () => document.activeElement?.dataset.pg === "nm-link-docs"
    )
    await page.keyboard.press("ArrowLeft")
    await page.waitForFunction(
      () => document.activeElement?.dataset.pg === "nm-trigger-components"
    )
    await page.evaluate(() => document.activeElement?.blur())
  })

  await test("bare link with navigationMenuTriggerStyle renders as styled anchor", async () => {
    const docsLink = page.locator('[data-pg="nm-link-docs"]')
    eq(await docsLink.evaluate((el) => el.tagName), "A", "renders <a>")
    eq(
      await docsLink.evaluate((el) => el.classList.contains("navigation-menu-trigger")),
      true,
      "has trigger class"
    )
  })

  await test("controlled value/onValueChange", async () => {
    const readout = page.locator('[data-pg="nm-ctrl-state"]')
    eq(await readout.textContent(), "none", "initially none")
    await page.locator('[data-pg="nm-ctrl-trigger"]').click()
    await page.waitForFunction(
      () =>
        document.querySelector('[data-pg="nm-ctrl-state"]').textContent === "one"
    )
    await page.keyboard.press("Escape")
    await page.waitForFunction(
      () =>
        document.querySelector('[data-pg="nm-ctrl-state"]').textContent === "none"
    )
    await cleanup()
  })
}
