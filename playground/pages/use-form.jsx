import { memo, useRef, useState } from "react"
import {
  useForm,
  Controller,
  FormProvider,
  useFormContext,
  useFieldArray,
} from "../../lib/use-form.js"

/* ================================================================== */
/*  Section 1 — Render-isolation test                                  */
/*  Typing in one registered field must NOT re-render siblings.        */
/* ================================================================== */

const IsolatedField = memo(function IsolatedField({ name, register }) {
  const count = useRef(0)
  count.current++
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      <label>{name}</label>
      <input data-pg={`uf-input-${name}`} {...register(name)} />
      <span data-pg={`uf-renders-${name}`}>{count.current}</span>
    </div>
  )
})

function RenderIsolation() {
  const { register, handleSubmit } = useForm({
    defaultValues: { fieldA: "", fieldB: "" },
  })
  const [submitted, setSubmitted] = useState(null)
  return (
    <section data-pg="uf-isolation">
      <h3>Render isolation</h3>
      <form
        onSubmit={handleSubmit((data) => setSubmitted(data))}
      >
        <IsolatedField name="fieldA" register={register} />
        <IsolatedField name="fieldB" register={register} />
        <button type="submit" data-pg="uf-isolation-submit">
          Submit
        </button>
      </form>
      {submitted && (
        <pre data-pg="uf-isolation-result">
          {JSON.stringify(submitted)}
        </pre>
      )}
    </section>
  )
}

/* ================================================================== */
/*  Section 2 — Built-in validation                                    */
/* ================================================================== */

function BuiltInValidation() {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    clearErrors,
    trigger,
  } = useForm({
    defaultValues: { username: "", age: "" },
    mode: "onSubmit",
  })
  const [result, setResult] = useState(null)

  return (
    <section data-pg="uf-builtin">
      <h3>Built-in validation</h3>
      <form
        onSubmit={handleSubmit(
          (data) => setResult(JSON.stringify(data)),
          (errs) => setResult("invalid:" + JSON.stringify(errs))
        )}
      >
        <div>
          <input
            data-pg="uf-builtin-username"
            placeholder="username"
            {...register("username", {
              required: "Username is required",
              minLength: { value: 3, message: "Min 3 chars" },
            })}
          />
          {errors.username && (
            <span data-pg="uf-builtin-err-username">
              {errors.username.message}
            </span>
          )}
        </div>
        <div>
          <input
            data-pg="uf-builtin-age"
            placeholder="age"
            type="number"
            {...register("age", {
              required: "Age is required",
              min: { value: 1, message: "Min 1" },
              max: { value: 150, message: "Max 150" },
            })}
          />
          {errors.age && (
            <span data-pg="uf-builtin-err-age">{errors.age.message}</span>
          )}
        </div>
        <button type="submit" data-pg="uf-builtin-submit">
          Submit
        </button>
        <button
          type="button"
          data-pg="uf-builtin-set-error"
          onClick={() =>
            setError("username", {
              type: "manual",
              message: "Already taken",
            })
          }
        >
          Set error
        </button>
        <button
          type="button"
          data-pg="uf-builtin-clear"
          onClick={() => clearErrors("username")}
        >
          Clear error
        </button>
        <button
          type="button"
          data-pg="uf-builtin-trigger"
          onClick={() => trigger("username")}
        >
          Trigger
        </button>
      </form>
      {result && <pre data-pg="uf-builtin-result">{result}</pre>}
    </section>
  )
}

/* ================================================================== */
/*  Section 3 — Watch + setValue + reset                                */
/* ================================================================== */

