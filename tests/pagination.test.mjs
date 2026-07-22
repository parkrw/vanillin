export default async function run({ page, baseUrl, test, eq }) {
  await page.goto(`${baseUrl}/#pagination`)
  await page.waitForSelector(".pagination")

  const nav = page.locator('nav[aria-label="pagination"]').first()

  await test("nav landmark with pagination label", async () => {
    eq(await nav.count(), 1)
    eq(await nav.evaluate((el) => el.tagName), "NAV")
    eq(await nav.locator("ul.pagination-content > li").first().evaluate((el) => el.tagName), "LI")
  })

  await test("active link is aria-current=page with outline style", async () => {
    const active = nav.locator('a[aria-current="page"]')
    eq(await active.count(), 1)
    eq(await active.textContent(), "2")
    eq(await active.evaluate((el) => el.classList.contains("btn--outline")), true)
    eq(await active.evaluate((el) => el.classList.contains("btn--icon")), true)
  })

  await test("inactive links are ghost buttons without aria-current", async () => {
    const link = nav.locator("a", { hasText: "1" }).first()
    eq(await link.getAttribute("aria-current"), null)
    eq(await link.evaluate((el) => el.classList.contains("btn--ghost")), true)
  })

  await test("previous/next have aria-labels and default size", async () => {
    const prev = nav.locator('a[aria-label="Go to previous page"]')
    const next = nav.locator('a[aria-label="Go to next page"]')
    eq(await prev.count(), 1)
    eq(await next.count(), 1)
    eq(await prev.evaluate((el) => el.classList.contains("btn--icon")), false)
  })

  await test("ellipsis is hidden from the tree with sr-only text", async () => {
    const ellipsis = nav.locator(".pagination-ellipsis")
    eq(await ellipsis.getAttribute("aria-hidden"), "true")
    eq(await ellipsis.locator(".sr-only").textContent(), "More pages")
  })

  await test("disabled previous link is not clickable", async () => {
    const disabled = page.locator('[aria-label="First page pagination"] a[aria-disabled="true"]')
    eq(await disabled.count(), 1)
    eq(await disabled.getAttribute("aria-label"), "Go to previous page")
  })
}
