import { memo, useRef, useState } from "react"
import {
  useForm,
  Controller,
  FormProvider,
  useFormContext,
  useFormContextSafe,
  useFieldArray,
} from "../../lib/use-form.js"
import { Button } from "../../ui/button/button.jsx"
import "../../ui/button/button.css"
import { ComponentPreview } from "../code-example.jsx"
import { ApiReference } from "../api-reference.jsx"
import "../code-example.css"
import "../api-reference.css"

/* ================================================================== */
/*  Usage                                                              */
/* ================================================================== */

function UsageDemo() {
  const { register, handleSubmit } = useForm({
    defaultValues: { email: "" },
  })
  const [result, setResult] = useState(null)
  return (
    <div>
      <form onSubmit={handleSubmit((data) => setResult(JSON.stringify(data)))}>
        <input placeholder="Email" {...register("email")} />
        <Button type="submit">Send</Button>
      </form>
      {result && <pre>{result}</pre>}
    </div>
  )
}

/* ================================================================== */
/*  Section 1: Render-isolation test                                  */
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
    <section className="pg-section" data-pg="uf-isolation">
      <h3>Render isolation</h3>
      <p className="pg-desc">
        Typing in one registered field does not re-render siblings: values live
        in a mutable ref, not React state.
      </p>
      <ComponentPreview code={`const { register, handleSubmit } = useForm({
  defaultValues: { fieldA: "", fieldB: "" },
})

{/* Typing in one field does not re-render siblings */}
<form onSubmit={handleSubmit((data) => setSubmitted(data))}>
  <input {...register("fieldA")} />
  <input {...register("fieldB")} />
  <Button type="submit">Submit</Button>
</form>`}>
        <div>
          <form
            onSubmit={handleSubmit((data) => setSubmitted(data))}
          >
            <IsolatedField name="fieldA" register={register} />
            <IsolatedField name="fieldB" register={register} />
            <Button type="submit" data-pg="uf-isolation-submit">
              Submit
            </Button>
          </form>
          {submitted && (
            <pre data-pg="uf-isolation-result">
              {JSON.stringify(submitted)}
            </pre>
          )}
        </div>
      </ComponentPreview>
    </section>
  )
}

/* ================================================================== */
/*  Section 2: Built-in validation                                    */
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
    <section className="pg-section" data-pg="uf-builtin">
      <h3>Built-in validation</h3>
      <ComponentPreview code={`const { register, handleSubmit, formState: { errors },
  setError, clearErrors, trigger,
} = useForm({
  defaultValues: { username: "", age: "" },
  mode: "onSubmit",
})

<form onSubmit={handleSubmit(onValid, onInvalid)}>
  <input placeholder="username" {...register("username", {
    required: "Username is required",
    minLength: { value: 3, message: "Min 3 chars" },
  })} />
  {errors.username && <span>{errors.username.message}</span>}

  <input type="number" placeholder="age" {...register("age", {
    required: "Age is required",
    min: { value: 1, message: "Min 1" },
  })} />
  {errors.age && <span>{errors.age.message}</span>}

  <Button type="submit">Submit</Button>
  <Button onClick={() => setError("username", { type: "manual", message: "Already taken" })}>
    Set error
  </Button>
  <Button onClick={() => clearErrors("username")}>Clear error</Button>
  <Button onClick={() => trigger("username")}>Trigger</Button>
</form>`}>
        <div>
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
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBlockStart: "0.5rem" }}>
              <Button type="submit" data-pg="uf-builtin-submit">
                Submit
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                data-pg="uf-builtin-set-error"
                onClick={() =>
                  setError("username", {
                    type: "manual",
                    message: "Already taken",
                  })
                }
              >
                Set error
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                data-pg="uf-builtin-clear"
                onClick={() => clearErrors("username")}
              >
                Clear error
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                data-pg="uf-builtin-trigger"
                onClick={() => trigger("username")}
              >
                Trigger
              </Button>
            </div>
          </form>
          {result && (
            <pre data-pg="uf-builtin-result" style={{ whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
              {result}
            </pre>
          )}
        </div>
      </ComponentPreview>
    </section>
  )
}

/* ================================================================== */
/*  Section 3: Watch + setValue + reset                                */
/* ================================================================== */

