export default async function run({ page, baseUrl, test, eq }) {
  await test("empty hash routes to the home page", async () => {
    await page.goto(`${baseUrl}/`)
    await page.waitForSelector(".pg-home")
    const title = await page.locator(".pg-hero-title").textContent()
    eq(title, "vanillin")
  })

  await test("sidebar shows all three groups on any docs page", async () => {
    await page.goto(`${baseUrl}/#introduction`)
    await page.waitForSelector(".pg-nav-group")
    const labels = await page.locator(".pg-nav-group > .pg-nav-label").allTextContents()
    eq(labels.join("|"), "Get started|Components|Docs")
  })

  await test("docs links route to their pages", async () => {
    await page.click('.pg-nav a[href="#installation"]')
    await page.waitForFunction(
      () => document.querySelector(".pg-main > h2")?.textContent === "Installation"
    )
    await page.click('.pg-nav a[href="#theming"]')
    await page.waitForFunction(
      () => document.querySelector(".pg-main > h2")?.textContent === "Theming"
    )
    await page.click('.pg-nav a[href="#schema"]')
    await page.waitForFunction(
      () => document.querySelector(".pg-main > h2")?.textContent === "Schema"
    )
    eq(await page.locator('.pg-nav-link[data-active="true"]').textContent(), "Schema")
  })

  await test("category containing the active route auto-opens", async () => {
    await page.goto(`${baseUrl}/#button`)
    await page.waitForFunction(
      () => document.querySelector(".pg-main > h2")?.textContent === "Button"
    )
    const open = page.locator('.pg-nav-cat[data-open="true"]')
    eq(await open.count(), 1)
    eq((await open.locator(".pg-nav-cat-btn").textContent()).trim(), "Forms")
    eq(await page.locator('.pg-nav-link[data-active="true"]').isVisible(), true)
  })

  await test("category collapses and reopens on click", async () => {
    const formsBtn = page.locator(".pg-nav-cat-btn", { hasText: "Forms" })
    const inputLink = page.locator('.pg-nav a[href="#input"]')
    await formsBtn.click()
    await inputLink.waitFor({ state: "hidden" })
    await formsBtn.click()
    await inputLink.waitFor({ state: "visible" })
  })

  await test("sidebar resizes by dragging the handle", async () => {
    const sidebar = page.locator(".pg-sidebar")
    const before = (await sidebar.boundingBox()).width
    const handle = await page.locator('[data-pg="sidebar-handle"]').boundingBox()
    const x = handle.x + handle.width / 2
    const y = handle.y + handle.height / 2
    await page.mouse.move(x, y)
    await page.mouse.down()
    await page.mouse.move(x + 80, y)
    await page.mouse.up()
    const after = (await sidebar.boundingBox()).width
    eq(after > before, true, `expected width to grow, ${before} → ${after}`)
    await page.evaluate(() => localStorage.removeItem("pg-sidebar-width"))
  })

  await test("component routes still resolve", async () => {
    await page.goto(`${baseUrl}/#accordion`)
    await page.waitForFunction(
      () => document.querySelector(".pg-main > h2")?.textContent === "Accordion"
    )
    eq(await page.locator('.pg-nav-link[data-active="true"]').textContent(), "Accordion")
  })

  await test("top navbar renders with logo and navigation menu", async () => {
    const logo = page.locator('[data-pg="logo"]')
    eq(await logo.count(), 1)
    eq(await logo.textContent(), "vanillin")
    eq(await page.locator('[data-pg="search-trigger"]').count(), 1)
  })

  await test("topnav turns opaque once the page scrolls", async () => {
    await page.goto(`${baseUrl}/#home`)
    await page.waitForSelector(".pg-home-cat-grid")
    eq(await page.locator(".pg-topnav").getAttribute("data-scrolled"), "false")
    await page.evaluate(() => window.scrollTo(0, 600))
    await page.waitForFunction(
      () => document.querySelector(".pg-topnav")?.dataset.scrolled === "true"
    )
  })

  await test("breadcrumb shows category for component pages", async () => {
    await page.goto(`${baseUrl}/#button`)
    await page.waitForSelector(".pg-breadcrumb")
    const items = await page.locator(".breadcrumb-item").allTextContents()
    eq(items.length >= 3, true, `expected ≥3 breadcrumb items, got ${items.length}`)
  })

  await test("command palette opens with keyboard shortcut", async () => {
    await page.keyboard.press("Meta+k")
    await page.waitForSelector('[data-pg="cmd-palette"]', { timeout: 2000 })
    eq(await page.locator('[data-pg="cmd-palette"]').count(), 1)
    await page.keyboard.press("Escape")
  })

  await test("page has exactly one h2", async () => {
    await page.goto(`${baseUrl}/#button`)
    // Waiting on a bare `.pg-main > h2` would make the count vacuous, and the
    // earlier `.btn` was worse — the nav and the home page both render buttons,
    // so it resolved against whatever was already mounted and counted headings
    // on the wrong route. Wait for *this* page's heading, then assert it is the
    // only one: a docs page titles itself once.
    await page.waitForSelector('.pg-main > h2:text-is("Button")')
    eq(await page.locator(".pg-main > h2").count(), 1)
  })

  await test("rail present on component pages with TOC entries", async () => {
    await page.goto(`${baseUrl}/#checkbox`)
    await page.waitForSelector(".pg-section > h3")
    await page.waitForSelector('[data-pg="rail"]')
    const links = await page.locator(".pg-rail-link").allTextContents()
    eq(links.length > 0, true, `expected TOC links, got ${links.length}`)
    eq(links.includes("Usage"), true, `expected "Usage" in TOC, got: ${links.join(", ")}`)
  })

  await test("rail absent on home page", async () => {
    await page.goto(`${baseUrl}/#home`)
    await page.waitForSelector(".pg-home")
    eq(await page.locator('[data-pg="rail"]').count(), 0)
  })

  await test("category cards carry a live demo, hover previews the full list", async () => {
    await page.waitForSelector(".pg-home-cat-card")
    const cards = page.locator(".pg-home-cat-card")
    const cardCount = await cards.count()
    eq(cardCount > 0, true, "expected category cards")
    // Every card shows one component live instead of a truncated badge list —
    // the only tag lists left are the ones inside the (closed) hover cards.
    eq(await page.locator(".pg-home-cat-card .pg-home-cat-demo").count(), cardCount)
    const tagsOutsideHover = await page.evaluate(
      () =>
        [...document.querySelectorAll(".pg-home-cat-card .pg-home-cat-tags")].filter(
          (el) => !el.closest(".hover-card")
        ).length
    )
    eq(tagsOutsideHover, 0)

    // …and the full list moved into the footer trigger's hover card.
    const more = cards.first().locator(".pg-home-cat-more")
    const total = Number((await more.textContent()).match(/\d+/)[0])
    eq(total > 0, true, "trigger names the component count")
    eq(await more.getAttribute("data-state"), "closed")
    eq(await page.locator(".pg-home-cat-hover:popover-open").count(), 0)

    await more.hover()
    const hover = page.locator(".pg-home-cat-hover:popover-open")
    await hover.waitFor()
    // The hover card holds the complete list, every entry a link.
    eq(await hover.locator(".pg-home-cat-tags a.badge").count(), total)
    eq(
      (await hover.locator(".pg-home-cat-hover-title").textContent()).endsWith(
        `${total} components`
      ),
      true,
    )

    await page.mouse.move(0, 0)
    await page.waitForFunction(
      () => document.querySelectorAll(".pg-home-cat-hover:popover-open").length === 0
    )
  })

  await test("closed hover cards stay display:none, so nothing shadows the topnav", async () => {
    // Regression: `.pg-home-cat-hover`'s display:grid used to beat the UA's
    // closed-popover display:none, parking every closed card over the
    // viewport's top-left corner where it swallowed the nav menu's hovers.
    // The card closed by the previous test is still exit-fading (allow-discrete
    // keeps display through the transition), so wait for the settled state.
    await page.waitForFunction(() =>
      [...document.querySelectorAll(".hover-card")].every(
        (el) => el.matches(":popover-open") || getComputedStyle(el).display === "none"
      )
    )
    // Counter-precondition: the trigger itself is what the pointer reaches.
    const reachable = await page.evaluate(() => {
      const t = document.querySelector(".pg-topnav .navigation-menu-trigger")
      const r = t.getBoundingClientRect()
      return t.contains(document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2))
    })
    eq(reachable, true, "topnav trigger not hit-testable at its own centre")
  })

  await test("rail TOC tracks scroll position", async () => {
    await page.goto(`${baseUrl}/#checkbox`)
    await page.waitForSelector(".pg-section > h3")
    await page.waitForSelector('[data-pg="rail"]')
    const lastLink = page.locator(".pg-rail-link").last()
    const lastText = await lastLink.textContent()
    await page.evaluate((text) => {
      const links = document.querySelectorAll(".pg-rail-link")
      for (const link of links) {
        if (link.textContent === text) {
          const id = link.getAttribute("href").slice(1)
          document.getElementById(id)?.scrollIntoView({ behavior: "instant" })
          break
        }
      }
    }, lastText)
    await page.waitForFunction(
      (text) => document.querySelector('.pg-rail-link[data-active="true"]')?.textContent === text,
      lastText,
      { timeout: 5000 }
    )
  })

  await test("rail resizes by dragging the handle", async () => {
    await page.goto(`${baseUrl}/#checkbox`)
    await page.waitForSelector(".pg-section > h3")
    await page.waitForSelector('[data-pg="rail"]')
    const rail = page.locator('[data-pg="rail"]')
    const before = (await rail.boundingBox()).width
    const handle = await page.locator('[data-pg="rail-handle"]').boundingBox()
    const x = handle.x + handle.width / 2
    const y = handle.y + handle.height / 2
    await page.mouse.move(x, y)
    await page.mouse.down()
    await page.mouse.move(x - 60, y)
    await page.mouse.up()
    const after = (await rail.boundingBox()).width
    eq(after > before, true, `expected rail to grow, ${before} → ${after}`)
    await page.evaluate(() => localStorage.removeItem("pg-rail-width"))
  })

  await test("content column clears both side menus by the gutter", async () => {
    const gutters = async () => page.evaluate(() => {
      const main = document.querySelector(".pg-main")
      const cs = getComputedStyle(main)
      const box = main.getBoundingClientRect()
      const sidebar = document.querySelector(".pg-sidebar").getBoundingClientRect()
      // The rail stays in the DOM below 72rem — CSS hides it, so read display.
      const el = document.querySelector(".pg-rail")
      const rail = el && getComputedStyle(el).display !== "none" ? el : null
      return {
        left: box.left + parseFloat(cs.paddingLeft) - sidebar.right,
        right: rail ? rail.getBoundingClientRect().left - (box.right - parseFloat(cs.paddingRight)) : null,
      }
    })

    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto(`${baseUrl}/#checkbox`)
    await page.waitForSelector('[data-pg="rail"]')
    const wide = await gutters()
    eq(wide.left >= 80, true, `expected >=80px before the sidebar, got ${wide.left}`)
    eq(wide.right >= 80, true, `expected >=80px before the rail, got ${wide.right}`)

    // Below 72rem the rail is gone and the gutter steps down, but the column
    // must still clear the sidebar rather than butting against it.
    await page.setViewportSize({ width: 1024, height: 900 })
    await page.goto(`${baseUrl}/#checkbox`)
    await page.waitForSelector(".pg-section > h3")
    const narrow = await gutters()
    eq(narrow.right, null, "expected the rail to be dropped below 72rem")
    eq(narrow.left >= 40, true, `expected >=40px before the sidebar, got ${narrow.left}`)

    await page.setViewportSize({ width: 1280, height: 720 })
  })
}
