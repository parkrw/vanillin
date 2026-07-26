import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import {
  useForm,
  Controller,
  useFieldArray,
} from "../../lib/use-form.js"
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  FormSubmit,
} from "../../ui/form/form.jsx"
import { Input } from "../../ui/input/input.jsx"
import { Checkbox } from "../../ui/checkbox/checkbox.jsx"
import { Switch } from "../../ui/switch/switch.jsx"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "../../ui/select/select.jsx"

import "../../ui/form/form.css"
import "../../ui/field/field.css"
import "../../ui/input/input.css"
import "../../ui/label/label.css"
import "../../ui/checkbox/checkbox.css"
import "../../ui/switch/switch.css"
import "../../ui/select/select.css"
import "../../ui/button/button.css"

/* ================================================================== */
/*  Resolver — plain function, no zod dependency                       */
/* ================================================================== */

function profileResolver(values) {
  const errors = {}
  if (!values.username || values.username.length < 2) {
    errors.username = {
      type: "minLength",
      message: "Username must be at least 2 characters",
    }
  }
  if (!values.email || !/^[^@]+@[^@]+$/.test(values.email)) {
    errors.email = { type: "pattern", message: "Enter a valid email address" }
  }
  if (!values.role) {
    errors.role = { type: "required", message: "Pick a role" }
  }
  return {
    values: Object.keys(errors).length === 0 ? values : undefined,
    errors,
  }
}

/* ================================================================== */
/*  Engine-path demo                                                   */
/* ================================================================== */

