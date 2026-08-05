export default async function run({ page, baseUrl, repoRoot, test, eq, near }) {
  // ---- button ----
  await page.goto(`${baseUrl}/#button`)
  await page.waitForSelector(".pg-main .btn")

  await test("button shows pointer cursor", async () => {
    const cursor = await page.locator(".pg-main .btn").first().evaluate(
      (el) => getComputedStyle(el).cursor,
    )
    eq(cursor, "pointer")
  })

  // ---- dropdown-menu (menuitem) ----
  await page.goto(`${baseUrl}/#dropdown-menu`)
  await page.waitForSelector(".pg-main .btn")

  await test("menu item shows pointer cursor", async () => {
    await page.locator(".pg-main .btn").first().click()
    await page.waitForSelector('[role="menuitem"]')
    const cursor = await page.locator('[role="menuitem"]').first().evaluate(
      (el) => getComputedStyle(el).cursor,
    )
    eq(cursor, "pointer")
    await page.keyboard.press("Escape")
  })

  // ---- select (option) ----
  await page.goto(`${baseUrl}/#select`)
  await page.waitForSelector(".select-trigger")

  await test("select option shows pointer cursor", async () => {
    await page.locator(".select-trigger").first().click()
    await page.waitForSelector('[role="option"]')
    const cursor = await page.locator('[role="option"]').first().evaluate(
      (el) => getComputedStyle(el).cursor,
    )
    eq(cursor, "pointer")
    await page.keyboard.press("Escape")
  })

  // ---- tabs ----
  await page.goto(`${baseUrl}/#tabs`)
  await page.waitForSelector('[role="tab"]')

  await test("tab shows pointer cursor", async () => {
    const cursor = await page.locator('[role="tab"]').first().evaluate(
      (el) => getComputedStyle(el).cursor,
    )
    eq(cursor, "pointer")
  })

  // ---- switch ----
  await page.goto(`${baseUrl}/#switch`)
  await page.waitForSelector('[role="switch"]')

  await test("switch shows pointer cursor", async () => {
    const cursor = await page.locator('[role="switch"]').first().evaluate(
      (el) => getComputedStyle(el).cursor,
    )
    eq(cursor, "pointer")
  })

  // ---- label[for] ----
  await page.goto(`${baseUrl}/#checkbox`)
  await page.waitForSelector("label[for]")

  await test("label[for] shows pointer cursor", async () => {
    const cursor = await page.locator("label[for]").first().evaluate(
      (el) => getComputedStyle(el).cursor,
    )
    eq(cursor, "pointer")
  })

  // ---- breadcrumb link (a[href]) ----
  await page.goto(`${baseUrl}/#breadcrumb`)
  await page.waitForSelector(".breadcrumb-link")

  await test("breadcrumb link shows pointer cursor", async () => {
    const cursor = await page.locator(".breadcrumb-link").first().evaluate(
      (el) => getComputedStyle(el).cursor,
    )
    eq(cursor, "pointer")
  })

  // ---- pagination link (a[href]) ----
  await page.goto(`${baseUrl}/#pagination`)
  await page.waitForSelector(".pagination a[href]")

  await test("pagination link shows pointer cursor", async () => {
    const cursor = await page.locator(".pagination a[href]").first().evaluate(
      (el) => getComputedStyle(el).cursor,
    )
    eq(cursor, "pointer")
  })

  // ---- accordion trigger ----
  await page.goto(`${baseUrl}/#accordion`)
  await page.waitForSelector(".accordion-trigger")

  await test("accordion trigger shows pointer cursor", async () => {
    const cursor = await page.locator(".accordion-trigger").first().evaluate(
      (el) => getComputedStyle(el).cursor,
    )
    eq(cursor, "pointer")
  })

  // ---- slider: grab at rest, grabbing during drag ----
  await page.goto(`${baseUrl}/#slider`)
  await page.waitForSelector(".slider-thumb")

  await test("slider thumb shows grab cursor at rest", async () => {
    const cursor = await page.locator(".slider-thumb").first().evaluate(
      (el) => getComputedStyle(el).cursor,
    )
    eq(cursor, "grab")
  })

  await test("slider thumb shows grabbing cursor during drag", async () => {
    const thumb = page.locator(".slider-thumb").first()
    const box = await thumb.boundingBox()
    const cx = box.x + box.width / 2
    const cy = box.y + box.height / 2
    await page.mouse.move(cx, cy)
    await page.mouse.down()
    // Move to engage the drag
    await page.mouse.move(cx + 20, cy)
    const cursor = await page.locator(".slider").first().evaluate(
      (el) => el.hasAttribute("data-dragging"),
    )
    eq(cursor, true, "data-dragging present")
    const thumbCursor = await page.locator(".slider-thumb").first().evaluate(
      (el) => getComputedStyle(el).cursor,
    )
    eq(thumbCursor, "grabbing")
    await page.mouse.up()
  })

  // ---- resizable: col-resize on vertical separator ----
  await page.goto(`${baseUrl}/#resizable`)
  await page.waitForSelector(".resizable-handle")

  await test("vertical separator shows col-resize cursor", async () => {
    // The first resizable group is horizontal, so its handle is a vertical separator
    const cursor = await page
      .locator('[data-pg="r-horizontal"] .resizable-handle')
      .first()
      .evaluate((el) => getComputedStyle(el).cursor)
    eq(cursor, "col-resize")
  })
}
