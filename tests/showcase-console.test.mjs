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

  await test("the three nav groups load collapsed", async () => {
    eq(await groups.count(), 3)
    eq(
      (await console_.locator(".ck-nav-cat-trigger").allTextContents()).join(" | "),
      "Platform▾ | Operations▾ | Account▾",
    )
    for (const state of await console_.locator(".ck-nav-cat-trigger").evaluateAll((els) =>
      els.map((el) => `${el.dataset.state}/${el.getAttribute("aria-expanded")}`)
    )) {
      eq(state, "closed/false")
    }
    // Counter-precondition: closed means unmounted, not merely zero-height —
    // a group whose content is present but clipped would pass a height check.
    eq(await console_.locator(".ck-nav-cat .collapsible-content").count(), 0)
  })

  await test("clicking a group trigger expands only that group", async () => {
    const platform = groups.nth(0)
    await platform.locator(".ck-nav-cat-trigger").click()
    await page.waitForSelector(".ck-nav-cat .collapsible-content")
    eq(await platform.locator(".ck-nav-cat-trigger").getAttribute("data-state"), "open")
    eq(
      (await platform.locator(".ck-nav-link").allTextContents()).join(" | "),
      "Overview | Virtual data centers | Resources | Networking | Storage",
    )
    eq(await groups.nth(1).locator(".ck-nav-cat-trigger").getAttribute("data-state"), "closed")
    eq(await groups.nth(2).locator(".ck-nav-cat-trigger").getAttribute("data-state"), "closed")
    // Every item carries an icon, and every icon is hidden from the a11y tree.
    const icons = platform.locator(".ck-nav-link .ck-nav-icon svg")
    eq(await icons.count(), 5)
    eq(await icons.evaluateAll((els) => els.every((el) => el.getAttribute("aria-hidden") === "true")), true)
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

  await test("Support and Settings render their panel slots", async () => {
    await console_.locator(".ck-nav-cat-trigger", { hasText: "Account" }).click()
    await page.waitForSelector(".ck-nav-link:text-is('Support')")
    for (const name of ["Support", "Settings"]) {
      await console_.locator(`.ck-nav-link:text-is("${name}")`).click()
      await page.waitForSelector(".ck-panel-slot")
      eq(await console_.locator(".ck-panel-slot").textContent(), `The ${name} panel loads here.`)
      eq(await console_.locator(".ck-page-title").textContent(), name)
    }
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
}