function WatchDemo() {
  const { register, watch, setValue, reset, getValues } = useForm({
    defaultValues: { first: "Jane", last: "Doe" },
  })
  const first = watch("first")
  return (
    <section data-pg="uf-watch">
      <h3>Watch / setValue / reset</h3>
      <input data-pg="uf-watch-first" {...register("first")} />
      <input data-pg="uf-watch-last" {...register("last")} />
      <span data-pg="uf-watch-value">{first}</span>
      <button
        type="button"
        data-pg="uf-watch-setval"
        onClick={() =>
          setValue("first", "Updated", { shouldDirty: true })
        }
      >
        setValue
      </button>
      <button
        type="button"
        data-pg="uf-watch-reset"
        onClick={() => reset()}
      >
        Reset
      </button>
      <button
        type="button"
        data-pg="uf-watch-getvals"
        onClick={() => {
          const v = getValues()
          document.querySelector('[data-pg="uf-watch-getvals-out"]').textContent = JSON.stringify(v)
        }}
      >
        getValues
      </button>
      <span data-pg="uf-watch-getvals-out"></span>
    </section>
  )
}

/* ================================================================== */
/*  Section 4 — formState (dirty / touched)                            */
/* ================================================================== */

function FormStateDemo() {
  const {
    register,
    formState: { isDirty, dirtyFields, touchedFields },
  } = useForm({ defaultValues: { color: "red" } })
  return (
    <section data-pg="uf-formstate">
      <h3>formState</h3>
      <input data-pg="uf-formstate-color" {...register("color")} />
      <span data-pg="uf-formstate-dirty">{String(isDirty)}</span>
      <span data-pg="uf-formstate-dirtyfields">
        {JSON.stringify(dirtyFields)}
      </span>
      <span data-pg="uf-formstate-touched">
        {JSON.stringify(touchedFields)}
      </span>
    </section>
  )
}

/* ================================================================== */
/*  Section 5 — Controller                                             */
/* ================================================================== */

function ControllerDemo() {
  const { control, handleSubmit } = useForm({
    defaultValues: { rating: 3 },
  })
  const [result, setResult] = useState(null)
  return (
    <section data-pg="uf-controller">
      <h3>Controller</h3>
      <form onSubmit={handleSubmit((d) => setResult(JSON.stringify(d)))}>
        <Controller
          name="rating"
          control={control}
          render={({ field }) => (
            <input
              data-pg="uf-controller-rating"
              type="range"
              min="1"
              max="5"
              value={field.value}
              onChange={(e) => field.onChange(Number(e.target.value))}
              onBlur={field.onBlur}
              ref={field.ref}
            />
          )}
        />
        <button type="submit" data-pg="uf-controller-submit">
          Submit
        </button>
      </form>
      {result && <pre data-pg="uf-controller-result">{result}</pre>}
    </section>
  )
}

/* ================================================================== */
/*  Section 6 — FormProvider / useFormContext                           */
/* ================================================================== */

function ContextChild() {
  const { register, formState: { errors } } = useFormContext()
  return (
    <div>
      <input data-pg="uf-ctx-email" {...register("email", { required: "Email required" })} />
      {errors.email && <span data-pg="uf-ctx-err">{errors.email.message}</span>}
    </div>
  )
}

function ContextDemo() {
  const methods = useForm({ defaultValues: { email: "" } })
  const [result, setResult] = useState(null)
  return (
    <section data-pg="uf-context">
      <h3>FormProvider</h3>
      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit((d) => setResult(JSON.stringify(d)))}>
          <ContextChild />
          <button type="submit" data-pg="uf-ctx-submit">Submit</button>
        </form>
      </FormProvider>
      {result && <pre data-pg="uf-ctx-result">{result}</pre>}
    </section>
  )
}

/* ================================================================== */
/*  Section 7 — useFieldArray                                          */
/* ================================================================== */

