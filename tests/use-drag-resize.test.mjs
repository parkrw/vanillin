export default async function run({ page, baseUrl, test, eq, repoRoot }) {
  await page.goto(`${baseUrl}/#primitives`)
  await page.waitForSelector('[data-pg="drag-x-handle"]', { timeout: 5000 })

  const hookUrl = `/@fs/${repoRoot.replace(/^\//, "")}lib/use-drag-resize.js`
  const panelSize = (id, prop) =>
    page.$eval(`[data-pg="${id}-panel"]`, (el, p) => el.getBoundingClientRect()[p], prop)
  const handleBox = async (id) => {
    const handle = await page.$(`[data-pg="${id}-handle"]`)
    await handle.scrollIntoViewIfNeeded()
    return handle.boundingBox()
  }
  const bodyCursor = () => page.evaluate(() => document.body.style.cursor)
  const aria = (id, name) => page.getAttribute(`[data-pg="${id}-handle"]`, name)

  // Start the drag at the handle's centre, move to (dx, dy) from there.
  const drag = async (id, dx, dy, { release = true } = {}) => {
    const b = await handleBox(id)
    const x = b.x + b.width / 2
    const y = b.y + b.height / 2
    await page.mouse.move(x, y)
    await page.mouse.down()
    await page.mouse.move(x + dx, y + dy, { steps: 4 })
    if (release) await page.mouse.up()
  }

  await test("drag grows and shrinks the element and clamps at max and min", async () => {
    eq(await panelSize("drag-x", "width"), 160, "starts at defaultSize")
    await drag("drag-x", 40, 0)
    eq(await panelSize("drag-x", "width"), 200, "moved by the pointer delta")
    await drag("drag-x", 500, 0)
    eq(await panelSize("drag-x", "width"), 240, "clamped at max, pointer far outside the handle")
    await drag("drag-x", -900, 0)
    eq(await panelSize("drag-x", "width"), 80, "clamped at min")
    eq(await aria("drag-x", "aria-valuenow"), "80", "aria-valuenow follows size")
  })

  await test("cursor is set during the drag, cleared on release, and the drag stops tracking", async () => {
    await drag("drag-x", 10, 0, { release: false })
    eq(await bodyCursor(), "col-resize", "x axis cursor while dragging")
    eq(await aria("drag-x", "data-dragging"), "", "handle marked dragging")
    await page.mouse.up()
    eq(await bodyCursor(), "", "cursor cleared")
    eq(await aria("drag-x", "data-dragging"), null, "dragging mark cleared")
    const before = await panelSize("drag-x", "width")
    await page.mouse.move(10, 10)
    eq(await panelSize("drag-x", "width"), before, "moves after release do not resize")

    await drag("drag-y", 0, -10, { release: false })
    eq(await bodyCursor(), "row-resize", "y axis cursor while dragging")
    await page.mouse.up()
    eq(await bodyCursor(), "", "y cursor cleared")
  })

  await test("reverse grows the element against the pointer", async () => {
    const start = await panelSize("drag-y", "height")
    await drag("drag-y", 0, -30)
    eq(await panelSize("drag-y", "height"), start + 30, "dragging up grows a bottom-anchored element")
    await drag("drag-y", 0, 20)
    eq(await panelSize("drag-y", "height"), start + 10, "dragging down shrinks it")
  })

  await test("under rtl the horizontal axis flips", async () => {
    eq(await panelSize("drag-rtl", "width"), 160, "starts at defaultSize")
    await drag("drag-rtl", -40, 0)
    eq(await panelSize("drag-rtl", "width"), 200, "dragging toward the start edge grows it")
    await drag("drag-rtl", 20, 0)
    eq(await panelSize("drag-rtl", "width"), 180, "dragging away shrinks it")
    await drag("drag-x", 20, 0)
    const ltr = await panelSize("drag-x", "width")
    eq(ltr > 80, true, "the ltr handle is unaffected (counter-precondition)")
  })

  await test("keyboard steps with the arrows and jumps with Home and End", async () => {
    await page.focus('[data-pg="drag-x-handle"]')
    await page.keyboard.press("Home")
    eq(await panelSize("drag-x", "width"), 80, "Home goes to min")
    await page.keyboard.press("ArrowRight")
    eq(await panelSize("drag-x", "width"), 90, "ArrowRight steps by 10")
    await page.keyboard.press("ArrowLeft")
    await page.keyboard.press("ArrowLeft")
    eq(await panelSize("drag-x", "width"), 80, "ArrowLeft clamps at min")
    await page.keyboard.press("End")
    eq(await panelSize("drag-x", "width"), 240, "End goes to max")
    await page.keyboard.press("ArrowRight")
    eq(await panelSize("drag-x", "width"), 240, "ArrowRight clamps at max")

    await page.focus('[data-pg="drag-y-handle"]')
    await page.keyboard.press("Home")
    await page.keyboard.press("ArrowUp")
    eq(await panelSize("drag-y", "height"), 90, "reverse: ArrowUp grows")
    await page.keyboard.press("ArrowDown")
    eq(await panelSize("drag-y", "height"), 80, "reverse: ArrowDown shrinks")

    await page.focus('[data-pg="drag-rtl-handle"]')
    await page.keyboard.press("Home")
    await page.keyboard.press("ArrowLeft")
    eq(await panelSize("drag-rtl", "width"), 90, "rtl: ArrowLeft grows")
  })

  await test("the handle is a separator with value, range and orientation", async () => {
    eq(await aria("drag-x", "role"), "separator", "role")
    eq(await aria("drag-x", "tabindex"), "0", "focusable")
    eq(await aria("drag-x", "aria-valuemin"), "80", "valuemin")
    eq(await aria("drag-x", "aria-valuemax"), "240", "valuemax")
    eq(await aria("drag-x", "aria-orientation"), "vertical", "x axis separator is vertical")
    eq(await aria("drag-y", "aria-orientation"), "horizontal", "y axis separator is horizontal")
  })

  await test("unmounting mid-drag clears the cursor and the window listeners", async () => {
    const result = await page.evaluate(async (hookUrl) => {
      const reactModule = await import("/@id/react")
      const h = reactModule.createElement ?? reactModule.default.createElement
      const domModule = await import("/@id/react-dom/client")
      const createRoot = domModule.createRoot ?? domModule.default.createRoot
      const { useDragResize } = await import(hookUrl)
      const settle = () => new Promise((r) => setTimeout(r, 40))

      let latest
      function Probe() {
        const r = useDragResize({ min: 0, max: 100, defaultSize: 50 })
        latest = r
        return h("div", { ...r.handleProps, id: "unmount-handle" })
      }
      const host = document.createElement("div")
      document.body.appendChild(host)
      const root = createRoot(host)
      root.render(h(Probe))
      await settle()
      const el = document.getElementById("unmount-handle")
      el.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, button: 0, pointerId: 7, clientX: 0, clientY: 0 }))
      await settle()
      const during = document.body.style.cursor
      root.unmount()
      host.remove()
      const after = document.body.style.cursor
      const sizeBefore = latest.size
      window.dispatchEvent(new PointerEvent("pointermove", { pointerId: 7, clientX: 30, clientY: 0 }))
      await settle()
      return { during, after, resized: latest.size !== sizeBefore }
    }, hookUrl)
    eq(result.during, "col-resize", "precondition: drag began")
    eq(result.after, "", "cursor cleared on unmount")
    eq(result.resized, false, "listeners removed on unmount")
  })
}
