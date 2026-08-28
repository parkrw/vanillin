/**
 * Compatibility floors: the React peer range, the Node engines range, and the
 * README sentences that state them.
 * Named .unit.mjs so the browser test runner ignores it.
 *
 * These are drift guards, not style checks. package.json carried no
 * peerDependencies at all while ui/select, ui/combobox and ui/resizable took
 * `ref` as a plain prop and ui/form imported useActionState — so a React 18
 * install warned about nothing and the refs silently never attached. Each test
 * asserts the coupling still exists before asserting the declaration covers it,
 * so a floor that stops being true fails loudly instead of quietly over-claiming.
 */

import assert from "node:assert/strict"
import { readdirSync, readFileSync, existsSync } from "node:fs"
import { join } from "node:path"
import { fileURLToPath } from "node:url"

const repoRoot = fileURLToPath(new URL("..", import.meta.url))
const pkg = JSON.parse(readFileSync(join(repoRoot, "package.json"), "utf8"))
const readme = readFileSync(join(repoRoot, "README.md"), "utf8")

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

/** Lowest version a range admits, as [major, minor]. Handles ">=x.y" and "^x.y". */
function rangeFloor(range) {
  const m = /^[>^~=\s]*(\d+)(?:\.(\d+))?/.exec(range)
  assert.ok(m, `cannot read a floor out of the range "${range}"`)
  return [Number(m[1]), Number(m[2] ?? 0)]
}

function jsxFiles() {
  return readdirSync(join(repoRoot, "ui"), { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => [d.name, join(repoRoot, "ui", d.name, `${d.name}.jsx`)])
    .filter(([, path]) => existsSync(path))
}

// ── React ───────────────────────────────────────────────────────────

// APIs with no React 18 equivalent. `ref` as a destructured prop is the quiet
// one: on 18 it is an ordinary prop name, so the ref never attaches and nothing
// throws.
const REACT_19_ONLY = [
  [/^\s{2}ref,\s*$/m, "takes `ref` as a plain prop (React 19 ref-as-prop)"],
  [/\buseActionState\b/, "imports useActionState"],
  [/\buseFormStatus\b/, "imports useFormStatus"],
]

test("the React 19 coupling is real, and peerDependencies excludes 18", () => {
  const coupled = []
  for (const [slug, path] of jsxFiles()) {
    const src = readFileSync(path, "utf8")
    for (const [pattern, why] of REACT_19_ONLY) {
      if (pattern.test(src)) coupled.push(`ui/${slug} ${why}`)
    }
  }
  // Precondition. Without this the range check below would pass on a kit that
  // no longer needs 19 at all, over-claiming the floor.
  assert.ok(
    coupled.length > 0,
    "no ui/ component uses a React-19-only API any more — the peer range can drop to >=18, and this test should go with it",
  )

  const peers = pkg.peerDependencies
  assert.ok(peers, "package.json declares no peerDependencies, so a React 18 install warns about nothing")
  for (const name of ["react", "react-dom"]) {
    const range = peers[name]
    assert.ok(range, `peerDependencies is missing "${name}"`)
    // Optional, or npm installs react+react-dom+scheduler into a project that
    // has none — the CLI is Node-stdlib only and must not drag React in. A
    // React 18 project still fails ERESOLVE either way; only this case differs.
    assert.equal(
      pkg.peerDependenciesMeta?.[name]?.optional,
      true,
      `peerDependenciesMeta.${name}.optional is not true, so \`npm i -D vanillin\` pulls React into a project that has none`,
    )
    // Counter-precondition: "*" and ">=18" both satisfy "a range exists".
    const [major] = rangeFloor(range)
    assert.ok(
      major >= 19,
      `peerDependencies.${name} is "${range}", which admits React ${major}. These need 19:\n    ${coupled.join("\n    ")}`,
    )
  }
})

// ── Node ────────────────────────────────────────────────────────────

// Node APIs newer than 18.17, with the release each landed in. `van` is
// stdlib-only and ships to consumers, so one of these makes engines a lie.
const NODE_APIS = [
  [/import\.meta\.(dirname|filename)/, [20, 11]],
  [/\bstyleText\b/, [20, 12]],
  [/\b(Object|Map)\.groupBy\b/, [21, 0]],
  [/\bnavigator\.\w/, [21, 0]],
  [/\bArray\.fromAsync\b/, [22, 0]],
  [/\bPromise\.withResolvers\b/, [22, 0]],
  [/\bglob(Sync)?\s*\(/, [22, 0]],
  [/\bprocess\.getBuiltinModule\b/, [22, 3]],
  [/\bRegExp\.escape\b/, [23, 0]],
]

test("the Node floor is declared, and the CLI stays inside it", () => {
  const range = pkg.engines?.node
  assert.ok(range, 'package.json declares no engines.node — `van` runs on whatever the consumer has')
  const floor = rangeFloor(range)

  const sources = [
    ["bin/van.mjs", join(repoRoot, "bin", "van.mjs")],
    ...readdirSync(join(repoRoot, "scripts"))
      .filter((f) => f.endsWith(".mjs"))
      .map((f) => [`scripts/${f}`, join(repoRoot, "scripts", f)]),
  ]
  // Precondition: an empty or mis-rooted file list would make the scan below
  // pass by finding nothing.
  assert.ok(sources.length > 1, `expected bin/van.mjs plus scripts/*.mjs, found ${sources.length}`)

  for (const [label, path] of sources) {
    const src = readFileSync(path, "utf8")
    for (const [pattern, [major, minor]] of NODE_APIS) {
      if (!pattern.test(src)) continue
      const newer = major > floor[0] || (major === floor[0] && minor > floor[1])
      assert.ok(
        !newer,
        `${label} uses ${pattern.source}, which needs Node ${major}.${minor}, but engines.node is "${range}"`,
      )
    }
  }
})

// ── README ──────────────────────────────────────────────────────────

test("README states both floors, and states the ones package.json declares", () => {
  const [reactMajor] = rangeFloor(pkg.peerDependencies.react)
  const [nodeMajor, nodeMinor] = rangeFloor(pkg.engines.node)

  assert.match(readme, /^## Browser support$/m, "README has no `## Browser support` section")
  assert.match(readme, /^## Cascade & naming$/m, "README has no `## Cascade & naming` section")

  // Counter-precondition: the tagline used to read "Only React is required."
  // with no version, which is exactly the gap this task closed. A section
  // heading alone does not fix that.
  const tagline = readme.split("\n")[2]
  assert.match(
    tagline,
    new RegExp(`React ${reactMajor}`),
    `README's tagline does not name the React floor package.json declares (${reactMajor}):\n    ${tagline}`,
  )
  assert.ok(
    readme.includes(`${nodeMajor}.${nodeMinor}`),
    `README never mentions the Node floor package.json declares (${nodeMajor}.${nodeMinor})`,
  )
  assert.match(readme, /Firefox ESR 115 fails hard/, "the browser section names no browser that fails")
})

console.log(`compat: ${passed} passed, ${failed} failed`)
if (failed) process.exit(1)
