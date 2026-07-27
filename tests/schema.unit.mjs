/**
 * Pure-node tests for lib/schema.js.
 * Named .unit.mjs so the browser test runner ignores it.
 */

import assert from "node:assert/strict"
import { s, SchemaError, schemaResolver } from "../lib/schema.js"

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
// refinements — string
// ---------------------------------------------------------------------------

test("string min/max/length", () => {
  assert.ok(s.string().min(2).safeParse("ab").success)
  assert.equal(s.string().min(2).safeParse("a").error.issues[0].code, "too_small")
  assert.equal(s.string().max(2).safeParse("abc").error.issues[0].code, "too_big")
  assert.ok(s.string().length(3).safeParse("abc").success)
  assert.equal(s.string().length(3).safeParse("ab").success, false)
})

test("custom messages: string and { message } forms", () => {
  assert.equal(s.string().min(2, "too short").safeParse("a").error.issues[0].message, "too short")
  assert.equal(
    s.string().min(2, { message: "too short" }).safeParse("a").error.issues[0].message,
    "too short"
  )
})

test("chaining is immutable — refining does not mutate the base schema", () => {
  const base = s.string()
  base.min(5)
  assert.ok(base.safeParse("a").success)
})

test("first failing check wins per field", () => {
  const r = s.string().min(5).regex(/^\d+$/).safeParse("ab")
  assert.equal(r.error.issues.length, 1)
  assert.equal(r.error.issues[0].code, "too_small")
})

test("regex / email / url", () => {
  assert.ok(s.string().regex(/^\d+$/).safeParse("123").success)
  assert.equal(s.string().regex(/^\d+$/).safeParse("12a").success, false)
  assert.ok(s.string().email().safeParse("a@b.com").success)
  assert.equal(s.string().email().safeParse("not-an-email").success, false)
  assert.ok(s.string().url().safeParse("https://example.com/x").success)
  assert.equal(s.string().url().safeParse("not a url").success, false)
})

// ---------------------------------------------------------------------------
// refinements — number, date, array
// ---------------------------------------------------------------------------

test("number min/max/int/positive", () => {
  assert.ok(s.number().min(1).safeParse(1).success)
  assert.equal(s.number().min(1).safeParse(0).error.issues[0].code, "too_small")
  assert.equal(s.number().max(10).safeParse(11).error.issues[0].code, "too_big")
  assert.ok(s.number().int().safeParse(3).success)
  assert.equal(s.number().int().safeParse(3.5).error.issues[0].code, "not_integer")
  assert.ok(s.number().positive().safeParse(0.1).success)
  assert.equal(s.number().positive().safeParse(0).success, false)
})

test("date min/max compare by time", () => {
  const lo = new Date("2026-01-01")
  const hi = new Date("2026-12-31")
  assert.ok(s.date().min(lo).max(hi).safeParse(new Date("2026-07-26")).success)
  assert.equal(s.date().min(lo).safeParse(new Date("2025-01-01")).success, false)
})

test("array min/max/length on element count", () => {
  assert.ok(s.array(s.number()).min(1).safeParse([1]).success)
  assert.equal(s.array(s.number()).min(2).safeParse([1]).error.issues[0].code, "too_small")
  assert.equal(s.array(s.number()).length(1).safeParse([1, 2]).success, false)
})

test("array length failure still reports element issues", () => {
  const r = s.array(s.number()).min(3).safeParse([1, "x"])
  assert.deepEqual(
    r.error.issues.map((i) => i.code),
    ["too_small", "invalid_type"]
  )
})

// ---------------------------------------------------------------------------
// refine / transform
// ---------------------------------------------------------------------------

test("refine adds a custom issue when the predicate fails", () => {
  const even = s.number().refine((v) => v % 2 === 0, "Must be even")
  assert.ok(even.safeParse(4).success)
  const r = even.safeParse(3)
  assert.equal(r.error.issues[0].code, "custom")
  assert.equal(r.error.issues[0].message, "Must be even")
})

test("refine does not run when the inner schema already failed", () => {
  let ran = false
  const schema = s.number().refine(() => ((ran = true), true), "x")
  schema.safeParse("nope")
  assert.equal(ran, false)
})

test("refine with { path } targets a sibling field (password confirm)", () => {
  const schema = s
    .object({ password: s.string(), confirm: s.string() })
    .refine((v) => v.password === v.confirm, {
      message: "Passwords must match",
      path: "confirm",
    })
  const r = schema.safeParse({ password: "a", confirm: "b" })
  assert.equal(r.error.issues[0].path, "confirm")
  assert.equal(r.error.issues[0].message, "Passwords must match")
})

test("transform maps the parsed value on success only", () => {
  const trimmed = s.string().transform((v) => v.trim())
  assert.equal(trimmed.parse("  hi  "), "hi")
  assert.equal(trimmed.safeParse(5).success, false)
})

test("transform result flows into the parent object output", () => {
  const schema = s.object({ name: s.string().transform((v) => v.toUpperCase()) })
  assert.deepEqual(schema.parse({ name: "ada" }), { name: "ADA" })
})

// ---------------------------------------------------------------------------
// coerce — opt-in only
// ---------------------------------------------------------------------------

test('coerce.number parses "42"; plain number still rejects it', () => {
  assert.equal(s.coerce.number().parse("42"), 42)
  assert.equal(s.number().safeParse("42").success, false)
})