function EnginePathDemo() {
  const { register, handleSubmit, control, formState, reset } = useForm({
    defaultValues: {
      username: "",
      email: "",
      role: "",
      marketing: false,
      notifications: true,
    },
    resolver: profileResolver,
    mode: "onTouched",
  })

  const [result, setResult] = useState(null)

  function onValid(data) {
    setResult(JSON.stringify(data, null, 2))
  }

  return (
    <section className="pg-section">
      <h3>Engine path (useForm + resolver)</h3>
      <p className="pg-description">
        Uses <code>useForm</code> from <code>lib/use-form.js</code> with a
        plain resolver function. The <code>Form</code> component reads{" "}
        <code>formState</code> from its <code>form</code> prop and provides it
        via context. <code>FormMessage</code> renders nothing until an error
        exists, then appears as a live region (<code>role="alert"</code>).
      </p>

      <div style={{ maxWidth: "28rem" }}>
        <Form
          form={{ formState }}
          onSubmit={handleSubmit(onValid)}
          data-pg="form-engine"
        >
          {/* Input via register (uncontrolled) */}
          <FormField name="username">
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl
                as={Input}
                placeholder="caseynolan"
                data-pg="form-username"
                {...register("username")}
              />
              <FormDescription>Your public display name.</FormDescription>
              <FormMessage />
            </FormItem>
          </FormField>

          <FormField name="email">
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl
                as={Input}
                type="email"
                placeholder="you@example.com"
                data-pg="form-email"
                {...register("email")}
              />
              <FormDescription>We will never share your email.</FormDescription>
              <FormMessage />
            </FormItem>
          </FormField>

          {/* Controller-wired Select */}
          <Controller
            name="role"
            control={control}
            render={({ field }) => (
              <FormField name="role">
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <FormControl>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      data-pg="form-role-select"
                    >
                      <SelectTrigger data-pg="form-role-trigger">
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="editor">Editor</SelectItem>
                        <SelectItem value="viewer">Viewer</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormDescription>
                    Controls what the user can access.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              </FormField>
            )}
          />

          {/* Controller-wired Checkbox */}
          <Controller
            name="marketing"
            control={control}
            render={({ field }) => (
              <FormField name="marketing">
                <FormItem>
                  <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-pg="form-marketing"
                      />
                    </FormControl>
                    <FormLabel style={{ cursor: "pointer" }}>
                      Receive marketing emails
                    </FormLabel>
                  </div>
                  <FormDescription>
                    Opt in to occasional product updates.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              </FormField>
            )}
          />

          {/* Controller-wired Switch */}
          <Controller
            name="notifications"
            control={control}
            render={({ field }) => (
              <FormField name="notifications">
                <FormItem>
                  <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-pg="form-notifications"
                      />
                    </FormControl>
                    <FormLabel>Push notifications</FormLabel>
                  </div>
                  <FormMessage />
                </FormItem>
              </FormField>
            )}
          />

          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              type="submit"
              className="button"
              data-pg="form-engine-submit"
            >
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
            data-pg="form-engine-result"
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
/*  Field-array demo                                                   */
/* ================================================================== */

function FieldArrayDemo() {
  const { register, handleSubmit, control, formState } = useForm({
    defaultValues: { tags: [{ value: "react" }] },
  })
  const { fields, append, remove } = useFieldArray({ control, name: "tags" })
  const [result, setResult] = useState(null)

  return (
    <section className="pg-section">
      <h3>Field array</h3>
      <p className="pg-description">
        <code>useFieldArray</code> manages a dynamic list. Each row is
        keyed by a stable <code>id</code> generated by the array helper.
        <code> append</code>, <code>remove</code>, <code>insert</code>,{" "}
        <code>swap</code>, <code>move</code>, <code>update</code>, and{" "}
        <code>replace</code> are all available.
      </p>

      <div style={{ maxWidth: "28rem" }}>
        <Form
          form={{ formState }}
          onSubmit={handleSubmit((data) =>
            setResult(JSON.stringify(data, null, 2))
          )}
          data-pg="form-array"
        >
          {fields.map((item, index) => (
            <FormField key={item.id} name={`tags.${index}.value`}>
              <FormItem>
                <FormLabel>Tag {index + 1}</FormLabel>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <FormControl
                    as={Input}
                    data-pg={`form-tag-${index}`}
                    {...register(`tags.${index}.value`, {
                      required: "Tag cannot be empty",
                    })}
                  />
                  <button
                    type="button"
                    className="button button--outline"
                    onClick={() => remove(index)}
                    data-pg={`form-tag-remove-${index}`}
                  >
                    Remove
                  </button>
                </div>
                <FormMessage />
              </FormItem>
            </FormField>
          ))}

          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              type="button"
              className="button button--outline"
              onClick={() => append({ value: "" })}
              data-pg="form-tag-add"
            >
              Add tag
            </button>
            <button
              type="submit"
              className="button"
              data-pg="form-array-submit"
            >
              Submit tags
            </button>
          </div>
        </Form>

        {result && (
          <pre
            data-pg="form-array-result"
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
/*  Actions-path demo                                                  */
/* ================================================================== */

async function contactAction(prevState, formData) {
  // Simulate network delay
  await new Promise((r) => setTimeout(r, 1500))

  const name = formData.get("name")
  const message = formData.get("message")
  const errors = {}

  if (!name || name.length < 2) {
    errors.name = { type: "required", message: "Name is required" }
  }
  if (!message || message.length < 10) {
    errors.message = {
      type: "minLength",
      message: "Message must be at least 10 characters",
    }
  }

  if (Object.keys(errors).length > 0) return { errors }
  return { success: true, errors: {} }
}

function ActionsPathDemo() {
  return (
    <section className="pg-section">
      <h3>React 19 Actions path</h3>
      <p className="pg-description">
        When <code>Form</code> receives an <code>action</code> prop, it
        uses <code>useActionState</code> internally. No client-side form
        engine is needed. <code>FormSubmit</code> reads{" "}
        <code>useFormStatus</code> to disable itself and show a pending
        indicator while the action runs.
      </p>
      <p className="pg-description">
        <strong>Gotcha:</strong> <code>useFormStatus</code> only reports
        the pending state of the nearest ancestor{" "}
        <code>&lt;form&gt;</code>. A submit button rendered in a portalled
        dialog footer will always read <code>pending: false</code>.
      </p>

      <div style={{ maxWidth: "28rem" }}>
        <Form action={contactAction} data-pg="form-actions">
          <FormField name="name">
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl as={Input} name="name" data-pg="form-action-name" />
              <FormMessage />
            </FormItem>
          </FormField>

          <FormField name="message">
            <FormItem>
              <FormLabel>Message</FormLabel>
              <FormControl>
                <textarea
                  name="message"
                  className="input"
                  rows={3}
                  data-pg="form-action-message"
                  style={{ resize: "vertical" }}
                />
              </FormControl>
              <FormDescription>At least 10 characters.</FormDescription>
              <FormMessage />
            </FormItem>
          </FormField>

          <FormSubmit
            className="button"
            pending="Sending..."
            data-pg="form-action-submit"
          >
            Send message
          </FormSubmit>
        </Form>
      </div>
    </section>
  )
}

/* ================================================================== */
/*  Docs prose                                                         */
/* ================================================================== */

function Docs() {
  return (
    <section className="pg-section">
      <h3>API</h3>
      <div className="pg-description" style={{ maxWidth: "42rem" }}>
        <p>
          <code>ui/form/</code> is the ARIA wiring layer. It provides field-name
          context, generates ids, and connects{" "}
          <code>aria-describedby</code> / <code>aria-invalid</code> to each
          field's error state. <strong>It never imports the form engine</strong>{" "}
          (<code>lib/use-form.js</code>), making it engine-agnostic.
        </p>

        <h4>Composition</h4>
        <p>
          A form field <em>is</em> a field, so <code>FormLabel</code> renders{" "}
          <code>Label</code> (<code>ui/label</code>) and{" "}
          <code>FormDescription</code> / <code>FormMessage</code> render{" "}
          <code>FieldDescription</code> / <code>FieldError</code>{" "}
          (<code>ui/field</code>). Sizing and colour live there; only the error
          weight and its entrance animation are <code>form.css</code>. Copying{" "}
          <code>ui/form/</code> therefore means copying{" "}
          <code>ui/field/</code> and <code>ui/label/</code> too, and importing
          both stylesheets.
        </p>

        <h4>Engine-agnostic contract</h4>
        <p>
          <code>Form</code> accepts a <code>form</code> prop whose shape must
          include <code>{"{ formState: { errors } }"}</code>. Both our{" "}
          <code>useForm</code> and React Hook Form produce this shape, so the
          same markup works with either engine. Errors are keyed by dotted path;
          each value is <code>{"{ type, message }"}</code>.
        </p>

        <h4>React 19 Actions path</h4>
        <p>
          Pass an <code>action</code> prop instead of <code>form</code> +{" "}
          <code>onSubmit</code>. <code>Form</code> internally calls{" "}
          <code>useActionState</code> and submits via the native{" "}
          <code>action</code> attribute. The action receives{" "}
          <code>(prevState, formData)</code> and returns{" "}
          <code>{"{ errors }"}</code> (or <code>{"{ success: true }"}</code>).
          Those errors land in the same context, so <code>FormMessage</code>{" "}
          works identically.
        </p>

        <h4>FormSubmit + useFormStatus</h4>
        <p>
          <code>FormSubmit</code> reads <code>useFormStatus</code> to disable
          itself and optionally swap its children for a pending indicator. It{" "}
          <strong>must</strong> be a descendant of the{" "}
          <code>&lt;form&gt;</code>; rendering it inside a portalled dialog
          footer will always read <code>pending: false</code>.
        </p>

        <h4>Controlled components</h4>
        <p>
          Components that own their state (Select, Checkbox, Switch, Calendar,
          etc.) cannot be wired via <code>register</code>. Use{" "}
          <code>Controller</code> from <code>lib/use-form.js</code> to bridge{" "}
          <code>field.value</code> / <code>field.onChange</code> to the
          component's controlled-state props.
        </p>

        <h4>Zod / external resolvers</h4>
        <p>
          The demos validate with a plain resolver function. If you want schema
          validation, install <code>@hookform/resolvers</code> and{" "}
          <code>zod</code> in your own project. The resolver contract{" "}
          <code>
            {"async (values, context, options) => { values, errors }"}
          </code>{" "}
          is compatible (verified against <code>@hookform/resolvers 5.5.3</code>{" "}
          + <code>zod 4.4.3</code>).
        </p>

        <h4>Anatomy</h4>
        <table
          style={{
            width: "100%",
            fontSize: "0.875rem",
            borderCollapse: "collapse",
          }}
        >
          <thead>
            <tr>
              <th style={{ textAlign: "left", padding: "0.25rem 0.5rem", borderBottom: "1px solid var(--border)" }}>Component</th>
              <th style={{ textAlign: "left", padding: "0.25rem 0.5rem", borderBottom: "1px solid var(--border)" }}>Renders</th>
              <th style={{ textAlign: "left", padding: "0.25rem 0.5rem", borderBottom: "1px solid var(--border)" }}>Purpose</th>
            </tr>
          </thead>
          <tbody>
            {[
              ["Form", "<form>", "Provider + form element; accepts form or action"],
              ["FormField", "context only", "Sets field name context"],
              ["FormItem", "<div>", "Mints id; wraps one field's label/control/description/message"],
              ["FormLabel", "<label>", "htmlFor + error-state styling"],
              ["FormControl", "as or clone", "ARIA: id, aria-describedby, aria-invalid"],
              ["FormDescription", "<p>", "Helper text, linked via aria-describedby"],
              ["FormMessage", "<p role='alert'>", "Error message; renders nothing when no error"],
              ["FormSubmit", "<button>", "Reads useFormStatus for pending state"],
              ["useFormField", "hook", "Reads field name, error, and derived ids"],
            ].map(([name, renders, purpose]) => (
              <tr key={name}>
                <td style={{ padding: "0.25rem 0.5rem", borderBottom: "1px solid var(--border)" }}>
                  <code>{name}</code>
                </td>
                <td style={{ padding: "0.25rem 0.5rem", borderBottom: "1px solid var(--border)" }}>
                  <code>{renders}</code>
                </td>
                <td style={{ padding: "0.25rem 0.5rem", borderBottom: "1px solid var(--border)" }}>
                  {purpose}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

/* ================================================================== */
/*  Engine-agnostic proof — hand-rolled RHF-shaped context             */
/* ================================================================== */

function EngineAgnosticDemo() {
  const [errors, setErrors] = useState({})

  // Hand-rolled "form" object matching the RHF shape — no useForm call
  const fakeForm = { formState: { errors } }

  return (
    <section className="pg-section">
      <h3>Engine-agnostic proof</h3>
      <p className="pg-description">
        This section uses a hand-rolled form context (no{" "}
        <code>useForm</code>). The same <code>Form</code> /{" "}
        <code>FormField</code> / <code>FormItem</code> anatomy works
        identically because the components only read{" "}
        <code>formState.errors</code> from context.
      </p>

      <div style={{ maxWidth: "28rem" }}>
        <Form form={fakeForm} data-pg="form-agnostic">
          <FormField name="email">
            <FormItem>
              <FormLabel data-pg="form-agnostic-label">Email</FormLabel>
              <FormControl>
                <input
                  className="input"
                  data-pg="form-agnostic-input"
                  placeholder="you@example.com"
                />
              </FormControl>
              <FormDescription data-pg="form-agnostic-desc">
                Hand-rolled context, no engine.
              </FormDescription>
              <FormMessage data-pg="form-agnostic-msg" />
            </FormItem>
          </FormField>

          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              type="button"
              className="button button--destructive"
              data-pg="form-agnostic-trigger-error"
              onClick={() =>
                setErrors({
                  email: { type: "manual", message: "Injected error" },
                })
              }
            >
              Inject error
            </button>
            <button
              type="button"
              className="button button--outline"
              data-pg="form-agnostic-clear"
              onClick={() => setErrors({})}
            >
              Clear
            </button>
          </div>
        </Form>
      </div>
    </section>
  )
}

/* ================================================================== */
/*  Portalled FormSubmit — useFormStatus boundary test                  */
/* ================================================================== */

function PortalledSubmitDemo() {
  const portalRef = useRef(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  return (
    <section className="pg-section">
      <h3>Portalled submit (boundary test)</h3>
      <p className="pg-description">
        <code>FormSubmit</code> rendered via <code>createPortal</code>{" "}
        outside the <code>&lt;form&gt;</code> always reads{" "}
        <code>pending: false</code> because <code>useFormStatus</code>{" "}
        only sees the nearest ancestor form.
      </p>

      <div style={{ maxWidth: "28rem" }}>
        <Form
          action={async (prev, fd) => {
            await new Promise((r) => setTimeout(r, 1000))
            return { errors: {} }
          }}
          data-pg="form-portal"
        >
          <FormField name="test">
            <FormItem>
              <FormLabel>Test field</FormLabel>
              <FormControl as={Input} name="test" defaultValue="hello" />
            </FormItem>
          </FormField>

          {/* In-form submit — reads pending correctly */}
          <FormSubmit
            className="button"
            pending="Submitting..."
            data-pg="form-portal-inner"
          >
            Submit (inside form)
          </FormSubmit>
        </Form>

        {/* Portal target */}
        <div ref={portalRef} data-pg="form-portal-target" style={{ marginTop: "0.5rem" }} />

        {/* Portalled submit — always reads pending: false */}
        {mounted && portalRef.current &&
          createPortal(
            <FormSubmit
              className="button button--outline"
              pending="Submitting..."
              data-pg="form-portal-outer"
            >
              Submit (portalled)
            </FormSubmit>,
            portalRef.current
          )}
      </div>
    </section>
  )
}

/* ================================================================== */
/*  Page                                                               */
/* ================================================================== */

export default function FormPage() {
  return (
    <>
      <h2>Form</h2>
      <Docs />
      <EnginePathDemo />
      <FieldArrayDemo />
      <ActionsPathDemo />
      <EngineAgnosticDemo />
      <PortalledSubmitDemo />
    </>
  )
}
