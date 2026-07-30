// Samples the Collapsible root's box height every frame across one toggle, and
// reports the two frames the animation does not control: the frame the content
// mounts on, and the frame after it unmounts. Both must be layout no-ops — see
// the spacing-contract tests at the bottom of this file.
async function boundarySteps(page, index, triggerSelector) {
  return page.evaluate(
    async ({ index, triggerSelector }) => {
      const root = document.querySelectorAll(".collapsible")[index]
      const content = () => root.querySelector(".collapsible-content")
      const frames = []
      let raf
      const sample = () => {
        const node = content()
        frames.push({
          root: root.getBoundingClientRect().height,
          content: node ? node.getBoundingClientRect().height : null,
        })
        raf = requestAnimationFrame(sample)
      }
      sample()
      root.querySelector(triggerSelector).click()
      await new Promise((resolve) => setTimeout(resolve, 1400))
      cancelAnimationFrame(raf)

      const mounted = frames.flatMap((frame, i) => (frame.content === null ? [] : i))
      const first = mounted[0]
      const last = mounted.at(-1)
      return {
        // Present only for the direction that crosses that boundary.
        mount:
          first > 0
            ? { step: frames[first].root - frames[first - 1].root, content: frames[first].content }
            : null,
        unmount:
          last < frames.length - 1
            ? { step: frames[last + 1].root - frames[last].root, content: frames[last].content }
            : null,
      }
    },
    { index, triggerSelector },
  )
}

export default async function run({ page, baseUrl, test, eq, near }) {
  await page.goto(`${baseUrl}/#collapsible`)
  await page.waitForSelector(".collapsible")

  const first = page.locator(".collapsible").first()
  const trigger = first.locator('[aria-label="Toggle"]')

  await test("initial state: closed", async () => {
    eq(await trigger.getAttribute("aria-expanded"), "false")
    eq(await trigger.getAttribute("data-state"), "closed")
    eq(await first.getAttribute("data-state"), "closed")
    eq(await first.locator(".collapsible-content").count(), 0)
  })

  await test("click opens and shows content", async () => {
    eq(await trigger.getAttribute("aria-expanded"), "false")
    await trigger.click()
    eq(await trigger.getAttribute("aria-expanded"), "true")
    eq(await first.getAttribute("data-state"), "open")
    const content = first.locator(".collapsible-content")
    await content.waitFor({ state: "attached" })
    eq(await content.getAttribute("data-state"), "open")
  })

  await test("click again closes content", async () => {
    eq(await trigger.getAttribute("data-state"), "open")
    await trigger.click()
    eq(await trigger.getAttribute("aria-expanded"), "false")
    eq(await trigger.getAttribute("data-state"), "closed")
    await page.waitForSelector('.collapsible:first-of-type .collapsible-content', { state: "detached", timeout: 3000 }).catch(() => {})
    // data-state goes to closed; presence unmounts after animation
    eq(await first.getAttribute("data-state"), "closed")
  })

  await test("trigger aria-controls points to content id", async () => {
    await trigger.click()
    await page.waitForSelector('.collapsible-content[data-state="open"]')
    const controlsId = await trigger.getAttribute("aria-controls")
    const content = first.locator(".collapsible-content")
    eq(await content.getAttribute("id"), controlsId)
    await trigger.click()
  })

  await test("defaultOpen starts expanded", async () => {
    const second = page.locator(".collapsible").nth(1)
    eq(await second.getAttribute("data-state"), "open")
    const t = second.locator(".collapsible-trigger")
    eq(await t.getAttribute("aria-expanded"), "true")
    eq(await second.locator(".collapsible-content").isVisible(), true)
  })

  await test("defaultOpen can be closed", async () => {
    const second = page.locator(".collapsible").nth(1)
    const t = second.locator(".collapsible-trigger")
    eq(await t.getAttribute("data-state"), "open")
    await t.click()
    eq(await t.getAttribute("aria-expanded"), "false")
    eq(await second.getAttribute("data-state"), "closed")
  })

  // E2: the content used to carry its own padding and sit in a flex `gap`, so
  // `height: 0` bottomed out at 8px and the last 8px vanished in one frame when
  // usePresence unmounted the node — a visible jump at the tail of close and
  // the head of open. Both demos now put spacing on an inner wrapper instead.
  // Motion item, so pin no-preference rather than inherit the machine's.
  await page.emulateMedia({ reducedMotion: "no-preference" })

  const demos = [
    { index: 0, trigger: '[aria-label="Toggle"]', label: "default" },
    { index: 1, trigger: ".collapsible-trigger", label: "defaultOpen" },
  ]
  for (const demo of demos) {
    for (const direction of ["open", "close"]) {
      await test(`${demo.label} ${direction}: no layout step at the presence boundary`, async () => {
        // Let the previous toggle's animation and unmount finish first.
        await page.waitForTimeout(700)
        const { mount, unmount } = await boundarySteps(page, demo.index, demo.trigger)
        const boundary = direction === "open" ? mount : unmount
        if (!boundary) throw new Error(`no ${direction} boundary frame captured`)
        // The animation's own endpoint must be a genuinely zero-height box:
        // any residue here is padding the border-box floor refuses to collapse.
        near(boundary.content, 0, 0.51, `content height at the ${direction} boundary frame`)
        // And mounting or unmounting a zero-height child must cost the root
        // nothing: any step here is a gap slot the child still occupied.
        near(boundary.step, 0, 0.51, `root box step across the ${direction} boundary`)
      })
    }
  }
  await page.emulateMedia({ reducedMotion: null })
}
