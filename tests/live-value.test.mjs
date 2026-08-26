// LiveValue: direction flash on change, one shared timer per interval.
// Colours are compared through a probe element so oklch/color-mix
// serialisation never has to be parsed (see docs/QUIRKS.md).

export default async function run({ page, baseUrl, test, eq }) {
  await page.goto(`${baseUrl}/#live-value`)
  const controlled = page.locator('[data-pg="lv-controlled"] .live-value')
  await controlled.waitFor()

  /*
   * Two timing traps live in this suite, and CI hit both (`expected "up", got
   * null`, then `expected "down", got "up"` once the aborted test left its
   * flash behind).
   *
   * `data-trend` is set from a post-commit effect, so it is not on the element
   * the instant `click()` resolves — wait for it, never sample it. And the
   * flash only lives for calc(--motion-medium * 3) = 600ms at the default
   * scale, which is narrower than the round-trips needed to read colour and
   * animation state on a loaded runner, so the colour assertions were racing
   * the clear. --motion-medium is a documented subtree-local override
   * (styles/globals.css), so widen the window for this demo and read the same
   * mechanism without racing it. A real navigation drops the override.
   */
  await controlled.evaluate((el) => el.style.setProperty("--motion-medium", "1000ms"))
  const flashed = (want) =>
    page.waitForFunction(
      ([sel, w]) => document.querySelector(sel).getAttribute("data-trend") === w,
      [`[data-pg="lv-controlled"] .live-value`, want],
      { timeout: 5000 },
    )
  const flashCleared = () =>
    page.waitForFunction(
      (sel) => !document.querySelector(sel).hasAttribute("data-trend"),
      `[data-pg="lv-controlled"] .live-value`,
      { timeout: 5000 },
    )

  // Computed colour of `var(--token)` resolved inside the same container.
  const tokenColour = (token) =>
    page.evaluate((t) => {
      const host = document.querySelector('[data-pg="lv-controlled"]')
      const probe = document.createElement("span")
      probe.style.color = `var(${t})`
      host.appendChild(probe)
      const c = getComputedStyle(probe).color
      probe.remove()
      return c
    }, token)

  await test("controlled: a rise flashes up in --live-value-up, then clears", async () => {
    eq(await controlled.getAttribute("data-trend"), null, "precondition: no trend before any change")
    eq(await controlled.textContent(), "42")
    const resting = await controlled.evaluate((el) => getComputedStyle(el).color)

    await page.locator('[data-pg="lv-inc"]').click()
    eq(await controlled.textContent(), "43")
    await flashed("up")
    // Transition target, not the mid-transition frame.
    await page.waitForFunction(
      ([sel, want]) => getComputedStyle(document.querySelector(sel)).color === want,
      [`[data-pg="lv-controlled"] .live-value`, await tokenColour("--warning")],
    )
    eq(
      await controlled.evaluate((el) => getComputedStyle(el, null).animationName),
      "none",
      "the tick rides on the inner text node, not the host",
    )
    eq(
      await controlled.locator(".live-value-text").evaluate((el) => getComputedStyle(el).animationName),
      "live-value-tick",
    )

    // The flash clears itself when the tick animation ends.
    await flashCleared()
    await page.waitForFunction(
      ([sel, want]) => getComputedStyle(document.querySelector(sel)).color === want,
      [`[data-pg="lv-controlled"] .live-value`, resting],
    )
  })

  await test("controlled: a fall flashes down in --live-value-down with the down tick", async () => {
    await page.locator('[data-pg="lv-dec"]').click()
    eq(await controlled.textContent(), "42")
    await flashed("down")
    await page.waitForFunction(
      ([sel, want]) => getComputedStyle(document.querySelector(sel)).color === want,
      [`[data-pg="lv-controlled"] .live-value`, await tokenColour("--info")],
    )
    eq(
      await controlled.locator(".live-value-text").evaluate((el) => getComputedStyle(el).animationName),
      "live-value-tick-down",
    )
    await flashCleared()
  })

  await test("controlled: two same-direction changes both flash", async () => {
    await page.locator('[data-pg="lv-inc"]').click()
    await flashed("up")
    const firstKey = await controlled.locator(".live-value-text").evaluate((el) => {
      el.dataset.probe = "first"
      return el.dataset.probe
    })
    eq(firstKey, "first")
    await page.locator('[data-pg="lv-inc"]').click()
    // The text node was remounted, so the animation restarted from 0%.
    await page.waitForFunction(
      (sel) => !document.querySelector(sel).hasAttribute("data-probe"),
      `[data-pg="lv-controlled"] .live-value-text`,
      { timeout: 5000 },
    )
    eq(await controlled.getAttribute("data-trend"), "up", "still flashing up after the second rise")
    await flashCleared()
  })

  await test("sampled: one timer per interval; the slow one holds its first sample", async () => {
    const fast = page.locator('[data-pg="lv-fast"] .live-value')
    const twin = page.locator('[data-pg="lv-fast-twin"] .live-value')
    const slow = page.locator('[data-pg="lv-slow"] .live-value')
    eq(await slow.textContent(), "0")

    await page.waitForFunction(
      () => Number(document.querySelector('[data-pg="lv-fast"] .live-value').textContent) >= 3,
      null,
      { timeout: 5000 },
    )
    const [a, b] = await page.evaluate(() => [
      document.querySelector('[data-pg="lv-fast"] .live-value').textContent,
      document.querySelector('[data-pg="lv-fast-twin"] .live-value').textContent,
    ])
    eq(a, b, "two LiveValues on the same interval read the same tick")
    eq(await slow.textContent(), "0", "the 60s sampler has not ticked")
    eq(await fast.getAttribute("data-trend"), "up")
    eq(await twin.getAttribute("data-trend"), "up")
  })

  await test("format renders text and tabular digits", async () => {
    const formatted = page.locator('[data-pg="lv-format"] .live-value').first()
    eq(/^\d+ running$/.test(await formatted.textContent()), true, await formatted.textContent())
    eq(
      await formatted.evaluate((el) => getComputedStyle(el).fontVariantNumeric),
      "tabular-nums",
    )
  })

  await test("--live-value-up/down recolour from an ancestor", async () => {
    // Force each trend on the element itself so the assertion is about the
    // colour the attribute selects, not about catching a flash in time.
    // The colour transition is switched off for the read, or a probe taken
    // right after the previous one reports the interpolated in-between value.
    const paint = (selector, trend) =>
      page.evaluate(
        ([sel, t]) => {
          const el = document.querySelector(sel)
          el.style.transition = "none"
          el.setAttribute("data-trend", t)
          const c = getComputedStyle(el).color
          el.removeAttribute("data-trend")
          el.style.transition = ""
          return c
        },
        [selector, trend],
      )
    const themed = '[data-pg="lv-colours"] .live-value'
    eq(await paint(themed, "up"), await tokenColour("--success"), "ancestor --live-value-up wins")
    eq(await paint(themed, "down"), await tokenColour("--destructive"), "ancestor --live-value-down wins")
    // Counter-precondition: without an override the defaults apply.
    const plain = '[data-pg="lv-controlled"] .live-value'
    eq(await paint(plain, "up"), await tokenColour("--warning"))
    eq(await paint(plain, "down"), await tokenColour("--info"))
  })
}
