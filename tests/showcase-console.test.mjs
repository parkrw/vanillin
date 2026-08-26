// The console showcase below the home hero. Everything in it is a mock, so
// these tests assert the chrome's behaviour, not a data round-trip.

export default async function run({ page, baseUrl, test, eq, near }) {
  await page.goto(`${baseUrl}/#home`)
  await page.waitForSelector(".ck-console")
  const console_ = page.locator(".ck-console")
  const groups = console_.locator(".ck-nav-cat")

  // Computed colour of `var(--token)` resolved inside the console frame.
  const consoleColour = (token) =>
    page.evaluate((t) => {
      const host = document.querySelector(".ck-console")
      const probe = document.createElement("span")
      probe.style.color = `var(${t})`
      host.appendChild(probe)
      const c = getComputedStyle(probe).color
      probe.remove()
      return c
    }, token)

  await test("brand reads Acme Cloud 1.0.0, with no trace of the old name", async () => {
    eq(await console_.locator(".ck-brand-name").textContent(), "Acme Cloud")
    eq(await console_.locator(".ck-brand .badge").textContent(), "1.0.0")
    const text = await console_.textContent()
    eq(text.includes("Acme Cloud"), true, "expected Acme Cloud in the console")
    eq(text.includes("CloudKey"), false, "found the old brand name")
    eq(text.includes("10.6"), false, "found the old version number")
  })

  await test("the chrome is navy in both schemes while the body follows the scheme", async () => {
    const paint = () =>
      page.evaluate(() => ({
        chrome: getComputedStyle(document.querySelector(".ck-topbar")).backgroundColor,
        body: getComputedStyle(document.querySelector(".ck-scroller")).backgroundColor,
      }))
    const light = await paint()
    await page.evaluate(() => document.documentElement.classList.add("dark"))
    const dark = await paint()
    await page.evaluate(() => document.documentElement.classList.remove("dark"))
    eq(dark.body !== light.body, true, "precondition: the scheme flip repainted the body")
    eq(dark.chrome, light.chrome, "the top bar changed colour with the scheme")
  })

  await test("Platform loads open; Operations and Account load collapsed", async () => {
    eq(await groups.count(), 3)
    eq(
      (await console_.locator(".ck-nav-cat-trigger").allTextContents()).join(" | "),
      "Platform | Operations | Account",
    )
    eq(
      (await console_.locator(".ck-nav-cat-trigger").evaluateAll((els) =>
        els.map((el) => `${el.dataset.state}/${el.getAttribute("aria-expanded")}`)
      )).join(" | "),
      "open/true | closed/false | closed/false",
    )
    // Counter-precondition: closed means unmounted, not merely zero-height —
    // a group whose content is present but clipped would pass a height check.
    eq(await console_.locator(".ck-nav-cat .collapsible-content").count(), 1)
    const platform = groups.nth(0)
    eq(
      (await platform.locator(".ck-nav-link").allTextContents()).join(" | "),
      "Overview | Virtual data centers | Resources | Networking | Storage",
    )
    // Every item carries an icon, and every icon is hidden from the a11y tree.
    const icons = platform.locator(".ck-nav-link .ck-nav-icon svg")
    eq(await icons.count(), 5)
    eq(await icons.evaluateAll((els) => els.every((el) => el.getAttribute("aria-hidden") === "true")), true)
  })

  await test("the secondary rail lists the service's groups and pages under its code", async () => {
    eq(await console_.locator(".ck-sec-name").textContent(), "Overview")
    eq(await console_.locator(".ck-sec-code").textContent(), "acme")
    eq(
      (await console_.locator(".ck-sec-quick").allTextContents()).join(" | "),
      "Instances | Networks | Volumes | Tickets",
    )
    await console_.locator(".ck-nav-link", { hasText: "Resources" }).click()
    await page.waitForSelector(".ck-cell-link")
    eq(await console_.locator(".ck-sec-name").textContent(), "Resources")
    eq(await console_.locator(".ck-sec-code").textContent(), "compute")
    eq(
      (await console_.locator(".ck-sec-group-name").allTextContents()).join(" | "),
      "Compute | Catalog",
    )
    eq(
      (await console_.locator(".ck-sec-page").allTextContents()).join(" | "),
      "Instances | Instance sizes | Machine images",
    )
    eq(
      (await console_.locator(".ck-sec-page").evaluateAll((els) => els.map((el) => el.hasAttribute("data-active")))).join(","),
      "true,false,false",
    )
    eq(await console_.locator(".ck-sec-quick").count(), 0, "quick links belong to Overview only")
  })

  await test("the breadcrumb bar spells out category, service, group and page", async () => {
    const crumbs = () => console_.locator(".ck-crumbbar .breadcrumb-item").allTextContents()
    eq((await crumbs()).join(" › "), "Acme Cloud › Platform › Resources › Compute › Instances")
    await console_.locator('.ck-sec-page:text-is("Machine images")').click()
    await page.waitForSelector(".attachment")
    eq((await crumbs()).join(" › "), "Acme Cloud › Platform › Resources › Catalog › Machine images")
    eq(await console_.locator(".ck-crumbbar .breadcrumb-page").textContent(), "Machine images")
    eq(await console_.locator(".ck-crumbbar .ck-live-badge.badge--glow").textContent(), "Live")
    // Ancestor crumbs navigate: the service crumb lands on its first page.
    await console_.locator(".ck-crumbbar .breadcrumb-link", { hasText: "Resources" }).click()
    await page.waitForSelector(".ck-cell-link")
    eq((await crumbs()).join(" › "), "Acme Cloud › Platform › Resources › Compute › Instances")
    // Overview drops the category and the single-group level.
    await console_.locator(".ck-crumbbar .breadcrumb-link", { hasText: "Acme Cloud" }).click()
    await page.waitForSelector(".ck-stats")
    eq((await crumbs()).join(" › "), "Acme Cloud › Overview › Dashboard")
  })

  await test("both rails fold into 56px icon strips and unfold again", async () => {
    eq(await console_.getAttribute("data-pri"), "expanded")
    eq(await console_.locator(".ck-pri-panel").count(), 1)
    eq(await console_.locator(".ck-rail--collapsed").count(), 0)

    await console_.locator('[aria-label="Collapse sidebar"]').click()
    const pri = console_.locator(".ck-pri.ck-rail--collapsed")
    await pri.waitFor()
    eq(await console_.getAttribute("data-pri"), "collapsed")
    eq(await console_.locator(".ck-pri-panel").count(), 0, "the expanded rail left the resizable group")
    near((await pri.boundingBox()).width, 56, 1, "icon strip width")
    eq(
      (await pri.locator(".ck-rail-item .ck-rail-label").allTextContents()).join(" | "),
      "Platform | Operations | Account",
    )

    await console_.locator('[aria-label="Collapse section rail"]').click()
    const sec = console_.locator(".ck-sec.ck-rail--collapsed")
    await sec.waitFor()
    eq(await console_.getAttribute("data-sec"), "collapsed")
    near((await sec.boundingBox()).width, 56, 1, "section strip width")
    eq(await sec.locator(".ck-sec-header").count(), 0, "the folded rail hides its header")
    eq((await sec.locator(".ck-sec-group-name").allTextContents()).join(" | "), "Status")
    // The content column still renders between the two strips.
    eq(await console_.locator(".ck-crumbbar").count(), 1)

    await console_.locator('[aria-label="Expand section rail"]').click()
    await console_.locator(".ck-sec-panel").waitFor()
    await console_.locator('[aria-label="Expand sidebar"]').click()
    await console_.locator(".ck-pri-panel").waitFor()
    eq(await console_.getAttribute("data-pri"), "expanded")
    eq(await console_.getAttribute("data-sec"), "expanded")
    eq(await console_.locator(".ck-rail--collapsed").count(), 0)
    eq(await groups.nth(0).locator(".ck-nav-cat-trigger").getAttribute("data-state"), "open")
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
    eq(await values.evaluateAll((els) => els.some((el) => el.hasAttribute("data-trend"))), false, "precondition: nothing flashing at tick 0")
    const up = await consoleColour("--ck-orange")
    const down = await consoleColour("--ck-blue")
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

  await test("health rows breathe: rings in their own colour, the alarm badge glowing", async () => {
    const rings = console_.locator(".ck-health-row .status-dot--ring")
    eq(await rings.count(), 5)
    eq(
      (await rings.evaluateAll((els) => els.map((el) => getComputedStyle(el).animationName))).join(","),
      Array(5).fill("status-dot-ring-pulse").join(","),
    )
    const glowing = console_.locator(".ck-health-row .badge--glow")
    eq(await glowing.count(), 1)
    eq(await glowing.textContent(), "2 alarms")
    eq(await glowing.evaluate((el) => getComputedStyle(el).animationName), "badge-glow")
    // Counter-precondition: healthy rows do not glow.
    eq(await console_.locator(".ck-health-row .badge").count(), 5)
  })

  await test("clicking a group trigger toggles only that group", async () => {
    const operations = groups.nth(1)
    await operations.locator(".ck-nav-cat-trigger").click()
    await operations.locator(".collapsible-content").waitFor()
    eq(await operations.locator(".ck-nav-cat-trigger").getAttribute("data-state"), "open")
    eq(
      (await operations.locator(".ck-nav-link").allTextContents()).join(" | "),
      "Metrics | Events | Service health",
    )
    eq(await groups.nth(0).locator(".ck-nav-cat-trigger").getAttribute("data-state"), "open")
    eq(await groups.nth(2).locator(".ck-nav-cat-trigger").getAttribute("data-state"), "closed")
    // Restore the load state so later tests can open Operations themselves.
    await operations.locator(".ck-nav-cat-trigger").click()
    eq(await operations.locator(".ck-nav-cat-trigger").getAttribute("data-state"), "closed")
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
        "Theme switching is decorative in this demo"
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

  await test("a row action toasts with the row's name", async () => {
    await console_.locator(".ck-nav-link", { hasText: "Resources" }).click()
    await page.waitForSelector(".ck-cell-link")
    await console_.locator('[aria-label="Actions for web-prod-01"]').click()
    const menu = page.locator('.dropdown-menu[data-state="open"]')
    eq(
      (await menu.locator(".dropdown-menu-item").allTextContents()).join(" | "),
      "View details | Start | Stop | Reboot | Resize | Snapshot | Delete",
    )
    eq((await menu.locator(".ck-menu-danger").allTextContents()).join(" | "), "Delete")

    await menu.locator(".dropdown-menu-item", { hasText: "Reboot" }).click()
    await page.waitForFunction(() =>
      [...document.querySelectorAll(".toast")].some((t) =>
        t.textContent.includes("web-prod-01")
      )
    )
  })

  await test("machine images page carries the upload row", async () => {
    await console_.locator('.ck-sec-page:text-is("Machine images")').click()
    await page.waitForSelector(".attachment")
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

  await test("Support and Settings render their panels", async () => {
    await console_.locator(".ck-nav-cat-trigger", { hasText: "Account" }).click()
    await page.waitForSelector(".ck-nav-link:text-is('Support')")
    for (const [name, root] of [["Support", ".ackp-support"], ["Settings", ".ackp-settings"]]) {
      await console_.locator(`.ck-nav-link:text-is("${name}")`).click()
      await page.waitForSelector(root)
      eq(await console_.locator(`${root} .ackp-panel-title`).first().textContent(), name)
    }
  })

  await test("Utilization page mounts the status showcase", async () => {
    await console_.locator(".ck-nav-cat-trigger", { hasText: "Operations" }).click()
    await console_.locator(".ck-nav-link:text-is('Metrics')").click()
    await page.waitForSelector(".ackp-status")
    eq(await console_.locator(".ackp-status .ackp-panel-title").textContent(), "Operations status")
  })

  await test("every icon-only control has a tooltip", async () => {
    const tips = [
      [".ck-theme-toggle", "Theme"],
      [".ck-bell", "Notifications"],
      [".ck-brand .badge", "Console release 1.0.0"],
      [".ck-nav-cat-trigger", "Toggle Platform"],
      ['[aria-label="Collapse sidebar"]', "Collapse sidebar"],
    ]
    for (const [selector, label] of tips) {
      await console_.locator(selector).first().hover()
      await page.waitForSelector('.tooltip[data-state="open"]')
      eq(await page.locator('.tooltip[data-state="open"]').first().textContent(), label)
      await page.mouse.move(0, 0)
      await page.waitForFunction(
        () => document.querySelectorAll('.tooltip[data-state="open"]').length === 0
      )
    }
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
    // Interactive, not a decoration: Platform loads open here too.
    eq(
      await page.locator(".pg-main--console .ck-nav-cat-trigger").first().getAttribute("data-state"),
      "open",
    )
  })

  // Back to home for any suite that shares the page after this file.
  await page.goto(`${baseUrl}/#home`)
  await page.waitForSelector(".ck-console")
}
