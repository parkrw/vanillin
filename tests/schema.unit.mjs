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
// object — nested paths, stripping, missing keys
// ---------------------------------------------------------------------------

test("object validates and returns a clean copy", () => {
  const user = s.object({ name: s.string(), age: s.number() })
  const r = user.safeParse({ name: "Ada", age: 36 })
  assert.ok(r.success)
  assert.deepEqual(r.data, { name: "Ada", age: 36 })
})

test("object strips unknown keys", () => {
  const r = s.object({ name: s.string() }).safeParse({ name: "Ada", extra: 1 })
  assert.deepEqual(r.data, { name: "Ada" })
})

test("object reports dotted paths for nested failures", () => {
  const schema = s.object({ address: s.object({ city: s.string() }) })
  const r = schema.safeParse({ address: { city: 5 } })
  assert.equal(r.error.issues[0].path, "address.city")
})

test("object reports missing required keys at their path", () => {
  const r = s.object({ name: s.string() }).safeParse({})
  assert.equal(r.error.issues[0].path, "name")
  assert.equal(r.error.issues[0].code, "invalid_type")
})

test("object rejects non-objects", () => {
  assert.equal(s.object({ a: s.string() }).safeParse(null).success, false)
  assert.equal(s.object({ a: s.string() }).safeParse([1]).success, false)
  assert.equal(s.object({ a: s.string() }).safeParse("x").success, false)
})

test("object collects every failing field, not just the first", () => {
  const schema = s.object({ a: s.string(), b: s.number() })
  const r = schema.safeParse({ a: 1, b: "x" })
  assert.deepEqual(
    r.error.issues.map((i) => i.path),
    ["a", "b"]
  )
})

// ---------------------------------------------------------------------------
// array — index paths
// ---------------------------------------------------------------------------

test("array validates elements and reports index paths", () => {
  const r = s.array(s.number()).safeParse([1, "two", 3])
  assert.equal(r.error.issues[0].path, "1")
})

test("array of objects reports dotted paths through indices", () => {
  const schema = s.array(s.object({ name: s.string() }))
  const r = schema.safeParse([{ name: "ok" }, { name: 7 }])
  assert.equal(r.error.issues[0].path, "1.name")
})

test("array rejects non-arrays", () => {
  assert.equal(s.array(s.string()).safeParse("abc").success, false)
})

test("deeply nested useFieldArray shape — dotted paths through arrays", () => {
  const schema = s.object({
    users: s.array(
      s.object({
        name: s.string(),
        pets: s.array(s.object({ tag: s.string() })),
      })
    ),
  })
  const r = schema.safeParse({
    users: [
      { name: "Ada", pets: [{ tag: "ok" }, { tag: 3 }] },
      { name: 9, pets: [] },
    ],
  })
  assert.deepEqual(
    r.error.issues.map((i) => i.path),
    ["users.0.pets.1.tag", "users.1.name"]
  )
})

// ---------------------------------------------------------------------------
// optional / nullable / union
// ---------------------------------------------------------------------------

test("optional admits undefined, still validates present values", () => {
  const schema = s.string().optional()
  assert.ok(schema.safeParse(undefined).success)
  assert.equal(schema.safeParse(null).success, false)
  assert.equal(schema.safeParse(5).success, false)
})

test("nullable admits null only", () => {
  const schema = s.nullable(s.string())
  assert.ok(schema.safeParse(null).success)
  assert.equal(schema.safeParse(undefined).success, false)
})

test("optional object key may be omitted and stays omitted", () => {
  const schema = s.object({ name: s.string(), nick: s.string().optional() })
  const r = schema.safeParse({ name: "Ada" })
  assert.ok(r.success)
  assert.equal("nick" in r.data, false)
})

test("union passes the first matching option and rejects the rest", () => {
  const schema = s.union([s.string(), s.number()])
  assert.ok(schema.safeParse("x").success)
  assert.ok(schema.safeParse(1).success)
  const r = schema.safeParse(true)
  assert.equal(r.error.issues[0].code, "invalid_union")
  assert.equal(r.error.issues[0].path, "")
})

test("union failure inside an object keeps the field path", () => {
  const schema = s.object({ id: s.union([s.string(), s.number()]) })
  const r = schema.safeParse({ id: true })
  assert.equal(r.error.issues[0].path, "id")
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
