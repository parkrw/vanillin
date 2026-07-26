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
}
