export default async function run({ page, baseUrl, test, eq }) {
  await page.goto(`${baseUrl}/#form`)
  await page.waitForSelector('[data-pg="form-engine"]')

  /* ────────────────────────────────────────────────────────────────── */
  /*  1. ARIA id wiring                                                */
  /* ────────────────────────────────────────────────────────────────── */

  await test("FormLabel htmlFor matches FormControl id", async () => {
    const form = page.locator('[data-pg="form-engine"]')
    const label = form.locator("label").first()
    const input = page.locator('[data-pg="form-username"]')

    const htmlFor = await label.getAttribute("for")
    const inputId = await input.getAttribute("id")

    eq(!!htmlFor, true, "htmlFor is set")
    eq(htmlFor, inputId, "htmlFor matches control id")
  })

  await test("aria-describedby covers description (no error yet)", async () => {
    const input = page.locator('[data-pg="form-username"]')
    const describedBy = await input.getAttribute("aria-describedby")

    eq(!!describedBy, true, "aria-describedby is set")
    // Should reference the description element
    const descId = describedBy.split(" ")[0]
    const descEl = page.locator(`[id="${descId}"]`)
    const descText = await descEl.textContent()
    eq(descText.includes("public display name"), true, "description text found")
  })

  await test("aria-invalid not set before validation", async () => {
    const input = page.locator('[data-pg="form-username"]')
    const ariaInvalid = await input.getAttribute("aria-invalid")
    eq(ariaInvalid, null, "aria-invalid not set when no error")
  })

  /* ────────────────────────────────────────────────────────────────── */
  /*  2. Validation failure — message announced, aria-invalid set      */
  /* ────────────────────────────────────────────────────────────────── */

  await test("submit triggers validation, FormMessage appears with role=alert", async () => {
    // Submit empty form to trigger validation errors
    await page.locator('[data-pg="form-engine-submit"]').click()
    await page.waitForTimeout(100)

    const form = page.locator('[data-pg="form-engine"]')
    // Find error messages
    const messages = form.locator('[role="alert"]')
    const count = await messages.count()
    eq(count >= 1, true, "at least one alert message appeared")

    // Check first message content
    const text = await messages.first().textContent()
    eq(text.length > 0, true, "error message has text content")
  })

  await test("aria-describedby includes message id when errored", async () => {
    const input = page.locator('[data-pg="form-username"]')
    const describedBy = await input.getAttribute("aria-describedby")
    const ids = describedBy ? describedBy.split(" ") : []

    eq(ids.length >= 2, true, "aria-describedby has description + message ids")

    // Second id should be the message element
    const msgEl = page.locator(`[id="${ids[1]}"]`)
    const role = await msgEl.getAttribute("role")
    eq(role, "alert", "message element has role=alert")
  })

  await test("aria-invalid set on errored field", async () => {
    const input = page.locator('[data-pg="form-username"]')
    const ariaInvalid = await input.getAttribute("aria-invalid")
    eq(ariaInvalid, "true", "aria-invalid is true on errored field")
  })

  await test("FormLabel gets error styling", async () => {
    const form = page.locator('[data-pg="form-engine"]')
    const label = form.locator("label").first()
    const dataError = await label.getAttribute("data-error")
    eq(dataError, "", "data-error attribute set on label")
  })

  /* ────────────────────────────────────────────────────────────────── */
  /*  3. Controller-wired Select submits its value                     */
  /* ────────────────────────────────────────────────────────────────── */

  await test("Controller-wired Select submits its value", async () => {
    // Fill username (>= 2 chars)
    const usernameInput = page.locator('[data-pg="form-username"]')
    await usernameInput.fill("testuser")

    // Fill email
    const emailInput = page.locator('[data-pg="form-email"]')
    await emailInput.fill("test@example.com")

    // Open Select and pick a role
    await page.locator('[data-pg="form-role-trigger"]').click()
    await page.waitForTimeout(100)
    // Click "Editor" option
    await page.locator('[role="option"]', { hasText: "Editor" }).click()
    await page.waitForTimeout(100)

    // Submit
    await page.locator('[data-pg="form-engine-submit"]').click()
    await page.waitForTimeout(200)

    // Check the result output
    const result = page.locator('[data-pg="form-engine-result"]')
    await result.waitFor({ state: "visible", timeout: 2000 })
    const text = await result.textContent()
    const parsed = JSON.parse(text)
    eq(parsed.role, "editor", "Select value submitted correctly")
    eq(parsed.username, "testuser", "username submitted")
    eq(parsed.email, "test@example.com", "email submitted")
  })

  /* ────────────────────────────────────────────────────────────────── */
  /*  4. Engine-agnostic proof — hand-rolled RHF-shaped context        */
  /* ────────────────────────────────────────────────────────────────── */

  await test("engine-agnostic: ARIA wiring works with hand-rolled context", async () => {
    const form = page.locator('[data-pg="form-agnostic"]')
    const label = page.locator('[data-pg="form-agnostic-label"]')
    const input = page.locator('[data-pg="form-agnostic-input"]')
    const desc = page.locator('[data-pg="form-agnostic-desc"]')

    // Check id wiring
    const htmlFor = await label.getAttribute("for")
    const inputId = await input.getAttribute("id")
    eq(htmlFor, inputId, "label htmlFor matches input id in agnostic context")

    // Check description is linked
    const describedBy = await input.getAttribute("aria-describedby")
    eq(!!describedBy, true, "aria-describedby is set")
    const descId = await desc.getAttribute("id")
    eq(describedBy.includes(descId), true, "description id in aria-describedby")

    // No error initially
    const ariaInvalid = await input.getAttribute("aria-invalid")
    eq(ariaInvalid, null, "not invalid initially")
    const msgExists = await page.locator('[data-pg="form-agnostic-msg"]').count()
    eq(msgExists, 0, "no message element when no error")
  })

  await test("engine-agnostic: injected error shows FormMessage", async () => {
    // Click "Inject error" button
    await page.locator('[data-pg="form-agnostic-trigger-error"]').click()
    await page.waitForTimeout(100)

    const input = page.locator('[data-pg="form-agnostic-input"]')

    // aria-invalid should now be set
    const ariaInvalid = await input.getAttribute("aria-invalid")
    eq(ariaInvalid, "true", "aria-invalid set after error injection")

    // FormMessage should appear
    const msg = page.locator('[data-pg="form-agnostic-msg"]')
    await msg.waitFor({ state: "visible", timeout: 1000 })
    const text = await msg.textContent()
    eq(text, "Injected error", "error message from hand-rolled context")

    const role = await msg.getAttribute("role")
    eq(role, "alert", "message is a live region")

    // aria-describedby now includes message id
    const describedBy = await input.getAttribute("aria-describedby")
    const msgId = await msg.getAttribute("id")
    eq(describedBy.includes(msgId), true, "message id added to aria-describedby")
  })

  await test("engine-agnostic: clearing error removes FormMessage", async () => {
    await page.locator('[data-pg="form-agnostic-clear"]').click()
    await page.waitForTimeout(100)

    const input = page.locator('[data-pg="form-agnostic-input"]')
    const ariaInvalid = await input.getAttribute("aria-invalid")
    eq(ariaInvalid, null, "aria-invalid cleared")

    const msgCount = await page.locator('[data-pg="form-agnostic-msg"]').count()
    eq(msgCount, 0, "message element removed when error cleared")
  })

  /* ────────────────────────────────────────────────────────────────── */
  /*  5. useFormStatus pending state (Actions path)                    */
  /* ────────────────────────────────────────────────────────────────── */

  await test("FormSubmit shows pending state during action", async () => {
    const submitBtn = page.locator('[data-pg="form-action-submit"]')
    const initialText = await submitBtn.textContent()
    eq(initialText.trim(), "Send message", "initial button text")

    // Submit the actions-path form (empty — will trigger validation in action)
    await submitBtn.click()

    // Button should become pending (disabled + pending text)
    await page.waitForFunction(() => {
      const btn = document.querySelector('[data-pg="form-action-submit"]')
      return btn?.disabled === true
    }, { timeout: 2000 })

    const pendingText = await submitBtn.textContent()
    eq(pendingText.trim(), "Sending...", "pending content shown")

    // Wait for action to complete (1.5s delay in the action)
    await page.waitForFunction(() => {
      const btn = document.querySelector('[data-pg="form-action-submit"]')
      return btn?.disabled === false
    }, { timeout: 5000 })

    const afterText = await submitBtn.textContent()
    eq(afterText.trim(), "Send message", "text restored after action completes")
  })

  await test("Actions path shows errors returned by action", async () => {
    // The previous submission was empty, so errors should appear
    const form = page.locator('[data-pg="form-actions"]')
    const messages = form.locator('[role="alert"]')
    const count = await messages.count()
    eq(count >= 1, true, "error messages from action displayed")
  })

  /* ────────────────────────────────────────────────────────────────── */
  /*  6. Portalled FormSubmit — useFormStatus boundary                 */
  /* ────────────────────────────────────────────────────────────────── */

  await test("portalled FormSubmit does not read pending state", async () => {
    const innerBtn = page.locator('[data-pg="form-portal-inner"]')
    const outerBtn = page.locator('[data-pg="form-portal-outer"]')

    // Both should be visible and enabled initially
    eq(await innerBtn.isDisabled(), false, "inner button enabled initially")
    eq(await outerBtn.isDisabled(), false, "outer button enabled initially")

    const outerText = await outerBtn.textContent()
    eq(outerText.trim(), "Submit (portalled)", "outer shows normal text")

    // Submit via the inner button
    await innerBtn.click()

    // Inner should go pending
    await page.waitForFunction(() => {
      const btn = document.querySelector('[data-pg="form-portal-inner"]')
      return btn?.disabled === true
    }, { timeout: 2000 })

    const innerPendingText = await innerBtn.textContent()
    eq(innerPendingText.trim(), "Submitting...", "inner shows pending text")

    // Outer (portalled) should NOT be pending
    eq(await outerBtn.isDisabled(), false, "outer button still enabled")
    const outerTextDuring = await outerBtn.textContent()
    eq(
      outerTextDuring.trim(),
      "Submit (portalled)",
      "outer button text unchanged during submission"
    )

    // Wait for action to complete
    await page.waitForFunction(() => {
      const btn = document.querySelector('[data-pg="form-portal-inner"]')
      return btn?.disabled === false
    }, { timeout: 5000 })
  })
}
