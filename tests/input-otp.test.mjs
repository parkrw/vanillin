export default async function run({ page, baseUrl, test, eq }) {
  await page.goto(`${baseUrl}/#input-otp`)

  const input = page.locator('[data-pg="otp-input"]')
  const slotText = (pg) => page.locator(`[data-pg="${pg}"]`).textContent()
  const activeSlot = (prefix, count) =>
    page.evaluate(
      ({ prefix, count }) => {
        for (let i = 0; i < count; i++) {
          const el = document.querySelector(`[data-pg="${prefix}${i}"]`)
          if (el?.hasAttribute("data-active")) return i
        }
        return null
      },
      { prefix, count }
    )

  await test("typing fills slots; the next slot is active with a fake caret", async () => {
    await input.click()
    await page.keyboard.type("123")
    eq(await slotText("otp-slot-0"), "1", "first slot")
    eq(await slotText("otp-slot-2"), "3", "third slot")
    eq(await activeSlot("otp-slot-", 6), 3, "caret sits on the first empty slot")
    eq(
      await page.locator('[data-pg="otp-slot-3"] .input-otp-caret').count(),
      1,
      "fake caret rendered in the active empty slot"
    )
    eq(
      await page.locator('[data-pg="otp-slot-0"] .input-otp-caret').count(),
      0,
      "no caret in filled slots"
    )
  })

  await test("arrows move the active slot without changing the value", async () => {
    await page.keyboard.press("ArrowLeft")
    eq(await activeSlot("otp-slot-", 6), 2, "ArrowLeft moves the active slot back")
    eq(await input.inputValue(), "123", "value untouched")
    await page.keyboard.press("ArrowRight")
    eq(await activeSlot("otp-slot-", 6), 3, "ArrowRight moves it forward")
  })

  await test("Backspace clears the last slot", async () => {
    await page.keyboard.press("Backspace")
    eq(await slotText("otp-slot-2"), "", "third slot cleared")
    eq(await input.inputValue(), "12", "value trimmed")
  })

  await test("maxLength caps the value", async () => {
    await page.keyboard.type("34567890")
    eq(await input.inputValue(), "123456", "6 slots, 6 characters")
    eq(await slotText("otp-slot-5"), "6", "last slot filled")
  })

  await test("blur clears the active slot; click parks the caret at the end", async () => {
    await page.locator("h2").click()
    eq(await activeSlot("otp-slot-", 6), null, "no active slot while blurred")
    await input.click()
    eq(await activeSlot("otp-slot-", 6), 5, "caret clamps to the last slot when full")
  })

  await test("digits-only pattern rejects a letter, accepts digits", async () => {
    const digits = page.locator('[data-pg="otp-digits-input"]')
    await digits.click()
    await page.keyboard.type("a")
    eq(await page.locator('[data-pg="otp-digits-state"]').textContent(), "empty", "letter rejected")
    await page.keyboard.type("42")
    eq(await page.locator('[data-pg="otp-digits-state"]').textContent(), "42", "digits accepted")
    eq(await slotText("otp-digits-slot-1"), "2", "second slot filled")
  })

  await test("filling every slot fires onComplete once", async () => {
    const digits = page.locator('[data-pg="otp-digits-input"]')
    eq(
      await page.locator('[data-pg="otp-complete-state"]').textContent(),
      "none",
      "not complete yet"
    )
    await digits.fill("123456")
    eq(
      await page.locator('[data-pg="otp-complete-state"]').textContent(),
      "123456",
      "onComplete got the full value"
    )
    eq(await slotText("otp-digits-slot-5"), "6", "sixth slot filled across the separator")
    eq(await page.locator('[data-pg="otp-separator"]').getAttribute("role"), "separator", "role")
  })

  await test("disabled: input is disabled and slots keep their value", async () => {
    const disabled = page.locator('[data-pg="otp-disabled-input"]')
    eq(await disabled.isDisabled(), true, "input disabled")
    eq(await slotText("otp-disabled-slot-1"), "2", "defaultValue rendered")
    const dimmed = await page.evaluate(() => {
      const el = document.querySelector('[data-pg="otp-disabled-slot-0"]').closest(".input-otp")
      return el.hasAttribute("data-disabled")
    })
    eq(dimmed, true, "container marked disabled")
  })

  await test("aria-invalid slots use the destructive border", async () => {
    const color = await page.evaluate(() =>
      getComputedStyle(document.querySelector('[data-pg="otp-invalid-slot-0"]')).borderTopColor
    )
    const destructive = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue("--destructive").trim()
    )
    eq(color !== "", true, "border color resolved")
    eq(destructive !== "", true, "--destructive token present")
    const matches = await page.evaluate(() => {
      const el = document.querySelector('[data-pg="otp-invalid-slot-0"]')
      const probe = document.createElement("div")
      probe.style.color = "var(--destructive)"
      document.body.appendChild(probe)
      const expected = getComputedStyle(probe).color
      probe.remove()
      return getComputedStyle(el).borderTopColor === expected
    })
    eq(matches, true, "invalid slot border is --destructive")
  })
}
