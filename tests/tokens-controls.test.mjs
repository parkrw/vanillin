/*
 * Token integration tests for form-control components (task 34).
 *
 * Verifies:
 * 1. Padding resolves through --space-* so --density-scale moves it.
 * 2. Hover states resolve to opaque colours, not color-mix with transparent.
 */

export default async function run({ page, baseUrl, test, eq }) {
  /* ------------------------------------------------------------------ */
  /* Helper: get computed padding at a given density-scale               */
  /* ------------------------------------------------------------------ */
  async function paddingAt(selector, scale) {
    return page.evaluate(
      ({ sel, s }) => {
        document.documentElement.style.setProperty("--density-scale", String(s));
        // Force style recalc
        const el = document.querySelector(sel);
        if (!el) return null;
        const cs = getComputedStyle(el);
        const result = {
          top: parseFloat(cs.paddingTop),
          right: parseFloat(cs.paddingRight),
          bottom: parseFloat(cs.paddingBottom),
          left: parseFloat(cs.paddingLeft),
        };
        document.documentElement.style.removeProperty("--density-scale");
        return result;
      },
      { sel: selector, s: scale }
    );
  }

  /* ------------------------------------------------------------------ */
  /* Helper: check a colour is opaque (alpha = 1)                       */
  /* ------------------------------------------------------------------ */
  async function isOpaque(colorStr) {
    return page.evaluate((c) => {
      const el = document.createElement("div");
      el.style.backgroundColor = c;
      document.body.appendChild(el);
      const resolved = getComputedStyle(el).backgroundColor;
      el.remove();
      // rgba(r, g, b, a) — if alpha present and < 1, not opaque
      // rgb(r, g, b) — always opaque
      if (resolved.startsWith("rgb(")) return true;
      const match = resolved.match(/[\d.]+/g);
      if (!match || match.length < 4) return true;
      return parseFloat(match[3]) >= 0.99;
    }, colorStr);
  }

  /* ------------------------------------------------------------------ */
  /* Navigate to a page that has buttons, inputs, etc.                  */
  /* ------------------------------------------------------------------ */

  /* ---- Button: padding responds to density-scale ---- */
  await page.goto(`${baseUrl}#button`);
  await page.waitForSelector(".btn--sm");

  await test("button padding scales with --density-scale", async () => {
    const at1 = await paddingAt(".btn", 1);
    const at075 = await paddingAt(".btn", 0.75);
    // Horizontal padding should shrink at lower density
    eq(at075.left < at1.left, true, "btn left padding shrinks at 0.75");
    eq(at075.right < at1.right, true, "btn right padding shrinks at 0.75");
  });

  await test("button--sm padding scales with --density-scale", async () => {
    const at1 = await paddingAt(".btn--sm", 1);
    const at075 = await paddingAt(".btn--sm", 0.75);
    eq(at075.left < at1.left, true, "btn--sm left padding shrinks at 0.75");
  });

  await test("button hover uses opaque colour", async () => {
    const hoverBg = await page.evaluate(() => {
      const style = getComputedStyle(document.documentElement);
      return style.getPropertyValue("--primary-hover").trim();
    });
    eq(await isOpaque(hoverBg), true, "primary-hover is opaque");
  });

  /* ---- Badge ---- */
  await page.goto(`${baseUrl}#badge`);
  await page.waitForSelector(".badge");

  await test("badge padding scales with --density-scale", async () => {
    const at1 = await paddingAt(".badge", 1);
    const at075 = await paddingAt(".badge", 0.75);
    eq(at075.top < at1.top, true, "badge top padding shrinks at 0.75");
    eq(at075.left < at1.left, true, "badge left padding shrinks at 0.75");
  });

  /* ---- Input ---- */
  await page.goto(`${baseUrl}#input`);
  await page.waitForSelector(".input");

  await test("input padding scales with --density-scale", async () => {
    const at1 = await paddingAt(".input", 1);
    const at075 = await paddingAt(".input", 0.75);
    eq(at075.left < at1.left, true, "input left padding shrinks at 0.75");
  });

  /* ---- Textarea ---- */
  await page.goto(`${baseUrl}#textarea`);
  await page.waitForSelector(".textarea");

  await test("textarea padding scales with --density-scale", async () => {
    const at1 = await paddingAt(".textarea", 1);
    const at075 = await paddingAt(".textarea", 0.75);
    eq(at075.top < at1.top, true, "textarea top padding shrinks at 0.75");
    eq(at075.left < at1.left, true, "textarea left padding shrinks at 0.75");
  });

  /* ---- Native select ---- */
  await page.goto(`${baseUrl}#native-select`);
  await page.waitForSelector(".native-select");

  await test("native-select padding scales with --density-scale", async () => {
    const at1 = await paddingAt(".native-select", 1);
    const at075 = await paddingAt(".native-select", 0.75);
    eq(at075.left < at1.left, true, "native-select left padding shrinks at 0.75");
    eq(at075.right < at1.right, true, "native-select right padding shrinks at 0.75");
  });

  /* ---- Field: gap scales ---- */
  await page.goto(`${baseUrl}#field`);
  await page.waitForSelector(".field");

  await test("field gap scales with --density-scale", async () => {
    const gapAt = async (scale) => {
      return page.evaluate((s) => {
        document.documentElement.style.setProperty("--density-scale", String(s));
        const el = document.querySelector(".field");
        const gap = parseFloat(getComputedStyle(el).gap);
        document.documentElement.style.removeProperty("--density-scale");
        return gap;
      }, scale);
    };
    const gap1 = await gapAt(1);
    const gap075 = await gapAt(0.75);
    eq(gap075 < gap1, true, "field gap shrinks at 0.75");
  });

  /* ---- Radio group: gap scales ---- */
  await page.goto(`${baseUrl}#radio-group`);
  await page.waitForSelector(".radio-group");

  await test("radio-group gap scales with --density-scale", async () => {
    const gapAt = async (scale) => {
      return page.evaluate((s) => {
        document.documentElement.style.setProperty("--density-scale", String(s));
        const el = document.querySelector(".radio-group");
        const gap = parseFloat(getComputedStyle(el).gap);
        document.documentElement.style.removeProperty("--density-scale");
        return gap;
      }, scale);
    };
    const gap1 = await gapAt(1);
    const gap075 = await gapAt(0.75);
    eq(gap075 < gap1, true, "radio-group gap shrinks at 0.75");
  });

  /* ---- Derived hover tokens are all opaque ---- */
  await test("all derived hover tokens are opaque", async () => {
    const hovers = await page.evaluate(() => {
      const style = getComputedStyle(document.documentElement);
      return [
        "--primary-hover",
        "--secondary-hover",
        "--destructive-hover",
        "--accent-hover",
        "--muted-hover",
      ].map((name) => ({
        name,
        value: style.getPropertyValue(name).trim(),
      }));
    });
    for (const { name, value } of hovers) {
      eq(await isOpaque(value), true, `${name} is opaque`);
    }
  });
}
