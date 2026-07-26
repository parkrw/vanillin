export default async function run({ page, baseUrl, test, eq }) {
  // Park pointer at 0,0 — position carries over from previous test files.
  await page.mouse.move(0, 0)
  await page.goto(`${baseUrl}/#data-table`)

  const dt = page.locator('[data-pg="dt"]')
  await dt.waitFor()

  // Helpers
  const cellTexts = (colIndex) =>
    page.$$eval(
      '[data-pg="dt"] .table-body .table-row',
      (rows, ci) =>
        rows.map((r) => {
          const cells = r.querySelectorAll(".table-cell")
          return cells[ci]?.textContent?.trim() ?? ""
        }),
      colIndex
    )

  const selectionText = () =>
    page.locator('[data-pg="dt-selection"]').textContent()

  const pageInfo = () =>
    page.locator('[data-pg="dt-page-info"]').textContent()

  // ── Sorting ────────────────────────────────────────────────────────

  await test("sort toggle on email changes row order + aria-sort", async () => {
    // Click email header sort button
    const emailSortBtn = dt.locator(".data-table-sort-btn").first()
    await emailSortBtn.click()

    // aria-sort on the <th>
    const th = dt.locator('.table-head[aria-sort]')
    eq(await th.getAttribute("aria-sort"), "ascending", "aria-sort=ascending after first click")

    // Emails should be ascending
    const emails = await cellTexts(2) // col 0=select, 1=status, 2=email
    const sorted = [...emails].sort((a, b) => a.localeCompare(b))
    eq(emails.join(","), sorted.join(","), "emails sorted ascending")

    // Click again -> descending
    await emailSortBtn.click()
    eq(
      await th.getAttribute("aria-sort"),
      "descending",
      "aria-sort=descending after second click"
    )
    const emails2 = await cellTexts(2)
    const sortedDesc = [...emails2].sort((a, b) => b.localeCompare(a))
    eq(emails2.join(","), sortedDesc.join(","), "emails sorted descending")

    // Click again toggles back to ascending (the button uses toggleSorting(getIsSorted() === "asc"))
    await emailSortBtn.click()
    eq(
      await th.getAttribute("aria-sort"),
      "ascending",
      "aria-sort back to ascending"
    )
  })

  await test("sort toggle on amount sorts numerically", async () => {
    // Click amount sort button (second sort button)
    const amountSortBtn = dt.locator(".data-table-sort-btn").nth(1)
    await amountSortBtn.click()

    const amounts = await cellTexts(3)
    // Parse currency strings to numbers
    const nums = amounts.map((s) => parseFloat(s.replace(/[$,]/g, "")))
    const sorted = [...nums].sort((a, b) => a - b)
    eq(nums.join(","), sorted.join(","), "amounts sorted ascending")

    // Clear sort: click email header to move sort away from amount
    const emailSortBtn = dt.locator(".data-table-sort-btn").first()
    await emailSortBtn.click()
    // Then click email again to cycle past it, resetting to ascending on email
    // Just leave email sorted for now; the important thing is amount sort worked
  })

  // Reset sort state: click email sort to get a clean state
  // Actually let's just keep going — the filter test doesn't depend on sort order.

  // ── Filtering ──────────────────────────────────────────────────────

  await test("filter narrows visible rows", async () => {
    const filterInput = page.locator('[data-pg="dt-filter"]')
    await filterInput.fill("alice")

    // Wait for re-render
    await page.waitForTimeout(50)

    const emails = await cellTexts(2)
    eq(emails.length, 1, "filter to 'alice' shows 1 row")
    eq(
      emails[0].toLowerCase().includes("alice"),
      true,
      "visible email contains 'alice'"
    )

    // Filter for gmail — matches only example@gmail.com
    await filterInput.fill("gmail")
    await page.waitForTimeout(50)
    const emails2 = await cellTexts(2)
    eq(emails2.length, 1, "filter to 'gmail' shows 1 row")
    eq(emails2[0], "example@gmail.com", "the match is example@gmail.com")

    // Clear filter
    await filterInput.fill("")
    await page.waitForTimeout(50)
    const emails3 = await cellTexts(2)
    eq(emails3.length, 10, "clearing filter restores 10 rows per page")
  })

  // ── Column visibility ──────────────────────────────────────────────

  await test("column visibility toggle hides a column", async () => {
    // Open the Columns dropdown
    const colsBtn = page.locator('[data-pg="dt-columns-btn"]')
    await colsBtn.click()

    // Wait for the dropdown to appear
    await page.waitForSelector('.dropdown-menu[role="menu"]:popover-open')

    // Find the "status" checkbox item and uncheck it
    const statusItem = page.locator(
      '.dropdown-menu[role="menu"]:popover-open [role="menuitemcheckbox"]',
      { hasText: "status" }
    )
    await statusItem.click()

    // The menu should close; wait a tick
    await page.waitForTimeout(100)

    // Status column should be gone — header count reduced
    const headerTexts = await page.$$eval(
      '[data-pg="dt"] .table-head',
      (ths) => ths.map((th) => th.textContent.trim())
    )
    eq(
      headerTexts.some((h) => h.toLowerCase() === "status"),
      false,
      "status header is hidden"
    )

    // Re-enable: open dropdown again and click status
    await colsBtn.click()
    await page.waitForSelector('.dropdown-menu[role="menu"]:popover-open')
    const statusItem2 = page.locator(
      '.dropdown-menu[role="menu"]:popover-open [role="menuitemcheckbox"]',
      { hasText: "status" }
    )
    await statusItem2.click()
    await page.waitForTimeout(100)

    const headerTexts2 = await page.$$eval(
      '[data-pg="dt"] .table-head',
      (ths) => ths.map((th) => th.textContent.trim())
    )
    eq(
      headerTexts2.some((h) => h.toLowerCase().includes("status")),
      true,
      "status header is back"
    )
  })

  // ── Row selection ──────────────────────────────────────────────────

  await test("header checkbox selects all, shows indeterminate on partial", async () => {
    // Make sure no sort confusion — reset filter
    const filterInput = page.locator('[data-pg="dt-filter"]')
    await filterInput.fill("")
    await page.waitForTimeout(50)

    // Click the first row's checkbox (row checkbox is in the first cell)
    const firstRowCheckbox = dt
      .locator(".table-body .table-row")
      .first()
      .locator(".checkbox")
    await firstRowCheckbox.click()

    // Header checkbox should be indeterminate
    const headerCheckbox = dt
      .locator(".table-header .checkbox")
    eq(
      await headerCheckbox.getAttribute("aria-checked"),
      "mixed",
      "header checkbox is mixed (indeterminate) with one row selected"
    )

    // Selection count should show 1
    const selText = await selectionText()
    eq(selText.startsWith("1 of"), true, "selection count shows 1")

    // Click header checkbox to select all
    await headerCheckbox.click()
    eq(
      await headerCheckbox.getAttribute("aria-checked"),
      "true",
      "header checkbox is checked after select-all"
    )

    // All page rows should be selected
    const sel2 = await selectionText()
    eq(sel2.startsWith("10 of"), true, "10 rows selected on page")

    // Click header again to deselect all
    await headerCheckbox.click()
    eq(
      await headerCheckbox.getAttribute("aria-checked"),
      "false",
      "header checkbox unchecked after deselect-all"
    )
    const sel3 = await selectionText()
    eq(sel3.startsWith("0 of"), true, "0 rows selected")
  })

  await test("selection count text updates correctly", async () => {
    // Select two rows
    const rows = dt.locator(".table-body .table-row")
    await rows.nth(0).locator(".checkbox").click()
    await rows.nth(1).locator(".checkbox").click()

    const text = await selectionText()
    eq(text, "2 of 20 row(s) selected.", "selection count is 2 of 20")

    // Deselect both
    await rows.nth(0).locator(".checkbox").click()
    await rows.nth(1).locator(".checkbox").click()

    const text2 = await selectionText()
    eq(text2, "0 of 20 row(s) selected.", "selection count is 0 of 20")
  })

  // ── Pagination ─────────────────────────────────────────────────────

  await test("pagination next/prev with page-size math", async () => {
    // Default: 10 per page, 20 items => 2 pages
    eq(await pageInfo(), "Page 1 of 2", "starts on page 1 of 2")

    // Previous should be disabled
    eq(
      await page.locator('[data-pg="dt-prev"]').isDisabled(),
      true,
      "prev disabled on first page"
    )

    // Click next
    await page.locator('[data-pg="dt-next"]').click()
    eq(await pageInfo(), "Page 2 of 2", "moved to page 2")
    eq(
      await page.locator('[data-pg="dt-next"]').isDisabled(),
      true,
      "next disabled on last page"
    )

    // Click prev
    await page.locator('[data-pg="dt-prev"]').click()
    eq(await pageInfo(), "Page 1 of 2", "back to page 1")

    // Change page size to 5 => 4 pages
    await page.locator('[data-pg="dt-page-size"]').selectOption("5")
    eq(await pageInfo(), "Page 1 of 4", "5 per page = 4 pages")

    // Navigate to last page
    await page.locator('[data-pg="dt-next"]').click()
    await page.locator('[data-pg="dt-next"]').click()
    await page.locator('[data-pg="dt-next"]').click()
    eq(await pageInfo(), "Page 4 of 4", "on last page")

    const rowCount = await dt.locator(".table-body .table-row").count()
    eq(rowCount, 5, "last page has 5 rows")

    // Reset to 10 per page
    await page.locator('[data-pg="dt-page-size"]').selectOption("10")
    eq(await pageInfo(), "Page 1 of 2", "reset to 10 per page")
  })

  // ── Row actions ────────────────────────────────────────────────────

  await test("row actions menu opens", async () => {
    // Click the first row's actions button
    const actionsTrigger = dt
      .locator(".table-body .table-row")
      .first()
      .locator(".data-table-actions-trigger")
    await actionsTrigger.click()

    // Wait for menu
    const menu = await page.waitForSelector(
      '.dropdown-menu[role="menu"]:popover-open'
    )
    eq(!!menu, true, "actions menu opened")

    // Check menu items
    const items = await page.$$eval(
      '.dropdown-menu[role="menu"]:popover-open [role="menuitem"]',
      (els) => els.map((el) => el.textContent.trim())
    )
    eq(items.includes("Copy payment ID"), true, "has Copy payment ID")
    eq(items.includes("View customer"), true, "has View customer")
    eq(items.includes("View payment details"), true, "has View payment details")

    // Close menu by pressing Escape
    await page.keyboard.press("Escape")
    await page.waitForTimeout(100)
  })

  // ── Global filter ──────────────────────────────────────────────────

  await test("global filter matches across columns", async () => {
    const globalInput = page.locator('[data-pg="dt-global-filter"]')
    await globalInput.fill("pending")
    await page.waitForTimeout(50)

    const statuses = await cellTexts(1) // col 0=select, 1=status
    eq(statuses.every((s) => s.toLowerCase() === "pending"), true, "all rows are pending")
    eq(statuses.length, 5, "5 pending rows")

    // Search by email substring
    await globalInput.fill("alice")
    await page.waitForTimeout(50)
    const emails = await cellTexts(2)
    eq(emails.length, 1, "global filter finds alice")
    eq(emails[0], "alice@example.com", "matched alice email")

    await globalInput.fill("")
    await page.waitForTimeout(50)
  })

  await test("global + column filters AND together", async () => {
    const globalInput = page.locator('[data-pg="dt-global-filter"]')
    const emailInput = page.locator('[data-pg="dt-filter"]')

    // Global: "example.com" matches all 20 rows
    await globalInput.fill("example.com")
    await page.waitForTimeout(50)
    // Column: "alice" narrows to 1
    await emailInput.fill("alice")
    await page.waitForTimeout(50)

    const emails = await cellTexts(2)
    eq(emails.length, 1, "AND of global + column filter gives 1 row")
    eq(emails[0], "alice@example.com", "alice row survives both filters")

    await globalInput.fill("")
    await emailInput.fill("")
    await page.waitForTimeout(50)
  })

  // ── Faceted filter ─────────────────────────────────────────────────

  await test("faceted counts reflect other filters, not own selection", async () => {
    // Open the status facet
    const facetBtn = dt.locator(".data-table-facet-trigger")
    await facetBtn.click()
    await page.waitForTimeout(100)

    // Read initial counts — should sum to 20 (all rows)
    const countEls = page.locator(".data-table-facet-count")
    const initialCounts = await countEls.allTextContents()
    const initialSum = initialCounts.reduce((s, c) => s + Number(c), 0)
    eq(initialSum, 20, "facet counts sum to total rows before any filter")

    // Select "pending" — counts must NOT collapse; they should still
    // reflect rows passing everything except the status filter
    const pendingItem = page.locator('[role="option"]', { hasText: "pending" })
    await pendingItem.click()
    await page.waitForTimeout(100)

    const afterCounts = await countEls.allTextContents()
    const afterSum = afterCounts.reduce((s, c) => s + Number(c), 0)
    eq(afterSum, 20, "facet counts still sum to 20 after selecting pending")

    // Table should show only pending rows
    const statuses = await cellTexts(1)
    eq(statuses.every((s) => s.toLowerCase() === "pending"), true, "table shows only pending")

    // Clear
    const clearItem = page.locator(".data-table-facet-clear")
    await clearItem.click()
    await page.waitForTimeout(100)

    // Close popover
    await page.keyboard.press("Escape")
    await page.waitForTimeout(100)
  })

  await test("multi-value facet filter", async () => {
    const facetBtn = dt.locator(".data-table-facet-trigger")
    await facetBtn.click()
    await page.waitForTimeout(100)

    // Select "pending" and "failed"
    const pendingItem = page.locator('[role="option"]', { hasText: "pending" })
    await pendingItem.click()
    await page.waitForTimeout(50)
    const failedItem = page.locator('[role="option"]', { hasText: "failed" })
    await failedItem.click()
    await page.waitForTimeout(100)

    // Close popover
    await page.keyboard.press("Escape")
    await page.waitForTimeout(100)

    // Table should show pending + failed rows
    const statuses = await cellTexts(1)
    const validStatuses = statuses.every(
      (s) => s.toLowerCase() === "pending" || s.toLowerCase() === "failed"
    )
    eq(validStatuses, true, "table shows only pending and failed")
    eq(statuses.length, 9, "5 pending + 4 failed = 9 rows")

    // Clear: reopen, clear
    await facetBtn.click()
    await page.waitForTimeout(100)
    const clearItem = page.locator(".data-table-facet-clear")
    await clearItem.click()
    await page.waitForTimeout(100)
    await page.keyboard.press("Escape")
    await page.waitForTimeout(100)
  })

  // ── Multi-sort ─────────────────────────────────────────────────────

  await test("shift-click builds two-key sort and secondary orders ties", async () => {
    // Plain click email to make it the sole sort key (direction depends
    // on prior state — we only care that it becomes the primary)
    const emailSortBtn = dt.locator(".data-table-sort-btn").first()
    await emailSortBtn.click()
    await page.waitForTimeout(50)

    const emailTh = dt.locator(".table-head").nth(2) // select=0, status=1, email=2
    const emailDir = await emailTh.getAttribute("aria-sort")
    eq(emailDir !== null, true, "email th has aria-sort after plain click")

    // Shift-click amount to add secondary sort
    const amountSortBtn = dt.locator(".data-table-sort-btn").nth(1)
    await amountSortBtn.click({ modifiers: ["Shift"] })
    await page.waitForTimeout(50)

    // aria-sort stays on email (primary) only
    const amountTh = dt.locator(".table-head").nth(3)
    eq(await emailTh.getAttribute("aria-sort"), emailDir, "primary email keeps aria-sort")
    eq(await amountTh.getAttribute("aria-sort"), null, "secondary amount has no aria-sort")

    // Amount sort button should have an aria-label mentioning "sort 2"
    const amountLabel = await amountSortBtn.getAttribute("aria-label")
    eq(
      amountLabel != null && amountLabel.includes("sort 2"),
      true,
      "amount button aria-label mentions sort 2"
    )
  })

  await test("plain click resets multi-sort to single column", async () => {
    // Plain click amount — should reset to single sort on amount only
    const amountSortBtn = dt.locator(".data-table-sort-btn").nth(1)
    await amountSortBtn.click()
    await page.waitForTimeout(50)

    // aria-sort on amount, not email
    const emailTh = dt.locator(".table-head").nth(2)
    const amountTh = dt.locator(".table-head").nth(3)
    eq(await emailTh.getAttribute("aria-sort"), null, "email th no aria-sort after reset")
    eq(await amountTh.getAttribute("aria-sort") !== null, true, "amount th has aria-sort")

    // Email sort button should not have a secondary sort aria-label
    const emailSortBtn = dt.locator(".data-table-sort-btn").first()
    eq(await emailSortBtn.getAttribute("aria-label"), null, "email button has no aria-label")
  })

  // ── Column sizing ─────────────────────────────────────────────────

  const dtSized = page.locator('[data-pg="dt-sized"]')

  await test("un-sized table keeps table-layout auto", async () => {
    // The first demo table (dt) must NOT have table-layout: fixed
    const tableStyle = await dt.locator(".table").evaluate(
      (el) => getComputedStyle(el).tableLayout
    )
    eq(tableStyle, "auto", "original table has table-layout: auto")
  })

  await test("sized table uses table-layout fixed", async () => {
    await dtSized.waitFor()
    const tableStyle = await dtSized.locator(".table").evaluate(
      (el) => getComputedStyle(el).tableLayout
    )
    eq(tableStyle, "fixed", "sized table has table-layout: fixed")
  })

  await test("drag resizer changes column width, survives re-sort", async () => {
    await dtSized.waitFor()
    const resizer = dtSized.locator(".data-table-resizer").first()

    // Read initial width from the CSS var
    const initialWidth = await dtSized.locator(".table").evaluate(
      (el) => parseInt(getComputedStyle(el).getPropertyValue("--dt-size-id"), 10)
    )

    // hover() scrolls into view and positions the mouse on the element
    await resizer.hover()
    const box = await resizer.boundingBox()
    await page.mouse.down()
    await page.mouse.move(box.x + box.width / 2 + 60, box.y + box.height / 2, { steps: 5 })
    await page.mouse.up()
    await page.waitForTimeout(100)

    const afterWidth = await dtSized.locator(".table").evaluate(
      (el) => parseInt(getComputedStyle(el).getPropertyValue("--dt-size-id"), 10)
    )
    eq(afterWidth > initialWidth, true, `width grew from ${initialWidth} to ${afterWidth}`)

    // Sort the email column, then check width survived
    const emailSortBtn = dtSized.locator(".data-table-sort-btn").first()
    await emailSortBtn.click()
    await page.waitForTimeout(50)

    const afterSort = await dtSized.locator(".table").evaluate(
      (el) => parseInt(getComputedStyle(el).getPropertyValue("--dt-size-id"), 10)
    )
    eq(afterSort, afterWidth, "width survives re-sort")
  })

  await test("resize clamps to minSize and maxSize", async () => {
    await dtSized.waitFor()
    // Email column has minSize: 100. Drag its resizer far left.
    // select has enableResizing: false, so resizers: id(0), status(1), email(2), amount(3)
    const resizer = dtSized.locator(".data-table-resizer").nth(2) // email
    await resizer.hover()
    const box = await resizer.boundingBox()

    // Drag far left — should clamp to minSize 100
    await page.mouse.down()
    await page.mouse.move(box.x - 500, box.y + box.height / 2, { steps: 5 })
    await page.mouse.up()
    await page.waitForTimeout(100)

    const clampedWidth = await dtSized.locator(".table").evaluate(
      (el) => parseInt(getComputedStyle(el).getPropertyValue("--dt-size-email"), 10)
    )
    eq(clampedWidth, 100, "email clamped to minSize 100")
  })

  await test("arrow-key resize and double-click reset", async () => {
    await dtSized.waitFor()
    // Focus the email resizer
    const resizer = dtSized.locator(".data-table-resizer").nth(2)
    await resizer.focus()

    // Read current size
    const before = await dtSized.locator(".table").evaluate(
      (el) => parseInt(getComputedStyle(el).getPropertyValue("--dt-size-email"), 10)
    )

    // Press ArrowRight twice = +16
    await page.keyboard.press("ArrowRight")
    await page.keyboard.press("ArrowRight")
    await page.waitForTimeout(50)

    const after = await dtSized.locator(".table").evaluate(
      (el) => parseInt(getComputedStyle(el).getPropertyValue("--dt-size-email"), 10)
    )
    eq(after, before + 16, "ArrowRight twice adds 16px")

    // Double-click resets to column def size (260)
    await resizer.dblclick()
    await page.waitForTimeout(50)

    const reset = await dtSized.locator(".table").evaluate(
      (el) => parseInt(getComputedStyle(el).getPropertyValue("--dt-size-email"), 10)
    )
    eq(reset, 260, "double-click resets to column def size")
  })

  // ── Column pinning ────────────────────────────────────────────────

  await test("pin left: column stays at inset-inline-start 0 after horizontal scroll", async () => {
    await dtSized.waitFor()
    // Pin the "id" column left via the Columns dropdown
    const colsBtn = page.locator('[data-pg="dt-sized-columns-btn"]')
    await colsBtn.click()
    await page.waitForSelector('.dropdown-menu[role="menu"]:popover-open')

    // Click the pin item for "id" (first click pins left)
    const pinItem = page.locator(
      '.dropdown-menu[role="menu"]:popover-open [role="menuitem"]',
      { hasText: /^id:/ }
    )
    await pinItem.click()
    await page.waitForTimeout(100)

    // Close dropdown if still open
    await page.keyboard.press("Escape")
    await page.waitForTimeout(50)

    // The id header cell should have the pinned class
    const idTh = dtSized.locator(".table-head.data-table-pinned").first()
    await idTh.waitFor()

    // Scroll the table container to the right
    const container = dtSized.locator(".table-container")
    await container.evaluate((el) => { el.scrollLeft = 200 })
    await page.waitForTimeout(50)

    // The pinned column should still be at inset-inline-start: 0
    const insetStart = await idTh.evaluate(
      (el) => getComputedStyle(el).insetInlineStart
    )
    eq(insetStart, "0px", "pinned column stays at inset-inline-start: 0")
  })

  await test("pinned cell background is opaque", async () => {
    // The id column is still pinned from the previous test
    const pinnedCell = dtSized.locator(
      ".table-body .table-row:first-child .data-table-pinned"
    ).first()
    await pinnedCell.waitFor()

    const bg = await pinnedCell.evaluate((el) => {
      const style = getComputedStyle(el)
      return style.backgroundColor
    })
    // Background must be opaque — no "/ 0" or "transparent" or alpha < 1
    const isOpaque =
      !bg.includes("transparent") &&
      !bg.includes("/ 0") &&
      !bg.match(/rgba?\([^)]+,\s*0\s*\)/)
    eq(isOpaque, true, `pinned cell bg is opaque: ${bg}`)
  })

  await test("pinned cell tracks row hover background", async () => {
    const row = dtSized.locator(".table-body .table-row").first()
    const pinnedCell = row.locator(".data-table-pinned").first()

    // Get background before hover
    const bgBefore = await pinnedCell.evaluate(
      (el) => getComputedStyle(el).backgroundColor
    )

    // Hover the row
    await row.hover()
    await page.waitForTimeout(100)

    const bgHover = await pinnedCell.evaluate(
      (el) => getComputedStyle(el).backgroundColor
    )
    eq(bgHover !== bgBefore, true, `bg changed on hover: ${bgBefore} → ${bgHover}`)

    // The hovered bg must still be opaque
    const isOpaque =
      !bgHover.includes("transparent") &&
      !bgHover.includes("/ 0") &&
      !bgHover.match(/rgba?\([^)]+,\s*0\s*\)/)
    eq(isOpaque, true, `hovered pinned bg is opaque: ${bgHover}`)

    // Move mouse away
    await page.mouse.move(0, 0)
    await page.waitForTimeout(50)
  })

  await test("pinned cell tracks row selection background", async () => {
    // Select the first row
    const checkbox = dtSized.locator(
      ".table-body .table-row:first-child .checkbox"
    ).first()
    await checkbox.click()
    await page.waitForTimeout(50)

    const pinnedCell = dtSized.locator(
      ".table-body .table-row:first-child .data-table-pinned"
    ).first()
    const bgSel = await pinnedCell.evaluate(
      (el) => getComputedStyle(el).backgroundColor
    )

    // Should not be the default var(--background); it should match --accent
    const bgDefault = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue("--background").trim()
    )
    eq(bgSel !== bgDefault, true, `selected pinned bg differs from default`)

    // Deselect
    await checkbox.click()
    await page.waitForTimeout(50)
  })

  await test("unpin restores normal cell", async () => {
    // Unpin the "id" column: click pin item again (left → right), then again (right → unpin)
    const colsBtn = page.locator('[data-pg="dt-sized-columns-btn"]')
    await colsBtn.click()
    await page.waitForSelector('.dropdown-menu[role="menu"]:popover-open')

    const pinItem = page.locator(
      '.dropdown-menu[role="menu"]:popover-open [role="menuitem"]',
      { hasText: /^id:/ }
    )
    // Currently "pinned left" → click → "pinned right"
    await pinItem.click()
    await page.waitForTimeout(50)

    // Reopen
    await colsBtn.click()
    await page.waitForSelector('.dropdown-menu[role="menu"]:popover-open')
    const pinItem2 = page.locator(
      '.dropdown-menu[role="menu"]:popover-open [role="menuitem"]',
      { hasText: /^id:/ }
    )
    // Currently "pinned right" → click → "unpinned"
    await pinItem2.click()
    await page.waitForTimeout(100)
    await page.keyboard.press("Escape")
    await page.waitForTimeout(50)

    // No pinned cells should remain
    const pinnedCount = await dtSized.locator(".data-table-pinned").count()
    eq(pinnedCount, 0, "no pinned cells after unpin")
  })

  // ── Grouping ──────────────────────────────────────────────────────

  const dtGrouped = page.locator('[data-pg="dt-grouped"]')
  const groupedDataRows = dtGrouped.locator(
    ".table-body .table-row:not(.data-table-group-row)"
  )
  const groupedPageInfo = () =>
    page.locator('[data-pg="dt-grouped-page-info"]').textContent()

  await test("grouping produces collapsed group rows in value order", async () => {
    await dtGrouped.waitFor()

    const groupRows = dtGrouped.locator(".data-table-group-row")
    eq(await groupRows.count(), 4, "4 status groups")
    eq(await groupedDataRows.count(), 0, "children hidden while collapsed")
    eq(
      await groupRows.first().getAttribute("data-depth"),
      "0",
      "top-level groups have depth 0"
    )

    const labels = await dtGrouped
      .locator(".data-table-group-label")
      .allTextContents()
    eq(
      labels.join(","),
      "failed,pending,processing,success",
      "groups ordered by value"
    )

    const counts = await dtGrouped
      .locator(".data-table-group-count")
      .allTextContents()
    eq(
      counts.reduce((s, c) => s + Number(c), 0),
      20,
      "leaf counts sum to all rows"
    )
  })

  await test("expand/collapse round-trips", async () => {
    const firstToggle = dtGrouped.locator(".data-table-group-toggle").first()
    eq(await firstToggle.getAttribute("aria-expanded"), "false", "starts collapsed")

    await firstToggle.click()
    await page.waitForTimeout(50)
    eq(await firstToggle.getAttribute("aria-expanded"), "true", "expanded after click")
    eq(await groupedDataRows.count(), 4, "failed group shows its 4 rows")

    await firstToggle.click()
    await page.waitForTimeout(50)
    eq(await firstToggle.getAttribute("aria-expanded"), "false", "collapsed again")
    eq(await groupedDataRows.count(), 0, "children hidden after collapse")
  })

  await test("nested grouping adds depth-1 group rows", async () => {
    await page.locator('[data-pg="dt-grouped-nested"]').click()
    await page.waitForTimeout(50)
    eq(
      await dtGrouped.locator(".data-table-group-row").count(),
      4,
      "still 4 collapsed top-level groups"
    )

    // Expand the first status group — its children are method group rows
    const firstToggle = dtGrouped.locator(".data-table-group-toggle").first()
    await firstToggle.click()
    await page.waitForTimeout(50)

    const depth1 = dtGrouped.locator('.data-table-group-row[data-depth="1"]')
    eq(await depth1.count(), 2, "failed splits into 2 method groups")
    eq(await groupedDataRows.count(), 0, "no data rows until a method group opens")

    // Expand the first method group — exactly its leaf rows appear
    const leafCount = Number(
      await depth1.first().locator(".data-table-group-count").textContent()
    )
    await depth1.first().locator(".data-table-group-toggle").click()
    await page.waitForTimeout(50)
    eq(await groupedDataRows.count(), leafCount, "method group reveals its leaves")

    // Restore: collapse the status group, back to single-level grouping
    await firstToggle.click()
    await page.waitForTimeout(50)
    await page.locator('[data-pg="dt-grouped-nested"]').click()
    await page.waitForTimeout(50)
    eq(
      await dtGrouped.locator(".data-table-group-row").count(),
      4,
      "back to 4 status groups"
    )
    eq(await groupedDataRows.count(), 0, "all collapsed after restore")
  })

  await test("sort applies within each group, not across the result", async () => {
    // Expand all (page size 30 shows the full flattened result)
    await page.locator('[data-pg="dt-grouped-expand-all"]').click()
    await page.waitForTimeout(50)
    eq(
      await dtGrouped.locator(".table-body .table-row").count(),
      24,
      "4 group rows + 20 data rows when all expanded"
    )

    await dtGrouped.locator(".data-table-sort-btn").first().click()
    await page.waitForTimeout(50)

    const rows = await page.$$eval(
      '[data-pg="dt-grouped"] .table-body .table-row',
      (els) =>
        els.map((el) => {
          const isGroup = el.classList.contains("data-table-group-row")
          const cell = el.querySelectorAll(".table-cell")[3]
          return {
            isGroup,
            amount: isGroup ? null : parseFloat(cell.textContent.replace(/[$,]/g, "")),
          }
        })
    )
    eq(rows.filter((r) => r.isGroup).length, 4, "group headers intact after sort")

    let withinGroupSorted = true
    let prev = -Infinity
    for (const r of rows) {
      if (r.isGroup) {
        prev = -Infinity
        continue
      }
      if (r.amount < prev) withinGroupSorted = false
      prev = r.amount
    }
    eq(withinGroupSorted, true, "amounts ascend within each group")

    const amounts = rows.filter((r) => !r.isGroup).map((r) => r.amount)
    const globallySorted = amounts.every((a, i) => i === 0 || a >= amounts[i - 1])
    eq(globallySorted, false, "sort does not run across group boundaries")
  })

  await test("pagination applies to the flattened result", async () => {
    // All expanded from the previous test: 24 flattened rows
    await page.locator('[data-pg="dt-grouped-page-size"]').selectOption("10")
    await page.waitForTimeout(50)
    eq(await groupedPageInfo(), "Page 1 of 3", "24 flattened rows = 3 pages of 10")
    eq(await dtGrouped.locator(".table-body .table-row").count(), 10, "page 1 has 10 rows")

    await page.locator('[data-pg="dt-grouped-next"]').click()
    await page.locator('[data-pg="dt-grouped-next"]').click()
    await page.waitForTimeout(50)
    eq(await groupedPageInfo(), "Page 3 of 3", "on last page")
    eq(await dtGrouped.locator(".table-body .table-row").count(), 4, "last page has 4 rows")
    eq(
      await page.locator('[data-pg="dt-grouped-next"]').isDisabled(),
      true,
      "next disabled on last page"
    )

    // Restore: one page again, everything collapsed
    await page.locator('[data-pg="dt-grouped-page-size"]').selectOption("30")
    await page.waitForTimeout(50)
    await page.locator('[data-pg="dt-grouped-expand-all"]').click()
    await page.waitForTimeout(50)
    eq(await groupedDataRows.count(), 0, "collapse-all hides data rows")
  })

  // ── Manual modes ──────────────────────────────────────────────────

  const dtManual = page.locator('[data-pg="dt-manual"]')
  const manualProducts = () =>
    page.$$eval('[data-pg="dt-manual"] .table-body .table-row', (rows) =>
      rows.map((r) => r.querySelectorAll(".table-cell")[1].textContent.trim())
    )
  const manualFires = () =>
    page.locator('[data-pg="dt-manual-fires"]').textContent()

  await test("manualSorting preserves data order; callback fires once per change", async () => {
    await dtManual.waitFor()
    const before = await manualProducts()
    eq(before.join(","), "Keyboard,Mouse,Headset,Cable,Dock", "initial data order")
    eq(await manualFires(), "onSortingChange fired 0 time(s).", "no fires yet")

    const sortBtn = dtManual.locator(".data-table-sort-btn")
    await sortBtn.click()
    await page.waitForTimeout(50)
    eq(
      await dtManual.locator(".table-head[aria-sort]").getAttribute("aria-sort"),
      "ascending",
      "sort indicator updates"
    )
    eq((await manualProducts()).join(","), before.join(","), "row order preserved")
    eq(await manualFires(), "onSortingChange fired 1 time(s).", "fired exactly once")

    await sortBtn.click()
    await page.waitForTimeout(50)
    eq(
      await dtManual.locator(".table-head[aria-sort]").getAttribute("aria-sort"),
      "descending",
      "indicator toggles to descending"
    )
    eq((await manualProducts()).join(","), before.join(","), "order still untouched")
    eq(await manualFires(), "onSortingChange fired 2 time(s).", "fired exactly twice")
  })

  // ── Server-side (manualPagination + manualSorting) ────────────────

  const dtServer = page.locator('[data-pg="dt-server"]')
  const serverPageInfo = () =>
    page.locator('[data-pg="dt-server-page-info"]').textContent()
  const serverIdle = () =>
    page.waitForSelector('[data-pg="dt-server-status"][data-loading="false"]')
  const serverOrders = () =>
    page.$$eval('[data-pg="dt-server"] .table-body .table-row', (rows) =>
      rows.map((r) => r.querySelectorAll(".table-cell")[0].textContent.trim())
    )

  await test("manualPagination derives page count from rowCount", async () => {
    await dtServer.waitFor()
    await serverIdle()
    eq(await serverPageInfo(), "Page 1 of 50", "500 rows / 10 per page = 50 pages")
    eq((await serverOrders()).join(","), "1,2,3,4,5,6,7,8,9,10", "first server page")
  })

  await test("page change triggers a server re-fetch", async () => {
    await page.locator('[data-pg="dt-server-next"]').click()
    await page.waitForSelector('[data-pg="dt-server-status"][data-loading="true"]')
    await serverIdle()
    eq(await serverPageInfo(), "Page 2 of 50", "moved to page 2")
    eq(
      (await serverOrders()).join(","),
      "11,12,13,14,15,16,17,18,19,20",
      "second server page"
    )
  })

  await test("sort change re-fetches server-sorted data and resets to page 1", async () => {
    await dtServer.locator(".data-table-sort-btn").click()
    await page.waitForSelector('[data-pg="dt-server-status"][data-loading="true"]')
    await serverIdle()
    eq(await serverPageInfo(), "Page 1 of 50", "sorting resets to page 1")

    const amounts = await page.$$eval(
      '[data-pg="dt-server"] .table-body .table-row',
      (rows) =>
        rows.map((r) =>
          parseFloat(
            r.querySelectorAll(".table-cell")[2].textContent.replace(/[$,]/g, "")
          )
        )
    )
    const ascending = amounts.every((a, i) => i === 0 || a >= amounts[i - 1])
    eq(ascending, true, "server returned the sorted page")
  })
}
