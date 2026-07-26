export default async function run({ page, baseUrl, test, eq, near }) {
  await page.goto(`${baseUrl}/#scroll-area`)

  const el = (pg, part = "") => page.locator(`[data-pg="${pg}"] ${part}`.trim())
  const thumb = (pg, orientation = "vertical") =>
    page.locator(`[data-pg="${pg}"] .scroll-area-thumb[data-orientation="${orientation}"]`)
  const bar = (pg, orientation = "vertical") =>
    page.locator(`[data-pg="${pg}"] .scroll-area-scrollbar[data-orientation="${orientation}"]`)

  // the page is lazy-loaded, and bars only appear after the first measurement
  await bar("sa-vertical").waitFor()

  /** Scrolls the viewport imperatively and waits for the sync to land. */
  const scrollTo = async (pg, position) => {
    await page.evaluate(
      ({ pg, position }) => {
        const viewport = document.querySelector(`[data-pg="${pg}"] .scroll-area-viewport`)
        Object.assign(viewport, position)
      },
      { pg, position }
    )
    await page.waitForTimeout(80)
  }

  await test("vertical bar mounts on overflow with a thumb sized to the content ratio", async () => {
    eq(await bar("sa-vertical").count(), 1, "vertical bar rendered")
    const { thumbHeight, expected } = await page.evaluate(() => {
      const root = document.querySelector('[data-pg="sa-vertical"]')
      const viewport = root.querySelector(".scroll-area-viewport")
      const track = root.querySelector(".scroll-area-scrollbar")
      const thumbEl = root.querySelector(".scroll-area-thumb")
      const styles = getComputedStyle(track)
      const trackSize =
        track.offsetHeight - parseFloat(styles.paddingTop) - parseFloat(styles.paddingBottom)
      return {
        thumbHeight: thumbEl.getBoundingClientRect().height,
        expected: trackSize * (viewport.clientHeight / viewport.scrollHeight),
      }
    })
    near(thumbHeight, expected, 1, "thumb height")
  })

  await test("scrolling to the end parks the thumb at the end of the track", async () => {
    await scrollTo("sa-vertical", { scrollTop: 100000 })
    const gap = await page.evaluate(() => {
      const root = document.querySelector('[data-pg="sa-vertical"]')
      const track = root.querySelector(".scroll-area-scrollbar").getBoundingClientRect()
      const thumbEl = root.querySelector(".scroll-area-thumb").getBoundingClientRect()
      return track.bottom - thumbEl.bottom
    })
    near(gap, 1, 1.5, "thumb bottom sits at the track end (minus 1px padding)")

    await scrollTo("sa-vertical", { scrollTop: 0 })
    const topGap = await page.evaluate(() => {
      const root = document.querySelector('[data-pg="sa-vertical"]')
      const track = root.querySelector(".scroll-area-scrollbar").getBoundingClientRect()
      const thumbEl = root.querySelector(".scroll-area-thumb").getBoundingClientRect()
      return thumbEl.top - track.top
    })
    near(topGap, 1, 1.5, "thumb returns to the track start")
  })

  await test("data-scrolling flags the root while scrolling, then clears", async () => {
    await scrollTo("sa-vertical", { scrollTop: 200 })
    eq(await el("sa-vertical").getAttribute("data-scrolling"), "", "root marked scrolling")
    eq(await bar("sa-vertical").getAttribute("data-scrolling"), "", "bar marked scrolling")
    await page.waitForTimeout(600)
    eq(await el("sa-vertical").getAttribute("data-scrolling"), null, "cleared after the timeout")
  })

  await test("hovering the root marks the scrollbar", async () => {
    await page.mouse.move(0, 0)
    eq(await bar("sa-vertical").getAttribute("data-hovering"), null, "not hovering yet")
    const box = await el("sa-vertical").boundingBox()
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
    eq(await bar("sa-vertical").getAttribute("data-hovering"), "", "hovering")
    await page.mouse.move(0, 0)
    eq(await bar("sa-vertical").getAttribute("data-hovering"), null, "leaving clears it")
  })

  await test("dragging the thumb scrolls the viewport proportionally", async () => {
    await scrollTo("sa-vertical", { scrollTop: 0 })
    const box = await thumb("sa-vertical").boundingBox()
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
    await page.mouse.down()
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2 + 30, { steps: 6 })
    await page.mouse.up()

    const { scrollTop, expected } = await page.evaluate(() => {
      const root = document.querySelector('[data-pg="sa-vertical"]')
      const viewport = root.querySelector(".scroll-area-viewport")
      const track = root.querySelector(".scroll-area-scrollbar")
      const thumbEl = root.querySelector(".scroll-area-thumb")
      const styles = getComputedStyle(track)
      const trackSize =
        track.offsetHeight - parseFloat(styles.paddingTop) - parseFloat(styles.paddingBottom)
      const maxThumbOffset = trackSize - thumbEl.offsetHeight
      return {
        scrollTop: viewport.scrollTop,
        expected: (30 / maxThumbOffset) * (viewport.scrollHeight - viewport.clientHeight),
      }
    })
    near(scrollTop, expected, 2, "drag distance maps to scroll distance")
  })

  await test("clicking the track jumps the thumb to the pointer", async () => {
    await scrollTo("sa-vertical", { scrollTop: 0 })
    const track = await bar("sa-vertical").boundingBox()
    await page.mouse.click(track.x + track.width / 2, track.y + track.height - 6)
    const progress = await page.evaluate(() => {
      const viewport = document.querySelector('[data-pg="sa-vertical"] .scroll-area-viewport')
      return viewport.scrollTop / (viewport.scrollHeight - viewport.clientHeight)
    })
    eq(progress > 0.9, true, `clicking the track end scrolls to the end (got ${progress})`)
  })

  await test("wheel over the scrollbar scrolls the viewport", async () => {
    await scrollTo("sa-vertical", { scrollTop: 0 })
    const track = await bar("sa-vertical").boundingBox()
    await page.mouse.move(track.x + track.width / 2, track.y + track.height / 2)
    await page.mouse.wheel(0, 120)
    await page.waitForTimeout(80)
    const scrollTop = await page.evaluate(
      () => document.querySelector('[data-pg="sa-vertical"] .scroll-area-viewport').scrollTop
    )
    near(scrollTop, 120, 2, "wheel delta applied to the viewport")
  })

  await test("horizontal bar passed as a child stays put while the content scrolls", async () => {
    const before = await bar("sa-horizontal", "horizontal").boundingBox()
    await scrollTo("sa-horizontal", { scrollLeft: 150 })
    const after = await bar("sa-horizontal", "horizontal").boundingBox()
    near(after.x, before.x, 0.5, "bar did not scroll with the content")
    const offset = await page.evaluate(() => {
      const el = document.querySelector(
        '[data-pg="sa-horizontal"] .scroll-area-thumb[data-orientation="horizontal"]'
      )
      return new DOMMatrix(getComputedStyle(el).transform).m41
    })
    eq(offset > 0, true, `horizontal thumb moved (translate x ${offset})`)
    eq(await el("sa-horizontal", ".scroll-area-scrollbar").count(), 1, "no vertical bar")
  })

  await test("both axes: the corner is sized from the two bars", async () => {
    const corner = await page.evaluate(() => {
      const root = document.querySelector('[data-pg="sa-both"]')
      const styles = getComputedStyle(root)
      const rect = root.querySelector(".scroll-area-corner")?.getBoundingClientRect()
      return {
        width: styles.getPropertyValue("--scroll-area-corner-width").trim(),
        height: styles.getPropertyValue("--scroll-area-corner-height").trim(),
        cornerWidth: rect?.width ?? 0,
      }
    })
    eq(corner.width, "10px", "corner width from the vertical bar")
    eq(corner.height, "10px", "corner height from the horizontal bar")
    near(corner.cornerWidth, 10, 0.5, "corner element sized")

    const singleAxis = await page.evaluate(() =>
      getComputedStyle(document.querySelector('[data-pg="sa-vertical"]'))
        .getPropertyValue("--scroll-area-corner-width")
        .trim()
    )
    eq(singleAxis, "0px", "no corner without both axes")
  })

  await test("without overflow there is no bar and the viewport is not focusable", async () => {
    eq(await el("sa-short", ".scroll-area-scrollbar").count(), 0, "no scrollbar")
    eq(
      await el("sa-short", ".scroll-area-viewport").getAttribute("tabindex"),
      "-1",
      "viewport out of the tab order"
    )
    eq(
      await el("sa-vertical", ".scroll-area-viewport").getAttribute("tabindex"),
      "0",
      "scrollable viewport is focusable"
    )
    eq(await el("sa-keep-bar").count(), 1, "keepMounted renders the track anyway")
  })

  await test("rtl: the horizontal thumb starts at the inline end and walks left", async () => {
    await scrollTo("sa-rtl", { scrollLeft: 0 })
    const track = await bar("sa-rtl", "horizontal").boundingBox()
    const start = await thumb("sa-rtl", "horizontal").boundingBox()
    near(track.x + track.width - (start.x + start.width), 1, 1.5, "thumb starts at the right edge")

    await scrollTo("sa-rtl", { scrollLeft: -100000 })
    const end = await thumb("sa-rtl", "horizontal").boundingBox()
    near(end.x - track.x, 1, 1.5, "scrolled to the end, thumb sits at the left edge")
  })

  // ── Overflow edge detection ───────────────────────────────

  await test("data-overflow-y-* attributes track vertical scroll position", async () => {
    await scrollTo("sa-vertical", { scrollTop: 0 })
    await page.waitForTimeout(120)

    const root = el("sa-vertical")
    eq(await root.getAttribute("data-overflow-y-start"), null, "no start overflow at top")
    eq(await root.getAttribute("data-overflow-y-end"), "", "end overflow at top")
    eq(await root.getAttribute("data-overflow-end"), "", "summary end at top")
    eq(await root.getAttribute("data-overflow-start"), null, "no summary start at top")

    await scrollTo("sa-vertical", { scrollTop: 100000 })
    await page.waitForTimeout(120)

    eq(await root.getAttribute("data-overflow-y-start"), "", "start overflow at bottom")
    eq(await root.getAttribute("data-overflow-y-end"), null, "no end overflow at bottom")

    await scrollTo("sa-vertical", { scrollTop: 100 })
    await page.waitForTimeout(120)

    eq(await root.getAttribute("data-overflow-y-start"), "", "start overflow in middle")
    eq(await root.getAttribute("data-overflow-y-end"), "", "end overflow in middle")
  })

  await test("overflowEdgeThreshold delays attribute until scrolled past threshold", async () => {
    await scrollTo("sa-threshold", { scrollTop: 0 })
    await page.waitForTimeout(120)
    eq(await el("sa-threshold").getAttribute("data-overflow-y-start"), null, "at top, no start")

    await scrollTo("sa-threshold", { scrollTop: 10 })
    await page.waitForTimeout(120)
    eq(await el("sa-threshold").getAttribute("data-overflow-y-start"), null, "10px < 20px threshold")

    await scrollTo("sa-threshold", { scrollTop: 25 })
    await page.waitForTimeout(120)
    eq(await el("sa-threshold").getAttribute("data-overflow-y-start"), "", "25px > 20px threshold")
  })

  await test("both-axis scroll area tracks overflow on each edge independently", async () => {
    await scrollTo("sa-both", { scrollTop: 0, scrollLeft: 0 })
    await page.waitForTimeout(120)

    const root = el("sa-both")
    eq(await root.getAttribute("data-overflow-y-start"), null, "no y-start at origin")
    eq(await root.getAttribute("data-overflow-y-end"), "", "y-end at origin")
    eq(await root.getAttribute("data-overflow-x-start"), null, "no x-start at origin")
    eq(await root.getAttribute("data-overflow-x-end"), "", "x-end at origin")

    await scrollTo("sa-both", { scrollTop: 100000, scrollLeft: 100000 })
    await page.waitForTimeout(120)

    eq(await root.getAttribute("data-overflow-y-start"), "", "y-start at end")
    eq(await root.getAttribute("data-overflow-y-end"), null, "no y-end at end")
    eq(await root.getAttribute("data-overflow-x-start"), "", "x-start at end")
    eq(await root.getAttribute("data-overflow-x-end"), null, "no x-end at end")
  })

  await test("overflow attributes clear when content shrinks to fit", async () => {
    await scrollTo("sa-fade", { scrollTop: 0 })
    await page.waitForTimeout(120)
    eq(await el("sa-fade").getAttribute("data-overflow-y-end"), "", "has end overflow initially")

    await page.evaluate(() => {
      const userDiv = document.querySelector(
        '[data-pg="sa-fade"] .scroll-area-content > :not(.scroll-area-sentinel):not(.scroll-area-sentinel-track)'
      )
      if (userDiv) while (userDiv.children.length > 2) userDiv.lastElementChild.remove()
    })
    await page.waitForTimeout(250)

    eq(await el("sa-fade").getAttribute("data-overflow-y-end"), null, "end overflow gone after shrink")
    eq(await el("sa-fade").getAttribute("data-overflow-y-start"), null, "start overflow gone too")
  })

  // ── Snap suspension ───────────────────────────────────────

  await test("scroll-snap-type is none during a thumb drag and restored after", async () => {
    await page.evaluate(() => {
      const viewport = document.querySelector('[data-pg="sa-vertical"] .scroll-area-viewport')
      viewport.style.scrollSnapType = "y mandatory"
    })
    await scrollTo("sa-vertical", { scrollTop: 0 })

    const thumbBox = await thumb("sa-vertical").boundingBox()
    const x = thumbBox.x + thumbBox.width / 2
    const y = thumbBox.y + thumbBox.height / 2

    await page.mouse.move(x, y)
    await page.mouse.down()
    await page.mouse.move(x, y + 20, { steps: 3 })

    const duringDrag = await page.evaluate(
      () => document.querySelector('[data-pg="sa-vertical"] .scroll-area-viewport').style.scrollSnapType
    )

    await page.mouse.up()
    eq(duringDrag, "none", "snap type is none during drag")

    await page.waitForTimeout(1200)

    const afterDrag = await page.evaluate(
      () => document.querySelector('[data-pg="sa-vertical"] .scroll-area-viewport').style.scrollSnapType
    )
    eq(afterDrag, "y mandatory", "snap type restored after drag settles")

    // Clean up
    await page.evaluate(() => {
      document.querySelector('[data-pg="sa-vertical"] .scroll-area-viewport').style.scrollSnapType = ""
    })
  })

  // ── Overscroll squish guards ──────────────────────────────

  await test("overscroll squish does not engage for a mouse pointer", async () => {
    await scrollTo("sa-squish", { scrollTop: 0 })

    const area = await el("sa-squish").boundingBox()
    const x = area.x + area.width / 2
    const y = area.y + 20

    await page.mouse.move(x, y)
    await page.mouse.down()
    await page.mouse.move(x, y + 40, { steps: 8 })

    const transform = await page.evaluate(
      () => getComputedStyle(document.querySelector('[data-pg="sa-squish"] .scroll-area-content')).transform
    )
    await page.mouse.up()

    eq(transform, "none", "no transform applied for mouse pointer")
  })

  await test("overscroll squish does not engage under prefers-reduced-motion", async () => {
    await page.emulateMedia({ reducedMotion: "reduce" })
    await scrollTo("sa-squish", { scrollTop: 0 })

    const client = await page.context().newCDPSession(page)
    const area = await el("sa-squish").boundingBox()
    const x = Math.round(area.x + area.width / 2)
    const y = Math.round(area.y + 20)

    await client.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ x, y }],
    })
    await client.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ x, y: y + 40 }],
    })
    await page.waitForTimeout(50)

    const transform = await page.evaluate(
      () => getComputedStyle(document.querySelector('[data-pg="sa-squish"] .scroll-area-content')).transform
    )

    await client.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    })
    await client.detach()
    await page.emulateMedia({ reducedMotion: "no-preference" })

    eq(transform, "none", "no transform under reduced motion")
  })
}
