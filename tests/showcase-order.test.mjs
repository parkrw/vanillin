import { readFileSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

/*
 * The order wizard has a route of its own (#order) and a standalone entry
 * (site/order.html); it is no longer a page inside the console mock. The
 * steps are one strip of icon tabs across the top that sticks there as the
 * page scrolls, Continue and a way down to the machines at its end, and the
 * strip is the only place a step is named; under it, the current step's
 * sections on the left three quarters with the table under them in the
 * same column (a head of its own, then the tools, the vDC/VM table and the
 * pager in one card), and the price card on the right quarter at its own
 * height, stuck under the strip. On Checkout the deploy foot closes the
 * left column under the table. Location is the site
 * alone with the latency table open; Infrastructure is Plans and Custom as
 * tabs, then Network beside Advanced networking, all on one laptop screen;
 * Backup & DR is protection and backups, Add-ons the edge services, the
 * licences and what every vDC includes. A vDC
 * starts empty; access is each machine's, asked in a dialog as it is added
 * and changed from its row menu, and a machine that outgrows the pools grows
 * them. No header cart, no mobile bar, no on-page receipt. The order
 * persists in localStorage and in the share link, so every test that
 * depends on the defaults starts from a cleared store.
 */
const SSH_KEY = "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIExample you@laptop"

export default async function run({ page, baseUrl, test, eq, near }) {
  const frame = page.locator(".ck-console")
  const order = frame.locator(".ck-order")
  const rect = (locator) => locator.evaluate((el) => el.getBoundingClientRect().toJSON())
  const style = (locator, prop) => locator.evaluate((el, p) => getComputedStyle(el)[p], prop)
  const texts = async (locator, sep = " | ") => (await locator.allTextContents()).join(sep)
  // Kit controls transition their colours, so a colour read right after a
  // click is the transition's start value (docs/QUIRKS.md). Wait it out.
  const settled = () =>
    page.waitForFunction(() => !document.getAnimations().some((a) => a instanceof CSSTransition))
  // Computed colour of `var(--token)` resolved inside the order page. The
  // console frame inverts --live-value-up/-down, so probe the order, not it.
  const orderColour = (token) =>
    page.evaluate((t) => {
      const el = document.querySelector(".ck-order")
      const probe = document.createElement("span")
      probe.style.color = `var(${t})`
      el.appendChild(probe)
      const c = getComputedStyle(probe).color
      probe.remove()
      return c
    }, token)
  const clearStore = () => page.evaluate(() => localStorage.clear())
  // A real navigation: the site is an SPA, and a goto that only changes the
  // hash would leave the mounted order (and its store writes) in place.
  const arrive = async (hash = "#order") => {
    await page.goto("about:blank")
    await page.goto(`${baseUrl}/${hash}`)
    await page.waitForSelector('.ck-console[data-pg="order"] .ck-order')
  }
  // A fresh order from the defaults: the store is cleared, then the page
  // re-reads it.
  const reset = async () => {
    await arrive()
    await clearStore()
    await arrive()
  }
  const tab = (label) => order.locator(".ck-order-steps .ck-order-step", { hasText: label })
  const panel = (step) => order.locator(`.ck-order-panel[data-step="${step}"]`)
  const goTab = async (label, step) => {
    await tab(label).click()
    await panel(step).waitFor()
  }
  const total = order.locator(".ck-order-total-card .ck-order-total-live")
  // The card names the site alone; the draft's name is on its table row.
  const draftName = order.locator('.ck-order-table tr[data-row="vdc"][data-draft] .data-table-group-label')
  const glow = order.locator(".ck-order-total-card .ck-order-total-glow")
  // The one CTA: Continue at the strip's end, Deploy in the Checkout foot.
  const cta = order.locator(".ck-order-strip .ck-order-continue, .ck-order-foot .ck-order-cta")
  const STEP_LIST = [["location", "Location"], ["infrastructure", "Infrastructure"], ["storage", "Storage"], ["bcdr", "Backup & DR"], ["addons", "Add-ons"], ["checkout", "Checkout"]]
  const sliderInput = (field) => order.locator(`.ck-slider-row[data-field="${field}"] .ck-slider-input`)
  const setSlider = async (field, value) => {
    const input = sliderInput(field)
    await input.fill(String(value))
    await input.press("Enter")
  }
  const accessDialog = order.locator(".ck-access-dialog")
  const vmRowCount = () => page.evaluate(() => document.querySelectorAll('.ck-order-table tr[data-row="vm"]').length)
  // A vDC starts empty, and a machine is added only through the access
  // dialog: Add VM, a key (unless the last machine's is already in the
  // box), Add machine.
  const addVm = async () => {
    const before = await vmRowCount()
    await order.locator(".ck-order-add-vm").click()
    await accessDialog.waitFor()
    const key = accessDialog.locator(".ck-order-key")
    if ((await key.count()) > 0 && !(await key.inputValue())) await key.fill(SSH_KEY)
    await accessDialog.locator(".ck-access-confirm").click()
    await noneLeft(".ck-access-dialog")
    await page.waitForFunction((n) => document.querySelectorAll('.ck-order-table tr[data-row="vm"]').length === n, before + 1)
  }
  const sizeTab = async (label) => {
    await order.locator('[data-section="size"] .ck-size-tab', { hasText: label }).click()
    await order.locator(`.ck-size-panel[data-size="${label.toLowerCase()}"]`).waitFor()
  }
  const noneLeft = (selector) => page.waitForFunction((s) => document.querySelectorAll(s).length === 0, selector)
  const toastWith = (text) =>
    page.waitForFunction((t) => [...document.querySelectorAll(".toast")].some((el) => el.textContent.includes(t)), text)
  // The name of an option row's radio label, without the meta/badge text
  // nested inside the same span (`.ck-option-name`'s first text node only).
  const optionName = (locator) => locator.evaluate((el) => el.querySelector(".ck-option-name").firstChild.textContent.trim())

  await reset()

  await test("the wizard owns the page: six icon steps, the brand's tokens in both schemes, a way back", async () => {
    eq(await frame.locator(".ck-topbar").count(), 0, "the console top bar is still mounted")
    eq(await frame.locator(".ck-pri, .ck-sec").count(), 0, "the console rails are still mounted")
    eq(await frame.getAttribute("data-pg"), "order")
    eq(await frame.locator(".ck-page-title").textContent(), "New virtual Data Center")

    const steps = order.locator(".ck-order-steps .ck-order-step")
    eq(await steps.count(), 6)
    eq(await steps.locator(".ck-order-step-mark svg").count(), 6, "every step carries an icon in its ring")
    eq(await order.locator(".ck-order-step-num").count(), 0, "no digits")
    eq(await texts(steps.locator(".ck-order-step-label")), "Location | Infrastructure | Storage | Backup & DR | Add-ons | Checkout")
    eq(await style(steps.first().locator(".ck-order-step-label"), "textTransform"), "uppercase")
    eq((await steps.evaluateAll((els) => els.map((el) => el.dataset.state))).join(","), "active,inactive,inactive,inactive,inactive,inactive")
    eq(await order.locator(".ck-order-panel").count(), 1, "only the active step is mounted")
    eq(await order.locator(".ck-order-step-head, .ck-order-step-title").count(), 0, "the strip names the step; the panel opens on its sections")
    eq(await order.locator('[data-section="site"] .ck-order-hint').textContent(), "Where the vDC lives. Latency follows your users, so the recommended site is marked; the others are a click away.", "the section's hint says what the step lede said")
    eq(await order.locator(".ck-order-step-flag").count(), 0, "nothing is flagged before anything is touched")

    // The total card: the site, the live total, no name and nothing hourly.
    eq(await order.locator(".ck-order-total-name code, .ck-order-total-name .ck-mono").count(), 0, "the vDC's name left the card")
    eq(await order.locator(".ck-order-total-name > span").textContent(), "DFW Cage 6")
    eq(await draftName.textContent(), "vdc-01", "the name is the table's")
    eq(await total.textContent(), "$605.00")
    eq(await order.locator(".ck-order-total-card .ck-order-total-hr, .ck-order-total-card .ck-order-total-rates").count(), 0, "no hourly twin")
    eq(await order.evaluate((el) => /\/hr\b|-hour estimate/.test(el.textContent)), false, "nothing on the page is priced by the hour")
    eq(await order.locator(".ck-order-issues").count(), 0, "an empty vDC has nothing to fix")
    eq(await cta.textContent(), "Continue to Infrastructure")
    eq(await order.locator(".ck-order-total-order strong").textContent(), "$605.00/mo")
    eq(await order.locator(".ck-order-total-order .ck-option-desc").textContent(), "1 vDC · $654.91/mo with tax")

    // Brand tokens: orange is the primary and marks the chosen option; blue
    // is the ring. Blue shifts to Light Blue on dark, orange holds.
    await settled()
    const orange = await orderColour("--ck-orange")
    const blue = await orderColour("--ck-blue")
    eq(orange !== blue, true, "orange and blue are two hues")
    eq(await orderColour("--primary"), orange, "orange is --primary")
    eq(await orderColour("--ring"), blue, "blue is the ring")
    eq(await style(order.locator('.ck-site[data-state="checked"]'), "borderTopColor"), orange, "the chosen site is outlined in orange")
    eq(await style(order.locator('.ck-order-steps .ck-order-step[data-state="active"] .ck-order-step-mark'), "borderTopColor"), orange, "the current step's ring is orange")
    eq((await style(order.locator('.ck-order-steps .ck-order-step[data-state="inactive"] .ck-order-step-mark').first(), "borderTopColor")) !== orange, true, "a waiting step's ring is not")
    eq(await style(cta, "backgroundColor"), orange, "the primary button is orange")
    eq(await orderColour("--live-value-up"), blue, "a rising price is blue here")
    eq(await orderColour("--live-value-down"), orange, "a falling price is orange here")
    const lightBg = await style(frame, "backgroundColor")
    await page.evaluate(() => document.documentElement.classList.toggle("dark", true))
    await settled()
    eq(await orderColour("--ck-orange"), orange, "orange is the same in both schemes")
    eq((await orderColour("--ck-blue")) !== blue, true, "blue lightens on dark")
    eq(await orderColour("--primary-foreground"), "oklch(0.99 0 0)", "orange carries white text on dark too")
    eq((await style(frame, "backgroundColor")) !== lightBg, true, "the page turns dark")
    await page.evaluate(() => document.documentElement.classList.toggle("dark", false))
    await settled()
    eq(await style(frame, "backgroundColor"), lightBg)

    const back = order.locator(".ck-order-back")
    eq(await back.evaluate((el) => el.tagName), "A", "the way back is a link")
    eq(await back.textContent(), "Console")
    eq(await back.getAttribute("href"), "#console")
  })

  await test("skeleton: the options take three quarters beside the price card's quarter with the table under them in their column; the strip sticks to the top of the scroll and the card, at its own height, under it; one column at a phone width", async () => {
    await reset()
    await page.setViewportSize({ width: 1280, height: 720 })
    eq(await page.evaluate(() => getComputedStyle(document.querySelector(".ck-order-body")).gridTemplateColumns.trim().split(" ").length), 2, "two columns at 1280")
    const box = (...selectors) => Promise.all(selectors.map((s) => rect(order.locator(s))))
    const [stripBox, mainBox, asideBox, bodyBox, tableBox] = await box(".ck-order-strip", ".ck-order-main", ".ck-order-aside", ".ck-order-body", ".ck-order-table-section")
    const orderBox = await rect(order)
    eq(stripBox.bottom <= bodyBox.top + 1, true, "the strip sits above both columns")
    near(stripBox.width, bodyBox.width, 2, "the strip spans both columns")
    const ratio = mainBox.width / bodyBox.width
    eq(ratio > 0.72 && ratio < 0.78, true, `the options column is ${ratio.toFixed(3)} of the body — expected ≈0.75`)
    eq(mainBox.right < asideBox.left, true, "the price card sits to the right of the options")
    near(mainBox.top, asideBox.top, 1, "the two columns start on one line")
    // The floor (16rem) is below what a quarter resolves to here, so the
    // ratio is the grid's, not the floor's.
    eq(asideBox.width > 16 * 16 + 8, true, `the quarter (${asideBox.width}px) is wider than the 16rem floor`)
    eq(tableBox.top >= mainBox.bottom - 1, true, "the table sits under the options")
    near(tableBox.width, mainBox.width, 1, "as wide as them")
    eq(tableBox.right <= asideBox.left, true, "left of the price card, which runs beside both")
    eq(tableBox.width < orderBox.width - 200, true, "not the full width")
    eq(await order.locator(".ck-order-body").evaluate((el) => getComputedStyle(el).gridTemplateAreas), '"main aside" "table aside" "foot aside"', "on every step, not Checkout alone")

    // The card is as tall as its blocks, whatever the step beside it. The
    // strip sticks to the top of the scroll and the card 0.75rem under the
    // strip, its area spanning every row: on Backup & DR the options run
    // well past a viewport, the scroller moves, and neither the strip nor
    // the card does, while the options scroll away under them.
    const [shortCard, shortAside, shortMain] = await box(".ck-order-total-card", ".ck-order-aside", ".ck-order-main")
    near(shortCard.height, shortAside.height, 1, "the aside is the card")
    eq(Math.abs(shortAside.height - shortMain.height) > 20, true, `the aside (${shortAside.height}px) is the card's height, not the row's (${shortMain.height}px)`)
    eq(await style(order.locator(".ck-order-aside"), "position"), "sticky")
    eq(await style(order.locator(".ck-order-aside"), "alignSelf"), "start", "so the grid does not stretch it to the row")
    eq(await style(order.locator(".ck-order-strip"), "position"), "sticky")
    await goTab("Backup & DR", "bcdr")
    const [tallCard, tallMain] = await box(".ck-order-total-card", ".ck-order-main")
    near(tallCard.height, shortCard.height, 1, "the card is the same height beside a far taller step")
    const scroller = frame.locator(".ck-scroller")
    const [scrollerBox, restStrip] = await Promise.all([rect(scroller), rect(order.locator(".ck-order-strip"))])
    eq(tallMain.height > scrollerBox.height, true, `backup & DR (${tallMain.height}px) outruns the ${scrollerBox.height}px scroller, so there is a scroll to test`)
    eq(restStrip.top > scrollerBox.top + 40, true, "at rest the strip sits under the page head, not at the scroller's edge")
    eq(tallCard.top > restStrip.bottom + 12 + 1, true, "and the card where its row starts, not at its sticky edge")
    await scroller.evaluate((el) => {
      el.scrollTop = 300
    })
    await page.waitForFunction(() => document.querySelector(".ck-scroller").scrollTop === 300)
    const [stuckStrip, stuckCard, scrolledMain] = await box(".ck-order-strip", ".ck-order-total-card", ".ck-order-main")
    near(stuckStrip.top, scrollerBox.top, 1, "the strip stopped at the scroller's edge")
    near(stuckStrip.height, restStrip.height, 1)
    near(stuckCard.top, stuckStrip.bottom + 12, 1, "the card stopped 0.75rem under the strip")
    near(scrolledMain.top, tallMain.top - 300, 1, "while the options scrolled the full 300px")
    eq(await style(order.locator(".ck-order-strip"), "zIndex"), "5", "the strip paints over what scrolls under it")
    await scroller.evaluate((el) => {
      el.scrollTop = 0
    })
    await goTab("Location", "location")

    await page.setViewportSize({ width: 700, height: 900 })
    await page.waitForFunction(() => getComputedStyle(document.querySelector(".ck-order-body")).gridTemplateColumns.trim().split(" ").length === 1)
    const [narrowMain, narrowAside, narrowTable] = await box(".ck-order-main", ".ck-order-aside", ".ck-order-table-section")
    eq(narrowMain.bottom <= narrowAside.top + 1, true, "the price card follows the options at a phone width")
    eq(narrowAside.bottom <= narrowTable.top + 1, true, "the table follows the price card")
    eq(await style(order.locator(".ck-order-aside"), "position"), "static", "and stacked, it no longer sticks")
    eq(await style(order.locator(".ck-order-strip"), "position"), "sticky", "the strip still does")
    const [narrowStrip, narrowSteps, narrowActions] = await box(".ck-order-strip", ".ck-order-steps", ".ck-order-strip-actions")
    eq(narrowActions.top >= narrowSteps.bottom - 1, true, "Continue drops under the steps")
    near(narrowStrip.width, narrowMain.width, 2)

    await page.setViewportSize({ width: 1280, height: 720 })
    await page.waitForFunction(() => getComputedStyle(document.querySelector(".ck-order-body")).gridTemplateColumns.trim().split(" ").length === 2)
  })

  await test("Continue and the way down to the machines sit at the strip's end, Continue first; Machines scrolls the table into view and lands focus on it", async () => {
    await reset()
    const strip = order.locator(".ck-order-strip")
    const [stepsBox, actionsBox, jumpBox, continueBox] = await Promise.all([".ck-order-steps", ".ck-order-strip-actions", ".ck-order-jump", ".ck-order-continue"].map((s) => rect(strip.locator(s))))
    near(stepsBox.top + stepsBox.height / 2, continueBox.top + continueBox.height / 2, 12, "Continue shares the row with the steps")
    eq(actionsBox.left >= stepsBox.right - 1, true, "at the strip's end")
    eq(continueBox.right <= jumpBox.left, true, "Continue first, Machines last")
    near(jumpBox.right, actionsBox.right, 1, "Machines closes the row")
    eq(await strip.locator(".ck-order-continue").textContent(), "Continue to Infrastructure")
    eq(await order.locator(".ck-order-foot").count(), 0, "with nothing to fix, a step has no foot")
    const jump = strip.locator(".ck-order-jump")
    eq(await jump.evaluate((el) => el.textContent), "Scroll to the Machines0")
    eq(await jump.locator(".ck-order-jump-count").textContent(), "0")
    await addVm()
    eq(await jump.locator(".ck-order-jump-count").textContent(), "1", "the count follows the machines")

    // Precondition: the table starts below the fold, so the jump has
    // somewhere to go (Infrastructure is tall enough at 720; Playwright
    // scrolled to Add VM above, so the scroller is put back first);
    // afterwards the table sits under the stuck strip, not behind it, and
    // holds focus, so the keyboard lands on its tools.
    await goTab("Infrastructure", "infrastructure")
    const scroller = frame.locator(".ck-scroller")
    const scrollTop = () => scroller.evaluate((el) => el.scrollTop)
    await scroller.evaluate((el) => {
      el.scrollTop = 0
    })
    eq(await scrollTop(), 0)
    const [before, viewport] = await Promise.all([rect(order.locator(".ck-order-table-section")), rect(scroller)])
    eq(before.top > viewport.bottom, true, `the table starts at ${before.top}px, under the ${viewport.bottom}px fold`)
    await strip.locator(".ck-order-jump").click()
    await page.waitForFunction(() => document.querySelector(".ck-scroller").scrollTop > 0)
    // The table lands 0.5rem under the stuck strip, or as near it as the
    // page's end allows when little follows the table.
    await page.waitForFunction(() => {
      const scroller = document.querySelector(".ck-scroller")
      const t = document.querySelector(".ck-order-table-section").getBoundingClientRect().top
      const s = document.querySelector(".ck-order-strip").getBoundingClientRect().bottom
      const atEnd = Math.abs(scroller.scrollTop - (scroller.scrollHeight - scroller.clientHeight)) < 2
      return Math.abs(t - s - 8) < 2 || (atEnd && t < scroller.getBoundingClientRect().bottom - 200)
    })
    const [after, view, stuck] = await Promise.all([rect(order.locator(".ck-order-table-section")), rect(scroller), rect(strip)])
    near(stuck.top, view.top, 1, "the strip is stuck at the scroller's edge")
    eq(after.top >= stuck.bottom + 8 - 1 && after.top < view.bottom - 200, true, `the table is in view under the strip (top ${after.top}px, strip to ${stuck.bottom}px, scroller to ${view.bottom})`)
    eq(await page.evaluate(() => document.activeElement.matches(".ck-order-table-section")), true, "the table section took focus")
    eq(await style(order.locator(".ck-order-table-section"), "outlineStyle"), "none", "without a ring, the scroll is the feedback")
    await page.keyboard.press("Tab")
    eq(await page.evaluate(() => document.activeElement.matches(".ck-order-search-input")), true, "Tab from there lands on the filter")
    await scroller.evaluate((el) => {
      el.scrollTop = 0
    })
    await goTab("Checkout", "checkout")
    eq(await strip.locator(".ck-order-strip-actions").count(), 0, "Checkout has no Continue and no way down: the table is on the step")
    await goTab("Location", "location")
  })

  await test("Checkout: the table joins the left column beside the price card, the deploy foot closes it under the table, and the rule that closes the wizard is gone", async () => {
    await reset()
    await goTab("Checkout", "checkout")
    const box = (...selectors) => Promise.all(selectors.map((s) => rect(order.locator(s))))
    const [mainBox, asideBox, tableBox, footBox, shareBox, cardBox] = await box(".ck-order-main", ".ck-order-aside", ".ck-order-table-section", ".ck-order-foot", '[data-section="share"]', ".ck-order-total-card")
    eq(tableBox.right <= asideBox.left, true, "the table sits left of the price card")
    near(tableBox.width, mainBox.width, 1, "as wide as the options column")
    eq(tableBox.top >= shareBox.bottom - 1, true, "under Save and share")
    eq(footBox.top >= tableBox.bottom - 1, true, "the foot sits under the table")
    near(footBox.width, mainBox.width, 1)
    eq(await order.locator(".ck-order-foot .ck-order-cta").count(), 1, "Deploy is the foot's")
    eq(cardBox.bottom < footBox.bottom - 100, true, `the card (${cardBox.bottom}px) keeps its own height beside the column that runs to ${footBox.bottom}px`)
    eq(await style(order.locator(".ck-order-aside"), "position"), "sticky", "and sticks through the whole step, its area spanning to the foot")
    eq(await order.locator(".ck-order-table-section > .separator").isVisible(), false, "no rule: the table is part of the step")
    eq(await order.locator(".ck-order-body").evaluate((el) => getComputedStyle(el).gridTemplateAreas), '"main aside" "table aside" "foot aside"')
    // Counter: on any other step the table keeps the column, under the rule.
    await goTab("Add-ons", "addons")
    const [otherTable, otherMain, otherAside] = await box(".ck-order-table-section", ".ck-order-main", ".ck-order-aside")
    near(otherTable.width, otherMain.width, 1, "the table is still the options' width")
    eq(otherTable.right <= otherAside.left, true, "beside the card")
    eq(await order.locator(".ck-order-table-section > .separator").isVisible(), true, "and the rule is back")
    await goTab("Location", "location")
  })

  await test("the table has a head of its own over its card, which holds the tools, the table and the pager; the price card is its own card beside the options, the total and the groups inside it", async () => {
    await reset()
    const card = order.locator(".ck-order-card")
    eq(await card.count(), 1)
    for (const s of [".ck-order-search-input", ".ck-order-menubar", ".ck-order-add-vm", ".ck-order-add-vdc", ".ck-order-table", ".ck-order-pager", ".ck-order-table-hint"]) {
      eq(await card.locator(s).count(), 1, `${s} sits inside the table card`)
    }
    eq(await card.locator(".card, .ck-order-total-card, .ck-order-card-title, .ck-order-section-title").count(), 0, "no card, no total and no title inside the table card")
    // The head reads as every section's: the title with its count, a line under it.
    const head = order.locator(".ck-order-table-section .ck-order-table-head")
    eq(await head.count(), 1)
    eq(await head.locator(".ck-order-section-title").textContent(), "vDCs and machines")
    eq(await head.locator(".ck-order-table-count").textContent(), "1 vDC · 0 machines")
    eq(await head.locator(".ck-order-hint").count(), 1)
    const [ruleBox, headBox, tableCardBox] = await Promise.all([".ck-order-table-section > .separator", ".ck-order-table-head", ".ck-order-card"].map((s) => rect(order.locator(s))))
    eq(headBox.top >= ruleBox.bottom, true, "the head sits under the rule")
    eq(tableCardBox.top >= headBox.bottom, true, "and over the card")
    const [siteTitle, tableTitle] = await Promise.all([order.locator('[data-section="site"] .ck-order-section-title'), head.locator(".ck-order-section-title")].map((l) => Promise.all([style(l, "fontSize"), style(l, "fontWeight")])))
    eq(siteTitle.join("/"), tableTitle.join("/"), "the same title as the sections above")

    const priceCard = order.locator(".ck-order-aside .ck-order-total-card")
    eq(await priceCard.count(), 1, "the price card sits in the aside")
    eq(await priceCard.evaluate((el) => el.matches(".card")), true, "the price card is the kit's card")
    eq(await style(priceCard, "borderTopWidth"), "1px", "it carries the border")
    eq((await style(priceCard, "boxShadow")) !== "none", true, "and the shadow")
    eq(await priceCard.locator(".ck-order-total-glow").count(), 1, "the live total is the price card's")
    // Top to bottom: name, the total, the groups, the sums, the whole order.
    const [nameBox, glowBox, groupsBox, sumsBox, wholeBox] = await Promise.all(
      [".ck-order-total-name", ".ck-order-total-glow", ".ck-order-groups", ".ck-order-sums", ".ck-order-total-order"].map((s) => rect(priceCard.locator(s)))
    )
    eq(nameBox.bottom <= glowBox.top + 1, true, "the name sits over the total")
    eq(glowBox.bottom <= groupsBox.top + 1, true, "the total over the groups")
    eq(groupsBox.bottom <= sumsBox.top + 1, true, "the groups over the sums")
    eq(sumsBox.bottom <= wholeBox.top + 1, true, "the sums over the whole order")
    // The groups are the receipt's lines summed; each is a way to its step.
    eq(await texts(priceCard.locator(".ck-order-group-name")), "Compute | Network | Storage | Backup & DR | Add-ons", "one line per billed step, the last two at zero until they bill")
    eq(await texts(priceCard.locator(".ck-order-group-amount")), "$520.00 | $40.00 | $45.00 | $0.00 | $0.00")
    const groupBoxes = await Promise.all([0, 1].map((i) => rect(priceCard.locator(".ck-order-group").nth(i))))
    eq(groupBoxes[1].top - groupBoxes[0].bottom >= 1 && groupBoxes[0].height >= 30, true, `the lines have air: ${groupBoxes[0].height}px tall, ${groupBoxes[1].top - groupBoxes[0].bottom}px apart`)
    eq(await texts(priceCard.locator(".ck-order-sum dd")), "$605.00 | $49.91 | $654.91/mo")
    eq(await priceCard.locator(".ck-order-sum-meta").textContent(), "TX 8.25%")
    await priceCard.locator('.ck-order-group[data-group="storage"]').click()
    await panel("storage").waitFor()
    eq(await order.locator('.ck-slider-row[data-field="storage-t1"]').count(), 1, "Storage jumps to the storage step")
    await priceCard.locator('.ck-order-group[data-group="bcdr"]').click()
    await panel("bcdr").waitFor()
    await priceCard.locator('.ck-order-group[data-group="addons"]').click()
    await panel("addons").waitFor()
    // An add-on chosen moves its line, and Backup & DR's follows protection.
    await order.locator("#ck-addon-vpn").click()
    await priceCard.locator('.ck-order-group[data-group="addons"] .ck-order-group-amount', { hasText: "$25.00" }).waitFor()
    await order.locator("#ck-addon-vpn").click()
    await priceCard.locator('.ck-order-group[data-group="addons"] .ck-order-group-amount', { hasText: "$0.00" }).waitFor()
    await goTab("Location", "location")

    // Top to bottom in the table card: the tools, the table, the pager.
    const [toolbarBox, tableBox, pagerBox, searchBox, addVdcBox] = await Promise.all(
      [".ck-order-toolbar", ".ck-order-table", ".ck-order-pager", ".ck-order-search", ".ck-order-add-vdc"].map((s) => rect(order.locator(s)))
    )
    eq(toolbarBox.bottom <= tableBox.top + 1, true, "the tools sit above the table")
    eq(tableBox.bottom <= pagerBox.top + 1, true, "the pager sits under the table")
    near(searchBox.top + searchBox.height / 2, addVdcBox.top + addVdcBox.height / 2, 2, "search and Add vDC share one row at 1280")

    // Counter: the tools do wrap once the card is narrow, so the one row
    // above is room, not a wrap that was switched off.
    await page.setViewportSize({ width: 700, height: 900 })
    await page.waitForFunction(() => getComputedStyle(document.querySelector(".ck-order-body")).gridTemplateColumns.trim().split(" ").length === 1)
    const [narrowSearch, narrowAdd] = await Promise.all([rect(order.locator(".ck-order-search")), rect(order.locator(".ck-order-add-vdc"))])
    eq(narrowAdd.top > narrowSearch.bottom - 1, true, "Add vDC drops under the search at 700")
    await page.setViewportSize({ width: 1280, height: 720 })
    await page.waitForFunction(() => getComputedStyle(document.querySelector(".ck-order-body")).gridTemplateColumns.trim().split(" ").length === 2)

    eq(await frame.locator(".ck-order-cart").count(), 0, "the header cart is gone; the total carries that job now")
    eq(await order.locator(".ck-order-rail").count(), 0, "the old rail is gone; the price card is the kit's card")
    eq(await order.locator(".ck-order-mobile").count(), 0, "the mobile bar is gone")
  })

  await test("the steps are the kit's tabs in one strip across the top: an icon in a ring each, a rule between them, the steps behind the current one filled orange; arrow keys move and select", async () => {
    await reset()
    const strip = order.locator(".ck-order-strip")
    const list = order.locator(".ck-order-steps")
    eq(await list.getAttribute("role"), "tablist", "the steps are a tablist")
    eq(await list.evaluate((el) => el.matches(".tabs-list")), true, "built on ui/tabs, not a hand-rolled list")
    const steps = order.locator(".ck-order-steps .ck-order-step")
    const rules = order.locator(".ck-order-steps .ck-order-step-rule")
    eq(await steps.count(), 6)
    eq(await rules.count(), 5, "a rule between each pair")
    eq(await steps.evaluateAll((els) => els.every((el) => el.getAttribute("role") === "tab")), true)
    eq(await rules.evaluateAll((els) => els.every((el) => el.getAttribute("aria-hidden") === "true" && !el.getAttribute("role"))), true, "the rules are decoration, not tabs")
    const boxes = await Promise.all([0, 1, 2, 3, 4, 5].map((i) => rect(steps.nth(i))))
    const marks = await Promise.all([0, 1, 2, 3, 4, 5].map((i) => rect(steps.nth(i).locator(".ck-order-step-mark"))))
    const [listBox, stripBox, bodyBox] = await Promise.all([rect(list), rect(strip), rect(order.locator(".ck-order-body"))])
    // One row, left to right, the rings level, above both columns.
    for (let i = 1; i < 6; i++) near(boxes[i].top, boxes[0].top, 1, `steps 1 and ${i + 1} share a row`)
    eq(boxes.every((b, i) => i === 0 || b.left >= boxes[i - 1].right - 1), true, "left to right")
    eq(boxes[5].right <= listBox.right + 1, true, "six steps fit the strip at 1280")
    eq(stripBox.bottom <= bodyBox.top + 1, true, "the strip sits above the body")
    near(stripBox.width, bodyBox.width, 2, "the strip spans both columns")
    for (let i = 0; i < 6; i++) {
      near(marks[i].width, 28, 1, "a 1.75rem ring")
      near(marks[i].height, marks[i].width, 0.5, "round")
      near(marks[i].left + marks[i].width / 2, boxes[i].left + boxes[i].width / 2, 1, "centred over its label")
    }
    // Each rule runs from one ring to the next at the rings' centre.
    const ruleBoxes = await Promise.all([0, 1, 2, 3, 4].map((i) => rect(rules.nth(i))))
    for (let i = 0; i < 5; i++) {
      near(ruleBoxes[i].top + ruleBoxes[i].height / 2, marks[i].top + marks[i].height / 2, 1, `rule ${i + 1} is level with the rings`)
      eq(ruleBoxes[i].left >= marks[i].right && ruleBoxes[i].right <= marks[i + 1].left, true, `rule ${i + 1} runs between rings ${i + 1} and ${i + 2}`)
      eq(ruleBoxes[i].width > 12, true, "and is long enough to read as one")
    }
    // Precondition: the kit's list is a fit-content pill, so the flat strip
    // is this page's override, and it has to outrank the kit's rule rather
    // than follow it in source order.
    eq(
      await page.evaluate(() =>
        [...document.styleSheets].some((s) => {
          try {
            return [...s.cssRules].some((r) => r.selectorText === ".tabs-list" && r.style.width === "fit-content")
          } catch {
            return false
          }
        })
      ),
      true,
      "the kit's fit-content list rule is loaded"
    )
    eq(await style(strip, "borderBottomWidth"), "1px", "the strip is underlined")
    eq(await style(list, "borderTopLeftRadius"), "0px", "not the kit's pill")
    eq(await style(list, "backgroundColor"), "rgba(0, 0, 0, 0)", "and not its tray")
    await settled()
    const orange = await orderColour("--ck-orange")
    const markStyle = (i, prop) => style(steps.nth(i).locator(".ck-order-step-mark"), prop)
    eq(await markStyle(0, "borderTopColor"), orange, "the selected step's ring is orange")
    eq((await markStyle(0, "backgroundColor")) !== orange, true, "and not filled: it is current, not done")
    eq((await markStyle(1, "borderTopColor")) !== orange, true, "a waiting step's ring is not")
    eq(await order.locator(".ck-order-step[data-done]").count(), 0, "nothing is behind the first step")
    eq(await order.locator(".ck-order-step-rule[data-done]").count(), 0)

    // Selection: exactly one tab, and its panel is the tab's tabpanel.
    eq(await order.locator('.ck-order-step[aria-selected="true"]').count(), 1, "exactly one step is selected")
    eq(await steps.first().getAttribute("aria-selected"), "true")
    eq(await order.locator(".ck-order-panel").getAttribute("role"), "tabpanel")
    eq(await order.locator(".ck-order-panel").getAttribute("aria-labelledby"), await steps.first().getAttribute("id"), "the panel is labelled by its tab")
    await steps.nth(2).click()
    await panel("storage").waitFor()
    eq(await steps.first().getAttribute("aria-selected"), "false", "Location lost the selection")
    eq(await steps.nth(2).getAttribute("aria-selected"), "true")
    eq((await steps.evaluateAll((els) => els.map((el) => el.dataset.state))).join(","), "inactive,inactive,active,inactive,inactive,inactive")
    eq(await order.locator(".ck-order-panel").count(), 1, "only the selected step's panel is mounted")
    eq(await order.locator(".ck-order-panel").getAttribute("aria-labelledby"), await steps.nth(2).getAttribute("id"))
    await settled()
    // Behind the current step: the two before it are filled, their rules
    // orange; the current one is ringed; the three after wait in grey.
    eq((await steps.evaluateAll((els) => els.map((el) => ("done" in el.dataset ? "done" : el.dataset.state)))).join(","), "done,done,active,inactive,inactive,inactive")
    eq((await rules.evaluateAll((els) => els.map((el) => ("done" in el.dataset ? "on" : "off")))).join(","), "on,on,off,off,off", "the rules up to the current step are orange")
    eq(await markStyle(0, "backgroundColor"), orange, "a done step's ring is filled")
    eq(await markStyle(1, "backgroundColor"), orange)
    eq(await markStyle(2, "borderTopColor"), orange, "the current one is ringed")
    eq((await markStyle(2, "backgroundColor")) !== orange, true)
    eq((await markStyle(3, "borderTopColor")) !== orange, true)
    eq(await style(rules.nth(1), "backgroundColor"), orange, "the rule into the current step is orange")
    eq((await style(rules.nth(2), "backgroundColor")) !== orange, true, "the one out of it is not")
    eq(await style(steps.nth(2).locator(".ck-order-step-label"), "fontWeight"), "700", "the current label is bold")

    // Location's panel holds exactly one section: the site, and nothing
    // asks where the users are any more.
    await steps.first().click()
    await panel("location").waitFor()
    eq(await order.locator('.ck-order-panel[data-step="location"] [data-section]').count(), 1, "Location keeps only one section")
    eq(await order.locator('.ck-order-panel[data-step="location"] [data-section="site"]').count(), 1)
    eq(await order.locator(".ck-users, .ck-recommendation").count(), 0, "the users question and its recommendation line are gone")
    eq(await order.locator(".ck-path").count(), 0)
    eq(await order.locator(".ck-workload").count(), 0)

    // Roving focus, horizontal: ArrowRight twice from the first step lands
    // on the third and selects it, skipping the rules; ArrowDown, the old
    // vertical key, is not a tablist key and moves nothing.
    await steps.first().focus()
    eq(await steps.evaluateAll((els) => els.filter((el) => el.tabIndex === 0).length), 1, "one tab stop before")
    await page.keyboard.press("ArrowRight")
    await page.keyboard.press("ArrowRight")
    const focused = () =>
      page.evaluate(() => {
        const items = [...document.querySelectorAll(".ck-order-steps .ck-order-step")]
        return items.indexOf(document.activeElement)
      })
    eq(await focused(), 2, "ArrowRight twice from the first step lands on the third")
    await panel("storage").waitFor()
    eq(await steps.nth(2).getAttribute("aria-selected"), "true", "focus selects the tab")
    eq(await steps.evaluateAll((els) => els.filter((el) => el.tabIndex === 0).length), 1, "still one tab stop")
    eq(await steps.first().evaluate((el) => el.tabIndex), -1, "the first step is no longer the tab stop")
    await page.keyboard.press("ArrowDown")
    eq(await focused(), 2, "ArrowDown does not move a horizontal tablist")
    await page.keyboard.press("End")
    eq(await focused(), 5, "End lands on Checkout")
    await panel("checkout").waitFor()
  })

  await test("billing and the vDC name live on Checkout; a bad name flags the Checkout step, not Location", async () => {
    await reset()
    eq(await order.locator('.ck-order-panel[data-step="location"] [data-section="billing"]').count(), 0, "billing left Location")
    await goTab("Checkout", "checkout")
    eq(await order.locator('.ck-order-panel[data-step="checkout"] [data-section="billing"]').count(), 1, "billing now lives on Checkout")
    eq(await order.locator(".ck-order-name .input-group-text").textContent(), "dfw.acme.cloud", "the name field carries its site suffix here too")

    // Arriving on Checkout already marks the order "reviewed" (it aggregates
    // every step's issues for the deploy gate), so the error shows live
    // here — no blur wait, unlike the same field's old home on Location.
    const name = order.locator("#ck-order-name")
    await name.fill("")
    const error = order.locator('.ck-order-error[data-field="name"]')
    await error.waitFor()
    eq(await error.textContent(), "Give the vDC a name.")
    eq(await name.getAttribute("aria-invalid"), "true")
    eq(await tab("Checkout").locator(".ck-order-step-flag").textContent(), "1", "the flag lands on the Checkout step")
    eq(await tab("Location").locator(".ck-order-step-flag").count(), 0, "Location carries no flag for the name any more")
    eq(await texts(order.locator(".ck-order-issues .ck-order-issue")), "Give the vDC a name.")
    eq(await draftName.textContent(), "unnamed")
    eq(await order.locator('.ck-order-panel[data-step="checkout"] [data-section="billing"]').count(), 1, "billing still renders beside the name error")
    await name.fill("Vdc_01")
    await name.blur()
    await order.locator('.ck-order-error[data-field="name"]', { hasText: "Lower-case" }).waitFor()
    await name.fill("vdc-01")
    await name.blur()
    await noneLeft('.ck-order-error[data-field="name"]')
    eq(await order.locator(".ck-order-step-flag").count(), 0)
  })

  await test("location: the site cards carry monograms, the recommended one is marked, a click chooses, and the comparison folds open", async () => {
    await reset()
    eq(await order.locator('[data-section="site"] .ck-order-section-title').textContent(), "Site")
    eq(await texts(order.locator(".ck-site-city")), "Plano, TX · sales tax TX 8.25% | Chicago, IL · sales tax IL 10.25% | Salt Lake City, UT · sales tax UT 7.25%")
    eq(await texts(order.locator(".ck-site .ck-site-mark .avatar-fallback")), "DFW | CHI | SLC", "every site card carries its code as a monogram")
    eq(await order.locator(".ck-site .ck-site-mark").first().evaluate((el) => el.matches(".avatar")), true, "the monogram is the kit's avatar")
    const first = order.locator(".ck-site").first()
    const [markBox, radioBox, nameBox, descBox] = await Promise.all([".ck-site-mark", ".radio-group-item", ".ck-site-name", ".ck-option-desc"].map((sel) => rect(first.locator(sel))))
    eq(markBox.bottom <= nameBox.top, true, "the monogram sits over the name")
    eq(nameBox.bottom <= descBox.top, true, "and the name over the sentence")
    near(markBox.top + markBox.height / 2, radioBox.top + radioBox.height / 2, 2, "the radio across from the monogram")
    eq(radioBox.left > markBox.right, true)
    eq(await order.locator(".ck-site[data-recommended]").count(), 1, "one site is recommended")
    eq(await order.locator(".ck-site[data-recommended] .ck-site-name").textContent(), "DFW Cage 6Recommended")
    eq(await order.locator('.ck-site[data-state="checked"] .ck-site-name').textContent(), "DFW Cage 6Recommended", "the default is the recommended site")
    await settled()
    const orange = await orderColour("--ck-orange")
    eq(await style(order.locator('.ck-site[data-state="checked"] .avatar-fallback'), "color"), orange, "the chosen site's monogram turns orange")
    eq((await style(order.locator('.ck-site[data-state="unchecked"] .avatar-fallback').first(), "color")) !== orange, true, "an unchosen monogram is not orange, so the colour is the choice's")
    await order.locator(".ck-site", { hasText: "SLC Cage 6" }).click()
    await order.locator('.ck-site[data-state="checked"]', { hasText: "SLC Cage 6" }).waitFor()
    eq(await order.locator('.ck-site[data-state="checked"]').count(), 1)
    eq(await order.locator(".ck-order-total-name > span").textContent(), "SLC Cage 6", "the total names the chosen site")
    eq(await order.locator(".ck-site[data-recommended] .ck-site-name").textContent(), "DFW Cage 6Recommended", "the recommendation does not follow the choice")
    await settled()
    eq(await style(order.locator('.ck-site[data-state="checked"] .avatar-fallback'), "color"), orange, "the orange moved with the choice")

    // Compare sites: always open under the cards, latency only; the chosen
    // row tinted, the recommended one chipped.
    eq(await order.locator('[data-disclosure="compare-sites"]').count(), 0, "no disclosure to open")
    const block = order.locator('.ck-compare-block[data-compare="sites"]')
    eq(await block.locator(".ck-compare-title").textContent(), "Compare sites")
    eq(await block.locator(".ck-compare-hint").textContent(), "median round trip from where your users are")
    eq(await block.locator(".ck-compare").isVisible(), true, "open without a click")
    const [sitesBox, blockBox] = await Promise.all([rect(order.locator(".ck-sites")), rect(block)])
    eq(blockBox.top >= sitesBox.bottom, true, "under the site cards")
    eq(await texts(block.locator(".ck-compare thead th")), "Site | Texas & the South | Midwest & Northeast | Mountain West & Pacific")
    eq(await style(block.locator(".ck-compare thead th").nth(1), "textAlign"), "end", "figures and their headers sit at the right")
    eq(await style(block.locator(".ck-compare tbody td").first(), "textAlign"), "end")
    eq(await style(block.locator(".ck-compare thead th").first(), "textAlign"), "start", "the site column does not")
    eq(await block.locator(".ck-compare thead th").evaluateAll((els) => els.some((el) => /capacity|seismic|tax/i.test(el.textContent))), false, "capacity, seismic risk and tax columns are gone")
    eq(await block.locator(".ck-compare tbody tr").count(), 3)
    eq(await texts(block.locator(".ck-compare tbody tr").first().locator("td")), "8 ms | 24 ms | 32 ms")
    eq(await block.locator(".ck-compare tbody tr").first().locator("td").count(), 3, "three figures a row")
    eq(await block.locator('.ck-compare tr[data-state="checked"] th').textContent(), "SLC Cage 6")
    eq(await block.locator(".ck-compare .ck-chip").count(), 1, "one recommended chip")
    eq(await block.locator(".ck-compare tr:has(.ck-chip) th").textContent(), "DFW Cage 6recommended")
    eq(await style(block.locator(".ck-compare-wrap"), "overflowX"), "auto")
    eq(await texts(order.locator(".ck-site-city")), "Plano, TX · sales tax TX 8.25% | Chicago, IL · sales tax IL 10.25% | Salt Lake City, UT · sales tax UT 7.25%", "tax stays on the cards")
  })

  await test("size: Plans and Custom are tabs of their own; four plans, M recommended and chosen by default; a plan sets both pools, pools that match none open on Custom, one shrunk under the machines is an error, headroom is free", async () => {
    await reset()
    await addVm() // one machine, so the draw has something to report
    await goTab("Infrastructure", "infrastructure")
    const head = order.locator('[data-section="size"] .ck-order-section-head')
    const tabs = head.locator(".ck-size-tablist")
    eq(await tabs.getAttribute("role"), "tablist")
    eq(await tabs.evaluate((el) => el.matches(".tabs-list")), true, "built on ui/tabs")
    eq(await texts(tabs.locator(".ck-size-tab")), "Plans | Custom")
    eq(await tabs.locator('[aria-selected="true"]').textContent(), "Plans", "the default pools are a plan, so Plans is open")
    eq(await order.locator(".ck-size-panel").count(), 1, "one tab's panel at a time")
    eq(await order.locator(".ck-size-panel").getAttribute("data-size"), "plans")
    eq(await order.locator('[data-section="size"] .ck-slider-row').count(), 0, "the pool sliders are Custom's alone")
    eq(await order.locator(".ck-plan--custom").count(), 0, "Custom is a tab, not a fifth card")
    // The title, the live draw and the tabs share the head, the tabs at its end.
    const [titleBox, drawBox, tabsBox, headBox] = await Promise.all([head.locator(".ck-order-section-title"), head.locator(".ck-order-draw"), tabs, head].map(rect))
    eq(titleBox.bottom <= drawBox.top + 1, true, "the draw sits under the title")
    eq(tabsBox.left > drawBox.right, true, "the tabs sit beside them")
    near(tabsBox.right, headBox.right, 1, "at the head's end")

    const plans = order.locator(".ck-plans .ck-plan")
    eq(await plans.count(), 4)
    eq(await texts(plans.locator(".ck-plan-name")), "S | M | L | XL")
    eq(await texts(plans.locator(".ck-plan-spec")), "8 GHz · 32 GB | 20 GHz · 64 GB | 60 GHz · 192 GB | 120 GHz · 512 GB")
    eq(await texts(plans.locator(".ck-plan-price")), "$256.00/mo | $520.00/mo | $1,560.00/mo | $4,080.00/mo", "monthly, and nothing hourly")
    eq(await order.locator(".ck-plan-monthly").count(), 0)
    eq((await plans.evaluateAll((els) => els.map((el) => el.dataset.state))).join(","), "unchecked,checked,unchecked,unchecked", "M is chosen: the default pools are its")
    eq(await plans.nth(1).getAttribute("data-recommended"), "true", "M is the general workload's plan")
    eq(await order.locator(".ck-plans .ck-recommended").count(), 1, "one recommendation, on M")
    eq(await plans.nth(1).locator(".ck-plan-head .ck-recommended").count(), 1, "in its head")
    await settled()
    const orange = await orderColour("--ck-orange")
    eq(await style(plans.nth(1), "borderTopColor"), orange, "the chosen plan carries the orange")
    eq((await style(plans.nth(0), "borderTopColor")) !== orange, true, "an unchosen one does not")
    const draw = order.locator(".ck-order-draw")
    eq(await draw.textContent(), "Plan M: the machines in this vDC draw 2 GHz of 20 and 4 GB of 64.")

    // A plan sets both pools; the draw, the total and the Custom sliders follow.
    await plans.nth(2).click()
    await order.locator(".ck-order-total-card .ck-order-total-live", { hasText: "$1,645.00" }).waitFor()
    eq(await draw.textContent(), "Plan L: the machines in this vDC draw 2 GHz of 60 and 4 GB of 192.")
    eq(await order.locator(".ck-order-total-card .ck-order-group-amount").first().textContent(), "$1,560.00", "the price card's Compute line follows")
    await sizeTab("Custom")
    eq(await order.locator(".ck-plans").count(), 0, "the plans leave with their tab")
    await order.locator('.ck-slider-row[data-field="cpu"] .ck-slider-price', { hasText: "$120.00/mo" }).waitFor()
    await order.locator('.ck-slider-row[data-field="ram"] .ck-slider-price', { hasText: "$1,440.00/mo" }).waitFor()
    await page.waitForFunction(() => document.querySelector('.ck-slider-row[data-field="cpu"] .ck-slider-input').value === "60" && document.querySelector('.ck-slider-row[data-field="ram"] .ck-slider-input').value === "192")
    eq(await texts(order.locator('.ck-slider-row[data-field="cpu"] .ck-slider-tick')), "4 | 50 | 100 | 150 | 200")
    eq(await texts(order.locator('.ck-slider-row[data-field="ram"] .ck-slider-tick')), "8 | 256 | 512 | 768 | 1,024")

    // A pool that matches no plan reads Custom; Plans then checks no card,
    // and the comparison no row.
    await setSlider("cpu", 30)
    await draw.filter({ hasText: "Custom pools: the machines in this vDC draw 2 GHz of 30 and 4 GB of 192." }).waitFor()
    await order.locator(".ck-order-total-card .ck-order-total-live", { hasText: "$1,585.00" }).waitFor()
    await sizeTab("Plans")
    eq(await plans.evaluateAll((els) => els.filter((el) => el.dataset.state === "checked").length), 0, "no plan matches, so none is checked")
    await order.locator('[data-disclosure="compare-plans"] .ck-disclosure-trigger').click()
    const compare = order.locator('[data-disclosure="compare-plans"] .ck-compare')
    await compare.waitFor()
    eq(await texts(compare.locator("tbody th")), "S | Mrecommended | L | XL")
    eq(await texts(compare.locator("thead th")), "Plan | CPU pool | RAM pool | Fits | Per month", "no hourly column")
    eq(await style(compare.locator("thead th").last(), "textAlign"), "end")
    eq(await style(compare.locator("tbody td").last(), "textAlign"), "end")
    eq(await texts(compare.locator("tbody td:nth-child(4)")), "≈ 4 standard-2 machines | ≈ 10 standard-2 machines | ≈ 30 standard-2 machines | ≈ 60 standard-2 machines")
    eq(await compare.locator('tr[data-state="checked"]').count(), 0, "custom pools match no row")
    // Arriving on the step with pools that match no plan opens Custom.
    await goTab("Storage", "storage")
    await goTab("Infrastructure", "infrastructure")
    eq(await order.locator('.ck-size-tab[aria-selected="true"]').textContent(), "Custom", "custom pools open on Custom")
    await order.locator(".ck-size-panel[data-size=\"custom\"]").waitFor()

    // Shrunk under the machines, the pool is an error that names the fix;
    // the step and the foot carry it, and Plans shows it too.
    const count = order.locator('.ck-order-table tr[data-row="vm"]').first().locator('input[aria-label^="Count of"]')
    await count.fill("5")
    await draw.filter({ hasText: "10 GHz of 30" }).waitFor()
    await setSlider("cpu", 4)
    const cpuError = order.locator('.ck-slider-row[data-field="cpu"] .ck-order-error')
    await cpuError.waitFor()
    eq(await cpuError.textContent(), "The machines draw 10 GHz; the CPU pool holds 4. Grow the pool or shrink a machine.")
    eq(await order.locator(".ck-order-draw[data-over]").count(), 1, "the draw turns red")
    eq(await tab("Infrastructure").locator(".ck-order-step-flag").textContent(), "1", "Infrastructure carries the count")
    eq(await order.locator('.ck-order-issue[data-field="cpu"]').count(), 1, "the foot lists it")
    await sizeTab("Plans")
    eq(await order.locator('[data-section="size"] .ck-order-error[data-field="cpu"]').textContent(), "The machines draw 10 GHz; the CPU pool holds 4. Grow the pool or shrink a machine.", "out of the slider's sight, the error shows under the plans")
    await plans.nth(1).click()
    await noneLeft('[data-section="size"] .ck-order-error')
    eq(await order.locator(".ck-order-step-flag").count(), 0)
    eq(await order.locator(".ck-order-draw[data-over]").count(), 0)
    await order.locator('[data-disclosure="compare-plans"] .ck-disclosure-trigger').click()
    await compare.waitFor()
    eq(await compare.locator('tr[data-state="checked"] th').textContent(), "Mrecommended", "a plan chosen checks its row")

    // Headroom is Custom's: one small checkbox line under the sliders,
    // not a card or a switch, and it costs nothing.
    eq(await order.locator("#ck-order-headroom").count(), 0, "not on Plans")
    await sizeTab("Custom")
    const headroom = order.locator("#ck-order-headroom")
    eq(await headroom.evaluate((el) => el.matches(".checkbox[role='checkbox']")), true, "the kit's checkbox")
    eq(await order.locator(".ck-check-line:has(#ck-order-headroom)").count(), 1, "on a line of its own")
    eq(await order.locator(".ck-switch-row:has(#ck-order-headroom), .ck-check-row:has(#ck-order-headroom)").count(), 0, "not a card row")
    eq(await order.locator(".ck-check-line:has(#ck-order-headroom) .ck-check-line-label").textContent(), "Reserve headroom")
    const lineBox = await rect(order.locator(".ck-check-line:has(#ck-order-headroom)"))
    eq(lineBox.height < 48, true, `the line is ${lineBox.height}px: small`)
    const before = await total.textContent()
    await order.locator(".ck-check-line:has(#ck-order-headroom) .ck-check-line-label").click()
    eq(await headroom.getAttribute("aria-checked"), "true", "the label toggles the box")
    eq(await total.textContent(), before, "headroom is not billed")
  })

  await test("infrastructure: size, then the network beside advanced networking, both always open; the slider bound to its input both ways, deltas on the uplinks; no access on the step", async () => {
    await reset()
    await cta.click()
    await panel("infrastructure").waitFor()
    eq(await order.locator(".ck-order-step-head").count(), 0, "no step heading")
    eq((await panel("infrastructure").locator("[data-section]").evaluateAll((els) => els.map((el) => el.dataset.section))).join(","), "size,network,advanced", "included left for Add-ons; software and access stay off the step")
    eq(await order.locator('.ck-software, [data-section="software"], [data-section="access"], [data-section="included"]').count(), 0)
    const [sizeBox, networkBox, advancedBox] = await Promise.all(["size", "network", "advanced"].map((id) => rect(panel("infrastructure").locator(`[data-section="${id}"]`))))
    near(networkBox.top, advancedBox.top, 1, "network and advanced networking share a row")
    eq(networkBox.right < advancedBox.left, true, "network first")
    eq(networkBox.width > advancedBox.width, true, "and wider: it holds what costs")
    eq(sizeBox.bottom <= networkBox.top, true, "both under size")
    eq(await order.locator('[data-section="advanced"] .ck-order-section-title').textContent(), "Advanced networking")
    eq(await order.locator('[data-disclosure="advanced-network"], [data-section="advanced"] .ck-disclosure').count(), 0, "nothing folded: the uplink, the network and placement are on the step")
    eq(await order.locator('[data-section="network"] .ck-presets').count(), 1, "the uplink sits with the addresses, the two that cost")
    eq(await order.locator('[data-section="advanced"] #ck-order-network').count(), 1, "the default network is advanced")
    const affinity = order.locator("#ck-order-affinity")
    eq(await affinity.evaluate((el) => el.matches('[data-section="advanced"] .ck-check-line .checkbox')), true, "anti-affinity is a checkbox line there too")
    eq(await affinity.getAttribute("aria-checked"), "false")

    // Network: IPv4 is the one thing that costs, and its slider is bound to
    // its input both ways. Track → input: End on the thumb fills the input.
    eq(await texts(order.locator('.ck-slider-row[data-field="ips"] .ck-slider-tick')), "0 | 8 | 16 | 24 | 32")
    const ipThumb = order.locator('.slider[aria-label="Public IPs"] .slider-thumb')
    await ipThumb.focus()
    await page.keyboard.press("End")
    await order.locator('.ck-slider-row[data-field="ips"] .ck-slider-price', { hasText: "$160.00/mo" }).waitFor()
    // The input's text follows the value in an effect a task after the
    // price paints, so it is polled rather than read once.
    await page.waitForFunction(() => document.querySelector('.ck-slider-row[data-field="ips"] .ck-slider-input').value === "32")
    await order.locator(".ck-order-total-card .ck-order-total-live", { hasText: "$755.00" }).waitFor()
    await order.locator('.ck-order-total-card .ck-order-total-glow[data-last-trend="up"]').waitFor()
    await settled()
    eq(await style(total, "color"), await orderColour("--ck-blue"), "up is blue")
    // Input → track: a typed figure moves the thumb.
    await setSlider("ips", 2)
    await order.locator('.ck-slider-row[data-field="ips"] .ck-slider-price', { hasText: "$10.00/mo" }).waitFor()
    eq(await ipThumb.getAttribute("aria-valuenow"), "2")
    await order.locator(".ck-order-total-card .ck-order-total-live", { hasText: "$605.00" }).waitFor()
    await order.locator('.ck-order-total-card .ck-order-total-glow[data-last-trend="down"]').waitFor()
    await settled()
    eq(await style(total, "color"), await orderColour("--ck-orange"), "down is orange")
    await setSlider("ips", "")
    eq(await sliderInput("ips").inputValue(), "2", "an emptied box falls back to the value")

    // The uplinks carry deltas.
    const uplinks = order.locator('[data-section="network"] .ck-presets .ck-preset')
    eq(await uplinks.count(), 3, "open without a click")
    eq(await texts(uplinks.locator(".ck-preset-meta")), "base tier | +$60.00/mo | +$220.00/mo")
    eq(await uplinks.nth(1).locator('.ck-delta[data-sign="up"]').count(), 1)
    await uplinks.filter({ hasText: "1 Gbps" }).click()
    await order.locator(".ck-order-total-card .ck-order-total-live", { hasText: "$825.00" }).waitFor()
    await uplinks.filter({ hasText: "10 Mbps" }).click()
    await order.locator(".ck-order-total-card .ck-order-total-live", { hasText: "$605.00" }).waitFor()

    // An empty vDC has no machine to reach, so Continue flags nothing.
    eq(await accessDialog.count(), 0, "nothing is open before it is asked for")
    await cta.click()
    await panel("storage").waitFor()
    eq(await order.locator(".ck-order-issues").count(), 0)
    eq(await order.locator(".ck-order-step-flag").count(), 0)
  })

  await test("on a 14-inch laptop's 1512×860 viewport Infrastructure fits one screen on either tab; the table waits a scroll below its rule", async () => {
    await reset()
    await page.setViewportSize({ width: 1512, height: 860 })
    await goTab("Infrastructure", "infrastructure")
    const scrollTop = () => page.evaluate(() => document.querySelector(".ck-scroller").scrollTop)
    for (const label of ["Plans", "Custom"]) {
      await sizeTab(label)
      eq(await scrollTop(), 0, `${label}: measured unscrolled`)
      const [main, cta, aside] = await Promise.all([rect(order.locator(".ck-order-main")), rect(order.locator(".ck-order-strip .ck-order-continue")), rect(order.locator(".ck-order-aside"))])
      eq(main.bottom <= 860, true, `${label}: the options end at ${main.bottom}px, inside 860`)
      eq(cta.bottom <= 860, true, `${label}: Continue is on screen`)
      eq(aside.bottom <= 860, true, `${label}: so is the price card`)
    }
    // The rule is the kit's separator, closing the wizard: under both
    // columns, over the table card, and it is below the fold, not squeezed
    // above it.
    const rule = order.locator(".ck-order-table-section > .separator")
    eq(await rule.count(), 1)
    eq(await rule.getAttribute("role"), "separator")
    const [ruleBox, main, card] = await Promise.all([rect(rule), rect(order.locator(".ck-order-main")), rect(order.locator(".ck-order-card"))])
    eq(ruleBox.top >= main.bottom, true, "the rule sits under the wizard")
    eq(card.top >= ruleBox.bottom, true, "and over the table card")
    near(ruleBox.height, 1, 0.01, "a hairline")
    near(ruleBox.width, card.width, 1, "as wide as the table")
    await page.setViewportSize({ width: 1280, height: 720 })
  })

  await test("storage: ticks, prices, the mix bar and the spec card; zero storage blocks protection and the boot volumes, and only a vDC with machines needs one", async () => {
    await reset()
    await addVm()
    await goTab("Storage", "storage")
    eq(await order.locator(".ck-slider-row .slider").count(), 4, "four tiers")
    eq(await texts(order.locator(".ck-slider-label .ck-hint")), "Tier 1 | Tier 2 | Tier 3 | Tier 4")
    eq(await texts(order.locator(".ck-slider-price")), "$25.00/mo | $20.00/mo | $0.00/mo | $0.00/mo")
    eq(await texts(order.locator(".ck-slider-row").first().locator(".ck-slider-tick")), "0 | 2,500 | 5,000 | 7,500 | 10k")
    const trackBox = await rect(order.locator(".ck-slider-row").first().locator(".slider-track"))
    const lastTick = await rect(order.locator(".ck-slider-row").first().locator(".ck-slider-tick").last())
    near(lastTick.x + lastTick.width / 2, trackBox.x + trackBox.width, 2, "the last tick sits under the track's end")
    eq(await order.locator(".ck-storage-mix-total").textContent(), "750 GB · $45.00/mo")
    eq(await order.locator(".ck-storage-mix-seg").count(), 2, "only tiers holding storage draw a segment")
    eq(await order.locator(".ck-order-draw").textContent(), "Boot volumes for the machines below take 40 GB of the 750 GB provisioned.")
    eq(await order.locator('[data-section="tiers"] .ck-order-hint').textContent(), "GB per performance tier, the pools the machines' volumes come from. Leave a tier at zero to skip it; hover a tier's name for its figures.")
    const media = order.locator('[data-section="tiers"] .ck-order-note[data-note="media"]')
    eq(await media.locator("span").textContent(), "HDD, Hybrid, SSD and NVMe name each tier's performance class, the IOPS and latency it is held to, not the hardware behind it.", "the media names are classes, and the step says so")
    eq(await media.locator("svg").count(), 1, "behind an (i)")
    const [mixBox, mediaBox] = await Promise.all([rect(order.locator(".ck-storage-mix")), rect(media)])
    eq(mediaBox.top >= mixBox.bottom, true, "under the mix")
    await settled()
    eq(await style(order.locator(".slider-range").first(), "backgroundColor"), await orderColour("--ck-orange"), "the filled range is orange")

    eq(await page.locator(".ck-spec-card:popover-open").count(), 0)
    await order.locator(".ck-slider-label .ck-hint", { hasText: "Tier 3" }).hover()
    const spec = page.locator(".ck-spec-card:popover-open")
    await spec.waitFor()
    eq(await spec.locator(".ck-spec-title").textContent(), "Tier 3 · SSD")
    eq(await texts(spec.locator(".ck-spec-row dd")), "16,000 | 1 ms | $0.12 per GB")
    await page.mouse.move(0, 0)
    await noneLeft(".ck-spec-card:popover-open")

    await setSlider("storage-t1", 0)
    await setSlider("storage-t2", 0)
    await order.locator(".ck-storage-mix-total", { hasText: "0 GB · $0.00/mo" }).waitFor()
    eq(await order.locator(".ck-storage-mix-seg").count(), 0)
    eq(await order.locator(".ck-order-draw[data-over]").count(), 1, "the boot volumes no longer fit")
    eq(await order.locator('.ck-order-error[data-field="storage"]').textContent(), "Machines need a boot volume: put storage on at least one tier.")
    eq(await tab("Storage").locator(".ck-order-step-flag").textContent(), "1")
    await order.locator(".ck-order-total-card .ck-order-total-live", { hasText: "$560.00" }).waitFor()

    await goTab("Backup & DR", "bcdr")
    eq(await order.locator(".ck-option[data-disabled]").count(), 2, "both replica tiers are blocked")
    eq(await texts(order.locator(".ck-option-reason")), "Nothing to replicate yet: add storage first. | Nothing to replicate yet: add storage first. | Nothing to back up yet: add storage first.")
    eq(await order.locator("#ck-order-backups").isDisabled(), true)
    const gate = order.locator(".ck-order-gate")
    eq(await gate.locator(".alert-title").textContent(), "Finish the base first")
    eq(await texts(gate.locator(".ck-order-gate-list li > span")), "Machines need a boot volume: put storage on at least one tier.", "the machine has its key, so storage is the one problem")
    eq(await texts(gate.locator(".ck-order-fix")), "Fix in Storage")
    eq(await order.locator(".ck-order-fieldset").evaluate((el) => el.disabled), true, "protection waits")
    eq(await gate.locator(".alert-description").evaluate((el) => el.firstChild.textContent), "Protection prices against a valid vDC, so it waits until these are fixed:")
    await goTab("Add-ons", "addons")
    eq(await order.locator(".ck-order-gate .alert-description").evaluate((el) => el.firstChild.textContent), "Add-ons price against a valid vDC, so it waits until these are fixed:", "the add-ons wait behind the same gate")
    eq(await order.locator(".ck-order-fieldset").evaluate((el) => el.disabled), true)
    await goTab("Backup & DR", "bcdr")
    await gate.locator(".ck-order-fix", { hasText: "Storage" }).click()
    await panel("storage").waitFor()
    await setSlider("storage-t1", 500)
    await noneLeft('.ck-order-error[data-field="storage"]')
    eq(await order.locator(".ck-order-draw[data-over]").count(), 0)

    // Counter: the boot volume is the machines'. Emptied, the vDC may hold
    // no storage at all.
    await order.locator('[aria-label="Actions for vm-01"]').click()
    await page.locator('.dropdown-menu[data-state="open"] .dropdown-menu-item.ck-menu-danger').click()
    await page.waitForFunction(() => document.querySelectorAll('.ck-order-table tr[data-row="vm"]').length === 0)
    await setSlider("storage-t1", 0)
    await order.locator(".ck-storage-mix-total", { hasText: "0 GB · $0.00/mo" }).waitFor()
    eq(await order.locator('.ck-order-error[data-field="storage"]').count(), 0, "no machine, no boot volume to find room for")
    eq(await order.locator(".ck-order-step-flag").count(), 0)
    await setSlider("storage-t1", 500)
  })

  await test("backup & DR: protection and backups price themselves with deltas; add-ons: a blocked edge service says why", async () => {
    await reset()
    await addVm() // one machine, one replication licence
    await goTab("Backup & DR", "bcdr")
    eq(await order.locator(".ck-order-step-head").count(), 0)
    eq(await order.locator('[data-section="bcdr"] .ck-order-hint').textContent(), "A second site that takes over through a site failure, and nightly copies to get back from afterwards. Both are options here with an exact price, not defaults.")
    eq(await order.locator(".ck-order-gate").count(), 0, "a valid base opens protection")
    eq(await order.locator(".ck-order-fieldset").evaluate((el) => el.disabled), false)
    eq((await panel("bcdr").locator("[data-section]").evaluateAll((els) => els.map((el) => el.dataset.section))).join(","), "bcdr,protection,backups", "the explainer, protection and backups; nothing else")
    eq(await texts(order.locator(".ck-bcdr-item .item-title")), "Replica site | RPO and RTO | Backups")
    const tiers = order.locator('[data-section="protection"] .ck-option')
    eq(await texts(tiers.locator(".ck-option-name")), "NoneNo replica | Warm standbyRPO 15 min · RTO 1 hr · 25% of CPU and RAM | Hot standbyRPO 5 min · RTO 15 min · 100% of CPU and RAM")
    // The tiers are cards across the column, as the plans are, their
    // deltas on one line at the cards' feet.
    const tierBoxes = await Promise.all([0, 1, 2].map((i) => rect(tiers.nth(i))))
    near(tierBoxes[0].top, tierBoxes[2].top, 1, "three across")
    eq(tierBoxes[0].right < tierBoxes[1].left && tierBoxes[1].right < tierBoxes[2].left, true)
    const deltaBoxes = await Promise.all([0, 1, 2].map((i) => rect(tiers.nth(i).locator(".ck-option-delta"))))
    near(deltaBoxes[0].bottom, deltaBoxes[2].bottom, 1, "the deltas share a baseline")
    // 25% of ($40 + $480) + 975 GB at $0.05 + one licence; 100% for hot.
    eq(await texts(tiers.locator(".ck-option-delta")), "no change | +$193.75/mo | +$583.75/mo")
    eq(await order.locator(".ck-order-select").evaluate((el) => el.matches(":disabled, [aria-disabled='true'], [data-disabled]")), true, "the DR site waits for protection")
    await tiers.filter({ hasText: "Warm standby" }).click()
    await order.locator(".ck-order-total-card .ck-order-total-live", { hasText: "$798.75" }).waitFor()
    eq(await texts(tiers.locator(".ck-option-delta")), "−$193.75/mo | no change | +$390.00/mo", "deltas re-price against the new choice")
    eq(await order.locator(".ck-order-select .select-value").textContent(), "SLC Cage 6 · Salt Lake City, UT")
    eq(await texts(order.locator('.ck-slider-row[data-field="drStoragePct"] .ck-slider-tick')), "100 | 125 | 150 | 175 | 200")
    const licences = order.locator(".ck-order-line", { hasText: "Replication licences" })
    eq(await licences.locator(".ck-order-line-price").textContent(), "$15.00/mo")
    eq(await licences.locator(".ck-order-line-meta").textContent(), "1 × $15.00")

    eq(await order.locator("#ck-order-backups").getAttribute("data-state"), "unchecked")
    const [switchBox, termsBox] = await Promise.all([rect(order.locator('[data-section="backups"] .ck-switch-row')), rect(order.locator('[data-section="backups"] .ck-backups-terms'))])
    near(switchBox.top, termsBox.top, 1, "the switch beside its retention and the line it prices")
    eq(switchBox.right <= termsBox.left, true)
    eq(await order.locator('[data-section="backups"] .ck-switch-row .ck-delta').textContent(), "+$15.00/mo", "750 GB × $0.02")
    eq(await order.locator('[data-section="backups"] .ck-segments .toggle-group-item').first().isDisabled(), true, "retention waits for the switch")
    await order.locator("#ck-order-backups").click()
    await order.locator(".ck-order-total-card .ck-order-total-live", { hasText: "$813.75" }).waitFor()
    await order.locator('[data-section="backups"] .ck-segments .toggle-group-item', { hasText: "30 days" }).click()
    await order.locator(".ck-order-total-card .ck-order-total-live", { hasText: "$831.75" }).waitFor()
    const backupLine = order.locator(".ck-order-line", { hasText: "Backup storage" })
    eq(await backupLine.locator(".ck-order-line-price").textContent(), "$33.00/mo")
    eq(await backupLine.locator(".ck-order-line-meta").textContent(), "750 GB · 30 days")

    await goTab("Add-ons", "addons")
    eq(await order.locator(".ck-order-step-head").count(), 0)
    eq((await panel("addons").locator("[data-section]").evaluateAll((els) => els.map((el) => el.dataset.section))).join(","), "edge,licences,included", "the edge services, licences and what is included; protection left for Backup & DR")
    eq(await order.locator("#ck-order-backups, [data-section=\"protection\"]").count(), 0)
    eq(await texts(order.locator('[data-section="included"] .ck-marker')), "IPv6 /64 for every machine | Edge firewall | Private network | Hypervisor high availability | Live migration between hosts | Management plane and API", "included features are markers, here now")
    const [edgeBox, licencesBox, includedBox] = await Promise.all(["edge", "licences", "included"].map((id) => rect(panel("addons").locator(`[data-section="${id}"]`))))
    near(licencesBox.top, includedBox.top, 1, "licences and included share a row")
    eq(licencesBox.right < includedBox.left, true, "licences first")
    eq(edgeBox.bottom <= licencesBox.top, true, "both under the edge services")
    const addons = order.locator(".ck-check-row")
    eq(await addons.count(), 4)
    // Two across, compact: four rows fit in the height two used to take.
    const addonBoxes = await Promise.all([0, 1, 2, 3].map((i) => rect(addons.nth(i))))
    near(addonBoxes[0].top, addonBoxes[1].top, 1, "two to a row")
    eq(addonBoxes[2].top >= addonBoxes[0].bottom, true)
    eq(addonBoxes[1].height < 60, true, `a row is ${addonBoxes[1].height}px`)
    eq(await addons.first().locator(".checkbox").isDisabled(), true, "the firewall is included and cannot be dropped")
    eq(await addons.first().locator(".checkbox").getAttribute("data-state"), "checked")
    eq(await texts(addons.locator(".ck-delta")), "+$25.00/mo | +$40.00/mo | +$60.00/mo")
    await order.locator("#ck-addon-vpn").click()
    await order.locator(".ck-order-total-card .ck-order-total-live", { hasText: "$856.75" }).waitFor()
    eq(await texts(addons.locator(".ck-delta")), "+$40.00/mo | +$60.00/mo", "a chosen add-on drops its delta")
    eq(await order.locator('[data-section="licences"] .ck-option-desc').textContent(), "No licensed software in this vDC; Linux images carry no licence fee.")

    // Without a public address the VPN and the shield are blocked, and the
    // one already chosen becomes an error the foot and the step both carry.
    await goTab("Infrastructure", "infrastructure")
    await setSlider("ips", 0)
    await order.locator(".ck-order-total-card .ck-order-total-live", { hasText: "$846.75" }).waitFor()
    await goTab("Add-ons", "addons")
    eq(await order.locator(".ck-check-row[data-disabled]").count(), 3, "firewall, VPN and DDoS")
    eq(await texts(order.locator(".ck-check-row .ck-option-reason")), "Needs at least one public IPv4 address (Infrastructure › Network). | Needs at least one public IPv4 address (Infrastructure › Network).")
    eq(await order.locator('.ck-order-error[data-field="addons"]').textContent(), "The VPN gateway and the DDoS shield need a public address.")
    eq(await tab("Add-ons").locator(".ck-order-step-flag").textContent(), "1")
    eq(await texts(order.locator(".ck-order-issues .ck-order-issue")), "The VPN gateway and the DDoS shield need a public address.")
    await goTab("Infrastructure", "infrastructure")
    await setSlider("ips", 2)
    await order.locator(".ck-order-total-card .ck-order-total-live", { hasText: "$856.75" }).waitFor()
    eq(await order.locator(".ck-order-step-flag").count(), 0)
  })

  await test("the table beside the form: an empty vDC's row, search, group by, columns, page size, row menus, machine settings, access per machine, Add VM and Add vDC", async () => {
    await reset()
    const table = order.locator(".ck-order-table")
    const vdcRows = table.locator('tr[data-row="vdc"]')
    const vmRows = table.locator('tr[data-row="vm"]')
    const emptyRows = table.locator('tr[data-row="empty"]')
    eq(await vdcRows.count(), 1)
    eq(await vdcRows.locator(".data-table-group-label").textContent(), "vdc-01")
    eq(await style(vdcRows.locator(".data-table-group-label"), "textTransform"), "none", "a vDC name keeps its case")
    eq(await vdcRows.locator(".badge").textContent(), "Draft")
    // The vDC row keeps to the columns: one fact per header after Machine,
    // so Site, Size, Image and Count read as their headers say.
    const headers = () => table.locator("thead th").allTextContents()
    eq((await headers()).join(" | "), " | Machine | Site | Size | Image | Count | Monthly | Actions", "vDC hides while grouped by it")
    eq(await texts(vdcRows.locator(".ck-vdc-fact")), "DFW Cage 6 | 20 GHz · 64 GB · 750 GB | Ubuntu 24.04 LTS | 0 | $605.00/mo")
    for (const col of ["count", "monthly"]) {
      eq(await style(table.locator(`thead th[data-col="${col}"]`), "textAlign"), "end", `${col} header at the right`)
      eq(await style(vdcRows.locator(`.ck-vdc-fact[data-col="${col}"]`), "textAlign"), "end", `${col} fact at the right`)
    }
    // The price is a flex row (figure and unit), so text-align alone would
    // leave it at the left: its right edge meets the header's.
    const [monthlyHead, monthlyFact] = await Promise.all([rect(table.locator('thead th[data-col="monthly"]')), rect(vdcRows.locator(".ck-vdc-price"))])
    near(monthlyFact.right, monthlyHead.right - 8, 2, "the price ends where the MONTHLY header ends, inside the cell padding")
    eq(["left", "start"].includes(await style(table.locator('thead th[data-col="site"]'), "textAlign")), true, "text columns stay at the left")
    eq((await vdcRows.locator(".ck-vdc-fact").evaluateAll((els) => els.map((el) => el.dataset.col))).join(","), "site,size,image,count,monthly")
    eq(await vdcRows.locator("td").count(), (await headers()).length - 1, "the row's cells line up with the headers; the first spans expand and machine")
    eq(await vdcRows.locator("td").first().getAttribute("colspan"), "2")
    const [siteHead, siteFact] = await Promise.all([rect(table.locator("thead th", { hasText: "Site" })), rect(vdcRows.locator('.ck-vdc-fact[data-col="site"]'))])
    near(siteFact.left, siteHead.left, 1, "the site fact sits under the SITE header")
    eq(await vdcRows.locator(".ck-vdc-facts").count(), 0, "the inline fact run is gone")
    eq(await vdcRows.locator(".ck-vdc-price-live").textContent(), "$605.00")
    eq(await vdcRows.locator(".ck-vdc-price-unit").textContent(), "/mo")
    eq(await vdcRows.locator(".data-table-group-toggle").getAttribute("aria-expanded"), "true", "groups open on arrival")

    // A new vDC starts empty: its row stays, with a line and a way to fill it.
    eq(await vmRows.count(), 0, "no machine is required")
    eq(await emptyRows.count(), 1)
    eq(await emptyRows.getAttribute("data-id"), "vdc-1")
    eq(await emptyRows.locator(".ck-option-desc").textContent(), "No machines in vdc-01 yet.")
    eq(await emptyRows.locator("td").getAttribute("colspan"), String((await headers()).length), "the placeholder spans the table")
    eq(await vdcRows.locator(".data-table-group-count").textContent(), "0", "the placeholder is not counted")
    eq(await order.locator(".ck-order-table-head .ck-order-table-count").textContent(), "1 vDC · 0 machines")
    eq(await order.locator(".ck-order-issues").count(), 0, "an empty vDC is a valid one")
    // Right-click on the placeholder is the vDC's menu.
    await emptyRows.click({ button: "right" })
    const context = page.locator('.ck-order-context[data-state="open"]')
    await context.waitFor()
    eq(await context.locator(".ck-context-label code").textContent(), "vdc-01")
    eq(await texts(context.locator(".dropdown-menu-item")), "Add to order | Add virtual machine | Duplicate")
    await page.keyboard.press("Escape")
    await noneLeft('.ck-order-context[data-state="open"]')

    // Its link adds the first machine, and asks how you get in first.
    await emptyRows.locator(".ck-vdc-empty-add").click()
    await accessDialog.waitFor()
    eq(await accessDialog.evaluate((el) => el.tagName === "DIALOG" && el.matches(":modal")), true, "the kit's native modal dialog")
    eq(await accessDialog.locator(".dialog-title").textContent(), "Add a machine to vdc-01")
    eq(await accessDialog.locator('.ck-order-error[data-field="access"]').count(), 0, "an add request waits for a blur or a confirm before it complains")
    await accessDialog.locator(".ck-access-confirm").click()
    await accessDialog.locator('.ck-order-error[data-field="access"]').waitFor()
    eq(await accessDialog.locator('.ck-order-error[data-field="access"]').textContent(), "Paste a public key, or switch to a username and password.")
    eq(await vmRows.count(), 0, "no machine without a way in")
    await accessDialog.locator(".ck-order-key").fill(SSH_KEY)
    eq(await accessDialog.locator(".ck-access-confirm").textContent(), "Add machine")
    await accessDialog.locator(".ck-access-confirm").click()
    await noneLeft(".ck-access-dialog")
    await vmRows.first().waitFor()
    eq(await emptyRows.count(), 0, "the placeholder gives way to the machine")
    eq(await vdcRows.locator(".data-table-group-count").textContent(), "1")
    eq(await vmRows.locator('input[aria-label^="Name of"]').inputValue(), "vm-01")
    eq(await texts(vmRows.locator(".select-value")), "standard-2 | Ubuntu 24.04 LTS")
    eq(await vmRows.locator(".ck-vm-price .ck-hint").textContent(), "$34.00/mo", "2 vCPU × $2 + 4 GB × $7.50")
    // The table fits its card: no sideways scroll at 1280.
    eq(await order.locator(".ck-order-table-wrap").evaluate((el) => { const vp = el.querySelector(".scroll-area-viewport") ?? el; return vp.scrollWidth <= vp.clientWidth }), true, "the table fits the card's width")

    // Search filters machines; the group row follows its machines.
    const search = order.locator(".ck-order-search-input")
    await search.fill("nothing-here")
    await table.locator(".ck-table-empty").waitFor()
    eq(await table.locator(".ck-table-empty").textContent(), "No machines match that filter.")
    await search.fill("vm-01")
    await vmRows.first().waitFor()
    eq(await vmRows.count(), 1)
    await search.fill("")

    // Group by site, then none, then vDC again; the grouped column hides.
    const menubar = order.locator(".ck-order-menubar")
    await menubar.locator(".menubar-trigger", { hasText: "Group by" }).click()
    await page.locator(".menubar-content .dropdown-menu-radio-item", { hasText: "Site" }).click()
    await table.locator(".ck-site-row").waitFor()
    await page.waitForFunction(() => [...document.querySelectorAll(".ck-order-table thead th")].some((th) => th.textContent === "vDC"))
    eq(await table.locator(".ck-site-row .data-table-group-label").textContent(), "DFW Cage 6")
    eq(await vdcRows.count(), 0)
    eq((await headers()).join(" | "), " | Machine | vDC | Size | Image | Count | Monthly | Actions", "vDC shown, Site hidden")
    await menubar.locator(".menubar-trigger", { hasText: "Group by" }).click()
    await page.locator(".menubar-content .dropdown-menu-radio-item", { hasText: "None" }).click()
    await noneLeft(".ck-order-table .data-table-group-row")
    // The grouped column comes back in an effect, a render after the rows.
    await page.waitForFunction(() => [...document.querySelectorAll(".ck-order-table thead th")].some((th) => th.textContent === "Site"))
    eq((await headers()).join(" | "), " | Machine | vDC | Site | Size | Image | Count | Monthly | Actions", "both shown ungrouped")
    await menubar.locator(".menubar-trigger", { hasText: "Group by" }).click()
    await page.locator(".menubar-content .dropdown-menu-radio-item", { hasText: "vDC" }).click()
    await vdcRows.first().waitFor()

    // Columns: hide Image, show it again; the vDC row's cells follow.
    await menubar.locator(".menubar-trigger", { hasText: "Columns" }).click()
    const columns = page.locator(".menubar-content .dropdown-menu-checkbox-item")
    eq(await texts(columns), "vDC | Site | Size | Image | Count | Monthly")
    await columns.filter({ hasText: "Image" }).click()
    await page.waitForFunction(() => ![...document.querySelectorAll(".ck-order-table thead th")].some((th) => th.textContent === "Image"))
    eq(await vdcRows.locator('.ck-vdc-fact[data-col="image"]').count(), 0, "the vDC row dropped its image cell with the column")
    eq(await vdcRows.locator("td").count(), (await headers()).length - 1, "its cells still line up with the headers")
    await page.keyboard.press("Escape")
    await menubar.locator(".menubar-trigger", { hasText: "Columns" }).click()
    await columns.filter({ hasText: "Image" }).click()
    await page.waitForFunction(() => [...document.querySelectorAll(".ck-order-table thead th")].some((th) => th.textContent === "Image"))
    eq(await vdcRows.locator('.ck-vdc-fact[data-col="image"]').count(), 1)
    await page.keyboard.press("Escape")

    // Rows are compact only: no toggle, the scope pinned, the cell padding
    // on its scale. Page size is the kit's; the pager is the table's own (#39).
    eq(await order.locator(".ck-order-density").count(), 0, "the Compact/Comfortable toggle is gone")
    const scope = order.locator(".ck-order-density-scope")
    eq(await scope.getAttribute("data-density"), "compact")
    eq(await scope.evaluate((el) => getComputedStyle(el).getPropertyValue("--density-scale").trim()), "0.875")
    const compactPad = await style(vmRows.first().locator("td").first(), "paddingTop")
    near(parseFloat(compactPad), 0.4375 * 16 * 0.875, 0.05, `compact rows pad ${compactPad}`)
    // Counter: the padding follows the scale rather than being a literal —
    // a comfortable scope pads more — so compact is the pinned choice.
    const comfortablePad = await scope.evaluate((el) => {
      el.dataset.density = "comfortable"
      const p = getComputedStyle(el.querySelector('tr[data-row="vm"] td')).paddingTop
      el.dataset.density = "compact"
      return p
    })
    eq(parseFloat(comfortablePad) > parseFloat(compactPad), true, `comfortable would pad ${comfortablePad}, compact pads ${compactPad}`)
    const pageSize = order.locator(".ck-order-pager .ck-page-size select")
    eq(await pageSize.inputValue(), "25")
    await pageSize.selectOption("10")
    eq(await pageSize.inputValue(), "10")
    eq(/^1–\d+ of \d+ rows$/.test(await order.locator(".ck-order-pager-range").textContent()), true, await order.locator(".ck-order-pager-range").textContent())
    eq(await order.locator('.ck-order-pages [aria-current="page"]').count(), 1, "page 1 is current")
    // The pager is one row, left to right: page size, the range, the pages
    // ending at the card's edge (the defect: the pages wrapped, centred).
    const [sizeBox, rangeBox, pagesBox, pagerBox] = await Promise.all([".ck-page-size", ".ck-order-pager-range", ".ck-order-pages", ".ck-order-pager"].map((s) => rect(order.locator(s))))
    near(sizeBox.top + sizeBox.height / 2, pagesBox.top + pagesBox.height / 2, 2, "page size and pages share a row")
    eq(rangeBox.left > sizeBox.right && pagesBox.left > rangeBox.right, true, "size, range, pages, left to right")
    near(pagesBox.right, pagerBox.right, 1, "the pages end the row")
    // Precondition: the kit still centres a full-width pagination, so the
    // row is this page's override, and it has to outrank the kit's rule.
    eq(
      await page.evaluate(() =>
        [...document.styleSheets].some((s) => {
          try {
            return [...s.cssRules].some((r) => r.selectorText === ".pagination" && r.style.width === "100%")
          } catch {
            return false
          }
        })
      ),
      true,
      "the kit's full-width .pagination rule is loaded"
    )

    // Add VM starts from the last machine's key, so it is pasted once.
    const addVdc = order.locator(".ck-order-add-vdc")
    eq(await addVdc.textContent(), "Add vDC")
    await order.locator(".ck-order-add-vm").click()
    await accessDialog.waitFor()
    eq(await accessDialog.locator(".ck-order-key").inputValue(), SSH_KEY, "the new machine starts from vm-01's key")
    await accessDialog.locator(".ck-access-confirm").click()
    await noneLeft(".ck-access-dialog")
    await vmRows.nth(1).waitFor()
    eq(await vdcRows.locator(".data-table-group-count").textContent(), "2")
    eq(await vmRows.nth(1).locator('input[aria-label^="Name of"]').inputValue(), "vm-02")

    // Each machine's access is its own, in its row menu: vm-02 moves to a
    // username and password, which say why they are refused, and vm-01
    // keeps its key.
    const menu = page.locator('.dropdown-menu[data-state="open"]')
    await order.locator('[aria-label="Actions for vm-02"]').click()
    eq(await texts(menu.locator(".dropdown-menu-item")), "Settings | Access… | Duplicate | Remove")
    await menu.locator(".dropdown-menu-item", { hasText: "Access" }).click()
    await accessDialog.waitFor()
    eq(await accessDialog.locator(".dialog-title").textContent(), "Access to vm-02")
    eq(await accessDialog.locator(".ck-access-confirm").textContent(), "Save")
    eq(await accessDialog.locator('.ck-order-error[data-field="access"]').count(), 0, "a sound key shows no problem")
    const methods = accessDialog.locator('.ck-segments[aria-label="Access method"] .toggle-group-item')
    eq(await texts(methods), "SSH key | Username and password")
    await methods.filter({ hasText: "Username and password" }).click()
    const username = accessDialog.locator("#ck-order-username")
    const password = accessDialog.locator("#ck-order-password")
    await username.waitFor()
    eq(await username.inputValue(), "admin", "a username to start from")
    eq(await password.getAttribute("type"), "password")
    await username.fill("Bad User")
    await password.fill("correct-horse-battery")
    await accessDialog.locator(".ck-access-confirm").click()
    await accessDialog.locator('.ck-order-error[data-field="access"]', { hasText: "A username of lower-case letters" }).waitFor()
    eq(await username.getAttribute("aria-invalid"), "true")
    await username.fill("deploy")
    await password.fill("short")
    await accessDialog.locator(".ck-access-confirm").click()
    await accessDialog.locator('.ck-order-error[data-field="access"]', { hasText: "Twelve characters at least." }).waitFor()
    eq(await password.getAttribute("aria-invalid"), "true")
    eq(await accessDialog.count(), 1, "Save refuses it")
    await methods.filter({ hasText: "SSH key" }).click()
    eq(await accessDialog.locator(".ck-order-key").inputValue(), SSH_KEY, "the key was kept behind the switch")
    await methods.filter({ hasText: "Username and password" }).click()
    eq(await username.inputValue(), "deploy", "and the login behind the other")
    await password.fill("correct-horse-battery")
    await accessDialog.locator(".ck-access-confirm").click()
    await noneLeft(".ck-access-dialog")
    await order.locator('[aria-label="Actions for vm-02"]').click()
    await menu.locator(".dropdown-menu-item", { hasText: "Access" }).click()
    await accessDialog.waitFor()
    eq(await accessDialog.locator('.toggle-group-item[data-state="on"]').textContent(), "Username and password", "vm-02 kept its login")
    eq(await username.inputValue(), "deploy")
    await page.keyboard.press("Escape")
    await noneLeft(".ck-access-dialog")
    await order.locator('[aria-label="Actions for vm-01"]').click()
    await menu.locator(".dropdown-menu-item", { hasText: "Access" }).click()
    await accessDialog.waitFor()
    eq(await accessDialog.locator(".dialog-title").textContent(), "Access to vm-01")
    eq(await accessDialog.locator(".ck-order-key").inputValue(), SSH_KEY, "vm-01 kept its key")
    await page.keyboard.press("Escape")
    await noneLeft(".ck-access-dialog")

    // A row's chevron opens its settings under it.
    const expand = vmRows.first().locator(".ck-vm-expand")
    eq(await expand.getAttribute("aria-expanded"), "false")
    await expand.click()
    const detail = table.locator(".ck-vm-detail")
    await detail.waitFor()
    eq(await texts(detail.locator(".field-label")), "Public IP1 address | Nightly backup | Start after create")
    eq(await texts(detail.locator(".ck-segments .toggle-group-item")), "Tier 2 | Tier 3 | Tier 4")
    await detail.locator("#vm-1-ip").click()
    eq(await detail.locator("#vm-1-ip").getAttribute("data-state"), "checked")
    await expand.click()
    eq(await table.locator(".ck-vm-detail").count(), 0, "the chevron folds it away again")

    // The (…) menu and the right-click menu share their entries (#38).
    await order.locator('[aria-label="Actions for vm-02"]').click()
    await menu.locator(".dropdown-menu-item", { hasText: "Duplicate" }).click()
    await vmRows.nth(2).waitFor()
    eq(await vmRows.nth(2).locator('input[aria-label^="Name of"]').inputValue(), "vm-03")
    await vmRows.nth(2).locator(".ck-vm-price").click({ button: "right" })
    await context.waitFor()
    eq(await context.locator(".ck-context-label code").textContent(), "vm-03")
    eq(await texts(context.locator(".dropdown-menu-item")), "Settings | Access… | Duplicate | Remove")
    await context.locator(".dropdown-menu-item.ck-menu-danger").click()
    await page.waitForFunction(() => document.querySelectorAll('.ck-order-table tr[data-row="vm"]').length === 2)
    await vdcRows.first().locator('.ck-vdc-fact[data-col="size"]').click({ button: "right" })
    await context.waitFor()
    eq(await context.locator(".ck-context-label code").textContent(), "vdc-01")
    eq(await texts(context.locator(".dropdown-menu-item")), "Add to order | Add virtual machine | Duplicate")
    await context.locator(".dropdown-menu-item", { hasText: "Add virtual machine" }).click()
    await accessDialog.waitFor()
    eq(await accessDialog.locator("#ck-order-username").inputValue(), "deploy", "the dialog starts from the vDC's last machine, vm-02")
    await accessDialog.locator(".ck-access-confirm").click()
    await noneLeft(".ck-access-dialog")
    await vmRows.nth(2).waitFor()
    await order.locator('[aria-label="Actions for vm-04"]').click()
    await menu.locator(".dropdown-menu-item.ck-menu-danger").click()
    await page.waitForFunction(() => document.querySelectorAll('.ck-order-table tr[data-row="vm"]').length === 2)

    // A valid draft joins the order and the form holds a new draft.
    await addVdc.click()
    await toastWith("vdc-01 added to the order")
    await vdcRows.nth(1).waitFor()
    eq(await texts(vdcRows.locator(".data-table-group-label")), "vdc-01 | vdc-02")
    eq(await texts(vdcRows.locator(".badge")), "Draft", "only the new draft wears a badge")
    eq(await vdcRows.nth(1).locator(".badge").count(), 1)
    eq(await texts(vdcRows.locator(".data-table-group-count")), "2 | 0", "vdc-01 kept both machines; the new draft starts empty")
    eq(await emptyRows.getAttribute("data-id"), "vdc-2")
    eq(await order.locator(".ck-order-total-order strong").textContent(), "$1,210.00/mo")
    const summary = await order.locator(".ck-order-total-order .ck-option-desc").textContent()
    eq(/^2 vDCs, 1 in order · \$[\d,]+\.\d{2}\/mo with tax$/.test(summary), true, summary)
    eq(await draftName.textContent(), "vdc-02")

    // Edit adopts a committed vDC; while it is out, nothing deploys.
    await order.locator('[aria-label="Actions for vdc-01"]').click()
    eq(await texts(menu.locator(".dropdown-menu-item")), "Edit | Add virtual machine | Duplicate | Remove from order")
    await menu.locator(".dropdown-menu-item", { hasText: "Edit" }).click()
    await vdcRows.locator(".badge", { hasText: "Editing" }).waitFor()
    eq(await draftName.textContent(), "vdc-01")
    eq(await addVdc.textContent(), "Add back to order")
    await goTab("Checkout", "checkout")
    eq(await order.locator(".ck-order-deploy-reason").textContent(), "vdc-01 is out of the order while you edit it; add it back first.")
    eq(await cta.isDisabled(), true)
    await addVdc.click()
    await toastWith("vdc-01 added to the order")
    await vdcRows.nth(2).waitFor()
    eq(await texts(vdcRows.locator(".data-table-group-label")), "vdc-01 | vdc-02 | vdc-03", "groups order by vDC, so the edited one keeps its place")
    await order.locator('[aria-label="Actions for vdc-02"]').click()
    await menu.locator(".dropdown-menu-item.ck-menu-danger").click()
    await page.waitForFunction(() => document.querySelectorAll('.ck-order-table tr[data-row="vdc"]').length === 2)
    await order.locator('[aria-label="Actions for vdc-01"]').click()
    await menu.locator(".dropdown-menu-item", { hasText: "Duplicate" }).click()
    await vdcRows.nth(2).waitFor()
    eq(await texts(vdcRows.locator(".data-table-group-label")), "vdc-01 | vdc-03 | vdc-04")
    eq(await texts(vdcRows.locator(".data-table-group-count")), "2 | 0 | 2", "the copy took both machines")
    eq(await order.locator(".ck-order-total-order strong").textContent(), "$1,815.00/mo")

    // The last machine can go too: the vDC stays, empty.
    for (const name of ["vm-05", "vm-06"]) {
      await order.locator(`[aria-label="Actions for ${name}"]`).click()
      await menu.locator(".dropdown-menu-item.ck-menu-danger").click()
      await noneLeft(`.ck-order-table input[aria-label="Name of ${name}"]`)
    }
    await table.locator('tr[data-row="empty"][data-id="vdc-4"]').waitFor()
    eq(await texts(vdcRows.locator(".data-table-group-count")), "2 | 0 | 0")
    eq(await vdcRows.count(), 3, "both empty vDCs keep their rows")
  })

  await test("the pools follow the machines: a count that outgrows them grows them to the step that fits, and they never shrink back", async () => {
    await reset()
    await addVm()
    const table = order.locator(".ck-order-table")
    const size = table.locator('tr[data-row="vdc"] .ck-vdc-fact[data-col="size"]')
    const count = table.locator('tr[data-row="vm"]').first().locator('input[aria-label^="Count of"]')
    eq(await size.textContent(), "20 GHz · 64 GB · 750 GB")
    // 11 × standard-2 draws 22 GHz and 44 GB: CPU grows to the 2 GHz step
    // that fits, RAM still fits, and nothing is an error.
    await count.fill("11")
    await table.locator('.ck-vdc-fact[data-col="size"]', { hasText: "22 GHz" }).waitFor()
    eq(await size.textContent(), "22 GHz · 64 GB · 750 GB")
    await order.locator(".ck-order-total-card .ck-order-total-live", { hasText: "$609.00" }).waitFor()
    eq(await order.locator(".ck-order-issues").count(), 0, "no overdraw to report")
    eq(await order.locator(".ck-order-step-flag").count(), 0)
    // 20 machines draw 40 GHz and 80 GB: both pools grow, RAM to its 8 GB step.
    await count.fill("20")
    await table.locator('.ck-vdc-fact[data-col="size"]', { hasText: "40 GHz · 80 GB" }).waitFor()
    await order.locator(".ck-order-total-card .ck-order-total-live", { hasText: "$765.00" }).waitFor()
    // Back to one machine: the pools keep the headroom they grew into.
    await count.fill("1")
    await table.locator('tr[data-row="vm"] .ck-vm-price .ck-hint', { hasText: "$34.00/mo" }).waitFor()
    eq(await size.textContent(), "40 GHz · 80 GB · 750 GB", "the pools do not shrink")
    eq(await total.textContent(), "$765.00")
  })

  await test("the receipt scrolls once its lines outgrow the card, and not before", async () => {
    // The cap is min(100vh - 1rem, 40rem); the default receipt alone is
    // ~560px, so the viewport must clear that or the counter-precondition
    // below is false on any ordinary laptop height. 1000px puts the cap
    // at 40rem, and the card must still end inside the viewport.
    await page.setViewportSize({ width: 1280, height: 1000 })
    await reset()
    await goTab("Backup & DR", "bcdr")
    await order.locator('[data-section="protection"] .ck-option', { hasText: "Hot standby" }).click()
    await order.locator("#ck-order-backups").click()
    await goTab("Add-ons", "addons")
    await order.locator("#ck-addon-vpn").click()
    await order.locator("#ck-addon-ddos").click()
    await order.locator("#ck-addon-lb").click()
    await goTab("Checkout", "checkout")
    await glow.click()
    const card = page.locator(".ck-order-receipt-card:popover-open")
    await card.waitFor()
    eq(await style(card, "overflowY"), "auto")
    const [scrollHeight, clientHeight] = await card.evaluate((el) => [el.scrollHeight, el.clientHeight])
    eq(scrollHeight > clientHeight, true, `with protection, backups and three add-ons the receipt (${scrollHeight}px) should outgrow the 40rem cap (${clientHeight}px)`)
    near(clientHeight, 640, 2, "the cap is 40rem here, not the viewport")
    const tallBox = await rect(card)
    eq(tallBox.bottom <= 1000 - 8 && tallBox.top >= 8, true, `the bottom is never cut off (${tallBox.top}–${tallBox.bottom} in 1000)`)
    await card.evaluate((el) => {
      el.scrollTop = el.scrollHeight
    })
    eq(await card.evaluate((el) => el.scrollTop), scrollHeight - clientHeight, "the card itself scrolled, to its own end, not the page")
    eq(await card.evaluate((el) => el.matches(":popover-open")), true, "scrolling inside keeps it open")
    await page.keyboard.press("Escape")

    // Counter: the default order's shorter receipt does not need to scroll.
    await reset()
    await goTab("Checkout", "checkout")
    await glow.click()
    const shortCard = page.locator(".ck-order-receipt-card:popover-open")
    await shortCard.waitFor()
    const [sh, ch] = await shortCard.evaluate((el) => [el.scrollHeight, el.clientHeight])
    eq(sh, ch, "the default order's receipt fits without scrolling, so the cap is not always biting")
    await page.keyboard.press("Escape")
    await page.setViewportSize({ width: 1280, height: 720 })
  })

  await test("exactly one CTA per step: Continue at the strip's end, and Checkout's is the deploy button with its summary in the foot", async () => {
    await reset()
    for (const [id, label] of STEP_LIST) {
      if (id !== "location") await goTab(label, id)
      eq(await cta.count(), 1, `${id} carries exactly one CTA`)
      eq(await order.locator(".ck-order-continue, .ck-order-cta").count(), 1, `${id}: and no second one anywhere`)
      if (id !== "checkout") eq(await order.locator(".ck-order-foot").count(), 0, `${id}: nothing to fix, so no foot`)
    }
    eq(await order.locator(".ck-order-strip .ck-order-continue").count(), 0, "Checkout's CTA is the deploy button, not Continue")
    eq(await order.locator(".ck-order-foot .ck-order-cta").count(), 1)
    eq(await order.locator(".ck-order-foot .ck-order-deploy-title").count(), 1, "the deploy summary sits in the foot")
    await goTab("Location", "location")
    eq(await order.locator(".ck-order-deploy-title").count(), 0, "the summary is Checkout's only")
  })

  await test("an old export with draft.path still imports, and the store afterwards carries no path key", async () => {
    await reset()
    const legacy = {
      format: 1,
      order: {
        vdcs: [],
        vms: [{ id: "vm-1", vdc: "vdc-1", name: "vm-01", size: "standard-2", image: "Ubuntu 24.04 LTS", count: 1 }],
        draft: {
          id: "vdc-1", name: "legacy-vdc", path: "quick", workload: "general", users: "everywhere", site: "dfw", billing: "monthly",
          image: "Ubuntu 24.04 LTS", cpu: 20, ram: 64, ips: 2, uplink: "10", addons: [],
          access: { method: "ssh", sshKey: SSH_KEY, password: "", script: "" },
          storage: { t1: 500, t2: 250, t3: 0, t4: 0 }, protection: "none", drSite: "slc", drStoragePct: 130, backups: false, retention: "7",
        },
        seq: 1,
        vmSeq: 1,
      },
    }
    const file = join(tmpdir(), `vanillin-legacy-order-${Date.now()}.json`)
    writeFileSync(file, JSON.stringify(legacy))
    await goTab("Checkout", "checkout")
    await order.locator(".ck-order-import-input").setInputFiles(file)
    await toastWith("Order imported")
    eq(await draftName.textContent(), "legacy-vdc", "the legacy order imported despite the path field")
    eq(await page.evaluate(() => JSON.parse(localStorage.getItem("vanillin.order.draft")).order.draft.path), undefined, "path does not survive the round trip")
    // Access lived on the vDC then; it moves onto the machine that had none.
    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("vanillin.order.draft")).order)
    eq(stored.draft.access, undefined, "the vDC carries no access now")
    eq(stored.vms[0].access.sshKey, SSH_KEY, "its machine took the vDC's key")
    eq(stored.vms[0].access.username, "admin", "and the default username beside it")
    eq(await order.locator(".ck-order-issues").count(), 0, "so the machine has a way in")
  })

  await test("an import whose machine has no way in names that machine, and the issue's link opens its access dialog", async () => {
    await reset()
    const keyless = {
      format: 1,
      order: {
        vdcs: [],
        vms: [
          { id: "vm-1", vdc: "vdc-1", name: "web-01", size: "standard-2", image: "Ubuntu 24.04 LTS", count: 1, access: { method: "ssh", sshKey: SSH_KEY } },
          { id: "vm-2", vdc: "vdc-1", name: "db-01", size: "standard-2", image: "Ubuntu 24.04 LTS", count: 1, access: { method: "password", username: "Bad User", password: "long-enough-pass" } },
        ],
        draft: { id: "vdc-1", name: "keyless" },
        seq: 1,
        vmSeq: 2,
      },
    }
    const file = join(tmpdir(), `vanillin-keyless-order-${Date.now()}.json`)
    writeFileSync(file, JSON.stringify(keyless))
    await goTab("Checkout", "checkout")
    await order.locator(".ck-order-import-input").setInputFiles(file)
    await toastWith("Order imported")
    // An import starts untouched; arriving on Checkout shows every issue.
    await goTab("Location", "location")
    await goTab("Checkout", "checkout")
    const issue = order.locator('.ck-order-issue[data-field="access"]')
    await issue.waitFor()
    eq(await issue.textContent(), "db-01: A username of lower-case letters, digits, dashes and underscores, starting with a letter.", "the issue names the machine")
    eq(await tab("Infrastructure").locator(".ck-order-step-flag").textContent(), "1")
    await issue.click()
    await accessDialog.waitFor()
    eq(await panel("checkout").count(), 1, "the step did not change under the dialog")
    eq(await accessDialog.locator(".dialog-title").textContent(), "Access to db-01")
    eq(await accessDialog.locator('.ck-order-error[data-field="access"]').textContent(), "A username of lower-case letters, digits, dashes and underscores, starting with a letter.", "a fix request shows the problem at once")
    eq(await accessDialog.locator("#ck-order-username").getAttribute("aria-invalid"), "true")
    eq(await accessDialog.locator("#ck-order-password").getAttribute("aria-invalid"), null, "the password is not the problem")
    await accessDialog.locator("#ck-order-username").fill("db_admin")
    await accessDialog.locator(".ck-access-confirm").click()
    await noneLeft(".ck-access-dialog")
    await noneLeft('.ck-order-issue[data-field="access"]')
    eq(await order.locator(".ck-order-step-flag").count(), 0)
  })

  await test("checkout: the pinned receipt with tax and Change, JSON and CSV out, JSON back in, the link, the mail, the deploy", async () => {
    await reset()
    await addVm()
    await goTab("Checkout", "checkout")
    eq(await order.locator(".ck-order-step-head").count(), 0)
    eq(await order.locator('[data-section="billing"] .ck-order-hint').count(), 1, "the billing section carries the step's one line")
    eq(await order.locator(".ck-order-gate").count(), 0)
    eq(await order.locator(".ck-receipt--page").count(), 0, "the receipt lives only in the hover card now")
    eq(await cta.textContent(), "Deploy — up to $654.91/mo")
    eq(await cta.isDisabled(), false)
    eq(await order.locator(".ck-order-deploy-title").textContent(), "Deploys vdc-01 at DFW Cage 6")

    // The total says it hovers its receipt: a blue cue under the figure,
    // its chevron pointing left, where the card opens, over the options
    // and inside the viewport. A click pins it; Esc releases it.
    eq(await page.locator(".ck-order-receipt-card:popover-open").count(), 0)
    const cue = glow.locator(".ck-order-total-cue")
    eq(await cue.textContent(), "Itemised receipt")
    eq(await style(cue, "color"), await orderColour("--ck-blue"), "the page's blue for a line that opens something")
    eq(await style(cue, "textDecorationLine"), "underline")
    eq(await style(cue.locator("svg"), "rotate"), "180deg", "the chevron points left")
    const [figureBox, cueBox] = await Promise.all([rect(glow.locator(".ck-order-total-figure")), rect(cue)])
    eq(cueBox.top >= figureBox.bottom - 1, true, "the cue sits under the figure, inside the trigger")
    await glow.hover()
    const card = page.locator(".ck-order-receipt-card:popover-open")
    await card.waitFor()
    eq(await card.locator(".ck-order-unpin").count(), 0)
    const [cardBox, glowBox, viewportHeight] = await Promise.all([rect(card), rect(glow), page.evaluate(() => document.documentElement.clientHeight)])
    eq(await card.getAttribute("data-side"), "left")
    eq(cardBox.right <= glowBox.left, true, `the card opens to the left of the total (${cardBox.right} ≤ ${glowBox.left})`)
    eq(cardBox.top >= 8 && cardBox.bottom <= viewportHeight - 8, true, `and inside the viewport (${cardBox.top}–${cardBox.bottom} in ${viewportHeight})`)
    await glow.click()
    await order.locator(".ck-order-total-glow[data-pinned]").waitFor()
    eq(await glow.getAttribute("aria-pressed"), "true")
    eq(await cue.textContent(), "Receipt pinned")
    await page.mouse.move(0, 0)
    await page.waitForTimeout(300)
    eq(await card.count(), 1, "pinned survives the pointer leaving")
    eq(await card.locator(".ck-order-unpin").textContent(), "Unpin")

    // Itemised, read from the pinned card: group names, one line's
    // monthly, tax, the totals; nothing hourly.
    eq(await texts(card.locator(".ck-receipt-group-name")), "Compute | Network | Storage")
    const line = (id) => card.locator(`[data-line="${id}"]`)
    eq(await line("cpu").locator(".ck-receipt-label").textContent(), "CPU pool20 GHz × $2.00")
    eq(await card.locator(".ck-receipt-hr").count(), 0, "no hourly column")
    eq(await line("cpu").locator(".ck-receipt-amount").textContent(), "$40.00/mo")
    eq(await line("ipv6").locator(".ck-receipt-amount").textContent(), "included")
    eq(await line("storage-t1").locator(".ck-receipt-label").textContent(), "Tier 1 · HDD500 GB × $0.05")
    eq(await card.locator(".ck-receipt-line--sum .ck-receipt-amount").textContent(), "$605.00/mo")
    eq(await line("tax").locator(".ck-receipt-label").textContent(), "Estimated sales taxTX 8.25%")
    eq(await line("tax").locator(".ck-receipt-amount").textContent(), "$49.91/mo")
    eq(await card.locator(".ck-receipt-line--total .ck-receipt-amount").textContent(), "$654.91/mo")
    eq(await card.locator(".ck-receipt-note").count(), 0, "the hour-estimate note is gone with the hourly figures")
    eq(await style(line("cpu"), "display"), "grid")

    // Change jumps to the control that sets the line, and releases the pin.
    await line("ips").locator(".ck-receipt-change").click()
    await panel("infrastructure").waitFor()
    eq(await order.locator('.ck-slider-row[data-field="ips"]').count(), 1)
    await noneLeft(".ck-order-receipt-card:popover-open")
    eq(await order.locator(".ck-order-total-glow[data-pinned]").count(), 0, "Change released the pin too")
    await goTab("Checkout", "checkout")

    // Esc releases a pin without following a Change link.
    await glow.click()
    await order.locator(".ck-order-total-glow[data-pinned]").waitFor()
    await page.keyboard.press("Escape")
    await noneLeft(".ck-order-receipt-card:popover-open")
    eq(await order.locator(".ck-order-total-glow[data-pinned]").count(), 0)

    // JSON out, JSON back in with a change, CSV out.
    const [json] = await Promise.all([page.waitForEvent("download"), order.locator(".ck-order-export-json").click()])
    eq(/^acme-order-\d{4}-\d{2}-\d{2}\.json$/.test(json.suggestedFilename()), true, json.suggestedFilename())
    const saved = JSON.parse(readFileSync(await json.path(), "utf8"))
    eq(saved.format, 1)
    eq(saved.order.draft.name, "vdc-01")
    eq(saved.order.vms.length, 1)
    saved.order.draft.name = "imported-vdc"
    saved.order.draft.cpu = 60
    saved.order.draft.junk = "<script>"
    const edited = join(tmpdir(), `vanillin-order-${Date.now()}.json`)
    writeFileSync(edited, JSON.stringify(saved))
    await order.locator(".ck-order-import-input").setInputFiles(edited)
    await toastWith("Order imported")
    eq(await draftName.textContent(), "imported-vdc")
    eq(await total.textContent(), "$685.00", "60 GHz at $2 replaced 20")
    eq(await page.evaluate(() => JSON.parse(localStorage.getItem("vanillin.order.draft")).order.draft.junk), undefined, "unknown fields drop on the way in")
    const [csv] = await Promise.all([page.waitForEvent("download"), order.locator(".ck-order-export-csv").click()])
    eq(/\.csv$/.test(csv.suggestedFilename()), true)
    const rows = readFileSync(await csv.path(), "utf8").trim().split("\r\n")
    eq(rows[0], "kind,vdc,name,site,cpu_ghz,ram_gb,storage_gb,protection,image,size,count,monthly_usd")
    eq(rows[1], "vdc,imported-vdc,imported-vdc,DFW Cage 6,60,64,750,None,Ubuntu 24.04 LTS,,1,685.00", "monthly closes the row: no hourly column")
    eq(rows.length, 3, "one vDC row and one machine row")

    // Copy link writes the order into the hash; mail carries the summary.
    eq(await page.evaluate(() => window.location.hash), "#order", "the hash is untouched until asked")
    await order.locator(".ck-order-copy-link").click()
    await order.locator(".ck-order-link").waitFor()
    const hash = await page.evaluate(() => window.location.hash)
    eq(hash.startsWith("#order?o="), true, hash.slice(0, 20))
    eq((await order.locator(".ck-order-link .copy-field-value").textContent()).includes("#order?o="), true)
    eq(await panel("checkout").count(), 1, "the route did not change under the hash")
    const mail = await order.locator(".ck-order-email").getAttribute("href")
    eq(mail.startsWith("mailto:?subject="), true)
    eq(decodeURIComponent(mail.slice("mailto:?subject=".length).split("&")[0]), "Acme Cloud order: 1 vDC, $685.00/mo")
    eq(decodeURIComponent(mail.split("&body=")[1]).includes("imported-vdc · DFW Cage 6 · 60 GHz · 64 GB · 750 GB · None — $685.00/mo"), true)

    // The hash wins over the store; the store holds the order between visits.
    await clearStore()
    await arrive(hash)
    eq(await draftName.textContent(), "imported-vdc", "the link restored the order")
    await arrive()
    eq(await draftName.textContent(), "imported-vdc", "the store restored it")
    eq(await panel("location").count(), 1, "arrival is on Location")

    // Deploy: five stages, then the ways in and the payload.
    await goTab("Checkout", "checkout")
    await cta.click()
    const provision = order.locator(".ck-order-provision")
    await provision.waitFor()
    eq(await provision.getAttribute("data-state"), "running")
    eq(await texts(provision.locator(".ck-order-stages li")), "Reserving capacity | Carving the pools | Attaching the network edge | Writing images | Booting machines")
    eq(await provision.locator('.ck-order-stages li[data-state="running"]').count(), 1)
    eq(await cta.isDisabled(), true, "the foot's Deploy is spent")
    await order.locator('.ck-order-provision[data-state="done"]').waitFor({ timeout: 8000 })
    eq(await provision.locator(".ck-order-provision-title").textContent(), "Deployed 1 vDC · $685.00/mo")
    eq(await provision.locator('.ck-order-stages li[data-state="done"]').count(), 5)
    const output = provision.locator('.ck-order-output[data-vdc="imported-vdc"]')
    eq(await output.count(), 1)
    eq(await texts(output.locator(".copy-field-label")), "SSH | Public IPv4 | Console")
    eq(await texts(output.locator(".copy-field-value")), "ssh ubuntu@203.0.113.10 | 203.0.113.10 | #console#vdc/imported-vdc")
    await provision.locator('[data-disclosure="api-payload"] .ck-disclosure-trigger').click()
    await provision.locator(".ck-order-payload-body").waitFor()
    const payload = JSON.parse(await provision.locator(".ck-order-payload-body").textContent())
    eq(payload.vdcs[0].name, "imported-vdc")
    eq(payload.vdcs[0].cpu_ghz, 60)
    eq(payload.vdcs[0].machines.length, 1)
    await provision.locator(".ck-order-footer .btn", { hasText: "Start another order" }).click()
    await panel("location").waitFor()
    eq(await draftName.textContent(), "vdc-01")
    eq(await total.textContent(), "$605.00")
  })

  await test("arriving at #order from #console lays out as a fresh load does, though the kit's sheets then load after console.css", async () => {
    // Every kit override in console.css wins on specificity, never on
    // source order: a bare .ck-x rule once flipped between the two routes
    // and ran a control under the table on this one alone.
    const sample = () =>
      page.evaluate(() => {
        const g = (s, p) => getComputedStyle(document.querySelector(s))[p]
        return {
          steps: [g(".ck-order-steps", "width"), g(".ck-order-strip", "borderBottomWidth"), g(".ck-order-steps", "borderTopLeftRadius"), g(".ck-order-step", "paddingTop"), g(".ck-order-step", "height"), g(".ck-order-step-mark", "width"), g(".ck-order-step-rule", "height")].join("|"),
          aside: [g(".ck-order-aside", "position"), g(".ck-order-total-card", "flexGrow"), g(".ck-order-total-body", "justifyContent")].join("|"),
          sites: [g(".ck-sites", "display"), g(".ck-sites", "rowGap")].join("|"),
          site: [g(".ck-site", "paddingTop"), g(".ck-site-body", "paddingTop")].join("|"),
          mark: [g(".ck-site-mark", "width"), g(".ck-site-mark", "borderTopLeftRadius")].join("|"),
          menubar: [g(".ck-order-menubar-trigger", "fontSize"), g(".ck-order-menubar-trigger", "columnGap")].join("|"),
          search: g(".ck-order-search-input", "fontSize"),
          pages: [g(".ck-order-pages", "width"), g(".ck-order-pages", "marginLeft")].join("|"),
          card: [g(".ck-order-card", "paddingTop"), g(".ck-order-card-head", "display"), g(".ck-order-card-body", "paddingLeft")].join("|"),
        }
      })
    const sheetOrder = () =>
      page.evaluate(() => {
        const ids = [...document.querySelectorAll("style[data-vite-dev-id]")].map((s) => s.dataset.viteDevId)
        const at = (tail) => ids.findIndex((id) => id.endsWith(tail))
        return { console: at("/site/showcase/console.css"), radio: at("/ui/radio-group/radio-group.css"), pagination: at("/ui/pagination/pagination.css"), menubar: at("/ui/menubar/menubar.css") }
      })
    await reset()
    const fresh = await sample()
    const freshOrder = await sheetOrder()
    eq(freshOrder.console > 0, true, "console.css is a dev style tag")
    eq(freshOrder.radio < freshOrder.console && freshOrder.pagination < freshOrder.console && freshOrder.menubar < freshOrder.console, true, `a fresh load puts the kit's sheets before console.css (${JSON.stringify(freshOrder)})`)

    // The same SPA, a hash change from the console, no reload.
    await page.goto("about:blank")
    await page.goto(`${baseUrl}/#console`)
    await page.waitForSelector('.ck-console[data-pg="console"]')
    await page.evaluate(() => {
      window.location.hash = "#order"
    })
    await page.waitForSelector('.ck-console[data-pg="order"] .ck-order')
    const fromConsole = await sheetOrder()
    eq(fromConsole.radio > fromConsole.console && fromConsole.pagination > fromConsole.console && fromConsole.menubar > fromConsole.console, true, `arriving from the console loads the order's kit sheets after console.css (${JSON.stringify(fromConsole)})`)
    const later = await sample()
    for (const key of Object.keys(fresh)) eq(later[key], fresh[key], `${key} reads the same either way`)
    const [stripBox, bodyBox] = await Promise.all([rect(order.locator(".ck-order-strip")), rect(order.locator(".ck-order-body"))])
    near(stripBox.width, bodyBox.width, 2, "the strip spans both columns on this route too")
  })

  await test("deleted surface stays deleted, anywhere on the page", async () => {
    await reset()
    const gone = ".ck-order-cart, .ck-order-rail, .ck-order-mobile, .ck-order-tabs, .ck-path, .ck-workload, .ck-order-skip, .ck-order-side, .ck-receipt--page, [data-path], .ck-order-density, .ck-order-toolbar-left, .ck-order-toolbar-right, .ck-vdc-facts, .ck-users, .ck-recommendation, .ck-software, .ck-option-price, [data-section=\"software\"], [data-section=\"access\"], .ck-plan--custom, .ck-network-facts, .ck-order-step-num, [data-disclosure=\"compare-sites\"], .ck-order-foot .ck-order-continue, .ck-order-step-head, .ck-order-step-title, .ck-order-card-title, [data-disclosure=\"advanced-network\"], .ck-order-head-actions, .ck-order-theme, .ck-order .mode-toggle"
    eq(await frame.locator(gone).count(), 0, "none of the deleted hooks remain")
    eq(await frame.locator("h2").count(), 0, "the page still carries no h2; sections are h5")
  })

  // The suites share one page: leave the next one a clean store on #order.
  await clearStore()
  await arrive()
}
