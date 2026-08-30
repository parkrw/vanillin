import { readFileSync } from "node:fs"
import { join } from "node:path"

export default async function run({ page, baseUrl, repoRoot, test, eq }) {
  const axeSource = readFileSync(join(repoRoot, "node_modules/axe-core/axe.min.js"), "utf-8")

  /** Inject axe fresh — must call after every full page load. */
  const injectAxe = () => page.evaluate(axeSource)

  /** Run axe color-contrast on a container; returns violations array. */
  const runAxe = (selector) =>
    page.evaluate(async (sel) => {
      const el = document.querySelector(sel)
      const results = await window.axe.run(el || document.body, {
        runOnly: ["color-contrast"],
      })
      return results.violations.map((v) => ({
        id: v.id,
        nodes: v.nodes.map((n) => n.html),
      }))
    }, selector)

  /**
   * Ensure the page is in the requested theme. Uses a full-page reload
   * so axe picks up fresh computed styles (it caches internally).
   */
  const ensureTheme = async (wantDark) => {
    await page.evaluate((dark) => {
      document.documentElement.classList.toggle("dark", dark)
    }, wantDark)
    await page.waitForTimeout(50)
  }

  // ── Badge status variant tests ──

  await page.goto(`${baseUrl}/#badge`)
  await injectAxe()
  await page.locator('[data-pg="badge-status"]').waitFor()
  await ensureTheme(false)

  await test("badge: status variants render with correct token colours", async () => {
    const results = await page.evaluate(() => {
      const container = document.querySelector('[data-pg="badge-status"]')
      const badges = container.querySelectorAll(".badge")
      return Array.from(badges).map((b) => {
        const s = getComputedStyle(b)
        return {
          text: b.textContent,
          bg: s.backgroundColor,
          color: s.color,
          borderColor: s.borderColor,
        }
      })
    })

    for (const badge of results) {
      eq(badge.bg !== "", true, `${badge.text} has background`)
      eq(badge.color !== "", true, `${badge.text} has colour`)
    }
    const bgs = new Set(results.map((r) => r.bg))
    eq(bgs.size, results.length, "each status variant has a unique background")
  })

  await test("badge: axe contrast check on all variants (light mode)", async () => {
    const violations = await runAxe('[data-pg="badge-status"]')
    eq(violations.length, 0, `axe violations: ${JSON.stringify(violations)}`)
  })

  // Reload for dark mode so axe starts with fresh colour data
  await ensureTheme(true)
  // Re-inject axe after forcing dark class (axe caches computed styles)
  await page.goto(`${baseUrl}/#badge`)
  await page.evaluate((dark) => {
    document.documentElement.classList.toggle("dark", dark)
  }, true)
  await page.waitForTimeout(50)
  await injectAxe()
  await page.locator('[data-pg="badge-status"]').waitFor()

  await test("badge: axe contrast check on all variants (dark mode)", async () => {
    const violations = await runAxe('[data-pg="badge-status"]')
    eq(violations.length, 0, `axe violations: ${JSON.stringify(violations)}`)
  })

  await test("badge: axe contrast check on original variants (dark mode)", async () => {
    const violations = await runAxe(".pg-section:first-of-type .pg-row")
    eq(violations.length, 0, `axe violations: ${JSON.stringify(violations)}`)
  })

  // Reset to light mode for subsequent tests
  await ensureTheme(false)

  // ── Status-dot tests ──

  await page.goto(`${baseUrl}/#status-dot`)
  await injectAxe()
  await page.locator('[data-pg="sd-statuses"]').waitFor()

  await test("status-dot: role='img' with aria-label by default", async () => {
    const dots = await page.locator('[data-pg="sd-statuses"] .status-dot').all()
    for (const dot of dots) {
      eq(await dot.getAttribute("role"), "img", "role is img")
      const label = await dot.getAttribute("aria-label")
      eq(label !== null && label.length > 0, true, "has aria-label")
    }
  })

  await test("status-dot: label={null} gives aria-hidden, no role", async () => {
    const dot = page.locator('[data-pg="sd-hidden"] .status-dot')
    eq(await dot.getAttribute("aria-hidden"), "true", "aria-hidden=true")
    eq(await dot.getAttribute("role"), null, "no role")
    eq(await dot.getAttribute("aria-label"), null, "no aria-label")
  })

  await test("status-dot: custom label overrides default", async () => {
    const dot = page.locator('[data-pg="sd-custom-label"] .status-dot')
    eq(await dot.getAttribute("aria-label"), "Build failed", "custom label applied")
  })

  await test("status-dot: data-status attribute for each state", async () => {
    const expected = ["success", "warning", "error", "info", "neutral", "pending"]
    const dots = await page.locator('[data-pg="sd-statuses"] .status-dot').all()
    eq(dots.length, expected.length, "correct number of dots")
    for (let i = 0; i < expected.length; i++) {
      eq(await dots[i].getAttribute("data-status"), expected[i], `data-status=${expected[i]}`)
    }
  })

  await test("status-dot: sizes produce distinct widths", async () => {
    const widths = await page.evaluate(() => {
      const dots = document.querySelectorAll('[data-pg="sd-sizes"] .status-dot')
      return Array.from(dots).map((d) => d.getBoundingClientRect().width)
    })
    eq(widths.length, 3, "three sizes rendered")
    eq(widths[0] < widths[1], true, `sm (${widths[0]}) < default (${widths[1]})`)
    eq(widths[1] < widths[2], true, `default (${widths[1]}) < lg (${widths[2]})`)
  })

  await test("status-dot: pending breathes — gentle dim plus halo, no alternate blink", async () => {
    const pendingDot = page.locator('[data-pg="sd-statuses"] .status-dot[data-status="pending"]')
    const { name, direction } = await pendingDot.evaluate((el) => {
      const cs = getComputedStyle(el)
      return { name: cs.animationName, direction: cs.animationDirection }
    })
    eq(name, "status-dot-pulse, status-dot-ring-pulse", "dim and halo loops are both active")
    // The smoothness is the direction: symmetric keyframes on one cycle, like
    // badge-glow, not the old alternate seesaw.
    eq(direction, "normal, normal", "no alternate blink")
  })

  await test("status-dot: pending pulse is fixed, not scaled by --motion-scale", async () => {
    const pendingDot = page.locator('[data-pg="sd-statuses"] .status-dot[data-status="pending"]')
    const before = await pendingDot.evaluate((el) => getComputedStyle(el).animationDuration)
    await page.evaluate(() => document.documentElement.style.setProperty("--motion-scale", "3"))
    const after = await pendingDot.evaluate((el) => getComputedStyle(el).animationDuration)
    await page.evaluate(() => document.documentElement.style.removeProperty("--motion-scale"))
    eq(after, before, "indeterminate loop must not track --motion-scale")
    eq(before, "2s, 2s", "both loops run at the fixed skeleton-style cadence")
  })

  // `animationName: none` is also what a dot that never animates at all
  // reports, so both tests below first catch the pending dot animating.
  const animationName = (status) =>
    page
      .locator(`[data-pg="sd-statuses"] .status-dot[data-status="${status}"]`)
      .evaluate((el) => getComputedStyle(el).animationName)

  await test("status-dot: pending animation absent under prefers-reduced-motion", async () => {
    eq((await animationName("pending")) !== "none", true, "precondition: pending animates at no-preference")

    await page.emulateMedia({ reducedMotion: "reduce" })
    const animName = await animationName("pending")
    await page.emulateMedia({ reducedMotion: "no-preference" })

    eq(animName, "none", "animation removed under reduced motion")
  })

  await test("status-dot: non-pending dots have no pulse animation", async () => {
    eq((await animationName("pending")) !== "none", true, "precondition: pending does animate")

    for (const status of ["success", "warning", "error", "info", "neutral"])
      eq(await animationName(status), "none", `${status} has no animation`)
  })

  await test("status-dot: ring halo breathes on a fixed 2s loop in the dot's own colour", async () => {
    const rings = page.locator('[data-pg="sd-ring"] .status-dot')
    eq(await rings.count(), 6)
    const running = await rings.evaluateAll((els) =>
      els.map((el) => {
        const s = getComputedStyle(el)
        return `${el.dataset.status}:${s.animationName}@${s.animationDuration}`
      }),
    )
    eq(
      running.join(" | "),
      [
        "success:status-dot-ring-pulse@2s",
        "warning:status-dot-ring-pulse@2s",
        "error:status-dot-alarm@1.1s",
        "info:status-dot-ring-pulse@2s",
        "neutral:status-dot-ring-pulse@2s",
        "pending:status-dot-pulse, status-dot-ring-pulse@2s, 2s",
      ].join(" | "),
    )
    // Fixed literal: the loop must not track --motion-scale.
    await page.evaluate(() => document.documentElement.style.setProperty("--motion-scale", "3"))
    eq(await rings.first().evaluate((el) => getComputedStyle(el).animationDuration), "2s")
    await page.evaluate(() => document.documentElement.style.removeProperty("--motion-scale"))

    // Reduced motion parks the halo, and the parked halo is the dot's colour
    // at 25%: compared through a probe so oklch/color-mix serialisation is
    // never parsed by hand.
    await page.emulateMedia({ reducedMotion: "reduce" })
    const parked = await rings.evaluateAll((els) =>
      els.map((el) => {
        const s = getComputedStyle(el)
        const probe = document.createElement("span")
        probe.style.backgroundColor = `color-mix(in oklab, ${s.backgroundColor} 25%, transparent)`
        el.parentElement.appendChild(probe)
        const want = getComputedStyle(probe).backgroundColor
        probe.remove()
        const halo = s.boxShadow.slice(0, s.boxShadow.lastIndexOf(")") + 1)
        return {
          status: el.dataset.status,
          animation: s.animationName,
          sameHue: halo === want,
          shadow: s.boxShadow,
        }
      }),
    )
    await page.emulateMedia({ reducedMotion: "no-preference" })
    for (const r of parked) {
      eq(r.animation, "none", `${r.status}: animation parked under reduced motion`)
      eq(r.sameHue, true, `${r.status}: halo is the dot colour at 25% (${r.shadow})`)
    }
  })

  await test("status-dot: ring variant adds box-shadow", async () => {
    const ringDot = page.locator('[data-pg="sd-ring"] .status-dot').first()
    const noRingDot = page.locator('[data-pg="sd-statuses"] .status-dot').first()
    const ringShadow = await ringDot.evaluate((el) => getComputedStyle(el).boxShadow)
    const noRingShadow = await noRingDot.evaluate((el) => getComputedStyle(el).boxShadow)
    eq(ringShadow !== "none", true, "ring dot has box-shadow")
    eq(noRingShadow, "none", "non-ring dot has no box-shadow")
  })

  await test("status-dot: each status has a distinct computed colour", async () => {
    const colours = await page.evaluate(() => {
      const dots = document.querySelectorAll('[data-pg="sd-statuses"] .status-dot')
      return Array.from(dots).map((d) => ({
        status: d.dataset.status,
        bg: getComputedStyle(d).backgroundColor,
      }))
    })
    // success, warning, error, info should all be distinct; neutral and pending
    // share the same token (muted-foreground) which is fine
    const distinct = new Set(colours.filter((c) => c.status !== "pending").map((c) => c.bg))
    eq(distinct.size >= 4, true, `at least 4 distinct colours (got ${distinct.size})`)
  })

  // axe contrast on dots (light mode)
  await test("status-dot: axe contrast check (light mode)", async () => {
    const violations = await runAxe('[data-pg="sd-statuses"]')
    eq(violations.length, 0, `axe violations: ${JSON.stringify(violations)}`)
  })

  // Dark mode: reload for fresh axe state
  await ensureTheme(true)
  await page.goto(`${baseUrl}/#status-dot`)
  await page.evaluate((dark) => {
    document.documentElement.classList.toggle("dark", dark)
  }, true)
  await page.waitForTimeout(50)
  await injectAxe()
  await page.locator('[data-pg="sd-statuses"]').waitFor()

  await test("status-dot: axe contrast check (dark mode)", async () => {
    const violations = await runAxe('[data-pg="sd-statuses"]')
    eq(violations.length, 0, `axe violations: ${JSON.stringify(violations)}`)
  })

  await test("status-dot: axe contrast check on ring variants (dark mode)", async () => {
    const violations = await runAxe('[data-pg="sd-ring"]')
    eq(violations.length, 0, `axe violations: ${JSON.stringify(violations)}`)
  })


  // Halo alpha read without parsing oklab by hand (docs/QUIRKS.md): a probe
  // span inside the row resolves the same mix through inheritance, and canvas
  // composites it over white, so a dimmer halo lands closer to white.
  const haloLuma = (rowSelector, mix) =>
    page.evaluate(([sel, expr]) => {
      const row = document.querySelector(sel)
      const probe = document.createElement("span")
      probe.style.backgroundColor = expr
      row.appendChild(probe)
      const colour = getComputedStyle(probe).backgroundColor
      probe.remove()
      const canvas = document.createElement("canvas")
      canvas.width = 4
      canvas.height = 4
      const ctx = canvas.getContext("2d")
      ctx.fillStyle = "#fff"
      ctx.fillRect(0, 0, 4, 4)
      ctx.fillStyle = colour
      ctx.fillRect(0, 0, 4, 4)
      const [r, g, b] = ctx.getImageData(1, 1, 1, 1).data
      return { colour, luma: 0.2126 * r + 0.7152 * g + 0.0722 * b }
    }, [rowSelector, mix])

  await test("glow controls: --glow-duration on an ancestor retimes ring and pending", async () => {
    const duration = (sel) => page.locator(sel).first().evaluate((el) => getComputedStyle(el).animationDuration)
    eq(await duration('[data-pg="sd-ring"] .status-dot--ring'), "2s", "precondition: the default ring row uses the 2s fallback")
    eq(await duration('[data-pg="sd-glow-controls"] .status-dot--ring'), "4s", "ring follows the wrapper")
    eq(
      await duration('[data-pg="sd-glow-controls"] .status-dot--ring[data-status="error"]'),
      "2s",
      "the alarm beat follows --glow-alarm-duration, not --glow-duration",
    )
    eq(await duration('[data-pg="sd-ring"] .status-dot--ring[data-status="error"]'), "1.1s", "counter-precondition: the default alarm beat")
    eq(
      await duration('[data-pg="sd-glow-controls"] .status-dot[data-status="pending"]'),
      "4s, 4s",
      "pending's dim and halo loops both follow the wrapper",
    )
    eq(
      await duration('[data-pg="sd-statuses"] .status-dot[data-status="pending"]'),
      "2s, 2s",
      "counter-precondition: pending outside the wrapper keeps the fallback",
    )
  })

  await test("glow controls: --glow-strength on an ancestor dims the halo", async () => {
    const shadow = (row) =>
      page
        .locator(`[data-pg="${row}"] .status-dot--ring[data-status="success"]`)
        .evaluate((el) => getComputedStyle(el).boxShadow)
    // The halo at rest: with the loop stopped the box-shadow is the 0%/100%
    // keyframe, so the two rows differ by strength alone.
    await page.emulateMedia({ reducedMotion: "reduce" })
    const dimmed = await shadow("sd-glow-controls")
    const full = await shadow("sd-ring")
    await page.emulateMedia({ reducedMotion: "no-preference" })
    eq(full !== "none", true, "precondition: the default row still declares a halo at rest")
    eq(dimmed !== full, true, `the halo changes with --glow-strength (${full} vs ${dimmed})`)

    const mix = "color-mix(in oklab, var(--success) calc(25% * var(--glow-strength, 1)), transparent)"
    const strong = await haloLuma('[data-pg="sd-ring"]', mix)
    const weak = await haloLuma('[data-pg="sd-glow-controls"]', mix)
    eq(strong.colour !== "rgba(0, 0, 0, 0)", true, `precondition: the mix resolves (${strong.colour})`)
    eq(
      weak.luma > strong.luma,
      true,
      `a lower --glow-strength is dimmer (default ${strong.luma.toFixed(1)} vs controls ${weak.luma.toFixed(1)})`,
    )
  })


  // Park the loop exactly at a phase of its cycle through the Web Animations
  // API (a paused CSS animation plus a negative delay lands a hair off the
  // frame), so getComputedStyle reads that keyframe's values.
  const frameAt = (locator, phase) =>
    locator.first().evaluate((el, phase) => {
      const anims = el.getAnimations()
      for (const a of anims) {
        a.pause()
        a.currentTime = a.effect.getTiming().duration * phase
      }
      const s = getComputedStyle(el)
      const frame = { shadow: s.boxShadow, opacity: s.opacity }
      for (const a of anims) a.play()
      return frame
    }, phase)
  // Chrome serialises a shadow as "<colour> x y blur spread": split there.
  const geometry = (shadow) => shadow.slice(shadow.indexOf(")") + 1)
  const colour = (shadow) => shadow.slice(0, shadow.indexOf(")") + 1)
  // A colour expression resolved where the element lives, so its custom
  // properties mean what they mean there.
  const mixColour = (locator, mix) =>
    locator.first().evaluate((el, mix) => {
      const probe = document.createElement("span")
      probe.style.backgroundColor = mix
      el.parentElement.appendChild(probe)
      const resolved = getComputedStyle(probe).backgroundColor
      probe.remove()
      return resolved
    }, mix)

  await test("ring shape: a soft halo that swells in the dot's colour; error is the alarm beat", async () => {
    const live = page.locator('[data-pg="sd-ring"] .status-dot--ring[data-status="success"]')
    const alarm = page.locator('[data-pg="sd-ring"] .status-dot--ring[data-status="error"]')
    const rest = await frameAt(live, 0)
    const peak = await frameAt(live, 0.5)
    eq(geometry(rest.shadow), " 0px 0px 3px 2px", `rest: a 2px halo blurred 3px (${rest.shadow})`)
    eq(geometry(peak.shadow), " 0px 0px 7px 4px", `peak: a 4px halo blurred 7px (${peak.shadow})`)
    eq(
      colour(peak.shadow),
      await mixColour(live, "color-mix(in oklab, var(--success) calc(40% * var(--glow-strength, 1)), transparent)"),
      "peak: still the dot's own colour",
    )
    const alarmRest = await frameAt(alarm, 0)
    const alarmPeak = await frameAt(alarm, 0.5)
    eq(geometry(alarmPeak.shadow), " 0px 0px 8px 6px", `alarm peak: the halo swells to 6px (${alarmPeak.shadow})`)
    eq(alarmPeak.opacity, "0.65", "alarm peak: the dot dims")
    eq(alarmRest.opacity, "1", "alarm rest: the dot is solid")
    eq(
      colour(alarmPeak.shadow),
      await mixColour(alarm, "color-mix(in oklab, var(--destructive) calc(12% * var(--glow-strength, 1)), transparent)"),
      "alarm peak: fades in its own red",
    )
  })

  // Chrome interpolates a box-shadow coloured with color-mix(… currentColor …)
  // discretely: the whole shadow snaps from the rest frame to the peak frame at
  // the midpoint (docs/QUIRKS.md). A quarter of the way in, the halo must sit
  // strictly between the two frames — geometry and alpha alike.
  const spread = (shadow) => parseFloat(geometry(shadow).trim().split(" ")[3])
  const alpha = (shadow) => parseFloat(colour(shadow).match(/\/ ([\d.]+)\)$/)?.[1] ?? "NaN")

  await test("ring motion: the halo grows through the cycle instead of snapping at its midpoint", async () => {
    for (const status of ["success", "error", "pending"]) {
      const dot = page.locator(`[data-pg="sd-ring"] .status-dot--ring[data-status="${status}"]`)
      const [rest, quarter, peak] = await Promise.all([0, 0.25, 0.5].map((phase) => frameAt(dot, phase)))
      const spreads = [rest, quarter, peak].map((f) => spread(f.shadow))
      const alphas = [rest, quarter, peak].map((f) => alpha(f.shadow))
      eq(spreads[0] !== spreads[2], true, `${status}: precondition — the loop moves the spread (${spreads})`)
      eq(
        spreads[1] > Math.min(spreads[0], spreads[2]) && spreads[1] < Math.max(spreads[0], spreads[2]),
        true,
        `${status}: spread at ¼ is between rest and peak (${spreads.join(" → ")})`,
      )
      eq(Number.isNaN(alphas[1]), false, `${status}: precondition — the halo colour carries an alpha (${quarter.shadow})`)
      eq(
        alphas[1] > Math.min(alphas[0], alphas[2]) && alphas[1] < Math.max(alphas[0], alphas[2]),
        true,
        `${status}: alpha at ¼ is between rest and peak (${alphas.join(" → ")})`,
      )
    }
  })

  // Reset to light mode for subsequent test files
  await ensureTheme(false)
}
