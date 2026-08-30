export default async function run({ page, baseUrl, test, eq, near, repoRoot }) {
  await page.goto(`${baseUrl}/#sidebar`)

  // The page is lazy-loaded — wait for the sidebar wrapper to appear
  await page.locator('[data-pg="sb-main"] .sidebar-wrapper').waitFor()

  const el = (pg, sel = "") => page.locator(`[data-pg="${pg}"] ${sel}`.trim())

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

  // ---------------------------------------------------------------------------
  // Hydration stability and cookie persistence
  // ---------------------------------------------------------------------------

  const sidebarUrl = `/@fs/${repoRoot.replace(/^\//, "")}ui/sidebar/sidebar.jsx`

  await test("skeleton widths are hashed from index, not drawn fresh each render", async () => {
    const probe = await page.evaluate(async (sidebarUrl) => {
      const reactModule = await import("/@id/react")
      const h = reactModule.createElement ?? reactModule.default.createElement
      const domModule = await import("/@id/react-dom/client")
      const createRoot = domModule.createRoot ?? domModule.default.createRoot
      const { SidebarProvider, SidebarMenu, SidebarMenuItem, SidebarMenuSkeleton } =
        await import(sidebarUrl)

      const settle = () => new Promise((resolve) => setTimeout(resolve, 60))
      const widths = async (indices) => {
        const host = document.createElement("div")
        host.dataset.probe = "sb-skeleton"
        document.body.appendChild(host)
        const root = createRoot(host, { identifierPrefix: "sb-skel-" })
        root.render(
          h(
            SidebarProvider,
            null,
            h(
              SidebarMenu,
              null,
              ...indices.map((i) =>
                h(SidebarMenuItem, { key: i }, h(SidebarMenuSkeleton, { index: i }))
              )
            )
          )
        )
        await settle()
        const out = [...host.querySelectorAll(".sidebar-menu-skeleton-text")].map((el) =>
          el.style.getPropertyValue("--skeleton-width")
        )
        root.unmount()
        host.remove()
        await settle()
        return out
      }

      const first = await widths([0, 1, 2, 3])
      // A second mount of the same indices: identical under a hash, different
      // under Math.random(). This is the assertion the hydration bug fails.
      const second = await widths([0, 1, 2, 3])
      return { first, second }
    }, sidebarUrl)

    eq(probe.first.length, 4, "precondition: four skeleton rows rendered")
    eq(
      probe.first.join(","),
      probe.second.join(","),
      "the same indices render the same widths on a second mount"
    )
    eq(new Set(probe.first).size, 4, "counter-precondition: the widths still differ per row")
    for (const w of probe.first) {
      const pct = Number(w.replace("%", ""))
      if (!(pct >= 50 && pct <= 90)) throw new Error(`width ${w} outside the 50-90% range`)
    }
  })

  await test("the provider writes the state cookie and leaves reading it to the server", async () => {
    const probe = await page.evaluate(async (sidebarUrl) => {
      const reactModule = await import("/@id/react")
      const h = reactModule.createElement ?? reactModule.default.createElement
      const domModule = await import("/@id/react-dom/client")
      const createRoot = domModule.createRoot ?? domModule.default.createRoot
      const { SidebarProvider, Sidebar, SidebarTrigger, SIDEBAR_COOKIE_NAME } =
        await import(sidebarUrl)

      const settle = () => new Promise((resolve) => setTimeout(resolve, 60))
      const readCookie = () =>
        document.cookie
          .split("; ")
          .find((c) => c.startsWith(`${SIDEBAR_COOKIE_NAME}=`))
          ?.split("=")[1] ?? null

      // A cookie that disagrees with defaultOpen: an SSR pass only knows the
      // prop, so the client must ignore the cookie or hydration breaks.
      document.cookie = `${SIDEBAR_COOKIE_NAME}=false; path=/`
      const seeded = readCookie()

      const host = document.createElement("div")
      host.dataset.probe = "sb-cookie"
      document.body.appendChild(host)
      const root = createRoot(host, { identifierPrefix: "sb-cookie-" })
      root.render(
        h(SidebarProvider, { defaultOpen: true }, h(Sidebar), h(SidebarTrigger, null, "T"))
      )
      await settle()

      const initialState = host.querySelector(".sidebar-wrapper").dataset.state
      const cookieAfterMount = readCookie()

      host.querySelector(".sidebar-trigger").click()
      await settle()
      const toggledState = host.querySelector(".sidebar-wrapper").dataset.state

      // Twice: the first toggle lands on "false", which the seed already said,
      // so only the second one proves the provider wrote anything.
      host.querySelector(".sidebar-trigger").click()
      await settle()
      const reopenedState = host.querySelector(".sidebar-wrapper").dataset.state
      const cookieAfterToggle = readCookie()

      root.unmount()
      host.remove()
      document.cookie = `${SIDEBAR_COOKIE_NAME}=; path=/; max-age=0`
      await settle()
      return { seeded, initialState, cookieAfterMount, toggledState, reopenedState, cookieAfterToggle }
    }, sidebarUrl)

    eq(probe.seeded, "false", "precondition: a conflicting cookie was in place")
    eq(probe.initialState, "expanded", "defaultOpen wins on mount — the provider never reads the cookie")
    eq(probe.cookieAfterMount, "false", "counter-precondition: mounting did not rewrite the cookie either")
    eq(probe.toggledState, "collapsed", "the trigger still toggles")
    eq(probe.reopenedState, "expanded", "and toggles back")
    eq(probe.cookieAfterToggle, "true", "the change is written back for the server to read")
  })
}
