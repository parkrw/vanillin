export default async function run({ page, baseUrl, repoRoot, test, eq }) {
  await page.mouse.move(0, 0)
  await page.goto(`${baseUrl}/#use-form`)
  await page.waitForSelector('[data-pg="uf-isolation"]')

  // ── Render isolation ───────────────────────────────────────────────

  await test("typing in one field does not re-render siblings", async () => {
    const inputA = page.locator('[data-pg="uf-input-fieldA"]')
    const rendersA = page.locator('[data-pg="uf-renders-fieldA"]')
    const rendersB = page.locator('[data-pg="uf-renders-fieldB"]')

    const beforeA = Number(await rendersA.textContent())
    const beforeB = Number(await rendersB.textContent())

    // Type several characters into field A
    await inputA.click()
    await inputA.type("hello")

    const afterA = Number(await rendersA.textContent())
    const afterB = Number(await rendersB.textContent())

    // Field A may or may not re-render (register is uncontrolled, so
    // it should not), but the critical property is that B stays put.
    eq(afterB, beforeB, "field B render count unchanged after typing in A")
    eq(afterA, beforeA, "field A render count unchanged (uncontrolled)")
  })

  await test("register captures value on submit", async () => {
    // Field A already has "hello" from previous test
    await page.locator('[data-pg="uf-isolation-submit"]').click()
    await page.waitForSelector('[data-pg="uf-isolation-result"]')
    const result = await page
      .locator('[data-pg="uf-isolation-result"]')
      .textContent()
    const data = JSON.parse(result)
    eq(data.fieldA, "hello", "fieldA captured")
    eq(data.fieldB, "", "fieldB is empty string")
  })

  // ── Built-in validation ───────────────────────────────────────────

  await test("required validation shows error on empty submit", async () => {
    await page.locator('[data-pg="uf-builtin-submit"]').click()
    await page.waitForTimeout(50)
    const errUser = await page
      .locator('[data-pg="uf-builtin-err-username"]')
      .textContent()
    eq(errUser, "Username is required", "username required error")

    const errAge = await page
      .locator('[data-pg="uf-builtin-err-age"]')
      .textContent()
    eq(errAge, "Age is required", "age required error")
  })

  await test("minLength validation", async () => {
    const input = page.locator('[data-pg="uf-builtin-username"]')
    await input.fill("ab")
    await page.locator('[data-pg="uf-builtin-submit"]').click()
    await page.waitForTimeout(50)
    const err = await page
      .locator('[data-pg="uf-builtin-err-username"]')
      .textContent()
    eq(err, "Min 3 chars", "minLength error shown")
  })

  await test("valid submit passes", async () => {
    const username = page.locator('[data-pg="uf-builtin-username"]')
    const age = page.locator('[data-pg="uf-builtin-age"]')
    await username.fill("alice")
    await age.fill("25")
    await page.locator('[data-pg="uf-builtin-submit"]').click()
    await page.waitForTimeout(50)
    const result = await page
      .locator('[data-pg="uf-builtin-result"]')
      .textContent()
    const data = JSON.parse(result)
    eq(data.username, "alice", "username value")
    eq(data.age, "25", "age value")
  })

  await test("setError and clearErrors", async () => {
    await page.locator('[data-pg="uf-builtin-set-error"]').click()
    await page.waitForTimeout(50)
    const err = await page
      .locator('[data-pg="uf-builtin-err-username"]')
      .textContent()
    eq(err, "Already taken", "manual error set")

    await page.locator('[data-pg="uf-builtin-clear"]').click()
    await page.waitForTimeout(50)
    const gone = await page
      .locator('[data-pg="uf-builtin-err-username"]')
      .count()
    eq(gone, 0, "error cleared")
  })

  await test("trigger validates without submit", async () => {
    const username = page.locator('[data-pg="uf-builtin-username"]')
    await username.fill("")
    await page.locator('[data-pg="uf-builtin-trigger"]').click()
    await page.waitForTimeout(50)
    const err = await page
      .locator('[data-pg="uf-builtin-err-username"]')
      .textContent()
    eq(err, "Username is required", "trigger sets error")
  })

  // ── Watch / setValue / reset ───────────────────────────────────────

  await test("watch returns live value", async () => {
    const input = page.locator('[data-pg="uf-watch-first"]')
    await input.fill("Bob")
    await page.waitForTimeout(50)
    const watched = await page
      .locator('[data-pg="uf-watch-value"]')
      .textContent()
    eq(watched, "Bob", "watch reflects typed value")
  })

  await test("setValue updates DOM and watch", async () => {
    await page.locator('[data-pg="uf-watch-setval"]').click()
    await page.waitForTimeout(50)
    const watched = await page
      .locator('[data-pg="uf-watch-value"]')
      .textContent()
    eq(watched, "Updated", "watch sees setValue")

    const inputVal = await page
      .locator('[data-pg="uf-watch-first"]')
      .inputValue()
    eq(inputVal, "Updated", "DOM updated by setValue")
  })

  await test("reset restores defaults", async () => {
    await page.locator('[data-pg="uf-watch-reset"]').click()
    await page.waitForTimeout(50)
    const watched = await page
      .locator('[data-pg="uf-watch-value"]')
      .textContent()
    eq(watched, "Jane", "watch sees default after reset")

    const inputVal = await page
      .locator('[data-pg="uf-watch-first"]')
      .inputValue()
    eq(inputVal, "Jane", "DOM restored after reset")
  })

  await test("getValues reads without subscribing", async () => {
    await page.locator('[data-pg="uf-watch-getvals"]').click()
    await page.waitForTimeout(50)
    const out = await page
      .locator('[data-pg="uf-watch-getvals-out"]')
      .textContent()
    const data = JSON.parse(out)
    eq(data.first, "Jane", "getValues first")
    eq(data.last, "Doe", "getValues last")
  })

  // ── formState (dirty / touched) ───────────────────────────────────

  await test("isDirty and dirtyFields update on change", async () => {
    const input = page.locator('[data-pg="uf-formstate-color"]')

    // Initially clean
    const dirty0 = await page
      .locator('[data-pg="uf-formstate-dirty"]')
      .textContent()
    eq(dirty0, "false", "initially not dirty")

    await input.fill("blue")
    await page.waitForTimeout(50)
    const dirty1 = await page
      .locator('[data-pg="uf-formstate-dirty"]')
      .textContent()
    eq(dirty1, "true", "dirty after change")

    const dirtyFields = await page
      .locator('[data-pg="uf-formstate-dirtyfields"]')
      .textContent()
    eq(JSON.parse(dirtyFields).color, true, "color in dirtyFields")
  })

  await test("touchedFields updates on blur", async () => {
    const input = page.locator('[data-pg="uf-formstate-color"]')
    await input.focus()
    await input.blur()
    await page.waitForTimeout(50)
    const touched = await page
      .locator('[data-pg="uf-formstate-touched"]')
      .textContent()
    eq(JSON.parse(touched).color, true, "color in touchedFields")
  })

  // ── Controller ────────────────────────────────────────────────────

  await test("Controller renders controlled value and submits", async () => {
    const slider = page.locator('[data-pg="uf-controller-rating"]')
    // Change slider value via JavaScript (range inputs are hard to drag)
    await slider.fill("5")
    await page.waitForTimeout(50)
    await page.locator('[data-pg="uf-controller-submit"]').click()
    await page.waitForTimeout(50)
    const result = await page
      .locator('[data-pg="uf-controller-result"]')
      .textContent()
    const data = JSON.parse(result)
    eq(data.rating, 5, "Controller captured slider value")
  })

  // ── FormProvider / useFormContext ──────────────────────────────────

  await test("useFormContext accesses form from provider", async () => {
    // Submit empty -> should show required error
    await page.locator('[data-pg="uf-ctx-submit"]').click()
    await page.waitForTimeout(50)
    const err = await page.locator('[data-pg="uf-ctx-err"]').textContent()
    eq(err, "Email required", "context child shows error")

    // Fill and submit
    const input = page.locator('[data-pg="uf-ctx-email"]')
    await input.fill("test@example.com")
    await page.locator('[data-pg="uf-ctx-submit"]').click()
    await page.waitForTimeout(50)
    const result = await page
      .locator('[data-pg="uf-ctx-result"]')
      .textContent()
    const data = JSON.parse(result)
    eq(data.email, "test@example.com", "context form submitted")
  })

  await test("useFormContextSafe returns null outside a provider", async () => {
    eq(
      await page.locator('[data-pg="uf-ctx-safe-outside"]').textContent(),
      "null",
      "no provider -> null"
    )
    eq(
      await page.locator('[data-pg="uf-ctx-safe-inside"]').textContent(),
      "methods",
      "inside provider -> methods"
    )
  })

  // ── useFieldArray ─────────────────────────────────────────────────

  await test("useFieldArray append and remove", async () => {
    // Start with 1 item
    const count = () => page.locator('[data-pg="uf-fa-count"]').textContent()
    eq(await count(), "1", "starts with 1 item")

    // Append
    await page.locator('[data-pg="uf-fa-append"]').click()
    await page.waitForTimeout(50)
    eq(await count(), "2", "2 after append")

    // Remove first
    await page.locator('[data-pg="uf-fa-remove-0"]').click()
    await page.waitForTimeout(50)
    eq(await count(), "1", "1 after remove")
  })

  await test("useFieldArray prepend", async () => {
    const count = () => page.locator('[data-pg="uf-fa-count"]').textContent()
    await page.locator('[data-pg="uf-fa-prepend"]').click()
    await page.waitForTimeout(50)
    eq(await count(), "2", "2 after prepend")

    // First item should be "prepended"
    const val = await page.locator('[data-pg="uf-fa-item-0"]').inputValue()
    eq(val, "prepended", "prepend goes to front")
  })

  await test("useFieldArray swap", async () => {
    // Currently: ["prepended", ""] — swap 0,1
    await page.locator('[data-pg="uf-fa-swap"]').click()
    await page.waitForTimeout(50)
    const first = await page.locator('[data-pg="uf-fa-item-0"]').inputValue()
    const second = await page.locator('[data-pg="uf-fa-item-1"]').inputValue()
    eq(first, "", "swap moved empty to front")
    eq(second, "prepended", "swap moved prepended to back")
  })

  await test("useFieldArray submits nested data", async () => {
    // Fill first item
    await page.locator('[data-pg="uf-fa-item-0"]').fill("alpha")
    await page.locator('[data-pg="uf-fa-item-1"]').fill("beta")
    await page.locator('[data-pg="uf-fa-submit"]').click()
    await page.waitForTimeout(50)
    const result = await page
      .locator('[data-pg="uf-fa-result"]')
      .textContent()
    const data = JSON.parse(result)
    eq(data.items.length, 2, "2 items submitted")
    eq(data.items[0].name, "alpha", "first item name")
    eq(data.items[1].name, "beta", "second item name")
  })

  // ── Nested paths ──────────────────────────────────────────────────

  await test("nested path register and submit", async () => {
    await page.locator('[data-pg="uf-nested-submit"]').click()
    await page.waitForTimeout(50)
    const result = await page
      .locator('[data-pg="uf-nested-result"]')
      .textContent()
    const data = JSON.parse(result)
    eq(data.user.address.city, "Portland", "nested city")
    eq(data.user.address.zip, "97201", "nested zip")
  })

  await test("nested path setValue", async () => {
    await page.locator('[data-pg="uf-nested-setval"]').click()
    await page.waitForTimeout(50)
    const inputVal = await page
      .locator('[data-pg="uf-nested-city"]')
      .inputValue()
    eq(inputVal, "Seattle", "nested setValue updates DOM")

    await page.locator('[data-pg="uf-nested-submit"]').click()
    await page.waitForTimeout(50)
    const result = await page
      .locator('[data-pg="uf-nested-result"]')
      .textContent()
    const data = JSON.parse(result)
    eq(data.user.address.city, "Seattle", "nested setValue persists to submit")
  })

  await test("nested path type and submit round-trip", async () => {
    const cityInput = page.locator('[data-pg="uf-nested-city"]')
    await cityInput.fill("Austin")
    await page.locator('[data-pg="uf-nested-submit"]').click()
    await page.waitForTimeout(50)
    const result = await page
      .locator('[data-pg="uf-nested-result"]')
      .textContent()
    const data = JSON.parse(result)
    eq(data.user.address.city, "Austin", "typed nested value round-trips")
    eq(data.user.address.zip, "97201", "sibling nested value preserved")
  })

  // ── Resolver ───────────────────────────────────────────────────────

  await test("resolver errors surface into formState.errors at nested paths", async () => {
    // Submit empty form — resolver should reject with errors
    await page.locator('[data-pg="uf-resolver-submit"]').click()
    await page.waitForTimeout(100)

    const errEmail = await page
      .locator('[data-pg="uf-resolver-err-email"]')
      .textContent()
    eq(errEmail, "Email required", "resolver email error surfaced")

    const errAge = await page
      .locator('[data-pg="uf-resolver-err-age"]')
      .textContent()
    eq(errAge, "Age required", "resolver age error surfaced")

    const errCity = await page
      .locator('[data-pg="uf-resolver-err-city"]')
      .textContent()
    eq(errCity, "City required", "resolver nested address.city error surfaced")
  })

  await test("resolver blocks submit when errors exist", async () => {
    // The previous test submitted with errors; result should show "invalid:"
    const result = await page
      .locator('[data-pg="uf-resolver-result"]')
      .textContent()
    eq(result.startsWith("invalid:"), true, "submit blocked — onInvalid called")
  })

  await test("resolver submits returned values (coercion)", async () => {
    // Fill valid data — age as string "30", resolver coerces to number
    await page.locator('[data-pg="uf-resolver-email"]').fill("a@b.com")
    await page.locator('[data-pg="uf-resolver-age"]').fill("30")
    await page.locator('[data-pg="uf-resolver-city"]').fill("Portland")
    await page.locator('[data-pg="uf-resolver-submit"]').click()
    await page.waitForTimeout(100)

    const result = await page
      .locator('[data-pg="uf-resolver-result"]')
      .textContent()
    eq(result.startsWith("ok:"), true, "valid submit succeeded")
    const data = JSON.parse(result.replace("ok:", ""))
    eq(data.age, 30, "age coerced from string to number by resolver")
    eq(data.email, "a@b.com", "email passed through")
    eq(data.address.city, "Portland", "nested city passed through")
  })

  await test("resolver clears errors when values become valid", async () => {
    // Errors from the first submit should be gone after valid submit
    const errCount = await page.locator('[data-pg="uf-resolver-err-email"]').count()
    eq(errCount, 0, "email error cleared after valid submit")
    const cityErrCount = await page.locator('[data-pg="uf-resolver-err-city"]').count()
    eq(cityErrCount, 0, "city error cleared after valid submit")
  })

  await test("resolver receives documented options argument", async () => {
    // The hidden pre contains the stashed options from the last resolver call
    const optsText = await page
      .locator('[data-pg="uf-resolver-opts"]')
      .textContent()
    const opts = JSON.parse(optsText.trim())
    eq(opts.hasFields, true, "options.fields is an object")
    eq(opts.hasNames, true, "options.names is an array")
    eq(opts.criteriaMode, "firstError", "options.criteriaMode is firstError")
    eq(opts.shouldUseNativeValidation, false, "options.shouldUseNativeValidation is false")
  })

  // ── Validation modes ──────────────────────────────────────────────

  await test("an empty required form starts invalid", async () => {
    // Nothing has touched this form yet, so this is its initial isValid.
    const value = await page.locator('[data-pg="uf-modes-valid"]').textContent()
    eq(value, "false", "isValid before any interaction")
  })

  await test("onBlur mode validates on blur", async () => {
    const input = page.locator('[data-pg="uf-modes-field"]')
    await input.focus()
    await input.blur()
    await page.waitForTimeout(50)
    const err = await page.locator('[data-pg="uf-modes-err"]').textContent()
    eq(err, "Required", "onBlur mode validates on blur")
  })

  await test("isValid turns true once the required field passes", async () => {
    const input = page.locator('[data-pg="uf-modes-field"]')
    await input.fill("filled")
    await input.blur()
    await page.waitForTimeout(50)
    const value = await page.locator('[data-pg="uf-modes-valid"]').textContent()
    eq(value, "true", "isValid after the rule passes")
  })

  /*
   * Subscription bookkeeping — watch(), Controller and the watched-name set.
   * None of it is visible through the docs page, so these mount their own
   * probe component against lib/use-form.js and read control's internals
   * directly. The probe goes in last: it appends its own root to the body.
   */

  const formUrl = `/@fs/${repoRoot.replace(/^\//, "")}lib/use-form.js`

  await page.evaluate(async (url) => {
    const reactModule = await import("/@id/react")
    const React = reactModule.default ?? reactModule
    const h = React.createElement
    const useState = React.useState
    const domModule = await import("/@id/react-dom/client")
    const createRoot = domModule.createRoot ?? domModule.default.createRoot
    const { useForm, Controller } = await import(url)

    const probe = { renders: 0, watchCalls: 0, lastWatch: null }
    window.__uf = probe

    function Probe() {
      const { control, watch } = useForm({
        defaultValues: { a: "", b: "", c: "" },
      })
      const [tick, setTick] = useState(0)
      const [watchB, setWatchB] = useState(true)
      const [showController, setShowController] = useState(true)

      probe.renders++
      probe.control = control
      probe.rerender = () => setTick((n) => n + 1)
      probe.setWatchB = setWatchB
      probe.setShowController = setShowController

      watch((values, info) => {
        probe.watchCalls++
        probe.lastWatch = { a: values.a, name: info.name }
      })
      if (watchB) watch("b")

      return h(
        "div",
        { "data-pg": "uf-probe", "data-tick": String(tick) },
        showController
          ? h(Controller, {
              name: "c",
              control,
              rules: { required: "req" },
              render: ({ field }) =>
                h("input", {
                  "data-pg": "uf-probe-c",
                  value: field.value ?? "",
                  onChange: field.onChange,
                }),
            })
          : null
      )
    }

    const host = document.createElement("div")
    document.body.appendChild(host)
    createRoot(host).render(h(Probe))
    await new Promise((r) => setTimeout(r, 60))
  }, formUrl)

  await test("watch(callback) subscribes once, not once per render", async () => {
    const result = await page.evaluate(async () => {
      const before = window.__uf.control._valueListeners.size
      for (let i = 0; i < 5; i++) {
        window.__uf.rerender()
        await new Promise((r) => setTimeout(r, 10))
      }
      const after = window.__uf.control._valueListeners.size
      const calls = window.__uf.watchCalls
      window.__uf.control.setValue("a", "typed")
      await new Promise((r) => setTimeout(r, 30))
      return {
        before,
        after,
        fired: window.__uf.watchCalls - calls,
        value: window.__uf.lastWatch?.a,
        name: window.__uf.lastWatch?.name,
      }
    })
    eq(result.after, result.before, "listener count unchanged across 5 renders")
    eq(result.fired, 1, "the callback runs once per change, not once per render")
    eq(result.value, "typed", "the callback receives the new values")
    eq(result.name, "a", "the callback receives the changed field name")
  })

  await test("Controller keeps its subscription across renders", async () => {
    const churn = await page.evaluate(async () => {
      const before = [...window.__uf.control._valueListeners]
      for (let i = 0; i < 3; i++) {
        window.__uf.rerender()
        await new Promise((r) => setTimeout(r, 10))
      }
      const after = [...window.__uf.control._valueListeners]
      return {
        before: before.length,
        after: after.length,
        kept: before.filter((fn) => after.includes(fn)).length,
      }
    })
    eq(churn.kept, churn.before, "an inline rules object does not resubscribe")
    eq(churn.after, churn.before, "listener count unchanged")
  })

  await test("a field that stops being watched stops re-rendering", async () => {
    const watched = await page.evaluate(async () => {
      const start = window.__uf.renders
      window.__uf.control.setValue("b", "1")
      await new Promise((r) => setTimeout(r, 40))
      return window.__uf.renders - start
    })
    eq(watched > 0, true, "a watched field re-renders")

    const unwatched = await page.evaluate(async () => {
      window.__uf.setWatchB(false)
      await new Promise((r) => setTimeout(r, 40))
      const start = window.__uf.renders
      window.__uf.control.setValue("b", "2")
      await new Promise((r) => setTimeout(r, 40))
      return window.__uf.renders - start
    })
    eq(unwatched, 0, "a field no longer watched does not re-render")
  })

  await test("Controller drops its field on unmount", async () => {
    const mounted = await page.evaluate(async () => {
      const registered = !!window.__uf.control._fields.c
      await window.__uf.control.trigger()
      return {
        registered,
        error: window.__uf.control._formState.errors.c?.message ?? null,
      }
    })
    eq(mounted.registered, true, "Controller registered its field")
    eq(mounted.error, "req", "the mounted field is validated")

    const unmounted = await page.evaluate(async () => {
      window.__uf.setShowController(false)
      await new Promise((r) => setTimeout(r, 40))
      const registered = !!window.__uf.control._fields.c
      window.__uf.control.clearErrors()
      await window.__uf.control.trigger()
      return {
        registered,
        error: window.__uf.control._formState.errors.c?.message ?? null,
      }
    })
    eq(unmounted.registered, false, "the field is gone")
    eq(unmounted.error, null, "the removed field is no longer validated")
  })

}
