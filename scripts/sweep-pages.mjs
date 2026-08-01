#!/usr/bin/env node
/**
 * Docs-site defect sweep — measurement only, it fixes nothing.
 *
 * Walks every routed page in `site/registry.js` in light and dark, and per
 * page records what a machine can measure without a human eye:
 *
 *   - axe-core `color-contrast` violations, with the measured ratio
 *   - interactive elements whose computed `cursor` gives no affordance
 *   - console errors, React warnings and uncaught page errors
 *   - horizontal document overflow at 1280 and 380
 *   - the left edge of `.pg-main` and of the first `.pg-section`, so a page
 *     that sits adrift from its neighbours shows up as a number (this is how
 *     D8 was eventually diagnosed, after the eye blamed the wrong thing)
 *
 * Screenshots are written for the defects a machine cannot see — clipping,
 * overlap, invisible state — which are reviewed separately.
 *
 *   node scripts/sweep-pages.mjs                 # every page, both modes
 *   node scripts/sweep-pages.mjs select tabs     # substring filter on route
 *   node scripts/sweep-pages.mjs --out /tmp/x    # report + screenshot dir
 *   node scripts/sweep-pages.mjs --no-shots      # skip screenshots
 *
 * Output: `<out>/report.json` plus `<out>/shots/<route>-<mode>.png`.
 * Default `<out>` is `.sweep/` at the repo root — scratch, not committed.
 */

import { spawn } from "node:child_process"
import { mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { fileURLToPath } from "node:url"
import { chromium } from "playwright-core"

const repoRoot = fileURLToPath(new URL("..", import.meta.url))
const PORT = Number(process.env.VANILLIN_SWEEP_PORT) || 5198
const baseUrl = `http://localhost:${PORT}`

const argv = process.argv.slice(2)
const takeFlag = (name) => {
  const at = argv.indexOf(name)
  if (at === -1) return null
  return argv.splice(at, 2)[1]
}
const hasFlag = (name) => {
  const at = argv.indexOf(name)
  if (at === -1) return false
  argv.splice(at, 1)
  return true
}
const outDir = takeFlag("--out") || join(repoRoot, ".sweep")
const shots = !hasFlag("--no-shots")
const filters = argv.filter(Boolean)

// Routes come from the registry rather than a directory listing: a page file
// that nothing routes to is unreachable, and a route is what the user sees.
const registrySource = readFileSync(join(repoRoot, "site/registry.js"), "utf-8")
const routes = []
for (const match of registrySource.matchAll(
  /^\s*"?([\w-]+)"?:\s*\{[^}]*import\("\.\/pages\/([\w\-/]+)\.jsx"\)/gm,
)) {
  const [, route, file] = match
  if (filters.length && !filters.some((f) => route.includes(f))) continue
  routes.push({ route, file: `site/pages/${file}.jsx` })
}
if (!routes.length) throw new Error(`no routes match ${filters.join(",")}`)

const axeSource = readFileSync(join(repoRoot, "node_modules/axe-core/axe.min.js"), "utf-8")

mkdirSync(outDir, { recursive: true })
if (shots) mkdirSync(join(outDir, "shots"), { recursive: true })

const vite = spawn("npx", ["vite", "--port", String(PORT), "--strictPort"], {
  cwd: repoRoot,
  stdio: "ignore",
})

async function waitForServer() {
  const deadline = Date.now() + 15000
  while (Date.now() < deadline) {
    try {
      if ((await fetch(baseUrl)).ok) return
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 200))
  }
  throw new Error(`dev server did not start on :${PORT}`)
}

