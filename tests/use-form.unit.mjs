import { createFormControl } from "../lib/use-form.js"

/**
 * Pure-Node tests for the engine behind useForm — no browser, no renderer.
 * Run with plain `node tests/use-form.unit.mjs`. The React-level behaviour
 * (watch, Controller, watched-name pruning) lives in tests/use-form.test.mjs,
 * which mounts a probe component in the page.
 */

let passed = 0
let failed = 0

async function test(name, fn) {
  try {
    await fn()
    passed++
  } catch (e) {
    failed++
    console.error(`FAIL: ${name}\n  ${e.message}`)
  }
}

function eq(actual, expected, label = "") {
  if (!Object.is(actual, expected)) {
    throw new Error(
      `${label ? label + ": " : ""}expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`
    )
  }
}

function ok(value, label) {
  if (!value) throw new Error(`${label}: expected a truthy value, got ${value}`)
}

/** A deferred whose resolve is captured, so a test can order two async runs. */
function gate() {
  let release
  const promise = new Promise((r) => (release = r))
  return { promise, release }
}

/* ------------------------------------------------------------------ */
/*  Dirty tracking: deepEqual must not equate two boxed values         */
/* ------------------------------------------------------------------ */

/**
 * `same` is a distinct value that should still count as unchanged; `other` is
 * a genuinely different one. Asserting both is the point: a deepEqual that
 * calls every Date equal passes the "unchanged" half on its own.
 */
async function dirtyCase(label, defaultValue, same, other) {
  await test(`dirty tracking: ${label}`, () => {
    const control = createFormControl({ defaultValues: { f: defaultValue } })
    control.register("f")
    ok(control._fields.f, `${label}: field registered`)

    control.setValue("f", same, { shouldDirty: true })
    eq(!!control._formState.dirtyFields.f, false, `${label}: equal value is clean`)
    eq(control._formState.isDirty, false, `${label}: form clean`)

    control.setValue("f", other, { shouldDirty: true })
    eq(!!control._formState.dirtyFields.f, true, `${label}: different value is dirty`)
    eq(control._formState.isDirty, true, `${label}: form dirty`)
  })
}

await dirtyCase("Date", new Date(2020, 0, 1), new Date(2020, 0, 1), new Date(2024, 0, 1))
await dirtyCase("Set", new Set(["a"]), new Set(["a"]), new Set(["b"]))
await dirtyCase(
  "Map",
  new Map([["a", 1]]),
  new Map([["a", 1]]),
  new Map([["a", 2]])
)
await dirtyCase("RegExp", /ab/g, /ab/g, /ab/i)
await dirtyCase(
  "nested Date",
  { d: new Date(2020, 0, 1) },
  { d: new Date(2020, 0, 1) },
  { d: new Date(2024, 0, 1) }
)

// A File cannot be rebuilt from its keys, so identity is the only honest
// answer: the same handle is unchanged, a different one is a new upload.
class FakeFile {
  constructor(name) {
    this.name = name
  }
}
const upload = new FakeFile("a.png")
await dirtyCase("File-like", upload, upload, new FakeFile("a.png"))

await test("boxed defaults survive cloning", () => {
  const defaults = {
    d: new Date(2020, 0, 1),
    s: new Set([1, 2]),
    m: new Map([["k", 1]]),
    r: /ab/gi,
  }
  const control = createFormControl({ defaultValues: defaults })
  const cloned = control._defaultValues

  ok(cloned.s instanceof Set, "Set default stays a Set")
  ok(cloned.s !== defaults.s, "Set default is a copy, not the same handle")
  eq([...cloned.s].join(","), "1,2", "Set members survive")
  ok(cloned.m instanceof Map, "Map default stays a Map")
  eq(cloned.m.get("k"), 1, "Map entries survive")
  ok(cloned.d instanceof Date, "Date default stays a Date")
  eq(cloned.d.getTime(), defaults.d.getTime(), "Date value survives")
  ok(cloned.r instanceof RegExp, "RegExp default stays a RegExp")
  eq(cloned.r.flags, "gi", "RegExp flags survive")

  const read = control.getValues()
  ok(read.s instanceof Set, "getValues returns a Set, not a bare object")
  eq(read.s.size, 2, "getValues keeps the Set members")
})

/* ------------------------------------------------------------------ */
/*  register: the ref callback must honour null                        */
/* ------------------------------------------------------------------ */

