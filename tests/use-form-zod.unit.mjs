/**
 * Pure-node verification that @hookform/resolvers' zodResolver runs
 * unmodified against our resolver contract. No browser, no vite.
 *
 * Run: node tests/use-form-zod.unit.mjs
 */

import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { getByPath } from "../lib/use-form.js"

const eq = (a, b, label) => {
  if (a !== b)
    throw new Error(`${label}: expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`)
}

const results = []
async function test(name, fn) {
  try {
    await fn()
    results.push(["PASS", name])
  } catch (e) {
    results.push(["FAIL", name + " — " + e.message.split("\n")[0]])
  }
}

// ── Schema ──────────────────────────────────────────────────────────

const schema = z.object({
  email: z.string().min(1, "Email required").email("Invalid email"),
  age: z.coerce.number().min(1, "Min 1").max(150, "Max 150"),
  address: z.object({
    city: z.string().min(1, "City required"),
  }),
})

const resolver = zodResolver(schema)

// The options object our engine passes to the resolver
const opts = {
  criteriaMode: "firstError",
  fields: {},
  names: ["email", "age", "address.city"],
  shouldUseNativeValidation: false,
}

// ── Tests ───────────────────────────────────────────────────────────

await test("rejects empty values with nested errors", async () => {
  const { values, errors } = await resolver(
    { email: "", age: "", address: { city: "" } },
    undefined,
    opts
  )

  // errors should be a nested object, not flat
  const emailErr = getByPath(errors, "email")
  eq(!!emailErr, true, "email error present")
  eq(typeof emailErr.message, "string", "email error has message")
  eq(typeof emailErr.type, "string", "email error has type")

  const cityErr = getByPath(errors, "address.city")
  eq(!!cityErr, true, "nested city error present")
  eq(typeof cityErr.message, "string", "city error has message")
})

await test("passes valid values through with coercion", async () => {
  const { values, errors } = await resolver(
    { email: "a@b.com", age: "42", address: { city: "Portland" } },
    undefined,
    opts
  )

  eq(Object.keys(errors).length, 0, "no errors")
  eq(values.email, "a@b.com", "email passed through")
  eq(values.age, 42, "age coerced string→number")
  eq(values.address.city, "Portland", "nested city passed through")
})

await test("returns { values, errors } shape", async () => {
  const result = await resolver({ email: "", age: "", address: { city: "" } }, undefined, opts)
  eq("values" in result, true, "has values key")
  eq("errors" in result, true, "has errors key")
})

// ── Report ──────────────────────────────────────────────────────────

let failed = 0
for (const [status, name] of results) {
  if (status === "FAIL") failed++
  console.log(`${status}  ${name}`)
}
console.log(`\n${results.length - failed}/${results.length} passed`)
process.exit(failed ? 1 : 0)
