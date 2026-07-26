import { commandScore } from "../lib/command-score.js"
import assert from "node:assert/strict"

let passed = 0
let failed = 0

function test(name, fn) {
  try {
    fn()
    passed++
  } catch (e) {
    failed++
    console.error(`FAIL: ${name}`)
    console.error("  ", e.message)
  }
}

// --- basic matching ---

test("exact match scores 1", () => {
  assert.equal(commandScore("hello", "hello"), 1)
})

test("no match scores 0", () => {
  assert.equal(commandScore("hello", "xyz"), 0)
})

test("empty abbreviation scores 0", () => {
  assert.equal(commandScore("hello", ""), 0)
})

test("empty string scores 0", () => {
  assert.equal(commandScore("", "hello"), 0)
})

// --- case insensitivity ---

test("case-insensitive match scores > 0", () => {
  assert.ok(commandScore("Hello", "hello") > 0)
})

test("exact case scores higher than mismatched case", () => {
  assert.ok(commandScore("HTML", "HM") > commandScore("haml", "HM"))
})

// --- fuzzy scoring order ---

test("prefix match scores higher than mid-word match", () => {
  const prefix = commandScore("calendar", "cal")
  const mid = commandScore("local", "cal")
  assert.ok(prefix > mid, `prefix ${prefix} > mid ${mid}`)
})

test("continuous match beats character jump", () => {
  const continuous = commandScore("abc", "ab")
  const jump = commandScore("axb", "ab")
  assert.ok(continuous > jump, `continuous ${continuous} > jump ${jump}`)
})

test("'gp' ranks 'Git Push' higher than 'Grep'", () => {
  const gitPush = commandScore("Git Push", "gp")
  const grep = commandScore("Grep", "gp")
  assert.ok(gitPush > grep, `Git Push ${gitPush} > Grep ${grep}`)
})

test("word-boundary match scores higher than mid-word", () => {
  const boundary = commandScore("Git Push", "gp")
  const midWord = commandScore("Gripping", "gp")
  assert.ok(boundary > midWord, `boundary ${boundary} > midWord ${midWord}`)
})

// --- aliases / keywords ---

test("aliases extend the searchable text", () => {
  const withAlias = commandScore("Profile", "account", ["account", "me"])
  const without = commandScore("Profile", "account")
  assert.ok(withAlias > without, `with alias ${withAlias} > without ${without}`)
})

// --- transposition ---

test("transposition still matches but scores lower", () => {
  const correct = commandScore("ouch", "uc")
  const transposed = commandScore("curtain", "uc")
  assert.ok(correct > 0 && transposed > 0)
  assert.ok(correct > transposed, `correct ${correct} > transposed ${transposed}`)
})

// --- penalty: not complete ---

test("shorter candidate scores higher for exact prefix", () => {
  const short = commandScore("html", "html")
  const long = commandScore("html5", "html")
  assert.ok(short > long, `short ${short} > long ${long}`)
})

// --- input-length cap ---

test("long input does not throw", () => {
  const longStr = "a".repeat(1000)
  const longAbbr = "a".repeat(500)
  // Should not throw — just truncated and scored.
  const score = commandScore(longStr, longAbbr)
  assert.ok(score >= 0)
})

// --- summary ---

console.log(`\ncommand-score: ${passed} passed, ${failed} failed`)
if (failed > 0) process.exit(1)
