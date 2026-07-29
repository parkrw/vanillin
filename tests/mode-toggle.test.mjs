export default async function run({ page, baseUrl, test, eq, near }) {
  await page.goto(`${baseUrl}/#mode-toggle`)
  await page.waitForSelector(".pg-main .mode-toggle")

  // The nav carries a ModeToggle too (the site dogfoods the component), so
  // scope every locator to the page body.
  const toggle = page.locator(".pg-main .mode-toggle").first()
  const isDark = () =>
    page.evaluate(() => document.documentElement.classList.contains("dark"))
  // Wait for the swing and the light fading out rather than guessing a duration:
  // both scale with --motion-scale, which the cases below change.
  const settle = async () => {
    await page.waitForFunction(
      () => document.getAnimations().every((a) => a.playState !== "running"),
      null,
      { timeout: 15000 },
    )
    await page.waitForTimeout(60)
  }

  await test("toggles the document scheme and back", async () => {
    const before = await isDark()
    await toggle.click()
    await settle()
    eq(await isDark(), !before, "scheme flipped")
    await toggle.click()
    await settle()
    eq(await isDark(), before, "and back")
  })

  await test("the scheme swap is instant, with no page-wide transition", async () => {
    // A full-page reveal was tried and removed — it could not be timed to feel
    // right on a 14" 120Hz laptop and a 27" 60Hz display at once. If one comes
    // back, it belongs behind a decision, not a regression.
    const ran = await page.evaluate(async () => {
      const button = document.querySelector(".pg-main .mode-toggle")
      const seen = new Promise((resolve) => {
        const deadline = performance.now() + 600
        const tick = () => {
          if (
            document
              .getAnimations()
              .some((a) => a.effect?.pseudoElement?.startsWith("::view-transition"))
          )
            resolve(true)
          else if (performance.now() < deadline) requestAnimationFrame(tick)
          else resolve(false)
        }
        requestAnimationFrame(tick)
      })
      button.click()
      return seen
    })
    await settle()
    eq(ran, false, "no view-transition pseudo animates")

    await toggle.click()
    await settle()
  })

  await test("state and accessible name track the scheme", async () => {
    const dark = await isDark()
    eq(
      await toggle.getAttribute("data-state"),
      dark ? "dark" : "light",
      "data-state matches the scheme",
    )
    // The label must name the destination, not the current state, or a screen
    // reader hears "dark mode" on the button that turns dark mode off.
    const label = await toggle.getAttribute("aria-label")
    eq(
      /switch to (dark|light) mode/i.test(label),
      true,
      `aria-label names the destination — got ${label}`,
    )
    eq(await toggle.getAttribute("aria-pressed"), String(dark), "aria-pressed")

    await toggle.click()
    await settle()
    const flipped = await toggle.getAttribute("aria-label")
    eq(flipped !== label, true, "label follows the flip")
    await toggle.click()
    await settle()
  })

  /**
   * The swing and the light must be checked in *pixels*, not by class name.
   *
   * The earlier version of this component animated `mask-image` on a
   * view-transition pseudo-element — which Chrome does not paint at all. Every
   * structural assertion passed while nothing whatsoever appeared on screen. A
   * class that is present and a keyframe rule that exists are not evidence that
   * anything moved.
   */
  await test("the lamp actually rocks when clicked", async () => {
    const lamp = page.locator(".pg-main .mode-toggle .mode-toggle-lamp").first()
    const rotationOf = () =>
      lamp.evaluate((node) => {
        const { transform } = getComputedStyle(node)
        if (transform === "none") return 0
        const [a, b] = transform.match(/-?[\d.e-]+/g).map(Number)
        return (Math.atan2(b, a) * 180) / Math.PI
      })

    // Slowed right down so the extremes can be sampled without racing them.
    await page.evaluate(() =>
      document.documentElement.style.setProperty("--motion-scale", "20")
    )
    eq(await rotationOf(), 0, "at rest before the click")

    await toggle.click()
    // First extreme is at 16% of the swing: 16% of 200ms * 20 * 1.4 ≈ 900ms.
    await page.waitForTimeout(700)
    const first = await rotationOf()
    // Then it comes back through upright and past it the other way.
    await page.waitForTimeout(1600)
    const second = await rotationOf()

    await page.evaluate(() =>
      document.documentElement.style.removeProperty("--motion-scale")
    )
    await settle()

    eq(first < -1, true, `rocks away from upright first — got ${first}deg`)
    eq(second > 0, true, `and swings back past upright — got ${second}deg`)
    eq(Math.abs(second) < Math.abs(first), true, "each rock is smaller — it decays")
    near(await rotationOf(), 0, 0.5, "and settles upright")

    await toggle.click()
    await settle()
  })

  await test("a second click replays the swing", async () => {
    // The class is removed and re-added; without forcing a layout read between
    // the two the browser coalesces them and the animation never restarts.
    const started = () =>
      page.evaluate(async () => {
        const lamp = document.querySelector(".pg-main .mode-toggle-lamp")
        lamp.getAnimations().forEach((a) => a.cancel())
        document.querySelector(".pg-main .mode-toggle").click()
        await new Promise((resolve) => requestAnimationFrame(resolve))
        return lamp.getAnimations().some((a) => a.playState === "running")
      })

    eq(await started(), true, "first click runs the swing")
    await settle()
    eq(await started(), true, "so does the second")
    await settle()
  })

  await test("the light goes out — obviously", async () => {
    // Asserted on the rendered icon, not on the opacity value: a cone that is
    // present but invisible at icon size would pass a computed-style check and
    // fail the only test that matters, which is whether you can see it.
    const icon = page.locator(".pg-main .mode-toggle .mode-toggle-icon").first()

    if (await isDark()) {
      await toggle.click()
      await settle()
    }
    const lit = await icon.screenshot()

    await toggle.click()
    await settle()
    const dark = await icon.screenshot()
    eq(lit.equals(dark), false, "the glyph visibly changes")

    const opacity = () =>
      page.evaluate(() =>
        Number(
          getComputedStyle(document.querySelector(".pg-main .mode-toggle-glow"))
            .opacity,
        ),
      )
    eq(await opacity() < 0.02, true, "off: no cone of light")
    await toggle.click()
    await settle()
    eq(await opacity() > 0.2, true, "lit: the cone is plainly visible")
  })

  await test("reduced motion keeps the swap and drops the motion", async () => {
    await page.emulateMedia({ reducedMotion: "reduce" })
    const before = await isDark()
    const moved = await page.evaluate(async () => {
      const lamp = document.querySelector(".pg-main .mode-toggle-lamp")
      document.querySelector(".pg-main .mode-toggle").click()
      await new Promise((resolve) => requestAnimationFrame(resolve))
      return lamp.getAnimations().some((a) => a.playState === "running")
    })
    eq(moved, false, "no swing runs")
    eq(await isDark(), !before, "but the scheme still changes")

    await page.emulateMedia({ reducedMotion: null })
    await toggle.click()
    await settle()
  })

  await test("page has exactly one h2", async () => {
    eq(await page.locator("h2").count(), 1, "single h2")
  })
}
