// CopyField: what lands on the clipboard, what the button is called, and what
// the truncation modes actually paint.
//
// Every assertion here reads an outcome — clipboard contents, accessible name,
// live-region text, laid-out geometry. Nothing inspects the handler.

const ARN = "arn:aws:iam::123456789012:role/console-readonly"
const CONNECTION =
  "postgres://svc_reporting:s3cr3t@db-prod-eu-west-1.internal:5432/analytics"
const SENTINEL = "__clipboard-not-written__"

export default async function run({ page, baseUrl, test, eq }) {
  await page.context().grantPermissions(["clipboard-read", "clipboard-write"], {
    origin: baseUrl,
  })
  await page.goto(`${baseUrl}/#copy-field`)
  await page.locator('[data-pg="cf-default"] .copy-field').waitFor()

  // Seed a sentinel before every copy: a read that matches the value only
  // proves a write happened if the clipboard did not already hold it.
  const seedClipboard = () => page.evaluate((s) => navigator.clipboard.writeText(s), SENTINEL)
  const readClipboard = () => page.evaluate(() => navigator.clipboard.readText())

  const field = (pg) => page.locator(`[data-pg="${pg}"] .copy-field`)
  const copyBtn = (pg) => field(pg).locator(".copy-field-btn")

  // The copied state is a 2000ms JS timeout; wait for the flip, never sleep.
  const named = (pg, want) =>
    page.waitForFunction(
      ([sel, w]) => document.querySelector(sel).getAttribute("aria-label") === w,
      [`[data-pg="${pg}"] .copy-field-btn`, want],
      { timeout: 5000 },
    )

  await test("a click puts the full value on the clipboard", async () => {
    await seedClipboard()
    eq(await readClipboard(), SENTINEL, "precondition: clipboard holds the sentinel")
    eq(await field("cf-default").getAttribute("data-state"), "idle")

    await copyBtn("cf-default").click()
    await named("cf-default", "Copied")
    eq(await readClipboard(), ARN, "the whole value, not the truncated text")
    eq(await field("cf-default").getAttribute("data-state"), "copied")
  })

  await test("the accessible name and the live region flip to copiedLabel and back", async () => {
    // Carried over from the previous test's click, which is the state under test.
    eq(await copyBtn("cf-default").getAttribute("aria-label"), "Copied")
    eq(await field("cf-default").locator(".copy-field-live").textContent(), "Copied")

    await named("cf-default", "Copy")
    eq(await field("cf-default").getAttribute("data-state"), "idle")
    eq(
      await field("cf-default").locator(".copy-field-live").textContent(),
      "",
      "the announcement clears with the copied state",
    )
  })

  await test("the check icon replaces the copy icon only while copied", async () => {
    // The swap is a cross-fade on --motion-fast, so every read here waits for
    // the transition's target; a bare sample catches an in-between frame and
    // the previous test leaves one running (docs/QUIRKS.md).
    const settled = (mod, want) =>
      page.waitForFunction(
        ([sel, w]) => getComputedStyle(document.querySelector(sel)).opacity === w,
        [`[data-pg="cf-default"] .copy-field-icon--${mod}`, want],
        { timeout: 5000 },
      )
    await settled("check", "0")
    await settled("copy", "1")

    await copyBtn("cf-default").click()
    await named("cf-default", "Copied")
    await settled("check", "1")
    await settled("copy", "0")

    await named("cf-default", "Copy")
    await settled("check", "0")
  })

  await test("secret masks the display and still copies the real value", async () => {
    const secret = field("cf-secret")
    eq(await secret.getAttribute("data-secret"), "masked")
    eq(await secret.locator(".copy-field-text").textContent(), "•".repeat(12))
    eq(
      (await secret.locator(".copy-field-value").textContent()).includes("postgres"),
      false,
      "the real value is not in the DOM while masked",
    )

    await seedClipboard()
    await copyBtn("cf-secret").click()
    await named("cf-secret", "Copied Connection string")
    eq(await readClipboard(), CONNECTION, "the credential itself, not the dots")
    await named("cf-secret", "Copy Connection string")
  })

  await test("the reveal toggle swaps data-secret and shows the value", async () => {
    const secret = field("cf-secret")
    const reveal = secret.locator(".copy-field-reveal")
    eq(await reveal.getAttribute("aria-label"), "Reveal Connection string")

    await reveal.click()
    eq(await secret.getAttribute("data-secret"), "revealed")
    eq(await secret.locator(".copy-field-tail").textContent(), CONNECTION.slice(-8))
    eq(await reveal.getAttribute("aria-label"), "Hide Connection string")

    await reveal.click()
    eq(await secret.getAttribute("data-secret"), "masked", "and back again")
    eq(await secret.locator(".copy-field-text").textContent(), "•".repeat(12))
  })

  await test("middle truncation keeps the last 8 characters and ellipsises the head", async () => {
    const middle = field("cf-middle")
    eq(await middle.getAttribute("data-truncate"), "middle")
    eq(await middle.locator(".copy-field-tail").textContent(), ARN.slice(-8))

    const head = await middle.locator(".copy-field-head").evaluate((el) => ({
      scroll: el.scrollWidth,
      client: el.clientWidth,
      overflow: getComputedStyle(el).textOverflow,
    }))
    eq(head.scroll > head.client, true, `head overflows: ${head.scroll} > ${head.client}`)
    eq(head.overflow, "ellipsis")

    // The tail is not merely off-screen too: it is laid out in full.
    const tail = await middle.locator(".copy-field-tail").evaluate((el) => ({
      scroll: el.scrollWidth,
      client: el.clientWidth,
    }))
    eq(tail.scroll <= tail.client, true, `tail is whole: ${tail.scroll} <= ${tail.client}`)
  })

  await test('truncate="end" renders one value span; truncate={false} wraps', async () => {
    const end = field("cf-end")
    eq(await end.getAttribute("data-truncate"), "end")
    eq(await end.locator(".copy-field-value > span").count(), 1, "no head/tail split")
    eq(await end.locator(".copy-field-tail").count(), 0)
    eq(
      await end.locator(".copy-field-text").evaluate((el) => getComputedStyle(el).textOverflow),
      "ellipsis",
    )

    // Counter-precondition: `false` is a different mechanism, not another
    // nowrap. Same string, same 12rem column — it must be taller.
    const wrap = field("cf-wrap")
    eq(await wrap.getAttribute("data-truncate"), "none")
    const heights = await page.evaluate(() => [
      document.querySelector('[data-pg="cf-end"] .copy-field-value').getBoundingClientRect().height,
      document.querySelector('[data-pg="cf-wrap"] .copy-field-value').getBoundingClientRect().height,
    ])
    eq(heights[1] > heights[0], true, `wrapped ${heights[1]} > single-line ${heights[0]}`)
    eq(
      await wrap.locator(".copy-field-text").evaluate((el) => getComputedStyle(el).whiteSpace),
      "normal",
    )
  })

  await test("the value stays LTR", async () => {
    eq(await field("cf-default").locator(".copy-field-value").getAttribute("dir"), "ltr")
  })

  await test("onCopy receives the value; copyLabel and copiedLabel replace the names", async () => {
    const count = page.locator('[data-pg="cf-callback-count"]')
    eq(await count.textContent(), "0 copied", "precondition: nothing copied yet")
    eq(await copyBtn("cf-callback").getAttribute("aria-label"), "Copy cluster ID")

    await seedClipboard()
    await copyBtn("cf-callback").click()
    await named("cf-callback", "Cluster ID copied")
    eq(await count.textContent(), "1 copied")
    eq(await readClipboard(), "cluster-7f3a91")
    eq(
      await field("cf-callback").locator(".copy-field-live").textContent(),
      "Cluster ID copied",
    )
    await named("cf-callback", "Copy cluster ID")
  })

  await test("the label joins the copy button's accessible name", async () => {
    eq(await copyBtn("cf-label").getAttribute("aria-label"), "Copy Role ARN")
    eq(await field("cf-label").locator(".copy-field-label").textContent(), "Role ARN")
    // Counter-precondition: without a label the name is copyLabel alone.
    eq(await copyBtn("cf-default").getAttribute("aria-label"), "Copy")
  })
}