function FieldArrayDemo() {
  const { control, register, handleSubmit } = useForm({
    defaultValues: { items: [{ name: "first" }] },
  })
  const { fields, append, remove, swap, move, prepend } =
    useFieldArray({ control, name: "items" })
  const [result, setResult] = useState(null)
  return (
    <section data-pg="uf-fieldarray">
      <h3>useFieldArray</h3>
      <form onSubmit={handleSubmit((d) => setResult(JSON.stringify(d)))}>
        {fields.map((f, i) => (
          <div key={f.id} style={{ display: "flex", gap: 4 }}>
            <input
              data-pg={`uf-fa-item-${i}`}
              {...register(`items.${i}.name`)}
            />
            <button
              type="button"
              data-pg={`uf-fa-remove-${i}`}
              onClick={() => remove(i)}
            >
              X
            </button>
          </div>
        ))}
        <span data-pg="uf-fa-count">{fields.length}</span>
        <button
          type="button"
          data-pg="uf-fa-append"
          onClick={() => append({ name: "" })}
        >
          Append
        </button>
        <button
          type="button"
          data-pg="uf-fa-prepend"
          onClick={() => prepend({ name: "prepended" })}
        >
          Prepend
        </button>
        <button
          type="button"
          data-pg="uf-fa-swap"
          onClick={() => { if (fields.length >= 2) swap(0, 1) }}
        >
          Swap 0,1
        </button>
        <button
          type="button"
          data-pg="uf-fa-move"
          onClick={() => { if (fields.length >= 2) move(0, fields.length - 1) }}
        >
          Move 0→end
        </button>
        <button type="submit" data-pg="uf-fa-submit">
          Submit
        </button>
      </form>
      {result && <pre data-pg="uf-fa-result">{result}</pre>}
    </section>
  )
}

/* ================================================================== */
/*  Section 8 — Nested paths                                           */
/* ================================================================== */

function NestedPaths() {
  const { register, handleSubmit, setValue, getValues } = useForm({
    defaultValues: {
      user: { address: { city: "Portland", zip: "97201" } },
    },
  })
  const [result, setResult] = useState(null)
  return (
    <section data-pg="uf-nested">
      <h3>Nested paths</h3>
      <form onSubmit={handleSubmit((d) => setResult(JSON.stringify(d)))}>
        <input
          data-pg="uf-nested-city"
          {...register("user.address.city")}
        />
        <input
          data-pg="uf-nested-zip"
          {...register("user.address.zip")}
        />
        <button type="submit" data-pg="uf-nested-submit">
          Submit
        </button>
        <button
          type="button"
          data-pg="uf-nested-setval"
          onClick={() =>
            setValue("user.address.city", "Seattle", {
              shouldDirty: true,
            })
          }
        >
          Set city
        </button>
      </form>
      {result && <pre data-pg="uf-nested-result">{result}</pre>}
    </section>
  )
}

/* ================================================================== */
/*  Section 9 — Resolver (hand-written, same shape as zodResolver)     */
/* ================================================================== */

/**
 * Hand-written resolver in the exact @hookform/resolvers output shape.
 * Validates email (required + format), age (required, coerced to number),
 * and address.city (required, nested path).
 * Stashes the options it receives so the test can inspect them.
 */
let lastResolverOptions = null

async function demoResolver(values, _context, options) {
  lastResolverOptions = options
  const errors = {}
  // email: required + basic format
  if (!values.email) {
    errors.email = { type: "required", message: "Email required" }
  } else if (!/\S+@\S+\.\S+/.test(values.email)) {
    errors.email = { type: "format", message: "Invalid email" }
  }
  // age: required, coerce to number
  if (values.age === "" || values.age == null) {
    errors.age = { type: "required", message: "Age required" }
  } else if (isNaN(Number(values.age)) || Number(values.age) < 1) {
    errors.age = { type: "min", message: "Min 1" }
  }
  // address.city: required (nested path)
  const city = values.address?.city
  if (!city) {
    if (!errors.address) errors.address = {}
    errors.address.city = { type: "required", message: "City required" }
  }

  const hasErrors = Object.keys(errors).length > 0
  if (hasErrors) return { values: {}, errors }
  // Coerce age to number in returned values (like zod coerce would)
  return {
    values: { ...values, age: Number(values.age) },
    errors: {},
  }
}

