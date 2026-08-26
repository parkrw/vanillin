export default async function run({ page, baseUrl, test, eq, near }) {
  await page.goto(`${baseUrl}/#drawer`)

  const drawer = page.locator(".drawer")

  const settle = (locator) =>
    locator.evaluate((el) => Promise.all(el.getAnimations().map((a) => a.finished)))

  await test("opens flush to the bottom edge by default", async () => {
    await page.locator('button:has-text("Open down")').click()
    await page.waitForSelector('.drawer[data-state="open"]')
    await settle(drawer)
    eq(await drawer.evaluate((el) => el.classList.contains("drawer--down")), true)
    eq(await drawer.evaluate((el) => el.matches(":modal")), true, "modal")
    eq(
      await drawer.evaluate((el) => getComputedStyle(el).position),
      "fixed",
      "position: fixed from :modal"
    )
    const [bottom, viewport] = await drawer.evaluate((el) => [
      el.getBoundingClientRect().bottom,
      window.innerHeight,
    ])
    near(bottom, viewport, 1, "flush bottom")
  })

  await test("shows the swipe handle by default", async () => {
    eq(await drawer.locator(".drawer-handle").count(), 1)
  })

  await test("title and description are wired via aria", async () => {
    const [title, description] = await drawer.evaluate((el) => [
      document.getElementById(el.getAttribute("aria-labelledby"))?.textContent,
      document.getElementById(el.getAttribute("aria-describedby"))?.textContent,
    ])
    eq(title, "Move goal", "labelledby")
    eq(description, "Set your daily activity goal.", "describedby")
  })

  await test("backdrop click closes", async () => {
    await page.mouse.click(5, 5)
    await page.waitForSelector(".drawer", { state: "detached" })
  })

  await test("Escape closes", async () => {
    await page.locator('button:has-text("Open down")').click()
    await page.waitForSelector('.drawer[data-state="open"]')
    await page.keyboard.press("Escape")
    await page.waitForSelector(".drawer", { state: "detached" })
  })

  await test("drag past a quarter of its size dismisses", async () => {
    await page.locator('button:has-text("Open down")').click()
    await page.waitForSelector('.drawer[data-state="open"]')
    await settle(drawer)
    const box = await drawer.boundingBox()
    const x = box.x + box.width / 2
    const y = box.y + 10
    await page.mouse.move(x, y)
    await page.mouse.down()
    await page.mouse.move(x, y + box.height * 0.5, { steps: 10 })
    await page.mouse.up()
    await page.waitForSelector(".drawer", { state: "detached" })
  })

  await test("a short drag sets data-swiping, then springs back", async () => {
    await page.locator('button:has-text("Open down")').click()
    await page.waitForSelector('.drawer[data-state="open"]')
    await settle(drawer)
    const box = await drawer.boundingBox()
    const x = box.x + box.width / 2
    const y = box.y + 10
    await page.mouse.move(x, y)
    await page.mouse.down()
    await page.mouse.move(x, y + box.height * 0.1, { steps: 5 })
    eq(await drawer.evaluate((el) => el.hasAttribute("data-swiping")), true, "swiping")
    // "sprang back" is `transform: none`, which is equally true of a drawer the
    // drag never moved — so record that it was actually displaced first.
    const midDrag = await drawer.evaluate((el) => getComputedStyle(el).transform)
    eq(midDrag !== "none", true, `precondition: the drag displaced the drawer (${midDrag})`)
    await page.mouse.up()
    eq(await drawer.getAttribute("data-state"), "open", "stays open")
    await settle(drawer)
    eq(await drawer.evaluate((el) => getComputedStyle(el).transform), "none", "sprang back")
    await page.keyboard.press("Escape")
    await page.waitForSelector(".drawer", { state: "detached" })
  })

  await test("a drag starting on a button does not dismiss", async () => {
    await page.locator('button:has-text("Open up")').click()
    await page.waitForSelector('.drawer--up[data-state="open"]')
    const up = page.locator(".drawer--up")
    await settle(up)
    const box = await up.boundingBox()
    const submit = await up.locator('button:has-text("Submit")').boundingBox()
    const x = submit.x + submit.width / 2
    const y = submit.y + submit.height / 2
    await page.mouse.move(x, y)
    await page.mouse.down()
    await page.mouse.move(x, y - box.height * 0.5, { steps: 10 })
    await page.mouse.up()
    eq(await up.getAttribute("data-state"), "open", "stays open")
    await page.keyboard.press("Escape")
    await page.waitForSelector(".drawer", { state: "detached" })
  })

  await test("direction variants anchor to their edges", async () => {
    for (const [direction, edge] of [
      ["up", "top"],
      ["left", "left"],
      ["right", "right"],
    ]) {
      await page.locator(`button:has-text("Open ${direction}")`).click()
      await page.waitForSelector(`.drawer--${direction}[data-state="open"]`)
      await settle(page.locator(`.drawer--${direction}`))
      const offset = await page.locator(`.drawer--${direction}`).evaluate((el, which) => {
        const rect = el.getBoundingClientRect()
        if (which === "top") return rect.top
        if (which === "left") return rect.left
        return window.innerWidth - rect.right
      }, edge)
      near(offset, 0, 1, `flush ${edge}`)
      await page.keyboard.press("Escape")
      await page.waitForSelector(".drawer", { state: "detached" })
    }
  })

  // ── Swipe velocity tests ──────────────────────────────────────────
  // The drawer is a modal <dialog> whose React handlers are unreachable
  // via dispatchEvent, so these tests drive real input. Slow drags use
  // Playwright's mouse API with explicit waits between steps. Flicks go
  // through CDP with declared timestamps: Playwright stamps each event with
  // wall-clock time, so a flick's px/ms would depend on how fast this machine
  // completes four CDP round-trips — 30px over 16–29ms dismisses, 30ms does
  // not, and an idle run already measures 21–27ms (docs/ISSUES.md G2). Chrome
  // carries Input.dispatchMouseEvent's `timestamp` through to event.timeStamp,
  // which is what use-swipe's velocity window reads.
  const cdp = await page.context().newCDPSession(page)

  // Press at (x, y), then one move per [dy, dtMs] entry — dy from the press
  // point, dtMs since the previous event — and release `liftMs` after the last.
  const timedDrag = async (x, y, moves, liftMs = 2) => {
    let ts = Date.now() / 1000
    let dy = 0
    const send = (type, buttons) =>
      cdp.send("Input.dispatchMouseEvent", {
        type,
        x,
        y: y + dy,
        button: "left",
        buttons,
        clickCount: type === "mouseMoved" ? 0 : 1,
        timestamp: ts,
      })
    await send("mousePressed", 1)
    for (const [nextDy, dtMs] of moves) {
      dy = nextDy
      ts += dtMs / 1000
      await send("mouseMoved", 1)
    }
    ts += liftMs / 1000
    await send("mouseReleased", 0)
  }

  await test("fast short swipe (velocity) dismisses drawer", async () => {
    await page.locator('button:has-text("Open down")').click()
    await page.waitForSelector('.drawer[data-state="open"]')
    await settle(drawer)
    const box = await drawer.boundingBox()
    const x = box.x + box.width / 2
    const y = box.y + 10

    // 50px downward in 20ms (2.5 px/ms, above the 1.0 threshold) but under
    // 25% of the drawer's height (~58px), so only velocity can dismiss.
    await timedDrag(x, y, [[17, 6], [33, 6], [50, 6]])

    await page.waitForSelector(".drawer", { state: "detached" })
  })

  await test("same distance dragged slowly keeps drawer open", async () => {
    await page.locator('button:has-text("Open down")').click()
    await page.waitForSelector('.drawer[data-state="open"]')
    await settle(drawer)
    const box = await drawer.boundingBox()
    const x = box.x + box.width / 2
    const y = box.y + 10

    // 50px downward over ~300ms (~0.17 px/ms, well below threshold)
    await page.mouse.move(x, y)
    await page.mouse.down()
    for (let i = 1; i <= 10; i++) {
      await page.mouse.move(x, y + i * 5, { steps: 1 })
      await page.waitForTimeout(30)
    }
    await page.mouse.up()

    await page.waitForTimeout(200)
    eq(await drawer.getAttribute("data-state"), "open", "stays open")
    await page.keyboard.press("Escape")
    await page.waitForSelector(".drawer", { state: "detached" })
  })

  await test("fast swipe in wrong direction keeps drawer open", async () => {
    await page.locator('button:has-text("Open down")').click()
    await page.waitForSelector('.drawer[data-state="open"]')
    await settle(drawer)
    const box = await drawer.boundingBox()
    const x = box.x + box.width / 2
    const y = box.y + 40

    // 50px upward (wrong direction for down drawer) — fast
    await page.mouse.move(x, y)
    await page.mouse.down()
    await page.mouse.move(x, y - 50, { steps: 3 })
    await page.mouse.up()

    await page.waitForTimeout(200)
    eq(await drawer.getAttribute("data-state"), "open", "stays open")
    await page.keyboard.press("Escape")
    await page.waitForSelector(".drawer", { state: "detached" })
  })

  await test("long slow drag ending in flick dismisses drawer", async () => {
    await page.locator('button:has-text("Open down")').click()
    await page.waitForSelector('.drawer[data-state="open"]')
    await settle(drawer)
    const box = await drawer.boundingBox()
    const x = box.x + box.width / 2
    const y = box.y + 10

    // Slow phase: 10px over 200ms, then a 300ms pause so those samples age
    // out of the 100ms velocity window. Flick: 30px more, lifted 20ms later
    // (1.5 px/ms), the gesture's 50px total under 25% of the drawer's height (~58px).
    await timedDrag(x, y, [[5, 100], [10, 100], [20, 300], [30, 6], [40, 6], [50, 6]])

    await page.waitForSelector(".drawer", { state: "detached" })
  })

  await test("bottom drawer is viewport-anchored on a tall page", async () => {
    await page.evaluate(() => {
      const spacer = document.createElement("div")
      spacer.id = "t80-spacer"
      spacer.style.height = `${window.innerHeight * 2}px`
      document.body.appendChild(spacer)
    })
    const isTall = await page.evaluate(
      () => document.body.scrollHeight > window.innerHeight * 1.5
    )
    await page.evaluate(() => window.scrollTo(0, 0))
    await page.locator('button:has-text("Open down")').click()
    await page.waitForSelector('.drawer[data-state="open"]')
    await settle(drawer)
    const isModal = await drawer.evaluate((el) => el.matches(":modal"))
    const [bottom, viewport] = await drawer.evaluate((el) => [
      el.getBoundingClientRect().bottom,
      window.innerHeight,
    ])
    // Clean up before asserting so later tests start clean on failure
    await page.keyboard.press("Escape")
    await page.waitForSelector(".drawer", { state: "detached" })
    await page.evaluate(() => document.getElementById("t80-spacer")?.remove())
    eq(isTall, true, "precondition: page is taller than viewport")
    eq(isModal, true, "modal")
    near(bottom, viewport, 1, "flush bottom on tall page")
  })

  await test("held still before lift does not dismiss drawer", async () => {
    await page.locator('button:has-text("Open down")').click()
    await page.waitForSelector('.drawer[data-state="open"]')
    await settle(drawer)
    const box = await drawer.boundingBox()
    const x = box.x + box.width / 2
    const y = box.y + 10

    // Move 20px quickly, then hold still for 200ms (> 100ms window)
    await page.mouse.move(x, y)
    await page.mouse.down()
    await page.mouse.move(x, y + 20, { steps: 2 })
    await page.waitForTimeout(200)
    await page.mouse.up()

    await page.waitForTimeout(200)
    eq(await drawer.getAttribute("data-state"), "open", "stays open")
    await page.keyboard.press("Escape")
    await page.waitForSelector(".drawer", { state: "detached" })
  })

  await cdp.detach()
}
