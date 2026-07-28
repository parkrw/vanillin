export default async function run({ page, baseUrl, test, eq, near }) {
  await page.goto(`${baseUrl}/#mode-toggle`)
  await page.waitForSelector(".pg-main .mode-toggle")

  // The nav carries a ModeToggle too (the site dogfoods the component), so
  // scope every locator to the page body.
  const toggle = page.locator(".pg-main .mode-toggle").first()
  const isDark = () =>
    page.evaluate(() => document.documentElement.classList.contains("dark"))
  // Wait for the sweep to actually finish rather than guessing a duration —
  // the scale-doubling case runs a transition far longer than any fixed wait.
  const settle = async () => {
    await page.waitForFunction(
      () =>
        !document
          .getAnimations()
          .some((a) => a.effect?.pseudoElement?.startsWith("::view-transition")),
      null,
      { timeout: 15000 },
    )
    await page.waitForTimeout(120)
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
   * The sweep must be checked in *pixels*, not keyframes.
   *
   * An earlier version of this animated `mask-image`, which Chrome does not
   * paint on view-transition pseudo-elements at all: the animation object was
   * present and perfectly formed, every structural assertion passed, and
   * nothing whatsoever appeared on screen. Sampling a region far from the
   * origin partway through is the only assertion that would have caught it.
   */
  await test("the sweep actually paints partway through", async () => {
    // A corner far from the nav toggle, so it is still untouched early on.
    const clip = { x: 820, y: 520, width: 60, height: 60 }
    const shot = () => page.screenshot({ clip })

    await page.evaluate(() =>
      document.documentElement.style.setProperty("--motion-scale", "25")
    )
    const start = await shot()
    await page.locator(".pg-nav .mode-toggle").click()
    await page.waitForTimeout(2500)
    const middle = await shot()
    await page.waitForTimeout(12000)
    const end = await shot()
    await page.evaluate(() =>
      document.documentElement.style.removeProperty("--motion-scale")
    )
    await settle()

    eq(start.equals(end), false, "the corner ends up a different colour")
    eq(
      middle.equals(start),
      false,
      "the corner has begun changing partway through — nothing painted otherwise",
    )
    eq(
      middle.equals(end),
      false,
      "and is not yet finished, so what we sampled is genuinely mid-sweep",
    )

    // Restore the scheme for the cases that follow.
    await page.locator(".pg-nav .mode-toggle").click()
    await settle()
  })

  await test("the reveal is a vertically biased ellipse from the button", async () => {
    const reveal = await page.evaluate(async () => {
      const button = document.querySelector(".pg-nav .mode-toggle")
      const rect = button.getBoundingClientRect()
      const found = new Promise((resolve) => {
        const deadline = performance.now() + 2000
        const tick = () => {
          const anim = document
            .getAnimations()
            .find((a) => a.effect?.pseudoElement === "::view-transition-new(root)")
          if (anim) {
            const frames = anim.effect.getKeyframes()
            resolve({
              to: frames.at(-1)?.clipPath ?? "",
              opacityFrom: frames[0]?.opacity ?? null,
              opacityTo: frames.at(-1)?.opacity ?? null,
            })
          } else if (performance.now() < deadline) requestAnimationFrame(tick)
          else resolve(null)
        }
        requestAnimationFrame(tick)
      })
      button.click()
      return {
        ...(await found),
        centre: [rect.left + rect.width / 2, rect.top + rect.height / 2],
      }
    })
    await settle()

    eq(reveal.to.startsWith("ellipse("), true, `an ellipse — got ${reveal.to}`)
    const radii = [...reveal.to.matchAll(/([\d.]+)px/g)].map((m) => Number(m[1]))
    eq(
      radii[1] > radii[0],
      true,
      `grows faster vertically — got ${radii[0]}/${radii[1]}`,
    )
    const at = reveal.to.match(/at ([\d.]+)px ([\d.]+)px/)
    near(Number(at[1]), reveal.centre[0], 1, "origin x is the button centre")
    near(Number(at[2]), reveal.centre[1], 1, "origin y is the button centre")

    // The opacity ramp is what carries the swept region through grey; without
    // it the reveal is a hard black-on-white edge.
    eq(Number(reveal.opacityFrom) < 1, true, "starts dimmed")
    eq(Number(reveal.opacityTo), 1, "ends fully opaque")

    await page.locator(".pg-nav .mode-toggle").click()
    await settle()
  })

  await test("sweep duration tracks --motion-scale", async () => {
    const measure = () =>
      page.evaluate(async () => {
        const button = document.querySelector(".pg-nav .mode-toggle")
        const found = new Promise((resolve) => {
          const deadline = performance.now() + 2000
          const tick = () => {
            const anim = document
              .getAnimations()
              .find((a) => a.effect?.pseudoElement === "::view-transition-new(root)")
            if (anim) resolve(anim.effect.getTiming().duration)
            else if (performance.now() < deadline) requestAnimationFrame(tick)
            else resolve(null)
          }
          requestAnimationFrame(tick)
        })
        button.click()
        return found
      })

    const base = await measure()
    await settle()
    await page.evaluate(() => {
      const root = document.documentElement
      const current = parseFloat(
        getComputedStyle(root).getPropertyValue("--motion-scale")
      )
      root.style.setProperty("--motion-scale", String(current * 2))
    })
    const scaled = await measure()
    await page.evaluate(() =>
      document.documentElement.style.removeProperty("--motion-scale")
    )
    await settle()

    // The duration tokens are calc(200ms * var(--motion-scale)) and are not
    // @property-registered, so reading them naively yields NaN and silently
    // pins the sweep to a fallback while everything else scales.
    near(scaled, base * 2, 2, "doubles with the scale")
  })

  await test("transition={false} opts out of the sweep", async () => {
    const before = await isDark()
    const ran = await page.evaluate(async () => {
      const buttons = document.querySelectorAll(".pg-main .mode-toggle")
      const button = buttons[buttons.length - 1]
      const found = new Promise((resolve) => {
        const deadline = performance.now() + 1000
        const tick = () => {
          const anim = document
            .getAnimations()
            .find((a) => a.effect?.pseudoElement === "::view-transition-new(root)")
          if (anim) resolve(true)
          else if (performance.now() < deadline) requestAnimationFrame(tick)
          else resolve(false)
        }
        requestAnimationFrame(tick)
      })
      button.click()
      return found
    })
    await settle()

    eq(ran, false, "no reveal animation runs")
    eq(await isDark(), !before, "but the scheme still changes")
    await page.locator(".pg-main .mode-toggle").last().click()
    await settle()
  })

  await test("page has exactly one h2", async () => {
    eq(await page.locator("h2").count(), 1, "single h2")
  })
}
