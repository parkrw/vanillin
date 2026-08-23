// The console showcase below the home hero. Everything in it is a mock, so
// these tests assert the chrome's behaviour, not a data round-trip.

export default async function run({ page, baseUrl, test, eq }) {
  await page.goto(`${baseUrl}/#home`)
  await page.waitForSelector(".ck-console")
  const console_ = page.locator(".ck-console")
  const groups = console_.locator(".ck-nav-cat")

  await test("brand reads Acme Cloud 1.0.0, with no trace of the old name", async () => {
    eq(await console_.locator(".ck-brand-name").textContent(), "Acme Cloud")
    eq(await console_.locator(".ck-brand .badge").textContent(), "1.0.0")
    const text = await console_.textContent()
    eq(text.includes("Acme Cloud"), true, "expected Acme Cloud in the console")
    eq(text.includes("CloudKey"), false, "found the old brand name")
    eq(text.includes("10.6"), false, "found the old version number")
  })

  await test("Platform loads open; Operations and Account load collapsed", async () => {
    eq(await groups.count(), 3)
    eq(
      (await console_.locator(".ck-nav-cat-trigger").allTextContents()).join(" | "),
      "Platform▾ | Operations▾ | Account▾",
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

  await test("the theme toggle flips its icon and changes nothing on the document", async () => {
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

    await toggle.click()
    await page.waitForSelector(".toast")

    // Precondition: the click really did something, so the unchanged document
    // below is the toggle staying decorative rather than the click missing.
    eq(await toggle.getAttribute("aria-label"), "Switch to light theme")
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
    await console_.locator('.tabs-trigger:text-is("Machine images")').click()
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
