export default async function run({ page, baseUrl, test, eq, near }) {
  await page.goto(`${baseUrl}/#typography`)
  await page.locator('[data-pg="typeset-base"]').waitFor()

  await test("typeset base: h1 font-size is --typeset-size * 2.25", async () => {
    const h1 = page.locator('[data-pg="typeset-base"] h1')
    const size = await h1.evaluate((el) => parseFloat(getComputedStyle(el).fontSize))
    const baseSize = await page.locator('[data-pg="typeset-base"]').evaluate(
      (el) => parseFloat(getComputedStyle(el).fontSize),
    )
    near(size, baseSize * 2.25, 1, `h1 fontSize ${size} ≈ ${baseSize * 2.25}`)
  })

  await test("typeset base: h2 font-size is --typeset-size * 1.875", async () => {
    const h2 = page.locator('[data-pg="typeset-base"] h2')
    const size = await h2.evaluate((el) => parseFloat(getComputedStyle(el).fontSize))
    const baseSize = await page.locator('[data-pg="typeset-base"]').evaluate(
      (el) => parseFloat(getComputedStyle(el).fontSize),
    )
    near(size, baseSize * 1.875, 1, `h2 fontSize ${size} ≈ ${baseSize * 1.875}`)
  })

  await test("typeset base: p line-height matches --typeset-leading", async () => {
    const p = page.locator('[data-pg="typeset-base"] p').first()
    const lh = await p.evaluate((el) => {
      const s = getComputedStyle(el)
      return parseFloat(s.lineHeight) / parseFloat(s.fontSize)
    })
    near(lh, 1.75, 0.05, `p line-height ratio ${lh} ≈ 1.75`)
  })

  await test("typeset base: p margin-top matches --typeset-flow", async () => {
    const margin = await page.locator('[data-pg="typeset-base"] p').first().evaluate(
      (el) => parseFloat(getComputedStyle(el).marginTop),
    )
    // --typeset-flow is 1.5rem = 24px at default root font-size
    const flow = await page.locator('[data-pg="typeset-base"]').evaluate((el) => {
      const tmp = document.createElement("div")
      tmp.style.cssText = "width: var(--typeset-flow); position: absolute; visibility: hidden"
      el.appendChild(tmp)
      const px = tmp.getBoundingClientRect().width
      tmp.remove()
      return px
    })
    near(margin, flow, 1, `p margin-top ${margin} ≈ flow ${flow}`)
  })

  await test("typeset base: code uses --typeset-font-mono", async () => {
    const code = page.locator('[data-pg="typeset-base"] code').first()
    const family = await code.evaluate((el) => getComputedStyle(el).fontFamily)
    const monoToken = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--font-mono").trim())
    const expected = monoToken.split(",")[0].trim().replace(/"/g, "")
    eq(family.includes(expected), true, `code font-family includes ${expected}`)
  })

  await test("docs preset: larger flow than base", async () => {
    const baseMargin = await page.locator('[data-pg="typeset-base"] p').first().evaluate(
      (el) => parseFloat(getComputedStyle(el).marginTop),
    )
    const docsMargin = await page.locator('[data-pg="typeset-docs"] p').first().evaluate(
      (el) => parseFloat(getComputedStyle(el).marginTop),
    )
    eq(docsMargin > baseMargin, true, `docs flow ${docsMargin} > base flow ${baseMargin}`)
  })

  await test("chat preset: smaller font-size than base", async () => {
    const baseSize = await page.locator('[data-pg="typeset-base"] p').first().evaluate(
      (el) => parseFloat(getComputedStyle(el).fontSize),
    )
    const chatSize = await page.locator('[data-pg="typeset-chat"] p').first().evaluate(
      (el) => parseFloat(getComputedStyle(el).fontSize),
    )
    eq(chatSize < baseSize, true, `chat size ${chatSize} < base size ${baseSize}`)
  })

  await test("chat preset: tighter leading than base", async () => {
    const baseLH = await page.locator('[data-pg="typeset-base"] p').first().evaluate(
      (el) => parseFloat(getComputedStyle(el).lineHeight) / parseFloat(getComputedStyle(el).fontSize),
    )
    const chatLH = await page.locator('[data-pg="typeset-chat"] p').first().evaluate(
      (el) => parseFloat(getComputedStyle(el).lineHeight) / parseFloat(getComputedStyle(el).fontSize),
    )
    eq(chatLH < baseLH, true, `chat leading ${chatLH} < base leading ${baseLH}`)
  })

  await test("custom rhythm: overridden --typeset-size propagates to h3", async () => {
    const h3 = page.locator('[data-pg="typeset-custom"] h3')
    const size = await h3.evaluate((el) => parseFloat(getComputedStyle(el).fontSize))
    near(size, 18 * 1.5, 1, `custom h3 fontSize ${size} ≈ ${18 * 1.5}`)
  })

  await test("opt-out: .not-typeset p reverts to page font-size", async () => {
    const typesetSize = await page.locator('[data-pg="typeset-optout"] > p').first().evaluate(
      (el) => parseFloat(getComputedStyle(el).fontSize),
    )
    const optoutSize = await page.locator('[data-pg="not-typeset"] p').evaluate(
      (el) => parseFloat(getComputedStyle(el).fontSize),
    )
    eq(optoutSize !== typesetSize || optoutSize <= 16, true,
      `opt-out size ${optoutSize} differs from typeset ${typesetSize} or is body default`)
  })

  await test("typography component: h1 matches typeset h1 scale", async () => {
    const typesetH1 = await page.locator('[data-pg="typeset-base"] h1').evaluate(
      (el) => parseFloat(getComputedStyle(el).fontSize),
    )
    const typographyH1 = await page.locator('.typography h1').evaluate(
      (el) => parseFloat(getComputedStyle(el).fontSize),
    )
    near(typographyH1, typesetH1, 1, `typography h1 ${typographyH1} ≈ typeset h1 ${typesetH1}`)
  })
}
