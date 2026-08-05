export default async function run({ page, baseUrl, test, eq }) {
  await page.goto(`${baseUrl}/#view-transitions`)
  await page.waitForSelector(".pg-vt-list")

  // -- API-absent path: interactions still produce the right final DOM --

  await test("wipe works without startViewTransition", async () => {
    // Stub out the API
    await page.evaluate(() => {
      window.__origSVT = document.startViewTransition
      document.startViewTransition = undefined
    })
    const wasDark = await page.evaluate(() =>
      document.documentElement.classList.contains("dark")
    )
    await page.locator('[data-pg="vt-wipe"]').click()
    const isDark = await page.evaluate(() =>
      document.documentElement.classList.contains("dark")
    )
    eq(isDark, !wasDark, "scheme toggled without API")
    // Restore
    await page.evaluate(() => {
      document.startViewTransition = window.__origSVT
      delete window.__origSVT
    })
    // Toggle back to original state
    await page.locator('[data-pg="vt-wipe"]').click()
    await page.waitForTimeout(100)
  })

  await test("list-detail works without startViewTransition", async () => {
    await page.evaluate(() => {
      window.__origSVT = document.startViewTransition
      document.startViewTransition = undefined
    })
    await page.locator(".pg-vt-card").first().click()
    await page.waitForSelector(".pg-vt-detail")
    const heading = await page.locator(".pg-vt-detail > h3").textContent()
    eq(heading, "Alpha", "detail view shows correct item")
    await page.locator('[data-pg="vt-back"]').click()
    await page.waitForSelector(".pg-vt-list")
    const cardCount = await page.locator(".pg-vt-card").count()
    eq(cardCount, 4, "back to list with all cards")
    await page.evaluate(() => {
      document.startViewTransition = window.__origSVT
      delete window.__origSVT
    })
  })

  // -- API-present path: startViewTransition is called --

  await test("startViewTransition called on the wipe", async () => {
    await page.evaluate(() => {
      window.__vtCalls = 0
      window.__origSVT = document.startViewTransition
      document.startViewTransition = (fn) => {
        window.__vtCalls++
        fn()
        return { ready: Promise.resolve(), finished: Promise.resolve(), updateCallbackDone: Promise.resolve() }
      }
    })
    await page.locator('[data-pg="vt-wipe"]').click()
    await page.waitForTimeout(100)
    const calls = await page.evaluate(() => window.__vtCalls)
    eq(calls, 1, "called once for the wipe")
    await page.evaluate(() => {
      document.startViewTransition = window.__origSVT
      delete window.__origSVT
      delete window.__vtCalls
    })
    // Toggle back
    await page.locator('[data-pg="vt-wipe"]').click()
    await page.waitForTimeout(100)
  })

  await test("startViewTransition called on list-detail navigation", async () => {
    await page.evaluate(() => {
      window.__vtCalls = 0
      window.__origSVT = document.startViewTransition
      document.startViewTransition = (fn) => {
        window.__vtCalls++
        fn()
        return { ready: Promise.resolve(), finished: Promise.resolve(), updateCallbackDone: Promise.resolve() }
      }
    })
    await page.locator(".pg-vt-card").first().click()
    await page.waitForSelector(".pg-vt-detail")
    const calls = await page.evaluate(() => window.__vtCalls)
    eq(calls, 1, "called once for list->detail")
    await page.locator('[data-pg="vt-back"]').click()
    await page.waitForSelector(".pg-vt-list")
    await page.evaluate(() => {
      document.startViewTransition = window.__origSVT
      delete window.__origSVT
      delete window.__vtCalls
    })
  })

  // -- Reduced motion: no transition --

  await test("reduced motion skips startViewTransition", async () => {
    await page.emulateMedia({ reducedMotion: "reduce" })
    await page.evaluate(() => {
      window.__vtCalls = 0
      window.__origSVT = document.startViewTransition
      document.startViewTransition = (fn) => {
        window.__vtCalls++
        fn()
        return { ready: Promise.resolve(), finished: Promise.resolve(), updateCallbackDone: Promise.resolve() }
      }
    })
    const wasDark = await page.evaluate(() =>
      document.documentElement.classList.contains("dark")
    )
    await page.locator('[data-pg="vt-wipe"]').click()
    await page.waitForTimeout(100)
    const isDark = await page.evaluate(() =>
      document.documentElement.classList.contains("dark")
    )
    eq(isDark, !wasDark, "scheme still toggled")
    const calls = await page.evaluate(() => window.__vtCalls)
    eq(calls, 0, "startViewTransition not called under reduced motion")
    await page.evaluate(() => {
      document.startViewTransition = window.__origSVT
      delete window.__origSVT
      delete window.__vtCalls
    })
    // Toggle back and restore motion preference
    await page.locator('[data-pg="vt-wipe"]').click()
    await page.waitForTimeout(100)
    await page.emulateMedia({ reducedMotion: "no-preference" })
  })

  // -- Shared-element name uniqueness --

  await test("view-transition-name is unique during transition and cleared after", async () => {
    // Click a card and check that only one element has the name
    await page.locator(".pg-vt-card").first().click()
    await page.waitForSelector(".pg-vt-detail")
    // The detail view should have the transition name
    const detailName = await page.locator(".pg-vt-detail").evaluate(
      (el) => getComputedStyle(el).viewTransitionName
    )
    eq(detailName, "shared-element", "detail has shared-element name")
    // No other element should have the name
    const count = await page.evaluate(() =>
      document.querySelectorAll("[style*='view-transition-name']").length
    )
    // Only the detail element should have the inline style (or 1 if detail does)
    eq(count <= 1, true, "at most one element has the name")
    // Go back
    await page.locator('[data-pg="vt-back"]').click()
    await page.waitForSelector(".pg-vt-list")
    // After transition, no card should have the name
    await page.waitForTimeout(600)
    const namesAfter = await page.evaluate(() => {
      const els = document.querySelectorAll(".pg-vt-card")
      return Array.from(els).filter(
        (el) => el.style.viewTransitionName === "shared-element"
      ).length
    })
    eq(namesAfter, 0, "names cleared after transition")
  })

  // -- Page structure --

  await test("page has exactly one h2", async () => {
    const h2Count = await page.locator("h2").count()
    eq(h2Count, 1, "single h2 for outside-click compatibility")
  })
}
