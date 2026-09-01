// The console showcase below the home hero. Everything in it is a mock, so
// these tests assert the chrome's behaviour, not a data round-trip.

export default async function run({ page, baseUrl, test, eq, near }) {
  await page.goto(`${baseUrl}/#home`)
  // The console's search hint claims the chord matches the vanillin site's, so
  // take the expected chord from the site chrome's own kbd rather than
  // repeating its platform test here — ⌘K on a Mac, Ctrl+K elsewhere. Read
  // once: the chrome is not on every route the suite visits.
  const siteChord = (await page.locator(".pg-search-kbd").first().textContent()).trim()
  const searchHint = () => `Search behaves as it does on the vanillin site — press ${siteChord} anywhere`
  await page.waitForSelector(".ck-console")
  const console_ = page.locator(".ck-console")
  const cats = console_.locator(".ck-nav-cat")
  const tabs = () => console_.locator(".ck-tabbar .tabs-trigger").allTextContents()
  const secNames = () => console_.locator(".ck-sec-group-name").allTextContents()
  const activeFlags = (selector) =>
    console_.locator(selector).evaluateAll((els) => els.map((el) => el.hasAttribute("data-active")).join(","))

  // Category row, then (optionally) a service row in the secondary rail.
  const go = async (category, service) => {
    await cats.filter({ hasText: category }).click()
    if (service) await console_.locator(".ck-sec-group", { hasText: service }).click()
  }
  const rect = (locator) => locator.evaluate((el) => el.getBoundingClientRect().toJSON())
  const style = (locator, prop) => locator.evaluate((el, p) => getComputedStyle(el)[p], prop)
  // Kit controls transition their colours, so a colour read right after a
  // click is the transition's start value (docs/QUIRKS.md). Wait it out.
  const settled = () =>
    page.waitForFunction(() => !document.getAnimations().some((a) => a instanceof CSSTransition))

  // Computed colour of `var(--token)` resolved inside the console frame — or
  // inside the chrome, whose forced dark scheme picks light-dark()'s other arm.
  const consoleColour = (token, host = ".ck-console") =>
    page.evaluate(([t, h]) => {
      const el = document.querySelector(h)
      const probe = document.createElement("span")
      probe.style.color = `var(${t})`
      el.appendChild(probe)
      const c = getComputedStyle(probe).color
      probe.remove()
      return c
    }, [token, host])

  await test("brand reads Acme Cloud with no release badge and no trace of the old name", async () => {
    eq(await console_.locator(".ck-brand-name").textContent(), "Acme Cloud")
    eq(await console_.locator(".ck-brand-app").textContent(), "Console")
    eq(await console_.locator(".ck-brand .badge").count(), 0, "the release badge is back")
    const text = await console_.textContent()
    eq(text.includes("Acme Cloud"), true, "expected Acme Cloud in the console")
    eq(text.includes("CloudKey"), false, "found the old brand name")
    eq(text.includes("1.0.0"), false, "found the release number")
    eq(text.includes("10.6"), false, "found the old version number")
  })

  await test("the search sits beside the brand; pills, the orange order button, then the theme toggle sit right of it", async () => {
    const search = console_.locator(".ck-search")
    eq(await search.count(), 1)
    eq(
      await search.evaluate((el) => {
        const tip = el.parentElement
        return tip.classList.contains("ck-tip") && tip.parentElement.classList.contains("ck-topbar")
      }),
      true,
      "the search sits in its tooltip trigger, directly under the top bar",
    )
    eq(await console_.locator(".ck-topbar-right .ck-search").count(), 0, "not in the right-hand group")
    // The tooltip's own aria-describedby sits on its trigger span, which takes
    // no focus, so the button carries a description of its own.
    eq(
      await search.evaluate((el) => document.getElementById(el.getAttribute("aria-describedby"))?.textContent),
      searchHint(),
      "the search button is described for assistive tech on focus, not only on hover",
    )
    const pills = console_.locator(".ck-topbar-right .ck-pill")
    eq(await pills.count(), 2)
    eq(await console_.locator(".ck-pill").count(), 2, "pills render only inside the right-hand group")
    eq((await pills.allTextContents()).join(" | "), "Projectengineering | RegionDallas")
    // DOM order of the visible controls (menus and tooltips sit beside them
    // as popovers): Project, Region, Order a VDC, theme, bell, user.
    eq(
      await console_.locator(".ck-topbar-right").evaluate((group) =>
        [...group.querySelectorAll(":scope > .ck-pill, :scope > .ck-topbar-order, :scope > .ck-tip, :scope > .ck-bell, :scope > .ck-topbar-user")]
          .map((el) =>
            el.classList.contains("ck-pill") ? "pill"
            : el.classList.contains("ck-topbar-order") ? "order"
            : el.querySelector(".ck-theme-toggle") ? "theme"
            : el.classList.contains("ck-bell") ? "bell" : "user")
          .join(","),
      ),
      "pill,pill,order,theme,bell,user",
    )
    const order = console_.locator(".ck-topbar-order")
    eq(await style(order, "backgroundColor"), await consoleColour("--ck-orange", ".ck-topbar"), "the order button is CloudKey orange")
    const [searchBox, pillBox, rightBox] = await Promise.all([
      search.boundingBox(),
      pills.first().boundingBox(),
      console_.locator(".ck-topbar-right").boundingBox(),
    ])
    eq(searchBox.x + searchBox.width <= rightBox.x, true, `search (${searchBox.x}) left of the controls (${rightBox.x})`)
    eq(searchBox.x + searchBox.width <= pillBox.x, true, `search (${searchBox.x}) left of the first pill (${pillBox.x})`)
    // No ⌘K keycap: site/app.jsx owns that chord, so advertising it here would
    // point at the site palette rather than this one (#50). A tooltip and a
    // toast say where the shortcut lives instead.
    eq(await search.locator(".kbd").count(), 0, "the search advertises no shortcut it does not own")
    // It still opens the palette, and says the chord belongs to the site.
    await search.click()
    const palette = page.locator("dialog.command-dialog[open]")
    await palette.waitFor()
    eq(
      (await console_.locator(".toast").first().textContent()).includes(searchHint()),
      true,
      "clicking search explains where the shortcut lives",
    )
    // Clicking again replaces the hint rather than stacking a second copy.
    await page.keyboard.press("Escape")
    await page.waitForFunction(() => !document.querySelector("dialog.command-dialog[open]"))
    await search.click()
    await palette.waitFor()
    eq(
      await console_.locator(".toast").filter({ hasText: "vanillin site" }).count(),
      1,
      "a repeated click replaces the hint instead of stacking one",
    )
    eq(
      (await palette.locator(".command-group-heading").allTextContents()).slice(0, 2).join(" | "),
      "Overview | Virtual Data Centers",
    )
    await page.keyboard.press("Escape")
    await page.waitForFunction(() => !document.querySelector("dialog.command-dialog[open]"))

    // ⌘K belongs to the site palette alone. The console mounts inside #home as
    // well as on #console, so a second binding here opened two dialogs stacked
    // and one Escape left the other over the page (#50).
    await page.keyboard.press("ControlOrMeta+k")
    await page.locator("dialog.command-dialog[open]").waitFor()
    eq(await page.locator("dialog.command-dialog[open]").count(), 1, "one palette, not two")
    // Which one matters as much as how many: restoring the console's handler
    // and dropping the site's would also open exactly one dialog.
    eq(
      await page.locator("dialog.command-dialog[open]").getAttribute("data-pg"),
      "cmd-palette",
      "the chord opens the site's palette, not the console's",
    )
    await page.keyboard.press("Escape")
    await page.waitForFunction(() => !document.querySelector("dialog.command-dialog[open]"))
    eq(await page.locator("dialog.command-dialog[open]").count(), 0, "one Escape closes it")
  })

  await test("the chrome is navy in both schemes while the body follows the scheme", async () => {
    const paint = () =>
      page.evaluate(() => ({
        chrome: getComputedStyle(document.querySelector(".ck-topbar")).backgroundColor,
        body: getComputedStyle(document.querySelector(".ck-scroller")).backgroundColor,
      }))
    const light = await paint()
    await page.evaluate(() => document.documentElement.classList.add("dark"))
    await settled()
    const dark = await paint()
    await page.evaluate(() => document.documentElement.classList.remove("dark"))
    await settled()
    eq(dark.body !== light.body, true, "precondition: the scheme flip repainted the body")
    eq(dark.chrome, light.chrome, "the top bar changed colour with the scheme")
  })

  await test("the primary rail is flat: Overview and four heavy category rows, each with an icon, nothing folding", async () => {
    eq(await cats.count(), 4)
    eq(
      (await console_.locator(".ck-nav-cat .ck-nav-text").allTextContents()).join(" | "),
      "Virtual Data Centers | Operations | Account | Support Center",
    )
    eq(await console_.locator(".ck-nav .collapsible").count(), 0, "a category still folds")
    eq(await console_.locator(".ck-nav-cat svg").count(), 4, "one icon per category")
    eq(await console_.locator(".ck-nav-overview svg").count(), 1, "Overview carries an icon too")
    eq(await console_.locator(".ck-nav-overview[data-active]").count(), 1, "Overview is the landing service")
    eq(await console_.locator(".ck-nav-cat[data-active]").count(), 0)
    // Heading weight: heavier than the Overview row, set in small caps.
    eq(await style(cats.first(), "fontWeight"), "800")
    eq(await style(cats.first(), "textTransform"), "uppercase")
    eq(await style(console_.locator(".ck-sec-quick-label"), "fontWeight"), "800")
    // A label too long for the rail ellipsizes rather than spilling out of it.
    // Whether a given string fits a given width is a font-metric question and
    // differs between platforms, so assert the mechanism, not the measurement.
    const text = cats.first().locator(".ck-nav-text")
    eq(
      await text.evaluate((el) => {
        const s = getComputedStyle(el)
        return `${s.whiteSpace}|${s.overflow}|${s.textOverflow}`
      }),
      "nowrap|hidden|ellipsis",
      "the longest label ellipsizes instead of spilling",
    )
    // Counter-preconditions. The ellipsis only means anything at a rail wide
    // enough to show a label, and both of these are box widths rather than
    // glyph widths, so they hold on any font stack. `--pri-w` comes from
    // PRI_W.initial, so the rail's width is a set number, not a measured one.
    const box = await text.evaluate((el) => ({
      text: el.getBoundingClientRect().width,
      rail: el.closest(".ck-pri").getBoundingClientRect().width,
    }))
    eq(box.rail, 210, `the rail opens at PRI_W.initial (${box.rail})`)
    eq(box.text / box.rail > 0.6, true, `the label gets most of the rail (${box.text} of ${box.rail})`)
  })

  await test("the secondary rail lists the category's services with their own icons; a service's pages are the tabs", async () => {
    eq(await console_.locator(".ck-sec-header").count(), 0, "the rail repeats the name the primary rail already shows")
    eq((await secNames()).join(" | "), "Status")
    eq(
      (await console_.locator(".ck-sec-quick").allTextContents()).join(" | "),
      "Virtual Machines | Networks | Volumes | Tickets",
    )
    eq((await tabs()).join(" | "), "Dashboard | Capacity | Health | Recent Events")

    await go("Virtual Data Centers")
    await page.waitForSelector(".ck-cell-link")
    eq(await console_.locator(".ck-nav-cat[data-active] .ck-nav-text").textContent(), "Virtual Data Centers")
    eq(
      (await secNames()).join(" | "),
      "DFW Cage 6 | Chicago Cage 6 | SLC Cage 6 | Compute | Networking | Storage | Quotas",
      "no row carries the category's own name",
    )
    eq(
      await activeFlags(".ck-sec-group"),
      "false,false,false,true,false,false,false",
      "the category lands on its first plain service, leaving the site folds shut",
    )
    eq((await tabs()).join(" | "), "Virtual Machines | Virtual Machine Sizes | Templates & Images")
    // Every row leads with an icon, and none of them is the Overview grid.
    const grid = await console_.locator(".ck-nav-overview svg").evaluate((el) => el.innerHTML)
    const icons = await console_.locator(".ck-sec-group").evaluateAll((els) =>
      els.map((el) => (el.firstElementChild?.tagName === "svg" ? el.firstElementChild.innerHTML : null)),
    )
    eq(icons.every((i) => i), true, "a service row without a leading icon")
    eq(icons.some((i) => i === grid), false, "a service row fell back to the grid icon")
    // Seven rows, three of them sites sharing one glyph: five distinct is the
    // most this rail can show, so a fallback anywhere drops the count.
    eq(new Set(icons).size, 5, "icons are specific to the service")
    eq(await console_.locator(".ck-sec-quick").count(), 0, "quick links belong to Overview only")

    // Selecting a service lands on its first page and swaps the tabs.
    await console_.locator(".ck-sec-group", { hasText: "Storage" }).click()
    await console_.locator(".ck-page-title", { hasText: "Volumes" }).waitFor()
    eq((await tabs()).join(" | "), "Volumes | Snapshots")
    eq(await console_.locator(".ck-sec-group[data-active] .ck-sec-group-name").textContent(), "Storage")
    eq(
      (await console_.locator(".ck-tabbar .tabs-trigger").evaluateAll((els) => els.map((el) => el.dataset.state))).join(","),
      "active,inactive",
    )
  })

  await test("the tab bar switches pages within the service and carries the live badge", async () => {
    await console_.locator(".ck-sec-group", { hasText: "Compute" }).click()
    await page.waitForSelector(".ck-cell-link")
    eq((await tabs()).join(" | "), "Virtual Machines | Virtual Machine Sizes | Templates & Images")
    await console_.locator(".ck-tabbar .tabs-trigger", { hasText: "Virtual Machine Sizes" }).click()
    await console_.locator(".ck-page-title", { hasText: "Virtual Machine Sizes" }).waitFor()
    eq(
      (await console_.locator(".ck-tabbar .tabs-trigger").evaluateAll((els) => els.map((el) => el.dataset.state))).join(","),
      "inactive,active,inactive",
    )
    eq(await console_.locator(".ck-tabbar .ck-live-badge.badge--glow").textContent(), "Live")
    await settled()
    eq(
      await style(console_.locator('.ck-tabbar .tabs-trigger[data-state="active"]'), "borderBlockEndColor"),
      await consoleColour("--ck-orange"),
      "the current tab is underlined in orange",
    )
    await console_.locator(".ck-nav-overview").click()
    await page.waitForSelector(".ck-stats")
    eq((await tabs()).join(" | "), "Dashboard | Capacity | Health | Recent Events")
    eq(await console_.locator('.ck-tabbar .tabs-trigger[data-state="active"]').textContent(), "Dashboard")
  })

  await test("the project pill scopes the virtual machines table and switches its count", async () => {
    await go("Virtual Data Centers", "Compute")
    await page.waitForSelector(".ck-cell-link")
    const count = console_.locator(".ck-page-count")
    const rows = console_.locator(".ck-table tbody tr")
    eq(await count.textContent(), "10 virtual machines in engineering")
    eq(await console_.locator(".ck-pill", { hasText: "Project" }).textContent(), "Projectengineering")

    await console_.locator(".ck-pill", { hasText: "Project" }).click()
    const menu = page.locator('.dropdown-menu[data-state="open"]')
    eq(
      (await menu.locator(".dropdown-menu-radio-item").allTextContents()).join(" | "),
      "admin | engineering | data-science | marketing",
    )
    await menu.locator(".dropdown-menu-radio-item", { hasText: "data-science" }).click()
    await console_.locator(".ck-page-count", { hasText: "3 virtual machines in data-science" }).waitFor()
    eq(await rows.count(), 3)
    eq((await console_.locator(".ck-cell-link").allTextContents()).join(" | "), "ml-train-01 | ml-train-02 | ml-infer-01")
    eq(await console_.locator(".ck-pill", { hasText: "Project" }).textContent(), "Projectdata-science")

    await console_.locator(".ck-pill", { hasText: "Project" }).click()
    await page.locator('.dropdown-menu[data-state="open"] .dropdown-menu-radio-item', { hasText: "admin" }).click()
    await console_.locator(".ck-page-count", { hasText: "14 virtual machines in admin" }).waitFor()
    eq(await rows.count(), 5, "admin sees every project, five to a page")

    await console_.locator(".ck-pill", { hasText: "Project" }).click()
    await page.locator('.dropdown-menu[data-state="open"] .dropdown-menu-radio-item', { hasText: "engineering" }).click()
    await console_.locator(".ck-page-count", { hasText: "10 virtual machines in engineering" }).waitFor()
  })

  await test("rows per page drives the pager: choosing 20 shows every row and returns to page 1", async () => {
    const rows = console_.locator(".ck-table tbody tr")
    const pager = console_.locator(".ck-table-pager")
    const select = pager.locator(".ck-page-size select")
    eq(await select.inputValue(), "5")
    eq((await select.locator("option").allTextContents()).join(","), "5,10,20,50")
    eq(await rows.count(), 5)
    eq(await pager.textContent().then((t) => t.includes("Page 1 of 2")), true, await pager.textContent())

    await pager.locator("button", { hasText: "Next" }).click()
    await pager.locator("span", { hasText: "Page 2 of 2" }).waitFor()
    eq(await rows.count(), 5, "precondition: page 2 holds the other five")
    eq(await console_.locator(".ck-cell-link").first().textContent(), "db-prod-01")

    await select.selectOption("20")
    await pager.locator("span", { hasText: "Page 1 of 1" }).waitFor()
    eq(await rows.count(), 10, "twenty per page shows all ten engineering machines")
    eq(await console_.locator(".ck-cell-link").first().textContent(), "web-prod-01", "back on page 1")
    eq(await pager.locator("button", { hasText: "Next" }).isDisabled(), true)
    // Counter-precondition: the select really drove the engine, not a re-render.
    await select.selectOption("5")
    await pager.locator("span", { hasText: "Page 1 of 2" }).waitFor()
    eq(await rows.count(), 5)
    // Simple tables carry the same control.
    await console_.locator(".ck-tabbar .tabs-trigger", { hasText: "Virtual Machine Sizes" }).click()
    await console_.locator(".ck-page-title", { hasText: "Virtual Machine Sizes" }).waitFor()
    eq(await console_.locator(".ck-page-size select").inputValue(), "10")
    eq(await console_.locator(".ck-table tbody tr").count(), 6)
    await console_.locator(".ck-page-size select").selectOption("5")
    await console_.locator(".ck-table-pager span", { hasText: "Page 1 of 2" }).waitFor()
    eq(await console_.locator(".ck-table tbody tr").count(), 5)
    await console_.locator(".ck-nav-overview").click()
    await page.waitForSelector(".ck-stats")
  })

  await test("the wheel scrolls the page over a data table just as it does beside it", async () => {
    await go("Virtual Data Centers", "Compute")
    await page.waitForSelector(".ck-cell-link")
    await console_.locator(".ck-page-size select").selectOption("50")
    await console_.locator(".ck-table-pager span", { hasText: "Page 1 of 1" }).waitFor()
    const scroller = console_.locator(".ck-scroller")
    const overflow = await scroller.evaluate((el) => el.scrollHeight - el.clientHeight)
    eq(overflow > 100, true, `precondition: the page overflows its scroller by ${overflow}px`)
    // The console is embedded below the hero: bring the frame into the window,
    // park the scroller at the top, then aim inside the scroller's visible box.
    await console_.evaluate((el) => el.scrollIntoView({ block: "start" }))
    await scroller.evaluate((el) => { el.scrollTop = 0 })
    const sBox = await rect(scroller)
    const tBox = await rect(console_.locator(".ck-table-wrap"))
    const y = Math.min(tBox.y + 40, sBox.y + sBox.height - 24)
    eq(y > tBox.y && y > sBox.y, true, `precondition: the table's first rows are on screen (${tBox.y} / ${sBox.y})`)
    const wheelAt = async (x) => {
      await scroller.evaluate((el) => { el.scrollTop = 0 })
      await page.mouse.move(x, y)
      await page.mouse.wheel(0, 240)
      await page.waitForFunction(() => document.querySelector(".ck-scroller").scrollTop > 0, null, { timeout: 3000 }).catch(() => {})
      return scroller.evaluate((el) => el.scrollTop)
    }
    const beside = await wheelAt(sBox.x + 10)
    eq(beside > 0, true, `precondition: the wheel scrolls beside the table (${beside}px)`)
    const over = await wheelAt(tBox.x + tBox.width / 2)
    eq(over > 0, true, `the wheel scrolls over the table (${over}px)`)
    near(over, beside, 4, "the same distance either way")
    // Counter-precondition: the table's own viewport did not take the scroll.
    eq(await console_.locator(".ck-table-wrap .scroll-area-viewport").evaluate((el) => el.scrollTop), 0)
    await scroller.evaluate((el) => { el.scrollTop = 0 })
    await console_.locator(".ck-nav-overview").click()
    await page.waitForSelector(".ck-stats")
  })

  await test("both rails fold into 56px icon strips and unfold again; the fold toggles match the strip's buttons", async () => {
    eq(await console_.getAttribute("data-pri"), "expanded")
    eq(await console_.locator(".ck-rail--collapsed").count(), 0)
    eq(await console_.locator(".ck-resize").count(), 2, "one drag handle per expanded rail")
    const toggleBox = await rect(console_.locator('.ck-rail-toggle[aria-label="Collapse sidebar"]'))
    const toggleGlyph = await rect(console_.locator('.ck-rail-toggle[aria-label="Collapse sidebar"] svg'))

    await console_.locator('[aria-label="Collapse sidebar"]').click()
    const pri = console_.locator(".ck-pri.ck-rail--collapsed")
    await pri.waitFor()
    eq(await console_.getAttribute("data-pri"), "collapsed")
    near((await pri.boundingBox()).width, 56, 1, "icon strip width")
    eq(await console_.locator(".ck-resize").count(), 1, "a folded rail has no drag handle")
    eq(
      (await pri.locator(".ck-rail-item .ck-rail-label").allTextContents()).join(" | "),
      "Virtual Data Centers | Operations | Account | Support Center",
    )
    eq(await pri.locator(".ck-rail-item svg").count(), 4, "the strip keeps every category icon")
    const expandBox = await rect(pri.locator('.ck-rail-btn[aria-label="Expand sidebar"]'))
    const expandGlyph = await rect(pri.locator('.ck-rail-btn[aria-label="Expand sidebar"] svg'))
    near(toggleBox.width, expandBox.width, 0.5, "collapse and expand buttons are one size")
    near(toggleBox.height, expandBox.height, 0.5, "collapse and expand buttons are one height")
    near(toggleGlyph.width, expandGlyph.width, 0.5, "and their chevrons are one size")

    await console_.locator('[aria-label="Collapse section rail"]').click()
    const sec = console_.locator(".ck-sec.ck-rail--collapsed")
    await sec.waitFor()
    eq(await console_.getAttribute("data-sec"), "collapsed")
    near((await sec.boundingBox()).width, 56, 1, "section strip width")
    eq((await sec.locator(".ck-sec-group-name").allTextContents()).join(" | "), "Status")
    eq(await console_.locator(".ck-resize").count(), 0)
    // The content column still renders between the two strips.
    eq(await console_.locator(".ck-tabbar").count(), 1)

    await console_.locator('[aria-label="Expand section rail"]').click()
    await console_.locator(".ck-sec:not(.ck-rail--collapsed)").waitFor()
    await console_.locator('[aria-label="Expand sidebar"]').click()
    await console_.locator(".ck-pri:not(.ck-rail--collapsed)").waitFor()
    eq(await console_.getAttribute("data-pri"), "expanded")
    eq(await console_.getAttribute("data-sec"), "expanded")
    eq(await console_.locator(".ck-rail--collapsed").count(), 0)
    eq(await console_.locator(".ck-resize").count(), 2)
  })

  await test("dragging a handle resizes its rail within the CloudKey limits", async () => {
    const railWidth = () => console_.locator(".ck-pri").evaluate((el) => el.getBoundingClientRect().width)
    const drag = async (dx) => {
      const box = await console_.locator(".ck-resize").first().boundingBox()
      const y = box.y + box.height / 2
      await page.mouse.move(box.x + box.width / 2, y)
      await page.mouse.down()
      await page.mouse.move(box.x + box.width / 2 + dx, y, { steps: 6 })
      await page.mouse.up()
    }
    near(await railWidth(), 210, 1, "the primary rail opens at 210px")
    await drag(60)
    near(await railWidth(), 270, 2, "a 60px drag widens the rail by 60px")
    await drag(-500)
    near(await railWidth(), 120, 1, "the rail stops at its 120px minimum")
    await drag(90)
    near(await railWidth(), 210, 2, "and grows again from there")
    eq(await console_.locator(".ck-resize[data-dragging]").count(), 0, "the handle lets go on pointer up")
  })

  await test("a stat card previews its breakdown in a hover card", async () => {
    const stats = console_.locator(".ck-stat")
    eq(await stats.count(), 6)
    // Precondition: closed means not popover-open, not merely transparent.
    eq(await page.locator(".ck-stat-hover:popover-open").count(), 0)
    eq(await stats.nth(2).getAttribute("data-state"), "closed")

    await stats.nth(2).hover() // Hosts
    const card = page.locator(".ck-stat-hover:popover-open")
    await card.waitFor()
    eq(await stats.nth(2).getAttribute("data-state"), "open")
    eq(await card.locator(".ck-stat-hover-title").textContent(), "Hosts")
    eq(
      (await card.locator(".ck-stat-hover-label").allTextContents()).join(" | "),
      "dal-1 | dal-2 | slc-1 | chi-1",
    )
    eq(
      (await card.locator(".ck-stat-hover-val").allTextContents()).join(" | "),
      "4 hosts | 2 hosts | 2 hosts | 2 hosts",
    )
    // Counter-precondition: only the hovered stat's card opened.
    eq(await page.locator(".ck-stat-hover:popover-open").count(), 1)

    await page.mouse.move(0, 0)
    await page.waitForFunction(
      () => document.querySelectorAll(".ck-stat-hover:popover-open").length === 0
    )
  })

  await test("live numbers flash orange on the way up and blue on the way down", async () => {
    const values = console_.locator(".ck-util-val .live-value")
    eq(await values.count(), 4)
    // Precondition: start from a quiet moment, so the flash caught below is
    // one that arrived, not one that was already there.
    await page.waitForFunction(
      () => ![...document.querySelectorAll(".ck-console .ck-util-val .live-value")].some((el) => el.hasAttribute("data-trend")),
      null,
      { timeout: 6000 },
    )
    const up = await consoleColour("--live-value-up")
    const down = await consoleColour("--live-value-down")
    eq(up !== down, true, "precondition: the two trend colours differ")
    // The shared 2s ticker moves the utilisation rows; catch a flash whose
    // colour has settled on the trend token before the tick animation clears it.
    const seen = await page.waitForFunction(
      ([upC, downC]) => {
        for (const el of document.querySelectorAll(".ck-console .ck-util-val .live-value[data-trend]")) {
          const want = el.dataset.trend === "up" ? upC : el.dataset.trend === "down" ? downC : null
          if (want && getComputedStyle(el).color === want) return el.dataset.trend
        }
        return false
      },
      [up, down],
      { timeout: 12000 },
    )
    eq(["up", "down"].includes(await seen.jsonValue()), true)
    // Every bar's percentage stayed a number the whole time.
    eq((await values.allTextContents()).every((t) => /^\d+%$/.test(t)), true)
  })

  await test("health rows breathe: live rings in their own colour at 2.4s, the alarm ring and badge on the 1.1s beat", async () => {
    const rings = console_.locator(".ck-health-row .status-dot--ring")
    eq(await rings.count(), 5)
    const loops = await rings.evaluateAll((els) =>
      els.map((el) => {
        const s = getComputedStyle(el)
        return `${el.dataset.status}:${s.animationName}@${s.animationDuration}`
      }),
    )
    eq(loops.filter((l) => l === "success:status-dot-ring-pulse@2.4s").length, 4, `live rings: ${loops.join(" | ")}`)
    eq(loops.includes("error:status-dot-alarm@1.1s"), true, `alarm ring: ${loops.join(" | ")}`)
    // The console retimes the kit's own halo and adds no keyframes of its own.
    eq(
      await page.evaluate(() => [...document.styleSheets].some((sheet) => {
        try {
          return [...sheet.cssRules].some((r) => r instanceof CSSKeyframesRule && r.name.startsWith("ck-dot"))
        } catch {
          return false
        }
      })),
      false,
      "a console-scoped dot keyframe survives",
    )

    const glowing = console_.locator(".ck-health-row .badge--glow")
    eq(await glowing.count(), 1)
    eq(await glowing.textContent(), "2 alarms")
    eq(
      await glowing.evaluate((el) => `${getComputedStyle(el).animationName}@${getComputedStyle(el).animationDuration}`),
      "badge-alarm@1.1s",
      "the alarm badge keeps time with the alarm dot",
    )
    // Counter-precondition: healthy rows do not glow.
    eq(await console_.locator(".ck-health-row .badge").count(), 5)
  })

  await test("a category row opens its first service and marks itself active; Metrics mounts the status showcase", async () => {
    await go("Operations", "Metrics")
    await page.waitForSelector(".ackp-status")
    eq(await console_.locator(".ck-nav-cat[data-active] .ck-nav-text").textContent(), "Operations")
    eq(await console_.locator(".ck-nav-overview[data-active]").count(), 0, "Overview let go")
    eq((await secNames()).join(" | "), "Data Centers | Metrics | Events | Service Health")
    eq(await activeFlags(".ck-sec-group"), "false,true,false,false")
    eq(await console_.locator(".ck-tabbar").count(), 0, "Metrics has one page, so it draws no tab bar")
    eq(await console_.locator(".ackp-status .ackp-panel-title").textContent(), "Operations status")
    // Only one category is ever active.
    await go("Account")
    await console_.locator(".ck-empty .empty-title", { hasText: "Invoices is quiet" }).waitFor()
    eq(await console_.locator(".ck-nav-cat[data-active]").count(), 1)
    eq(await console_.locator(".ck-nav-cat[data-active] .ck-nav-text").textContent(), "Account")
  })

  await test("the theme toggle flips its lamp and changes nothing on the document", async () => {
    const toggle = console_.locator(".ck-theme-toggle")
    const snapshot = () =>
      page.evaluate(() => {
        const root = document.documentElement
        return {
          attrs: [...root.attributes].map((a) => `${a.name}=${a.value}`).sort().join(" "),
          className: root.className,
          colorScheme: getComputedStyle(root).colorScheme,
        }
      })
    const before = await snapshot()
    eq(await toggle.getAttribute("aria-label"), "Switch to dark theme")
    eq(await toggle.getAttribute("data-state"), "light")

    await toggle.click()
    await page.waitForSelector(".toast")

    // Precondition: the click really did something, so the unchanged document
    // below is the toggle staying decorative rather than the click missing.
    eq(await toggle.getAttribute("aria-label"), "Switch to light theme")
    eq(await toggle.getAttribute("data-state"), "dark")
    eq(
      (await console_.locator(".toast").first().textContent()).includes(
        "Change the theme in the vanillin navbar at the top of the page"
      ),
      true,
    )
    const after = await snapshot()
    eq(after.attrs, before.attrs, "theme toggle mutated a documentElement attribute")
    eq(after.className, before.className, "theme toggle mutated documentElement classes")
    eq(after.colorScheme, before.colorScheme, "theme toggle changed the resolved colour scheme")

    await toggle.click()
    eq(await toggle.getAttribute("aria-label"), "Switch to dark theme")
  })

  await test("a row's (…) menu and its right-click menu carry the same actions and toast with the row's name", async () => {
    await go("Virtual Data Centers", "Compute")
    await page.waitForSelector(".ck-cell-link")
    await settled()
    eq(
      await style(console_.locator(".ck-actions .btn").first(), "backgroundColor"),
      await consoleColour("--ck-orange"),
      "the primary button is orange",
    )
    await console_.locator('[aria-label="Actions for web-prod-01"]').click()
    const menu = page.locator('.dropdown-menu[data-state="open"]')
    eq(
      (await menu.locator(".dropdown-menu-item").allTextContents()).join(" | "),
      "View details | Start | Stop | Reboot | Resize | Snapshot | Delete",
    )
    eq((await menu.locator(".ck-menu-danger").allTextContents()).join(" | "), "Delete")
    await menu.locator(".dropdown-menu-item", { hasText: "Reboot" }).click()
    await page.waitForFunction(() =>
      [...document.querySelectorAll(".toast")].some((t) => t.textContent.includes("web-prod-01"))
    )
    await page.waitForFunction(() => !document.querySelector('.dropdown-menu[data-state="open"]'))

    // Right-click: the same menu, headed by the row it landed on.
    eq(await page.locator(".context-menu[data-state='open']").count(), 0, "precondition: no context menu open")
    await console_.locator('tr[data-name="web-prod-02"]').click({ button: "right" })
    const context = page.locator(".context-menu[data-state='open']")
    await context.waitFor()
    eq(await context.locator(".ck-context-label code").textContent(), "web-prod-02")
    eq(await context.locator(".ck-context-label .badge").textContent(), "Active")
    eq(
      (await context.locator(".dropdown-menu-item").allTextContents()).join(" | "),
      "View details | Start | Stop | Reboot | Resize | Snapshot | Delete",
    )
    // It opens at the pointer, not under the (…) button: one edge of the menu
    // sits on the click point (it flips upward near the frame's bottom).
    const [menuBox, rowBox] = await Promise.all([rect(context), rect(console_.locator('tr[data-name="web-prod-02"]'))])
    const clickX = rowBox.x + rowBox.width / 2
    const dots = await rect(console_.locator('[aria-label="Actions for web-prod-02"]'))
    eq(
      Math.abs(menuBox.x - clickX) <= 6 || Math.abs(menuBox.x + menuBox.width - clickX) <= 6,
      true,
      `menu (${menuBox.x}–${menuBox.x + menuBox.width}) opens at the pointer (${clickX})`,
    )
    eq(Math.abs(menuBox.x - dots.x) > 100, true, `and not under the (…) button (${dots.x})`)
    await context.locator(".dropdown-menu-item", { hasText: "Snapshot" }).click()
    await page.waitForFunction(() =>
      [...document.querySelectorAll(".toast")].some((t) => t.textContent.includes("Snapshot") && t.textContent.includes("web-prod-02"))
    )
    await page.waitForFunction(() => !document.querySelector(".context-menu[data-state='open']"))
  })

  await test("the Templates & Images tab carries the upload row", async () => {
    await console_.locator(".ck-tabbar .tabs-trigger", { hasText: "Templates & Images" }).click()
    await page.waitForSelector(".attachment")
    eq(await console_.locator('.ck-tabbar .tabs-trigger[data-state="active"]').textContent(), "Templates & Images")
    const cards = console_.locator(".attachment")
    eq(await cards.count(), 5)
    eq(
      (await cards.evaluateAll((els) => els.map((el) => el.dataset.state))).join(" | "),
      "done | done | uploading | processing | error",
    )
    eq(await cards.first().locator(".attachment-title").textContent(), "ubuntu-24.04-acme.img")
    eq(await cards.first().locator(".attachment-description").textContent(), "2.4 GB · Ready to launch")
    eq(await console_.locator(".ck-upload-btn").count(), 1)
  })

  await test("Support Center splits into Tickets and Documentation, neither repeating a name above it", async () => {
    await go("Support Center")
    await page.waitForSelector(".ackp-support")
    eq(await console_.locator(".ackp-support .ackp-panel-title").first().textContent(), "Support")
    eq((await secNames()).join(" | "), "Tickets | Documentation")
    eq(await activeFlags(".ck-sec-group"), "true,false", "Tickets is the selected row, at the top")
    const [toggleBox, rowBox] = await Promise.all([
      rect(console_.locator(".ck-sec-collapse")),
      rect(console_.locator(".ck-sec-group[data-active]")),
    ])
    eq(rowBox.y <= toggleBox.y + toggleBox.height, true, `the row (${rowBox.y}) shares the toggle's line (${toggleBox.y})`)
    eq(await console_.locator(".ck-tabbar").count(), 0, "Tickets is one page, so no tab repeats its name")

    await console_.locator(".ck-sec-group", { hasText: "Documentation" }).click()
    await console_.locator(".ck-empty .empty-title", { hasText: "Knowledge base is quiet" }).waitFor()
    eq((await tabs()).join(" | "), "Knowledge base | FAQ | Docs")
    eq((await secNames()).join(" | "), "Tickets | Documentation", "the rail keeps both rows")
  })

  await test("Settings is two pages, Profile and Organization, and Contacts lives under Organization", async () => {
    await go("Account", "Settings")
    await page.waitForSelector(".ackp-settings")
    eq(await console_.locator(".ck-sec-group[data-active] .ck-sec-group-name").textContent(), "Settings")
    eq((await tabs()).join(" | "), "Profile | Organization")
    eq(await console_.locator(".ackp-settings .ackp-panel-title").first().textContent(), "Profile")
    eq(await console_.locator('[data-pg="settings-contacts"]').count(), 0, "contacts are not personal settings")
    eq(await console_.locator(".ck-sec-group", { hasText: "Contacts" }).count(), 0, "Contacts left the rail")

    await console_.locator(".ck-tabbar .tabs-trigger", { hasText: "Organization" }).click()
    await console_.locator('[data-pg="panel-organization"]').waitFor()
    eq(await console_.locator(".ackp-settings .ackp-panel-title").first().textContent(), "Organization")
    const contacts = console_.locator('[data-pg="settings-contacts"]')
    eq(await contacts.count(), 1)
    eq(await contacts.locator("tbody tr").count(), 5)
    eq(await contacts.locator("tbody tr").first().textContent(), "AOAccount Ownerowner@acme.cloudOwnerBillingIncidentsVerified")
    eq(await console_.locator('[data-pg="settings-profile"]').count(), 0, "the profile card stayed on the other tab")
  })

  await test("Access Keys copies every identifier: fingerprints in the table, ids and masked secrets under each API key", async () => {
    await go("Account", "Security")
    await page.waitForSelector(".copy-field")
    eq(await console_.locator(".ck-page-title").textContent(), "Access Keys")
    const fields = console_.locator(".copy-field")
    eq(await fields.count(), 7, "three fingerprints, two ids, two secrets")
    eq(await console_.locator(".ck-keys-table tbody .copy-field").count(), 3)
    eq(
      (await console_.locator(".ck-keys-table tbody .copy-field").evaluateAll((els) => els.map((el) => el.dataset.truncate))).join(","),
      "middle,middle,middle",
      "fingerprints keep their tails",
    )
    eq(await console_.locator(".ck-keys-table .copy-field-tail").first().textContent(), "eK1iB3oM")
    eq(await console_.locator('.copy-field[data-secret="masked"]').count(), 2, "secrets start masked")
    const secret = console_.locator('.copy-field[data-secret="masked"]').first()
    eq((await secret.locator(".copy-field-text").textContent()).includes("ck_demo_sk"), false, "the mask hides the secret")
    await secret.locator(".copy-field-reveal").click()
    await console_.locator('.copy-field[data-secret="revealed"]').waitFor()
    eq(
      (await console_.locator('.copy-field[data-secret="revealed"] .copy-field-value').textContent()).startsWith("ck_demo_sk_"),
      true,
    )
    await console_.locator('.copy-field[data-secret="revealed"] .copy-field-reveal').click()
    await console_.locator('.copy-field[data-secret="masked"]').nth(1).waitFor()
    eq(await console_.locator('[aria-label="Copy fingerprint of ops-laptop"]').count(), 1, "each copy button is named for its key")
  })

  await test("every icon-only control has a tooltip, and tooltips are orange", async () => {
    const tips = [
      [".ck-theme-toggle", "Change the theme in the vanillin navbar at the top of the page"],
      [".ck-search", searchHint()],
      [".ck-bell", "Notifications"],
      ['[aria-label="Collapse sidebar"]', "Collapse sidebar"],
      ['[aria-label="Collapse section rail"]', "Collapse"],
    ]
    const orange = await consoleColour("--ck-orange")
    for (const [selector, label] of tips) {
      await console_.locator(selector).first().hover()
      await page.waitForSelector('.tooltip[data-state="open"]')
      const tip = page.locator('.tooltip[data-state="open"]').first()
      eq(await tip.textContent(), label)
      await settled()
      eq(await style(tip, "backgroundColor"), orange, `${selector} tooltip colour`)
      await page.mouse.move(0, 0)
      await page.waitForFunction(
        () => document.querySelectorAll('.tooltip[data-state="open"]').length === 0
      )
    }
  })

  await test("every Order a VDC affordance leaves the console for the order page", async () => {
    // The wizard has a route of its own now (#order), so the console's CTAs are
    // links out rather than router calls, and the console holds no order state.
    await go("Operations")
    await console_.locator(".ck-page-title", { hasText: "Data Centers" }).waitFor()
    const dcOpen = console_.locator(".ck-actions .ck-order-open")
    eq(await dcOpen.textContent(), "Order a VDC")
    eq(await dcOpen.locator("svg").count(), 1, "the cart icon")
    eq(await dcOpen.evaluate((el) => el.tagName), "A", "the Data Centers CTA is a link")
    eq(await dcOpen.getAttribute("href"), "#order")

    await console_.locator(".ck-nav-overview").click()
    await page.waitForSelector(".ck-stats")
    const topOpen = console_.locator(".ck-topbar-right .ck-topbar-order")
    eq(await topOpen.count(), 1)
    eq(await topOpen.locator("svg").count(), 1, "the cart icon")
    eq(await topOpen.evaluate((el) => el.tagName), "A", "the top bar CTA is a link")
    eq(await topOpen.getAttribute("href"), "#order")
    eq(await topOpen.textContent(), "Order a VDC", "no count: the shell no longer holds the order")
    eq(await topOpen.locator(".ck-topbar-order-count").count(), 0, "the committed-vDC badge is gone with the state behind it")
    const [regionBox, orderBox, themeBox] = await Promise.all([
      rect(console_.locator(".ck-pill", { hasText: "Region" })),
      rect(topOpen),
      rect(console_.locator(".ck-theme-toggle")),
    ])
    eq(regionBox.x + regionBox.width <= orderBox.x && orderBox.x + orderBox.width <= themeBox.x, true,
      `Region (${regionBox.x}) · Order (${orderBox.x}) · theme (${themeBox.x})`)

    // The rails carry no Order row any more: the wizard is not a console page.
    eq(
      (await console_.locator(".ck-sec-group-name").allTextContents()).includes("Order"),
      false,
      "the secondary rail still lists an Order service",
    )

    // The palette's action navigates for real rather than through onNavigate,
    // which can only reach pages this console's router still owns.
    await console_.locator(".ck-search").click()
    const palette = page.locator("dialog.command-dialog[open]")
    await palette.waitFor()
    await palette.locator(".command-item", { hasText: "Order a VDC" }).click()
    await page.waitForFunction(() => window.location.hash === "#order")
    await page.waitForSelector('.ck-console[data-pg="order"] .ck-order')
    eq(await page.locator(".ck-topbar").count(), 0, "the console chrome came along to the order page")

    // The suites share one page: hand the next test the console again.
    await page.goto(`${baseUrl}/#home`)
    await page.waitForSelector(".ck-console")
  })

  await test("each site is a heavy folding row of its vDCs, and the fold is the only place they are listed", async () => {
    await go("Virtual Data Centers")
    await page.waitForSelector(".ck-cell-link")
    const triggers = console_.locator(".ck-sec-cat-trigger")
    eq((await triggers.allTextContents()).join(" | "), "DFW Cage 6 | Chicago Cage 6 | SLC Cage 6")
    eq(await style(triggers.first(), "fontWeight"), "700", "site rows read as headings")
    eq(
      (await triggers.evaluateAll((els) => els.map((el) => `${el.dataset.state}/${el.getAttribute("aria-expanded")}`))).join(","),
      "closed/false,closed/false,closed/false",
    )
    eq(await console_.locator(".ck-sec-link").count(), 0, "closed means unmounted")
    eq(await triggers.locator("svg").count(), 6, "an icon and a caret each")

    await triggers.nth(0).click()
    await console_.locator(".ck-sec-cat .collapsible-content").waitFor()
    eq(await triggers.nth(0).getAttribute("data-state"), "open")
    eq((await console_.locator(".ck-sec-link").allTextContents()).join(" | "), "prod-core | prod-edge | staging")
    eq(await triggers.nth(1).getAttribute("data-state"), "closed", "only the clicked site opened")

    await console_.locator(".ck-sec-link", { hasText: "prod-edge" }).click()
    await console_.locator(".ck-page-title", { hasText: "prod-edge" }).waitFor()
    eq(await console_.locator(".ck-page-count").textContent(), "DFW Cage 6 · Plano, TX")
    eq(await console_.locator(".ck-tabbar").count(), 0, "the fold already lists the vDCs, so no tab bar repeats them")
    eq(await console_.locator(".ck-sec-link[data-active]").textContent(), "prod-edge")
    eq(await triggers.nth(0).getAttribute("data-active"), "true", "the site row reads as active too")
    eq((await console_.locator(".ck-util-label").allTextContents()).join(" | "), "CPU | RAM | Storage")
    eq((await console_.locator(".ck-util-val").allTextContents()).join(" | "), "38 / 60 GHz · 63% | 96 / 192 GB · 50% | 640 / 1,500 GB · 43%")
    eq(await console_.locator(".ck-vdc .badge", { hasText: "Warm standby" }).count(), 1)

    // A sibling is one rail link away, and the fold stays as it was.
    await console_.locator(".ck-sec-link", { hasText: "staging" }).click()
    await console_.locator(".ck-page-title", { hasText: "staging" }).waitFor()
    eq(await console_.locator(".ck-sec-link[data-active]").textContent(), "staging")
    eq(await triggers.nth(0).getAttribute("data-state"), "open")

    // Landing on another site's vDC opens that site and leaves this one open.
    await triggers.nth(2).click()
    await console_.locator(".ck-sec-link", { hasText: "ml-platform" }).click()
    await console_.locator(".ck-page-title", { hasText: "ml-platform" }).waitFor()
    eq((await triggers.evaluateAll((els) => els.map((el) => el.dataset.state))).join(","), "open,closed,open")
    eq(
      (await console_.locator(".ck-sec-link").allTextContents()).join(" | "),
      "prod-core | prod-edge | staging | prod-core-dr | ml-platform",
      "both open folds list their own vDCs, and nothing else does",
    )
    // The folded rail shows the site codes.
    await console_.locator('[aria-label="Collapse section rail"]').click()
    await console_.locator(".ck-sec.ck-rail--collapsed").waitFor()
    eq(
      (await secNames()).join(" | "),
      "DFW | CHI | SLC | Compute | Networking | Storage | Quotas",
    )
    await console_.locator('[aria-label="Expand section rail"]').click()
    await console_.locator(".ck-sec:not(.ck-rail--collapsed)").waitFor()
  })

  await test("the taskbar spans the console, opens to a resizable panel, and gives every task a bar, a status and a menu", async () => {
    const taskbar = console_.locator(".ck-taskbar")
    eq(await taskbar.evaluate((el) => el.parentElement.classList.contains("ck-console")), true, "the taskbar lives inside the content column")
    const [frameBox, barBox, mainBox] = await Promise.all([rect(console_), rect(taskbar), rect(console_.locator(".ck-main"))])
    eq(mainBox.width < frameBox.width - 200, true, "precondition: the content column is narrower than the frame")
    near(barBox.width, frameBox.width, 2, "the taskbar spans the whole console")
    near(barBox.x, frameBox.x, 2)
    eq(await taskbar.locator(".ck-taskbar-stat").allTextContents().then((t) => t.join(" | ")), "Running: 3 | Failed: 1")
    eq(await taskbar.locator(".ck-taskbar-grip").count(), 0, "no grip while closed")

    await taskbar.locator(".ck-taskbar-bar").click()
    const panel = taskbar.locator(".ck-taskbar-panel")
    await panel.waitFor()
    const rows = panel.locator("tbody tr")
    eq(await rows.count(), 7)
    eq((await rows.evaluateAll((els) => els.map((el) => el.dataset.status))).join(","), "Running,Running,Running,Succeeded,Succeeded,Failed,Succeeded")
    eq(await panel.locator(".ck-task-progress .progress").count(), 7, "a bar on every row")
    eq(await panel.locator(".ck-task-spinner").count(), 3, "a spinner on every running row")
    eq(await panel.locator(".progress--glow").count(), 3, "the running bars glow")
    eq(
      (await panel.locator(".ck-task-progress").evaluateAll((els) => els.map((el) => el.dataset.tone))).join(","),
      "run,info,run,ok,ok,err,ok",
      "the bar's tone follows the task: blue early, orange past half, green done, red failed",
    )
    const fills = await panel.locator(".ck-task-progress").evaluateAll((els) =>
      els.map((el) => getComputedStyle(el.querySelector(".progress-indicator")).backgroundColor),
    )
    eq(new Set(fills).size, 4, `four distinct bar colours (${[...new Set(fills)].join(" / ")})`)
    eq(fills[0], await consoleColour("--ck-orange"), "a running bar past the half is orange")
    eq(fills[1], await consoleColour("--ck-blue"), "an early running bar is blue")
    eq(await panel.locator(".ck-task-actions [aria-label^='Actions for']").count(), 7, "a menu at the end of every row")
    eq(
      await panel.locator(".ck-task-actions").first().evaluate((el) => el === el.parentElement.lastElementChild),
      true,
      "the menu is the last cell",
    )
    eq((await panel.locator(".ck-task-pct").allTextContents()).slice(3).join(","), "100%,100%,100%,100%")
    // Running bars advance on the shared ticker.
    const first = panel.locator(".ck-task-progress .progress").first()
    const start = Number(await first.getAttribute("aria-valuenow"))
    await page.waitForFunction(
      (s) => Number(document.querySelector(".ck-task-progress .progress").getAttribute("aria-valuenow")) > s,
      start,
      { timeout: 8000 },
    )
    await panel.locator("[aria-label='Actions for Upload machine image: ubuntu-24.04-acme']").click()
    const menu = page.locator('.dropdown-menu[data-state="open"]')
    eq((await menu.locator(".dropdown-menu-item").allTextContents()).join(" | "), "View log | Cancel")
    await page.keyboard.press("Escape")
    await page.waitForFunction(() => !document.querySelector('.dropdown-menu[data-state="open"]'))

    // Drag the top edge up: the panel grows, down: it shrinks to its floor.
    // The pointer has to stay inside the window, so park the frame's bottom
    // edge on the viewport's first.
    await console_.evaluate((el) => el.scrollIntoView({ block: "end" }))
    const height = () => panel.evaluate((el) => el.getBoundingClientRect().height)
    const grip = taskbar.locator(".ck-taskbar-grip")
    eq(await grip.count(), 1)
    const drag = async (dy) => {
      const gripBox = await rect(grip)
      const x = gripBox.x + gripBox.width / 2
      const y = gripBox.y + gripBox.height / 2
      await page.mouse.move(x, y)
      await page.mouse.down()
      await page.mouse.move(x, y + dy, { steps: 6 })
      await page.mouse.up()
    }
    near(await height(), 220, 1, "opens at 220px")
    await drag(-100)
    near(await height(), 320, 2, "100px up adds 100px")
    await drag(300)
    near(await height(), 96, 1, "stops at the 96px floor")
    eq(await taskbar.getAttribute("data-dragging"), null, "the grip lets go on pointer up")
    await taskbar.locator(".ck-taskbar-bar").click()
    await page.waitForFunction(() => !document.querySelector(".ck-taskbar-panel"))
  })

  // Leave the shared page on the console's own landing view.
  await console_.locator(".ck-nav-overview").click()

  await test("the home affordance opens the full-viewport console route", async () => {
    await page.locator('[data-pg="console-open"]').click()
    await page.waitForFunction(() => window.location.hash === "#console")
    await page.waitForSelector(".pg-main--console .ck-console")
    eq(await page.locator(".pg-sidebar").count(), 0, "docs sidebar rendered on the console route")
    eq(await page.locator(".pg-rail").count(), 0, "TOC rail rendered on the console route")
    eq(await page.locator(".pg-breadcrumb").count(), 0, "docs breadcrumb rendered on the console route")
    // Full viewport: the console's frame fills the width and reaches the
    // bottom of the window instead of sitting in the embed's 40rem card.
    const box = await page.locator(".pg-main--console .ck-console").boundingBox()
    const viewport = page.viewportSize()
    eq(Math.round(box.width), viewport.width, "console narrower than the viewport")
    eq(Math.round(box.y + box.height), viewport.height, "console does not reach the viewport bottom")
    // Interactive, not a decoration: the rails render and Overview is active.
    eq(await page.locator(".pg-main--console .ck-nav-cat").count(), 4)
    eq(await page.locator(".pg-main--console .ck-nav-overview[data-active]").count(), 1)
  })

  // Back to home for any suite that shares the page after this file.
  await page.goto(`${baseUrl}/#home`)
  await page.waitForSelector(".ck-console")
}
