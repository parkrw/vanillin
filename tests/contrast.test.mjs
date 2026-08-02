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
        // Text sits on the element's own background; borders sit on the parent's.
        for (let node = prop === "color" ? el : el.parentElement; node; node = node.parentElement) {
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

    await page.goto(`${baseUrl}/#bubble`)
    await page.waitForSelector(".bubble")

    await test(`1.4.3 ${scheme}: bubble destructive text >= 4.5:1 (D11)`, async () => {
      const r = await ratioOf(".bubble--destructive > .bubble-content", "color")
      eq(r >= 4.5, true, `.bubble--destructive text is ${r}:1`)
    })

    await test(`1.4.3 ${scheme}: active nav link >= 4.5:1 (D12)`, async () => {
      const r = await ratioOf('.pg-nav-link[data-active="true"]', "color")
      eq(r >= 4.5, true, `.pg-nav-link[data-active] is ${r}:1`)
    })

    await test(`1.4.3 ${scheme}: --muted-foreground on --muted >= 4.5:1 (D10)`, async () => {
      const r = await page.evaluate(() => {
        const ctx2d = document.createElement("canvas").getContext("2d", { willReadFrequently: true })
        const parse = (css) => {
          ctx2d.clearRect(0, 0, 1, 1)
          ctx2d.fillStyle = css
          ctx2d.fillRect(0, 0, 1, 1)
          return Array.from(ctx2d.getImageData(0, 0, 1, 1).data)
        }
        const lum = ([r, g, b]) => {
          const [lr, lg, lb] = [r, g, b].map((v) => {
            const s = v / 255
            return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
          })
          return 0.2126 * lr + 0.7152 * lg + 0.0722 * lb
        }
        const token = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim()
        const [hi, lo] = [lum(parse(token("--muted-foreground"))), lum(parse(token("--muted")))].sort((x, y) => y - x)
        return Math.round(((hi + 0.05) / (lo + 0.05)) * 100) / 100
      })
      eq(r >= 4.5, true, `--muted-foreground on --muted is ${r}:1`)
    })

    await page.goto(`${baseUrl}/#button`)
    await page.waitForSelector(".btn")

    await test(`1.4.11 ${scheme}: button focus glow >= 3:1 (D13)`, async () => {
      // The glow is the button's only focus indicator, so its box-shadow
      // colour is the compliance surface (settled: solid var(--ring), not
      // 50% alpha — see D13 in docs/ISSUES.md).
      const r = await page.evaluate(async () => {
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
        const el = document.querySelector(".btn")
        el.focus()
        // box-shadow transitions over --motion-fast; let it settle.
        await new Promise((resolve) => setTimeout(resolve, 300))
        const shadow = getComputedStyle(el).boxShadow
        const m = shadow.match(/^(rgba?\([^)]*\)|(?:oklch|oklab|color)\([^)]*\))/)
        if (!m) return NaN
        let bg = [255, 255, 255]
        for (let node = el.parentElement; node; node = node.parentElement) {
          const c = parse(getComputedStyle(node).backgroundColor)
          if (c.length >= 3 && c[3] > 0.9) { bg = c.slice(0, 3); break }
        }
        const c = parse(m[1])
        if (c.length < 3 || c[3] === 0) return NaN
        const over = c[3] >= 1 ? c.slice(0, 3) : [0, 1, 2].map((i) => Math.round(c[i] * c[3] + bg[i] * (1 - c[3])))
        const [hi, lo] = [lum(over), lum(bg)].sort((x, y) => y - x)
        return Math.round(((hi + 0.05) / (lo + 0.05)) * 100) / 100
      })
      eq(r >= 3, true, `.btn:focus-visible glow is ${r}:1`)
    })
  }

  await page.emulateMedia({ colorScheme: "light" })
}
