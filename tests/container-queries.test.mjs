export default async function run({ page, baseUrl, test, eq, near }) {
  await page.goto(`${baseUrl}/#container-queries`)
  await page.waitForSelector(".pg-cq-row")

  const sm = page.locator(".pg-cq-panel--sm")
  const md = page.locator(".pg-cq-panel--md")
  const lg = page.locator(".pg-cq-panel--lg")

  // Every assertion below reads two panels on ONE page at ONE viewport size.
  // That is the property under test: a media query cannot produce two different
  // layouts for the same component without the window changing.

  const box = async (locator) => {
    const b = await locator.boundingBox()
    return { top: Math.round(b.y), left: Math.round(b.x), width: Math.round(b.width) }
  }

  // ── Card ───────────────────────────────────────────────────────────

  await test("card action stacks under the title only in the narrow panel", async () => {
    const smTitle = await box(sm.locator(".card-title"))
    const smAction = await box(sm.locator(".card-action"))
    const lgTitle = await box(lg.locator(".card-title"))
    const lgAction = await box(lg.locator(".card-action"))

    eq(smAction.top > smTitle.top, true, "narrow card: action sits below the title")
    near(smAction.left, smTitle.left, 4, "narrow card: action starts at the title's inline edge")
    near(lgAction.top, lgTitle.top, 4, "wide card: action shares the title's line")
    eq(lgAction.left > lgTitle.left, true, "wide card: action sits after the title")
  })

  await test("narrow card footer buttons stretch, wide ones do not", async () => {
    const smBtns = sm.locator(".card-footer > *")
    const lgBtns = lg.locator(".card-footer > *")
    const smFirst = await box(smBtns.first())
    const smSecond = await box(smBtns.nth(1))
    const lgFirst = await box(lgBtns.first())
    const lgSecond = await box(lgBtns.nth(1))

    near(smFirst.width, smSecond.width, 2, "narrow footer: buttons share the row equally")
    eq(lgFirst.width < smFirst.width, true, "wide footer: buttons keep their intrinsic width")
    near(lgFirst.top, lgSecond.top, 2, "wide footer: buttons stay on one line")
  })

  // ── Item ───────────────────────────────────────────────────────────

  await test("item actions take their own row only in the narrow panel", async () => {
    const smContent = await box(sm.locator(".item-content"))
    const smActions = await box(sm.locator(".item-actions"))
    const lgContent = await box(lg.locator(".item-content"))
    const lgActions = await box(lg.locator(".item-actions"))

    eq(smActions.top > smContent.top + 4, true, "narrow item: actions wrap below the content")
    near(lgActions.top, lgContent.top, 8, "wide item: actions share the content's row")
    eq(lgActions.left > lgContent.left, true, "wide item: actions sit after the content")
  })

  // ── Field ──────────────────────────────────────────────────────────

  await test("responsive field is stacked narrow and side by side wide", async () => {
    const smContent = await box(sm.locator(".field--responsive > .field-content"))
    const smBtn = await box(sm.locator(".field--responsive > button"))
    const lgContent = await box(lg.locator(".field--responsive > .field-content"))
    const lgBtn = await box(lg.locator(".field--responsive > button"))

    eq(smBtn.top > smContent.top, true, "narrow field: control below the content")
    near(smBtn.width, smContent.width, 2, "narrow field: control spans the field's width")
    eq(lgBtn.left > lgContent.left, true, "wide field: control beside the content")
    eq(lgBtn.width < smBtn.width, true, "wide field: control keeps its intrinsic width")
  })

  await test("the field's threshold tracks the container, not the page", async () => {
    // 840px clears the field's 40rem threshold, 480px does not — two different
    // answers from one page, which is the assertion a media query cannot satisfy.
    const mdContent = await box(md.locator(".field--responsive > .field-content"))
    const mdBtn = await box(md.locator(".field--responsive > button"))
    eq(mdBtn.top > mdContent.top, true, "480px panel stays under the 40rem threshold")

    const lgContent = await box(lg.locator(".field--responsive > .field-content"))
    const lgBtn = await box(lg.locator(".field--responsive > button"))
    eq(lgBtn.top < lgContent.top + 40, true, "840px panel clears it")
  })

  // ── Stacked table ──────────────────────────────────────────────────

  await test("table stacks in the narrow panel and keeps columns in the wide one", async () => {
    const smCells = sm.locator(".table-body .table-row").first().locator(".table-cell")
    const lgCells = lg.locator(".table-body .table-row").first().locator(".table-cell")

    const smFirst = await box(smCells.first())
    const smSecond = await box(smCells.nth(1))
    const lgFirst = await box(lgCells.first())
    const lgSecond = await box(lgCells.nth(1))

    eq(smSecond.top > smFirst.top, true, "narrow table: cells of one row stack vertically")
    near(lgFirst.top, lgSecond.top, 2, "wide table: cells of one row share a line")

    const smDisplay = await sm.locator(".table").evaluate((el) => getComputedStyle(el).display)
    const lgDisplay = await lg.locator(".table").evaluate((el) => getComputedStyle(el).display)
    eq(smDisplay, "block", "narrow table: laid out as blocks")
    eq(lgDisplay, "table", "wide table: still a table")
  })

  await test("each stacked cell renders its column name", async () => {
    const labels = await sm
      .locator(".table-body .table-row")
      .first()
      .locator(".table-cell")
      .evaluateAll((cells) => cells.map((c) => getComputedStyle(c, "::before").content))

    eq(labels.length, 3, "three cells in the first stacked row")
    eq(labels[0], '"Name"', "first stacked cell labelled Name")
    eq(labels[1], '"Region"', "second stacked cell labelled Region")
    eq(labels[2], '"Status"', "third stacked cell labelled Status")

    // Wide mode must not double the label up with the real header.
    const wide = await lg
      .locator(".table-body .table-row")
      .first()
      .locator(".table-cell")
      .first()
      .evaluate((c) => getComputedStyle(c, "::before").content)
    eq(wide, "none", "wide table renders no ::before labels")
  })

  await test("stacked rows keep their table semantics for assistive tech", async () => {
    // The ::before label is decoration. The announced column name still comes
    // from the header cells, so they must stay in the accessibility tree —
    // visually hidden, never display:none. And because changing `display` on
    // table parts strips their implicit roles, ui/table sets them explicitly.
    const header = sm.locator(".table-header")
    const headerBox = await header.boundingBox()
    eq(headerBox.height <= 1, true, "narrow table: header row is visually hidden")

    const headerDisplay = await header.evaluate((el) => getComputedStyle(el).display)
    eq(headerDisplay !== "none", true, "narrow table: header is not display:none")

    eq(await sm.locator('[role="row"]').count(), 4, "one header row plus three body rows")
    eq(await sm.locator('[role="cell"]').count(), 9, "nine cells expose role=cell")
    eq(await sm.locator('[role="columnheader"]').count(), 3, "three column headers remain")
  })

  // ── Containment must not disturb anchored overlays ──────────────────

  await test("every container on the page is named with the kit prefix", async () => {
    // Anonymous containers get claimed by whichever ancestor is nearest, which
    // turns nesting two components into action at a distance.
    const names = await page.evaluate(() => {
      const found = new Set()
      for (const el of document.querySelectorAll("*")) {
        const s = getComputedStyle(el)
        if (s.containerType && s.containerType !== "normal") {
          found.add(s.containerName || "(anonymous)")
        }
      }
      return [...found].sort()
    })

    eq(names.length > 0, true, "the page establishes query containers")
    eq(names.includes("(anonymous)"), false, "no anonymous containers")
    eq(
      names.every((n) => n.startsWith("vanillin-")),
      true,
      `containers carry the kit prefix (found: ${names.join(", ")})`
    )
  })

  await test("containment does not move an anchored overlay opened inside it", async () => {
    // ui/table's scroll wrapper is a containment context, and the data-table page
    // puts a faceted-filter popover trigger inside one. Containment makes an
    // element the containing block for absolutely positioned descendants, so the
    // risk is real; top-layer popovers should be immune. Rather than assert a
    // side (collision handling legitimately flips it), open the popover with
    // containment on and again with it switched off, and require the same
    // geometry both times.
    await page.goto(`${baseUrl}/#data-table`)
    const dt = page.locator('[data-pg="dt"]')
    await dt.waitFor()

    const trigger = dt.locator(".data-table-facet-trigger").first()
    await trigger.scrollIntoViewIfNeeded()

    const openAndMeasure = async () => {
      await trigger.click()
      await page.waitForSelector(".data-table-facet-content")
      const t = await trigger.boundingBox()
      const c = await page.locator(".data-table-facet-content").boundingBox()
      await page.keyboard.press("Escape")
      await page.waitForSelector(".data-table-facet-content", { state: "hidden" })
      // Offsets from the trigger, so a stray scroll cannot mask a real shift.
      // Width is compared as a delta against the trigger too: the popover's
      // min-width tracks its anchor, and dropping containment reflows the
      // table's own column widths by a fraction of a pixel.
      return { dx: c.x - t.x, dy: c.y - t.y, dw: c.width - t.width, h: c.height }
    }

    const contained = await openAndMeasure()
    eq(contained.h > 0, true, "popover is laid out, not collapsed")

    await page.addStyleTag({
      content: ".table-container { container-type: normal !important; }",
    })
    const uncontained = await openAndMeasure()

    near(contained.dx, uncontained.dx, 1, "containment does not shift the popover inline")
    near(contained.dy, uncontained.dy, 1, "containment does not shift the popover block-wise")
    near(contained.dw, uncontained.dw, 1, "containment does not resize the popover past its anchor")
  })
}