test('coerce.number rejects "", null, undefined and non-numeric strings', () => {
  assert.equal(s.coerce.number().safeParse("").success, false)
  assert.equal(s.coerce.number().safeParse(null).success, false)
  assert.equal(s.coerce.number().safeParse(undefined).success, false)
  assert.equal(s.coerce.number().safeParse("abc").success, false)
})

test("coerce.number feeds refinements the coerced value", () => {
  assert.equal(s.coerce.number().min(18).safeParse("17").error.issues[0].code, "too_small")
  assert.equal(s.coerce.number().min(18).parse("21"), 21)
})

test("coerce.string stringifies numbers but not null/undefined", () => {
  assert.equal(s.coerce.string().parse(42), "42")
  assert.equal(s.coerce.string().safeParse(null).success, false)
  assert.equal(s.coerce.string().safeParse(undefined).success, false)
})

test("coerce.boolean uses Boolean()", () => {
  assert.equal(s.coerce.boolean().parse(1), true)
  assert.equal(s.coerce.boolean().parse(""), false)
})

test('coerce.date parses ISO strings and rejects "" and null', () => {
  const r = s.coerce.date().safeParse("2026-07-26")
  assert.ok(r.success)
  assert.equal(r.data.getTime(), new Date("2026-07-26").getTime())
  assert.equal(s.coerce.date().safeParse("").success, false)
  assert.equal(s.coerce.date().safeParse(null).success, false)
  assert.equal(s.coerce.date().safeParse("garbage").success, false)
})

// ---------------------------------------------------------------------------
// schemaResolver — the use-form resolver contract
// ---------------------------------------------------------------------------

// The same options object use-form passes to every resolver.
const RESOLVER_OPTIONS = {
  criteriaMode: "firstError",
  fields: {},
  names: [],
  shouldUseNativeValidation: false,
}

// The exact scenario the hand-written RHF-shaped resolver in
// site/pages/use-form.jsx implements (exercised by
// tests/use-form.test.mjs): email required + format, age required and
// coerced to number, address.city required at a nested path.
const demoSchema = s.object({
  email: s.string().min(1, "Email required").email("Invalid email"),
  age: s.coerce.number().min(1, "Min 1"),
  address: s.object({ city: s.string().min(1, "City required") }),
})

test("resolver: invalid values produce { values: {}, errors } like the fake", async () => {
  const resolve = schemaResolver(demoSchema)
  const r = await resolve(
    { email: "", age: "", address: { city: "" } },
    undefined,
    RESOLVER_OPTIONS
  )
  assert.deepEqual(r.values, {})
  assert.equal(r.errors.email.message, "Email required")
  assert.equal(typeof r.errors.email.type, "string")
  assert.equal(typeof r.errors.age.message, "string")
  assert.equal(r.errors.address.city.message, "City required")
})

test("resolver: valid values return coerced output and empty errors", async () => {
  const resolve = schemaResolver(demoSchema)
  const r = await resolve(
    { email: "a@b.com", age: "30", address: { city: "Portland" } },
    undefined,
    RESOLVER_OPTIONS
  )
  assert.deepEqual(r.errors, {})
  assert.equal(r.values.age, 30) // coerced string -> number, like the fake
  assert.equal(r.values.email, "a@b.com")
})

test("resolver: email format error carries { type, message }", async () => {
  const resolve = schemaResolver(demoSchema)
  const r = await resolve(
    { email: "nope", age: "5", address: { city: "x" } },
    undefined,
    RESOLVER_OPTIONS
  )
  assert.deepEqual(r.errors.email, { type: "invalid_string", message: "Invalid email" })
})

test("resolver: deeply nested useFieldArray shape — errors readable at dotted paths", async () => {
  const schema = s.object({
    users: s.array(
      s.object({
        name: s.string().min(1, "Name required"),
        pets: s
          .array(s.object({ tag: s.string().min(1, "Tag required") }))
          .min(1, "At least one pet"),
      })
    ),
  })
  const resolve = schemaResolver(schema)
  const r = await resolve(
    {
      users: [
        { name: "Ada", pets: [{ tag: "ok" }, { tag: "" }] },
        { name: "", pets: [] },
      ],
    },
    undefined,
    RESOLVER_OPTIONS
  )
  // Errors nested so getByPath-style reads work: errors.users[0].pets[1].tag
  assert.deepEqual(r.errors.users[0].pets[1].tag, {
    type: "too_small",
    message: "Tag required",
  })
  assert.deepEqual(r.errors.users[1].name, {
    type: "too_small",
    message: "Name required",
  })
  assert.deepEqual(r.errors.users[1].pets, {
    type: "too_small",
    message: "At least one pet",
  })
  // Valid siblings stay error-free
  assert.equal(r.errors.users[0].name, undefined)
  assert.equal(r.errors.users[0].pets[0], undefined)
})

test("resolver: firstError — one error per path, first issue wins", async () => {
  const schema = s.object({ name: s.string().min(5, "first") }).refine(() => false, {
    message: "second",
    path: "name",
  })
  const r = await schemaResolver(schema)({ name: "ab" }, undefined, RESOLVER_OPTIONS)
  assert.equal(r.errors.name.message, "first")
})

test("resolver: object-level refine without path lands under root", async () => {
  const schema = s
    .object({ a: s.number(), b: s.number() })
    .refine((v) => v.a + v.b <= 10, "Sum too large")
  const r = await schemaResolver(schema)({ a: 6, b: 7 }, undefined, RESOLVER_OPTIONS)
  assert.deepEqual(r.errors.root, { type: "custom", message: "Sum too large" })
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
