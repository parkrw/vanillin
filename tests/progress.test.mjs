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
      .locator('.progress[data-state="indeterminate"] .progress-indicator')
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
      .locator('.progress[data-state="indeterminate"] .progress-indicator')
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

  await test("animated demo settles at 66", async () => {
    await page.waitForFunction(
      () => document.querySelectorAll(".progress")[0]?.getAttribute("aria-valuenow") === "66",
    )
  })
}
