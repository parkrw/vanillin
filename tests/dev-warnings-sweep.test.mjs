import assert from "node:assert/strict"

// Visits every route in site/registry.js, opens every dialog/popover trigger,
// and fails on the two "no title" naming warnings from ui/dialog and
// ui/popover. Opening matters: DialogContent returns null until present, so a
// dialog that starts closed never runs its title check on mount.
export default async function run({ page, baseUrl, test }) {
  const { docs, registry } = await import(new URL("../site/registry.js", import.meta.url))
  const routes = ["home", ...Object.keys(docs), ...Object.keys(registry)]

  const NAMING_SNIPPETS = ["has no <DialogTitle>", "has no <PopoverTitle>"]

  // Pre-existing console output, each tracked by an issue. A snippet, not a
  // blanket pass, so a different warning cannot hide behind one of these.
  const KNOWN_OTHER_WARNINGS = [
    // #76. No `route`: the TOC re-derives on the way out of #use-form, so one
    // echo arrives tagged with the next route.
    { snippet: "usefieldarray" },
    // #77: /favicon.ico, requested on the first full load.
    { route: "home", snippet: "Failed to load resource" },
  ]

  const seen = []
  let currentRoute = null
  const onConsole = (msg) => {
    const type = msg.type()
    if (type === "warning" || type === "error") seen.push({ route: currentRoute, type, text: msg.text() })
  }
  page.on("console", onConsole)

  // DialogTrigger and PopoverTrigger both set aria-haspopup="dialog"; the menu
  // and listbox components use other values.
  const TRIGGER_SELECTOR = '[aria-haspopup="dialog"], [popovertarget]'

  const startedAt = Date.now()
  try {
    for (const route of routes) {
      currentRoute = route
      await page.goto(`${baseUrl}/#${route}`)
      // Pages are lazy() behind a null fallback; the breadcrumb alone never
      // reaches this much text.
      await page
        .waitForFunction(
          () => {
            const main = document.querySelector("main.pg-main")
            return !!main && main.innerText.trim().length > 40
          },
          { timeout: 5000 },
        )
        .catch(() => {})

      const triggerCount = await page.locator(TRIGGER_SELECTOR).count()
      for (let i = 0; i < triggerCount; i++) {
        try {
          await page.locator(TRIGGER_SELECTOR).nth(i).click({ timeout: 2000 })
          // open → usePresence flips present in a passive effect → the next
          // render mounts the checked subtree.
          await page.waitForTimeout(150)
        } catch {
          // Hidden, disabled or covered: skip this trigger, keep the route.
        } finally {
          // Native close, not Escape: alert-dialog and non-dismissible demos
          // block Escape by design. Both calls fire the events Dialog and
          // Popover already sync `open` from.
          await page.evaluate(() => {
            document.querySelectorAll("dialog[open]").forEach((d) => d.close())
            document.querySelectorAll("[popover]").forEach((el) => {
              if (el.matches(":popover-open")) el.hidePopover()
            })
          })
        }
      }
      // Console messages arrive over CDP asynchronously; settle while
      // currentRoute still names this route so a late one is not misattributed.
      await page.waitForTimeout(200)
    }
  } finally {
    page.off("console", onConsole)
    await page.goto(`${baseUrl}/#home`)
  }
  const wallMs = Date.now() - startedAt

  await test(`visited ${routes.length} routes from site/registry.js in ${wallMs}ms`, () => {
    assert.ok(routes.length > 50, `expected dozens of routes, got ${routes.length} — site/registry.js exports changed shape`)
  })

  await test("no dialog/popover naming warnings anywhere on the site", () => {
    const naming = seen.filter((s) => NAMING_SNIPPETS.some((snip) => s.text.includes(snip)))
    // One line: the runner prints only a failure's first line.
    const detail = naming.map((s) => `#${s.route}: ${s.text}`).join(" | ")
    assert.equal(naming.length, 0, `naming warnings: ${detail}`)
  })

  await test("no console warnings or errors beyond the tracked pre-existing ones", () => {
    const unknown = seen.filter(
      (s) =>
        !NAMING_SNIPPETS.some((snip) => s.text.includes(snip)) &&
        !KNOWN_OTHER_WARNINGS.some((k) => (k.route === undefined || k.route === s.route) && s.text.includes(k.snippet)),
    )
    const detail = unknown.map((s) => `#${s.route} [${s.type}] ${s.text}`).join(" | ")
    assert.equal(unknown.length, 0, `untracked console output: ${detail}`)
  })
}
