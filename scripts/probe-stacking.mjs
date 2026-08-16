#!/usr/bin/env node
/**
 * Overlay stacking probe — measurement only, it fixes nothing.
 *
 * `sweep-pages.mjs` measures contrast, cursor, overflow and geometry. None of
 * those can see an overlay that opens correctly and is then painted over by
 * something else, which is why `ui/navigation-menu`'s viewport mode shipped
 * with a sibling menu drawing through its open panel.
 *
 * So: open each overlay, then ask the document what is actually on top. For a
 * grid of points across the panel, `elementFromPoint` must return the panel or
 * one of its descendants. Anything else is a point where the user sees through
 * the panel to the page beneath.
 *
 * The grid matters. A three-point sample (centre plus two corners) reports the
 * navigation-menu defect as clean — the intruding element is one row of
 * triggers across the panel's middle, and the three points straddle it.
 *
 * Triggers are addressed by component class where one exists and by the docs
 * page's `data-pg` hook where it does not (`ui/context-menu`'s trigger renders
 * no class of its own). Those hooks belong to `site/pages/**`; if a page drops
 * one the probe reports `no-trigger`, which is loud rather than a silent pass.
 *
 *   node scripts/probe-stacking.mjs              # every overlay
 *   node scripts/probe-stacking.mjs select combo # substring filter on route
 *   node scripts/probe-stacking.mjs --json       # machine-readable
 *
 * Exit code is 0 when the probe ran, whatever it found — a finding is a
 * result, not a harness error. Non-zero means it could not measure.
 */

import { spawn } from "node:child_process"
import { fileURLToPath } from "node:url"
import { chromium } from "playwright-core"

const repoRoot = fileURLToPath(new URL("..", import.meta.url))
const PORT = Number(process.env.VANILLIN_STACK_PORT) || 5196
const baseUrl = `http://localhost:${PORT}`

const argv = process.argv.slice(2)
const asJson = argv.includes("--json")
const filters = argv.filter((a) => !a.startsWith("--"))

/**
 * One case per overlay. `panel` is the element that must end up on top;
 * `open` is how a human opens it. Every panel here is a surface a user reads
 * content off, so being painted over is always a defect.
 */
const CASES = [
  { route: "navigation-menu", panel: ".navigation-menu-viewport, .navigation-menu-content:not([hidden])", open: "hover", trigger: ".navigation-menu-trigger" },
  { route: "dropdown-menu", panel: ".dropdown-menu", open: "click", trigger: "[aria-haspopup='menu']" },
  { route: "context-menu", panel: ".context-menu", open: "contextmenu", trigger: "[data-pg='context-trigger']" },
  { route: "popover", panel: ".popover", open: "click", trigger: "[aria-haspopup='dialog']" },
  { route: "tooltip", panel: ".tooltip", open: "hover", trigger: "[aria-describedby], .tooltip-trigger" },
  { route: "hover-card", panel: ".hover-card", open: "hover", trigger: ".hover-card-trigger" },
  { route: "select", panel: ".select-content", open: "click", trigger: ".select-trigger" },
  { route: "combobox", panel: ".combobox-content", open: "click", trigger: ".combobox-trigger, .combobox-input" },
  { route: "menubar", panel: ".menubar-content", open: "click", trigger: ".menubar-trigger" },
  { route: "command", panel: ".command-dialog", open: "click", trigger: "[data-pg='cmd-dialog-trigger']" },
]

const cases = filters.length ? CASES.filter((c) => filters.some((f) => c.route.includes(f))) : CASES
if (!cases.length) throw new Error(`no overlay case matches ${filters.join(",")}`)

const vite = spawn("npx", ["vite", "--port", String(PORT), "--strictPort"], {
  cwd: repoRoot,
  stdio: "ignore",
})

async function waitForServer() {
  const deadline = Date.now() + 20000
  while (Date.now() < deadline) {
    try {
      if ((await fetch(baseUrl)).ok) return
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 200))
  }
  throw new Error(`dev server did not start on :${PORT}`)
}

