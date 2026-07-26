/**
 * s — zero-dependency, zod-shaped runtime validation.
 *
 * Deliberately a subset of zod's surface — the part real forms use:
 *
 *   s.string()  s.number()  s.boolean()  s.date()
 *   s.literal(value)  s.enum([...])
 *   s.object(shape)  s.array(element)  s.union([...])
 *   .optional()  .nullable()  (also s.optional(x) / s.nullable(x))
 *   .min() .max() .length() .regex() .email() .url() .int() .positive()
 *   .refine(fn, message)  .transform(fn)   — the escape hatches
 *   s.coerce.string/number/boolean/date    — opt-in coercion
 *   .parse(v)      throws SchemaError on failure
 *   .safeParse(v)  returns { success, data } or { success, error }
 *
 * Coercion divergences from zod, chosen for data integrity: coerced
 * number/date leave "" / null / undefined un-coerced (an empty input is
 * not zero, and null is not 1970); coerced string leaves null/undefined
 * un-coerced (never "null"). All then fail the type check. Boolean
 * coercion is Boolean(v) — note "false" is truthy, like zod.
 *
 * Out of scope (deliberate, do not add piecemeal): intersections,
 * discriminated unions, recursive/lazy schemas, branded types, codecs,
 * async refinements, .catch(), error maps. A small correct subset beats
 * a large half-right one. There is also no static type inference — this
 * repo is JSDoc-typed JSX, not TypeScript, so this is runtime validation
 * only; nothing here corresponds to zod's `z.infer<>`.
 *
 * Issues are { path, code, message } with *dotted string* paths
 * ("items.0.name"), matching the resolver contract documented in
 * lib/use-form.js. schemaResolver(schema) adapts a schema to that
 * contract: async (values, context, options) => { values, errors },
 * errors nested by dotted path, each leaf { type, message }. This file
 * stays standalone by design — no imports — so it is usable outside the
 * form layer, and use-form keeps working with any third-party resolver.
 *
 * Coercion is opt-in, never implicit: s.number() rejects the string
 * "42" from an <input>.
 */

/* ================================================================== */
/*  Issue helpers                                                      */
/* ================================================================== */

/** Sentinel returned by _base when the type check failed. */
const INVALID = Symbol("invalid")

function joinPath(path, key) {
  return path ? `${path}.${key}` : String(key)
}

function typeNameOf(v) {
  if (v === null) return "null"
  if (Array.isArray(v)) return "array"
  if (v instanceof Date) return "date"
  return typeof v
}

/** Accept a custom message as a string or { message }, else fall back. */
function messageOf(message, fallback) {
  if (typeof message === "string") return message
  if (message && typeof message.message === "string") return message.message
  return fallback
}

export class SchemaError extends Error {
  constructor(issues) {
    super(
      issues
        .map((i) => (i.path ? `${i.path}: ${i.message}` : i.message))
        .join("; ")
    )
    this.name = "SchemaError"
    this.issues = issues
  }
}

/* ================================================================== */
/*  Base schema — parse / safeParse                                    */
/* ================================================================== */

class Schema {
  /**
   * Subclasses implement _parse(value, path, issues) => parsedValue,
   * pushing { path, code, message } issues on failure.
   */
  safeParse(data) {
    const issues = []
    const value = this._parse(data, "", issues)
    if (issues.length) return { success: false, error: new SchemaError(issues) }
    return { success: true, data: value }
  }

  parse(data) {
    const result = this.safeParse(data)
    if (!result.success) throw result.error
    return result.data
  }

  optional() {
    return new WrappedSchema(this, "undefined")
  }

  nullable() {
    return new WrappedSchema(this, "null")
  }

  /**
   * Custom sync predicate; fn(value) falsy => a "custom" issue. message
   * is a string or { message, path } — path is a dotted string relative
   * to this schema, for targeting a sibling field (password confirm).
   */
  refine(fn, message) {
    return new RefinedSchema(this, fn, message)
  }

  /** Map the parsed value. Runs only when validation passed; the result
   *  is not re-validated. */
  transform(fn) {
    return new TransformedSchema(this, fn)
  }
}

/* ================================================================== */
/*  Primitives                                                         */
/* ================================================================== */

/**
 * Shared base for types that carry chainable refinement checks. Each
 * check is (value) => null | { code, message }; the first failure per
 * value is reported. Chaining is immutable — every refinement returns
 * a new schema via _clone.
 */
