/*
 * The showcase panels have no docs-site route: they are built to mount inside
 * the console mock, which task 88 owns. They render from
 * site/showcase/panels/fixture.html, a page vite's dev server serves and the
 * production build ignores (only site/index.html is a build input).
 */
export default async function run({ page, baseUrl, test, eq }) {
  const FIXTURE = `${baseUrl}/showcase/panels/fixture.html`

  const dismissToasts = async () => {
    await page.evaluate(() => window.__toast?.dismiss())
    await page.waitForFunction(() => document.querySelectorAll(".toast").length === 0)
  }

  await page.goto(FIXTURE)
  await page.locator('[data-pg="panel-support"]').waitFor()

  // ── SupportPanel ──

  await test("support thread renders the seeded conversation", async () => {
    eq(await page.locator('[data-pg="support-message"]').count(), 5, "message count")
  })

  // Before the send test: sending clears the staged queue.
  await test("staged attachments can be removed and re-added", async () => {
    const files = page.locator('[data-pg="support-attachment"]')
    const before = await files.count()
    eq(before > 0, true, "starts with staged files")
    await page.locator('[aria-label="Remove health-check-config.yaml"]').click()
    eq(await files.count(), before - 1, "file removed")
    eq(await page.locator(".toast-title").first().textContent(), "Removed from draft", "remove toast")
    await dismissToasts()
    await page.locator('[aria-label="Attach file"]').click()
    eq(await files.count(), before, "file re-added")
    eq(await page.locator(".toast-title").first().textContent(), "Attached to draft", "attach toast")
    await dismissToasts()
  })

  await test("sending a draft appends it to the thread", async () => {
    const before = await page.locator('[data-pg="support-message"]').count()
    await page.locator('[data-pg="support-draft"]').fill("Watching through the deploy window.")
    await page.locator('[data-pg="support-send"]').click()
    const messages = page.locator('[data-pg="support-message"]')
    eq(await messages.count(), before + 1, "message appended")
    eq(
      (await messages.last().textContent()).includes("Watching through the deploy window."),
      true,
      "appended body"
    )
    eq(await page.locator('[data-pg="support-draft"]').inputValue(), "", "draft cleared")
    await dismissToasts()
  })

  await test("an empty draft is refused rather than appended", async () => {
    const before = await page.locator('[data-pg="support-message"]').count()
    await page.locator('[data-pg="support-draft"]').fill("   ")
    await page.locator('[data-pg="support-send"]').click()
    eq(await page.locator('[data-pg="support-message"]').count(), before, "nothing appended")
    eq(await page.locator(".toast-title").first().textContent(), "Nothing to send", "error toast")
    await page.locator('[data-pg="support-draft"]').fill("")
    await dismissToasts()
  })

  // ── Tickets table ──

  await test("tickets table renders a page of rows", async () => {
    const rows = page.locator('[data-pg="ticket-row"]')
    eq(await rows.count(), 6, "first page row count")
    eq((await rows.first().textContent()).includes("AC-4821"), true, "first ticket id")
    // The status cell pairs a dot with its own text, so the dot is decorative.
    eq(
      await page.locator('[data-pg="ticket-row"]').first().locator(".status-dot").count(),
      1,
      "status dot per row"
    )
  })

  await test("a row action toasts", async () => {
    // Every row keeps its menu in the DOM, so scope to the one that is open.
    const reply = page.locator('[data-pg="ticket-action-reply"]:visible')
    await page.locator('[data-pg="ticket-actions"]').first().click()
    await reply.waitFor()
    await reply.click()
    await page.locator(".toast").first().waitFor()
    eq(await page.locator(".toast-title").first().textContent(), "Replying to AC-4821", "action toast")
    await dismissToasts()
  })

  await test("the tickets filter narrows the table", async () => {
    await page.locator('[aria-label="Filter tickets"]').fill("snapshot")
    const rows = page.locator('[data-pg="ticket-row"]')
    eq(await rows.count(), 1, "one match")
    eq((await rows.first().textContent()).includes("AC-4818"), true, "matched ticket")
    await page.locator('[aria-label="Filter tickets"]').fill("")
    eq(await rows.count(), 6, "filter cleared")
  })

  // ── SettingsPanel ──

  await test("settings renders its four cards", async () => {
    for (const hook of ["profile", "organization", "api", "preferences"]) {
      eq(await page.locator(`[data-pg="settings-${hook}"]`).count(), 1, `${hook} card`)
    }
    eq(
      (await page.locator('[data-pg="settings-profile"]').textContent()).includes("ops@acme.cloud"),
      true,
      "profile email"
    )
  })

  await test("the API key is masked until revealed and is obviously fake", async () => {
    const value = page.locator('[data-pg="settings-key-value"]')
    const masked = await value.textContent()
    eq(masked.includes("•"), true, "masked by default")
    await page.locator('[data-pg="settings-key-reveal"]').click()
    const revealed = await value.textContent()
    eq(revealed, "ak_demo_0000000000000000000000", "revealed placeholder")
    await page.locator('[data-pg="settings-key-reveal"]').click()
    eq(await value.textContent(), masked, "hidden again")
    await dismissToasts()
  })

  await test("a preference switch toasts and does not persist", async () => {
    const toggle = page.locator("#ackp-notify-digest")
    eq(await toggle.getAttribute("aria-checked"), "false", "starts off")
    await toggle.click()
    eq(await toggle.getAttribute("aria-checked"), "true", "toggled on")
    eq(await page.locator(".toast-title").first().textContent(), "Weekly digest on", "switch toast")
    await dismissToasts()
    await page.reload()
    await page.locator('[data-pg="panel-settings"]').waitFor()
    eq(await page.locator("#ackp-notify-digest").getAttribute("aria-checked"), "false", "not persisted")
  })

  // ── StatusShowcase ──

  await test("every status widget exposes progressbar semantics", async () => {
    const widgets = page.locator('[data-pg="status-widget"]')
    const count = await widgets.count()
    eq(count, 8, "widget count")
    for (let i = 0; i < count; i++) {
      const meter = widgets.nth(i).locator('[role="progressbar"]')
      eq(await meter.count(), 1, `widget ${i} has one progressbar`)
      const now = Number(await meter.getAttribute("aria-valuenow"))
      eq(now >= 0 && now <= 100, true, `widget ${i} aria-valuenow in range`)
      eq(await meter.getAttribute("aria-valuemax"), "100", `widget ${i} aria-valuemax`)
    }
    eq(await page.locator('[data-kind="ring"] .ackp-ring').count(), 4, "rings drawn")
  })

  await test("widgets sweep at distinct durations", async () => {
    const durations = await page.locator('[data-pg="status-widget"]').evaluateAll((nodes) =>
      nodes.map((node) => getComputedStyle(node).animationDuration)
    )
    eq(durations.length, 8, "one duration per widget")
    eq(new Set(durations).size > 1, true, `durations vary: ${durations.join(",")}`)
    eq(
      durations.every((value) => Number.parseFloat(value) > 0),
      true,
      "every widget animates"
    )
  })

  await test("the readout tracks the sweep", async () => {
    const readout = page.locator('[data-pg="status-readout"]').first()
    const first = await readout.textContent()
    await page.waitForFunction(
      (before) => document.querySelector('[data-pg="status-readout"]').textContent !== before,
      first
    )
    const later = await readout.textContent()
    eq(/^\d+%$/.test(later), true, `readout format: ${later}`)
    const meter = page.locator('[data-pg="status-widget"] [role="progressbar"]').first()
    eq(await meter.getAttribute("aria-valuetext"), later, "aria mirrors the readout")
  })

  await test("reduced motion parks the sweep on a static value", async () => {
    await page.emulateMedia({ reducedMotion: "reduce" })
    await page.reload()
    await page.locator('[data-pg="panel-status"]').waitFor()
    const widget = page.locator('[data-pg="status-widget"]').first()
    eq(await widget.evaluate((node) => getComputedStyle(node).animationName), "none", "loop stopped")
    const readout = widget.locator('[data-pg="status-readout"]')
    await page.waitForFunction(
      () => document.querySelector('[data-pg="status-readout"]').textContent !== "0%"
    )
    const parked = await readout.textContent()
    eq(/^\d+%$/.test(parked), true, `parked readout: ${parked}`)
    await page.waitForTimeout(150)
    eq(await readout.textContent(), parked, "value holds still")
    await page.emulateMedia({ reducedMotion: null })
  })

  await test("no CloudKey branding survives in the panels", async () => {
    await page.reload()
    await page.locator('[data-pg="panel-support"]').waitFor()
    const text = await page.locator("body").textContent()
    eq(/cloudkey/i.test(text), false, "no CloudKey wording")
  })
}