/** Runs in the browser: is `panel` the topmost paint at every point across it? */
function measure({ panel }) {
  const paintedPanels = [...document.querySelectorAll(`.pg-main ${panel.split(", ").join(", .pg-main ")}`)].filter((el) => {
    // A closed popover keeps its box but paints nothing, so size alone is not
    // evidence it is on screen — ask the Popover API directly.
    if (el.hasAttribute("popover") && !el.matches(":popover-open")) return false
    const box = el.getBoundingClientRect()
    const style = getComputedStyle(el)
    return box.width > 8 && box.height > 8 && style.visibility !== "hidden" && style.opacity !== "0" && style.display !== "none"
  })
  if (!paintedPanels.length) return { opened: false }

  const el = paintedPanels[0]
  const box = el.getBoundingClientRect()
  const style = getComputedStyle(el)

  // `elementFromPoint` reports hit-testing order, not paint order, so a panel
  // that deliberately ignores the pointer (tooltip, `tooltip.css:18`) can never
  // win it and reported 49/49 covered on the first run. Lend it the pointer for
  // the length of the measurement and the hit test answers the paint-order
  // question instead. No event is dispatched and the pointer does not move, so
  // the tooltip's own hover bookkeeping never sees this.
  //
  // Residual blind spot, and the reason this is `forced` rather than plain
  // `ok`: an intruder that is itself `pointer-events: none` still paints over
  // the panel and is still invisible here. Only the panel is lent the pointer.
  const forced = style.pointerEvents === "none"
  if (forced) el.style.setProperty("pointer-events", "auto", "important")

  // 7x7 interior grid, inset so a 1px border does not count as an intruder.
  const STEPS = 7
  const inset = 4
  const covered = []
  try {
    for (let row = 0; row < STEPS; row++) {
      for (let col = 0; col < STEPS; col++) {
        const x = box.left + inset + ((box.width - inset * 2) * col) / (STEPS - 1)
        const y = box.top + inset + ((box.height - inset * 2) * row) / (STEPS - 1)
        if (x < 0 || y < 0 || x > innerWidth || y > innerHeight) continue
        const hit = document.elementFromPoint(x, y)
        if (!hit) continue
        if (hit === el || el.contains(hit)) continue
        covered.push({
          at: [Math.round(x), Math.round(y)],
          by: (hit.className && String(hit.className).slice(0, 60)) || hit.tagName,
        })
      }
    }
  } finally {
    if (forced) el.style.removeProperty("pointer-events")
  }

  // Collapse to distinct intruders — one bug reports as one line, not 20 points.
  const intruders = [...new Set(covered.map((c) => c.by))]
  return {
    opened: true,
    forced,
    zIndex: style.zIndex,
    position: style.position,
    points: STEPS * STEPS,
    coveredPoints: covered.length,
    intruders,
    firstAt: covered[0]?.at ?? null,
  }
}

let browser
const results = []
try {
  await waitForServer()
  browser = await chromium.launch({ channel: "chrome" })
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })

  for (const testCase of cases) {
    const record = { route: testCase.route }
    try {
      await page.goto(`${baseUrl}/#${testCase.route}`, { waitUntil: "networkidle" })
      await page.waitForTimeout(400)

      const scoped = testCase.trigger.split(", ").map((s) => `.pg-main ${s}`).join(", ")
      const trigger = page.locator(scoped).first()
      if (!(await trigger.count())) {
        results.push({ ...record, status: "no-trigger" })
        continue
      }
      await trigger.scrollIntoViewIfNeeded()
      if (testCase.open === "hover") await trigger.hover()
      else if (testCase.open === "contextmenu") await trigger.click({ button: "right" })
      else await trigger.click()
      await page.waitForTimeout(700)

      const found = await page.evaluate(measure, testCase)
      if (!found.opened) results.push({ ...record, status: "never-opened" })
      else results.push({ ...record, status: found.coveredPoints ? "COVERED" : found.forced ? "ok-forced" : "ok", ...found })
    } catch (error) {
      results.push({ ...record, status: "error", error: String(error).split("\n")[0].slice(0, 120) })
    }
  }
} finally {
  if (browser) await browser.close()
  vite.kill()
}

if (asJson) {
  console.log(JSON.stringify(results, null, 2))
} else {
  for (const r of results) {
    const head = `${r.route.padEnd(18)} ${r.status.padEnd(12)}`
    if (r.status === "COVERED") {
      console.log(`${head} ${r.coveredPoints}/${r.points} points  z=${r.zIndex} pos=${r.position}  under: ${r.intruders.join(", ")}`)
    } else if (r.status === "ok" || r.status === "ok-forced") {
      console.log(`${head} z=${r.zIndex} pos=${r.position}${r.forced ? "  (pointer-events lent for the hit test)" : ""}`)
    } else {
      console.log(`${head} ${r.error ?? ""}`)
    }
  }
  const bad = results.filter((r) => r.status === "COVERED").length
  const unmeasured = results.filter((r) => !r.status.startsWith("ok") && r.status !== "COVERED").length
  console.log(`\n${results.length} overlays: ${bad} covered, ${unmeasured} not measured.`)
}
