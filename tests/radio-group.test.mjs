export default async function run({ page, baseUrl, test, eq, near }) {
  await page.goto(`${baseUrl}/#radio-group`)
  await page.waitForSelector(".radio-group")

  const group = page.locator('[role="radiogroup"]').first()

  await test("radiogroup role and default selection", async () => {
    eq(await group.getAttribute("role"), "radiogroup")
    const comfortable = group.locator('#rg-comfortable')
    eq(await comfortable.getAttribute("aria-checked"), "true")
    eq(await comfortable.getAttribute("data-state"), "checked")
    const def = group.locator('#rg-default')
    eq(await def.getAttribute("aria-checked"), "false")
    eq(await def.getAttribute("data-state"), "unchecked")
  })

  await test("clicking a radio selects it and deselects others", async () => {
    const def = group.locator('#rg-default')
    const comfortable = group.locator('#rg-comfortable')
    eq(await comfortable.getAttribute("data-state"), "checked")
    await def.click()
    eq(await def.getAttribute("aria-checked"), "true")
    eq(await def.getAttribute("data-state"), "checked")
    eq(await comfortable.getAttribute("aria-checked"), "false")
    eq(await comfortable.getAttribute("data-state"), "unchecked")
  })

  await test("arrow keys rove focus and select", async () => {
    const def = group.locator('#rg-default')
    await def.focus()
    await page.keyboard.press("ArrowDown")
    eq(await page.evaluate(() => document.activeElement.id), "rg-comfortable")
    eq(await group.locator('#rg-comfortable').getAttribute("aria-checked"), "true")
  })

  await test("roving tabindex: selected has 0, others -1", async () => {
    const comfortable = group.locator('#rg-comfortable')
    const compact = group.locator('#rg-compact')
    eq(await comfortable.evaluate((el) => el.tabIndex), 0)
    eq(await compact.evaluate((el) => el.tabIndex), -1)
  })

  await test("disabled item is not focusable via arrow keys", async () => {
    const disabledGroup = page.locator('.pg-section:has(h3:has-text("Disabled")) [role="radiogroup"]')
    const active = disabledGroup.locator('#rg-active')
    const disabled = disabledGroup.locator('#rg-disabled')
    eq(await disabled.isDisabled(), true)
    await active.focus()
    await page.keyboard.press("ArrowDown")
    eq(await page.evaluate(() => document.activeElement.id), "rg-active", "wraps past disabled")
  })

  await test("controlled mode reflects selection in text", async () => {
    const controlledSection = page.locator('.pg-section:has(h3:has-text("Controlled"))')
    const status = controlledSection.locator("p")
    eq((await status.textContent()).includes("comfortable"), true)
    await controlledSection.locator('#rgc-default').click()
    eq((await status.textContent()).includes("default"), true)
  })

  const segmented = page.locator('[data-pg="rg-segmented"]')
  const segmentedItems = segmented.locator('[role="radio"]')
  const segmentedRtl = page.locator('[data-pg="rg-segmented-rtl"]')
  const rtlItems = segmentedRtl.locator('[role="radio"]')

  const settled = () =>
    page.waitForFunction(() => !document.getAnimations().some((a) => a instanceof CSSTransition))

  // Resolved beside the group, not inside it: an extra child would change which
  // item is :last-child.
  const tokenFill = (host, value) =>
    host.evaluate((el, value) => {
      const probe = document.createElement("span")
      probe.style.backgroundColor = value
      probe.style.forcedColorAdjust = "none"
      el.parentElement.append(probe)
      const fill = getComputedStyle(probe).backgroundColor
      probe.remove()
      return fill
    }, value)

  const fills = (items) => items.evaluateAll((els) => els.map((el) => getComputedStyle(el).backgroundColor))

  const boxes = (items) =>
    items.evaluateAll((els) =>
      els.map((el) => {
        const r = el.getBoundingClientRect()
        const s = getComputedStyle(el)
        return {
          left: r.left,
          right: r.right,
          top: r.top,
          bottom: r.bottom,
          width: r.width,
          height: r.height,
          topLeft: s.borderTopLeftRadius,
          topRight: s.borderTopRightRadius,
          bottomLeft: s.borderBottomLeftRadius,
          bottomRight: s.borderBottomRightRadius,
        }
      })
    )

  const hitAt = (x, y) =>
    page.evaluate(([x, y]) => document.elementFromPoint(x, y)?.closest('[role="radio"]')?.textContent ?? null, [x, y])

  await test("segmented items show their children as labels, without the dot", async () => {
    eq(await page.locator('.pg-section:has(h3:text-is("Default")) .radio-group-indicator').count(), 3, "default items keep the dot")
    eq(await segmented.locator(".radio-group-indicator").count(), 0, "segmented items have no dot")
    eq((await segmentedItems.allTextContents()).join("|"), "Day|Week|Month|Year")
    eq(await segmented.getAttribute("role"), "radiogroup")
    eq(await segmentedItems.nth(1).getAttribute("aria-checked"), "true")
  })

  await test("segmented: the checked item takes the primary fill, the rest the page background", async () => {
    const [day, week] = await fills(segmentedItems)
    eq(week, await tokenFill(segmented, "var(--primary)"), "checked fill")
    eq(day, await tokenFill(segmented, "var(--background)"), "unchecked fill")
    eq(day !== week, true, "checked and unchecked differ")
  })

  await test("segmented items join into one row with shared edges and square inner corners", async () => {
    const b = await boxes(segmentedItems)
    for (const box of b) {
      near(box.height, 36, 0.5, "button height")
      eq(box.width > 36, true, `item wider than the dot, got ${box.width}`)
    }
    for (let i = 1; i < b.length; i++) {
      near(b[i].top, b[0].top, 0.5, `item ${i} on the first item's row`)
      near(b[i].left, b[i - 1].right - 1, 0.5, `item ${i} overlaps the previous item's edge`)
    }
    const last = b.length - 1
    eq(b[0].topLeft !== "0px" && b[0].bottomLeft !== "0px", true, "first item's outer corners rounded")
    eq(`${b[0].topRight} ${b[0].bottomRight}`, "0px 0px", "first item's inner corners square")
    eq(`${b[1].topLeft} ${b[1].topRight} ${b[1].bottomLeft} ${b[1].bottomRight}`, "0px 0px 0px 0px", "middle item square")
    eq(`${b[last].topLeft} ${b[last].bottomLeft}`, "0px 0px", "last item's inner corners square")
    eq(b[last].topRight !== "0px" && b[last].bottomRight !== "0px", true, "last item's outer corners rounded")
  })

  await test("segmented: the checked item's edge sits above its neighbours'", async () => {
    await segmentedItems.nth(0).click()
    await page.mouse.move(0, 0)
    try {
      const b = await boxes(segmentedItems)
      const y = (b[0].top + b[0].bottom) / 2
      eq(await hitAt(b[1].left + 0.5, y), "Day", "Day|Week: the checked Day is on top")
      eq(await hitAt(b[2].left + 0.5, y), "Month", "Week|Month: neither checked, the later item is on top")
    } finally {
      await segmentedItems.nth(1).click()
    }
  })

  await test("segmented: arrow keys move and select, skipping the disabled item", async () => {
    await segmentedItems.nth(1).focus()
    await page.keyboard.press("ArrowRight")
    eq(await page.evaluate(() => document.activeElement.textContent), "Month")
    eq(await segmentedItems.nth(2).getAttribute("aria-checked"), "true")
    await page.keyboard.press("ArrowRight")
    eq(await page.evaluate(() => document.activeElement.textContent), "Day", "wraps past the disabled Year")
    eq(await segmentedItems.nth(0).getAttribute("aria-checked"), "true")
    await segmentedItems.nth(0).click()
    eq(await segmentedItems.nth(0).getAttribute("aria-checked"), "true", "clicking the checked item keeps it checked")
    await segmentedItems.nth(1).click()
  })

  await test("segmented: hover paints an enabled item, not a disabled one", async () => {
    const background = await tokenFill(segmented, "var(--background)")
    const b = await boxes(segmentedItems)
    try {
      await page.mouse.move((b[0].left + b[0].right) / 2, (b[0].top + b[0].bottom) / 2)
      await settled()
      eq((await fills(segmentedItems))[0], await tokenFill(segmented, "var(--accent)"), "hovered Day")
      await page.mouse.move((b[3].left + b[3].right) / 2, (b[3].top + b[3].bottom) / 2)
      await settled()
      const [day, , , year] = await fills(segmentedItems)
      eq(day, background, "Day back to rest")
      eq(year, background, "disabled Year unchanged under the pointer")
    } finally {
      await page.mouse.move(0, 0)
    }
  })

  await test("segmented rtl: the row runs right to left and arrows follow it", async () => {
    const b = await boxes(rtlItems)
    eq(b[0].left > b[1].left && b[1].left > b[2].left, true, "first item at the right")
    near(b[1].right, b[0].left + 1, 0.5, "second item overlaps the first's edge")
    eq(b[0].topRight !== "0px" && b[0].bottomRight !== "0px", true, "first item's outer corners, on the right, rounded")
    eq(`${b[0].topLeft} ${b[0].bottomLeft}`, "0px 0px", "first item's inner corners square")
    await rtlItems.nth(0).focus()
    await page.keyboard.press("ArrowLeft")
    eq(await rtlItems.nth(1).getAttribute("aria-checked"), "true", "ArrowLeft moves to the next item")
    await rtlItems.nth(0).click()
  })

  await test("segmented dark: unchecked items lift to the input background, checked stays primary", async () => {
    await page.evaluate(() => document.documentElement.classList.add("dark"))
    try {
      await settled()
      const [day, week] = await fills(segmentedItems)
      const lifted = await tokenFill(segmented, "var(--input-background)")
      eq(lifted !== (await tokenFill(segmented, "var(--background)")), true, "dark input background differs from the page")
      eq(day, lifted, "unchecked fill")
      eq(week, await tokenFill(segmented, "var(--primary)"), "checked fill")
      eq(day !== week, true)
    } finally {
      await page.evaluate(() => document.documentElement.classList.remove("dark"))
      await settled()
    }
  })

  await test("segmented forced colours: the checked item keeps a distinct fill", async () => {
    await page.emulateMedia({ forcedColors: "active" })
    try {
      await settled()
      const [day, week] = await fills(segmentedItems)
      eq(week, await tokenFill(segmented, "Highlight"), "checked takes Highlight")
      eq(day !== week, true, "unchecked differs from checked")
    } finally {
      await page.emulateMedia({ forcedColors: null })
    }
  })
}