/** Runs in the browser: contrast, cursor, overflow and geometry for one page. */
async function measure() {
  const results = await window.axe.run(document.body, { runOnly: ["color-contrast"] })
  const contrast = []
  for (const violation of results.violations) {
    for (const node of violation.nodes) {
      const data = (node.any?.[0] || {}).data || {}
      contrast.push({
        impact: node.impact,
        target: node.target.join(" "),
        html: node.html.slice(0, 160),
        ratio: data.contrastRatio ?? null,
        required: data.expectedContrastRatio ?? null,
        fg: data.fgColor ?? null,
        bg: data.bgColor ?? null,
      })
    }
  }

  // A cursor is an affordance claim, so only these count as making one.
  // `not-allowed` is included: it says "disabled", which is also an answer.
  const AFFORDANCES = new Set([
    "pointer",
    "text",
    "grab",
    "grabbing",
    "not-allowed",
    "col-resize",
    "row-resize",
    "ew-resize",
    "ns-resize",
    "nwse-resize",
    "nesw-resize",
    "move",
    "vertical-text",
  ])
  const INTERACTIVE = [
    "button",
    "a[href]",
    "summary",
    "input:not([type=hidden])",
    "select",
    "textarea",
    "[role=button]",
    "[role=link]",
    "[role=option]",
    "[role=menuitem]",
    "[role=menuitemcheckbox]",
    "[role=menuitemradio]",
    "[role=tab]",
    "[role=switch]",
    "[role=checkbox]",
    "[role=radio]",
    "[role=slider]",
    "[role=separator][tabindex]",
    '[tabindex]:not([tabindex="-1"])',
  ].join(",")

  const describe = (el) => {
    const id = el.id ? `#${el.id}` : ""
    const cls = typeof el.className === "string" && el.className ? `.${el.className.trim().split(/\s+/).join(".")}` : ""
    return `${el.tagName.toLowerCase()}${id}${cls}`
  }

  const cursors = []
  const seen = new Set()
  for (const el of document.querySelectorAll(INTERACTIVE)) {
    if (!el.getClientRects().length) continue
    const cursor = getComputedStyle(el).cursor
    if (AFFORDANCES.has(cursor)) continue
    const key = `${describe(el)}|${cursor}`
    if (seen.has(key)) continue
    seen.add(key)
    cursors.push({
      selector: describe(el),
      cursor,
      disabled: el.disabled === true || el.getAttribute("aria-disabled") === "true",
      html: el.outerHTML.slice(0, 140),
    })
  }

  const rect = (selector) => {
    const el = document.querySelector(selector)
    if (!el) return null
    const box = el.getBoundingClientRect()
    return { left: Math.round(box.left), right: Math.round(box.right), width: Math.round(box.width) }
  }

  return {
    contrast,
    cursors,
    overflow: {
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    },
    geometry: { main: rect(".pg-main"), section: rect(".pg-section"), heading: rect(".pg-main h2") },
  }
}

const report = { generatedAt: new Date().toISOString(), routes: routes.length, pages: {} }
let browser
let harnessErrors = 0

try {
  await waitForServer()
  browser = await chromium.launch({ channel: "chrome" })

  for (const mode of ["light", "dark"]) {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 900 },
      colorScheme: mode,
    })
    const page = await context.newPage()

    let sink = []
    page.on("console", (msg) => {
      if (msg.type() === "error" || msg.type() === "warning")
        sink.push({ type: msg.type(), text: msg.text().slice(0, 300) })
    })
    page.on("pageerror", (err) => sink.push({ type: "pageerror", text: String(err).slice(0, 300) }))

    for (const { route, file } of routes) {
      const entry = (report.pages[route] ??= { file, light: null, dark: null })
      sink = []
      try {
        // A real navigation per route, not a hash change: the SPA keeps state
        // across hash routes, and axe caches computed styles from load.
        await page.goto(`${baseUrl}/#${route}`, { waitUntil: "load" })
        await page.waitForTimeout(400)
        await page.evaluate(axeSource)
        const measured = await page.evaluate(measure)

        await page.setViewportSize({ width: 380, height: 900 })
        await page.waitForTimeout(250)
        const narrow = await page.evaluate(() => ({
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: document.documentElement.clientWidth,
        }))
        await page.setViewportSize({ width: 1280, height: 900 })
        await page.waitForTimeout(150)

        if (shots)
          await page.screenshot({
            path: join(outDir, "shots", `${route}-${mode}.png`),
            fullPage: true,
          })

        entry[mode] = { ...measured, narrow, console: sink.slice(0, 20) }
      } catch (err) {
        harnessErrors++
        entry[mode] = { error: String(err).split("\n")[0], console: sink.slice(0, 20) }
      }
      process.stdout.write(`\r${mode}: ${route.padEnd(24)}`)
    }
    await context.close()
    process.stdout.write("\r".padEnd(40) + "\r")
  }
} finally {
  await browser?.close()
  vite.kill()
}

writeFileSync(join(outDir, "report.json"), JSON.stringify(report, null, 2))

const count = (pick) =>
  Object.values(report.pages).reduce(
    (sum, page) => sum + ["light", "dark"].reduce((n, m) => n + (page[m]?.[pick]?.length || 0), 0),
    0,
  )
const overflowing = Object.entries(report.pages).filter(([, page]) =>
  ["light", "dark"].some(
    (m) =>
      page[m]?.overflow && page[m].overflow.scrollWidth > page[m].overflow.clientWidth + 1,
  ),
)
const narrowOverflow = Object.entries(report.pages).filter(([, page]) =>
  ["light", "dark"].some((m) => page[m]?.narrow && page[m].narrow.scrollWidth > page[m].narrow.clientWidth + 1),
)

console.log(`pages swept:        ${routes.length} × 2 modes`)
console.log(`contrast findings:  ${count("contrast")}`)
console.log(`cursor findings:    ${count("cursors")}`)
console.log(`console noise:      ${count("console")}`)
console.log(`overflow @1280:     ${overflowing.length} pages ${overflowing.map(([r]) => r).join(" ")}`)
console.log(`overflow @380:      ${narrowOverflow.length} pages ${narrowOverflow.map(([r]) => r).join(" ")}`)
console.log(`harness errors:     ${harnessErrors}`)
console.log(`report:             ${join(outDir, "report.json")}`)

process.exit(harnessErrors ? 1 : 0)
