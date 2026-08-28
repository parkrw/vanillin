export default async function run({ page, baseUrl, test, eq, near, repoRoot }) {
  await page.goto(`${baseUrl}/#popover`)

  const trigger = page.locator('button:has-text("Open popover")')

  // Helper: wait for exactly one :popover-open, return it.
  const waitOpen = () => page.waitForSelector(".popover:popover-open")
  // Helper: wait until no popover is :popover-open AND React has synced
  // (data-state="closed"). The native hide happens before React re-renders,
  // so checking :popover-open alone would race.
  const waitClosed = () =>
    page.waitForFunction(() => {
      const popovers = document.querySelectorAll(".popover")
      return (
        popovers.length > 0 &&
        [...popovers].every(
          (el) => !el.matches(":popover-open") && el.dataset.state === "closed"
        )
      )
    })

  await test("trigger click opens with :popover-open, data-state, positioned below trigger", async () => {
    await trigger.click()
    const el = await waitOpen()
    eq(await el.evaluate((e) => e.matches(":popover-open")), true, ":popover-open")
    eq(await el.getAttribute("data-state"), "open", "data-state")
    eq(await el.getAttribute("data-side"), "bottom", "data-side")

    const positions = await page.evaluate(() => {
      const t = document.querySelector('[data-pg="popover-trigger"]')
      const c = document.querySelector(".popover:popover-open")
      const tr = t.getBoundingClientRect()
      const cr = c.getBoundingClientRect()
      return { triggerBottom: tr.bottom, contentTop: cr.top }
    })
    eq(positions.contentTop >= positions.triggerBottom, true, "below trigger")
  })

  await test("Escape closes and state syncs (can reopen)", async () => {
    await page.keyboard.press("Escape")
    await waitClosed()

    // reopen to prove state synced back
    await trigger.click()
    const el = await waitOpen()
    eq(await el.evaluate((e) => e.matches(":popover-open")), true, "reopened")
    await page.keyboard.press("Escape")
    await waitClosed()
  })

  await test("outside click closes and state syncs (can reopen)", async () => {
    await trigger.click()
    await waitOpen()

    // click well outside
    await page.mouse.click(5, 5)
    await waitClosed()

    // reopen to confirm state sync
    await trigger.click()
    const el = await waitOpen()
    eq(await el.getAttribute("data-state"), "open", "reopened after outside click")
    await page.keyboard.press("Escape")
    await waitClosed()
  })

  await test("side and align props respected", async () => {
    const rightTrigger = page.locator('button:has-text("Right-start")')
    await rightTrigger.click()
    const el = await waitOpen()

    eq(await el.getAttribute("data-side"), "right", "data-side=right")
    eq(await el.getAttribute("data-align"), "start", "data-align=start")

    const positions = await page.evaluate(() => {
      const t = document.querySelector('[data-pg="right-trigger"]')
      const c = document.querySelector(".popover:popover-open")
      const tr = t.getBoundingClientRect()
      const cr = c.getBoundingClientRect()
      return { triggerRight: tr.right, contentLeft: cr.left }
    })
    eq(positions.contentLeft >= positions.triggerRight, true, "right of trigger")

    await page.keyboard.press("Escape")
    await waitClosed()
  })

  await test("controlled open/onOpenChange", async () => {
    const readout = page.locator('[data-pg="controlled-popover-state"]')
    eq(await readout.textContent(), "closed", "initially closed")

    await page.locator('button:has-text("Open controlled")').click()
    await waitOpen()
    eq(await readout.textContent(), "open", "state says open")

    await page.keyboard.press("Escape")
    await waitClosed()
    eq(await readout.textContent(), "closed", "state says closed after Esc")
  })

  await test("focus is NOT trapped - tab moves out of popover", async () => {
    await trigger.click()
    await waitOpen()

    // Tab repeatedly to move focus past popover contents and out
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press("Tab")
    }

    const focusInPopover = await page.evaluate(() => {
      const popover = document.querySelector(".popover:popover-open")
      return popover && popover.contains(document.activeElement)
    })
    eq(focusInPopover, false, "focus escaped popover")

    await page.keyboard.press("Escape")
    await waitClosed()
  })

  await test("trigger has correct aria attributes", async () => {
    eq(await trigger.getAttribute("aria-haspopup"), "dialog", "aria-haspopup")
    eq(await trigger.getAttribute("aria-expanded"), "false", "aria-expanded when closed")

    await trigger.click()
    await waitOpen()
    eq(await trigger.getAttribute("aria-expanded"), "true", "aria-expanded when open")

    const controls = await trigger.getAttribute("aria-controls")
    const controlledEl = await page.evaluate((id) => !!document.getElementById(id), controls)
    eq(controlledEl, true, "aria-controls points to real element")

    await page.keyboard.press("Escape")
    await waitClosed()
  })

  await test("content has aria-labelledby and aria-describedby", async () => {
    await trigger.click()
    const el = await waitOpen()

    const [title, desc] = await el.evaluate((e) => [
      document.getElementById(e.getAttribute("aria-labelledby"))?.textContent,
      document.getElementById(e.getAttribute("aria-describedby"))?.textContent,
    ])
    eq(title, "Popover title", "labelledby")
    eq(desc, "Popover description text.", "describedby")

    await page.keyboard.press("Escape")
    await waitClosed()
  })

  await test("close triggers an exit animation", async () => {
    // Playwright defaults to prefers-reduced-motion: no-preference,
    // so transitions play normally.
    await trigger.click()
    await waitOpen()

    // Close via Escape — hidePopover fires, exit transition begins
    await page.keyboard.press("Escape")

    // Immediately after Esc, the element should be animating (exit transition
    // on opacity/transform while overlay keeps it in the top layer).
    const animating = await page.evaluate(() => {
      const el = document.querySelector('[data-pg="popover-trigger"]')
        ?.closest("section")
        ?.querySelector(".popover")
      if (!el) return false
      return el.getAnimations().length > 0
    })
    eq(animating, true, "exit animation running")

    await waitClosed()
  })

  await test("anchored position survives dir=rtl on the root", async () => {
    // The [popover] UA sheet sets inset: 0. With a definite width that
    // over-constrains the box, and CSS 2.1 §10.3.7 drops `left` under RTL —
    // the popover would snap to the viewport edge instead of the anchor.
    await page.evaluate(() => {
      document.documentElement.dir = "rtl"
    })
    try {
      await trigger.click()
      const el = await waitOpen()
      // offsetLeft, not getBoundingClientRect: the enter transition scales the
      // box, but offsetLeft is a layout value and ignores transforms.
      const { usedLeft, styleLeft } = await el.evaluate((e) => ({
        usedLeft: e.offsetLeft,
        styleLeft: parseFloat(e.style.left),
      }))
      near(usedLeft, styleLeft, 1.5, "used left tracks the inline left")

      await page.keyboard.press("Escape")
      await waitClosed()
    } finally {
      await page.evaluate(() => {
        document.documentElement.dir = "ltr"
      })
    }
  })

  // Mounted ad hoc rather than added to the docs page: an unnamed popover is a
  // mistake to warn about, not a pattern to document. Every probe goes through
  // the same mount, so a broken fixture cannot pass the titleless case by
  // accident, and console.warn is patched inside the page so each probe's
  // warning count is attributable rather than a total. Closed is enough — the
  // popover element is always in the DOM, so its parts resolve on mount.
  await test("aria references and the dev warning track the accessible name", async () => {
    const probes = await page.evaluate(async (popoverUrl) => {
      const reactModule = await import("/@id/react")
      const h = reactModule.createElement ?? reactModule.default.createElement
      const domModule = await import("/@id/react-dom/client")
      const createRoot = domModule.createRoot ?? domModule.default.createRoot
      const { Popover, PopoverContent, PopoverHeader, PopoverTitle, PopoverDescription } =
        await import(popoverUrl)

      const captured = []
      const originalWarn = console.warn
      console.warn = (...args) => {
        captured.push(String(args[0]))
        originalWarn(...args)
      }
      const warnCount = () => captured.filter((m) => m.includes("has no <PopoverTitle>")).length

      const settle = () => new Promise((resolve) => setTimeout(resolve, 60))
      const probe = async (contentProps, children) => {
        const before = warnCount()
        const host = document.createElement("div")
        document.body.appendChild(host)
        // React scopes useId per root but does not namespace across roots, so an
        // ad-hoc root can mint an id the docs page already used — which would make
        // getElementById find a foreign title and silence the warning.
        const root = createRoot(host, { identifierPrefix: "popover-probe-" })
        root.render(h(Popover, null, h(PopoverContent, contentProps, children)))
        await settle()
        const el = host.querySelector(".popover")
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

      const external = document.createElement("h3")
      external.id = "probe-external-heading"
      external.textContent = "External heading"
      document.body.appendChild(external)

      try {
        const header = (title, description) =>
          h(
            PopoverHeader,
            null,
            h(PopoverTitle, null, title),
            h(PopoverDescription, null, description)
          )
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
        }
      } finally {
        console.warn = originalWarn
        external.remove()
      }
    }, `/@fs/${repoRoot.replace(/^\//, "")}ui/popover/popover.jsx`)

    eq(probes.titleless.hasLabelledby, false, "titleless: no aria-labelledby")
    eq(probes.titleless.hasDescribedby, false, "titleless: no aria-describedby")
    eq(probes.titleless.warned, 1, "titleless: warned once")

    eq(probes.titled.hasLabelledby, true, "titled: aria-labelledby emitted")
    eq(probes.titled.titleText, "Probe title", "titled: labelledby resolves to the title")
    eq(probes.titled.hasDescribedby, true, "titled: aria-describedby emitted")
    eq(probes.titled.warned, 0, "titled: silent")

    // An empty PopoverTitle renders an <h3> whose id resolves but names nothing,
    // so an existence-only check would ship the same unnamed popover silently.
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
  })
}
