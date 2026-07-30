export default async function run({ page, baseUrl, test, eq, near }) {
  await page.goto(`${baseUrl}/#switch`)
  await page.waitForSelector(".switch")

  const airplane = page.locator("#airplane-mode")

  await test("initial state: unchecked with switch role", async () => {
    eq(await airplane.getAttribute("role"), "switch")
    eq(await airplane.getAttribute("aria-checked"), "false")
    eq(await airplane.getAttribute("data-state"), "unchecked")
  })

  await test("click toggles checked", async () => {
    eq(await airplane.getAttribute("data-state"), "unchecked")
    await airplane.click()
    eq(await airplane.getAttribute("aria-checked"), "true")
    eq(await airplane.getAttribute("data-state"), "checked")
    await airplane.click()
    eq(await airplane.getAttribute("aria-checked"), "false")
    eq(await airplane.getAttribute("data-state"), "unchecked")
  })

  await test("defaultChecked starts checked", async () => {
    const checked = page.locator('[aria-label="Checked by default"]')
    eq(await checked.getAttribute("aria-checked"), "true")
    eq(await checked.getAttribute("data-state"), "checked")
  })

  await test("disabled switch cannot be clicked", async () => {
    const disabled = page.locator('[aria-label="Disabled"]')
    eq(await disabled.isDisabled(), true)
    eq(await disabled.getAttribute("data-state"), "unchecked")
  })

  await test("disabled + checked", async () => {
    const dc = page.locator('[aria-label="Disabled checked"]')
    eq(await dc.isDisabled(), true)
    eq(await dc.getAttribute("data-state"), "checked")
  })

  await test("controlled mode syncs label", async () => {
    const sw = page.locator("#notifications")
    const label = page.locator('label[for="notifications"]')
    eq(await sw.getAttribute("data-state"), "checked")
    eq((await label.textContent()).includes("on"), true)
    await sw.click()
    eq(await sw.getAttribute("data-state"), "unchecked")
    eq((await label.textContent()).includes("off"), true)
    await sw.click()
    eq(await sw.getAttribute("data-state"), "checked")
  })

  await test("thumb element is present", async () => {
    eq(await airplane.locator(".switch-thumb").count(), 1)
  })

  const thumbTravel = async (pg) => {
    const track = await page.locator(`[data-pg="${pg}"]`).boundingBox()
    const thumb = await page.locator(`[data-pg="${pg}"] .switch-thumb`).boundingBox()
    return {
      delta: thumb.x + thumb.width / 2 - (track.x + track.width / 2),
      overflowsTrack: thumb.x < track.x - 1 || thumb.x + thumb.width > track.x + track.width + 1,
    }
  }

  await test("checked thumb travel mirrors under rtl and stays in the track", async () => {
    const ltr = await thumbTravel("sw-ltr")
    const rtl = await thumbTravel("sw-rtl")
    eq(ltr.delta > 0, true, "ltr: thumb sits past the track centre")
    eq(rtl.delta < 0, true, "rtl: thumb sits before the track centre")
    near(Math.abs(rtl.delta), Math.abs(ltr.delta), 2, "travel distance mirrored")
    eq(ltr.overflowsTrack, false, "ltr thumb within its track")
    eq(rtl.overflowsTrack, false, "rtl thumb within its track")
  })

  await test("rtl: unchecked thumb starts at the inline start (right edge)", async () => {
    const off = await thumbTravel("sw-rtl-off")
    eq(off.delta > 0, true, "unchecked rtl thumb sits at the right of the track")
    eq(off.overflowsTrack, false, "unchecked rtl thumb within its track")
  })
}