function WatchDemo() {
  const { register, watch, setValue, reset, getValues } = useForm({
    defaultValues: { first: "Jane", last: "Doe" },
  })
  const first = watch("first")
  return (
    <section className="pg-section" data-pg="uf-watch">
      <h3>Watch / setValue / reset</h3>
      <ComponentPreview code={`const { register, watch, setValue, reset, getValues } = useForm({
  defaultValues: { first: "Jane", last: "Doe" },
})
const first = watch("first")

<input {...register("first")} />
<input {...register("last")} />
<span>watched: {first}</span>

<Button onClick={() => setValue("first", "Updated", { shouldDirty: true })}>
  setValue
</Button>
<Button onClick={() => reset()}>Reset</Button>
<Button onClick={() => console.log(getValues())}>getValues</Button>`}>
        <div>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
            <input data-pg="uf-watch-first" {...register("first")} />
            <input data-pg="uf-watch-last" {...register("last")} />
            <span>watched: </span><span data-pg="uf-watch-value">{first}</span>
          </div>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBlockStart: "0.5rem" }}>
            <Button
              type="button"
              variant="outline"
              size="sm"
              data-pg="uf-watch-setval"
              onClick={() =>
                setValue("first", "Updated", { shouldDirty: true })
              }
            >
              setValue
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              data-pg="uf-watch-reset"
              onClick={() => reset()}
            >
              Reset
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              data-pg="uf-watch-getvals"
              onClick={() => {
                const v = getValues()
                document.querySelector('[data-pg="uf-watch-getvals-out"]').textContent = JSON.stringify(v)
              }}
            >
              getValues
            </Button>
            <span data-pg="uf-watch-getvals-out"></span>
          </div>
        </div>
      </ComponentPreview>
    </section>
  )
}

/* ================================================================== */
/*  Section 4: formState (dirty / touched), C7 fix: labeled lines    */
/* ================================================================== */

function FormStateDemo() {
  const {
    register,
    formState: { isDirty, dirtyFields, touchedFields },
  } = useForm({ defaultValues: { color: "red" } })
  return (
    <section className="pg-section" data-pg="uf-formstate">
      <h3>formState</h3>
      <ComponentPreview code={`const { register, formState: { isDirty, dirtyFields, touchedFields } } =
  useForm({ defaultValues: { color: "red" } })

<input {...register("color")} />
<div>isDirty: {String(isDirty)}</div>
<div>dirtyFields: {JSON.stringify(dirtyFields)}</div>
<div>touchedFields: {JSON.stringify(touchedFields)}</div>`}>
        <div>
          <input data-pg="uf-formstate-color" {...register("color")} />
          <div style={{ marginBlockStart: "0.5rem" }}>
            isDirty: <span data-pg="uf-formstate-dirty">{String(isDirty)}</span>
          </div>
          <div>
            dirtyFields:{" "}
            <span data-pg="uf-formstate-dirtyfields">
              {JSON.stringify(dirtyFields)}
            </span>
          </div>
          <div>
            touchedFields:{" "}
            <span data-pg="uf-formstate-touched">
              {JSON.stringify(touchedFields)}
            </span>
          </div>
        </div>
      </ComponentPreview>
    </section>
  )
}

/* ================================================================== */
/*  Section 5: Controller                                             */
/* ================================================================== */

function ControllerDemo() {
  const { control, handleSubmit } = useForm({
    defaultValues: { rating: 3 },
  })
  const [result, setResult] = useState(null)
  return (
    <section className="pg-section" data-pg="uf-controller">
      <h3>Controller</h3>
      <p className="pg-desc">
        Escape hatch for controlled components that own their state and don't
        expose a DOM node for <code>register</code> to read.
      </p>
      <ComponentPreview code={`const { control, handleSubmit } = useForm({
  defaultValues: { rating: 3 },
})

<form onSubmit={handleSubmit(onSubmit)}>
  <Controller
    name="rating"
    control={control}
    render={({ field }) => (
      <input
        type="range" min="1" max="5"
        value={field.value}
        onChange={(e) => field.onChange(Number(e.target.value))}
        onBlur={field.onBlur}
        ref={field.ref}
      />
    )}
  />
  <Button type="submit">Submit</Button>
</form>`}>
        <div>
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
            <Button type="submit" data-pg="uf-controller-submit">
              Submit
            </Button>
          </form>
          {result && <pre data-pg="uf-controller-result">{result}</pre>}
        </div>
      </ComponentPreview>
    </section>
  )
}

/* ================================================================== */
/*  Section 6: FormProvider / useFormContext                           */
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

function SafeContextProbe({ hook }) {
  const ctx = useFormContextSafe()
  return <span data-pg={hook}>{ctx === null ? "null" : "methods"}</span>
}

