export default async function run({ page, baseUrl, test, eq }) {
  await page.goto(`${baseUrl}/#navigation-menu`)

  // ----------------------------------------------------------------
  //  Helpers — per-item popover mode (viewport={false}, data-pg="nm")
  // ----------------------------------------------------------------
  const waitOpen = (pg) =>
    page.waitForSelector(`[data-pg="${pg}"]:popover-open`)
  const waitAllClosed = () =>
    page.waitForFunction(() => {
      const panels = document.querySelectorAll('[data-pg="nm"] .navigation-menu-content')
      return (
        panels.length > 0 &&
        [...panels].every(
          (el) => !el.matches(":popover-open") && el.dataset.state === "closed"
        )
      )
    })
  const openCount = () =>
    page.evaluate(
      () => document.querySelectorAll('[data-pg="nm"] .navigation-menu-content:popover-open').length
    )
  const cleanup = async () => {
    await page.mouse.move(0, 0)
    await page.keyboard.press("Escape")
    await page.evaluate(() => document.activeElement?.blur())
    await waitAllClosed()
  }

  const learnTrigger = page.locator('[data-pg="nm-trigger-learn"]')
  const componentsTrigger = page.locator('[data-pg="nm-trigger-components"]')

  await test("hover opens after delay, leave closes after grace", async () => {
    await learnTrigger.hover()
    eq(await openCount(), 0, "not open before delay")
    await waitOpen("nm-content-learn")
    eq(await learnTrigger.getAttribute("data-state"), "open", "trigger data-state open")
    eq(await learnTrigger.getAttribute("aria-expanded"), "true", "aria-expanded true")

    await page.mouse.move(0, 0)
    eq(await openCount(), 1, "still open during closeDelay grace")
    await waitAllClosed()
    eq(await learnTrigger.getAttribute("data-state"), "closed", "trigger data-state closed")
  })

  await test("hovering a second trigger switches with a single panel open", async () => {
    await learnTrigger.hover()
    await waitOpen("nm-content-learn")
    await componentsTrigger.hover()
    await waitOpen("nm-content-components")
    await page.waitForFunction(() =>
      !document
        .querySelector('[data-pg="nm-content-learn"]')
        .matches(":popover-open")
    )
    eq(await openCount(), 1, "exactly one panel open after switch")
    await cleanup()
  })

  await test("pointer into content keeps it open; link click closes", async () => {
    await learnTrigger.hover()
    await waitOpen("nm-content-learn")
    await page.locator('[data-pg="nm-link-intro"]').hover()
    await page.waitForTimeout(250) // > closeDelay (100)
    eq(await openCount(), 1, "stays open while pointer is over content")
    await page.locator('[data-pg="nm-link-intro"]').click()
    await waitAllClosed()
    await cleanup()
  })

  await test("click toggles open and closed", async () => {
    await page.waitForTimeout(350)
    await learnTrigger.click()
    await waitOpen("nm-content-learn")
    await learnTrigger.click()
    await waitAllClosed()
    await cleanup()
  })

  await test("outside click closes and syncs state", async () => {
    await page.waitForTimeout(350)
    await learnTrigger.click()
    await waitOpen("nm-content-learn")
    await page.locator("h2").click()
    await waitAllClosed()
    eq(await learnTrigger.getAttribute("aria-expanded"), "false", "aria-expanded false")
    await cleanup()
  })

  await test("ArrowDown opens and focuses first link, arrows cycle, Esc refocuses trigger", async () => {
    await learnTrigger.focus()
    await page.keyboard.press("ArrowDown")
    await waitOpen("nm-content-learn")
    await page.waitForFunction(
      () => document.activeElement?.dataset.pg === "nm-link-intro"
    )

    await page.keyboard.press("ArrowDown")
    const second = await page.evaluate(
      () => document.activeElement?.querySelector("div")?.textContent
    )
    eq(second, "Installation", "ArrowDown moves to second link")
    await page.keyboard.press("ArrowUp")
    await page.waitForFunction(
      () => document.activeElement?.dataset.pg === "nm-link-intro"
    )

    await page.keyboard.press("Escape")
    await waitAllClosed()
    await page.waitForFunction(
      () => document.activeElement?.dataset.pg === "nm-trigger-learn"
    )
    await cleanup()
  })

  await test("ArrowRight/Left move focus along the list", async () => {
    await learnTrigger.focus()
    await page.keyboard.press("ArrowRight")
    await page.waitForFunction(
      () => document.activeElement?.dataset.pg === "nm-trigger-components"
    )
    await page.keyboard.press("ArrowRight")
    await page.waitForFunction(
      () => document.activeElement?.dataset.pg === "nm-link-docs"
    )
    await page.keyboard.press("ArrowLeft")
    await page.waitForFunction(
      () => document.activeElement?.dataset.pg === "nm-trigger-components"
    )
    await page.evaluate(() => document.activeElement?.blur())
  })

  await test("bare link with navigationMenuTriggerStyle renders as styled anchor", async () => {
    const docsLink = page.locator('[data-pg="nm-link-docs"]')
    eq(await docsLink.evaluate((el) => el.tagName), "A", "renders <a>")
    eq(
      await docsLink.evaluate((el) => el.classList.contains("navigation-menu-trigger")),
      true,
      "has trigger class"
    )
  })

  await test("controlled value/onValueChange", async () => {
    const readout = page.locator('[data-pg="nm-ctrl-state"]')
    eq(await readout.textContent(), "none", "initially none")
    await page.locator('[data-pg="nm-ctrl-trigger"]').click()
    await page.waitForFunction(
      () =>
        document.querySelector('[data-pg="nm-ctrl-state"]').textContent === "one"
    )
    await page.keyboard.press("Escape")
    await page.waitForFunction(
      () =>
        document.querySelector('[data-pg="nm-ctrl-state"]').textContent === "none"
    )
    await cleanup()
  })

  // ================================================================
  //  Viewport mode tests (data-pg="nm-vp")
  // ================================================================

  const vpLearn = page.locator('[data-pg="nm-vp-trigger-learn"]')
  const vpComp = page.locator('[data-pg="nm-vp-trigger-comp"]')

  const vpWaitOpen = (pg) =>
    page.waitForFunction(
      (sel) => {
        const el = document.querySelector(`[data-pg="${sel}"]`)
        return el && el.dataset.state === "open"
      },
      pg
    )
  const vpWaitClosed = () =>
    page.waitForFunction(() => {
      const vp = document.querySelector('[data-pg="nm-vp"] .navigation-menu-viewport')
      return vp && vp.dataset.state === "closed"
    })
  const vpCleanup = async () => {
    await page.mouse.move(0, 0)
    await page.keyboard.press("Escape")
    await page.evaluate(() => document.activeElement?.blur())
    await vpWaitClosed()
  }

  await test("viewport: single viewport element is reused across items", async () => {
    const vpCount = await page.evaluate(
      () => document.querySelectorAll('[data-pg="nm-vp"] .navigation-menu-viewport').length
    )
    eq(vpCount, 1, "exactly one viewport element")
  })

  await test("viewport: content teleports into viewport; source item stays mounted", async () => {
    await vpLearn.hover()
    await vpWaitOpen("nm-vp-content-learn")

    // Content panel is inside the viewport element.
    const insideViewport = await page.evaluate(() => {
      const vp = document.querySelector('[data-pg="nm-vp"] .navigation-menu-viewport')
      const content = document.querySelector('[data-pg="nm-vp-content-learn"]')
      return vp && content && vp.contains(content)
    })
    eq(insideViewport, true, "content is inside viewport")

    // The source NavigationMenuItem li is still in the DOM.
    const itemMounted = await page.evaluate(() => {
      const item = document.querySelector('[data-pg="nm-vp-trigger-learn"]')
      return item && item.closest(".navigation-menu-item") !== null
    })
    eq(itemMounted, true, "source item is still mounted")

    await vpCleanup()
  })

  await test("viewport: hover opens, hover-switch morphs, leave closes", async () => {
    await vpLearn.hover()
    await vpWaitOpen("nm-vp-content-learn")

    // Viewport is visible.
    const vpOpen = await page.evaluate(() =>
      document.querySelector('[data-pg="nm-vp"] .navigation-menu-viewport').dataset.state
    )
    eq(vpOpen, "open", "viewport open")

    // Switch to components.
    await vpComp.hover()
    await vpWaitOpen("nm-vp-content-comp")

    // Learn panel is now closed.
    const learnState = await page.evaluate(
      () => document.querySelector('[data-pg="nm-vp-content-learn"]')?.dataset.state
    )
    eq(learnState, "closed", "learn panel closed after switch")

    // Move away — viewport closes.
    await page.mouse.move(0, 0)
    await vpWaitClosed()
  })

  await test("viewport: data-motion matches traversal direction (LTR)", async () => {
    await vpLearn.hover()
    await vpWaitOpen("nm-vp-content-learn")

    // Switch forward (learn -> components).
    await vpComp.hover()
    await vpWaitOpen("nm-vp-content-comp")

    const compMotion = await page.evaluate(
      () => document.querySelector('[data-pg="nm-vp-content-comp"]')?.dataset.motion
    )
    eq(compMotion, "from-end", "forward switch: entering content from-end")

    const learnMotion = await page.evaluate(
      () => document.querySelector('[data-pg="nm-vp-content-learn"]')?.dataset.motion
    )
    eq(learnMotion, "to-start", "forward switch: exiting content to-start")

    // Switch backward (components -> learn).
    await vpLearn.hover()
    await vpWaitOpen("nm-vp-content-learn")

    const learnMotion2 = await page.evaluate(
      () => document.querySelector('[data-pg="nm-vp-content-learn"]')?.dataset.motion
    )
    eq(learnMotion2, "from-start", "backward switch: entering content from-start")

    const compMotion2 = await page.evaluate(
      () => document.querySelector('[data-pg="nm-vp-content-comp"]')?.dataset.motion
    )
    eq(compMotion2, "to-end", "backward switch: exiting content to-end")

    await vpCleanup()
  })

  await test("viewport: first open has no data-motion (no morph)", async () => {
    await vpLearn.hover()
    await vpWaitOpen("nm-vp-content-learn")

    const motion = await page.evaluate(
      () => document.querySelector('[data-pg="nm-vp-content-learn"]')?.dataset.motion
    )
    eq(motion, undefined, "no data-motion on first open")

    await vpCleanup()
  })

  await test("viewport: outside click closes", async () => {
    await page.waitForTimeout(350)
    await vpLearn.click()
    await vpWaitOpen("nm-vp-content-learn")
    await page.locator("h2").click()
    await vpWaitClosed()
    eq(
      await vpLearn.getAttribute("data-state"),
      "closed",
      "trigger state closed after outside click"
    )
  })

  await test("viewport: Escape closes and refocuses trigger", async () => {
    await vpLearn.hover()
    await vpWaitOpen("nm-vp-content-learn")

    // Move focus into the content.
    const link = page.locator('[data-pg="nm-vp-link-intro"]')
    await link.focus()

    await page.keyboard.press("Escape")
    await vpWaitClosed()
    await page.waitForFunction(
      () => document.activeElement?.dataset.pg === "nm-vp-trigger-learn"
    )
  })

  await test("viewport: ArrowDown opens and focuses first link", async () => {
    await vpLearn.focus()
    await page.keyboard.press("ArrowDown")
    await vpWaitOpen("nm-vp-content-learn")
    await page.waitForFunction(
      () => document.activeElement?.dataset.pg === "nm-vp-link-intro"
    )
    await vpCleanup()
  })

  await test("viewport: data-motion inverts under RTL", async () => {
    // Set RTL on <html> to match the popover RTL gotcha configuration.
    await page.evaluate(() => document.documentElement.setAttribute("dir", "rtl"))
    try {
      await vpLearn.hover()
      await vpWaitOpen("nm-vp-content-learn")

      // Switch forward in DOM order (learn -> components).
      // In RTL this is visually right-to-left, so direction inverts.
      await vpComp.hover()
      await vpWaitOpen("nm-vp-content-comp")

      const compMotion = await page.evaluate(
        () => document.querySelector('[data-pg="nm-vp-content-comp"]')?.dataset.motion
      )
      eq(compMotion, "from-start", "RTL forward switch: entering content from-start (inverted)")

      const learnMotion = await page.evaluate(
        () => document.querySelector('[data-pg="nm-vp-content-learn"]')?.dataset.motion
      )
      eq(learnMotion, "to-end", "RTL forward switch: exiting content to-end (inverted)")

      await vpCleanup()
    } finally {
      await page.evaluate(() => document.documentElement.removeAttribute("dir"))
    }
  })

  await test("viewport: no size animation under reduced motion", async () => {
    const viewportTransition = () =>
      page.evaluate(
        () =>
          getComputedStyle(document.querySelector('[data-pg="nm-vp"] .navigation-menu-viewport'))
            .transitionDuration
      )
    const contentAnimationName = () =>
      page.evaluate(
        () => getComputedStyle(document.querySelector('[data-pg="nm-vp-content-learn"]')).animationName
      )

    // Both assertions below are satisfied by motion that was never wired up.
    // Catch the real thing animating at no-preference first.
    await vpLearn.hover()
    await vpWaitOpen("nm-vp-content-learn")
    const liveTransition = await viewportTransition()
    const liveAnimation = await contentAnimationName()
    await vpCleanup()
    eq(
      liveTransition.split(",").some((d) => parseFloat(d.trim()) > 0),
      true,
      "precondition: viewport transitions at no-preference",
    )
    eq(liveAnimation !== "none", true, "precondition: content animates at no-preference")

    await page.emulateMedia({ reducedMotion: "reduce" })
    try {
      await vpLearn.hover()
      await vpWaitOpen("nm-vp-content-learn")

      const vpTransition = await viewportTransition()
      // Under reduced motion, transition is suppressed (0s or none).
      const allZero = vpTransition.split(",").every(
        (d) => parseFloat(d.trim()) === 0
      )
      eq(allZero, true, "viewport transition suppressed under reduced motion")

      eq(await contentAnimationName(), "none", "content animation suppressed under reduced motion")

      await vpCleanup()
    } finally {
      await page.emulateMedia({ reducedMotion: "no-preference" })
    }
  })

  await test("viewport: indicator offset tracks active trigger", async () => {
    const indicator = page.locator('[data-pg="nm-vp"] .navigation-menu-indicator')

    await vpLearn.hover()
    await vpWaitOpen("nm-vp-content-learn")

    // Indicator should be visible and positioned at the learn trigger.
    const indState = await indicator.getAttribute("data-state")
    eq(indState, "open", "indicator is open")

    const pos1 = await page.evaluate(() => {
      const ind = document.querySelector('[data-pg="nm-vp"] .navigation-menu-indicator')
      return ind?.style.getPropertyValue("--indicator-offset")
    })
    const learnOffset = await page.evaluate(() => {
      const trigger = document.querySelector('[data-pg="nm-vp-trigger-learn"]')
      return trigger?.offsetLeft + "px"
    })
    eq(pos1, learnOffset, "indicator offset matches learn trigger")

    // Switch to components.
    await vpComp.hover()
    await vpWaitOpen("nm-vp-content-comp")

    const pos2 = await page.evaluate(() => {
      const ind = document.querySelector('[data-pg="nm-vp"] .navigation-menu-indicator')
      return ind?.style.getPropertyValue("--indicator-offset")
    })
    const compOffset = await page.evaluate(() => {
      const trigger = document.querySelector('[data-pg="nm-vp-trigger-comp"]')
      return trigger?.offsetLeft + "px"
    })
    eq(pos2, compOffset, "indicator offset matches components trigger")

    // Indicator width matches trigger width.
    const indWidth = await page.evaluate(() => {
      const ind = document.querySelector('[data-pg="nm-vp"] .navigation-menu-indicator')
      return ind?.style.getPropertyValue("--indicator-width")
    })
    const compWidth = await page.evaluate(() => {
      const trigger = document.querySelector('[data-pg="nm-vp-trigger-comp"]')
      return trigger?.offsetWidth + "px"
    })
    eq(indWidth, compWidth, "indicator width matches trigger width")

    await vpCleanup()
  })

  await test("viewport={false}: per-item panels are popovers, not in a shared viewport", async () => {
    // The data-pg="nm" section uses viewport={false}.
    const hasPopover = await page.evaluate(() => {
      const content = document.querySelector('[data-pg="nm-content-learn"]')
      return content?.getAttribute("popover")
    })
    eq(hasPopover, "auto", "per-item content has popover=auto")

    const viewportInSection = await page.evaluate(() => {
      const nav = document.querySelector('[data-pg="nm"]')
      return nav?.querySelector(".navigation-menu-viewport")
    })
    eq(viewportInSection, null, "no viewport element in per-item mode")
  })

  await test("viewport={false}: per-item panel is anchored below its trigger", async () => {
    const trigger = page.locator('[data-pg="nm"] .navigation-menu-trigger').first()
    await trigger.click()
    const content = page.locator('[data-pg="nm-content-learn"]:popover-open')
    await content.waitFor({ timeout: 5000 })
    eq(await content.getAttribute("data-side"), "bottom", "data-side is bottom")
    const triggerBox = await trigger.boundingBox()
    const contentBox = await content.boundingBox()
    eq(contentBox.y >= triggerBox.y + triggerBox.height - 2, true, "panel is below the trigger")
    await page.mouse.click(0, 0)
    await page.waitForTimeout(300)
  })
}