class CheckedSchema extends Schema {
  constructor(checks = []) {
    super()
    this._checks = checks
  }

  _with(check) {
    return this._clone(this._checks.concat(check))
  }

  _parse(value, path, issues) {
    const v = this._base(value, path, issues)
    if (v === INVALID) return value
    for (const check of this._checks) {
      const failed = check(v)
      if (failed) {
        issues.push({ path, code: failed.code, message: failed.message })
        return v
      }
    }
    return v
  }
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

class StringSchema extends CheckedSchema {
  constructor(checks = [], coerce = false) {
    super(checks)
    this._coerce = coerce
  }

  _clone(checks) {
    return new StringSchema(checks, this._coerce)
  }

  _base(value, path, issues) {
    if (this._coerce && value != null) value = String(value)
    if (typeof value !== "string") {
      issues.push({
        path,
        code: "invalid_type",
        message: `Expected string, received ${typeNameOf(value)}`,
      })
      return INVALID
    }
    return value
  }

  min(n, message) {
    return this._with((v) =>
      v.length >= n
        ? null
        : {
            code: "too_small",
            message: messageOf(message, `Must be at least ${n} character${n === 1 ? "" : "s"}`),
          }
    )
  }

  max(n, message) {
    return this._with((v) =>
      v.length <= n
        ? null
        : {
            code: "too_big",
            message: messageOf(message, `Must be at most ${n} character${n === 1 ? "" : "s"}`),
          }
    )
  }

  length(n, message) {
    return this._with((v) =>
      v.length === n
        ? null
        : {
            code: "invalid_length",
            message: messageOf(message, `Must be exactly ${n} character${n === 1 ? "" : "s"}`),
          }
    )
  }

  regex(re, message) {
    return this._with((v) =>
      re.test(v)
        ? null
        : { code: "invalid_string", message: messageOf(message, "Invalid format") }
    )
  }

  email(message) {
    return this._with((v) =>
      EMAIL_RE.test(v)
        ? null
        : { code: "invalid_string", message: messageOf(message, "Invalid email") }
    )
  }

  url(message) {
    return this._with((v) =>
      URL.canParse(v)
        ? null
        : { code: "invalid_string", message: messageOf(message, "Invalid URL") }
    )
  }
}

class NumberSchema extends CheckedSchema {
  constructor(checks = [], coerce = false) {
    super(checks)
    this._coerce = coerce
  }

  _clone(checks) {
    return new NumberSchema(checks, this._coerce)
  }

  _base(value, path, issues) {
    // Coercion deliberately skips "" and null: Number("") === 0 and
    // Number(null) === 0 would turn an empty input into a valid zero.
    if (this._coerce && value != null && value !== "" && typeof value !== "number") {
      value = Number(value)
    }
    if (typeof value !== "number") {
      issues.push({
        path,
        code: "invalid_type",
        message: `Expected number, received ${typeNameOf(value)}`,
      })
      return INVALID
    }
    if (!Number.isFinite(value)) {
      issues.push({
        path,
        code: "invalid_type",
        message: "Expected a finite number",
      })
      return INVALID
    }
    return value
  }

  min(n, message) {
    return this._with((v) =>
      v >= n
        ? null
        : { code: "too_small", message: messageOf(message, `Must be at least ${n}`) }
    )
  }

  max(n, message) {
    return this._with((v) =>
      v <= n
        ? null
        : { code: "too_big", message: messageOf(message, `Must be at most ${n}`) }
    )
  }

  int(message) {
    return this._with((v) =>
      Number.isInteger(v)
        ? null
        : { code: "not_integer", message: messageOf(message, "Must be an integer") }
    )
  }

  positive(message) {
    return this._with((v) =>
      v > 0
        ? null
        : { code: "too_small", message: messageOf(message, "Must be positive") }
    )
  }
}

class BooleanSchema extends CheckedSchema {
  constructor(checks = [], coerce = false) {
    super(checks)
    this._coerce = coerce
  }

  _clone(checks) {
    return new BooleanSchema(checks, this._coerce)
  }

  _base(value, path, issues) {
    if (this._coerce) value = Boolean(value)
    if (typeof value !== "boolean") {
      issues.push({
        path,
        code: "invalid_type",
        message: `Expected boolean, received ${typeNameOf(value)}`,
      })
      return INVALID
    }
    return value
  }
}

class DateSchema extends CheckedSchema {
  constructor(checks = [], coerce = false) {
    super(checks)
    this._coerce = coerce
  }

