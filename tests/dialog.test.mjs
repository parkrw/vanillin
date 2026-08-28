export default async function run({ page, baseUrl, test, eq, repoRoot }) {
  await page.goto(`${baseUrl}/#dialog`)

  const trigger = page.locator('button:has-text("Open dialog")')
  const dialog = page.locator(".dialog")

  await test("trigger opens a modal dialog", async () => {
    await trigger.click()
    await page.waitForSelector('.dialog[data-state="open"]')
    eq(await dialog.evaluate((el) => el.matches(":modal")), true, "modal")
    eq(
      await page.evaluate(() => getComputedStyle(document.body).overflow),
      "hidden",
      "body scroll locked"
    )
  })

  await test("Escape closes and returns focus to the trigger", async () => {
    await page.keyboard.press("Escape")
    await page.waitForSelector(".dialog", { state: "detached" })
    eq(
      await page.evaluate(() => getComputedStyle(document.body).overflow),
      "visible",
      "body scroll unlocked"
    )
    eq(
      await page.evaluate(() => document.activeElement.textContent),
      "Open dialog",
      "focus returned"
    )
  })

  await test("backdrop click closes", async () => {
    await trigger.click()
    await page.waitForSelector('.dialog[data-state="open"]')
    await page.mouse.click(5, 5)
    await page.waitForSelector(".dialog", { state: "detached" })
  })

  await test("click inside the content does not close", async () => {
    await trigger.click()
    await page.waitForSelector('.dialog[data-state="open"]')
    await dialog.locator('p:has-text("Update your display name")').click()
    eq(await dialog.getAttribute("data-state"), "open")
    await page.keyboard.press("Escape")
    await page.waitForSelector(".dialog", { state: "detached" })
  })

  await test("title and description are wired via aria", async () => {
    await trigger.click()
    await page.waitForSelector('.dialog[data-state="open"]')
    const [title, description] = await dialog.evaluate((el) => [
      document.getElementById(el.getAttribute("aria-labelledby"))?.textContent,
      document.getElementById(el.getAttribute("aria-describedby"))?.textContent,
    ])
    eq(title, "Edit profile", "labelledby")
    eq(
      description,
      "Make changes to your profile here. Click save when you're done.",
      "describedby"
    )
  })

  await test("the X button closes", async () => {
    await dialog.locator(".dialog-close").click()
    await page.waitForSelector(".dialog", { state: "detached" })
  })

  await test("DialogClose closes", async () => {
    await trigger.click()
    await page.waitForSelector('.dialog[data-state="open"]')
    await dialog.locator('button:has-text("Cancel")').click()
    await page.waitForSelector(".dialog", { state: "detached" })
  })

  await test("controlled mode reports state through onOpenChange", async () => {
    const readout = page.locator('[data-pg="controlled-state"]')
    eq(await readout.textContent(), "closed")
    await page.locator('button:has-text("Open controlled")').click()
    await page.waitForSelector('.dialog[data-state="open"]')
    eq(await readout.textContent(), "open")
    await page.keyboard.press("Escape")
    await page.waitForSelector(".dialog", { state: "detached" })
    eq(await readout.textContent(), "closed")
  })

  await test("container query flips layout between wide and narrow", async () => {
    // Wide: default 1280px viewport → dialog 32rem → content > 24rem → query fires
    await trigger.click()
    await page.waitForSelector('.dialog[data-state="open"]')
    const wideAlign = await dialog.evaluate(
      (el) => getComputedStyle(el.querySelector(".dialog-header")).textAlign
    )
    const wideDir = await dialog.evaluate(
      (el) => getComputedStyle(el.querySelector(".dialog-footer")).flexDirection
    )
    await page.keyboard.press("Escape")
    await page.waitForSelector(".dialog", { state: "detached" })

    // Narrow: 320px viewport → dialog max-width calc(100% - 2rem) = 288px < 24rem
    await page.setViewportSize({ width: 320, height: 720 })
    await trigger.click()
    await page.waitForSelector('.dialog[data-state="open"]')
    const narrowAlign = await dialog.evaluate(
      (el) => getComputedStyle(el.querySelector(".dialog-header")).textAlign
    )
    const narrowDir = await dialog.evaluate(
      (el) => getComputedStyle(el.querySelector(".dialog-footer")).flexDirection
    )
    await page.keyboard.press("Escape")
    await page.waitForSelector(".dialog", { state: "detached" })
    await page.setViewportSize({ width: 1280, height: 720 })

    eq(wideAlign, "start", "wide: header text-align from container query")
    eq(wideDir, "row", "wide: footer flex-direction from container query")
    eq(narrowAlign, "center", "narrow: header falls back to center")
    eq(narrowDir, "column-reverse", "narrow: footer falls back to column-reverse")
  })

  // Mounted ad hoc rather than added to the docs page: an unnamed dialog is a
  // mistake to warn about, not a pattern to document. Every probe goes through
  // the same mount, so a broken fixture cannot pass the titleless case by
  // accident, and console.warn is patched inside the page so each probe's
  // warning count is attributable rather than a total.
  await test("aria references and the dev warning track the accessible name", async () => {
    const probes = await page.evaluate(async (dialogUrl) => {
      const reactModule = await import("/@id/react")
      const h = reactModule.createElement ?? reactModule.default.createElement
      const domModule = await import("/@id/react-dom/client")
      const createRoot = domModule.createRoot ?? domModule.default.createRoot
      const { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } =
        await import(dialogUrl)

      const captured = []
      const originalWarn = console.warn
      console.warn = (...args) => {
        captured.push(String(args[0]))
        originalWarn(...args)
      }
      const warnCount = () => captured.filter((m) => m.includes("has no <DialogTitle>")).length

      const settle = () => new Promise((resolve) => setTimeout(resolve, 60))
      const probe = async (contentProps, children) => {
        const before = warnCount()
        const host = document.createElement("div")
        document.body.appendChild(host)
        // React scopes useId per root but does not namespace across roots, so an
        // ad-hoc root can mint an id the docs page already used — which would make
        // getElementById find a foreign title and silence the warning.
        const root = createRoot(host, { identifierPrefix: "dialog-probe-" })
        root.render(h(Dialog, { defaultOpen: true }, h(DialogContent, contentProps, children)))
        await settle()
        const el = host.querySelector("dialog")
        const labelledby = el.getAttribute("aria-labelledby")
        const out = {
          labelledby,
          hasLabelledby: el.hasAttribute("aria-labelledby"),
          hasDescribedby: el.hasAttribute("aria-describedby"),
          label: el.getAttribute("aria-label"),
          titleText: labelledby ? document.getElementById(labelledby)?.textContent : null,
          warned: warnCount() - before,
        }
        root.unmount()
        host.remove()
        await settle()
        return out
      }

      const external = document.createElement("h2")
      external.id = "probe-external-heading"
      external.textContent = "External heading"
      document.body.appendChild(external)

      try {
        const header = (title, description) =>
          h(DialogHeader, null, h(DialogTitle, null, title), h(DialogDescription, null, description))
        return {
          titleless: await probe({}),
          titled: await probe({}, header("Probe title", "Probe description")),
          emptyTitle: await probe({}, header(undefined, undefined)),
          iconTitle: await probe(
            {},
            header(h("img", { src: "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7", alt: "Delete" }), "Probe description")
          ),
          hiddenIconTitle: await probe(
            {},
            header(h("svg", { "aria-hidden": "true", viewBox: "0 0 24 24" }), "Probe description")
          ),
          ariaLabel: await probe({ "aria-label": "Probe label" }),
          blankAriaLabel: await probe({ "aria-label": "   " }),
          ariaLabelledby: await probe({ "aria-labelledby": "probe-external-heading" }),
          bodyOverflow: document.body.style.overflow,
        }
      } finally {
        console.warn = originalWarn
        external.remove()
      }
    }, `/@fs/${repoRoot.replace(/^\//, "")}ui/dialog/dialog.jsx`)

    eq(probes.titleless.hasLabelledby, false, "titleless: no aria-labelledby")
    eq(probes.titleless.hasDescribedby, false, "titleless: no aria-describedby")
    eq(probes.titleless.warned, 1, "titleless: warned once")

    eq(probes.titled.hasLabelledby, true, "titled: aria-labelledby emitted")
    eq(probes.titled.titleText, "Probe title", "titled: labelledby resolves to the title")
    eq(probes.titled.hasDescribedby, true, "titled: aria-describedby emitted")
    eq(probes.titled.warned, 0, "titled: silent")

    // An empty DialogTitle renders an <h2> whose id resolves but names nothing,
    // so an existence-only check would ship the same unnamed dialog silently.
    eq(probes.emptyTitle.hasLabelledby, false, "empty title: no aria-labelledby")
    eq(probes.emptyTitle.warned, 1, "empty title: warned once")

    // An icon- or image-only title has an accessible name that textContent
    // cannot see, so element content must count or a valid name is discarded.
    eq(probes.iconTitle.hasLabelledby, true, "icon title: aria-labelledby kept")
    eq(probes.iconTitle.warned, 0, "icon title: silent")

    // An aria-hidden icon is the one kind of element content that names nothing,
    // so it must not be mistaken for a title.
    eq(probes.hiddenIconTitle.hasLabelledby, false, "aria-hidden icon title: no aria-labelledby")
    eq(probes.hiddenIconTitle.warned, 1, "aria-hidden icon title: warned once")

    eq(probes.ariaLabel.label, "Probe label", "aria-label: consumer label kept")
    eq(probes.ariaLabel.hasLabelledby, false, "aria-label: no dangling aria-labelledby")
    eq(probes.ariaLabel.warned, 0, "aria-label: silent")

    eq(probes.blankAriaLabel.warned, 1, "blank aria-label: warned once")

    eq(
      probes.ariaLabelledby.labelledby,
      "probe-external-heading",
      "aria-labelledby: consumer id wins spread order"
    )
    eq(probes.ariaLabelledby.warned, 0, "aria-labelledby: silent")

    eq(probes.bodyOverflow, "", "probe mounts left the body scroll lock released")
  })
}
