export default async function run({ page, baseUrl, test, eq, near }) {
  await page.goto(`${baseUrl}/#attachment`)
  await page.waitForSelector(".attachment-group")

  const CARD = ".attachment-group-viewport > .attachment"
  const group = page.locator(".attachment-group")
  const viewport = page.locator(".attachment-group-viewport")
  const cards = page.locator(CARD)

  // The edge fade is a mask, so a border can be present in computed style and
  // still not be painted. Sample the rendered pixels instead: screenshot the
  // viewport, decode it back through the browser's own PNG decoder, and read
  // how far the border column departs from the card's background beside it.
  const paintedBorder = async (cardIndex, edge) => {
    await group.scrollIntoViewIfNeeded()
    const box = await cards.nth(cardIndex).boundingBox()
    const png = (await page.screenshot()).toString("base64")
    return page.evaluate(
      async ({ png, box, edge }) => {
        const img = new Image()
        img.src = `data:image/png;base64,${png}`
        await img.decode()
        const canvas = document.createElement("canvas")
        canvas.width = img.width
        canvas.height = img.height
        const ctx = canvas.getContext("2d")
        ctx.drawImage(img, 0, 0)
        const scale = img.width / window.innerWidth
        const y = Math.round((box.y + box.height / 2) * scale)
        const at = (x) => ctx.getImageData(Math.round(x * scale), y, 1, 1).data
        const inward = edge === "start" ? 1 : -1
        const edgeX = edge === "start" ? box.x : box.x + box.width - 1
        const background = at(edgeX + inward * 6)
        let strongest = 0
        for (let step = -1; step <= 2; step++) {
          const pixel = at(edgeX + step * inward)
          for (const channel of [0, 1, 2])
            strongest = Math.max(strongest, Math.abs(pixel[channel] - background[channel]))
        }
        return strongest
      },
      { png, box, edge },
    )
  }

  const overflow = async () =>
    viewport.evaluate((el) => el.scrollWidth - el.clientWidth)
  const scrollTo = async (left) => {
    await viewport.evaluate((el, value) => {
      el.scrollLeft = value
    }, left)
    await page.waitForTimeout(250)
    return viewport.evaluate((el) => el.scrollLeft)
  }

  await test("group is scrollable — the precondition for the edge fade", async () => {
    eq((await overflow()) > 0, true, "cards overflow the viewport")
    eq(await cards.count() > 2, true, "more than a first and last card")
  })

  await test("first card's leading border is painted at scroll start", async () => {
    eq(await scrollTo(0), 0)
    eq((await overflow()) > 0, true, "still scrollable")
    const first = await paintedBorder(0, "start")
    const interior = await paintedBorder(1, "start")
    eq(first > 10, true, `first card leading border contrast was ${first}`)
    near(first, interior, 3, "first card's border is as solid as an interior card's")
  })

  await test("last card's trailing border is painted at scroll end", async () => {
    const max = await overflow()
    eq(await scrollTo(max), max, "scrolled to the end")
    const count = await cards.count()
    const last = await paintedBorder(count - 1, "end")
    const interior = await paintedBorder(count - 2, "end")
    eq(last > 10, true, `last card trailing border contrast was ${last}`)
    near(last, interior, 3, "last card's border is as solid as an interior card's")
  })

  await test("viewport inset matches the fade width, so edges clear the mask", async () => {
    const geometry = await viewport.evaluate((el) => {
      const style = getComputedStyle(el)
      const fade = getComputedStyle(el.parentElement).getPropertyValue("--attachment-group-fade")
      return {
        paddingInlineStart: style.paddingInlineStart,
        paddingInlineEnd: style.paddingInlineEnd,
        scrollPaddingInlineStart: style.scrollPaddingInlineStart,
        scrollPaddingInlineEnd: style.scrollPaddingInlineEnd,
        fade: fade.trim(),
        // Chrome serializes the `transparent` stop as rgba(0, 0, 0, 0).
        masked: /rgba\(0,\s*0,\s*0,\s*0\)/.test(getComputedStyle(el.parentElement).maskImage),
      }
    })
    eq(geometry.masked, true, "the edge fade is still a mask that reaches transparent")
    eq(geometry.fade, "1rem")
    eq(geometry.paddingInlineStart, "16px")
    eq(geometry.paddingInlineEnd, "16px")
    eq(geometry.scrollPaddingInlineStart, "16px", "snapped leading edges clear the fade too")
    eq(geometry.scrollPaddingInlineEnd, "16px", "and so do snapped trailing edges")
  })
}
