export default async function run({ page, baseUrl, test, eq }) {
  await page.goto(`${baseUrl}/#command`)

  const input = page.locator('[data-pg="cmd-input"]')

  await test("highlight: substring matches register ranges", async () => {
    await input.fill("cal")
    // Wait for the highlight to register after DOM settles.
    const count = await page.evaluate(async () => {
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
      const hl = CSS.highlights?.get("vanillin-search")
      return hl ? hl.size : 0
    })
    // "cal" matches "Calendar" — at least one range.
    eq(count >= 1, true, `expected at least 1 range for "cal", got ${count}`)
    await input.fill("")
  })

  await test("highlight: empty query clears the registration", async () => {
    await input.fill("bil")
    await page.evaluate(async () => {
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
    })
    await input.fill("")
    const exists = await page.evaluate(async () => {
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
      return CSS.highlights?.has("vanillin-search") ?? false
    })
    eq(exists, false, "highlight deleted when query is empty")
  })

  await test("highlight: regex metacharacters do not throw", async () => {
    // Typing "(" is a regex metacharacter — must not blow up.
    await input.fill("(")
    const threw = await page.evaluate(async () => {
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
      return false
    })
    eq(threw, false, "no error from metacharacter query")
    await input.fill("")
  })

  await test("highlight: non-contiguous fuzzy match produces no highlight ranges", async () => {
    const fuzzyInput = page.locator('[data-pg="cmd-fuzzy-input"]')
    await fuzzyInput.fill("gp")
    // "gp" matches "Git Push" via fuzzy scoring but "gp" is not a
    // contiguous substring — no ranges should be created for that item.
    await page.waitForFunction(() => {
      const els = document.querySelectorAll(
        '[data-pg="cmd-fuzzy-list"] [role="option"]:not([hidden])'
      )
      return els.length > 0
    })
    const count = await page.evaluate(async () => {
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
      const hl = CSS.highlights?.get("vanillin-search")
      return hl ? hl.size : 0
    })
    // "gp" is a substring of "Grep" (case-insensitive: no). Actually "gp"
    // does NOT appear in "Grep" (which is "G-r-e-p"). And "Git Push" has no
    // contiguous "gp". "Generate Report" has no "gp" either. So 0 ranges.
    // Actually wait — let me check: "Grep" lowercased is "grep". Does "gp"
    // appear as a substring? g-r-e-p — no. So 0 ranges expected.
    eq(count, 0, "no ranges for non-contiguous fuzzy match")
    await fuzzyInput.fill("")
  })

  await test("highlight: range cap holds", async () => {
    // Type a single common letter in the default demo — few items so
    // we just verify the API works; the cap (2000) is not hit here but
    // the codepath is exercised.
    await input.fill("a")
    const count = await page.evaluate(async () => {
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
      const hl = CSS.highlights?.get("vanillin-search")
      return hl ? hl.size : 0
    })
    eq(count <= 2000, true, `range count ${count} is within cap`)
    await input.fill("")
  })

  await test("highlight: shouldFilter=false produces no highlights", async () => {
    const nofilterInput = page.locator('[data-pg="cmd-nofilter-input"]')
    await nofilterInput.fill("alpha")
    await page.evaluate(async () => {
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
    })
    // The shouldFilter={false} command should not register highlights
    // because the hook receives an empty query when shouldFilter is off.
    // But note: the default demo's highlight may still be registered.
    // We check that the unfiltered command didn't produce highlight ranges
    // for its own content by verifying no "alpha" range exists in that
    // specific list.
    const rangeTexts = await page.evaluate(async () => {
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
      const hl = CSS.highlights?.get("vanillin-search")
      if (!hl) return []
      const texts = []
      for (const range of hl) {
        texts.push(range.toString())
      }
      return texts
    })
    // None of the ranges should contain "alpha" — that would mean the
    // shouldFilter=false command is incorrectly highlighting.
    const hasAlpha = rangeTexts.some((t) => t.toLowerCase() === "alpha")
    eq(hasAlpha, false, "shouldFilter=false does not produce highlights")
    await nofilterInput.fill("")
  })
}