await test("register ref releases the node on unmount", async () => {
  const control = createFormControl({ defaultValues: { city: "Oslo" } })
  const reg = control.register("city")
  const el = { nodeName: "INPUT", type: "text", value: "" }

  reg.ref(el)
  eq(control._fields.city._ref, el, "ref attached")
  eq(el.value, "Oslo", "attached node seeded from defaults")

  // While attached, the DOM node is what submit reads.
  el.value = "Bergen"
  let submitted = null
  await control.handleSubmit((d) => {
    submitted = d
  })()
  eq(submitted.city, "Bergen", "attached node feeds the submit")

  reg.ref(null)
  eq(control._fields.city._ref, null, "ref released")

  el.value = "ghost"
  await control.handleSubmit((d) => {
    submitted = d
  })()
  eq(submitted.city, "Bergen", "detached node no longer feeds the submit")
})

/* ------------------------------------------------------------------ */
/*  isValid starts false                                               */
/* ------------------------------------------------------------------ */

await test("an empty required form starts invalid", async () => {
  const control = createFormControl({ defaultValues: { name: "" } })
  control.register("name", { required: "Required" })

  eq(control._formState.isValid, false, "isValid before any validation")
  eq(await control.trigger(), false, "empty required field fails validation")
  eq(control._formState.isValid, false, "still invalid after validating")

  control.setValue("name", "Ada")
  eq(await control.trigger(), true, "filled field passes")
  eq(control._formState.isValid, true, "isValid once the rule passes")
})

/* ------------------------------------------------------------------ */
/*  Async validation races                                             */
/* ------------------------------------------------------------------ */

await test("a slow resolver run cannot overwrite a newer answer", async () => {
  const gates = []
  let calls = 0
  const resolver = async (values) => {
    const n = ++calls
    const g = gate()
    gates.push(g)
    await g.promise
    return n === 1
      ? { values, errors: { email: { type: "stale", message: "old" } } }
      : { values, errors: {} }
  }
  const control = createFormControl({
    defaultValues: { email: "" },
    mode: "onChange",
    resolver,
  })
  control.register("email")

  const first = control._validateField("email")
  const second = control._validateField("email")
  eq(gates.length, 2, "both resolver runs started")

  gates[1].release()
  await second
  eq(control._formState.errors.email, undefined, "newer answer applied")

  gates[0].release()
  await first
  eq(control._formState.errors.email, undefined, "stale answer dropped")
  eq(control._formState.isValid, true, "isValid follows the newer answer")
})

await test("a newer resolver error survives a late clean answer", async () => {
  const gates = []
  let calls = 0
  const resolver = async (values) => {
    const n = ++calls
    const g = gate()
    gates.push(g)
    await g.promise
    return n === 1
      ? { values, errors: {} }
      : { values, errors: { email: { type: "taken", message: "in use" } } }
  }
  const control = createFormControl({
    defaultValues: { email: "" },
    mode: "onChange",
    resolver,
  })
  control.register("email")

  const first = control._validateField("email")
  const second = control._validateField("email")
  eq(gates.length, 2, "both resolver runs started")

  gates[1].release()
  await second
  eq(control._formState.errors.email?.message, "in use", "newer error applied")

  gates[0].release()
  await first
  eq(control._formState.errors.email?.message, "in use", "late clean answer dropped")
  eq(control._formState.isValid, false, "isValid follows the newer answer")
})

await test("a slow built-in validate cannot overwrite a newer answer", async () => {
  const gates = []
  const control = createFormControl({
    defaultValues: { a: "" },
    mode: "onChange",
  })
  control.register("a", {
    validate: async (v) => {
      const g = gate()
      gates.push(g)
      await g.promise
      return v === "good" ? true : "bad value"
    },
  })

  control.setValue("a", "bad")
  const first = control._validateField("a")
  control.setValue("a", "good")
  const second = control._validateField("a")
  eq(gates.length, 2, "both validate runs started")

  gates[1].release()
  await second
  eq(control._formState.errors.a, undefined, "newer answer applied")

  gates[0].release()
  await first
  eq(control._formState.errors.a, undefined, "stale answer dropped")
  eq(control._formState.isValid, true, "isValid follows the newer answer")
})

/* ------------------------------------------------------------------ */
/*  Summary                                                           */
/* ------------------------------------------------------------------ */

console.log(`\n${passed} passed, ${failed} failed, ${passed + failed} total`)
if (failed > 0) process.exit(1)
