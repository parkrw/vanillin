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

  const button = page.locator(".message-scroller-button")

  await test("scroll button is active while content is below", async () => {
    eq(await button.getAttribute("data-active"), "true")
    eq(await button.isDisabled(), false)
  })

  await test("button click returns to bottom and re-engages follow", async () => {
    await button.click()
    // Wait on the component state, not the scroll position — the follow
    // listener re-engages a frame after the viewport reaches the end.
    await page.waitForFunction(
      () => document.querySelector(".message-scroller").dataset.state === "following"
    )
    eq((await distanceFromEnd()) < 2, true, "at bottom")
    eq(await button.getAttribute("data-active"), "false")
    eq(await button.isDisabled(), true)
    await append.click()
    await settle(page)
    eq((await distanceFromEnd()) < 2, true, "still pinned after append")
  })

  await test("visibility hook reports on-screen message ids", async () => {
    await settle(page)
    const ids = (await page.locator('output[aria-label="Visible messages"]').textContent()).split(" ")
    const last = await page.evaluate(
      () => [...document.querySelectorAll(".message-scroller-item")].at(-1).dataset.messageId
    )
    eq(ids.includes(last), true, "newest visible")
    eq(ids.includes("m1"), false, "scrolled-out id absent")
    eq(await page.locator('output[aria-label="Current anchor"]').textContent(), ids[0], "anchor = first visible")
  })

  await test("scrollable hook flags direction with content", async () => {
    eq(
      await page.locator('output[aria-label="Scrollable"]').textContent(),
      "start:true end:false",
      "at bottom"
    )
  })
}
