import { useState } from "react"
import { s, schemaResolver } from "../../lib/schema.js"
import { useForm } from "../../lib/use-form.js"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../../ui/form/form.jsx"
import { TextField, TextareaField } from "../../ui/form-fields/form-fields.jsx"
import { Input } from "../../ui/input/input.jsx"

import "../../ui/form/form.css"
import "../../ui/form-fields/form-fields.css"
import "../../ui/field/field.css"
import "../../ui/input/input.css"
import "../../ui/textarea/textarea.css"
import "../../ui/label/label.css"
import "../../ui/button/button.css"

/* ================================================================== */
/*  Schema — the resolver from lib/schema.js (task 62)                 */
/* ================================================================== */

const profileSchema = s.object({
  username: s.string().min(2, "Username must be at least 2 characters"),
  bio: s.string().max(160, "Keep the bio under 160 characters"),
})

/* ================================================================== */
/*  Docs                                                               */
/* ================================================================== */

function Docs() {
  return (
    <section className="pg-section">
      <h3>API</h3>
      <div className="pg-description" style={{ maxWidth: "42rem" }}>
        <p>
          <code>ui/form-fields/</code> is the layer that knows about both{" "}
          <code>lib/use-form.js</code> and <code>ui/form/</code>. It exists
          because those two deliberately do not know about each other:{" "}
          <code>ui/form</code> is engine-agnostic and inlines its own path
          helper rather than importing the engine. Something has to join them,
          and this is it.
        </p>
        <p>
          A bound field is one element. It renders{" "}
          <code>FormField → FormItem → FormLabel → FormControl → control →
          FormDescription → FormMessage</code>{" "}
          and picks <code>register</code> or <code>Controller</code> for you.
        </p>

        <h4>Props</h4>
        <p>
          <code>name</code> (required), <code>label</code>,{" "}
          <code>description</code>, <code>rules</code>, and{" "}
          <code>control</code> — the object from <code>useForm</code>. Omit{" "}
          <code>control</code> and the field reads it from a{" "}
          <code>&lt;FormProvider&gt;</code> ancestor; with neither it throws by
          name. Everything else is forwarded to the underlying control.
        </p>
      </div>
    </section>
  )
}

/* ================================================================== */
/*  Bound form                                                         */
/* ================================================================== */

function BoundFormDemo() {
  const { handleSubmit, control, formState, reset } = useForm({
    defaultValues: { username: "", bio: "" },
    resolver: schemaResolver(profileSchema),
    mode: "onTouched",
  })
  const [result, setResult] = useState(null)

  return (
    <section className="pg-section">
      <h3>Bound form</h3>
      <p className="pg-description">
        Two fields, two lines. <code>TextField</code> and{" "}
        <code>TextareaField</code> are native inputs, so the binding wires them
        with <code>register</code> — no <code>Controller</code>, no re-render
        per keystroke.
      </p>

      <div style={{ maxWidth: "28rem" }}>
        <Form
          form={{ formState }}
          onSubmit={handleSubmit((data) =>
            setResult(JSON.stringify(data, null, 2))
          )}
          data-pg="ff-bound"
        >
          <TextField
            name="username"
            control={control}
            label="Username"
            description="Your public display name."
            placeholder="caseynolan"
            data-pg="ff-username"
          />

          <TextareaField
            name="bio"
            control={control}
            label="Bio"
            description="A sentence or two. 160 characters max."
            rows={3}
            data-pg="ff-bio"
          />

          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button type="submit" className="button" data-pg="ff-submit">
              Save profile
            </button>
            <button
              type="button"
              className="button button--outline"
              onClick={() => {
                reset()
                setResult(null)
              }}
            >
              Reset
            </button>
          </div>
        </Form>

        {result && (
          <pre
            data-pg="ff-result"
            style={{
              marginTop: "1rem",
              padding: "0.75rem",
              fontSize: "0.8125rem",
              borderRadius: "var(--radius)",
              background: "var(--muted)",
              overflow: "auto",
            }}
          >
            {result}
          </pre>
        )}
      </div>
    </section>
  )
}

/* ================================================================== */
/*  Parity — bound field vs the same field hand-wired                  */
/* ================================================================== */

const paritySchema = s.object({
  bound: s.string().min(2, "Too short"),
  hand: s.string().min(2, "Too short"),
})

function ParityDemo() {
  const { register, handleSubmit, control, formState } = useForm({
    defaultValues: { bound: "", hand: "" },
    resolver: schemaResolver(paritySchema),
  })

  return (
    <section className="pg-section">
      <h3>Bound vs hand-wired</h3>
      <p className="pg-description">
        The same field twice: once as <code>TextField</code>, once written out
        by hand. The rendered ids, <code>aria-describedby</code> and{" "}
        <code>aria-invalid</code> are identical — the binding is a shorthand
        for exactly this markup, not a different thing.
      </p>

      <div style={{ maxWidth: "28rem" }}>
        <Form
          form={{ formState }}
          onSubmit={handleSubmit(() => {})}
          data-pg="ff-parity"
        >
          <TextField
            name="bound"
            control={control}
            label="Handle"
            description="Two characters or more."
            data-pg="ff-parity-bound"
          />

          <FormField name="hand">
            <FormItem>
              <FormLabel>Handle</FormLabel>
              <FormControl
                as={Input}
                data-pg="ff-parity-hand"
                {...register("hand")}
              />
              <FormDescription>Two characters or more.</FormDescription>
              <FormMessage />
            </FormItem>
          </FormField>

          <button type="submit" className="button" data-pg="ff-parity-submit">
            Validate both
          </button>
        </Form>
      </div>
    </section>
  )
}

/* ================================================================== */
/*  Page                                                               */
/* ================================================================== */

export default function FormFieldsPage() {
  return (
    <>
      <h2>Form Fields</h2>
      <Docs />
      <BoundFormDemo />
      <ParityDemo />
    </>
  )
}
