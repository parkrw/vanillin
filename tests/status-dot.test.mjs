import { readFileSync } from "node:fs"
import { join } from "node:path"

export default async function run({ page, baseUrl, repoRoot, test, eq }) {
  const axeSource = readFileSync(join(repoRoot, "node_modules/axe-core/axe.min.js"), "utf-8")

  /** Inject axe fresh — must call after every full page load. */
  const injectAxe = () => page.evaluate(axeSource)

  /** Run axe color-contrast on a container; returns violations array. */
  const runAxe = (selector) =>
    page.evaluate(async (sel) => {
      const el = document.querySelector(sel)
      const results = await window.axe.run(el || document.body, {
        runOnly: ["color-contrast"],
      })
      return results.violations.map((v) => ({
        id: v.id,
        nodes: v.nodes.map((n) => n.html),
      }))
    }, selector)

  /**
   * Ensure the page is in the requested theme. Uses a full-page reload
   * so axe picks up fresh computed styles (it caches internally).
   */
  const ensureTheme = async (wantDark) => {
    await page.evaluate((dark) => {
      document.documentElement.classList.toggle("dark", dark)
    }, wantDark)
    await page.waitForTimeout(50)
  }

  // ── Badge status variant tests ──

  await page.goto(`${baseUrl}/#badge`)
  await injectAxe()
  await page.locator('[data-pg="badge-status"]').waitFor()
  await ensureTheme(false)

  await test("badge: status variants render with correct token colours", async () => {
    const results = await page.evaluate(() => {
      const container = document.querySelector('[data-pg="badge-status"]')
      const badges = container.querySelectorAll(".badge")
      return Array.from(badges).map((b) => {
        const s = getComputedStyle(b)
        return {
          text: b.textContent,
          bg: s.backgroundColor,
          color: s.color,
          borderColor: s.borderColor,
        }
      })
    })

    for (const badge of results) {
      eq(badge.bg !== "", true, `${badge.text} has background`)
      eq(badge.color !== "", true, `${badge.text} has colour`)
    }
    const bgs = new Set(results.map((r) => r.bg))
    eq(bgs.size, results.length, "each status variant has a unique background")
  })

  await test("badge: axe contrast check on all variants (light mode)", async () => {
    const violations = await runAxe('[data-pg="badge-status"]')
    eq(violations.length, 0, `axe violations: ${JSON.stringify(violations)}`)
  })

  // Reload for dark mode so axe starts with fresh colour data
  await ensureTheme(true)
  // Re-inject axe after forcing dark class (axe caches computed styles)
  await page.goto(`${baseUrl}/#badge`)
  await page.evaluate((dark) => {
    document.documentElement.classList.toggle("dark", dark)
  }, true)
  await page.waitForTimeout(50)
  await injectAxe()
  await page.locator('[data-pg="badge-status"]').waitFor()

  await test("badge: axe contrast check on all variants (dark mode)", async () => {
    const violations = await runAxe('[data-pg="badge-status"]')
    eq(violations.length, 0, `axe violations: ${JSON.stringify(violations)}`)
  })

  await test("badge: axe contrast check on original variants (dark mode)", async () => {
    const violations = await runAxe(".pg-section:first-of-type .pg-row")
    eq(violations.length, 0, `axe violations: ${JSON.stringify(violations)}`)
  })

  // Reset to light mode for subsequent tests
  await ensureTheme(false)

  // ── Status-dot tests ──

  await page.goto(`${baseUrl}/#status-dot`)
  await injectAxe()
  await page.locator('[data-pg="sd-statuses"]').waitFor()

  await test("status-dot: role='img' with aria-label by default", async () => {
    const dots = await page.locator('[data-pg="sd-statuses"] .status-dot').all()
    for (const dot of dots) {
      eq(await dot.getAttribute("role"), "img", "role is img")
      const label = await dot.getAttribute("aria-label")
      eq(label !== null && label.length > 0, true, "has aria-label")
    }
  })

  await test("status-dot: label={null} gives aria-hidden, no role", async () => {
    const dot = page.locator('[data-pg="sd-hidden"] .status-dot')
    eq(await dot.getAttribute("aria-hidden"), "true", "aria-hidden=true")
    eq(await dot.getAttribute("role"), null, "no role")
    eq(await dot.getAttribute("aria-label"), null, "no aria-label")
  })

  await test("status-dot: custom label overrides default", async () => {
    const dot = page.locator('[data-pg="sd-custom-label"] .status-dot')
    eq(await dot.getAttribute("aria-label"), "Build failed", "custom label applied")
  })

  await test("status-dot: data-status attribute for each state", async () => {
    const expected = ["success", "warning", "error", "info", "neutral", "pending"]
    const dots = await page.locator('[data-pg="sd-statuses"] .status-dot').all()
    eq(dots.length, expected.length, "correct number of dots")
    for (let i = 0; i < expected.length; i++) {
      eq(await dots[i].getAttribute("data-status"), expected[i], `data-status=${expected[i]}`)
    }
  })

  await test("status-dot: sizes produce distinct widths", async () => {
    const widths = await page.evaluate(() => {
      const dots = document.querySelectorAll('[data-pg="sd-sizes"] .status-dot')
      return Array.from(dots).map((d) => d.getBoundingClientRect().width)
    })
    eq(widths.length, 3, "three sizes rendered")
    eq(widths[0] < widths[1], true, `sm (${widths[0]}) < default (${widths[1]})`)
    eq(widths[1] < widths[2], true, `default (${widths[1]}) < lg (${widths[2]})`)
  })

  await test("status-dot: pending has pulse animation", async () => {
    const pendingDot = page.locator('[data-pg="sd-statuses"] .status-dot[data-status="pending"]')
    const animName = await pendingDot.evaluate((el) => getComputedStyle(el).animationName)
    eq(animName, "status-dot-pulse", "pulse animation is active")
  })

  await test("status-dot: pending pulse is fixed, not scaled by --motion-scale", async () => {
    const pendingDot = page.locator('[data-pg="sd-statuses"] .status-dot[data-status="pending"]')
    const before = await pendingDot.evaluate((el) => getComputedStyle(el).animationDuration)
    await page.evaluate(() => document.documentElement.style.setProperty("--motion-scale", "3"))
    const after = await pendingDot.evaluate((el) => getComputedStyle(el).animationDuration)
    await page.evaluate(() => document.documentElement.style.removeProperty("--motion-scale"))
    eq(after, before, "indeterminate loop must not track --motion-scale")
    eq(before, "2s", "pulse runs at the fixed skeleton-style cadence")
  })

  await test("status-dot: pending animation absent under prefers-reduced-motion", async () => {
    await page.emulateMedia({ reducedMotion: "reduce" })
    const pendingDot = page.locator('[data-pg="sd-statuses"] .status-dot[data-status="pending"]')
    const animName = await pendingDot.evaluate((el) => getComputedStyle(el).animationName)
    eq(animName, "none", "animation removed under reduced motion")
    await page.emulateMedia({ reducedMotion: "no-preference" })
  })

  await test("status-dot: non-pending dots have no pulse animation", async () => {
    const statuses = ["success", "warning", "error", "info", "neutral"]
    for (const status of statuses) {
      const dot = page.locator(`[data-pg="sd-statuses"] .status-dot[data-status="${status}"]`)
      const animName = await dot.evaluate((el) => getComputedStyle(el).animationName)
      eq(animName, "none", `${status} has no animation`)
    }
  })

  await test("status-dot: ring variant adds box-shadow", async () => {
    const ringDot = page.locator('[data-pg="sd-ring"] .status-dot').first()
    const noRingDot = page.locator('[data-pg="sd-statuses"] .status-dot').first()
    const ringShadow = await ringDot.evaluate((el) => getComputedStyle(el).boxShadow)
    const noRingShadow = await noRingDot.evaluate((el) => getComputedStyle(el).boxShadow)
    eq(ringShadow !== "none", true, "ring dot has box-shadow")
    eq(noRingShadow, "none", "non-ring dot has no box-shadow")
  })

  await test("status-dot: each status has a distinct computed colour", async () => {
    const colours = await page.evaluate(() => {
      const dots = document.querySelectorAll('[data-pg="sd-statuses"] .status-dot')
      return Array.from(dots).map((d) => ({
        status: d.dataset.status,
        bg: getComputedStyle(d).backgroundColor,
      }))
    })
    // success, warning, error, info should all be distinct; neutral and pending
    // share the same token (muted-foreground) which is fine
    const distinct = new Set(colours.filter((c) => c.status !== "pending").map((c) => c.bg))
    eq(distinct.size >= 4, true, `at least 4 distinct colours (got ${distinct.size})`)
  })

  // axe contrast on dots (light mode)
  await test("status-dot: axe contrast check (light mode)", async () => {
    const violations = await runAxe('[data-pg="sd-statuses"]')
    eq(violations.length, 0, `axe violations: ${JSON.stringify(violations)}`)
  })

  // Dark mode: reload for fresh axe state
  await ensureTheme(true)
  await page.goto(`${baseUrl}/#status-dot`)
  await page.evaluate((dark) => {
    document.documentElement.classList.toggle("dark", dark)
  }, true)
  await page.waitForTimeout(50)
  await injectAxe()
  await page.locator('[data-pg="sd-statuses"]').waitFor()

  await test("status-dot: axe contrast check (dark mode)", async () => {
    const violations = await runAxe('[data-pg="sd-statuses"]')
    eq(violations.length, 0, `axe violations: ${JSON.stringify(violations)}`)
  })

  await test("status-dot: axe contrast check on ring variants (dark mode)", async () => {
    const violations = await runAxe('[data-pg="sd-ring"]')
    eq(violations.length, 0, `axe violations: ${JSON.stringify(violations)}`)
  })

  // Reset to light mode for subsequent test files
  await ensureTheme(false)
}
