// The first frame an overlay paints, against its steady state. Imported by the
// overlay suites; not a suite itself (the runner only picks up tests/*.test.mjs).
export function firstFrame({ page, eq, near }) {
  // The rAF loop is armed before the open, so its first read of the open
  // popover is what that frame paints — before the anchor hook's
  // ResizeObserver has had a frame to correct it. Layout values, not
  // getBoundingClientRect: the @starting-style scale skews the rect. It waits
  // for display: none first: an exit fade keeps a closed popover laid out, and
  // a measure taken then borrows the old box, which hides a position taken
  // before the show.
  const armFirstFrame = async (selector) => {
    await page.waitForFunction(
      (sel) => [...document.querySelectorAll(sel)].every((el) => getComputedStyle(el).display === "none"),
      selector
    )
    await page.evaluate((sel) => {
      const box = (el) => ({
        left: parseFloat(getComputedStyle(el).left),
        top: parseFloat(getComputedStyle(el).top),
        width: el.offsetWidth,
        height: el.offsetHeight,
        side: el.dataset.side,
      })
      window.__firstFrame = new Promise((resolve) => {
        const tick = () => {
          const el = document.querySelector(`${sel}:popover-open`)
          if (!el) return requestAnimationFrame(tick)
          const first = box(el)
          let frames = 3
          const settle = () =>
            --frames ? requestAnimationFrame(settle) : resolve({ first, steady: box(el) })
          requestAnimationFrame(settle)
        }
        requestAnimationFrame(tick)
      })
    }, selector)
  }

  const expectFirstFrameInPlace = async (selector) => {
    await page.waitForSelector(`${selector}:popover-open`)
    const { first, steady } = await page.evaluate(() => window.__firstFrame)
    eq(first.width > 0 && first.height > 0, true, `laid out in the first frame (${first.width}×${first.height})`)
    near(first.left, steady.left, 1, "first-frame left")
    near(first.top, steady.top, 1, "first-frame top")
    eq(first.side, steady.side, "first-frame side")
    return steady
  }

  // Puts `anchor` 300px down a viewport cut off 24px below it, so the content
  // must flip above — a placement a 0×0 measure cannot see.
  const nearViewportBottom = async (anchor, run) => {
    const original = page.viewportSize()
    const bottom = await anchor.evaluate((el) => {
      window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 300)
      return el.getBoundingClientRect().bottom
    })
    await page.setViewportSize({ width: original.width, height: Math.ceil(bottom) + 24 })
    try {
      await run()
    } finally {
      await page.setViewportSize(original)
    }
  }

  return { armFirstFrame, expectFirstFrameInPlace, nearViewportBottom }
}
