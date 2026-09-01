/*
 * The order wizard has a route of its own (#order) and a standalone entry
 * (site/order.html); it is no longer a page inside the console mock. Like
 * showcase-panels, this suite navigates itself rather than arriving through
 * the console's rails.
 */
export default async function run({ page, baseUrl, test, eq, near }) {
  await page.goto(`${baseUrl}/#order`)
  await page.waitForSelector(".ck-order")
  const frame = page.locator(".ck-console")
  const rect = (locator) => locator.evaluate((el) => el.getBoundingClientRect().toJSON())
  const style = (locator, prop) => locator.evaluate((el, p) => getComputedStyle(el)[p], prop)
  // Kit controls transition their colours, so a colour read right after a
  // click is the transition's start value (docs/QUIRKS.md). Wait it out.
  const settled = () =>
    page.waitForFunction(() => !document.getAnimations().some((a) => a instanceof CSSTransition))

  // Computed colour of `var(--token)` resolved inside the console frame.
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

  await test("the wizard owns the page: no console chrome above it, seven numbered steps, a way back", async () => {
    // The console once reached this look by hiding its rails with CSS. Assert
    // the chrome is absent, not merely invisible, or the old mechanism passes.
    eq(await frame.locator(".ck-topbar").count(), 0, "the console top bar is still mounted")
    eq(await frame.locator(".ck-pri, .ck-sec").count(), 0, "the console rails are still mounted")
    eq(await frame.locator(".ck-tabbar").count(), 0, "the service tab bar is still mounted")
    eq(await frame.getAttribute("data-pg"), "order")
    const [frameBox, orderBox] = await Promise.all([rect(frame), rect(frame.locator(".ck-order"))])
    eq(orderBox.width > frameBox.width * 0.9, true, `the form spans the frame (${orderBox.width} of ${frameBox.width})`)
    eq(await frame.locator(".ck-page-title").textContent(), "New virtual Data Center")
    eq(await frame.locator("h2").count(), 0, "the page adds no h2 of its own")

    const steps = frame.locator(".ck-order-tabs .tabs-trigger")
    eq(
      (await steps.evaluateAll((els) => els.map((el) => el.lastChild.textContent))).join(" | "),
      "Location | Compute | Network | Storage | BCDR | VMs | Summary",
    )
    eq((await steps.locator(".ck-order-step-num").allTextContents()).join(""), "1234567")
    eq((await steps.evaluateAll((els) => els.map((el) => el.dataset.state))).join(","), "active,inactive,inactive,inactive,inactive,inactive,inactive")
    const [listBox, panelBox] = await Promise.all([
      frame.locator(".ck-order-tabs .tabs-list").boundingBox(),
      frame.locator(".ck-order-panel").boundingBox(),
    ])
    near(listBox.width, panelBox.width, 1, "the strip spans the page")
    eq(await frame.locator(".ck-order-panel").count(), 1, "only the active step is mounted")
    eq((await frame.locator(".ck-site-name").allTextContents()).join(" | "), "DFW Cage 6 | Chicago Cage 6 | SLC Cage 6")
    eq(await frame.locator('.ck-site[data-state="checked"] .ck-site-name').textContent(), "DFW Cage 6")
    await settled()
    eq(
      await style(frame.locator('.ck-site[data-state="checked"]'), "borderTopColor"),
      await consoleColour("--ck-orange"),
      "the chosen site is outlined in orange",
    )
    eq(await frame.locator('.ck-segments .toggle-group-item[data-state="on"]').textContent(), "Monthly")
    eq(await frame.locator(".ck-order-name .input-group-input").inputValue(), "vdc-01")
    eq(await frame.locator(".ck-order-name .input-group-text").textContent(), "dfw.acme.cloud")
    eq(
      await frame.locator(".ck-order-panel .ck-option-desc").evaluateAll((els) => els.every((el) => /\S\.$/.test(el.textContent.trim()))),
      true,
      "each description is a sentence",
    )

    // Back is a link out to the console, not a step within this page.
    const back = frame.locator(".ck-order-back")
    eq(await back.evaluate((el) => el.tagName), "A", "the way back is a link")
    eq(await back.textContent(), "Console")
    eq(await back.getAttribute("href"), "#console", "back points at the console route")
  })

  await test("compute, network and storage steps: presets, ticks, toggles and add-ons all move the one running total", async () => {
    const steps = frame.locator(".ck-order-tabs .tabs-trigger")
    const bar = frame.locator(".ck-order-bar")
    const total = () => bar.locator(".ck-order-bar-total").textContent()
    eq(await total(), "$605.00/mo")
    eq(await frame.locator(".ck-order-cart").textContent(), "0 vDCs$0.00/mo", "nothing committed yet")

    await steps.nth(1).click()
    await frame.locator('.ck-order-panel[data-step="compute"]').waitFor()
    eq(await frame.locator('.ck-order-panel[data-step="location"]').count(), 0)
    eq((await frame.locator(".ck-presets .ck-preset-name").allTextContents()).join(" | "), "S | M | L | XL | Custom")
    eq(await frame.locator('.ck-presets .toggle-group-item[data-state="on"] .ck-preset-name').textContent(), "M")
    eq(await frame.locator(".ck-slider-row .slider").count(), 2, "two pools")
    eq((await frame.locator(".ck-slider-label").allTextContents()).join(" | "), "CPU pool | RAM pool")
    // Ticks under each track, the ends always marked.
    eq((await frame.locator(".ck-slider-row").first().locator(".ck-slider-tick").allTextContents()).join(" | "), "4 | 50 | 100 | 150 | 200")
    eq((await frame.locator(".ck-slider-row").nth(1).locator(".ck-slider-tick").allTextContents()).join(" | "), "8 | 256 | 512 | 768 | 1,024")
    const trackBox = await rect(frame.locator(".ck-slider-row").first().locator(".slider-track"))
    const lastTick = await rect(frame.locator(".ck-slider-row").first().locator(".ck-slider-tick").last())
    near(lastTick.x + lastTick.width / 2, trackBox.x + trackBox.width, 2, "the last tick sits under the track's end")
    await settled()
    eq(
      await style(frame.locator(".slider-range").first(), "backgroundColor"),
      await consoleColour("--ck-orange"),
      "the filled range is orange",
    )
    // A preset sets both pools; a slider move makes it Custom.
    await frame.locator('.ck-presets .ck-preset[aria-label^="XL:"]').click()
    await frame.locator(".ck-slider-price", { hasText: "$240.00/mo" }).waitFor()
    eq((await frame.locator(".ck-slider-value").allTextContents()).join(" | "), "120GHz | 512GB")
    eq(await total(), "$4,165.00/mo")
    const cpu = frame.locator('.slider[aria-label="CPU pool"] .slider-thumb')
    await cpu.focus()
    await page.keyboard.press("End")
    await frame.locator(".ck-slider-price", { hasText: "$400.00/mo" }).waitFor()
    eq(await frame.locator('.ck-presets .toggle-group-item[data-state="on"] .ck-preset-name').textContent(), "Custom")
    await frame.locator('.ck-presets .ck-preset[aria-label^="M:"]').click()
    await frame.locator(".ck-slider-price", { hasText: "$40.00/mo" }).waitFor()
    eq(await total(), "$605.00/mo")
    // The headroom switch is not billed.
    await frame.locator("#ck-order-headroom").click()
    eq(await frame.locator("#ck-order-headroom").getAttribute("data-state"), "checked")
    eq(await total(), "$605.00/mo")
    eq(await frame.locator(".ck-marker").count(), 4, "included features are markers")

    await bar.locator("button", { hasText: "Next: Network" }).click()
    await frame.locator('.ck-order-panel[data-step="network"]').waitFor()
    eq((await frame.locator(".ck-slider-tick").allTextContents()).join(" | "), "0 | 8 | 16 | 24 | 32")
    eq(await frame.locator('.ck-presets .toggle-group-item[data-state="on"] .ck-preset-name').textContent(), "10 Mbps")
    await frame.locator(".ck-presets .ck-preset", { hasText: "1 Gbps" }).click()
    await frame.locator(".ck-order-bar-total", { hasText: "$825.00/mo" }).waitFor()
    await frame.locator(".ck-presets .ck-preset", { hasText: "10 Mbps" }).click()
    await frame.locator(".ck-order-bar-total", { hasText: "$605.00/mo" }).waitFor()
    const addons = frame.locator(".ck-check-row")
    eq(await addons.count(), 4)
    eq(await addons.first().locator(".checkbox").isDisabled(), true, "the firewall is included and cannot be dropped")
    eq(await addons.first().locator(".checkbox").getAttribute("data-state"), "checked")
    await frame.locator("#ck-addon-vpn").click()
    await frame.locator(".ck-order-bar-total", { hasText: "$630.00/mo" }).waitFor()
    await frame.locator("#ck-addon-lb").click()
    await frame.locator(".ck-order-bar-total", { hasText: "$670.00/mo" }).waitFor()
    await frame.locator("#ck-addon-vpn").click()
    await frame.locator("#ck-addon-lb").click()
    await frame.locator(".ck-order-bar-total", { hasText: "$605.00/mo" }).waitFor()

    await bar.locator("button", { hasText: "Next: Storage" }).click()
    await frame.locator('.ck-order-panel[data-step="storage"]').waitFor()
    eq(await frame.locator(".ck-slider-row .slider").count(), 4, "four tiers")
    eq(
      (await frame.locator(".ck-slider-price").allTextContents()).join(" | "),
      "$25.00/mo | $20.00/mo | $0.00/mo | $0.00/mo",
    )
    eq((await frame.locator(".ck-slider-row").first().locator(".ck-slider-tick").allTextContents()).join(" | "), "0 | 2,500 | 5,000 | 7,500 | 10k")
    eq(await frame.locator(".ck-storage-mix-total").textContent(), "750 GB · $45.00/mo")
    eq(await frame.locator(".ck-storage-mix-seg").count(), 2, "only tiers holding storage draw a segment")
    // A tier's figures live in a hover card on its name.
    eq(await page.locator(".ck-spec-card:popover-open").count(), 0)
    await frame.locator(".ck-slider-label .ck-hint", { hasText: "Tier 3" }).hover()
    const spec = page.locator(".ck-spec-card:popover-open")
    await spec.waitFor()
    eq(await spec.locator(".ck-spec-title").textContent(), "Tier 3 · SSD")
    eq((await spec.locator(".ck-spec-row dd").allTextContents()).join(" | "), "16,000 | 1 ms | $0.12 per GB")
    await page.mouse.move(0, 0)
    await page.waitForFunction(() => document.querySelectorAll(".ck-spec-card:popover-open").length === 0)
    eq(await bar.locator(".ck-order-bar-name").textContent(), "vdc-01 · DFW Cage 6", "the site chosen on the first step is still the site here")
  })

  await test("the VMs step groups machines by vDC: rows expand to their own settings, the group row carries placement", async () => {
    const steps = frame.locator(".ck-order-tabs .tabs-trigger")
    await steps.nth(5).click()
    await frame.locator('.ck-order-panel[data-step="vms"]').waitFor()
    const table = frame.locator(".ck-vm-table")
    const groups = table.locator(".data-table-group-row")
    const leaves = table.locator("tbody tr:not(.data-table-group-row):not(.ck-vm-detail)")
    eq(await groups.count(), 1)
    eq(await groups.locator(".data-table-group-label").textContent(), "vdc-01")
    eq(await style(groups.locator(".data-table-group-label"), "textTransform"), "none", "the kit capitalises group labels; a vDC name keeps its case")
    eq(await groups.locator(".data-table-group-count").textContent(), "1")
    eq(await groups.locator(".data-table-group-toggle").getAttribute("aria-expanded"), "true", "groups open on arrival")
    eq(await leaves.count(), 1)
    eq(await leaves.locator('input[aria-label^="Name of"]').inputValue(), "vm-01")
    eq(await leaves.locator(".select-value").allTextContents().then((t) => t.join(" | ")), "standard-2 | Ubuntu 24.04 LTS")
    eq(await leaves.locator(".ck-vm-price .ck-hint").textContent(), "$34.00/mo", "2 vCPU × $2 + 4 GB × $7.50")

    // The pool draw explains itself in a hover card.
    await leaves.locator(".ck-vm-price .ck-hint").hover()
    const spec = page.locator(".ck-spec-card:popover-open")
    await spec.waitFor()
    eq(await spec.locator(".ck-spec-title").textContent(), "1 × standard-2")
    eq((await spec.locator(".ck-spec-row dd").allTextContents()).join(" | "), "2 × $2.00 | 4 GB × $7.50 | 40 GB on Tier 2 | $34.00/mo")
    await page.mouse.move(0, 0)
    await page.waitForFunction(() => document.querySelectorAll(".ck-spec-card:popover-open").length === 0)

    // A row's chevron opens its settings under it.
    eq(await table.locator(".ck-vm-detail").count(), 0)
    const expand = leaves.locator(".ck-vm-expand")
    eq(await expand.getAttribute("aria-expanded"), "false")
    await expand.click()
    const detail = table.locator(".ck-vm-detail")
    await detail.waitFor()
    eq(await expand.getAttribute("aria-expanded"), "true")
    eq((await detail.locator(".field-label").allTextContents()).join(" | "), "Public IP1 address | Nightly backup | Start after create")
    eq((await detail.locator(".ck-segments .toggle-group-item").allTextContents()).join(" | "), "Tier 2 | Tier 3 | Tier 4")
    eq(await detail.locator("#vm-1-ip").getAttribute("data-state"), "unchecked")
    await detail.locator("#vm-1-ip").click()
    eq(await detail.locator("#vm-1-ip").getAttribute("data-state"), "checked")
    await detail.locator(".ck-segments .toggle-group-item", { hasText: "Tier 4" }).click()
    eq(await detail.locator('.ck-segments .toggle-group-item[data-state="on"]').textContent(), "Tier 4")
    await leaves.locator(".ck-vm-price .ck-hint").hover()
    await spec.waitFor()
    eq((await spec.locator(".ck-spec-row dd").nth(2).textContent()), "40 GB on Tier 4", "the row's settings feed its hover card")
    await page.mouse.move(0, 0)
    await page.waitForFunction(() => document.querySelectorAll(".ck-spec-card:popover-open").length === 0)
    await expand.click()
    eq(await table.locator(".ck-vm-detail").count(), 0, "the chevron folds it away again")

    // Placement for the whole vDC lives in a popover on the group row.
    const placement = groups.locator(".ck-vm-group-settings")
    eq(await placement.locator(".badge").allTextContents().then((t) => t.join(" | ")), "prod-web-net")
    eq(await page.locator(".ck-vm-group-pop:popover-open").count(), 0)
    await placement.click()
    const pop = page.locator(".ck-vm-group-pop:popover-open")
    await pop.waitFor()
    eq(await pop.locator(".popover-title").textContent(), "Placement for vdc-01")
    await pop.locator("#vdc-1-affinity").click()
    eq(await pop.locator("#vdc-1-affinity").getAttribute("data-state"), "checked")
    await pop.locator("#vdc-1-network").selectOption("prod-db-net")
    await placement.locator(".badge", { hasText: "anti-affinity" }).waitFor()
    eq(await placement.locator(".badge").allTextContents().then((t) => t.join(" | ")), "anti-affinity | prod-db-net")
    await page.keyboard.press("Escape")
    await page.waitForFunction(() => document.querySelectorAll(".ck-vm-group-pop:popover-open").length === 0)

    // Fold, unfold, and add a machine to the group.
    await groups.locator(".data-table-group-toggle").click()
    eq(await leaves.count(), 0, "folded")
    eq(await groups.locator(".data-table-group-toggle").getAttribute("aria-expanded"), "false")
    await groups.locator(".data-table-group-toggle").click()
    eq(await leaves.count(), 1)
    await groups.locator(".ck-vm-add").click()
    await leaves.nth(1).waitFor()
    eq(await leaves.count(), 2)
    eq(await groups.locator(".data-table-group-count").textContent(), "2")
    eq(await leaves.nth(1).locator('input[aria-label^="Name of"]').inputValue(), "vm-02")
  })

  await test("the BCDR step explains itself, then prices the replica, the licences and the backups", async () => {
    const steps = frame.locator(".ck-order-tabs .tabs-trigger")
    await steps.nth(4).click()
    await frame.locator('.ck-order-panel[data-step="bcdr"]').waitFor()
    eq(
      (await frame.locator(".ck-bcdr-item .item-title").allTextContents()).join(" | "),
      "Replica site | RPO and RTO | Backups",
    )
    eq(
      await frame.locator(".ck-bcdr-item .item-description").evaluateAll((els) => els.every((el) => el.textContent.length > 80)),
      true,
      "each explainer is a paragraph, not a label",
    )
    eq((await frame.locator(".ck-option-name").allTextContents()).join(" | "), "NoneNo replica | Warm standbyRPO 15 min · RTO 1 hr · 25% of CPU and RAM | Hot standbyRPO 5 min · RTO 15 min · 100% of CPU and RAM")
    eq(await frame.locator(".ck-order-line", { hasText: "Replication licences" }).locator(".ck-order-line-price").textContent(), "$0.00/mo")
    eq(await frame.locator(".ck-order-select").evaluate((el) => el.matches(":disabled, [aria-disabled='true'], [data-disabled]")), true, "the DR site is disabled without protection")

    await frame.locator(".ck-option", { hasText: "Warm standby" }).click()
    await frame.locator(".ck-order-line", { hasText: "Replication licences" }).locator(".ck-order-line-price", { hasText: "$30.00/mo" }).waitFor()
    eq(await frame.locator(".ck-order-line", { hasText: "Replication licences" }).locator(".ck-order-line-meta").textContent(), "2 × $15.00")
    eq(await frame.locator(".ck-order-select .select-value").textContent(), "SLC Cage 6 · Salt Lake City, UT")
    eq((await frame.locator(".ck-slider-tick").allTextContents()).join(" | "), "100 | 125 | 150 | 175 | 200")
    // 25% of ($40 + $480) = $130; 975 GB replicated at $0.05 = $48.75; two licences $30.
    eq(await frame.locator(".ck-order-bar-total").textContent(), "$813.75/mo")

    // Backups price off the provisioned storage and scale with retention.
    eq(await frame.locator("#ck-order-backups").getAttribute("data-state"), "unchecked")
    eq(await frame.locator(".ck-segments .toggle-group-item").first().isDisabled(), true, "retention waits for the switch")
    await frame.locator("#ck-order-backups").click()
    await frame.locator(".ck-order-bar-total", { hasText: "$828.75/mo" }).waitFor()
    eq(await frame.locator(".ck-order-line", { hasText: "Backup storage" }).locator(".ck-order-line-price").textContent(), "$15.00/mo", "750 GB × $0.02")
    await frame.locator(".ck-segments .toggle-group-item", { hasText: "30 days" }).click()
    await frame.locator(".ck-order-bar-total", { hasText: "$846.75/mo" }).waitFor()
    eq(await frame.locator(".ck-order-line", { hasText: "Backup storage" }).locator(".ck-order-line-meta").textContent(), "750 GB · 30 days")
    await frame.locator("#ck-order-backups").click()
    await frame.locator(".ck-order-bar-total", { hasText: "$813.75/mo" }).waitFor()
    await frame.locator(".ck-option", { hasText: "None" }).click()
    await frame.locator(".ck-order-bar-total", { hasText: "$605.00/mo" }).waitFor()
  })

  await test("the cart opens the summary; two added vDCs make two rows and one summed total, a DR tier a second row", async () => {
    const steps = frame.locator(".ck-order-tabs .tabs-trigger")
    await frame.locator(".ck-order-cart").click()
    await frame.locator('.ck-order-panel[data-step="summary"]').waitFor()
    eq(await frame.locator('.ck-order-tabs .tabs-trigger[data-state="active"]').evaluate((el) => el.lastChild.textContent), "Summary")
    const rows = frame.locator(".ck-order-table tbody tr:not(:has(.ck-table-empty))")
    eq(await rows.count(), 0)
    eq(await frame.locator(".ck-order-table .ck-table-empty").count(), 1, "the empty state is a row")
    eq(await frame.locator(".ck-order-place-btn").isDisabled(), true)
    eq(await frame.locator(".ck-order-current-name").textContent(), "vdc-01 · DFW Cage 6 · none protection")

    const add = frame.locator(".ck-order-add")
    eq(await add.textContent(), "Add another vDC")
    await add.click()
    await rows.first().waitFor()
    eq(await frame.locator(".ck-order-current-name").textContent(), "vdc-02 · DFW Cage 6 · none protection", "the form reset to a new draft")
    await add.click()
    await rows.nth(1).waitFor()
    eq(await rows.count(), 2)
    eq((await rows.locator("td:first-child code").allTextContents()).join(" | "), "vdc-01 | vdc-02")
    eq((await rows.locator(".ck-order-row-price").allTextContents()).join(" | "), "$605.00 | $605.00")
    eq((await rows.locator("td:nth-child(7)").allTextContents()).join(" | "), "2 | 1", "vdc-01 kept both machines")
    eq(await frame.locator(".ck-order-total-row").first().locator(".ck-order-total").textContent(), "$1,210.00/mo")
    eq(await frame.locator(".ck-order-due .ck-order-total").textContent(), "$0.00")
    eq(await frame.locator(".ck-order-cart").textContent(), "2 vDCs$1,210.00/mo")
    eq(await frame.locator(".ck-order-place-btn").isDisabled(), false)

    // A protected draft lands as two rows: the vDC and its replica at the DR site.
    await steps.nth(5).click()
    await frame.locator('.ck-order-panel[data-step="vms"]').waitFor()
    eq(await frame.locator(".ck-vm-table .data-table-group-label").allTextContents().then((t) => t.join(" | ")), "vdc-01 | vdc-02 | vdc-03")
    await steps.nth(4).click()
    await frame.locator('.ck-order-panel[data-step="bcdr"]').waitFor()
    await frame.locator(".ck-option", { hasText: "Hot standby" }).click()
    await frame.locator(".ck-order-bar-total", { hasText: "$1,188.75/mo" }).waitFor()
    await frame.locator(".ck-order-cart").click()
    await frame.locator('.ck-order-panel[data-step="summary"]').waitFor()
    await frame.locator(".ck-order-add").click()
    await rows.nth(3).waitFor()
    eq(await rows.count(), 4)
    eq((await rows.locator("td:first-child code").allTextContents()).join(" | "), "vdc-01 | vdc-02 | vdc-03 | vdc-03-dr")
    eq(await rows.nth(3).locator(".badge").textContent(), "Replica")
    eq((await rows.nth(3).locator("td").allTextContents()).slice(1, 6).join(" | "), "SLC Cage 6 | 20 | 64 | 975 | Hot standby replica")
    eq(await frame.locator(".ck-order-total-row").first().locator(".ck-order-total").textContent(), "$2,398.75/mo")
    eq(await frame.locator(".ck-order-cart").textContent(), "3 vDCs$2,398.75/mo")

    // Remove takes the replica with it.
    await frame.locator('[aria-label="Actions for vdc-03-dr"]').click()
    await page.locator('.dropdown-menu[data-state="open"] .dropdown-menu-item', { hasText: "Remove" }).click()
    await page.waitForFunction(() => document.querySelectorAll(".ck-order-table tbody tr:not(:has(.ck-table-empty))").length === 2)
    eq(await frame.locator(".ck-order-cart").textContent(), "2 vDCs$1,210.00/mo")

    await frame.locator(".ck-order-place-btn").click()
    await page.waitForFunction(() => [...document.querySelectorAll(".toast")].some((t) => t.textContent.includes("Place order")))
  })

  // Edit adopts a committed vDC as the draft. The draft it replaces is shown in
  // the banner right above the table, so dropping it would delete on screen
  // what the user is looking at — it is parked as a row instead.
  await test("editing a committed vDC parks the draft it replaces, machines and all", async () => {
    await frame.locator(".ck-order-cart").click()
    await frame.locator('.ck-order-panel[data-step="summary"]').waitFor()
    const rows = frame.locator(".ck-order-table tbody tr:not(:has(.ck-table-empty))")
    const current = frame.locator(".ck-order-current-name code")

    const committed = await current.textContent()
    await frame.locator(".ck-order-add").click()
    await rows.first().waitFor()
    const drafted = await current.textContent()
    eq(drafted !== committed, true, `precondition: the banner holds a second draft (${committed} → ${drafted})`)
    eq((await rows.locator("td:first-child code").allTextContents()).join(" | "), committed)
    const draftedVms = await rows.first().locator("td:nth-child(7)").textContent()

    await frame.locator(`[aria-label="Actions for ${committed}"]`).click()
    await page.locator('.dropdown-menu[data-state="open"] .dropdown-menu-item', { hasText: "Edit" }).click()
    await frame.locator('.ck-order-panel[data-step="location"]').waitFor()
    await frame.locator(".ck-order-cart").click()
    await frame.locator('.ck-order-panel[data-step="summary"]').waitFor()

    eq(await current.textContent(), committed, "the edited vDC became the draft")
    eq((await rows.locator("td:first-child code").allTextContents()).join(" | "), drafted, "the replaced draft is a row, not lost")
    eq(await rows.first().locator("td:nth-child(7)").textContent(), draftedVms, "it kept its machines")

    // Only committed vDCs are priced and placed, so the order cannot be placed
    // while the edited one sits in the draft.
    eq(await frame.locator(".ck-order-place-btn").isDisabled(), true, "place is blocked mid-edit")
    eq(await frame.locator(".ck-order-editing code").textContent(), committed, "the hint names the vDC being edited")
    eq(await frame.locator(".ck-order-add").textContent(), "Add back to order")

    await frame.locator(".ck-order-add").click()
    await rows.nth(1).waitFor()
    eq(await frame.locator(".ck-order-editing").count(), 0, "adding it back clears the hint")
    eq(await frame.locator(".ck-order-add").textContent(), "Add another vDC")
    eq(await frame.locator(".ck-order-place-btn").isDisabled(), false, "place is open again")
    eq((await rows.locator("td:first-child code").allTextContents()).sort().join(" | "), [drafted, committed].sort().join(" | "), "both vDCs are in the order")

    // The suites share one page: hand the next one an empty order.
    for (const name of [drafted, committed]) {
      await frame.locator(`[aria-label="Actions for ${name}"]`).click()
      await page.locator('.dropdown-menu[data-state="open"] .dropdown-menu-item', { hasText: "Remove" }).click()
    }
    await frame.locator(".ck-order-table .ck-table-empty").waitFor()
  })

  // Back to the order page for any suite that shares this one.
  await page.goto(`${baseUrl}/#order`)
  await page.waitForSelector(".ck-order")
}