function ContextDemo() {
  const methods = useForm({ defaultValues: { email: "" } })
  const [result, setResult] = useState(null)
  return (
    <section className="pg-section" data-pg="uf-context">
      <h3>FormProvider</h3>
      <ComponentPreview code={`const methods = useForm({ defaultValues: { email: "" } })

<FormProvider {...methods}>
  <form onSubmit={methods.handleSubmit(onSubmit)}>
    <ContextChild />
    <Button type="submit">Submit</Button>
  </form>
</FormProvider>

function ContextChild() {
  const { register, formState: { errors } } = useFormContext()
  return (
    <div>
      <input {...register("email", { required: "Email required" })} />
      {errors.email && <span>{errors.email.message}</span>}
    </div>
  )
}`}>
        <div>
          <FormProvider {...methods}>
            <form onSubmit={methods.handleSubmit((d) => setResult(JSON.stringify(d)))}>
              <ContextChild />
              <SafeContextProbe hook="uf-ctx-safe-inside" />
              <Button type="submit" data-pg="uf-ctx-submit">Submit</Button>
            </form>
          </FormProvider>
          {result && <pre data-pg="uf-ctx-result">{result}</pre>}
          <p style={{ margin: 0 }}>
            <code>useFormContextSafe</code> outside any provider:{" "}
            <SafeContextProbe hook="uf-ctx-safe-outside" />
          </p>
        </div>
      </ComponentPreview>
    </section>
  )
}

/* ================================================================== */
/*  Section 7: useFieldArray                                          */
/* ================================================================== */

function FieldArrayDemo() {
  const { control, register, handleSubmit } = useForm({
    defaultValues: { items: [{ name: "first" }] },
  })
  const { fields, append, remove, swap, move, prepend } =
    useFieldArray({ control, name: "items" })
  const [result, setResult] = useState(null)
  return (
    <section className="pg-section" data-pg="uf-fieldarray">
      <h3>useFieldArray</h3>
      <ComponentPreview code={`const { control, register, handleSubmit } = useForm({
  defaultValues: { items: [{ name: "first" }] },
})
const { fields, append, remove, swap, move, prepend } =
  useFieldArray({ control, name: "items" })

<form onSubmit={handleSubmit(onSubmit)}>
  {fields.map((f, i) => (
    <div key={f.id}>
      <input {...register(\`items.\${i}.name\`)} />
      <Button onClick={() => remove(i)}>X</Button>
    </div>
  ))}
  <Button onClick={() => append({ name: "" })}>Append</Button>
  <Button onClick={() => prepend({ name: "prepended" })}>Prepend</Button>
  <Button type="submit">Submit</Button>
</form>`}>
        <div>
          <form onSubmit={handleSubmit((d) => setResult(JSON.stringify(d)))}>
            {fields.map((f, i) => (
              <div key={f.id} style={{ display: "flex", gap: 4 }}>
                <input
                  data-pg={`uf-fa-item-${i}`}
                  {...register(`items.${i}.name`)}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  data-pg={`uf-fa-remove-${i}`}
                  onClick={() => remove(i)}
                >
                  X
                </Button>
              </div>
            ))}
            <span data-pg="uf-fa-count">{fields.length}</span>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBlockStart: "0.5rem" }}>
              <Button
                type="button"
                variant="outline"
                size="sm"
                data-pg="uf-fa-append"
                onClick={() => append({ name: "" })}
              >
                Append
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                data-pg="uf-fa-prepend"
                onClick={() => prepend({ name: "prepended" })}
              >
                Prepend
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                data-pg="uf-fa-swap"
                onClick={() => { if (fields.length >= 2) swap(0, 1) }}
              >
                Swap 0,1
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                data-pg="uf-fa-move"
                onClick={() => { if (fields.length >= 2) move(0, fields.length - 1) }}
              >
                Move 0→end
              </Button>
              <Button type="submit" data-pg="uf-fa-submit">
                Submit
              </Button>
            </div>
          </form>
          {result && <pre data-pg="uf-fa-result">{result}</pre>}
        </div>
      </ComponentPreview>
    </section>
  )
}

/* ================================================================== */
/*  Section 8: Nested paths                                           */
/* ================================================================== */

