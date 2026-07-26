/**
 * Pure-node tests for lib/schema.js.
 * Named .unit.mjs so the browser test runner ignores it.
 */

import assert from "node:assert/strict"
import { s, SchemaError } from "../lib/schema.js"

let passed = 0
let failed = 0
const tests = []

function test(name, fn) {
  tests.push([name, fn])
}

// ---------------------------------------------------------------------------
// safeParse / parse
// ---------------------------------------------------------------------------

test("safeParse success shape", () => {
  const r = s.string().safeParse("hi")
  assert.deepEqual(r, { success: true, data: "hi" })
})

test("safeParse failure shape", () => {
  const r = s.string().safeParse(42)
  assert.equal(r.success, false)
  assert.ok(r.error instanceof SchemaError)
  assert.equal(r.error.issues.length, 1)
  const issue = r.error.issues[0]
  assert.equal(issue.path, "")
  assert.equal(issue.code, "invalid_type")
  assert.equal(issue.message, "Expected string, received number")
})

test("parse returns the value", () => {
  assert.equal(s.number().parse(7), 7)
})

test("parse throws SchemaError carrying issues", () => {
  assert.throws(
    () => s.number().parse("7"),
    (e) => e instanceof SchemaError && e.issues[0].code === "invalid_type"
  )
})

// ---------------------------------------------------------------------------
// string / number / boolean — no implicit coercion
// ---------------------------------------------------------------------------

test("string accepts empty string", () => {
  assert.ok(s.string().safeParse("").success)
})

test("string rejects null and undefined with received type", () => {
  assert.equal(s.string().safeParse(null).error.issues[0].message, "Expected string, received null")
  assert.equal(s.string().safeParse(undefined).error.issues[0].message, "Expected string, received undefined")
})

test('number rejects the string "42" (coercion is opt-in)', () => {
  assert.equal(s.number().safeParse("42").success, false)
})

test("number rejects NaN and Infinity", () => {
  assert.equal(s.number().safeParse(NaN).success, false)
  assert.equal(s.number().safeParse(Infinity).success, false)
})

test("number accepts 0 and negatives", () => {
  assert.ok(s.number().safeParse(0).success)
  assert.ok(s.number().safeParse(-3.5).success)
})

test("boolean accepts only real booleans", () => {
  assert.ok(s.boolean().safeParse(false).success)
  assert.equal(s.boolean().safeParse("true").success, false)
  assert.equal(s.boolean().safeParse(1).success, false)
})

// ---------------------------------------------------------------------------
// date
// ---------------------------------------------------------------------------

test("date accepts a valid Date", () => {
  const d = new Date("2026-07-26")
  const r = s.date().safeParse(d)
  assert.ok(r.success)
  assert.equal(r.data, d)
})

test("date rejects an invalid Date instance", () => {
  const r = s.date().safeParse(new Date("nope"))
  assert.equal(r.error.issues[0].code, "invalid_date")
})

test("date rejects date strings (coercion is opt-in)", () => {
  assert.equal(s.date().safeParse("2026-07-26").success, false)
})

// ---------------------------------------------------------------------------
// literal / enum
// ---------------------------------------------------------------------------

test("literal matches by identity", () => {
  assert.ok(s.literal("admin").safeParse("admin").success)
  assert.ok(s.literal(0).safeParse(0).success)
  const r = s.literal("admin").safeParse("user")
  assert.equal(r.error.issues[0].code, "invalid_literal")
  assert.equal(r.error.issues[0].message, 'Expected "admin"')
})

test("enum accepts listed values only", () => {
  const role = s.enum(["admin", "user"])
  assert.ok(role.safeParse("user").success)
  const r = role.safeParse("guest")
  assert.equal(r.error.issues[0].code, "invalid_enum_value")
  assert.equal(r.error.issues[0].message, "Expected one of: admin, user")
})

test("enum requires a non-empty array at build time", () => {
  assert.throws(() => s.enum([]))
  assert.throws(() => s.enum("admin"))
})

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------

for (const [name, fn] of tests) {
  try {
    await fn()
    passed++
  } catch (e) {
    failed++
    console.error(`FAIL: ${name}`)
    console.error("  ", e.message)
  }
}

console.log(`\nschema: ${passed}/${passed + failed} passed`)
if (failed) process.exit(1)
