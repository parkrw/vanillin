/**
 * The test runner's own exit code.
 * Named .unit.mjs so the browser test runner ignores it.
 *
 * AGENTS.md tells agents to trust a non-zero exit from `npm test`, so the code
 * has to mean what it says in both directions. This runs a byte-for-byte copy
 * of tests/run.mjs over a sandbox holding one probe suite.
 *
 * The sandbox links only the two packages the runner loads, so vite's
 * dependency cache lands in the sandbox rather than in the node_modules the
 * outer run's dev server is using.
 */

import assert from "node:assert/strict"
import { spawnSync } from "node:child_process"
import { copyFileSync, mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from "node:fs"
import { createServer } from "node:net"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { fileURLToPath } from "node:url"

const repoRoot = fileURLToPath(new URL("..", import.meta.url))

let passed = 0
let failed = 0

function test(name, fn) {
  try {
    fn()
    passed++
  } catch (err) {
    failed++
    console.error(`FAIL ${name}\n  ${err.message}`)
  }
}

const freePort = () =>
  new Promise((resolve, reject) => {
    const server = createServer()
    server.once("error", reject)
    server.listen(0, () => {
      const { port } = server.address()
      server.close(() => resolve(port))
    })
  })

async function runProbe(probeSource) {
  const sandbox = mkdtempSync(join(tmpdir(), "vanillin-runner-"))
  try {
    mkdirSync(join(sandbox, "tests"))
    mkdirSync(join(sandbox, "node_modules"))
    for (const pkg of ["vite", "playwright-core"])
      symlinkSync(join(repoRoot, "node_modules", pkg), join(sandbox, "node_modules", pkg))
    copyFileSync(join(repoRoot, "tests", "run.mjs"), join(sandbox, "tests", "run.mjs"))
    writeFileSync(join(sandbox, "index.html"), "<!doctype html><title>probe</title>\n")
    writeFileSync(join(sandbox, "tests", "zzprobe.unit.mjs"), probeSource)
    const r = spawnSync(process.execPath, [join(sandbox, "tests", "run.mjs")], {
      cwd: sandbox,
      encoding: "utf8",
      env: { ...process.env, VANILLIN_TEST_PORT: String(await freePort()) },
      timeout: 60_000,
    })
    return { status: r.status, stdout: r.stdout, stderr: r.stderr }
  } finally {
    rmSync(sandbox, { recursive: true, force: true })
  }
}

const failing = await runProbe('console.log("probe: failing on purpose")\nprocess.exit(1)\n')
const passing = await runProbe('console.log("probe: 1 passed, 0 failed")\n')

test("a failing suite makes the runner exit 1", () => {
  assert.match(failing.stdout, /^FAIL {2}zzprobe/m, `precondition: the probe ran and failed\n${failing.stdout}${failing.stderr}`)
  assert.match(failing.stdout, /^0\/1 passed$/m)
  assert.equal(failing.status, 1)
})

test("an all-passing run exits 0", () => {
  assert.match(passing.stdout, /^PASS {2}probe: 1 passed/m, `precondition: the probe ran and passed\n${passing.stdout}${passing.stderr}`)
  assert.match(passing.stdout, /^1\/1 passed$/m)
  assert.equal(passing.status, 0)
})

console.log(`runner: ${passed} passed, ${failed} failed`)
if (failed) process.exit(1)
