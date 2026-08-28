export default async function run({ page, baseUrl, test, eq }) {
  await page.goto(`${baseUrl}/#toast`)

  // Park the mouse away — pointer position carries over between test files
  await page.mouse.move(0, 0)

  const allToasts = () => page.locator(".toast")
  const firstToast = () => page.locator(".toast").first()

  const settle = (locator) =>
    locator.evaluate((el) => Promise.all(el.getAnimations().map((a) => a.finished)))

  /** Wait until a condition is met (polling, not fixed sleep). */
  const waitFor = async (fn, timeout = 5000) => {
    const deadline = Date.now() + timeout
    while (Date.now() < deadline) {
      try {
        const result = await fn()
        if (result) return result
      } catch {}
      await page.waitForTimeout(50)
    }
    throw new Error("waitFor timed out")
  }

  /**
   * Reset the shared page: mouse parked, window focused, queue empty. Called at
   * both ends of a case, because all suites share one page and a case that
   * throws never reaches its own cleanup.
   */
  const clearAll = async () => {
    await page.mouse.move(0, 0)
    await page.evaluate(() => {
      window.dispatchEvent(new Event("focus"))
      window.__toast?.dismiss()
    })
    try {
      await page.waitForFunction(
        () => document.querySelectorAll(".toast").length === 0,
        { timeout: 4000 }
      )
    } catch {}
    await page.waitForTimeout(100)
  }

  // -- Tests --

  await test("live regions exist before any toast fires", async () => {
    // A live region has to predate its content or most assistive tech never
    // announces the mutation. Reload so the module-level queue is empty, then
    // assert the regions are mounted WITH no toast in the DOM — the
    // counter-precondition that fails when the whole section is born
    // alongside its first toast.
    await page.reload()
    await page.locator(".toaster").waitFor({ state: "attached", timeout: 5000 })
    eq(await allToasts().count(), 0, "no toast has fired yet")
    eq(await page.locator('.toaster-live[aria-live="polite"]').count(), 1, "polite region present while empty")
    eq(await page.locator('.toaster-live[aria-live="assertive"]').count(), 1, "assertive region present while empty")
    eq(await page.locator('.toaster-live[aria-live="polite"]').textContent(), "", "polite region carries no text")
  })

  await test("toast renders with role and aria attributes", async () => {
    await page.locator('button:has-text("Default")').click()
    await waitFor(async () => (await allToasts().count()) > 0)
    const t = firstToast()
    eq(await t.getAttribute("role"), "status", "role=status")
    eq(await t.getAttribute("aria-live"), "off", "aria-live=off — the region announces, not the toast")
    eq(await t.getAttribute("aria-atomic"), "true", "aria-atomic")
    eq((await t.locator(".toast-title").textContent()).includes("Event has been created"), true, "title")
    await clearAll()
  })

  await test("a fired toast's text lands in the polite live region", async () => {
    await clearAll()
    const region = page.locator('.toaster-live[aria-live="polite"]')
    await page.locator('button:has-text("Default")').click()
    await waitFor(async () => (await allToasts().count()) > 0)
    await waitFor(async () => (await region.textContent()).includes("Event has been created"))
    eq((await region.textContent()).includes("Event has been created"), true, "title announced")
    eq(await page.locator('.toaster-live[aria-live="assertive"]').textContent(), "", "assertive region untouched")
    await clearAll()
    eq(await region.textContent(), "", "region emptied when the toast goes")
  })

  await test("error announces assertively as role=alert, warning stays polite", async () => {
    await clearAll()
    const politeRegion = page.locator('.toaster-live[aria-live="polite"]')
    const assertiveRegion = page.locator('.toaster-live[aria-live="assertive"]')

    await page.locator('button:has-text("Error")').click()
    const errorToast = page.locator('.toast[data-type="error"]')
    await waitFor(async () => (await errorToast.count()) > 0)
    eq(await errorToast.getAttribute("role"), "alert", "error toast is role=alert")
    eq(await errorToast.getAttribute("aria-live"), "off", "error toast does not announce itself")
    await waitFor(async () => (await assertiveRegion.textContent()).includes("Something went wrong"))
    eq((await assertiveRegion.textContent()).includes("Something went wrong"), true, "error text is assertive")
    // Counter-precondition: an error present in BOTH regions would announce
    // twice, which is indistinguishable from "assertive" by the effect alone.
    eq(
      (await politeRegion.textContent()).includes("Something went wrong"),
      false,
      "error text is not also polite"
    )

    await page.locator('button:has-text("Warning")').click()
    const warnToast = page.locator('.toast[data-type="warning"]')
    await waitFor(async () => (await warnToast.count()) > 0)
    eq(await warnToast.getAttribute("role"), "status", "warning stays role=status")
    await waitFor(async () => (await politeRegion.textContent()).includes("Approaching limit"))
    eq((await politeRegion.textContent()).includes("Approaching limit"), true, "warning text is polite")
    eq(
      (await assertiveRegion.textContent()).includes("Approaching limit"),
      false,
      "warning does not interrupt"
    )
    await clearAll()
  })

  await test("a rejecting promise moves its announcement from polite to assertive", async () => {
    await clearAll()
    const politeRegion = page.locator('.toaster-live[aria-live="polite"]')
    const assertiveRegion = page.locator('.toaster-live[aria-live="assertive"]')

    await page.locator('[data-pg="promise-reject"]').click()
    await waitFor(async () => (await politeRegion.textContent()).includes("Saving changes..."))
    await waitFor(async () => (await firstToast().getAttribute("data-type")) === "error", 5000)

    await waitFor(async () => (await assertiveRegion.textContent()).includes("Could not save"))
    eq((await assertiveRegion.textContent()).includes("Could not save"), true, "error text arrived assertive")
    // Counter-precondition: arriving is only half of it. An entry left behind in
    // the polite region would announce the failure twice, once at each urgency.
    eq((await politeRegion.textContent()).includes("Could not save"), false, "and is not also polite")
    eq((await politeRegion.textContent()).includes("Saving changes..."), false, "the loading text left")
    await clearAll()
  })

  await test("auto-dismiss after duration", async () => {
    await page.locator('[data-pg="short"]').click()
    await waitFor(async () => (await allToasts().count()) > 0)
    eq(await firstToast().locator(".toast-title").textContent(), "Quick toast", "toast appeared")
    // Wait for auto-dismiss (800ms + exit animation time)
    await waitFor(async () => (await allToasts().count()) === 0, 5000)
    eq(await allToasts().count(), 0, "toast dismissed after duration")
  })

  await test("hover pauses the auto-dismiss timer", async () => {
    // Fire a 2s toast, hover immediately (banking most of the 2s),
    // stay hovered well past the original lifetime, unhover, and
    // verify: still alive right after unhover, then dismissed once
    // the banked remainder elapses.
    await page.mouse.move(0, 0)
    await page.locator('[data-pg="medium"]').click()
    await waitFor(async () => (await allToasts().count()) > 0)
    const t = firstToast()
    await settle(t)

    // Hover immediately — banks nearly all 2s
    const box = await t.boundingBox()
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)

    // Stay hovered for 3s — well past the original 2s lifetime
    await page.waitForTimeout(3000)
    eq(await allToasts().count() > 0, true, "still visible while hovered")

    // Unhover — the banked remainder resumes
    await page.mouse.move(0, 0)

    // Right after unhover the toast must still be present (banked time)
    await page.waitForTimeout(100)
    eq(await allToasts().count() > 0, true, "still alive right after unhover")

    // Then it should dismiss after the banked remainder elapses
    await waitFor(async () => (await allToasts().count()) === 0, 8000)
    eq(await allToasts().count(), 0, "dismissed once banked remainder elapsed")
  })

  await test("window blur pauses the auto-dismiss timer", async () => {
    await clearAll()
    await page.mouse.move(0, 0)
    await page.locator('[data-pg="medium"]').click()
    await waitFor(async () => (await allToasts().count()) > 0)

    await page.evaluate(() => window.dispatchEvent(new Event("blur")))
    // Well past the toast's own 2s lifetime
    await page.waitForTimeout(2600)
    eq(await allToasts().count() > 0, true, "still alive while the window is blurred")

    await page.evaluate(() => window.dispatchEvent(new Event("focus")))
    await waitFor(async () => (await allToasts().count()) === 0, 5000)
    eq(await allToasts().count(), 0, "dismissed once focus came back")
  })

  await test("unhovering while the window is blurred does not restart the timer", async () => {
    await clearAll()
    // hovered and blurred are separate flags for exactly this: with one shared
    // flag, the unhover below clears the pause and the toast dies on schedule.
    await page.mouse.move(0, 0)
    await page.locator('[data-pg="medium"]').click()
    await waitFor(async () => (await allToasts().count()) > 0)
    const t = firstToast()
    await settle(t)

    const box = await t.boundingBox()
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
    await page.evaluate(() => window.dispatchEvent(new Event("blur")))
    await page.mouse.move(0, 0)

    // Well past the toast's own 2s lifetime, unhovered but still blurred
    await page.waitForTimeout(2600)
    eq(await allToasts().count() > 0, true, "blur outlives the hover")

    await page.evaluate(() => window.dispatchEvent(new Event("focus")))
    await waitFor(async () => (await allToasts().count()) === 0, 5000)
    eq(await allToasts().count(), 0, "dismissed once focus came back")
  })

  await test("duration Infinity never auto-dismisses", async () => {
    await clearAll()
    await page.mouse.move(0, 0)
    await page.locator('button:has-text("Loading")').click()
    await waitFor(async () => (await allToasts().count()) > 0)
    eq(await firstToast().getAttribute("data-type"), "loading", "loading toast fired")
    // Past the Toaster's 4s default, which a broken Infinity check would use
    await page.waitForTimeout(4600)
    eq(await allToasts().count() > 0, true, "still present past the default duration")
    await clearAll()
  })

  await test("queue cap drops the oldest beyond visibleToasts * 2", async () => {
    await clearAll()
    await page.mouse.move(0, 0)
    // Fires Retry 1..11 in one commit; visibleToasts is 3, so the cap is 6.
    await page.locator('[data-pg="flood"]').click()
    await waitFor(async () => (await allToasts().count()) === 6)
    eq(await allToasts().count(), 6, "six DOM nodes, not eleven")

    const titles = await page.evaluate(() =>
      Array.from(document.querySelectorAll(".toast-title")).map((el) => el.textContent)
    )
    eq(titles.includes("Retry 11"), true, "the newest survives")
    eq(titles.includes("Retry 6"), true, "the sixth-newest survives")
    // Counter-precondition: a count of six is also true of drop-newest and of
    // a cap that trims the wrong end, so name which titles must be gone.
    eq(titles.includes("Retry 5"), false, "the seventh-newest was dropped")
    eq(titles.includes("Retry 1"), false, "the oldest was dropped")
    await clearAll()
  })

  await test("a custom-JSX toast announces from its own node", async () => {
    await clearAll()
    // No string title, so the region has nothing to carry — the fallback path
    // has to keep the toast audible instead of leaving it silent.
    await page.mouse.move(0, 0)
    await page.locator('[data-pg="custom"]').click()
    await waitFor(async () => (await allToasts().count()) > 0)
    const t = firstToast()
    eq(await t.locator('[data-pg="custom-body"]').count(), 1, "custom body rendered")
    eq(await t.getAttribute("aria-live"), "polite", "the node announces itself")
    eq(await page.locator('.toaster-live[aria-live="polite"]').textContent(), "", "region carries no JSX")
    await clearAll()
  })

  await test("a JSX title beside a string description announces from the node", async () => {
    await clearAll()
    await page.locator('[data-pg="jsx-title"]').click()
    await waitFor(async () => (await allToasts().count()) > 0)
    const t = firstToast()
    eq(await t.locator('[data-pg="jsx-title-body"]').count(), 1, "JSX title rendered")
    eq(await t.getAttribute("aria-live"), "polite", "the node announces the whole message")
    // Counter-precondition: the region must not take the description on its
    // own, or the reader hears "Card declined" and never the title.
    eq(
      (await page.locator('.toaster-live[aria-live="polite"]').textContent()).includes("Card declined"),
      false,
      "region carries no half-message"
    )
    await clearAll()
  })

  await test("shrinking visibleToasts trims the queue at once", async () => {
    await clearAll()
    await page.mouse.move(0, 0)
    await page.locator('[data-pg="flood"]').click()
    await waitFor(async () => (await allToasts().count()) === 6)

    // visibleToasts 1 caps the queue at 2, so four nodes have to go now — not
    // on the next toast.
    await page.locator('[data-pg="visible-1"]').click()
    try {
      await waitFor(async () => (await allToasts().count()) === 2)
      eq(await allToasts().count(), 2, "trimmed to the new cap")

      const titles = await page.evaluate(() =>
        Array.from(document.querySelectorAll(".toast-title")).map((el) => el.textContent)
      )
      eq(titles.includes("Retry 11"), true, "the newest was kept")
      eq(titles.includes("Retry 10"), true, "the second-newest was kept")
      // Counter-precondition: a count of two is equally true of trimming the
      // wrong end, so name a title that must be gone.
      eq(titles.includes("Retry 9"), false, "the third-newest was trimmed")
    } finally {
      // All suites share one page, so a failure here must not leave
      // visibleToasts at 1 and cascade into every later test.
      await page.locator('[data-pg="visible-3"]').click()
      await clearAll()
    }
  })

  await test("eviction spares a toast that is waiting on something", async () => {
    await clearAll()
    await page.mouse.move(0, 0)
    // The loading toast is duration Infinity and, being first, is the oldest —
    // so plain drop-oldest would evict the one thing that must outlive a burst.
    await page.locator('button:has-text("Loading")').click()
    await waitFor(async () => (await allToasts().count()) === 1)
    await page.locator('[data-pg="flood"]').click()
    await waitFor(async () => (await allToasts().count()) === 6)

    const titles = await page.evaluate(() =>
      Array.from(document.querySelectorAll(".toast-title")).map((el) => el.textContent)
    )
    eq(titles.includes("Uploading..."), true, "the waiting toast survived the burst")
    eq(titles.includes("Retry 11"), true, "the newest still wins a slot")
    // Counter-precondition: the burst has to have actually evicted something,
    // or "survived" would just mean the cap never engaged.
    eq(titles.includes("Retry 6"), false, "a self-dismissing toast was evicted in its place")
    await clearAll()
  })

  await test("a second Toaster widens the cap and takes it back on unmount", async () => {
    await clearAll()
    const mainToasts = () => page.locator('.toaster[data-pg="toaster"] .toast')
    await page.mouse.move(0, 0)
    await page.locator('[data-pg="second-toaster"]').click()
    try {
      await waitFor(async () => (await page.locator('.toaster[data-pg="toaster-second"]').count()) === 1)
      // Both Toasters mount their regions — they have to exist before content
      // arrives — but only the owner fills them, so nothing is read twice.
      const politeRegions = page.locator('.toaster-live[aria-live="polite"]')
      eq(await politeRegions.count(), 2, "each Toaster mounted its own regions")
      await page.locator('button:has-text("Default")').click()
      await waitFor(async () => (await politeRegions.first().textContent()).includes("Event has been created"))
      const populated = await page.evaluate(() =>
        Array.from(document.querySelectorAll('.toaster-live[aria-live="polite"]'))
          .filter((el) => el.textContent !== "").length
      )
      eq(populated, 1, "exactly one region carries the text")

      // The second Toaster asks for visibleToasts 10, so the cap is 20.
      await page.locator('[data-pg="flood"]').click()
      await waitFor(async () => (await mainToasts().count()) === 12)
      eq(await mainToasts().count(), 12, "the widest live cap wins")
    } finally {
      // Toasts set pointer-events: auto, so one sitting over the button would
      // swallow a real click and leave the second Toaster mounted for every
      // later case. Dispatch on the element instead — and keep the queue, which
      // is what the trim below has to act on.
      await page.mouse.move(0, 0)
      await page.locator('[data-pg="second-toaster"]').evaluate((el) => el.click())
    }

    // Unmounting has to hand the cap back and trim now, not on the next toast.
    await waitFor(async () => (await mainToasts().count()) === 6)
    eq(await mainToasts().count(), 6, "the queue tightened to the surviving cap")
    const titles = await page.evaluate(() =>
      Array.from(document.querySelectorAll(".toast-title")).map((el) => el.textContent)
    )
    eq(titles.includes("Retry 11"), true, "the newest was kept")
    eq(titles.includes("Retry 5"), false, "trimmed from the oldest end")
    await clearAll()
  })

  await test("expanding the stack announces the toasts it reveals", async () => {
    await clearAll()
    const region = page.locator('.toaster-live[aria-live="polite"]')
    await page.locator('[data-pg="flood"]').click()
    await waitFor(async () => (await allToasts().count()) === 6)
    await page.mouse.move(0, 0)
    await waitFor(async () => !(await region.textContent()).includes("Retry 6"))
    eq((await region.textContent()).includes("Retry 6"), false, "collapsed toasts stay unannounced")

    const front = firstToast()
    const box = await front.boundingBox()
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
    await waitFor(async () => (await page.locator(".toast[data-limited]").count()) === 0)
    // Counter-precondition: visible and silent is the regression. Every toast
    // the expansion puts on screen has to reach the region.
    await waitFor(async () => (await region.textContent()).includes("Retry 6"))
    eq((await region.textContent()).includes("Retry 6"), true, "revealed toasts are announced")
    await page.mouse.move(0, 0)
    await clearAll()
  })

  await test("a negative visibleToasts cannot make a toast invisible and audible", async () => {
    await clearAll()
    await page.locator('[data-pg="visible-negative"]').click()
    try {
      await page.locator('[data-pg="flood"]').click()
      await waitFor(async () => (await allToasts().count()) === 6)
      await page.mouse.move(0, 0)
      // -1 is not a count, so it falls back to the default 3 rather than being
      // used raw. Used raw, every toast is collapsed while all but the last is
      // still announced — invisible and audible at the same time.
      await waitFor(async () => (await page.locator(".toast[data-limited]").count()) === 3)
      eq(await page.locator(".toast[data-limited]").count(), 3, "three collapsed, three shown")
      const announced = await page.locator('.toaster-live[aria-live="polite"]').textContent()
      eq(announced.includes("Retry 11"), true, "the shown toasts are announced")
      eq(announced.includes("Retry 6"), false, "the collapsed ones are not")
    } finally {
      await page.locator('[data-pg="visible-3"]').click()
      await clearAll()
    }
  })

  await test("visibleToasts below 1 falls back to the default cap", async () => {
    await clearAll()
    await page.mouse.move(0, 0)
    await page.locator('[data-pg="visible-0"]').click()
    try {
      await page.locator('[data-pg="flood"]').click()
      // presented 0 floors the cap at 1 * 2, so toasts survive but none show.
      await waitFor(async () => (await allToasts().count()) === 2)
      eq(await allToasts().count(), 2, "the cap did not fall to zero")
      // The buttons can sit under the fixed Toaster, and a hover would expand
      // the stack and drop data-limited, so park the pointer first.
      await page.mouse.move(0, 0)
      await waitFor(async () => (await page.locator(".toast[data-limited]").count()) === 2)
      // Counter-precondition: 0 must still hide them. Existence and visibility
      // are separate concerns, and only the cap gets the floor.
      eq(await page.locator(".toast[data-limited]").count(), 2, "both collapsed behind the stack")
      // Nothing is on screen, so nothing should be read out either.
      eq(await page.locator('.toaster-live[aria-live="polite"]').textContent(), "", "none announced")
    } finally {
      await page.locator('[data-pg="visible-3"]').click()
      await clearAll()
    }
  })

  await test("a duration past setTimeout's 32-bit limit holds instead of firing", async () => {
    await clearAll()
    await page.mouse.move(0, 0)
    await page.locator('[data-pg="sticky-overflow"]').click()
    await waitFor(async () => (await allToasts().count()) > 0)
    // A wrapped delay fires on the next tick, so a second is a wide margin.
    await page.waitForTimeout(1000)
    eq(await allToasts().count() > 0, true, "not dismissed on the next tick")
    await clearAll()
  })

  await test("a toast removed under a still pointer does not leave the queue paused", async () => {
    await clearAll()
    // A toast with a description is taller than a title-only one, so a pointer
    // near its top edge ends up above the replacement rather than over it.
    await page.locator('button:has-text("Success")').click()
    await waitFor(async () => (await allToasts().count()) > 0)
    const tall = firstToast()
    await settle(tall)
    const box = await tall.boundingBox()
    await page.mouse.move(box.x + box.width / 2, box.y + 6)

    await page.evaluate(() => window.__toast.dismiss())
    await waitFor(async () => (await allToasts().count()) === 0, 5000)

    // The pointer has not moved, so no mouseleave fired for the removed node.
    await page.locator('[data-pg="short"]').click()
    await waitFor(async () => (await allToasts().count()) > 0)
    await waitFor(async () => (await allToasts().count()) === 0, 5000)
    eq(await allToasts().count(), 0, "the next toast still dismissed itself")
    await page.mouse.move(0, 0)
    await clearAll()
  })

  await test("queue limit: at most visibleToasts visible, rest hidden", async () => {
    // Fire 5 toasts rapidly
    for (let i = 0; i < 5; i++) {
      await page.locator('button:has-text("Default")').click()
      await page.waitForTimeout(30)
    }
    await waitFor(async () => (await allToasts().count()) >= 5)

    const visibleCount = await page.evaluate(() => {
      let visible = 0
      for (const t of document.querySelectorAll(".toast")) {
        if (!t.hasAttribute("data-limited")) visible++
      }
      return visible
    })
    eq(visibleCount <= 3, true, `at most 3 visible (got ${visibleCount})`)

    const limitedCount = await page.evaluate(() =>
      document.querySelectorAll(".toast[data-limited]").length
    )
    eq(limitedCount >= 2, true, `at least 2 limited (got ${limitedCount})`)

    await clearAll()
  })

  await test("action button fires callback and dismisses", async () => {
    await page.locator('button:has-text("With action")').first().click()
    await waitFor(async () => (await allToasts().count()) > 0)
    const t = firstToast()
    await settle(t)

    const actionBtn = t.locator(".toast-action")
    eq(await actionBtn.count(), 1, "action button rendered")
    eq(await actionBtn.textContent(), "Undo", "action label")
    await actionBtn.click()

    // The callback fires toast.info("Undone!")
    await waitFor(async () => {
      const titles = await page.evaluate(() =>
        Array.from(document.querySelectorAll(".toast-title")).map((el) => el.textContent)
      )
      return titles.includes("Undone!")
    })
    eq(true, true, "callback fired")

    await clearAll()
  })

  await test("swipe past 25% dismisses the toast", async () => {
    await page.mouse.move(0, 0)
    await page.locator('button:has-text("Default")').click()
    await waitFor(async () => (await allToasts().count()) > 0)
    const t = firstToast()
    await settle(t)

    const box = await t.boundingBox()
    const startX = box.x + 20
    const y = box.y + box.height / 2

    await page.mouse.move(startX, y)
    await page.mouse.down()
    // Swipe right past 25% of width
    await page.mouse.move(startX + box.width * 0.5, y, { steps: 10 })
    await page.mouse.up()

    await waitFor(async () => (await allToasts().count()) === 0, 5000)
    eq(await allToasts().count(), 0, "dismissed after swipe")
  })

  await test("swipe under 25% snaps back", async () => {
    await page.mouse.move(0, 0)
    await page.locator('button:has-text("Default")').click()
    await waitFor(async () => (await allToasts().count()) > 0)
    const t = firstToast()
    await settle(t)

    const box = await t.boundingBox()
    const startX = box.x + 20
    const y = box.y + box.height / 2

    await page.mouse.move(startX, y)
    await page.mouse.down()
    // Swipe right only ~10% of width
    await page.mouse.move(startX + box.width * 0.1, y, { steps: 5 })
    eq(await t.evaluate((el) => el.hasAttribute("data-swiping")), true, "swiping attr set")
    await page.mouse.up()

    eq(await allToasts().count() > 0, true, "still visible")
    await settle(t)
    eq(
      await t.evaluate((el) => el.style.transform === "" || el.style.transform === "none"),
      true,
      "transform cleared"
    )

    await clearAll()
  })

  await test("close button dismisses the toast", async () => {
    await page.mouse.move(0, 0)
    await page.locator('button:has-text("Default")').click()
    await waitFor(async () => (await allToasts().count()) > 0)
    const t = firstToast()
    await settle(t)

    // Hover to reveal close button
    const box = await t.boundingBox()
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
    await page.waitForTimeout(100)

    const closeBtn = t.locator(".toast-close")
    eq(await closeBtn.count(), 1, "close button exists")
    await closeBtn.click()

    await waitFor(async () => (await allToasts().count()) === 0, 5000)
    eq(await allToasts().count(), 0, "dismissed via close button")
  })

  await test("success/error/warning/info render with correct type", async () => {
    for (const type of ["Success", "Error", "Warning", "Info"]) {
      await page.locator(`button:has-text("${type}")`).click()
      await page.waitForTimeout(50)
    }
    await waitFor(async () => (await allToasts().count()) >= 4)

    const types = await page.evaluate(() =>
      Array.from(document.querySelectorAll(".toast")).map((el) => el.getAttribute("data-type"))
    )
    eq(types.includes("success"), true, "success type")
    eq(types.includes("error"), true, "error type")
    eq(types.includes("warning"), true, "warning type")
    eq(types.includes("info"), true, "info type")

    await clearAll()
  })

  await test("promise toast transitions from loading to success and stays visible", async () => {
    await page.locator('button:has-text("Save with promise")').click()
    await waitFor(async () => (await allToasts().count()) > 0)

    eq(await firstToast().getAttribute("data-type"), "loading", "starts as loading")

    // Promise resolves after 2s; wait for the type flip
    await waitFor(async () => {
      const type = await firstToast().getAttribute("data-type")
      return type === "success"
    }, 5000)
    eq(await firstToast().getAttribute("data-type"), "success", "resolved to success")

    // The resolved toast must stay visible for its full duration (4s
    // default), not flash and dismiss.  Assert still present after a
    // comfortable margin past the transition.
    await page.waitForTimeout(800)
    eq(await allToasts().count() > 0, true, "still visible 800ms after resolving")
    eq(await firstToast().getAttribute("data-type"), "success", "still success type")

    // Eventually auto-dismisses
    await waitFor(async () => (await allToasts().count()) === 0, 8000)
    eq(await allToasts().count(), 0, "dismissed after full duration")
  })

  // ── Swipe velocity tests ──────────────────────────────────────────

  /**
   * Dispatch a pointer sequence on a toast with explicit timeStamp
   * overrides so velocity is deterministic.  Each entry in `moves` is
   * { dx, dt } — delta-X from the previous position, delta-time in ms.
   */
  const pointerSequence = async (el, startX, startY, moves) => {
    await page.evaluate(
      ({ startX, startY, moves }) => {
        const toast = document.querySelector(".toast")
        if (!toast) throw new Error("no toast")

        const fire = (type, x, y, time) => {
          const e = new PointerEvent(type, {
            clientX: x,
            clientY: y,
            pointerId: 1,
            pointerType: "mouse",
            bubbles: true,
            cancelable: true,
          })
          Object.defineProperty(e, "timeStamp", { value: time })
          toast.dispatchEvent(e)
        }

        // Prevent setPointerCapture from throwing on synthetic pointerId
        const orig = Element.prototype.setPointerCapture
        Element.prototype.setPointerCapture = function (id) {
          try { orig.call(this, id) } catch {}
        }

        let x = startX
        let t = 1000
        fire("pointerdown", x, startY, t)
        for (const { dx, dt } of moves) {
          x += dx
          t += dt
          fire("pointermove", x, startY, t)
        }
        fire("pointerup", x, startY, t + 1)

        Element.prototype.setPointerCapture = orig
      },
      { startX, startY, moves }
    )
  }

  await test("fast short swipe (velocity) dismisses", async () => {
    await page.mouse.move(0, 0)
    await page.locator('button:has-text("Default")').click()
    await waitFor(async () => (await allToasts().count()) > 0)
    const t = firstToast()
    await settle(t)
    const box = await t.boundingBox()

    // 30px in 20ms = 1.5 px/ms — above 1.0 threshold, under 25% distance
    await pointerSequence(t, box.x + 20, box.y + box.height / 2, [
      { dx: 15, dt: 20 },
      { dx: 15, dt: 20 },
    ])

    await waitFor(async () => (await allToasts().count()) === 0, 5000)
    eq(await allToasts().count(), 0, "dismissed by velocity")
  })

  await test("same distance dragged slowly does not dismiss", async () => {
    await page.mouse.move(0, 0)
    await page.locator('button:has-text("Default")').click()
    await waitFor(async () => (await allToasts().count()) > 0)
    const t = firstToast()
    await settle(t)
    const box = await t.boundingBox()

    // 30px in 200ms = 0.15 px/ms — well below threshold, under 25% distance
    await pointerSequence(t, box.x + 20, box.y + box.height / 2, [
      { dx: 15, dt: 100 },
      { dx: 15, dt: 100 },
    ])

    await page.waitForTimeout(200)
    eq(await allToasts().count() > 0, true, "not dismissed")
    await clearAll()
  })

  await test("fast swipe in wrong direction does not dismiss", async () => {
    await page.mouse.move(0, 0)
    await page.locator('button:has-text("Default")').click()
    await waitFor(async () => (await allToasts().count()) > 0)
    const t = firstToast()
    await settle(t)
    const box = await t.boundingBox()

    // -30px (left, wrong direction) in 20ms = -1.5 px/ms
    // swipeSign = 1 for bottom-right, so velocity * swipeSign < 0
    await pointerSequence(t, box.x + 60, box.y + box.height / 2, [
      { dx: -15, dt: 20 },
      { dx: -15, dt: 20 },
    ])

    await page.waitForTimeout(200)
    eq(await allToasts().count() > 0, true, "not dismissed")
    await clearAll()
  })

  await test("long slow drag ending in flick dismisses", async () => {
    await page.mouse.move(0, 0)
    await page.locator('button:has-text("Default")').click()
    await waitFor(async () => (await allToasts().count()) > 0)
    const t = firstToast()
    await settle(t)
    const box = await t.boundingBox()

    // Slow drag (20px over 800ms), then a fast flick (30px in 20ms).
    // Whole-gesture average: 50px / 860ms = 0.058 px/ms — useless.
    // Windowed (last 100ms): 30px / 20ms = 1.5 px/ms — above threshold.
    await pointerSequence(t, box.x + 20, box.y + box.height / 2, [
      { dx: 5, dt: 200 },
      { dx: 5, dt: 200 },
      { dx: 5, dt: 200 },
      { dx: 5, dt: 200 },
      { dx: 15, dt: 20 },
      { dx: 15, dt: 20 },
    ])

    await waitFor(async () => (await allToasts().count()) === 0, 5000)
    eq(await allToasts().count(), 0, "dismissed by flick at end")
  })

  await test("held still before lift does not dismiss by velocity", async () => {
    await page.mouse.move(0, 0)
    await page.locator('button:has-text("Default")').click()
    await waitFor(async () => (await allToasts().count()) > 0)
    const t = firstToast()
    await settle(t)
    const box = await t.boundingBox()

    // Move 20px quickly, then hold still for 200ms (> 100ms window).
    // The old samples are pruned; only the still-position remains.
    await pointerSequence(t, box.x + 20, box.y + box.height / 2, [
      { dx: 10, dt: 20 },
      { dx: 10, dt: 20 },
      { dx: 0, dt: 200 },
    ])

    await page.waitForTimeout(200)
    eq(await allToasts().count() > 0, true, "not dismissed")
    await clearAll()
  })
}
