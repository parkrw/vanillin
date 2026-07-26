export default async function run({ page, baseUrl, repoRoot, test, eq }) {
  await page.goto(`${baseUrl}/#textarea`)
  await page.waitForSelector(".textarea")

  // Check whether the browser supports field-sizing: content
  const supportsFieldSizing = await page.evaluate(() =>
    CSS.supports("field-sizing", "content"),
  )

  await test("default textarea does not have auto-resize class", async () => {
    const ta = page.locator(".pg-section", { hasText: "Default" }).locator(".textarea")
    const classes = await ta.getAttribute("class")
    eq(classes.includes("textarea--auto-resize"), false)
  })

  await test("autoResize textarea has the modifier class", async () => {
    const ta = page.locator('.textarea[aria-label="Auto resize"]')
    const classes = await ta.getAttribute("class")
    eq(classes.includes("textarea--auto-resize"), true)
  })

  if (supportsFieldSizing) {
    await test("autoResize textarea grows with content", async () => {
      const ta = page.locator('.textarea[aria-label="Auto resize"]')
      const emptyBox = await ta.boundingBox()
      const emptyHeight = emptyBox.height

      // Type enough lines to grow
      await ta.focus()
      const lines = "line\n".repeat(10)
      await ta.fill(lines)
      await page.waitForTimeout(100)
      const filledBox = await ta.boundingBox()
      eq(filledBox.height > emptyHeight, true, "textarea grew")
    })

    await test("autoResize textarea stops at max-height and scrolls", async () => {
      const ta = page.locator('.textarea[aria-label="Auto resize"]')
      // Fill with a huge block of text
      const bigText = "line\n".repeat(80)
      await ta.fill(bigText)
      await page.waitForTimeout(100)
      const box = await ta.boundingBox()
      // max-height is 20rem = 320px at default 16px root font-size
      // Allow some tolerance for border/padding
      eq(box.height <= 340, true, `capped at max-height (got ${box.height}px)`)

      // Should be scrollable
      const scrollable = await ta.evaluate((el) => el.scrollHeight > el.clientHeight)
      eq(scrollable, true, "scrolls when capped")
    })

    await test("autoResize textarea shrinks back when content is removed", async () => {
      const ta = page.locator('.textarea[aria-label="Auto resize"]')
      // Clear the textarea
      await ta.fill("")
      await page.waitForTimeout(100)
      const emptyBox = await ta.boundingBox()
      // rows=3, so should maintain a minimum height (roughly 3 lines)
      eq(emptyBox.height > 30, true, "keeps rows minimum height")
      eq(emptyBox.height < 200, true, "shrank back from filled state")
    })

    await test("empty autoResize textarea respects rows minimum", async () => {
      const ta = page.locator('.textarea[aria-label="Auto resize empty"]')
      const box = await ta.boundingBox()
      // rows=2, so should have some meaningful height, not collapsed
      eq(box.height > 20, true, "not collapsed to zero")
    })
  } else {
    // field-sizing unsupported — textarea should behave normally
    await test("without field-sizing support, autoResize textarea has normal height", async () => {
      const ta = page.locator('.textarea[aria-label="Auto resize"]')
      const beforeBox = await ta.boundingBox()
      await ta.fill("line\n".repeat(10))
      await page.waitForTimeout(100)
      const afterBox = await ta.boundingBox()
      // Without field-sizing, the textarea should not grow automatically
      eq(Math.abs(afterBox.height - beforeBox.height) < 2, true, "height unchanged")
    })
  }

  await test("default textarea height unchanged when typing", async () => {
    const ta = page.locator(".pg-section", { hasText: "Default" }).locator(".textarea")
    const beforeBox = await ta.boundingBox()
    await ta.fill("line\n".repeat(5))
    await page.waitForTimeout(100)
    const afterBox = await ta.boundingBox()
    eq(Math.abs(afterBox.height - beforeBox.height) < 2, true, "height unchanged without autoResize")
  })
}
