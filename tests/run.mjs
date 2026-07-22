import { spawn } from "node:child_process"
import { readdirSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { chromium } from "playwright-core"

// Boots the playground on its own port, drives it with the locally
// installed Chrome (no browser download), runs every tests/*.test.mjs.
const PORT = 5199
const baseUrl = `http://localhost:${PORT}`
const repoRoot = fileURLToPath(new URL("..", import.meta.url))

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
  await waitForServer()
  browser = await chromium.launch({ channel: "chrome" })
  const page = await browser.newPage()
  const files = readdirSync(fileURLToPath(new URL(".", import.meta.url)))
    .filter((file) => file.endsWith(".test.mjs"))
    .sort()
  for (const file of files) {
    const label = file.replace(".test.mjs", "")
    const test = async (name, fn) => {
      try {
        await fn()
        results.push(["PASS", `${label}: ${name}`])
      } catch (err) {
        results.push(["FAIL", `${label}: ${name} — ${err.message.split("\n")[0]}`])
      }
    }
    const { default: run } = await import(`./${file}`)
    await run({ page, baseUrl, repoRoot, test, eq, near })
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
