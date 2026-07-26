export default async function run({ page, baseUrl, test, eq, near }) {
  await page.goto(`${baseUrl}/#carousel`)

  // Lazy-loaded page — wait for the carousel to mount
  await page.locator('[data-pg="c-basic"] .carousel-content').waitFor()
  // Park mouse so hover state from previous test files doesn't interfere
  await page.mouse.move(0, 0)

  const el = (pg, sel = "") => page.locator(`[data-pg="${pg}"] ${sel}`.trim())

  /** Wait for a scroll animation to settle by polling position stability. */
  const waitForSnap = async (pg, prop = "scrollLeft") => {
    await page.waitForTimeout(80) // let the scroll start
    await page.waitForFunction(
      ({ pg, prop }) => {
        const content = document.querySelector(`[data-pg="${pg}"] .carousel-content`)
        if (!content) return false
        const key = `__csnap_${pg}_${prop}`
        const cur = content[prop]
        if (window[key] === undefined) { window[key] = cur; return false }
        if (Math.abs(window[key] - cur) > 0.5) { window[key] = cur; return false }
        delete window[key]
        return true
      },
      { pg, prop },
      { polling: 100, timeout: 5000 }
    )
  }

  /** Reset scroll position to the start. */
  const resetScroll = async (pg) => {
    await page.evaluate(
      (pg) => {
        const c = document.querySelector(`[data-pg="${pg}"] .carousel-content`)
        c.scrollTo({ left: 0, top: 0 })
      },
      pg
    )
    await page.waitForTimeout(120)
  }

  // ---- ARIA ----

  await test("ARIA: root has role=region and aria-roledescription=carousel", async () => {
    eq(await el("c-basic").getAttribute("role"), "region")
    eq(await el("c-basic").getAttribute("aria-roledescription"), "carousel")
  })

  await test("ARIA: slides have role=group and aria-roledescription=slide", async () => {
    const items = el("c-basic", ".carousel-item")
    eq(await items.first().getAttribute("role"), "group")
    eq(await items.first().getAttribute("aria-roledescription"), "slide")
    eq(await items.count(), 5, "5 slides")
  })

  // ---- Prev / Next buttons ----

  await test("prev disabled at start, next enabled", async () => {
    await resetScroll("c-basic")
    eq(await el("c-basic", ".carousel-previous").isDisabled(), true, "prev disabled")
    eq(await el("c-basic", ".carousel-next").isDisabled(), false, "next enabled")
  })

  await test("clicking next advances the snap position", async () => {
    await resetScroll("c-basic")
    await el("c-basic", ".carousel-next").click()
    await waitForSnap("c-basic")
    const scroll = await page.evaluate(() =>
      document.querySelector('[data-pg="c-basic"] .carousel-content').scrollLeft
    )
    eq(scroll > 10, true, `scrollLeft increased (${scroll})`)
  })

  await test("clicking prev goes back to start", async () => {
    // at slide 2 from the previous test
    await el("c-basic", ".carousel-previous").click()
    await waitForSnap("c-basic")
    const scroll = await page.evaluate(() =>
      document.querySelector('[data-pg="c-basic"] .carousel-content').scrollLeft
    )
    near(scroll, 0, 2, "scrolled back to start")
  })

  await test("next disabled at the last slide", async () => {
    await resetScroll("c-basic")
    for (let i = 0; i < 4; i++) {
      await el("c-basic", ".carousel-next").click()
      await waitForSnap("c-basic")
    }
    eq(await el("c-basic", ".carousel-next").isDisabled(), true, "next disabled at end")
    eq(await el("c-basic", ".carousel-previous").isDisabled(), false, "prev still enabled")
  })

  // ---- Keyboard ----

  await test("keyboard ArrowRight advances, ArrowLeft goes back", async () => {
    await resetScroll("c-basic")
    await el("c-basic").focus()
    await page.keyboard.press("ArrowRight")
    await waitForSnap("c-basic")
    const after = await page.evaluate(() =>
      document.querySelector('[data-pg="c-basic"] .carousel-content').scrollLeft
    )
    eq(after > 10, true, `ArrowRight advanced (scrollLeft=${after})`)

    await page.keyboard.press("ArrowLeft")
    await waitForSnap("c-basic")
    const back = await page.evaluate(() =>
      document.querySelector('[data-pg="c-basic"] .carousel-content').scrollLeft
    )
    near(back, 0, 2, "ArrowLeft returned to start")
  })

  // ---- Pointer swipe ----

  await test("pointer swipe past threshold advances", async () => {
    await resetScroll("c-basic")
    const box = await el("c-basic", ".carousel-content").boundingBox()
    const cx = box.x + box.width / 2
    const cy = box.y + box.height / 2

    await page.mouse.move(cx, cy)
    await page.mouse.down()
    await page.mouse.move(cx - 80, cy, { steps: 5 })
    await page.mouse.up()
    await waitForSnap("c-basic")

    const scroll = await page.evaluate(() =>
      document.querySelector('[data-pg="c-basic"] .carousel-content').scrollLeft
    )
    eq(scroll > 10, true, `swipe advanced (scrollLeft=${scroll})`)
  })

  await test("small pointer drag snaps back", async () => {
    await resetScroll("c-basic")
    const box = await el("c-basic", ".carousel-content").boundingBox()
    const cx = box.x + box.width / 2
    const cy = box.y + box.height / 2

    await page.mouse.move(cx, cy)
    await page.mouse.down()
    await page.mouse.move(cx - 20, cy, { steps: 3 })
    await page.mouse.up()
    await waitForSnap("c-basic")

    const scroll = await page.evaluate(() =>
      document.querySelector('[data-pg="c-basic"] .carousel-content').scrollLeft
    )
    near(scroll, 0, 5, "snapped back to start")
  })

  // ---- Vertical ----

  await test("vertical: ArrowDown advances, ArrowUp returns", async () => {
    await resetScroll("c-vertical")
    await el("c-vertical").focus()
    await page.keyboard.press("ArrowDown")
    await waitForSnap("c-vertical", "scrollTop")
    const after = await page.evaluate(() =>
      document.querySelector('[data-pg="c-vertical"] .carousel-content').scrollTop
    )
    eq(after > 10, true, `ArrowDown advanced (scrollTop=${after})`)

    await page.keyboard.press("ArrowUp")
    await waitForSnap("c-vertical", "scrollTop")
    const back = await page.evaluate(() =>
      document.querySelector('[data-pg="c-vertical"] .carousel-content').scrollTop
    )
    near(back, 0, 2, "ArrowUp returned to start")
  })

  await test("vertical: prev disabled at start, next enabled", async () => {
    await resetScroll("c-vertical")
    eq(await el("c-vertical", ".carousel-previous").isDisabled(), true, "prev disabled")
    eq(await el("c-vertical", ".carousel-next").isDisabled(), false, "next enabled")
  })

  // ---- Click-through on interactive content inside slides ----

  await test("mouse click on a button inside a slide registers", async () => {
    const btn = page.locator('[data-pg="c-click-btn"]').first()
    await btn.waitFor()
    eq(await btn.getAttribute("data-clicks"), "0", "starts at 0")
    await btn.click()
    eq(await btn.getAttribute("data-clicks"), "1", "click registered")
    await btn.click()
    eq(await btn.getAttribute("data-clicks"), "2", "second click registered")
  })

  // ---- Alignment ----

  await test("align: center sets scroll-snap-align on items", async () => {
    const item = el("c-align", ".carousel-item").first()
    const snapAlign = await item.evaluate((el) => getComputedStyle(el).scrollSnapAlign)
    eq(snapAlign, "center", "scroll-snap-align is center")
  })

  await test("align: default (start) carousel items have scroll-snap-align: start", async () => {
    const item = el("c-basic", ".carousel-item").first()
    const snapAlign = await item.evaluate((el) => getComputedStyle(el).scrollSnapAlign)
    eq(snapAlign, "start", "scroll-snap-align is start")
  })

  // ---- Loop ----

  await test("loop: both nav buttons enabled at start", async () => {
    eq(await el("c-loop", ".carousel-previous").isDisabled(), false, "prev enabled")
    eq(await el("c-loop", ".carousel-next").isDisabled(), false, "next enabled")
  })

  await test("loop: next from last slide lands on the first", async () => {
    // Navigate to the last real slide
    for (let i = 0; i < 4; i++) {
      await el("c-loop", ".carousel-next").click()
      await waitForSnap("c-loop")
    }
    // Verify we're at slide 5 (index 4)
    const idxBefore = await page.evaluate(() => {
      const content = document.querySelector('[data-pg="c-loop"] .carousel-content')
      const reals = content.querySelectorAll(':scope > .carousel-item:not([data-carousel-clone])')
      const cr = content.getBoundingClientRect()
      let best = 0, bestDist = Infinity
      reals.forEach((r, i) => {
        const d = Math.abs(r.getBoundingClientRect().left - cr.left)
        if (d < bestDist) { bestDist = d; best = i }
      })
      return best
    })
    eq(idxBefore, 4, "at last slide before wrap")

    // Nav buttons still enabled
    eq(await el("c-loop", ".carousel-next").isDisabled(), false, "next still enabled at end")

    // Click next — should wrap to first slide
    await el("c-loop", ".carousel-next").click()
    await waitForSnap("c-loop")
    // Wait a bit for the recentre to complete
    await page.waitForTimeout(300)

    const idxAfter = await page.evaluate(() => {
      const content = document.querySelector('[data-pg="c-loop"] .carousel-content')
      const reals = content.querySelectorAll(':scope > .carousel-item:not([data-carousel-clone])')
      const cr = content.getBoundingClientRect()
      let best = 0, bestDist = Infinity
      reals.forEach((r, i) => {
        const d = Math.abs(r.getBoundingClientRect().left - cr.left)
        if (d < bestDist) { bestDist = d; best = i }
      })
      return best
    })
    eq(idxAfter, 0, "wrapped to first slide")
  })

  await test("loop: prev from first slide lands on the last", async () => {
    // Reset to first slide
    await page.evaluate(() => {
      const content = document.querySelector('[data-pg="c-loop"] .carousel-content')
      const firstReal = content.querySelector(':scope > .carousel-item:not([data-carousel-clone])')
      const cr = content.getBoundingClientRect()
      const ir = firstReal.getBoundingClientRect()
      content.scrollLeft += ir.left - cr.left
    })
    await page.waitForTimeout(200)

    await el("c-loop", ".carousel-previous").click()
    await waitForSnap("c-loop")
    await page.waitForTimeout(300)

    const idx = await page.evaluate(() => {
      const content = document.querySelector('[data-pg="c-loop"] .carousel-content')
      const reals = content.querySelectorAll(':scope > .carousel-item:not([data-carousel-clone])')
      const cr = content.getBoundingClientRect()
      let best = 0, bestDist = Infinity
      reals.forEach((r, i) => {
        const d = Math.abs(r.getBoundingClientRect().left - cr.left)
        if (d < bestDist) { bestDist = d; best = i }
      })
      return best
    })
    eq(idx, 4, "wrapped to last slide")
  })

  await test("loop: clones are aria-hidden and inert", async () => {
    const clones = el("c-loop", "[data-carousel-clone]")
    const count = await clones.count()
    eq(count > 0, true, "clones exist")
    for (let i = 0; i < count; i++) {
      eq(await clones.nth(i).getAttribute("aria-hidden"), "true", `clone ${i} aria-hidden`)
      // inert attribute is present (boolean attribute, value is empty string or "true")
      const hasInert = await clones.nth(i).evaluate((el) => el.inert)
      eq(hasInert, true, `clone ${i} inert`)
    }
  })

  await test("loop: focus never lands on a clone via Tab", async () => {
    // Focus the carousel, then tab through — no clone should receive focus
    await el("c-loop").focus()
    const focusedClone = await page.evaluate(() => {
      const carousel = document.querySelector('[data-pg="c-loop"]')
      const clones = carousel.querySelectorAll("[data-carousel-clone]")
      // Try to focus each clone — inert should prevent it
      for (const c of clones) {
        c.focus()
        if (document.activeElement === c) return true
        // Also check children
        const focusable = c.querySelectorAll("button, a, input, [tabindex]")
        for (const f of focusable) {
          f.focus()
          if (document.activeElement === f) return true
        }
      }
      return false
    })
    eq(focusedClone, false, "no clone or clone child is focusable")
  })

  // ---- Autoplay ----

  await test("autoplay: advances slide automatically", async () => {
    // The autoplay demo has a 3s delay — wait for it to advance at least once
    const initial = await page.evaluate(() => {
      const content = document.querySelector('[data-pg="c-autoplay"] .carousel-content')
      const reals = content.querySelectorAll(':scope > .carousel-item:not([data-carousel-clone])')
      const cr = content.getBoundingClientRect()
      let best = 0, bestDist = Infinity
      reals.forEach((r, i) => {
        const d = Math.abs(r.getBoundingClientRect().left - cr.left)
        if (d < bestDist) { bestDist = d; best = i }
      })
      return best
    })

    // Wait for autoplay to tick
    await page.waitForTimeout(3500)
    await waitForSnap("c-autoplay")

    const after = await page.evaluate(() => {
      const content = document.querySelector('[data-pg="c-autoplay"] .carousel-content')
      const reals = content.querySelectorAll(':scope > .carousel-item:not([data-carousel-clone])')
      const cr = content.getBoundingClientRect()
      let best = 0, bestDist = Infinity
      reals.forEach((r, i) => {
        const d = Math.abs(r.getBoundingClientRect().left - cr.left)
        if (d < bestDist) { bestDist = d; best = i }
      })
      return best
    })
    eq(after !== initial, true, `autoplay advanced from ${initial} to ${after}`)
  })

  await test("autoplay: pauses on hover", async () => {
    // Use .hover() which scrolls the element into view — manual mouse.move
    // fails when the carousel is below the viewport fold.
    await el("c-autoplay").hover()
    await waitForSnap("c-autoplay")          // let any in-flight scroll settle
    await page.waitForTimeout(200)           // recentre rAF headroom

    const before = await page.evaluate(() =>
      document.querySelector('[data-pg="c-autoplay"] .carousel-content').scrollLeft
    )

    // Stay hovered for longer than one autoplay interval
    await page.waitForTimeout(3800)

    const after = await page.evaluate(() =>
      document.querySelector('[data-pg="c-autoplay"] .carousel-content').scrollLeft
    )
    near(after, before, 2, "scrollLeft unchanged while hovered")

    // Move mouse away to resume
    await page.mouse.move(0, 0)
  })

  await test("autoplay: never starts under reduced motion", async () => {
    await page.emulateMedia({ reducedMotion: "reduce" })
    // Full reload so the plugin re-inits under the new media setting
    await page.reload({ waitUntil: "load" })
    await page.locator('[data-pg="c-autoplay"] .carousel-content').waitFor()
    await page.mouse.move(0, 0)

    // Verify the emulation is active
    const isReduced = await page.evaluate(() =>
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
    eq(isReduced, true, "reduced motion emulation active")

    // Wait for loop initialisation to settle
    await page.waitForTimeout(800)

    // Sample scrollLeft twice separated by more than one autoplay interval
    const before = await page.evaluate(() =>
      document.querySelector('[data-pg="c-autoplay"] .carousel-content').scrollLeft
    )
    await page.waitForTimeout(4000)
    const after = await page.evaluate(() =>
      document.querySelector('[data-pg="c-autoplay"] .carousel-content').scrollLeft
    )
    near(after, before, 2, "scrollLeft unchanged — autoplay did not run")

    // Restore for any remaining tests
    await page.emulateMedia({ reducedMotion: "no-preference" })
  })

  // ---- Clone-count optimisation ----

  await test("loop clones: wide items produce fewer clones than N per side", async () => {
    // c-loop: 5 items at 100% width in a 256px container
    const info = await page.evaluate(() => {
      const c = document.querySelector('[data-pg="c-loop"] .carousel-content')
      const all = c.querySelectorAll(':scope > .carousel-item')
      const clones = c.querySelectorAll(':scope > [data-carousel-clone]')
      const reals = c.querySelectorAll(':scope > .carousel-item:not([data-carousel-clone])')
      return { total: all.length, clones: clones.length, reals: reals.length }
    })
    eq(info.reals, 5, "5 real items")
    // With all-N cloning this would be 15 total (5 + 2*5).
    // Measured cloning should produce fewer: 5 + 6 = 11.
    eq(info.total < info.reals * 3, true,
      `total ${info.total} < 3N (${info.reals * 3})`)
    eq(info.clones, 6, "6 clones (3 per side) for wide single-item carousel")
  })

  await test("loop clones: narrow items produce more clones than the wide case", async () => {
    // c-loop-narrow: 10 items at 25% width in a 384px container
    const info = await page.evaluate(() => {
      const c = document.querySelector('[data-pg="c-loop-narrow"] .carousel-content')
      const all = c.querySelectorAll(':scope > .carousel-item')
      const clones = c.querySelectorAll(':scope > [data-carousel-clone]')
      const reals = c.querySelectorAll(':scope > .carousel-item:not([data-carousel-clone])')
      return { total: all.length, clones: clones.length, reals: reals.length }
    })
    eq(info.reals, 10, "10 real items")
    // With all-N cloning this would be 30 total.
    // Measured cloning should produce fewer: 10 + 12 = 22.
    eq(info.total < info.reals * 3, true,
      `total ${info.total} < 3N (${info.reals * 3})`)
    eq(info.clones, 12, "12 clones (6 per side) for narrow multi-item carousel")
    // More clones than the wide case (6 vs 12)
    eq(info.clones > 6, true, "narrow items need more clones than wide items")
  })

  await test("loop clones: narrow carousel loops forward seamlessly", async () => {
    // Navigate forward through all 10 items and wrap to the first
    const el2 = (sel) => page.locator(`[data-pg="c-loop-narrow"] ${sel}`.trim())

    // Reset to first item
    await page.evaluate(() => {
      const c = document.querySelector('[data-pg="c-loop-narrow"] .carousel-content')
      const firstReal = c.querySelector(':scope > .carousel-item:not([data-carousel-clone])')
      c.style.scrollSnapType = 'none'
      c.scrollLeft = firstReal.offsetLeft
      c.style.scrollSnapType = ''
    })
    await page.waitForTimeout(300)

    // Click next 10 times (full cycle)
    for (let i = 0; i < 10; i++) {
      await el2(".carousel-next").click()
      await waitForSnap("c-loop-narrow")
      await page.waitForTimeout(200)
    }

    const idx = await page.evaluate(() => {
      const c = document.querySelector('[data-pg="c-loop-narrow"] .carousel-content')
      const reals = c.querySelectorAll(':scope > .carousel-item:not([data-carousel-clone])')
      const cr = c.getBoundingClientRect()
      let best = 0, bestDist = Infinity
      reals.forEach((r, i) => {
        const d = Math.abs(r.getBoundingClientRect().left - cr.left)
        if (d < bestDist) { bestDist = d; best = i }
      })
      return best
    })
    eq(idx, 0, "looped back to first item after 10 nexts")
  })

  await test("loop clones: narrow carousel loops backward seamlessly", async () => {
    const el2 = (sel) => page.locator(`[data-pg="c-loop-narrow"] ${sel}`.trim())

    // Reset to first item
    await page.evaluate(() => {
      const c = document.querySelector('[data-pg="c-loop-narrow"] .carousel-content')
      const firstReal = c.querySelector(':scope > .carousel-item:not([data-carousel-clone])')
      c.style.scrollSnapType = 'none'
      c.scrollLeft = firstReal.offsetLeft
      c.style.scrollSnapType = ''
    })
    await page.waitForTimeout(300)

    // Click prev once — should wrap to last item
    await el2(".carousel-previous").click()
    await waitForSnap("c-loop-narrow")
    await page.waitForTimeout(300)

    const idx = await page.evaluate(() => {
      const c = document.querySelector('[data-pg="c-loop-narrow"] .carousel-content')
      const reals = c.querySelectorAll(':scope > .carousel-item:not([data-carousel-clone])')
      const cr = c.getBoundingClientRect()
      let best = 0, bestDist = Infinity
      reals.forEach((r, i) => {
        const d = Math.abs(r.getBoundingClientRect().left - cr.left)
        if (d < bestDist) { bestDist = d; best = i }
      })
      return best
    })
    eq(idx, 9, "wrapped to last item (index 9)")
  })
}
