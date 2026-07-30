/**
 * Reduce a control's ARIA wiring to a shape that is comparable across
 * fields: every id is replaced by its role in the field, so a bound field
 * and a hand-wired one only match when they are wired the same way.
 */
async function wiring(page, pgName) {
  const control = page.locator(`[data-pg="${pgName}"]`)
  const id = await control.getAttribute("id")
  const describedBy = await control.getAttribute("aria-describedby")
  const invalid = await control.getAttribute("aria-invalid")

  const item = id?.replace(/-form-item$/, "")
  const label = page.locator(`label[for="${id}"]`)

  return {
    idSuffix: id?.slice(item?.length ?? 0),
    describedBy: (describedBy || "")
      .split(" ")
      .filter(Boolean)
      .map((token) => token.slice(item?.length ?? 0))
      .join(" "),
    invalid,
    labelCount: await label.count(),
    labelText: (await label.count()) ? await label.textContent() : null,
  }
}

export default async function run({ page, baseUrl, test, eq }) {
  await page.goto(`${baseUrl}/#form-fields`)
  await page.waitForSelector('[data-pg="ff-bound"]')

  /* ────────────────────────────────────────────────────────────────── */
  /*  1. A bound field renders the full ui/form stack                  */
  /* ────────────────────────────────────────────────────────────────── */

  await test("TextField renders label, control and description, wired", async () => {
    const w = await wiring(page, "ff-username")

    eq(w.idSuffix, "-form-item", "control id is the FormItem id")
    eq(w.labelCount, 1, "label points at the control")
    eq(w.labelText, "Username", "label text")
    eq(
      w.describedBy,
      "-form-item-description",
      "aria-describedby is the description only"
    )
    eq(w.invalid, null, "aria-invalid unset before validation")
  })

  await test("TextareaField renders a textarea, not an input", async () => {
    const tag = await page
      .locator('[data-pg="ff-bio"]')
      .evaluate((el) => el.tagName)
    eq(tag, "TEXTAREA", "TextareaField renders a textarea")
  })

  await test("Controller-path fields are wired like the register ones", async () => {
    for (const pg of ["ff-role", "ff-plan", "ff-marketing", "ff-notifications"]) {
      const w = await wiring(page, pg)
      eq(w.idSuffix, "-form-item", `${pg}: control id is the FormItem id`)
      eq(w.invalid, null, `${pg}: aria-invalid unset`)
    }

    const group = page.locator('[data-pg="ff-plan"]')
    const labelledBy = await group.getAttribute("aria-labelledby")
    const labelText = await page
      .locator(`[id="${labelledBy}"]`)
      .textContent()
    eq(labelText, "Plan", "the radiogroup names itself via aria-labelledby")
  })

  await test("no label points `for` at a radiogroup", async () => {
    // `<label for>` cannot bind to <div role="radiogroup">, so the grouped
    // field must not emit one — its name comes from aria-labelledby instead.
    const groupId = await page.locator('[data-pg="ff-plan"]').getAttribute("id")
    eq(
      await page.locator(`label[for="${groupId}"]`).count(),
      0,
      "radiogroup has no label[for] aimed at it"
    )

    const textId = await page
      .locator('[data-pg="ff-username"]')
      .getAttribute("id")
    eq(
      await page.locator(`label[for="${textId}"]`).count(),
      1,
      "a labelable control still gets label[for]"
    )
  })

  await test("typing in a bound field updates form state", async () => {
    await page.locator('[data-pg="ff-username"]').fill("caseynolan")
    await page.locator('[data-pg="ff-bio"]').fill("Builds things.")
    await page.locator('[data-pg="ff-role"]').click()
    await page.locator('[role="option"]', { hasText: "Admin" }).first().click()
    await page.locator('[data-pg="ff-submit"]').click()
    await page.waitForSelector('[data-pg="ff-result"]')

    const data = JSON.parse(
      await page.locator('[data-pg="ff-result"]').textContent()
    )
    eq(data.username, "caseynolan", "username round-tripped")
    eq(data.bio, "Builds things.", "bio round-tripped")
  })

  /* ────────────────────────────────────────────────────────────────── */
  /*  2. Controller-path fields round-trip through handleSubmit        */
  /* ────────────────────────────────────────────────────────────────── */

  await test("select, radio, checkbox and switch round-trip their values", async () => {
    await page.locator('[data-pg="ff-role"]').click()
    await page.locator('[role="option"]', { hasText: "Editor" }).first().click()
    await page.locator('[data-pg="ff-plan"] [role="radio"]').nth(1).click()
    await page.locator('[data-pg="ff-marketing"]').click()
    await page.locator('[data-pg="ff-notifications"]').click()

    await page.locator('[data-pg="ff-submit"]').click()
    await page.waitForFunction(
      () =>
        JSON.parse(
          document.querySelector('[data-pg="ff-result"]')?.textContent || "{}"
        ).role === "editor"
    )

    const data = JSON.parse(
      await page.locator('[data-pg="ff-result"]').textContent()
    )
    eq(data.role, "editor", "select value")
    eq(data.plan, "pro", "radio value")
    eq(data.marketing, true, "checkbox value")
    eq(data.notifications, false, "switch value")
  })

  await test("a resolver error reaches a Controller-path field", async () => {
    await page.locator('[data-pg="ff-reset"]').click()
    await page.locator('[data-pg="ff-submit"]').click()
    await page.waitForSelector('[data-pg="ff-role"][aria-invalid="true"]')

    const w = await wiring(page, "ff-role")
    eq(
      w.describedBy,
      "-form-item-description -form-item-message",
      "message id joins aria-describedby"
    )

    const id = await page.locator('[data-pg="ff-role"]').getAttribute("id")
    const message = await page
      .locator(`[id="${id}-message"]`)
      .textContent()
    eq(message, "Pick a role", "the schema message rendered itself")
  })

  /* ────────────────────────────────────────────────────────────────── */
  /*  3. The escape hatch binds a control the layer has never heard of */
  /* ────────────────────────────────────────────────────────────────── */

  await test("FormFieldBinding binds an arbitrary control", async () => {
    const w = await wiring(page, "ff-budget")
    eq(w.idSuffix, "-form-item", "control id is the FormItem id")
    eq(w.labelText, "Budget", "label points at the slider")

    await page.locator('[data-pg="ff-budget"] [role="slider"]').focus()
    await page.keyboard.press("ArrowRight")
    await page.locator('[data-pg="ff-hatch-submit"]').click()
    await page.waitForSelector('[data-pg="ff-hatch-result"]')

    const data = JSON.parse(
      await page.locator('[data-pg="ff-hatch-result"]').textContent()
    )
    eq(data.budget, 41, "the adapted value round-tripped as a number")
  })

  /* ────────────────────────────────────────────────────────────────── */
  /*  4. Bound and hand-wired produce the same attributes              */
  /* ────────────────────────────────────────────────────────────────── */

  await test("bound field matches the hand-wired one (no error)", async () => {
    const bound = await wiring(page, "ff-parity-bound")
    const hand = await wiring(page, "ff-parity-hand")
    eq(JSON.stringify(bound), JSON.stringify(hand), "identical wiring")
  })

  await test("bound field matches the hand-wired one (errored)", async () => {
    await page.locator('[data-pg="ff-parity-submit"]').click()
    await page.waitForSelector('[data-pg="ff-parity"] [role="alert"]')

    const bound = await wiring(page, "ff-parity-bound")
    const hand = await wiring(page, "ff-parity-hand")

    eq(bound.invalid, "true", "aria-invalid set on the bound field")
    eq(
      bound.describedBy,
      "-form-item-description -form-item-message",
      "message id joins aria-describedby"
    )
    eq(JSON.stringify(bound), JSON.stringify(hand), "identical wiring")
  })

  /* ────────────────────────────────────────────────────────────────── */
  /*  5. schemaResolver errors surface without the caller writing one  */
  /* ────────────────────────────────────────────────────────────────── */

  await test("a schemaResolver error renders itself in a bound field", async () => {
    await page.locator('[data-pg="ff-reset"]').click()
    await page.locator('[data-pg="ff-submit"]').click()
    await page.waitForSelector('[data-pg="ff-username"][aria-invalid="true"]')

    // The page's JSX for this field is a single <TextField />: no FormMessage,
    // no error prop, no message text. Everything below comes from the schema.
    const item = page.locator('[data-pg="ff-username"]').locator("xpath=..")
    const alerts = item.locator('[role="alert"]')
    eq(await alerts.count(), 1, "exactly one message, inside the field")
    eq(
      await alerts.textContent(),
      "Username must be at least 2 characters",
      "the schema's own message"
    )

    const id = await page.locator('[data-pg="ff-username"]').getAttribute("id")
    eq(
      await alerts.getAttribute("id"),
      `${id}-message`,
      "the message is the one aria-describedby points at"
    )
  })

  await test("the message clears itself when the value becomes valid", async () => {
    await page.locator('[data-pg="ff-username"]').fill("caseynolan")
    await page.waitForSelector('[data-pg="ff-username"][aria-invalid="true"]', {
      state: "detached",
    })

    const item = page.locator('[data-pg="ff-username"]').locator("xpath=..")
    eq(await item.locator('[role="alert"]').count(), 0, "message is gone")
    eq(
      (await wiring(page, "ff-username")).describedBy,
      "-form-item-description",
      "message id left aria-describedby"
    )
  })

  /* ────────────────────────────────────────────────────────────────── */
  /*  The other binding path: FormProvider, no `control` prop          */
  /* ────────────────────────────────────────────────────────────────── */

  await test("a field with no control prop binds through FormProvider", async () => {
    const field = page.locator('[data-pg="ff-provider-nickname"]')
    eq(await field.count(), 1, "field rendered")
    eq(
      (await wiring(page, "ff-provider-nickname")).labelText,
      "Nickname",
      "wired to its label like the control-prop path"
    )

    await field.fill("case")
    await page.locator('[data-pg="ff-provider-submit"]').click()
    await page.waitForSelector('[data-pg="ff-provider-result"]')
    eq(
      JSON.parse(
        await page.locator('[data-pg="ff-provider-result"]').textContent()
      ).nickname,
      "case",
      "the value reached the provider's form"
    )
  })

  await test("provider-bound field still validates", async () => {
    await page.locator('[data-pg="ff-provider-nickname"]').fill("")
    await page.locator('[data-pg="ff-provider-submit"]').click()
    await page.waitForSelector(
      '[data-pg="ff-provider-nickname"][aria-invalid="true"]'
    )
    const item = page
      .locator('[data-pg="ff-provider-nickname"]')
      .locator("xpath=..")
    eq(
      await item.locator('[role="alert"]').textContent(),
      "Nickname is required",
      "the rule ran on the provider path"
    )
  })
}
