#!/usr/bin/env node
/**
 * Non-text contrast probe — the half of the sweep axe cannot do.
 *
 * WCAG 1.4.11 asks for 3:1 on the visual boundary of a UI component (a switch
 * track, a checkbox border), but axe's `color-contrast` rule only measures
 * text. Every contrast defect in the D family of `docs/ISSUES.md` is non-text,
 * so axe reports the whole family clean. This measures it directly.
 *
 * Two things it gets right that a naive version does not: computed styles come
 * back in `oklch()`/`oklab()`, so colours are converted by the canvas rather
 * than by parsing numbers out of the string, and translucent values are
 * composited over the resolved backdrop before the ratio is taken.
 *
 *   node scripts/contrast-nontext.mjs
 *
 * Measurement only — it fixes nothing.
 */
import { spawn } from "node:child_process"
import { fileURLToPath } from "node:url"
import { chromium } from "playwright-core"

const PORT = Number(process.env.VANILLIN_PROBE_PORT) || 5197
const baseUrl = `http://localhost:${PORT}`
const vite = spawn("npx", ["vite", "--port", String(PORT), "--strictPort"], {
  cwd: fileURLToPath(new URL("..", import.meta.url)),
  stdio: "ignore",
})
const wait = async () => {
  const end = Date.now() + 15000
  while (Date.now() < end) {
    try { if ((await fetch(baseUrl)).ok) return } catch {}
    await new Promise((r) => setTimeout(r, 200))
  }
  throw new Error("no server")
}

// Optional 5th element per row:
//   { focus: true }      focus the element before reading (focus-ring probes)
//   { exempt: "why" }    measured and printed, never a FAIL — 1.4.11 carve-outs
const probes = [
  ["switch", ".switch", ["backgroundColor", "borderColor"], "D1/D2 switch track"],
  // 1.4.11 explicitly excludes inactive components — measured for the record,
  // but a low ratio here is not a defect. Do not "fix" it.
  ["switch", ".switch[disabled], .switch:disabled", ["backgroundColor", "borderColor"], "D2 switch disabled", { exempt: "1.4.11 exempts inactive components" }],
  ["checkbox", ".checkbox", ["borderColor"], "D5 checkbox"],
  // The unchecked fill sits behind a border that passes on its own; the border
  // is the boundary "required to identify" the control, the fill is not.
  ["checkbox", ".checkbox", ["backgroundColor"], "D5 checkbox fill", { exempt: "fill behind a passing border is not the identifying boundary" }],
  ["attachment", ".attachment", ["borderColor"], "D3 attachment"],
  ["calendar", ".calendar", ["borderColor"], "D4 calendar frame"],
  ["calendar", ".calendar-day-button", ["borderColor"], "D4 calendar day"],
  ["date-input", ".date-input, .time-picker, .time-field", ["color"], "D6 time text"],
  ["input", ".input", ["borderColor"], "input border (baseline)"],
  // D13 — the ring token as the always-outline components render it. The 50%
  // glow variant is a separate open design call; see the D13 entry in
  // docs/ISSUES.md and the placeholder in tests/contrast.test.mjs.
  ["calendar", ".calendar-day-button:not([disabled])", ["outlineColor"], "D13 focus ring (outline)", { focus: true }],
  // Graphical objects (1.4.11's second clause). No chart component exists —
  // chart was excluded from the kit at plan time.
  ["status-dot", '.status-dot[data-status="success"], .status-dot[data-status="warning"], .status-dot[data-status="error"], .status-dot[data-status="info"]', ["backgroundColor"], "status dot"],
  ["progress", ".progress", ["backgroundColor"], "progress track"],
  ["progress", ".progress-indicator", ["backgroundColor"], "progress indicator"],
  ["slider", ".slider-track", ["backgroundColor"], "slider rail"],
  ["slider", ".slider-range", ["backgroundColor"], "slider range"],
]

await wait()
const browser = await chromium.launch({ channel: "chrome" })
const out = []
for (const mode of ["light", "dark"]) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, colorScheme: mode })
  const page = await ctx.newPage()
  for (const [route, selector, props, label, flags = {}] of probes) {
    await page.goto(`${baseUrl}/#${route}`, { waitUntil: "load" })
    await page.waitForTimeout(400)
    const rows = await page.evaluate(
      ({ selector, props, flags }) => {
        const lum = (rgb) => {
          const [r, g, b] = rgb.map((v) => {
            const s = v / 255
            return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
          })
          return 0.2126 * r + 0.7152 * g + 0.0722 * b
        }
        // Computed styles come back as oklch()/oklab(), not rgb — parsing the
        // numbers out of the string yields nonsense. Let the canvas do the
        // colour-space conversion, then composite alpha manually.
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
        const over = (fg, bg) =>
          fg.length < 4 || fg[3] === undefined || fg[3] >= 1
            ? fg.slice(0, 3)
            : [0, 1, 2].map((i) => Math.round(fg[i] * fg[3] + bg[i] * (1 - fg[3])))
        // Walk up for the first opaque backdrop, the way a human eye resolves it.
        const backdrop = (el) => {
          let node = el.parentElement
          while (node) {
            const c = parse(getComputedStyle(node).backgroundColor)
            if (c.length >= 3 && c[3] > 0.9) return c.slice(0, 3)
            node = node.parentElement
          }
          return [255, 255, 255]
        }
        const ratio = (a, b) => {
          const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x)
          return Math.round(((hi + 0.05) / (lo + 0.05)) * 100) / 100
        }
        const results = []
        for (const el of Array.from(document.querySelectorAll(selector)).slice(0, 4)) {
          if (!el.getClientRects().length) continue
          // Script focus with no prior user interaction matches :focus-visible.
          if (flags.focus) el.focus({ preventScroll: true })
          const style = getComputedStyle(el)
          const bg = backdrop(el)
          for (const prop of props) {
            const raw = style[prop]
            const c = parse(raw)
            if (c.length < 3 || c[3] === 0) continue
            const width = prop === "borderColor" ? parseFloat(style.borderWidth) : 1
            if (prop === "borderColor" && !(width > 0)) continue
            if (prop === "outlineColor" && (style.outlineStyle === "none" || !(parseFloat(style.outlineWidth) > 0))) continue
            results.push({
              prop,
              value: raw,
              against: `rgb(${bg.join(",")})`,
              ratio: ratio(over(c, bg), bg),
            })
          }
        }
        return results
      },
      { selector, props, flags },
    )
    for (const row of rows) out.push({ mode, label, route, exempt: flags.exempt, ...row })
  }
  await ctx.close()
}
await browser.close()
vite.kill()

const seen = new Set()
for (const r of out) {
  const key = `${r.mode}|${r.label}|${r.prop}|${r.value}`
  if (seen.has(key)) continue
  seen.add(key)
  const flag = r.ratio >= 3 ? "ok  " : r.exempt ? "exmp" : "FAIL"
  const note = r.exempt && r.ratio < 3 ? `  [exempt: ${r.exempt}]` : ""
  console.log(`${flag} ${r.mode.padEnd(5)} ${r.ratio.toFixed(2).padStart(5)}:1  ${r.label} ${r.prop} ${r.value} on ${r.against}${note}`)
}