  _clone(checks) {
    return new DateSchema(checks, this._coerce)
  }

  _base(value, path, issues) {
    // Skips "" and null: new Date(null) is 1970 and new Date("") is
    // invalid — neither is what an empty input means.
    if (
      this._coerce &&
      value != null &&
      value !== "" &&
      !(value instanceof Date) &&
      (typeof value === "string" || typeof value === "number")
    ) {
      value = new Date(value)
    }
    if (!(value instanceof Date)) {
      issues.push({
        path,
        code: "invalid_type",
        message: `Expected date, received ${typeNameOf(value)}`,
      })
      return INVALID
    }
    if (Number.isNaN(value.getTime())) {
      issues.push({ path, code: "invalid_date", message: "Invalid date" })
      return INVALID
    }
    return value
  }

  min(d, message) {
    return this._with((v) =>
      v.getTime() >= d.getTime()
        ? null
        : { code: "too_small", message: messageOf(message, `Must be on or after ${d.toISOString()}`) }
    )
  }

  max(d, message) {
    return this._with((v) =>
      v.getTime() <= d.getTime()
        ? null
        : { code: "too_big", message: messageOf(message, `Must be on or before ${d.toISOString()}`) }
    )
  }
}

class LiteralSchema extends Schema {
  constructor(expected) {
    super()
    this._expected = expected
  }

  _parse(value, path, issues) {
    if (value !== this._expected) {
      issues.push({
        path,
        code: "invalid_literal",
        message: `Expected ${JSON.stringify(this._expected)}`,
      })
    }
    return value
  }
}

class EnumSchema extends Schema {
  constructor(values) {
    super()
    if (!Array.isArray(values) || values.length === 0) {
      throw new Error("s.enum requires a non-empty array of values")
    }
    this._values = values
  }

  _parse(value, path, issues) {
    if (!this._values.includes(value)) {
      issues.push({
        path,
        code: "invalid_enum_value",
        message: `Expected one of: ${this._values.join(", ")}`,
      })
    }
    return value
  }
}

/* ================================================================== */
/*  Composites                                                         */
/* ================================================================== */

/** optional()/nullable() wrapper — passes the sentinel value through. */
class WrappedSchema extends Schema {
  constructor(inner, kind) {
    super()
    this._inner = inner
    this._kind = kind
  }

  _parse(value, path, issues) {
    if (value === undefined && this._kind === "undefined") return value
    if (value === null && this._kind === "null") return value
    return this._inner._parse(value, path, issues)
  }
}

class ObjectSchema extends Schema {
  constructor(shape) {
    super()
    if (shape == null || typeof shape !== "object" || Array.isArray(shape)) {
      throw new Error("s.object requires a shape object")
    }
    this._shape = shape
  }

  _parse(value, path, issues) {
    if (
      value === null ||
      typeof value !== "object" ||
      Array.isArray(value) ||
      value instanceof Date
    ) {
      issues.push({
        path,
        code: "invalid_type",
        message: `Expected object, received ${typeNameOf(value)}`,
      })
      return value
    }
    // Unknown keys are stripped (zod's default).
    const out = {}
    for (const key of Object.keys(this._shape)) {
      const parsed = this._shape[key]._parse(value[key], joinPath(path, key), issues)
      if (parsed !== undefined || key in value) out[key] = parsed
    }
    return out
  }
}

class ArraySchema extends CheckedSchema {
  constructor(element, checks = []) {
    super(checks)
    if (!(element instanceof Schema)) {
      throw new Error("s.array requires an element schema")
    }
    this._element = element
  }

  _clone(checks) {
    return new ArraySchema(this._element, checks)
  }

  _parse(value, path, issues) {
    if (!Array.isArray(value)) {
      issues.push({
        path,
        code: "invalid_type",
        message: `Expected array, received ${typeNameOf(value)}`,
      })
      return value
    }
    for (const check of this._checks) {
      const failed = check(value)
      if (failed) {
        issues.push({ path, code: failed.code, message: failed.message })
        break
      }
    }
    return value.map((item, i) =>
      this._element._parse(item, joinPath(path, i), issues)
    )
  }

  min(n, message) {
    return this._with((v) =>
      v.length >= n
        ? null
        : {
            code: "too_small",
            message: messageOf(message, `Must contain at least ${n} item${n === 1 ? "" : "s"}`),
          }
    )
  }

