/**
 * s — zero-dependency, zod-shaped runtime validation.
 *
 * Deliberately a subset of zod's surface — the part real forms use:
 *
 *   s.string()  s.number()  s.boolean()  s.date()
 *   s.literal(value)  s.enum([...])
 *   s.object(shape)  s.array(element)  s.union([...])
 *   .optional()  .nullable()  (also s.optional(x) / s.nullable(x))
 *   .parse(v)      throws SchemaError on failure
 *   .safeParse(v)  returns { success, data } or { success, error }
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
 * lib/use-form.js. This file stays standalone by design — no imports —
 * so it is usable outside the form layer, and use-form keeps working
 * with any third-party resolver.
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

class StringSchema extends CheckedSchema {
  _clone(checks) {
    return new StringSchema(checks)
  }

  _base(value, path, issues) {
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
}

class NumberSchema extends CheckedSchema {
  _clone(checks) {
    return new NumberSchema(checks)
  }

  _base(value, path, issues) {
    if (typeof value !== "number" || !Number.isFinite(value)) {
      issues.push({
        path,
        code: "invalid_type",
        message: `Expected number, received ${typeNameOf(value)}`,
      })
      return INVALID
    }
    return value
  }
}

class BooleanSchema extends CheckedSchema {
  _clone(checks) {
    return new BooleanSchema(checks)
  }

  _base(value, path, issues) {
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
  _clone(checks) {
    return new DateSchema(checks)
  }

  _base(value, path, issues) {
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
}
