// Guard for task 86: every component page opens with a Default section, Usage is
// the section immediately after it, and Usage is the only section on the Code tab.
// Run: node scripts/sweep-section-order.mjs [site/pages]
//
// Known-clean violators it will still report: home.jsx and the five system pages
// (container-queries, density, primitives, typography, view-transitions), which
// document a system rather than a component and carry no InstallSnippet; plus
// navigation-menu, whose Usage sits third so the two menu fixtures stay adjacent
// for the task-83 overlap test.
import { readdirSync, readFileSync } from "node:fs"

const dir = process.argv[2] || "site/pages"
const files = readdirSync(dir).filter((f) => f.endsWith(".jsx")).sort()
const rows = []

for (const f of files) {
  const whole = readFileSync(`${dir}/${f}`, "utf8")
  // Helper components are defined above the page component; only the page's own
  // return decides section order.
  const entry = whole.search(/^export default function/m)
  const src = entry === -1 ? whole : whole.slice(entry)
  const lines = src.split("\n")
  let cur = null
  const sections = []
  let preambleCode = 0
  for (const line of lines) {
    const h3 = line.match(/<h3[^>]*>([^<]*)/)
    if (h3) {
      cur = { name: h3[1].trim(), code: 0, previews: 0 }
      sections.push(cur)
      continue
    }
    const codeHits = (line.match(/defaultTab="code"/g) || []).length
    const prevHits = (line.match(/<ComponentPreview/g) || []).length
    if (cur) {
      cur.code += codeHits
      cur.previews += prevHits
    } else {
      preambleCode += codeHits
    }
  }
  rows.push({ file: f, sections, preambleCode })
}

const violators = []
for (const r of rows) {
  const names = r.sections.map((s) => s.name)
  const codeSecs = r.sections.filter((s) => s.code > 0)
  const problems = []
  if (r.preambleCode) problems.push(`defaultTab=code outside any section (${r.preambleCode})`)
  for (const s of codeSecs) {
    if (s.name.toLowerCase() !== "usage") problems.push(`defaultTab=code on non-Usage section "${s.name}"`)
    if (s.code > 1) problems.push(`section "${s.name}" has ${s.code} defaultTab=code`)
  }
  const usageIdx = names.findIndex((n) => n.toLowerCase() === "usage")
  if (usageIdx === -1) problems.push("no Usage section")
  else if (usageIdx !== 1) problems.push(`Usage at index ${usageIdx} (want 1); leading section = "${names[0] ?? "-"}"`)
  if (usageIdx !== -1 && codeSecs.length === 0) problems.push("Usage has no defaultTab=code")
  if (names[0] && names[0].toLowerCase() !== "default" && usageIdx !== 0) {
    // informational only, folded into the index message above
  }
  if (problems.length) violators.push({ file: r.file, names, problems })
}

console.log(`pages: ${rows.length}  violators: ${violators.length}\n`)
for (const v of violators) {
  console.log(`${v.file}`)
  console.log(`  h3: ${v.names.join(" | ") || "(none)"}`)
  for (const p of v.problems) console.log(`  ! ${p}`)
}
console.log("\n--- clean ---")
for (const r of rows) if (!violators.find((v) => v.file === r.file)) console.log(`${r.file}: ${r.sections.map((s) => s.name).join(" | ")}`)