function NestedPaths() {
  const { register, handleSubmit, setValue } = useForm({
    defaultValues: {
      user: { address: { city: "Portland", zip: "97201" } },
    },
  })
  const [result, setResult] = useState(null)
  return (
    <section className="pg-section" data-pg="uf-nested">
      <h3>Nested paths</h3>
      <ComponentPreview code={`const { register, handleSubmit, setValue } = useForm({
  defaultValues: {
    user: { address: { city: "Portland", zip: "97201" } },
  },
})

<form onSubmit={handleSubmit(onSubmit)}>
  <input {...register("user.address.city")} />
  <input {...register("user.address.zip")} />
  <Button type="submit">Submit</Button>
  <Button onClick={() => setValue("user.address.city", "Seattle", { shouldDirty: true })}>
    Set city
  </Button>
</form>`}>
        <div>
          <form onSubmit={handleSubmit((d) => setResult(JSON.stringify(d)))}>
            <input
              data-pg="uf-nested-city"
              {...register("user.address.city")}
            />
            <input
              data-pg="uf-nested-zip"
              {...register("user.address.zip")}
            />
            <div style={{ display: "flex", gap: "0.5rem", marginBlockStart: "0.5rem" }}>
              <Button type="submit" data-pg="uf-nested-submit">
                Submit
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                data-pg="uf-nested-setval"
                onClick={() =>
                  setValue("user.address.city", "Seattle", {
                    shouldDirty: true,
                  })
                }
              >
                Set city
              </Button>
            </div>
          </form>
          {result && <pre data-pg="uf-nested-result">{result}</pre>}
        </div>
      </ComponentPreview>
    </section>
  )
}

/* ================================================================== */
/*  Section 9: Resolver                                               */
/* ================================================================== */

let lastResolverOptions = null

async function demoResolver(values, _context, options) {
  lastResolverOptions = options
  const errors = {}
  if (!values.email) {
    errors.email = { type: "required", message: "Email required" }
  } else if (!/\S+@\S+\.\S+/.test(values.email)) {
    errors.email = { type: "format", message: "Invalid email" }
  }
  if (values.age === "" || values.age == null) {
    errors.age = { type: "required", message: "Age required" }
  } else if (isNaN(Number(values.age)) || Number(values.age) < 1) {
    errors.age = { type: "min", message: "Min 1" }
  }
  const city = values.address?.city
  if (!city) {
    if (!errors.address) errors.address = {}
    errors.address.city = { type: "required", message: "City required" }
  }

  const hasErrors = Object.keys(errors).length > 0
  if (hasErrors) return { values: {}, errors }
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
    <section className="pg-section" data-pg="uf-resolver">
      <h3>Resolver</h3>
      <ComponentPreview code={`async function myResolver(values, _context, options) {
  const errors = {}
  if (!values.email)
    errors.email = { type: "required", message: "Email required" }
  if (Object.keys(errors).length > 0)
    return { values: {}, errors }
  return { values, errors: {} }
}

const { register, handleSubmit, formState: { errors } } = useForm({
  defaultValues: { email: "", age: "", address: { city: "" } },
  resolver: myResolver,
})

<form onSubmit={handleSubmit(onValid, onInvalid)}>
  <input placeholder="email" {...register("email")} />
  {errors.email && <span>{errors.email.message}</span>}
  <input placeholder="age" {...register("age")} />
  <input placeholder="city" {...register("address.city")} />
  <Button type="submit">Submit</Button>
</form>`}>
        <div>
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
            <Button type="submit" data-pg="uf-resolver-submit">Submit</Button>
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
        </div>
      </ComponentPreview>
    </section>
  )
}

/* ================================================================== */
/*  Section 10: Validation modes, C7 fix: labeled lines              */
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
    <section className="pg-section" data-pg="uf-modes">
      <h3>Validation modes (onBlur)</h3>
      <ComponentPreview code={`const { register, handleSubmit, formState: { errors, isSubmitted, isValid } } =
  useForm({
    defaultValues: { field: "" },
    mode: "onBlur",
    reValidateMode: "onChange",
  })

<form onSubmit={handleSubmit(() => {})}>
  <input {...register("field", { required: "Required" })} />
  {errors.field && <span>{errors.field.message}</span>}
  <div>isSubmitted: {String(isSubmitted)}</div>
  <div>isValid: {String(isValid)}</div>
  <Button type="submit">Submit</Button>
</form>`}>
        <div>
          <form onSubmit={handleSubmit(() => {})}>
            <input
              data-pg="uf-modes-field"
              {...register("field", { required: "Required" })}
            />
            {errors.field && (
              <span data-pg="uf-modes-err">{errors.field.message}</span>
            )}
            <div style={{ marginBlockStart: "0.5rem" }}>
              isSubmitted:{" "}
              <span data-pg="uf-modes-submitted">{String(isSubmitted)}</span>
            </div>
            <div>
              isValid:{" "}
              <span data-pg="uf-modes-valid">{String(isValid)}</span>
            </div>
            <Button type="submit" data-pg="uf-modes-submit" style={{ marginBlockStart: "0.5rem" }}>
              Submit
            </Button>
          </form>
        </div>
      </ComponentPreview>
    </section>
  )
}

