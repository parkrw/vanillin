// LiveValue: direction flash on change, one shared timer per interval.
// Colours are compared through a probe element so oklch/color-mix
// serialisation never has to be parsed (see docs/QUIRKS.md).

export default async function run({ page, baseUrl, test, eq }) {
  await page.goto(`${baseUrl}/#live-value`)
  const controlled = page.locator('[data-pg="lv-controlled"] .live-value')
  await controlled.waitFor()

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
    eq(await controlled.getAttribute("data-trend"), "up")
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
    await controlled.evaluate((el) =>
      new Promise((resolve) => {
        if (!el.hasAttribute("data-trend")) return resolve()
        new MutationObserver((_, obs) => {
          if (!el.hasAttribute("data-trend")) {
            obs.disconnect()
            resolve()
          }
        }).observe(el, { attributes: true })
      }),
    )
    await page.waitForFunction(
      ([sel, want]) => getComputedStyle(document.querySelector(sel)).color === want,
      [`[data-pg="lv-controlled"] .live-value`, resting],
    )
  })

  await test("controlled: a fall flashes down in --live-value-down with the down tick", async () => {
    await page.locator('[data-pg="lv-dec"]').click()
    eq(await controlled.textContent(), "42")
    eq(await controlled.getAttribute("data-trend"), "down")
    await page.waitForFunction(
      ([sel, want]) => getComputedStyle(document.querySelector(sel)).color === want,
      [`[data-pg="lv-controlled"] .live-value`, await tokenColour("--info")],
    )
    await page.waitForFunction(() => {
      const el = document.querySelector('[data-pg="lv-controlled"] .live-value-text')
      return el && getComputedStyle(el).animationName === "live-value-tick-down"
    })
    eq(
      await controlled.locator(".live-value-text").evaluate((el) => getComputedStyle(el).animationName),
      "live-value-tick-down",
    )
    await page.waitForFunction(
      (sel) => !document.querySelector(sel).hasAttribute("data-trend"),
      `[data-pg="lv-controlled"] .live-value`,
    )
  })

  await test("controlled: two same-direction changes both flash", async () => {
    await page.locator('[data-pg="lv-inc"]').click()
    const firstKey = await controlled.locator(".live-value-text").evaluate((el) => {
      el.dataset.probe = "first"
      return el.dataset.probe
    })
    eq(firstKey, "first")
    await page.locator('[data-pg="lv-inc"]').click()
    eq(await controlled.getAttribute("data-trend"), "up")
    // The text node was remounted, so the animation restarted from 0%.
    eq(await controlled.locator(".live-value-text").getAttribute("data-probe"), null)
    await page.waitForFunction(
      (sel) => !document.querySelector(sel).hasAttribute("data-trend"),
      `[data-pg="lv-controlled"] .live-value`,
    )
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
