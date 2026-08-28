// First tests for lib/use-focus-trap.js. It has no ui/ consumers — modals ride
// native <dialog> containment — but it ships through registry.json, so the
// primitives page fixture is the only place its contract is exercised.
//
// The hook's own focusable list is only observable at the wrap destinations —
// the currently focused element is always admitted, right or wrong — so the
// fixture makes each destination an interesting case: a viewport-fixed button
// is the first focusable child, a contenteditable region the last, and a
// tabindex="-1" link plus a visibility: hidden button sit after both, where a
// list that wrongly admits them would pick one as the backward destination.
export default async function run({ page, baseUrl, test, eq }) {
  await page.goto(`${baseUrl}/#primitives`)
  await page.waitForSelector('[data-pg="trap-toggle"]', { timeout: 5000 })

  const focused = () => page.evaluate(() => document.activeElement?.dataset.pg ?? document.activeElement?.tagName)
  const onBody = () => page.evaluate(() => document.activeElement === document.body)
  const insideTrap = () =>
    page.evaluate(() => document.querySelector('[data-pg="trap"]')?.contains(document.activeElement) ?? false)
  // Scripted clicks, because a real pointer click would move focus first and
  // hide the very escape these tests are about.
  const click = (pg) => page.evaluate((sel) => document.querySelector(sel).click(), `[data-pg="${pg}"]`)

  const activate = async () => {
    if (!(await page.$('[data-pg="trap"]'))) await click("trap-toggle")
    await page.waitForSelector('[data-pg="trap"]')
    if (!(await page.$('[data-pg="trap-first"]'))) await click("trap-restore-first")
    await page.waitForSelector('[data-pg="trap-first"]')
    if (await page.$('[data-pg="trap-portalled"]')) await click("trap-toggle-portalled")
    await page.waitForFunction(() => !document.querySelector('[data-pg="trap-portalled"]'))
  }
  const release = async () => {
    if (await page.$('[data-pg="trap"]')) await click("trap-toggle")
    await page.waitForFunction(() => !document.querySelector('[data-pg="trap"]'))
  }
  const dropFirstField = async () => {
    await click("trap-drop-first")
    await page.waitForFunction(() => !document.querySelector('[data-pg="trap-first"]'))
  }

  await test("activation moves focus to the first focusable child", async () => {
    await release()
    await activate()
    eq(await focused(), "trap-fixed")
  })

  await test("initialFocus overrides the first focusable child", async () => {
    await activate()
    await click("trap-prefer-second")
    await page.waitForFunction(() => document.activeElement?.dataset.pg === "trap-second")
    eq(await focused(), "trap-second")
    await click("trap-prefer-second")
    await page.waitForFunction(() => document.activeElement?.dataset.pg === "trap-fixed")
    eq(await focused(), "trap-fixed", "clearing it restores the default")
  })

  await test("Tab forward wraps from the contenteditable stop to the fixed one", async () => {
    await activate()
    await page.focus('[data-pg="trap-fixed"]')
    const order = []
    for (let step = 0; step < 5; step++) {
      order.push(await focused())
      await page.keyboard.press("Tab")
    }
    eq(order.join(","), "trap-fixed,trap-first,trap-second,trap-editable,trap-fixed")
  })

  await test("Shift+Tab wraps backwards past the untabbable link and hidden button", async () => {
    await activate()
    await page.focus('[data-pg="trap-fixed"]')
    await page.keyboard.press("Shift+Tab")
    eq(await focused(), "trap-editable")
  })

  await test("Tab pulls focus back in after the focused element is deleted", async () => {
    await activate()
    await page.focus('[data-pg="trap-first"]')
    await dropFirstField()
    eq(await onBody(), true, "deleting the focused element drops focus on body")
    await page.keyboard.press("Tab")
    eq(await focused(), "trap-fixed", "forward Tab lands on the first stop")

    // Chrome keeps a sequential-focus starting point where the deleted element
    // was, so a forward Tab can land inside even with no trap at all — it just
    // lands on the wrong element. Backwards from that point leaves the
    // container outright, which is the blunter check.
    await activate()
    await page.focus('[data-pg="trap-first"]')
    await dropFirstField()
    await page.keyboard.press("Shift+Tab")
    eq(await focused(), "trap-editable", "backward Tab lands on the last stop")
  })

  await test("Tab from a plain blur also lands inside", async () => {
    await activate()
    await page.focus('[data-pg="trap-second"]')
    await page.evaluate(() => document.activeElement.blur())
    eq(await onBody(), true, "focus on body")
    await page.keyboard.press("Shift+Tab")
    eq(await focused(), "trap-editable")
  })

  await test("a portalled child keeps its own Tab handling", async () => {
    await activate()
    await click("trap-toggle-portalled")
    await page.waitForSelector('[data-pg="trap-portalled"]')
    await page.focus('[data-pg="trap-portalled"]')
    eq(await insideTrap(), false, "the portalled button renders outside the container")
    await page.keyboard.press("Tab")
    eq(await insideTrap(), false, "focus must not be yanked back into the trap")
    await click("trap-toggle-portalled")
    await page.waitForFunction(() => !document.querySelector('[data-pg="trap-portalled"]'))
  })

  await test("a container with no focusable children holds focus itself", async () => {
    await release()
    await click("empty-trap-toggle")
    await page.waitForSelector('[data-pg="empty-trap"]')
    eq(await focused(), "empty-trap", "the container takes focus on activation")
    await page.keyboard.press("Tab")
    eq(await focused(), "empty-trap", "Tab is swallowed rather than allowed to leave")
    await page.evaluate(() => document.activeElement.blur())
    await page.keyboard.press("Tab")
    eq(await focused(), "empty-trap", "and focus is pulled back from body")
    await click("empty-trap-toggle")
    await page.waitForFunction(() => !document.querySelector('[data-pg="empty-trap"]'))
  })

  await test("releasing the trap frees Tab again", async () => {
    await activate()
    await release()
    await page.focus('[data-pg="trap-toggle"]')
    await page.keyboard.press("Tab")
    eq(await focused(), "trap-drop-first")
  })
}