/* ================================================================== */
/*  Docs                                                               */
/* ================================================================== */

function Docs() {
  return (
    <section className="pg-section" style={{ maxWidth: 720, lineHeight: 1.6 }}>
      <p>
        <code>lib/use-form.js</code> is a zero-dependency form engine shaped
        like <strong>react-hook-form</strong>. It replaces RHF the same way{" "}
        <code>lib/use-data-table.js</code> replaces <code>@tanstack/react-table</code>:
        matching the public API so consumers can swap in either engine without
        changing their form components.
      </p>

      <h3>Supported API surface</h3>
      <p>
        <code>{"useForm({ defaultValues, mode, reValidateMode, resolver })"}</code>{" "}
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
        <code>useFormContext</code>, <code>useFormContextSafe</code>,{" "}
        <code>useFieldArray</code>, and the <code>FormContext</code> object
        itself.
      </p>

      <h3>register vs Controller</h3>
      <p>
        <code>register</code> returns <code>{"{ name, ref, onChange, onBlur }"}</code>{" "}
        and reads values from the DOM element; typing in one registered field
        does <strong>not</strong> re-render siblings.{" "}
        <code>Controller</code> is the escape hatch for controlled components
        that own their state and don't expose a DOM node.
      </p>

      <h3>Resolver contract</h3>
      <p>
        <code>{"async (values, context, options) => { values, errors }"}</code>.{" "}
        <code>options</code> includes <code>fields</code>, <code>names</code>,{" "}
        <code>criteriaMode</code>, <code>shouldUseNativeValidation</code>.
      </p>

      <h3>useFieldArray</h3>
      <p>
        <code>{"useFieldArray({ control, name })"}</code> returns{" "}
        <code>fields</code>, <code>append</code>, <code>prepend</code>,{" "}
        <code>remove</code>, <code>insert</code>, <code>swap</code>,{" "}
        <code>move</code>, <code>update</code>, <code>replace</code>.
      </p>
    </section>
  )
}

/* ================================================================== */
/*  Page root                                                          */
/* ================================================================== */

export default function UseFormPage() {
  return (
    <>
      <h2>useForm</h2>
      <p>Zero-dependency form engine shaped like react-hook-form: <code>register</code> for DOM inputs, <code>Controller</code> for controlled components, validation, field arrays, and nested paths.</p>

      <section className="pg-section">
        <h3>Default</h3>
        <ComponentPreview code={`const { register, handleSubmit } = useForm({
  defaultValues: { email: "" },
})

<form onSubmit={handleSubmit((data) => console.log(data))}>
  <input placeholder="Email" {...register("email")} />
  <Button type="submit">Send</Button>
</form>`}>
          <UsageDemo />
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Usage</h3>
        <ComponentPreview defaultTab="code" code={`import { useForm } from "./lib/use-form"

const { register, handleSubmit } = useForm({
  defaultValues: { email: "" },
})

<form onSubmit={handleSubmit((data) => console.log(data))}>
  <input placeholder="Email" {...register("email")} />
  <Button type="submit">Send</Button>
</form>`}>
          <UsageDemo />
        </ComponentPreview>
      </section>

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

      <ApiReference title="useForm" props={[
        { name: "defaultValues", type: "object", description: "Initial field values" },
        { name: "mode", type: '"onSubmit" | "onBlur" | "onChange" | "onTouched"', default: '"onSubmit"', description: "When to validate" },
        { name: "reValidateMode", type: '"onSubmit" | "onBlur" | "onChange"', default: '"onChange"', description: "When to re-validate after first submit" },
        { name: "resolver", type: "async (values, ctx, opts) => { values, errors }", description: "External validation resolver (zod, yup, etc.)" },
      ]} />

      <ApiReference title="useFieldArray" props={[
        { name: "control", type: "Control", description: "From useForm" },
        { name: "name", type: "string", description: "Path to the array field" },
      ]} />
    </>
  )
}
