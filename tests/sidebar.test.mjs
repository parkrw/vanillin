export default async function run({ page, baseUrl, test, eq, near }) {
  await page.goto(`${baseUrl}/#sidebar`)

  // The page is lazy-loaded — wait for the sidebar wrapper to appear
  await page.locator('[data-pg="sb-main"] .sidebar-wrapper').waitFor()

  const el = (pg, sel = "") => page.locator(`[data-pg="${pg}"] ${sel}`.trim())

  /** Wait for all animations on an element to settle. */
  const settle = (locator) =>
    locator.evaluate((el) => Promise.all(el.getAnimations({ subtree: true }).map((a) => a.finished)))

  /** Wait for CSS transitions on a specific element to finish. */
  const waitTransitions = (locator) =>
    locator.evaluate(
      (el) =>
        new Promise((resolve) => {
          const anims = el.getAnimations()
          if (!anims.length) return resolve()
          Promise.all(anims.map((a) => a.finished)).then(resolve)
        })
    )

  // ---------------------------------------------------------------------------
  // Trigger toggles open/collapsed
  // ---------------------------------------------------------------------------

  await test("trigger toggles sidebar between expanded and collapsed", async () => {
    const wrapper = el("sb-main", ".sidebar-wrapper")
    eq(await wrapper.getAttribute("data-state"), "expanded", "starts expanded")

    // Measure expanded width
    const sidebar = el("sb-main", ".sidebar")
    const expandedWidth = await sidebar.evaluate((el) => el.getBoundingClientRect().width)
    near(expandedWidth, 256, 2, "expanded width ~16rem (256px)")

    // Click trigger to collapse
    await el("sb-main", ".sidebar-trigger").click()
    await waitTransitions(sidebar)

    eq(await wrapper.getAttribute("data-state"), "collapsed", "now collapsed")

    // Click trigger to expand again
    await el("sb-main", ".sidebar-trigger").click()
    await waitTransitions(sidebar)

    eq(await wrapper.getAttribute("data-state"), "expanded", "re-expanded")
  })

  // ---------------------------------------------------------------------------
  // Cmd+B / Ctrl+B keyboard shortcut
  // ---------------------------------------------------------------------------

  await test("Cmd+B toggles sidebar", async () => {
    const wrapper = el("sb-main", ".sidebar-wrapper")
    eq(await wrapper.getAttribute("data-state"), "expanded", "starts expanded")

    // Focus somewhere in the demo, then press Cmd+B
    await el("sb-main", ".sidebar-trigger").focus()
    await page.keyboard.press("Meta+b")
    await waitTransitions(el("sb-main", ".sidebar"))

    eq(await wrapper.getAttribute("data-state"), "collapsed", "collapsed via Cmd+B")

    // Toggle back
    await page.keyboard.press("Meta+b")
    await waitTransitions(el("sb-main", ".sidebar"))

    eq(await wrapper.getAttribute("data-state"), "expanded", "re-expanded via Cmd+B")
  })

  // ---------------------------------------------------------------------------
  // Cookie written on toggle
  // ---------------------------------------------------------------------------

  await test("cookie is written on state change", async () => {
    // Collapse
    await el("sb-main", ".sidebar-trigger").click()
    await waitTransitions(el("sb-main", ".sidebar"))

    const cookie = await page.evaluate(() => document.cookie)
    eq(cookie.includes("sidebar_state=false"), true, "cookie set to false")

    // Expand back
    await el("sb-main", ".sidebar-trigger").click()
    await waitTransitions(el("sb-main", ".sidebar"))

    const cookie2 = await page.evaluate(() => document.cookie)
    eq(cookie2.includes("sidebar_state=true"), true, "cookie set to true")
  })

  // ---------------------------------------------------------------------------
  // Icon-collapsible keeps icons visible
  // ---------------------------------------------------------------------------

  await test("icon collapsible keeps icons visible at icon width", async () => {
    const wrapper = el("sb-icon", ".sidebar-wrapper")

    // sb-icon starts collapsed (defaultOpen={false})
    eq(await wrapper.getAttribute("data-state"), "collapsed", "starts collapsed")
    eq(await wrapper.getAttribute("data-collapsible"), "icon", "collapsible=icon")

    const sidebar = el("sb-icon", ".sidebar")
    const collapsedWidth = await sidebar.evaluate((el) => el.getBoundingClientRect().width)
    // Icon width should be ~3rem = 48px
    near(collapsedWidth, 48, 2, "icon-collapsed width ~3rem (48px)")

    // Icons should still be visible
    const iconVisible = await el("sb-icon", ".sidebar-menu-button svg").first().evaluate(
      (el) => getComputedStyle(el).display !== "none" && el.getBoundingClientRect().width > 0
    )
    eq(iconVisible, true, "icon is still visible when collapsed")

    // Expand
    await el("sb-icon", ".sidebar-trigger").click()
    await waitTransitions(sidebar)

    const expandedWidth = await sidebar.evaluate((el) => el.getBoundingClientRect().width)
    near(expandedWidth, 256, 2, "expanded to full width")

    // Collapse back for later tests
    await el("sb-icon", ".sidebar-trigger").click()
    await waitTransitions(sidebar)
  })

  // ---------------------------------------------------------------------------
  // Mobile viewport renders the sheet path
  // ---------------------------------------------------------------------------

  await test("mobile viewport renders via sheet and trigger opens it", async () => {
    const originalSize = page.viewportSize()

    try {
      // Switch to mobile viewport — matchMedia listener triggers useIsMobile
      await page.setViewportSize({ width: 375, height: 667 })
      await page.waitForTimeout(300)

      // Desktop sidebar wrapper should be hidden on mobile
      const wrapperHidden = await page.evaluate(() => {
        const w = document.querySelector('[data-pg="sb-main"] .sidebar-wrapper')
        return !w || getComputedStyle(w).display === "none"
      })
      eq(wrapperHidden, true, "desktop sidebar hidden on mobile")

      // Click the trigger — it should open the mobile sheet
      const triggerCount = await page.locator('[data-pg="sb-main"] .sidebar-trigger').count()
      eq(triggerCount > 0, true, `trigger found on mobile (count: ${triggerCount})`)

      // Use evaluate to click directly in case Playwright actionability check blocks
      await page.evaluate(() => {
        document.querySelector('[data-pg="sb-main"] .sidebar-trigger').click()
      })
      // Wait for the sheet dialog to appear
      await page.locator('[data-mobile="true"]').waitFor({ timeout: 5000 })

      eq(await page.locator('[data-mobile="true"]').count(), 1, "mobile sheet opened")

      // Close it
      await page.keyboard.press("Escape")
      await page.waitForTimeout(500)
    } finally {
      // Restore viewport
      await page.setViewportSize(originalSize)
      await page.waitForTimeout(300)
    }
  })

  // ---------------------------------------------------------------------------
  // Rail click toggles
  // ---------------------------------------------------------------------------

  await test("rail click toggles sidebar", async () => {
    // Ensure we're back to desktop state
    await el("sb-main", ".sidebar-rail").waitFor({ timeout: 5000 })

    const wrapper = el("sb-main", ".sidebar-wrapper")
    // If collapsed from a prior test, expand first
    if ((await wrapper.getAttribute("data-state")) === "collapsed") {
      await el("sb-main", ".sidebar-trigger").click()
      await waitTransitions(el("sb-main", ".sidebar"))
    }
    eq(await wrapper.getAttribute("data-state"), "expanded", "starts expanded")

    // Click the rail via evaluate — when the sidebar is offcanvas-collapsed,
    // the rail protrudes only a few pixels past the overflow:hidden demo frame,
    // so Playwright's coordinate-based click can miss it.
    const clickRail = () => page.evaluate(() => {
      document.querySelector('[data-pg="sb-main"] .sidebar-rail').click()
    })

    await clickRail()
    await waitTransitions(el("sb-main", ".sidebar"))

    eq(await wrapper.getAttribute("data-state"), "collapsed", "collapsed via rail")

    // Click again to expand
    await clickRail()
    await waitTransitions(el("sb-main", ".sidebar"))

    eq(await wrapper.getAttribute("data-state"), "expanded", "re-expanded via rail")
  })
}
