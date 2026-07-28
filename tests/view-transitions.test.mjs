/**
 * Toggle the theme and capture the reveal animation the helper attaches to
 * `::view-transition-new(root)`. Polls from before the click, because the
 * animation only lives for --motion-medium.
 */
async function captureRevealKeyframes(page) {
  const reveal = await page.evaluate(async () => {
    const found = new Promise((resolve) => {
      const deadline = performance.now() + 2000
      const tick = () => {
        const anim = document
          .getAnimations()
          .find((a) => a.effect?.pseudoElement === "::view-transition-new(root)")
        if (anim) {
          const frames = anim.effect.getKeyframes()
          resolve({
            property: "maskImage" in (frames[0] ?? {}) ? "mask-image" : "other",
            from: frames[0]?.maskImage ?? "",
            to: frames.at(-1)?.maskImage ?? "",
            duration: anim.effect.getTiming().duration,
          })
        } else if (performance.now() < deadline) {
          requestAnimationFrame(tick)
        } else {
          resolve(null)
        }
      }
      requestAnimationFrame(tick)
    })
    document.querySelector(".pg-theme-toggle").click()
    return found
  })
  // Let the sweep finish so the next case starts from a settled tree.
  await page.waitForTimeout(600)
  return reveal
}

export default async function run({ page, baseUrl, test, eq, near }) {
  await page.goto(`${baseUrl}/#view-transitions`)
  await page.waitForSelector(".pg-vt-list")

  // -- API-absent path: interactions still produce the right final DOM --

  await test("theme toggle works without startViewTransition", async () => {
    // Stub out the API
    await page.evaluate(() => {
      window.__origSVT = document.startViewTransition
      document.startViewTransition = undefined
    })
    const wasDark = await page.evaluate(() =>
      document.documentElement.classList.contains("dark")
    )
    await page.locator(".pg-theme-toggle").click()
    const isDark = await page.evaluate(() =>
      document.documentElement.classList.contains("dark")
    )
    eq(isDark, !wasDark, "theme toggled without API")
    // Restore
    await page.evaluate(() => {
      document.startViewTransition = window.__origSVT
      delete window.__origSVT
    })
    // Toggle back to original state
    await page.locator(".pg-theme-toggle").click()
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
    await page.locator(".pg-vt-back").click()
    await page.waitForSelector(".pg-vt-list")
    const cardCount = await page.locator(".pg-vt-card").count()
    eq(cardCount, 4, "back to list with all cards")
    await page.evaluate(() => {
      document.startViewTransition = window.__origSVT
      delete window.__origSVT
    })
  })

  // -- API-present path: startViewTransition is called --

  await test("startViewTransition called on theme toggle", async () => {
    await page.evaluate(() => {
      window.__vtCalls = 0
      window.__origSVT = document.startViewTransition
      document.startViewTransition = (fn) => {
        window.__vtCalls++
        fn()
        return { ready: Promise.resolve(), finished: Promise.resolve(), updateCallbackDone: Promise.resolve() }
      }
    })
    await page.locator(".pg-theme-toggle").click()
    await page.waitForTimeout(100)
    const calls = await page.evaluate(() => window.__vtCalls)
    eq(calls, 1, "called once for theme toggle")
    await page.evaluate(() => {
      document.startViewTransition = window.__origSVT
      delete window.__origSVT
      delete window.__vtCalls
    })
    // Toggle back
    await page.locator(".pg-theme-toggle").click()
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
    await page.locator(".pg-vt-back").click()
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
    await page.locator(".pg-theme-toggle").click()
    await page.waitForTimeout(100)
    const isDark = await page.evaluate(() =>
      document.documentElement.classList.contains("dark")
    )
    eq(isDark, !wasDark, "theme still toggled")
    const calls = await page.evaluate(() => window.__vtCalls)
    eq(calls, 0, "startViewTransition not called under reduced motion")
    await page.evaluate(() => {
      document.startViewTransition = window.__origSVT
      delete window.__origSVT
      delete window.__vtCalls
    })
    // Toggle back and restore motion preference
    await page.locator(".pg-theme-toggle").click()
    await page.waitForTimeout(100)
    await page.emulateMedia({ reducedMotion: "no-preference" })
  })

  // -- The theme wipe: a feathered mask, on the kit's own clock --

  await test("theme wipe reveals with a feathered gradient mask", async () => {
    const reveal = await captureRevealKeyframes(page)
    eq(reveal !== null, true, "an animation runs on ::view-transition-new(root)")
    eq(
      reveal.property,
      "mask-image",
      "the reveal animates a mask, not a hard-edged clip-path",
    )
    // A hard boundary would be one colour stop; the feather needs an opaque
    // core AND a transparent outer stop to fade between. Serialisation of the
    // colours varies (#000 vs rgb(0, 0, 0)), so match on the alpha instead.
    const opaqueCore = /(#000\b|rgb\(0, 0, 0\))\s+([\d.]+)%/.exec(reveal.to)
    eq(opaqueCore !== null, true, `has an opaque core — got ${reveal.to}`)
    eq(
      /(#0000\b|transparent|rgba\(0, 0, 0, 0\))\s+100%/.test(reveal.to),
      true,
      `leading edge fades to transparent — got ${reveal.to}`,
    )
    eq(
      Number(opaqueCore[2]) < 100,
      true,
      "the opaque core ends before the circle does, leaving room to fade",
    )
    // The circle must overshoot the far corner by 1/core, or the sweep ends
    // mid-feather and the final frame pops. Chrome serialises `circle Npx` as
    // bare `Npx`, so match the radius by position, not the keyword.
    const [, fromRadius] = reveal.from.match(/([\d.]+)px at/)
    const [, toRadius] = reveal.to.match(/([\d.]+)px at/)
    const core = opaqueCore[2]
    eq(Number(fromRadius), 0, "reveal starts fully masked")
    const corner = await page.evaluate(() => {
      const r = document.querySelector(".pg-theme-toggle").getBoundingClientRect()
      const x = r.left + r.width / 2
      const y = r.top + r.height / 2
      return Math.hypot(
        Math.max(x, innerWidth - x),
        Math.max(y, innerHeight - y),
      )
    })
    near(Number(toRadius), corner / (Number(core) / 100), 1, "circle overshoots the corner")
  })

  await test("theme wipe duration tracks --motion-scale", async () => {
    // Read the token rather than assuming a scale — the site ships its own.
    const resolveMedium = () =>
      page.evaluate(() => {
        const root = document.documentElement
        const prev = root.style.animationDuration
        root.style.animationDuration = "var(--motion-medium)"
        const ms = parseFloat(getComputedStyle(root).animationDuration) * 1000
        root.style.animationDuration = prev
        return ms
      })

    const base = await captureRevealKeyframes(page)
    near(base.duration, await resolveMedium(), 1, "matches --motion-medium")

    const scale = await page.evaluate(() =>
      parseFloat(getComputedStyle(document.documentElement)
        .getPropertyValue("--motion-scale"))
    )
    await page.evaluate((s) =>
      document.documentElement.style.setProperty("--motion-scale", String(s * 2)),
      scale,
    )
    const scaled = await captureRevealKeyframes(page)
    await page.evaluate(() =>
      document.documentElement.style.removeProperty("--motion-scale")
    )
    // The token is calc(200ms * var(--motion-scale)) and is not
    // @property-registered, so reading it naively yields NaN and silently pins
    // the sweep to the 200ms fallback while every other animation scales.
    near(
      scaled.duration,
      base.duration * 2,
      1,
      "doubles with the scale, not stuck at the fallback",
    )
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
    await page.locator(".pg-vt-back").click()
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
