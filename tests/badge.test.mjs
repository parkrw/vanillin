export default async function run({ page, baseUrl, test, eq }) {
  await page.goto(`${baseUrl}/#badge`)
  const chips = page.locator('[data-pg="badge-chips"]')
  await chips.waitFor()

  await test("as='a' renders a real anchor; the default stays a span", async () => {
    const links = page.locator('[data-pg="badge-links"] .badge')
    eq(await links.count(), 2)
    eq(
      await links.first().evaluate((el) => `${el.tagName} ${el.getAttribute("href")}`),
      "A #installation",
    )
    // Counter-precondition: without `as`, no anchor is produced.
    eq(
      await chips.locator(".badge--chip").first().evaluate((el) => el.tagName),
      "SPAN",
    )
  })

  await test("glow: breathes on a fixed 2s loop in the variant's own colour", async () => {
    const glows = page.locator('[data-pg="badge-glow"] .badge')
    eq(await glows.count(), 5)
    eq(
      (await glows.evaluateAll((els) =>
        els.map((el) => `${getComputedStyle(el).animationName}@${getComputedStyle(el).animationDuration}`),
      )).join(" | "),
      // success, warning, info, destructive, default — the destructive one is the alarm beat.
      ["badge-glow@2s", "badge-glow@2s", "badge-glow@2s", "badge-alarm@1.1s", "badge-glow@2s"].join(" | "),
    )
    // Counter-precondition: the plain status badges do not animate.
    eq(
      (await page.locator('[data-pg="badge-status"] .badge').evaluateAll((els) =>
        els.map((el) => getComputedStyle(el).animationName),
      )).join(" | "),
      "none | none | none | none",
    )
    await page.evaluate(() => document.documentElement.style.setProperty("--motion-scale", "3"))
    eq(await glows.first().evaluate((el) => getComputedStyle(el).animationDuration), "2s")
    await page.evaluate(() => document.documentElement.style.removeProperty("--motion-scale"))

    // Parked under reduced motion, the halo is the variant token at 18%.
    await page.emulateMedia({ reducedMotion: "reduce" })
    const parked = await glows.evaluateAll((els) =>
      els.map((el, i) => {
        const token = ["--success", "--warning", "--info", "--destructive", "--primary"][i]
        const s = getComputedStyle(el)
        const probe = document.createElement("span")
        probe.style.backgroundColor = `color-mix(in oklab, var(${token}) 18%, transparent)`
        el.parentElement.appendChild(probe)
        const want = getComputedStyle(probe).backgroundColor
        probe.remove()
        const halo = s.boxShadow.slice(0, s.boxShadow.lastIndexOf(")") + 1)
        return { text: el.textContent, animation: s.animationName, ok: halo === want, shadow: s.boxShadow }
      }),
    )
    await page.emulateMedia({ reducedMotion: "no-preference" })
    for (const r of parked) {
      eq(r.animation, "none", `${r.text}: parked under reduced motion`)
      eq(r.ok, true, `${r.text}: halo is the variant colour (${r.shadow})`)
    }
  })

  // Halo alpha read without parsing oklab by hand (docs/QUIRKS.md): a probe
  // span inside the row resolves the same mix through inheritance, and canvas
  // composites it over white, so a dimmer halo lands closer to white.
  const haloLuma = (rowSelector, mix) =>
    page.evaluate(([sel, expr]) => {
      const row = document.querySelector(sel)
      const probe = document.createElement("span")
      probe.style.backgroundColor = expr
      row.appendChild(probe)
      const colour = getComputedStyle(probe).backgroundColor
      probe.remove()
      const canvas = document.createElement("canvas")
      canvas.width = 4
      canvas.height = 4
      const ctx = canvas.getContext("2d")
      ctx.fillStyle = "#fff"
      ctx.fillRect(0, 0, 4, 4)
      ctx.fillStyle = colour
      ctx.fillRect(0, 0, 4, 4)
      const [r, g, b] = ctx.getImageData(1, 1, 1, 1).data
      return { colour, luma: 0.2126 * r + 0.7152 * g + 0.0722 * b }
    }, [rowSelector, mix])

  await test("glow controls: --glow-duration on an ancestor retimes the loop", async () => {
    const duration = (row) =>
      page.locator(`[data-pg="${row}"] .badge--glow`).first().evaluate((el) => getComputedStyle(el).animationDuration)
    eq(await duration("badge-glow"), "2s", "precondition: the default row breathes on the 2s fallback")
    eq(await duration("badge-glow-controls"), "4s", "the wrapper's --glow-duration is inherited")
    const all = await page
      .locator('[data-pg="badge-glow-controls"] .badge--glow')
      .evaluateAll((els) => els.map((el) => getComputedStyle(el).animationDuration))
    eq(all.length, 3, "all three badges in the row")
    eq(all.every((d) => d === "4s"), true, `every badge follows the wrapper (got ${JSON.stringify(all)})`)
  })

  await test("glow controls: --glow-strength on an ancestor dims the halo", async () => {
    const shadow = (row) =>
      page.locator(`[data-pg="${row}"] .badge--glow`).first().evaluate((el) => getComputedStyle(el).boxShadow)
    // Read the halo at rest: with the loop stopped the box-shadow is the
    // 0%/100% keyframe, so the two rows differ by strength alone.
    await page.emulateMedia({ reducedMotion: "reduce" })
    const dimmed = await shadow("badge-glow-controls")
    const full = await shadow("badge-glow")
    await page.emulateMedia({ reducedMotion: "no-preference" })
    eq(full !== "none", true, "precondition: the default row still declares a halo at rest")
    eq(dimmed !== full, true, `the halo changes with --glow-strength (${full} vs ${dimmed})`)

    const mix = "color-mix(in oklab, var(--success) calc(18% * var(--glow-strength, 1)), transparent)"
    const strong = await haloLuma('[data-pg="badge-glow"]', mix)
    const weak = await haloLuma('[data-pg="badge-glow-controls"]', mix)
    eq(strong.colour !== "rgba(0, 0, 0, 0)", true, `precondition: the mix resolves (${strong.colour})`)
    eq(
      weak.luma > strong.luma,
      true,
      `a lower --glow-strength is dimmer (default ${strong.luma.toFixed(1)} vs controls ${weak.luma.toFixed(1)})`,
    )
  })


  // Park the loop exactly at a phase of its cycle through the Web Animations
  // API (a paused CSS animation plus a negative delay lands a hair off the
  // frame), so getComputedStyle reads that keyframe's values.
  const frameAt = (locator, phase) =>
    locator.first().evaluate((el, phase) => {
      const anims = el.getAnimations()
      for (const a of anims) {
        a.pause()
        a.currentTime = a.effect.getTiming().duration * phase
      }
      const s = getComputedStyle(el)
      const frame = { shadow: s.boxShadow, opacity: s.opacity }
      for (const a of anims) a.play()
      return frame
    }, phase)
  // Chrome serialises a shadow as "<colour> x y blur spread": split there.
  const geometry = (shadow) => shadow.slice(shadow.indexOf(")") + 1)
  const colour = (shadow) => shadow.slice(0, shadow.indexOf(")") + 1)

  await test("glow shape: a crisp ring that swells; destructive badges run the alarm beat", async () => {
    const live = page.locator('[data-pg="badge-glow"] .badge--success.badge--glow')
    const alarm = page.locator('[data-pg="badge-glow"] .badge--destructive.badge--glow')
    eq(geometry((await frameAt(live, 0)).shadow), " 0px 0px 0px 2px", "rest: one crisp 2px ring")
    eq(geometry((await frameAt(live, 0.5)).shadow), " 0px 0px 0px 4px", "peak: one crisp 4px ring, no blur")
    const timing = await alarm.first().evaluate((el) => {
      const s = getComputedStyle(el)
      return `${s.animationName}@${s.animationDuration}`
    })
    eq(timing, "badge-alarm@1.1s", "destructive glow is the alarm beat")
    eq(geometry((await frameAt(alarm, 0.5)).shadow), " 0px 0px 0px 5px", "alarm peak: the ring swells to 5px")
  })

  await test("chip: renders as a secondary badge with the chip modifier", async () => {
    const cls = await chips.locator(".badge--chip").first().getAttribute("class")
    eq(cls.includes("badge"), true, `has badge base: ${cls}`)
    eq(cls.includes("badge--secondary"), true, `has secondary variant: ${cls}`)
  })

  await test("chip: static chip has no remove button", async () => {
    const count = await chips
      .locator('.badge--chip:has-text("Static") .badge-chip-remove')
      .count()
    eq(count, 0, "no remove button without onRemove")
  })

  await test("chip: remove button is named after the label and dismisses", async () => {
    const before = await chips.locator(".badge--chip").count()
    const remove = chips.getByRole("button", { name: "Remove Design" })
    await remove.waitFor()
    await remove.click()
    await chips.locator('.badge--chip:has-text("Design")').waitFor({ state: "detached" })
    const after = await chips.locator(".badge--chip").count()
    eq(after, before - 1, "one chip removed")
  })

  await test("chip: remove button is skipped by Tab", async () => {
    const tabIndex = await chips
      .locator(".badge-chip-remove")
      .first()
      .evaluate((el) => el.tabIndex)
    eq(tabIndex, -1, "remove button is tabIndex -1")
  })

  await test("chip: disabled disables the remove button, not the chip", async () => {
    const chip = chips.locator('.badge--chip:has-text("Disabled")')
    const isDisabled = await chip
      .locator(".badge-chip-remove")
      .evaluate((el) => el.disabled)
    eq(isDisabled, true, "remove button disabled")
    const chipDisabledAttr = await chip.getAttribute("disabled")
    eq(chipDisabledAttr, null, "chip span carries no disabled attribute")
  })

  await test("chip: long label truncates instead of growing the chip", async () => {
    const text = chips.locator('.badge--chip .badge-chip-text').last()
    const { clientWidth, scrollWidth, overflow } = await text.evaluate((el) => ({
      clientWidth: el.clientWidth,
      scrollWidth: el.scrollWidth,
      overflow: getComputedStyle(el).textOverflow,
    }))
    eq(scrollWidth > clientWidth, true, `label overflows: ${scrollWidth} > ${clientWidth}`)
    eq(overflow, "ellipsis", "ellipsis applied")
  })

  await test("chip: combobox uses the shared implementation", async () => {
    await page.goto(`${baseUrl}/#combobox`)
    const input = page.locator('[data-pg="cbx-multi-input"]')
    await input.waitFor()
    await input.click()
    await page.locator('[data-pg="cbx-item-ts"]').click()
    const cls = await page
      .locator(".combobox-chip")
      .first()
      .getAttribute("class")
    eq(cls.includes("badge--chip"), true, `combobox chip is a Chip: ${cls}`)
  })

}
