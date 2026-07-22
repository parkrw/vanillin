export default async function run({ page, baseUrl, test, eq }) {
  await page.goto(`${baseUrl}/#progress`)
  await page.waitForSelector(".progress")

  await test("aria + data attrs", async () => {
    const bar = page.locator('.progress[aria-label="A third"]')
    eq(await bar.getAttribute("role"), "progressbar")
    eq(await bar.getAttribute("aria-valuemin"), "0")
    eq(await bar.getAttribute("aria-valuemax"), "100")
    eq(await bar.getAttribute("aria-valuenow"), "33")
    eq(await bar.getAttribute("data-state"), "loading")
  })

  await test("complete state", async () => {
    eq(await page.locator('.progress[aria-label="Complete"]').getAttribute("data-state"), "complete")
  })

  await test("custom max", async () => {
    const bar = page.locator('.progress[aria-label="Custom max"]')
    eq(await bar.getAttribute("aria-valuemax"), "40")
    eq(await bar.getAttribute("aria-valuetext"), "75%")
  })

  await test("indicator transform tracks value", async () => {
    const transform = await page
      .locator('.progress[aria-label="A third"] .progress-indicator')
      .evaluate((el) => el.style.transform)
    eq(transform, "translateX(-67%)")
  })

  await test("animated demo settles at 66", async () => {
    await page.waitForFunction(
      () => document.querySelectorAll(".progress")[0]?.getAttribute("aria-valuenow") === "66",
    )
  })
}
