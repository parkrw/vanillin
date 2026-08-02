export default async function run({ page, baseUrl, test, eq }) {
  /* ================================================================
     Non-text contrast (WCAG 1.4.11) — asserts the *measured* ratio of
     control boundaries and focus indicators, never the token string
     (docs/ISSUES.md D9/D13; H1 precedent). Mirrors the measurement in
     scripts/contrast-nontext.mjs: computed styles come back as oklch(),
     so colours go through the canvas, and translucent values are
     composited over the resolved backdrop before the ratio is taken —
     see docs/TODO/notes/measuring-colour.md.
     ================================================================ */

  const ratioOf = (selector, prop) =>
    page.evaluate(
      ({ selector, prop }) => {
        const ctx2d = document.createElement("canvas").getContext("2d", { willReadFrequently: true })
        const parse = (css) => {
          ctx2d.clearRect(0, 0, 1, 1)
          ctx2d.fillStyle = "#000"
          ctx2d.fillStyle = css
          if (ctx2d.fillStyle === "#000" && !/^(#000|black|rgb\(0, 0, 0\))/.test(css)) return []
          ctx2d.fillRect(0, 0, 1, 1)
          const d = ctx2d.getImageData(0, 0, 1, 1).data
          return [d[0], d[1], d[2], d[3] / 255]
        }
        const lum = (rgb) => {
          const [r, g, b] = rgb.map((v) => {
            const s = v / 255
            return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
          })
          return 0.2126 * r + 0.7152 * g + 0.0722 * b
        }
        const el = document.querySelector(selector)
        if (!el) return NaN
        let bg = [255, 255, 255]
        for (let node = el.parentElement; node; node = node.parentElement) {
          const c = parse(getComputedStyle(node).backgroundColor)
          if (c.length >= 3 && c[3] > 0.9) { bg = c.slice(0, 3); break }
        }
        const c = parse(getComputedStyle(el)[prop])
        if (c.length < 3 || c[3] === 0) return NaN
        const over = c[3] >= 1 ? c.slice(0, 3) : [0, 1, 2].map((i) => Math.round(c[i] * c[3] + bg[i] * (1 - c[3])))
        const [hi, lo] = [lum(over), lum(bg)].sort((x, y) => y - x)
        return Math.round(((hi + 0.05) / (lo + 0.05)) * 100) / 100
      },
      { selector, prop },
    )

  for (const scheme of ["light", "dark"]) {
    // color-scheme.js reads prefers-color-scheme at import time, so emulate
    // before a real navigation — never toggle .dark on a loaded page, and
    // never rely on a hash-only (same-document) goto to pick up the scheme.
    await page.emulateMedia({ colorScheme: scheme })
    await page.goto("about:blank")

    await page.goto(`${baseUrl}/#input`)
    await page.waitForSelector(".input")

    await test(`1.4.11 ${scheme}: input border >= 3:1 (D9)`, async () => {
      const r = await ratioOf(".input", "borderColor")
      eq(r >= 3, true, `.input borderColor is ${r}:1`)
    })

    await test(`1.4.11 ${scheme}: focused input border >= 3:1 (D13)`, async () => {
      await page.locator(".input").first().focus()
      const r = await ratioOf(".input:focus-visible", "borderColor")
      eq(r >= 3, true, `.input:focus-visible borderColor (--ring) is ${r}:1`)
    })

    await page.goto(`${baseUrl}/#attachment`)
    await page.waitForSelector(".attachment")

    await test(`1.4.11 ${scheme}: attachment border >= 3:1 (D3)`, async () => {
      const r = await ratioOf(".attachment", "borderColor")
      eq(r >= 3, true, `.attachment borderColor is ${r}:1`)
    })

    await test(`1.4.11 ${scheme}: attachment error border >= 3:1 (D3)`, async () => {
      const r = await ratioOf('.attachment[data-state="error"]', "borderColor")
      eq(r >= 3, true, `.attachment[data-state=error] borderColor is ${r}:1`)
    })

    await page.goto(`${baseUrl}/#checkbox`)
    await page.waitForSelector(".checkbox")

    await test(`1.4.11 ${scheme}: checkbox border >= 3:1 (D5)`, async () => {
      const r = await ratioOf(".checkbox", "borderColor")
      eq(r >= 3, true, `.checkbox borderColor is ${r}:1`)
    })

    await page.goto(`${baseUrl}/#switch`)
    await page.waitForSelector(".switch")

    await test(`1.4.11 ${scheme}: switch track >= 3:1 (D1/D2)`, async () => {
      const r = await ratioOf('.switch[data-state="unchecked"]', "backgroundColor")
      eq(r >= 3, true, `.switch track backgroundColor is ${r}:1`)
    })

    // Not asserted yet: components whose only focus indicator is the 50%-alpha
    // ring glow (button, checkbox, toggle, …) measure ~1.7:1 light — see the
    // D13 update in docs/ISSUES.md. Add a .btn:focus-visible row when the
    // kit-wide glow decision lands.
  }

  await page.emulateMedia({ colorScheme: "light" })
}
