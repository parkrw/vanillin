export default async function run({ page, baseUrl, test, eq, near }) {
  await page.goto(`${baseUrl}/#progress`)
  await page.waitForSelector(".progress")

  await test("aria + data attrs", async () => {
    const bar = page.locator('.progress[aria-label="A third"]')
    eq(await bar.getAttribute("role"), "progressbar")
    eq(await bar.getAttribute("aria-valuemin"), "0")
    eq(await bar.getAttribute("aria-valuemax"), "100")
    eq(await bar.getAttribute("aria-valuenow"), "33")
    eq(await bar.getAttribute("data-state"), "loading")
  })

  await test("complete state", async () => {
    eq(await page.locator('.progress[aria-label="Complete"]').getAttribute("data-state"), "complete")
  })

  await test("custom max", async () => {
    const bar = page.locator('.progress[aria-label="Custom max"]')
    eq(await bar.getAttribute("aria-valuemax"), "40")
    eq(await bar.getAttribute("aria-valuetext"), "75%")
  })

  await test("indicator transform tracks value", async () => {
    const transform = await page
      .locator('.progress[aria-label="A third"] .progress-indicator')
      .evaluate((el) => el.style.transform)
    eq(transform, "translateX(-67%)")
  })

  // getBoundingClientRect().width ignores translateX, so a bar parked entirely
  // off the track still reports the full track width — that is exactly the bug
  // this state had. Overlap with the track is what "paints" means here.
  const sweep = (frames) =>
    page
      .locator('[data-pg="progress-indeterminate"] .progress[data-state="indeterminate"] .progress-indicator')
      .first()
      .evaluate(
        (ind, n) =>
          new Promise((resolve) => {
            const track = ind.parentElement
            const series = []
            const tick = () => {
              const t = track.getBoundingClientRect()
              const i = ind.getBoundingClientRect()
              series.push({
                visible: Math.max(0, Math.min(t.right, i.right) - Math.max(t.left, i.left)),
                offset: i.left - t.left,
              })
              if (series.length < n) requestAnimationFrame(tick)
              else resolve(series)
            }
            requestAnimationFrame(tick)
          }),
        frames,
      )

  const indeterminateStyles = () =>
    page
      .locator('[data-pg="progress-indeterminate"] .progress[data-state="indeterminate"] .progress-indicator')
      .evaluateAll((els) =>
        els.map((el) => {
          const cs = getComputedStyle(el)
          const t = el.parentElement.getBoundingClientRect()
          const i = el.getBoundingClientRect()
          return {
            animationName: cs.animationName,
            animationDuration: cs.animationDuration,
            inlineTransform: el.style.transform,
            width: i.width,
            trackWidth: t.width,
            visible: Math.max(0, Math.min(t.right, i.right) - Math.max(t.left, i.left)),
          }
        }),
      )

  await test("indeterminate: a 40%-wide indicator sweeps on a fixed loop", async () => {
    const bars = await indeterminateStyles()
    eq(bars.length, 2, "both indeterminate demos present")
    for (const [i, bar] of bars.entries()) {
      eq(bar.inlineTransform, "", `bar ${i}: no inline transform to outrank the keyframe`)
      eq(bar.animationName, "progress-indeterminate", `bar ${i}: sweep running`)
      eq(bar.animationDuration, "1.5s", `bar ${i}: fixed literal duration`)
      near(bar.width, bar.trackWidth * 0.4, 1, `bar ${i}: indicator is 40% of the track`)
    }
    // Pixels, not the animation object: the bar has to cross the track, and it
    // has to move. A single sample can legitimately land on the off-track edge
    // of the cycle, so read a series and take the peak.
    const series = await sweep(40)
    const maxVisible = Math.max(...series.map((s) => s.visible))
    const offsets = series.map((s) => s.offset)
    eq(maxVisible > 0, true, `indicator paints inside the track (peak overlap ${maxVisible})`)
    eq(
      Math.max(...offsets) - Math.min(...offsets) > 1,
      true,
      `indicator actually travels (offsets ${Math.min(...offsets)}…${Math.max(...offsets)})`,
    )
  })

  await test("indeterminate: determinate bars do not sweep", async () => {
    const names = await page
      .locator('.progress[data-state="loading"] .progress-indicator, .progress[data-state="complete"] .progress-indicator')
      .evaluateAll((els) => els.map((el) => getComputedStyle(el).animationName))
    eq(names.length > 0, true, "precondition: determinate bars on the page")
    eq(
      names.every((n) => n === "none"),
      true,
      `no determinate bar animates (got ${JSON.stringify(names)})`,
    )
  })

  await test("indeterminate: reduced motion holds a visible static bar", async () => {
    eq(
      (await indeterminateStyles()).every((b) => b.animationName === "progress-indeterminate"),
      true,
      "precondition: the sweep runs at no-preference",
    )
    await page.emulateMedia({ reducedMotion: "reduce" })
    const bars = await indeterminateStyles()
    await page.emulateMedia({ reducedMotion: "no-preference" })
    for (const [i, bar] of bars.entries()) {
      eq(bar.animationName, "none", `bar ${i}: sweep removed`)
      near(bar.width, bar.trackWidth * 0.4, 1, `bar ${i}: still 40% wide`)
      eq(bar.visible > 0, true, `bar ${i}: still paints inside the track (${bar.visible})`)
    }
  })

  // The track's `overflow: hidden` clips a descendant's box-shadow, so a halo
  // on the indicator computes correctly and paints nothing. These read pixels
  // in a 4px strip just above a bar; clip is viewport-relative, and
  // locator.boundingBox() is avoided because its actionability wait never
  // settles on an element with an infinite animation.
  const stripAbove = async (selector) => {
    const clip = await page.locator(selector).evaluate((el) => {
      const r = el.getBoundingClientRect()
      return { x: Math.round(r.left), y: Math.round(r.top) - 5, width: Math.round(r.width), height: 4 }
    })
    const shot = await page.screenshot({ clip })
    return page.evaluate(async (b64) => {
      const img = new Image()
      img.src = `data:image/png;base64,${b64}`
      await img.decode()
      const canvas = document.createElement("canvas")
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext("2d")
      ctx.drawImage(img, 0, 0)
      const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height)
      let r = 0, g = 0, b = 0
      for (let i = 0; i < data.length; i += 4) {
        r += data[i]
        g += data[i + 1]
        b += data[i + 2]
      }
      const n = data.length / 4
      return [r / n, g / n, b / n]
    }, shot.toString("base64"))
  }
  const colourDistance = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2])

  const GLOW_BAR = '[data-pg="progress-glow"] .progress--glow'
  const PLAIN_BAR = '[data-pg="progress-glow"] .progress:not(.progress--glow)'

  await test("glow: breathes on a fixed 2s loop and the halo paints", async () => {
    await page.locator('[data-pg="progress-glow"]').evaluate((el) => el.scrollIntoView({ block: "center" }))
    const glow = await page.locator(GLOW_BAR).evaluate((el) => {
      const cs = getComputedStyle(el)
      return { name: cs.animationName, duration: cs.animationDuration, shadow: cs.boxShadow }
    })
    eq(glow.name, "progress-glow", "glow keyframes running")
    eq(glow.duration, "2s", "fixed literal duration")
    eq(glow.shadow !== "none", true, "halo declared")
    eq(
      await page.locator(PLAIN_BAR).evaluate((el) => getComputedStyle(el).boxShadow),
      "none",
      "counter-precondition: a bar without `glow` has no halo",
    )
    // Peak over a series: the halo breathes, so one sample can land at its
    // dimmest. Measured range on this fixture is 18–32 RGB units.
    const baseline = await stripAbove(PLAIN_BAR)
    let peak = 0
    for (let i = 0; i < 6; i++) {
      peak = Math.max(peak, colourDistance(await stripAbove(GLOW_BAR), baseline))
    }
    eq(peak > 8, true, `halo paints above the bar (peak distance ${peak.toFixed(1)})`)
  })

  await test("glow: reduced motion keeps a static halo", async () => {
    eq(
      await page.locator(GLOW_BAR).evaluate((el) => getComputedStyle(el).animationName),
      "progress-glow",
      "precondition: the glow animates at no-preference",
    )
    await page.emulateMedia({ reducedMotion: "reduce" })
    const still = await page.locator(GLOW_BAR).evaluate((el) => {
      const cs = getComputedStyle(el)
      return { name: cs.animationName, shadow: cs.boxShadow }
    })
    const painted = colourDistance(await stripAbove(GLOW_BAR), await stripAbove(PLAIN_BAR))
    await page.emulateMedia({ reducedMotion: "no-preference" })
    eq(still.name, "none", "animation removed")
    eq(still.shadow !== "none", true, "halo still declared")
    eq(painted > 8, true, `static halo still paints (distance ${painted.toFixed(1)})`)
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

  await test("glow controls: --glow-duration and --glow-strength come from an ancestor", async () => {
    const glowBar = (row) => page.locator(`[data-pg="${row}"] .progress--glow`)
    eq(
      await glowBar("progress-glow").evaluate((el) => getComputedStyle(el).animationDuration),
      "2s",
      "precondition: the default row breathes on the 2s fallback",
    )
    eq(
      await glowBar("progress-glow-controls").evaluate((el) => getComputedStyle(el).animationDuration),
      "4s",
      "the wrapper's --glow-duration is inherited",
    )
    eq(
      await page
        .locator('[data-pg="progress-glow-controls"] .progress[data-state="indeterminate"] .progress-indicator')
        .evaluate((el) => getComputedStyle(el).animationDuration),
      "1.5s",
      "the indeterminate sweep keeps its own literal — it is a loading loop, not a halo",
    )

    // The halo at rest: with the loop stopped the box-shadow is the 0%/100%
    // keyframe, so the two rows differ by strength alone.
    await page.emulateMedia({ reducedMotion: "reduce" })
    const dimmed = await glowBar("progress-glow-controls").evaluate((el) => getComputedStyle(el).boxShadow)
    const full = await glowBar("progress-glow").evaluate((el) => getComputedStyle(el).boxShadow)
    await page.emulateMedia({ reducedMotion: "no-preference" })
    eq(full !== "none", true, "precondition: the default row still declares a halo at rest")
    eq(dimmed !== full, true, `the halo changes with --glow-strength (${full} vs ${dimmed})`)

    const mix = "color-mix(in oklab, var(--primary) calc(18% * var(--glow-strength, 1)), transparent)"
    const strong = await haloLuma('[data-pg="progress-glow"]', mix)
    const weak = await haloLuma('[data-pg="progress-glow-controls"]', mix)
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

  await test("glow shape: a crisp ring that swells, no blur", async () => {
    const bar = page.locator('[data-pg="progress-glow"] .progress--glow')
    eq(geometry((await frameAt(bar, 0)).shadow), " 0px 0px 0px 2px", "rest: one crisp 2px ring")
    eq(geometry((await frameAt(bar, 0.5)).shadow), " 0px 0px 0px 4px", "peak: one crisp 4px ring")
  })

  await test("animated demo settles at 66", async () => {
    await page.waitForFunction(
      () => document.querySelectorAll(".progress")[0]?.getAttribute("aria-valuenow") === "66",
    )
  })
}
