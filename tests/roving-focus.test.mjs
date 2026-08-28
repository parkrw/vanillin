// The static demo hid both defects for 700+ tests: tabIndex was synced once on
// mount, so every assertion held as long as no item ever mounted, unmounted or
// changed eligibility. Each case below re-establishes the list and the tab stop
// it needs, so one failure cannot cascade into misleading downstream failures.
export default async function run({ page, baseUrl, test, eq }) {
  await page.goto(`${baseUrl}/#primitives`)
  await page.waitForSelector('[data-pg="roving"] [data-roving]', { timeout: 5000 })

  const count = () => page.$$eval('[data-pg="roving"] [data-roving]', (els) => els.length)
  const tabIndexes = async () =>
    (
      await page.$$eval('[data-pg="roving"] [data-roving]', (els) => els.map((el) => el.tabIndex))
    ).join(",")
  const labels = () =>
    page.$$eval('[data-pg="roving"] [data-roving]', (els) => els.map((el) => el.dataset.pg).join(","))
  const focused = () => page.evaluate(() => document.activeElement?.dataset.pg ?? document.activeElement?.tagName)
  const click = (pg) => page.evaluate((sel) => document.querySelector(sel).click(), `[data-pg="${pg}"]`)
  // Starts every case from four enabled items with the tab stop on the first.
  const reset = async () => {
    await click("roving-reset")
    await page.waitForFunction(
      () => document.querySelectorAll('[data-pg="roving"] [data-roving]').length === 4
    )
    await page.focus('[data-pg="roving-one"]')
  }
  const removeFirst = async () => {
    const before = await count()
    await click("roving-remove-first")
    await page.waitForFunction(
      (n) => document.querySelectorAll('[data-pg="roving"] [data-roving]').length === n,
      before - 1
    )
  }

  await test("one tab stop on mount", async () => {
    eq(await labels(), "roving-one,roving-two,roving-three,roving-four")
    eq(await tabIndexes(), "0,-1,-1,-1")
  })

  await test("removing the item that holds the tab stop re-syncs the group", async () => {
    await reset()
    eq(await tabIndexes(), "0,-1,-1,-1", "tab stop pinned to the first item")
    await removeFirst()
    eq(await labels(), "roving-two,roving-three,roving-four")
    eq(await tabIndexes(), "0,-1,-1", "survivors must not all be -1")
  })

  await test("Tab still reaches the group after the active item unmounts", async () => {
    await reset()
    await removeFirst()
    // The controls row follows the toolbar in DOM order, so Shift+Tab from it
    // enters the group — or skips it entirely when no item holds tabIndex 0.
    await page.focus('[data-pg="roving-remove-first"]')
    await page.keyboard.press("Shift+Tab")
    eq(await focused(), "roving-two")
  })

  await test("arrow keys and Home/End still work on the shortened list", async () => {
    await reset()
    await removeFirst()
    await page.focus('[data-pg="roving-two"]')
    await page.keyboard.press("ArrowRight")
    eq(await focused(), "roving-three")
    await page.keyboard.press("End")
    eq(await focused(), "roving-four")
    await page.keyboard.press("ArrowRight")
    eq(await focused(), "roving-two", "loops past the end")
    await page.keyboard.press("Home")
    eq(await focused(), "roving-two")
    eq(await tabIndexes(), "0,-1,-1")
  })

  await test("an appended item joins the group instead of becoming a second tab stop", async () => {
    await reset()
    await click("roving-append")
    await page.waitForSelector('[data-pg="roving-item-5"]')
    eq(await tabIndexes(), "0,-1,-1,-1,-1", "appended item must not default to 0")
    await page.focus('[data-pg="roving-four"]')
    await page.keyboard.press("ArrowRight")
    eq(await focused(), "roving-item-5", "arrow navigation reaches it")
    eq(await tabIndexes(), "-1,-1,-1,-1,0", "the tab stop follows focus")
  })

  await test("disabling the item that holds the tab stop moves it to an operable one", async () => {
    await reset()
    await click("roving-disable-first")
    await page.waitForSelector('[data-pg="roving-one"][aria-disabled="true"]')
    eq(await tabIndexes(), "-1,0,-1,-1", "the tab stop must leave the disabled item")
    await click("roving-disable-first")
    await page.waitForFunction(
      () => !document.querySelector('[data-pg="roving-one"][aria-disabled="true"]')
    )
  })

  await test("RTL inverts the horizontal arrows", async () => {
    await page.focus('[data-pg="roving-rtl-two"]')
    await page.keyboard.press("ArrowRight")
    eq(await focused(), "roving-rtl-one")
    await page.keyboard.press("ArrowLeft")
    eq(await focused(), "roving-rtl-two")
  })
}