function ResolverDemo() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: { email: "", age: "", address: { city: "" } },
    resolver: demoResolver,
  })
  const [result, setResult] = useState(null)
  return (
    <section data-pg="uf-resolver">
      <h3>Resolver</h3>
      <form
        onSubmit={handleSubmit(
          (data) => setResult("ok:" + JSON.stringify(data)),
          (errs) => setResult("invalid:" + JSON.stringify(errs))
        )}
      >
        <input data-pg="uf-resolver-email" placeholder="email" {...register("email")} />
        {errors.email && (
          <span data-pg="uf-resolver-err-email">{errors.email.message}</span>
        )}
        <input data-pg="uf-resolver-age" placeholder="age" {...register("age")} />
        {errors.age && (
          <span data-pg="uf-resolver-err-age">{errors.age.message}</span>
        )}
        <input
          data-pg="uf-resolver-city"
          placeholder="city"
          {...register("address.city")}
        />
        {errors.address?.city && (
          <span data-pg="uf-resolver-err-city">{errors.address.city.message}</span>
        )}
        <button type="submit" data-pg="uf-resolver-submit">Submit</button>
      </form>
      {result && <pre data-pg="uf-resolver-result">{result}</pre>}
      <pre data-pg="uf-resolver-opts" style={{ display: "none" }}>
        {lastResolverOptions ? JSON.stringify({
          hasFields: typeof lastResolverOptions.fields === "object",
          hasNames: Array.isArray(lastResolverOptions.names),
          criteriaMode: lastResolverOptions.criteriaMode,
          shouldUseNativeValidation: lastResolverOptions.shouldUseNativeValidation,
        }) : ""}
      </pre>
    </section>
  )
}

/* ================================================================== */
/*  Section 10 — Validation modes                                      */
/* ================================================================== */

function ValidationModes() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitted, isValid },
  } = useForm({
    defaultValues: { field: "" },
    mode: "onBlur",
    reValidateMode: "onChange",
  })
  return (
    <section data-pg="uf-modes">
      <h3>Validation modes (onBlur)</h3>
      <form onSubmit={handleSubmit(() => {})}>
        <input
          data-pg="uf-modes-field"
          {...register("field", { required: "Required" })}
        />
        {errors.field && (
          <span data-pg="uf-modes-err">{errors.field.message}</span>
        )}
        <span data-pg="uf-modes-submitted">{String(isSubmitted)}</span>
        <span data-pg="uf-modes-valid">{String(isValid)}</span>
        <button type="submit" data-pg="uf-modes-submit">
          Submit
        </button>
      </form>
    </section>
  )
}

/* ================================================================== */
/*  Page root                                                          */
/* ================================================================== */

