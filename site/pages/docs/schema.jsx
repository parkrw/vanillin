import { useState } from "react"
import { s } from "../../../lib/schema.js"
import { Input } from "../../../ui/input/input.jsx"
import { Badge } from "../../../ui/badge/badge.jsx"
import "../../../ui/input/input.css"
import "../../../ui/badge/badge.css"
import { CodeBlock, ComponentPreview } from "../../code-example.jsx"
import "../../code-example.css"

const emailSchema = s.string().min(1, "Email required").email()
const coerced = s.coerce.number().int().min(18)
const strict = s.number()

function formatResult(result) {
  if (result.success) return { ok: true, text: JSON.stringify(result.data) }
  return { ok: false, text: result.error.issues[0].message }
}

export default function SchemaPage() {
  const [email, setEmail] = useState("")
  const [age, setAge] = useState("")

  const emailResult = email ? formatResult(emailSchema.safeParse(email)) : null
  const coercedResult = age ? formatResult(coerced.safeParse(age)) : null
  const strictResult = age ? formatResult(strict.safeParse(age)) : null

  return (
    <>
      <h2>Schema</h2>

      <p>
        <code>lib/schema.js</code> is a zero-dependency runtime
        validation library shipped with the kit. It provides a
        zod-shaped API so form validation has an answer that needs no
        external package. Pair it with <code>schemaResolver</code> to
        plug directly into <code>useForm</code>.
      </p>

      <CodeBlock language="jsx" code={`import { s, schemaResolver } from "../lib/schema.js"
import { useForm } from "../lib/use-form.js"

const signup = s.object({
  email: s.string().min(1, "Email required").email(),
  age: s.coerce.number().int().min(18),
  role: s.enum(["admin", "user"]),
})

const { register, handleSubmit, formState } = useForm({
  defaultValues: { email: "", age: "" },
  resolver: schemaResolver(signup),
})`} />

      <p>
        <code>schemaResolver(schema)</code> adapts any schema to the
        resolver contract in <code>lib/use-form.js</code>: on success
        the form receives parsed (coerced, transformed) values; on
        failure each issue becomes a <code>{"{ type, message }"}</code>{" "}
        error at its dotted path. Object-level <code>.refine()</code>{" "}
        failures without a <code>path</code> land
        under <code>errors.root</code>.
      </p>

      <p>
        Type an email to see validation in action. The schema
        below rejects empty strings and values that are not valid
        email addresses:
      </p>

      <ComponentPreview code={`const emailSchema = s.string().min(1, "Email required").email()

const result = emailSchema.safeParse(value)
// { success: true, data: "user@example.com" }
// { success: false, error: { issues: [{ message: "Invalid email" }] } }`}>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", maxWidth: "24rem" }}>
          <Input
            placeholder="user@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          {emailResult && (
            <Badge variant={emailResult.ok ? "success" : "destructive"}>
              {emailResult.ok ? `Valid: ${emailResult.text}` : emailResult.text}
            </Badge>
          )}
        </div>
      </ComponentPreview>

      <h3>The API subset</h3>

      <p>
        The API mirrors a deliberate subset of zod: anything supported
        here works the way zod's version does:
      </p>

      <ul>
        <li>
          <strong>Primitives</strong>: <code>s.string()</code>,{" "}
          <code>s.number()</code>, <code>s.boolean()</code>,{" "}
          <code>s.date()</code>, <code>s.literal(value)</code>,{" "}
          <code>s.enum([...])</code>
        </li>
        <li>
          <strong>Composites</strong>: <code>s.object(shape)</code>,{" "}
          <code>s.array(element)</code>, <code>s.union([...])</code>,{" "}
          <code>.optional()</code>, <code>.nullable()</code>
        </li>
        <li>
          <strong>Refinements</strong>: <code>.min()</code>,{" "}
          <code>.max()</code>, <code>.length()</code>,{" "}
          <code>.regex()</code>, <code>.email()</code>,{" "}
          <code>.url()</code>, <code>.int()</code>,{" "}
          <code>.positive()</code>, each taking an optional custom
          message
        </li>
        <li>
          <strong>Escape hatches</strong>:{" "}
          <code>.refine(fn, message)</code> (sync only; pass{" "}
          <code>{"{ message, path }"}</code> to target a sibling field)
          and <code>.transform(fn)</code>
        </li>
        <li>
          <strong>Output</strong>: <code>.parse(v)</code> throws
          a <code>SchemaError</code>; <code>.safeParse(v)</code>{" "}
          returns <code>{"{ success, data }"}</code>{" "}
          or <code>{"{ success, error }"}</code>
        </li>
      </ul>

      <CodeBlock language="jsx" code={`const signup = s.object({
  email: s.string().min(1, "Email required").email(),
  age: s.coerce.number().int().min(18),
  role: s.enum(["admin", "user"]),
  pets: s.array(s.object({ tag: s.string().min(1) })).min(1),
})

const result = signup.safeParse(values)
if (!result.success) console.log(result.error.issues)`} />

      <p>
        Issues are <code>{"{ path, code, message }"}</code> where{" "}
        <code>path</code> is a dotted string through objects and arrays
        (<code>"pets.0.tag"</code>): the same addressing{" "}
        <code>useForm</code> and <code>useFieldArray</code> use, so
        error paths match field names without conversion.
      </p>

      <h3>Coercion is opt-in</h3>

      <p>
        Form inputs yield strings, but <code>s.number()</code>{" "}
        rejects <code>"42"</code>: silent coercion in a validation
        library is how bad data reaches a backend. Opt in per field
        with <code>s.coerce.string()</code>,{" "}
        <code>s.coerce.number()</code>,{" "}
        <code>s.coerce.boolean()</code>,
        or <code>s.coerce.date()</code>.
      </p>

      <p>
        Type a number to see the difference. The strict schema rejects
        any string; the coerced schema parses it, then applies the
        refinements:
      </p>

      <ComponentPreview code={`// Strict: rejects the string "42"
s.number().safeParse("42")
// { success: false, error: "Expected number, received string" }

// Coerced: parses the string, then validates
s.coerce.number().int().min(18).safeParse("25")
// { success: true, data: 25 }`}>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", maxWidth: "24rem" }}>
          <Input
            placeholder='Try "25", "10", "abc", or "3.5"'
            value={age}
            onChange={(e) => setAge(e.target.value)}
          />
          {age && (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <code style={{ fontSize: "0.75rem", flexShrink: 0 }}>s.number()</code>
                <Badge variant={strictResult?.ok ? "success" : "destructive"}>
                  {strictResult?.ok ? strictResult.text : strictResult?.text}
                </Badge>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <code style={{ fontSize: "0.75rem", flexShrink: 0 }}>s.coerce.number().int().min(18)</code>
                <Badge variant={coercedResult?.ok ? "success" : "destructive"}>
                  {coercedResult?.ok ? coercedResult.text : coercedResult?.text}
                </Badge>
              </div>
            </div>
          )}
        </div>
      </ComponentPreview>

      <p>
        Two coercions diverge from zod by design:{" "}
        <code>s.coerce.number()</code> and <code>s.coerce.date()</code>{" "}
        leave <code>""</code> and <code>null</code> un-coerced (then
        fail the type check): an empty input is not zero,
        and <code>null</code> is not 1970.{" "}
        <code>s.coerce.string()</code> never
        produces <code>"null"</code>.{" "}
        <code>s.coerce.boolean()</code> matches
        zod (<code>Boolean(v)</code>): the
        string <code>"false"</code> is truthy; checkboxes give real
        booleans.
      </p>

      <h3>Runtime only</h3>

      <p>
        This kit is JSDoc-typed JSX, not TypeScript. Zod's main draw
        (static type inference) cannot be reproduced here: there is
        no <code>s.infer&lt;&gt;</code>. Schemas validate values at
        runtime, nothing more. If you need inferred types, use zod
        directly; <code>useForm</code> accepts any resolver that
        matches the contract.
      </p>

      <h3>Using zod instead</h3>

      <p>
        The resolver contract is the boundary, and it stays open.
        Nothing in <code>useForm</code> knows about this library: a
        hand-written resolver or <code>@hookform/resolvers</code> +
        zod/valibot works the same way. Use <code>lib/schema.js</code>{" "}
        when you want validation without adding a dependency; use zod
        when you need type inference or the full feature set.
      </p>

      <h3>Out of scope</h3>

      <p>
        Omitted deliberately: each is a real feature and each is a
        rabbit hole, and a correct subset beats a half-right superset:
        intersections, discriminated unions, recursive/lazy schemas,
        branded types, codecs, async refinements, <code>.catch()</code>,
        and error maps. Unknown object keys are stripped (zod's
        default); there is no <code>.passthrough()</code>{" "}
        or <code>.strict()</code>.
      </p>
    </>
  )
}
