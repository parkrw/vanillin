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
}