function Docs() {
  return (
    <section style={{ maxWidth: 720, lineHeight: 1.6 }}>
      <p>
        <code>lib/use-form.js</code> is a zero-dependency form engine shaped
        like <b>react-hook-form</b>. It replaces RHF the same way{" "}
        <code>lib/use-data-table.js</code> replaces <code>@tanstack/react-table</code>:
        matching the public API so consumers can swap in either engine without
        changing their form components.
      </p>

      <h3>Supported API surface</h3>
      <p>
        <code>useForm({"{"} defaultValues, mode, reValidateMode, resolver {"}"})</code>{" "}
        returns: <code>register</code>, <code>handleSubmit</code>,{" "}
        <code>watch</code>, <code>getValues</code>, <code>setValue</code>,{" "}
        <code>reset</code>, <code>setError</code>, <code>clearErrors</code>,{" "}
        <code>trigger</code>, <code>control</code>, <code>formState</code>.
      </p>
      <p>
        <code>formState</code> exposes: <code>errors</code>,{" "}
        <code>isDirty</code>, <code>dirtyFields</code>,{" "}
        <code>touchedFields</code>, <code>isSubmitting</code>,{" "}
        <code>isSubmitted</code>, <code>isValid</code>,{" "}
        <code>submitCount</code>.
      </p>
      <p>
        Additional exports: <code>Controller</code>, <code>FormProvider</code>,{" "}
        <code>useFormContext</code>, <code>useFieldArray</code>.
      </p>
      <p>
        Path helpers <code>getByPath</code>, <code>setByPath</code>,{" "}
        <code>unsetByPath</code> are exported for reuse (dotted paths like{" "}
        <code>user.address.city</code> and array indices like{" "}
        <code>items.2.name</code>).
      </p>

      <h3>Out of scope (deviations from RHF)</h3>
      <p>
        <code>shouldUnregister</code>, <code>criteriaMode: "all"</code>,{" "}
        <code>setFocus</code>, <code>getFieldState</code> subscriptions,{" "}
        <code>delayError</code>, devtools integration, native validation mode.
        These are documented deviations; consumers using any of these features
        must keep the real RHF.
      </p>

      <h3>register vs Controller</h3>
      <p>
        <code>register</code> returns <code>{"{"} name, ref, onChange, onBlur {"}"}</code>{" "}
        and reads values from the DOM element. This is the performance
        property: typing in one registered field does <b>not</b> re-render
        siblings (values live in a mutable ref, not React state).
      </p>
      <p>
        <code>Controller</code> is the escape hatch for controlled components
        that own their state and don't expose a DOM node for{" "}
        <code>register</code> to read. Our <code>Select</code>,{" "}
        <code>Combobox</code>, <code>Calendar</code>, and <code>Checkbox</code>{" "}
        (all <code>useControllableState</code>-based) need{" "}
        <code>Controller</code>.
      </p>

      <h3>Resolver contract</h3>
      <p>
        <code>async (values, context, options) =&gt; {"{"} values, errors {"}"}</code>.{" "}
        <code>options</code> includes <code>fields</code>, <code>names</code>,{" "}
        <code>criteriaMode</code>, <code>shouldUseNativeValidation</code>.
        Errors are nested objects keyed by dotted path, each{" "}
        <code>{"{"} type, message {"}"}</code>.
      </p>
      <p>
        <b>Verified once, on 2026-07-26:</b> <code>@hookform/resolvers</code>{" "}
        <code>zodResolver</code> ran unmodified against this contract
        (<code>@hookform/resolvers</code> 5.5.3, <code>zod</code> 4.4.3). Zod
        coercion (e.g. <code>z.coerce.number()</code>) works and nested error
        paths resolve correctly. Neither package is a dependency of this repo —
        vanillin stays zero-dependency, and our own tests exercise the contract
        with a hand-written resolver.
      </p>
      <p>
        If you want zod validation, install{" "}
        <code>@hookform/resolvers</code> and <code>zod</code> in{" "}
        <i>your</i> app. You will also need <code>react-hook-form</code>{" "}
        present, because <code>@hookform/resolvers</code> imports{" "}
        <code>appendErrors</code> from it at module level (used only for{" "}
        <code>criteriaMode: "all"</code>, which is out of scope here).
      </p>

      <h3>useFieldArray</h3>
      <p>
        <code>useFieldArray({"{"} control, name {"}"} )</code> returns{" "}
        <code>fields</code> (array with auto-generated <code>id</code> keys),{" "}
        <code>append</code>, <code>prepend</code>, <code>remove</code>,{" "}
        <code>insert</code>, <code>swap</code>, <code>move</code>,{" "}
        <code>update</code>, <code>replace</code>. Register nested fields
        with dotted paths: <code>register(`items.${"{"}i{"}"}.name`)</code>.
      </p>
    </section>
  )
}

export default function UseFormPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, padding: 16 }}>
      <h2>useForm</h2>
      <Docs />
      <RenderIsolation />
      <BuiltInValidation />
      <WatchDemo />
      <FormStateDemo />
      <ControllerDemo />
      <ContextDemo />
      <FieldArrayDemo />
      <NestedPaths />
      <ResolverDemo />
      <ValidationModes />
    </div>
  )
}