  max(n, message) {
    return this._with((v) =>
      v.length <= n
        ? null
        : {
            code: "too_big",
            message: messageOf(message, `Must contain at most ${n} item${n === 1 ? "" : "s"}`),
          }
    )
  }

  length(n, message) {
    return this._with((v) =>
      v.length === n
        ? null
        : {
            code: "invalid_length",
            message: messageOf(message, `Must contain exactly ${n} item${n === 1 ? "" : "s"}`),
          }
    )
  }
}

class UnionSchema extends Schema {
  constructor(options) {
    super()
    if (!Array.isArray(options) || options.length === 0) {
      throw new Error("s.union requires a non-empty array of schemas")
    }
    this._options = options
  }

  _parse(value, path, issues) {
    for (const option of this._options) {
      const scratch = []
      const parsed = option._parse(value, path, scratch)
      if (scratch.length === 0) return parsed
    }
    issues.push({ path, code: "invalid_union", message: "Invalid input" })
    return value
  }
}

/* ================================================================== */
/*  Effects — refine / transform                                       */
/* ================================================================== */

class RefinedSchema extends Schema {
  constructor(inner, fn, message) {
    super()
    this._inner = inner
    this._fn = fn
    this._message = message
  }

  _parse(value, path, issues) {
    const before = issues.length
    const parsed = this._inner._parse(value, path, issues)
    if (issues.length > before) return parsed
    if (!this._fn(parsed)) {
      const at =
        this._message && typeof this._message.path === "string"
          ? joinPath(path, this._message.path)
          : path
      issues.push({
        path: at,
        code: "custom",
        message: messageOf(this._message, "Invalid value"),
      })
    }
    return parsed
  }
}

class TransformedSchema extends Schema {
  constructor(inner, fn) {
    super()
    this._inner = inner
    this._fn = fn
  }

  _parse(value, path, issues) {
    const before = issues.length
    const parsed = this._inner._parse(value, path, issues)
    if (issues.length > before) return parsed
    return this._fn(parsed)
  }
}

/* ================================================================== */
/*  Public namespace                                                   */
/* ================================================================== */

export const s = {
  string: () => new StringSchema(),
  number: () => new NumberSchema(),
  boolean: () => new BooleanSchema(),
  date: () => new DateSchema(),
  literal: (value) => new LiteralSchema(value),
  enum: (values) => new EnumSchema(values),
  object: (shape) => new ObjectSchema(shape),
  array: (element) => new ArraySchema(element),
  union: (options) => new UnionSchema(options),
  optional: (schema) => schema.optional(),
  nullable: (schema) => schema.nullable(),
  coerce: {
    string: () => new StringSchema([], true),
    number: () => new NumberSchema([], true),
    boolean: () => new BooleanSchema([], true),
    date: () => new DateSchema([], true),
  },
}

/* ================================================================== */
/*  schemaResolver — adapter for the use-form resolver contract        */
/* ================================================================== */

/**
 * Nest an error object at a dotted path, mirroring how use-form reads
 * errors back with getByPath ("items.0.name" => errors.items[0].name).
 * Kept local rather than imported from use-form.js so this file stays
 * dependency-free. First error per path wins (criteriaMode
 * "firstError"); an occupied leaf is never overwritten.
 */
function setErrorAtPath(errors, path, error) {
  const keys = path.split(".")
  let cur = errors
  for (let i = 0; i < keys.length - 1; i++) {
    const k = keys[i]
    if (cur[k] == null || typeof cur[k] !== "object") {
      cur[k] = /^\d+$/.test(keys[i + 1]) ? [] : {}
    }
    cur = cur[k]
  }
  const leaf = keys[keys.length - 1]
  if (cur[leaf] == null) cur[leaf] = error
}

/**
 * Adapt a schema to the resolver contract in lib/use-form.js:
 *   async (values, context, options) => { values, errors }
 * On success, values is the parsed (possibly transformed/coerced)
 * output. On failure, values is {} and errors carries { type, message }
 * leaves at each issue's dotted path. Issues with an empty path (a
 * failed object-level refine without { path }) land under "root".
 */
export function schemaResolver(schema) {
  return async (values, _context, _options) => {
    const result = schema.safeParse(values)
    if (result.success) return { values: result.data, errors: {} }
    const errors = {}
    for (const issue of result.error.issues) {
      setErrorAtPath(errors, issue.path || "root", {
        type: issue.code,
        message: issue.message,
      })
    }
    return { values: {}, errors }
  }
}
