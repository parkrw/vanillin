export default async function run({ page, baseUrl, test, eq, repoRoot }) {
  await page.goto(`${baseUrl}/#select`)
  await page.locator('[data-pg="sel-trigger"]').waitFor()

  const fsUrl = (rel) => `/@fs/${repoRoot.replace(/^\//, "")}${rel}`
  const hookUrl = fsUrl("lib/use-controllable-state.js")
  const selectUrl = fsUrl("ui/select/select.jsx")
  const toggleUrl = fsUrl("ui/toggle/toggle.jsx")

  // A bare hook harness rather than a component: the setter has to be callable
  // twice inside one task, which no user gesture can do.
  await test("setter semantics differ by mode, and only where they should", async () => {
    const probe = await page.evaluate(async (hookUrl) => {
      const reactModule = await import("/@id/react")
      const h = reactModule.createElement ?? reactModule.default.createElement
      const domModule = await import("/@id/react-dom/client")
      const createRoot = domModule.createRoot ?? domModule.default.createRoot
      const { useControllableState } = await import(hookUrl)

      const settle = () => new Promise((resolve) => setTimeout(resolve, 40))

      const mount = async (props) => {
        const calls = []
        let setter = null
        function Probe({ value }) {
          const [v, setV] = useControllableState({
            value,
            defaultValue: 0,
            onChange: (next) => calls.push(next),
          })
          setter = setV
          return h("span", null, String(v))
        }
        const host = document.createElement("div")
        document.body.appendChild(host)
        const root = createRoot(host)
        root.render(h(Probe, props))
        await settle()
        return {
          calls,
          set: (...args) => args.forEach((a) => setter(a)),
          text: () => host.textContent,
          done: () => {
            root.unmount()
            host.remove()
          },
        }
      }

      // Controlled parent that never accepts: `value` stays 0 no matter what.
      const rejecting = await mount({ value: 0 })
      rejecting.set((n) => n + 1, (n) => n + 1)
      await settle()
      const stacked = rejecting.calls.slice()
      const rejectedText = rejecting.text()
      // A later task, after a rejection that produced no re-render: the base
      // must be the prop again, not the value the parent refused.
      rejecting.set((n) => n + 1)
      await settle()
      const afterRejection = rejecting.calls.slice(stacked.length)
      rejecting.done()

      const repeat = await mount({ value: 0 })
      repeat.set(0)
      await settle()
      const controlledSameValue = repeat.calls.slice()
      repeat.done()

      const free = await mount({})
      free.set(0)
      await settle()
      const uncontrolledSameValue = free.calls.slice()
      free.set(1, 2)
      await settle()
      const uncontrolledStacked = free.calls.slice()
      const freeText = free.text()
      free.done()
      await settle()

      return {
        stacked,
        rejectedText,
        afterRejection,
        controlledSameValue,
        uncontrolledSameValue,
        uncontrolledStacked,
        freeText,
      }
    }, hookUrl)

    eq(probe.stacked.join(","), "1,2", "controlled: the second update builds on the first")
    eq(probe.rejectedText, "0", "counter-precondition: the parent really rejected both")
    eq(
      probe.afterRejection.join(","),
      "1",
      "controlled: the next task computes from the prop, not the rejected value"
    )
    eq(probe.controlledSameValue.join(","), "0", "controlled: a same-value set still reports")
    eq(probe.uncontrolledSameValue.length, 0, "uncontrolled: a same-value set stays silent")
    eq(probe.uncontrolledStacked.join(","), "1,2", "uncontrolled: updates still compose")
    eq(probe.freeText, "2", "uncontrolled: internal state landed on the last value")
  })

  await test("flipping between controlled and uncontrolled warns once in dev", async () => {
    const probe = await page.evaluate(async (hookUrl) => {
      const reactModule = await import("/@id/react")
      const h = reactModule.createElement ?? reactModule.default.createElement
      const domModule = await import("/@id/react-dom/client")
      const createRoot = domModule.createRoot ?? domModule.default.createRoot
      const { useControllableState } = await import(hookUrl)

      const captured = []
      const originalWarn = console.warn
      console.warn = (...args) => {
        captured.push(String(args[0]))
        originalWarn(...args)
      }
      const count = () => captured.filter((m) => m.includes("uncontrolled")).length

      const settle = () => new Promise((resolve) => setTimeout(resolve, 40))
      function Probe({ value }) {
        const [v] = useControllableState({ value, defaultValue: "seed" })
        return h("span", null, String(v))
      }

      try {
        const host = document.createElement("div")
        document.body.appendChild(host)
        const root = createRoot(host)

        root.render(h(Probe, {}))
        await settle()
        const steady = count()

        root.render(h(Probe, { value: "loaded" }))
        await settle()
        const afterFlip = count()

        root.render(h(Probe, {}))
        await settle()
        const afterSecondFlip = count()

        root.unmount()
        host.remove()
        return { steady, afterFlip, afterSecondFlip }
      } finally {
        console.warn = originalWarn
      }
    }, hookUrl)

    eq(probe.steady, 0, "counter-precondition: a steady mode is silent")
    eq(probe.afterFlip, 1, "uncontrolled to controlled warns")
    eq(probe.afterSecondFlip, 1, "the warning does not repeat")
  })

  // The two components the hook's controlled path is most visible through.
  await test("Select re-reports the item already selected, Toggle reports every press", async () => {
    const probe = await page.evaluate(
      async ([selectUrl, toggleUrl]) => {
        const reactModule = await import("/@id/react")
        const h = reactModule.createElement ?? reactModule.default.createElement
        const domModule = await import("/@id/react-dom/client")
        const createRoot = domModule.createRoot ?? domModule.default.createRoot
        const { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } =
          await import(selectUrl)
        const { Toggle } = await import(toggleUrl)

        const settle = () => new Promise((resolve) => setTimeout(resolve, 80))
        const click = (el) =>
          el.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }))

        const host = document.createElement("div")
        host.dataset.probe = "controllable"
        document.body.appendChild(host)
        const root = createRoot(host, { identifierPrefix: "ccs-" })

        const selectCalls = []
        const toggleCalls = []
        root.render(
          h(
            "div",
            null,
            // Pinned value: the parent holds "apple" whatever the user picks,
            // which is the case a same-value guard would make unreachable.
            h(
              Select,
              { value: "apple", onValueChange: (v) => selectCalls.push(v) },
              h(SelectTrigger, null, h(SelectValue)),
              h(
                SelectContent,
                null,
                h(SelectItem, { value: "apple", "data-ccs": "apple" }, "Apple"),
                h(SelectItem, { value: "banana", "data-ccs": "banana" }, "Banana")
              )
            ),
            h(Toggle, { pressed: false, onPressedChange: (v) => toggleCalls.push(v) }, "T")
          )
        )
        await settle()

        const trigger = host.querySelector(".select-trigger")
        // The content portals out of the host, and the docs page carries its
        // own Apple item — hence a probe-only hook rather than [data-value].
        const appleItem = () => document.querySelector('.select-item[data-ccs="apple"]')

        click(trigger)
        await settle()
        const appleState = appleItem()?.dataset.state
        click(appleItem())
        await settle()

        click(trigger)
        await settle()
        click(appleItem())
        await settle()

        const toggle = host.querySelector(".toggle")
        const togglePressedBefore = toggle.getAttribute("aria-pressed")
        click(toggle)
        await settle()
        click(toggle)
        await settle()

        root.unmount()
        host.remove()
        await settle()
        return {
          selectCalls,
          toggleCalls,
          appleState,
          togglePressedBefore,
          bodyPosition: document.body.style.position,
        }
      },
      [selectUrl, toggleUrl]
    )

    eq(probe.appleState, "checked", "precondition: Apple was already the selected item")
    eq(
      probe.selectCalls.join(","),
      "apple,apple",
      "picking the already-selected item reports both times"
    )
    eq(probe.togglePressedBefore, "false", "precondition: the toggle is held off by its parent")
    eq(probe.toggleCalls.join(","), "true,true", "a rejected toggle still reports every press")
    eq(probe.bodyPosition, "", "probe mounts left the body scroll lock released")
  })
}
