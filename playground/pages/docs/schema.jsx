export default function SchemaPage() {
  return (
    <>
      <h2>Schema</h2>

      <p>
        <code>lib/schema.js</code> is a zero-dependency, zod-shaped runtime
        validation library. It exists so &ldquo;how do I validate this
        form?&rdquo; has an answer that is neither &ldquo;hand-write a
        resolver&rdquo; nor &ldquo;add a dependency&rdquo;. It is usable
        standalone &mdash; the file imports nothing &mdash; and plugs into{" "}
        <code>useForm</code> through <code>schemaResolver</code>.
      </p>

      <h3>The subset</h3>

      <p>
        The API is deliberately a subset of zod &mdash; familiarity is the
        point, so anything supported here works the way zod&rsquo;s version
        does:
      </p>

      <ul>
        <li>
          <strong>Primitives</strong> — <code>s.string()</code>,{" "}
          <code>s.number()</code>, <code>s.boolean()</code>,{" "}
          <code>s.date()</code>, <code>s.literal(value)</code>,{" "}
          <code>s.enum([...])</code>
        </li>
        <li>
          <strong>Composites</strong> — <code>s.object(shape)</code>,{" "}
          <code>s.array(element)</code>, <code>s.union([...])</code>,{" "}
          <code>.optional()</code>, <code>.nullable()</code>
        </li>
        <li>
          <strong>Refinements</strong> — <code>.min()</code>,{" "}
          <code>.max()</code>, <code>.length()</code>, <code>.regex()</code>,{" "}
          <code>.email()</code>, <code>.url()</code>, <code>.int()</code>,{" "}
          <code>.positive()</code>, each taking an optional custom message
        </li>
        <li>
          <strong>Escape hatches</strong> —{" "}
          <code>.refine(fn, message)</code> (sync only; pass{" "}
          <code>{"{ message, path }"}</code> to target a sibling field, e.g.
          password confirmation) and <code>.transform(fn)</code>
        </li>
        <li>
          <strong>Output</strong> — <code>.parse(v)</code> throws a{" "}
          <code>SchemaError</code>; <code>.safeParse(v)</code> returns{" "}
          <code>{"{ success, data }"}</code> or{" "}
          <code>{"{ success, error }"}</code>
        </li>
      </ul>

      <pre>
{`import { s } from "../lib/schema.js"

const signup = s.object({
  email: s.string().min(1, "Email required").email(),
  age: s.coerce.number().int().min(18),
  role: s.enum(["admin", "user"]),
  pets: s.array(s.object({ tag: s.string().min(1) })).min(1),
})

const result = signup.safeParse(values)
if (!result.success) console.log(result.error.issues)`}
      </pre>

      <p>
        Issues are <code>{"{ path, code, message }"}</code> where{" "}
        <code>path</code> is a <em>dotted string</em> through objects and
        arrays (<code>"pets.0.tag"</code>) &mdash; the same addressing{" "}
        <code>useForm</code> and <code>useFieldArray</code> use, so error
        paths line up with field names with no conversion step.
      </p>

      <h3>Runtime only — no inference</h3>

      <p>
        This kit is JSDoc-typed JSX, not TypeScript. Zod&rsquo;s biggest draw
        &mdash; static type inference &mdash; cannot be reproduced here and is
        not attempted: there is no <code>s.infer&lt;&gt;</code>. Schemas
        validate values at runtime, nothing more. If you need inferred types,
        use zod itself; <code>useForm</code> accepts any RHF-compatible
        resolver.
      </p>

      <h3>Coercion is opt-in, never implicit</h3>

      <p>
        Inputs yield strings, but <code>s.number()</code> rejects{" "}
        <code>"42"</code> &mdash; silent coercion in a validation library is
        how bad data reaches a backend. Opt in per field with{" "}
        <code>s.coerce.string()</code>, <code>s.coerce.number()</code>,{" "}
        <code>s.coerce.boolean()</code> or <code>s.coerce.date()</code>.
      </p>

      <p>
        Two coercions diverge from zod, deliberately:{" "}
        <code>s.coerce.number()</code> and <code>s.coerce.date()</code> leave{" "}
        <code>""</code> and <code>null</code> un-coerced (then fail the type
        check) &mdash; an empty input is not zero, and <code>null</code> is
        not 1970. <code>s.coerce.string()</code> likewise never produces{" "}
        <code>"null"</code>. <code>s.coerce.boolean()</code> matches zod
        (<code>Boolean(v)</code>) &mdash; beware that the string{" "}
        <code>"false"</code> is truthy; checkboxes give you real booleans.
      </p>

      <h3>With useForm</h3>

      <p>
        <code>schemaResolver(schema)</code> adapts a schema to the resolver
        contract documented in <code>lib/use-form.js</code>: on success the
        form receives the parsed (coerced, transformed) values; on failure
        each issue becomes a <code>{"{ type, message }"}</code> error at its
        dotted path.
      </p>

      <pre>
{`import { useForm } from "../lib/use-form.js"
import { s, schemaResolver } from "../lib/schema.js"

const { register, handleSubmit, formState } = useForm({
  defaultValues: { email: "", age: "" },
  resolver: schemaResolver(signup),
})`}
      </pre>

      <p>
        The resolver contract is the boundary, and it stays open: nothing in{" "}
        <code>useForm</code> knows about this library, and a hand-written
        resolver or <code>@hookform/resolvers</code> + zod/valibot works
        exactly as before. Object-level <code>.refine()</code> failures
        without a <code>path</code> land under <code>errors.root</code>.
      </p>

      <h3>Out of scope</h3>

      <p>
        Omitted on purpose &mdash; each is a real feature and each is a
        rabbit hole, and a small correct subset beats a large half-right
        one: intersections, discriminated unions, recursive/lazy schemas,
        branded types, codecs, async refinements, <code>.catch()</code>, and
        error maps. Unknown object keys are stripped (zod&rsquo;s default);
        there is no <code>.passthrough()</code> or <code>.strict()</code>.
      </p>
    </>
  )
}
