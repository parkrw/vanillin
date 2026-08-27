import { spawn, spawnSync } from "node:child_process"
import { readdirSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { chromium } from "playwright-core"

// Boots the docs site on its own port, drives it with the locally
// installed Chrome (no browser download), runs every tests/*.test.mjs.
//
// Suites select elements by `data-pg="..."` attributes rather than by class,
// so restyling the docs site does not break tests. `pg` is short for
// "playground", the former name of `site/`; the hooks were deliberately not
// renamed (see the header of site/site.css). Read `data-pg` as "docs site".
const PORT = Number(process.env.VANILLIN_TEST_PORT) || 5199
const baseUrl = `http://localhost:${PORT}`
const repoRoot = fileURLToPath(new URL("..", import.meta.url))

// A dev server already on the port would be picked up by waitForServer below
// while `--strictPort` quietly kills ours, so the run would test whatever that
// stranger is serving. Refuse instead of reporting someone else's results.
try {
  await fetch(baseUrl)
  console.error(
    `something is already serving ${baseUrl} — kill it, or set VANILLIN_TEST_PORT to a free port`,
  )
  process.exit(1)
} catch {}

// Spawned as node + vite's own bin, not through `npx`: `vite.kill()` only
// reaches the process we spawned, and killing `npx` leaves its vite grandchild
// holding the port. A leaked server is worse than a crash — the next run's
// `waitForServer` finds it, passes, and silently tests the *previous* config
// (that is what "passed an hour later on identical code" means in
// docs/ISSUES.md G5/G8).
const viteBin = fileURLToPath(new URL("../node_modules/vite/bin/vite.js", import.meta.url))
const vite = spawn(process.execPath, [viteBin, "--port", String(PORT), "--strictPort"], {
  cwd: repoRoot,
  stdio: "ignore",
})

// A vite that dies on startup — busy port, unbindable port, bad config —
// otherwise reads as "dev server did not start" a full 15 seconds later, with
// no exit code to explain it (ISSUES H4). Race the poll against the child so
// the failure arrives at once and names why.
const viteDied = new Promise((_resolve, reject) => {
  vite.on("exit", (code, signal) => {
    reject(new Error(`vite exited before the dev server was ready — code ${code}, signal ${signal}`))
  })
})
// vite.kill() in the finally below makes this reject after the race has already
// settled; swallow that rather than crash a completed run.
viteDied.catch(() => {})

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

const results = []
const eq = (actual, expected, label = "") => {
  if (actual !== expected)
    throw new Error(`${label} expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`)
}
const near = (actual, expected, tolerance, label = "") => {
  if (Math.abs(actual - expected) > tolerance)
    throw new Error(`${label} expected ${expected}±${tolerance}, got ${actual}`)
}

let browser
try {
  await Promise.race([waitForServer(), viteDied])
  // Google Chrome by default (no browser download). CHROME_PATH points the
  // launch at an explicit binary instead, for images that ship only Chromium.
  browser = await chromium.launch(
    process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : { channel: "chrome" },
  )
  const page = await browser.newPage()
  // Optional subset run: `node tests/run.mjs drawer toast` or
  // VANILLIN_TEST_FILTER=drawer,toast. Substring match on the file name.
  // Integration always runs the whole suite — this is for focused work.
  const filters = (process.argv.slice(2).join(",") || process.env.VANILLIN_TEST_FILTER || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)
  const testsDir = fileURLToPath(new URL(".", import.meta.url))
  const matches = (file) => !filters.length || filters.some((filter) => file.includes(filter))
  const files = readdirSync(testsDir)
    .filter((file) => file.endsWith(".test.mjs"))
    .filter(matches)
    .sort()
  const unitFiles = readdirSync(testsDir)
    .filter((file) => file.endsWith(".unit.mjs"))
    .filter(matches)
    .sort()
  if (filters.length && !files.length && !unitFiles.length)
    throw new Error(`no test files match ${filters.join(",")}`)

  // Pure-node suites first, each in its own process (they exit(1) on failure
  // and print their own per-test lines only when something fails here).
  for (const file of unitFiles) {
    const label = file.replace(".unit.mjs", "")
    const r = spawnSync(process.execPath, [testsDir + file], { encoding: "utf8" })
    const tail = (r.stdout || "").trim().split("\n").at(-1) || ""
    if (r.status === 0) {
      results.push(["PASS", tail || `${label}: unit suite`])
    } else {
      if (r.stdout) process.stdout.write(r.stdout)
      if (r.stderr) process.stderr.write(r.stderr)
      results.push(["FAIL", `${label}: unit suite failed — see output above`])
    }
  }
  // The whole suite shares one page for speed (warm HTTP cache, no context
  // churn). That makes per-file state leak downhill in alphabetical order, and
  // it has already cost us two rounds of phantom failures: an injected :root
  // style tag from one file re-themed the next, and mouse-driven tests left the
  // input modality set to "pointer" so programmatic .focus() stopped matching
  // :focus-visible. Both are invisible in a filtered single-file run and only
  // appear in full-suite order, which is the worst way to find them.
  //
  // A real navigation (not a #hash change — the site is an SPA) discards
  // injected tags and resets modality; clearing emulateMedia covers the rest.
  const resetPage = async () => {
    await page.goto("about:blank")
    // colorScheme is pinned, not reset to null (= "inherit the host's"): the
    // site seeds its initial theme from prefers-color-scheme, so leaving this
    // to the machine makes every suite pass or fail depending on whether the
    // developer runs their OS in dark mode. Suites that want dark emulate it
    // or click the toggle themselves.
    await page.emulateMedia({ colorScheme: "light", forcedColors: null, reducedMotion: null })
  }

  for (const file of files) {
    const label = file.replace(".test.mjs", "")
    await resetPage()
    const test = async (name, fn) => {
      try {
        await fn()
        results.push(["PASS", `${label}: ${name}`])
      } catch (err) {
        results.push(["FAIL", `${label}: ${name} — ${err.message.split("\n")[0]}`])
      }
    }
    // A file that throws outside a test() (bad import, blank page, missing
    // default export) must not abort the remaining suites.
    try {
      const { default: run } = await import(`./${file}`)
      if (typeof run !== "function")
        throw new Error("no default export — pure-node tests belong in *.unit.mjs")
      await run({ page, baseUrl, repoRoot, test, eq, near })
    } catch (err) {
      results.push(["FAIL", `${label}: suite aborted — ${err.message.split("\n")[0]}`])
    }
  }
} finally {
  await browser?.close()
  vite.kill()
}

let failed = 0
for (const [status, name] of results) {
  if (status === "FAIL") failed++
  console.log(`${status}  ${name}`)
}
console.log(`\n${results.length - failed}/${results.length} passed`)
process.exit(failed ? 1 : 0)
