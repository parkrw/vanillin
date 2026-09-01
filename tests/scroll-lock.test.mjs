export default async function run({ page, baseUrl, test, eq, repoRoot }) {
  await page.goto(`${baseUrl}/#dialog`)
  await page.locator('button:has-text("Open dialog")').waitFor()

  const dialogUrl = `/@fs/${repoRoot.replace(/^\//, "")}ui/dialog/dialog.jsx`
  const lockUrl = `/@fs/${repoRoot.replace(/^\//, "")}lib/scroll-lock.js`

  // Desktop Chrome cannot reproduce the iOS touch-pan that `overflow: hidden`
  // fails to stop, so these assert the mechanism that does stop it: the body
  // is taken out of flow at a negative offset, and the offset comes back.
  await test("lock fixes the body at the saved offset and unlock restores it", async () => {
    const probe = await page.evaluate(async (url) => {
      const { lockScroll, unlockScroll } = await import(url)

      // Own spacer rather than the page's own height: the docs pages differ in
      // length, and a page shorter than the target offset would scroll to its
      // own maximum and pass the restore check against the wrong number.
      const spacer = document.createElement("div")
      spacer.style.height = "3000px"
      document.body.appendChild(spacer)
      window.scrollTo(0, 500)

      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
      const before = {
        scrollY: window.scrollY,
        position: getComputedStyle(document.body).position,
      }

      lockScroll()
      const locked = {
        position: getComputedStyle(document.body).position,
        top: document.body.style.top,
        overflow: document.body.style.overflow,
        paddingRight: document.body.style.paddingRight,
      }

      unlockScroll()
      const after = {
        scrollY: window.scrollY,
        position: document.body.style.position,
        top: document.body.style.top,
        overflow: document.body.style.overflow,
        paddingRight: document.body.style.paddingRight,
      }

      spacer.remove()
      window.scrollTo(0, 0)
      return { before, locked, after, scrollbarWidth }
    }, lockUrl)

    eq(probe.before.scrollY, 500, "precondition: page really scrolled to 500")
    eq(probe.before.position, "static", "counter-precondition: body starts in flow")

    eq(probe.locked.position, "fixed", "lock takes the body out of flow")
    eq(probe.locked.top, "-500px", "lock holds the page at the saved offset")
    eq(probe.locked.overflow, "hidden", "lock keeps the desktop overflow guard")
    eq(
      probe.locked.paddingRight,
      probe.scrollbarWidth > 0 ? `${probe.scrollbarWidth}px` : "",
      "lock compensates exactly the scrollbar width it measured"
    )

    eq(probe.after.scrollY, 500, "unlock restores the exact offset")
    eq(probe.after.position, "", "unlock clears the inline position")
    eq(probe.after.top, "", "unlock clears the inline top")
    eq(probe.after.overflow, "", "unlock clears the inline overflow")
    eq(probe.after.paddingRight, "", "unlock clears the inline padding")
  })

  // Dialog-over-dialog is the case the lock count exists for: the inner one
  // closing must not hand scrolling back while the outer one is still open.
  await test("nested dialogs hold the lock until the last one closes", async () => {
    const probe = await page.evaluate(
      async ([dialogUrl, reactHost]) => {
        const reactModule = await import("/@id/react")
        const h = reactModule.createElement ?? reactModule.default.createElement
        const domModule = await import("/@id/react-dom/client")
        const createRoot = domModule.createRoot ?? domModule.default.createRoot
        const { Dialog, DialogContent, DialogTitle } = await import(dialogUrl)

        const spacer = document.createElement("div")
        spacer.style.height = "3000px"
        document.body.appendChild(spacer)
        window.scrollTo(0, 500)

        const settle = () => new Promise((resolve) => setTimeout(resolve, 80))
        const mount = (prefix, label) => {
          const host = document.createElement("div")
          host.dataset.probe = reactHost
          document.body.appendChild(host)
          const root = createRoot(host, { identifierPrefix: prefix })
          root.render(
            h(
              Dialog,
              { defaultOpen: true },
              h(DialogContent, null, h(DialogTitle, null, label))
            )
          )
          return { root, host }
        }

        const outer = mount("lock-outer-", "Outer")
        await settle()
        const outerOnly = getComputedStyle(document.body).position

        const inner = mount("lock-inner-", "Inner")
        await settle()
        const bothOpen = getComputedStyle(document.body).position

        inner.root.unmount()
        inner.host.remove()
        await settle()
        const innerClosed = {
          position: getComputedStyle(document.body).position,
          top: document.body.style.top,
          scrollY: window.scrollY,
        }

        outer.root.unmount()
        outer.host.remove()
        await settle()
        const allClosed = {
          position: document.body.style.position,
          scrollY: window.scrollY,
        }

        spacer.remove()
        window.scrollTo(0, 0)
        return { outerOnly, bothOpen, innerClosed, allClosed }
      },
      [dialogUrl, "scroll-lock"]
    )

    eq(probe.outerOnly, "fixed", "precondition: the outer dialog locked the body")
    eq(probe.bothOpen, "fixed", "still locked with both dialogs open")
    eq(probe.innerClosed.position, "fixed", "inner close leaves the outer lock standing")
    eq(probe.innerClosed.top, "-500px", "inner close keeps the outer dialog's saved offset")
    eq(probe.innerClosed.scrollY, 0, "counter-precondition: still fixed, so the document sits at 0")
    eq(probe.allClosed.position, "", "last close releases the lock")
    eq(probe.allClosed.scrollY, 500, "last close restores the offset the first lock saved")
  })
}
