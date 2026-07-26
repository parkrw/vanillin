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
/*  Section 9 — Zod resolver (devDependency only)                      */
/* ================================================================== */

function ZodResolverDemo() {
  // Dynamic import state — zod + @hookform/resolvers loaded at mount
  const [ready, setReady] = useState(false)
  const resolverRef = useRef(null)
  const [result, setResult] = useState(null)

  // Load zod and resolver on mount
  if (!ready && !resolverRef.current) {
    resolverRef.current = "loading"
    Promise.all([
      import("zod"),
      import("@hookform/resolvers/zod"),
    ])
      .then(([zodMod, resolverMod]) => {
        const z = zodMod.z || zodMod
        const schema = z.object({
          email: z.string().min(1, "Email required").email("Invalid email"),
          age: z.coerce.number().min(1, "Min 1").max(150, "Max 150"),
        })
        resolverRef.current = resolverMod.zodResolver(schema)
        setReady(true)
      })
      .catch((err) => {
        resolverRef.current = null
        setResult("zod-load-error:" + err.message)
      })
  }

  if (!ready) {
    return (
      <section data-pg="uf-zod">
        <h3>Zod resolver</h3>
        <span data-pg="uf-zod-status">loading</span>
        {result && <pre data-pg="uf-zod-result">{result}</pre>}
      </section>
    )
  }

  return <ZodForm resolver={resolverRef.current} onResult={setResult} />
}

function ZodForm({ resolver, onResult }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: { email: "", age: "" },
    resolver,
  })
  const [result, setResult] = useState(null)
  return (
    <section data-pg="uf-zod">
      <h3>Zod resolver</h3>
      <span data-pg="uf-zod-status">ready</span>
      <form
        onSubmit={handleSubmit(
          (data) => { const r = "ok:" + JSON.stringify(data); setResult(r); onResult(r) },
          (errs) => { const r = "invalid:" + JSON.stringify(errs); setResult(r); onResult(r) }
        )}
      >
        <input data-pg="uf-zod-email" placeholder="email" {...register("email")} />
        {errors.email && (
          <span data-pg="uf-zod-err-email">{errors.email.message}</span>
        )}
        <input data-pg="uf-zod-age" placeholder="age" {...register("age")} />
        {errors.age && (
          <span data-pg="uf-zod-err-age">{errors.age.message}</span>
        )}
        <button type="submit" data-pg="uf-zod-submit">
          Submit
        </button>
      </form>
      {result && <pre data-pg="uf-zod-result">{result}</pre>}
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

export default function UseFormPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, padding: 16 }}>
      <h2>useForm</h2>
      <RenderIsolation />
      <BuiltInValidation />
      <WatchDemo />
      <FormStateDemo />
      <ControllerDemo />
      <ContextDemo />
      <FieldArrayDemo />
      <NestedPaths />
      <ZodResolverDemo />
      <ValidationModes />
    </div>
  )
}
