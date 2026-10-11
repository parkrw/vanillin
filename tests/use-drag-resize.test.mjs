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
    eq(await panelSize("drag-rtl", "width"), 200, "dragging toward the end edge grows it")
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

  // A bare harness: disabled, controlled and unbounded modes have no demo.
  const harness = (options, steps) =>
    page.evaluate(
      async ({ hookUrl, options, steps }) => {
        const reactModule = await import("/@id/react")
        const h = reactModule.createElement ?? reactModule.default.createElement
        const domModule = await import("/@id/react-dom/client")
        const createRoot = domModule.createRoot ?? domModule.default.createRoot
        const { useDragResize } = await import(hookUrl)
        const settle = () => new Promise((r) => setTimeout(r, 40))

        const changes = []
        function Probe() {
          const r = useDragResize({ ...options, onSizeChange: (n) => changes.push(n) })
          return h("div", { ...r.handleProps, id: "probe-handle", "data-size": String(r.size) })
        }
        const host = document.createElement("div")
        document.body.appendChild(host)
        const root = createRoot(host)
        root.render(h(Probe))
        await settle()
        const el = () => document.getElementById("probe-handle")
        const pointer = (type, target, init) =>
          target.dispatchEvent(new PointerEvent(type, { bubbles: true, button: 0, pointerId: 7, ...init }))
        const out = { snapshots: {}, prevented: {} }
        const key = (k) => {
          out.prevented[k] = !el().dispatchEvent(
            new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true })
          )
        }
        for (const step of steps) {
          if (step.down) pointer("pointerdown", el(), { clientX: 0, clientY: 0, ...step.down })
          if (step.move != null)
            pointer("pointermove", window, { clientX: step.move, clientY: 0, ...step.moveInit })
          if (step.up) pointer("pointerup", window, {})
          if (step.cancel) pointer("pointercancel", window, {})
          if (step.key) key(step.key)
          if (step.unmount) {
            root.unmount()
          } else {
            await settle()
          }
          if (step.snap) {
            out.snapshots[step.snap] = {
              cursor: document.body.style.cursor,
              userSelect: document.body.style.userSelect,
              changes: changes.slice(),
              attrs: el()
                ? {
                    size: el().dataset.size,
                    tabindex: el().getAttribute("tabindex"),
                    valuemax: el().getAttribute("aria-valuemax"),
                    disabled: el().getAttribute("aria-disabled"),
                  }
                : null,
            }
          }
        }
        if (el()) root.unmount()
        host.remove()
        return out
      },
      { hookUrl, options, steps }
    )

  await test("unmounting mid-drag clears the cursor and removes the window listeners", async () => {
    const { snapshots } = await harness({ min: 0, max: 100, defaultSize: 50 }, [
      { down: true, move: 10, snap: "during" },
      { unmount: true, snap: "unmounted" },
      { move: 30, snap: "after" },
    ])
    eq(snapshots.during.cursor, "col-resize", "precondition: drag began")
    eq(snapshots.during.changes.join(), "60", "precondition: the drag reports changes")
    eq(snapshots.unmounted.cursor, "", "cursor cleared on unmount")
    eq(snapshots.after.changes.join(), "60", "no change reported after unmount")
  })

  await test("a secondary button does not start a drag, and another pointer does not steer one", async () => {
    const right = await harness({ min: 0, max: 100, defaultSize: 50 }, [
      { down: { button: 2 }, move: 20, snap: "s" },
    ])
    eq(right.snapshots.s.changes.length, 0, "right press ignored")
    eq(right.snapshots.s.cursor, "", "no cursor")
    const foreign = await harness({ min: 0, max: 100, defaultSize: 50 }, [
      { down: true, move: 10, snap: "own" },
      { move: 40, moveInit: { pointerId: 9 }, snap: "other" },
    ])
    eq(foreign.snapshots.own.changes.join(), "60", "precondition: own pointer drives the drag")
    eq(foreign.snapshots.other.changes.join(), "60", "another pointer's moves are ignored")
  })

  await test("pointercancel ends the drag and clears the cursor and selection lock", async () => {
    const { snapshots } = await harness({ min: 0, max: 100, defaultSize: 50 }, [
      { down: true, move: 10, snap: "during" },
      { cancel: true, snap: "cancelled" },
      { move: 25, snap: "after" },
    ])
    eq(snapshots.during.userSelect, "none", "selection locked while dragging")
    eq(snapshots.cancelled.cursor, "", "cursor cleared")
    eq(snapshots.cancelled.userSelect, "", "selection lock cleared")
    eq(snapshots.after.changes.join(), "60", "no tracking after cancel")
  })

  await test("a disabled handle ignores drag and keys and is not focusable", async () => {
    const { snapshots } = await harness({ min: 0, max: 100, defaultSize: 50, disabled: true }, [
      { down: true, move: 20, key: "ArrowRight", snap: "s" },
    ])
    eq(snapshots.s.changes.length, 0, "nothing reported")
    eq(snapshots.s.cursor, "", "no cursor")
    eq(snapshots.s.attrs.tabindex, null, "not in the tab order")
    eq(snapshots.s.attrs.disabled, "true", "aria-disabled")
  })

  await test("controlled size follows the parent and reports every change", async () => {
    const { snapshots } = await harness({ size: 50, min: 0, max: 100, step: 25 }, [
      { key: "ArrowRight", snap: "key" },
      { down: true, move: 500, snap: "drag" },
    ])
    eq(snapshots.key.changes.join(), "75", "step option sets the keyboard step")
    eq(snapshots.key.attrs.size, "50", "the parent has not accepted, so size holds")
    eq(snapshots.drag.changes.join(), "75,100", "the drag clamps at max")
  })

  await test("handled keys suppress their default action and unhandled ones do not", async () => {
    const { prevented } = await harness({ min: 0, max: 100, defaultSize: 50 }, [
      { key: "ArrowRight" },
      { key: "Home" },
      { key: "ArrowUp" },
      { key: "a" },
    ])
    eq(prevented.ArrowRight, true, "ArrowRight would otherwise scroll")
    eq(prevented.Home, true, "Home would otherwise scroll")
    eq(prevented.ArrowUp, false, "the cross-axis arrow is left alone")
    eq(prevented.a, false, "other keys are left alone")
  })

  await test("the initial size defaults to min and is clamped into range", async () => {
    const none = await harness({ min: 30, max: 100 }, [{ snap: "s" }])
    eq(none.snapshots.s.attrs.size, "30", "defaultSize falls back to min")
    const over = await harness({ min: 0, max: 100, defaultSize: 500 }, [{ snap: "s" }])
    eq(over.snapshots.s.attrs.size, "100", "defaultSize above max is clamped")
    const under = await harness({ min: 20, max: 100, defaultSize: 5 }, [{ snap: "s" }])
    eq(under.snapshots.s.attrs.size, "20", "defaultSize below min is clamped")
  })

  await test("a controlled size outside the bounds is read back clamped and steps from there", async () => {
    const { snapshots } = await harness({ size: 300, min: 0, max: 240, step: 10 }, [
      { snap: "mount" },
      { key: "ArrowLeft", snap: "key" },
    ])
    eq(snapshots.mount.attrs.size, "240", "size clamped to max")
    eq(snapshots.key.changes.join(), "230", "a shrink step starts from the clamped value")
  })

  await test("an unbounded max keeps aria-valuemax above the value and End does nothing", async () => {
    const { snapshots } = await harness({ defaultSize: 50, min: 10 }, [
      { key: "End", snap: "end" },
    ])
    eq(snapshots.end.attrs.valuemax, String(Number.MAX_SAFE_INTEGER), "an unbounded range never sits below the value")
    eq(snapshots.end.changes.length, 0, "End reports nothing")
    eq(snapshots.end.attrs.size, "50", "size unchanged")
  })

  await test("pressing the handle with the mouse leaves it focused for the arrow keys", async () => {
    await page.evaluate(() => document.activeElement?.blur())
    await drag("drag-x", 5, 0)
    eq(await page.evaluate(() => document.activeElement?.dataset.pg), "drag-x-handle", "focused after the drag")
  })
}
