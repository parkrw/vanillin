const settle = (page) =>
  page.evaluate(
    () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
  )

export default async function run({ page, baseUrl, test, eq, near }) {
  await page.goto(`${baseUrl}/#message-scroller`)
  await page.waitForSelector(".message-scroller")

  const frame = page.locator(".message-scroller")
  const viewport = page.locator(".message-scroller-viewport")
  const append = page.locator('button[aria-label="Append message"]')
  const distanceFromEnd = () =>
    viewport.evaluate((el) => el.scrollHeight - el.scrollTop - el.clientHeight)

  await test("starts pinned to the live edge", async () => {
    eq((await distanceFromEnd()) < 2, true, "at bottom")
    eq(await frame.getAttribute("data-state"), "following")
  })

  await test("appending while at end keeps view pinned", async () => {
    await append.click()
    await page.waitForFunction(() => {
      const el = document.querySelector(".message-scroller-viewport")
      return el.scrollHeight - el.scrollTop - el.clientHeight < 2
    })
    eq(await frame.getAttribute("data-state"), "following")
  })

  await test("wheel-up releases follow", async () => {
    await viewport.hover()
    await page.mouse.wheel(0, -300)
    await page.waitForFunction(
      () => document.querySelector(".message-scroller").dataset.state === "released"
    )
    eq((await distanceFromEnd()) > 2, true, "scrolled away")
  })

  await test("append after release does not move scroll", async () => {
    const before = await viewport.evaluate((el) => el.scrollTop)
    await append.click()
    await settle(page)
    near(await viewport.evaluate((el) => el.scrollTop), before, 1, "scrollTop")
    eq(await frame.getAttribute("data-state"), "released")
  })

  await test("prepend preserves visual position", async () => {
    const anchorTop = () =>
      page.evaluate(() => {
        const vp = document.querySelector(".message-scroller-viewport")
        const items = [...vp.querySelectorAll(".message-scroller-item")]
        const item = items.find((el) => el.getBoundingClientRect().bottom > vp.getBoundingClientRect().top)
        return { id: item.dataset.messageId, top: item.getBoundingClientRect().top }
      })
    const before = await anchorTop()
    await page.locator('button[aria-label="Prepend messages"]').click()
    await settle(page)
    const after = await page.evaluate((id) => {
      const el = document.querySelector(`.message-scroller-item[data-message-id="${id}"]`)
      return el.getBoundingClientRect().top
    }, before.id)
    near(after, before.top, 1, "anchor item top")
  })
}
