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
import { Button } from "../../ui/button/button.jsx"
import "../../ui/button/button.css"
import { ComponentPreview } from "../code-example.jsx"
import { InstallSnippet } from "../install-snippet.jsx"
import { ApiReference } from "../api-reference.jsx"
import "../code-example.css"
import "../install-snippet.css"
import "../api-reference.css"

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
          <Button
            type="submit"
            data-pg="form-engine-submit"
          >
            Save profile
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              reset()
              setResult(null)
            }}
          >
            Reset
          </Button>
        </div>
      </Form>

      {result && (
        <pre
          data-pg="form-engine-result"
          className="pg-detail"
          style={{
            marginTop: "1rem",
            padding: "0.75rem",
            borderRadius: "var(--radius)",
            background: "var(--muted)",
            overflow: "auto",
          }}
        >
          {result}
        </pre>
      )}
    </div>
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
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => remove(index)}
                  data-pg={`form-tag-remove-${index}`}
                >
                  Remove
                </Button>
              </div>
              <FormMessage />
            </FormItem>
          </FormField>
        ))}

        <div style={{ display: "flex", gap: "0.5rem" }}>
          <Button
            type="button"
            variant="outline"
            onClick={() => append({ value: "" })}
            data-pg="form-tag-add"
          >
            Add tag
          </Button>
          <Button
            type="submit"
            data-pg="form-array-submit"
          >
            Submit tags
          </Button>
        </div>
      </Form>

      {result && (
        <pre
          data-pg="form-array-result"
          className="pg-detail"
          style={{
            marginTop: "1rem",
            padding: "0.75rem",
            borderRadius: "var(--radius)",
            background: "var(--muted)",
            overflow: "auto",
          }}
        >
          {result}
        </pre>
      )}
    </div>
  )
}

/* ================================================================== */
/*  Actions-path demo                                                  */
/* ================================================================== */

async function contactAction(prevState, formData) {
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
  )
}

/* ================================================================== */
/*  Engine-agnostic proof — hand-rolled RHF-shaped context             */
/* ================================================================== */

function GroupedItemDemo() {
  const fakeForm = { formState: { errors: {} } }

  return (
    <div style={{ maxWidth: "28rem" }}>
      <Form form={fakeForm} data-pg="form-grouped">
        <FormField name="tier">
          <FormItem grouped>
            <FormLabel data-pg="form-grouped-label">Tier</FormLabel>
            <FormControl>
              <div role="radiogroup" data-pg="form-grouped-control">
                <label>
                  <input type="radio" name="tier" value="free" /> Free
                </label>{" "}
                <label>
                  <input type="radio" name="tier" value="pro" /> Pro
                </label>
              </div>
            </FormControl>
            <FormDescription>No `for` points at the group.</FormDescription>
          </FormItem>
        </FormField>
      </Form>
    </div>
  )
}

function EngineAgnosticDemo() {
  const [errors, setErrors] = useState({})

  const fakeForm = { formState: { errors } }

  return (
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
          <Button
            type="button"
            variant="destructive"
            data-pg="form-agnostic-trigger-error"
            onClick={() =>
              setErrors({
                email: { type: "manual", message: "Injected error" },
              })
            }
          >
            Inject error
          </Button>
          <Button
            type="button"
            variant="outline"
            data-pg="form-agnostic-clear"
            onClick={() => setErrors({})}
          >
            Clear
          </Button>
        </div>
      </Form>
    </div>
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

        <FormSubmit
          className="button"
          pending="Submitting..."
          data-pg="form-portal-inner"
        >
          Submit (inside form)
        </FormSubmit>
      </Form>

      <div ref={portalRef} data-pg="form-portal-target" style={{ marginTop: "0.5rem" }} />

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
  )
}

/* ================================================================== */
/*  Page                                                               */
/* ================================================================== */

export default function FormPage() {
  return (
    <>
      <h2>Form</h2>
      <p>
        ARIA wiring layer for form fields — generates ids, connects{" "}
        <code>aria-describedby</code> / <code>aria-invalid</code>, and renders
        error messages as live regions.
      </p>
      <p>
        <strong><code>ui/form</code> vs <code>ui/form-fields</code>:</strong>{" "}
        <code>ui/form</code> is the engine-agnostic primitive layer — it never
        imports the form engine (<code>lib/use-form.js</code>) and stays
        copyable on its own. <code>ui/form-fields</code> is the bound layer
        that wraps <code>lib/use-form.js</code> with pre-wired field components.
        Use <code>ui/form</code> when you bring your own engine or want full control;
        use <code>ui/form-fields</code> for the fast path with built-in validation.
      </p>

      <InstallSnippet slug="form" />

      <section className="pg-section">
        <h3>Usage</h3>
        <ComponentPreview defaultTab="code" code={`import { Form, FormField, FormItem, FormLabel,
  FormControl, FormDescription, FormMessage } from "./ui/form/form"
import "./ui/form/form.css"

<Form form={{ formState }}>
  <FormField name="email">
    <FormItem>
      <FormLabel>Email</FormLabel>
      <FormControl as={Input} {...register("email")} />
      <FormDescription>We will never share your email.</FormDescription>
      <FormMessage />
    </FormItem>
  </FormField>
</Form>`}>
          <p style={{ color: "var(--muted-foreground)", fontStyle: "italic" }}>
            See the interactive demos below for full working examples.
          </p>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Engine Path (useForm + resolver)</h3>
        <p className="pg-description">
          Uses <code>useForm</code> from <code>lib/use-form.js</code> with a
          plain resolver function. <code>FormMessage</code> renders nothing until
          an error exists, then appears as a live region.
        </p>
        <ComponentPreview code={`const { register, handleSubmit, control, formState } = useForm({
  defaultValues: { username: "", email: "", role: "" },
  resolver: profileResolver,
  mode: "onTouched",
})

<Form form={{ formState }} onSubmit={handleSubmit(onValid)}>
  <FormField name="username">
    <FormItem>
      <FormLabel>Username</FormLabel>
      <FormControl as={Input} {...register("username")} />
      <FormMessage />
    </FormItem>
  </FormField>

  {/* Controlled components use Controller */}
  <Controller name="role" control={control}
    render={({ field }) => (
      <FormField name="role">
        <FormItem>
          <FormLabel>Role</FormLabel>
          <FormControl>
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>...</SelectContent>
            </Select>
          </FormControl>
          <FormMessage />
        </FormItem>
      </FormField>
    )}
  />
</Form>`}>
          <EnginePathDemo />
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Field Array</h3>
        <p className="pg-description">
          <code>useFieldArray</code> manages a dynamic list. Each row is
          keyed by a stable <code>id</code>.
        </p>
        <ComponentPreview code={`const { fields, append, remove } = useFieldArray({ control, name: "tags" })

{fields.map((item, index) => (
  <FormField key={item.id} name={\`tags.\${index}.value\`}>
    <FormItem>
      <FormLabel>Tag {index + 1}</FormLabel>
      <FormControl as={Input} {...register(\`tags.\${index}.value\`)} />
      <FormMessage />
    </FormItem>
  </FormField>
))}
<Button onClick={() => append({ value: "" })}>Add tag</Button>`}>
          <FieldArrayDemo />
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>React 19 Actions Path</h3>
        <p className="pg-description">
          Pass an <code>action</code> prop instead of <code>form</code> +{" "}
          <code>onSubmit</code>. <code>FormSubmit</code> reads{" "}
          <code>useFormStatus</code> to disable itself while the action runs.
        </p>
        <ComponentPreview code={`async function contactAction(prevState, formData) {
  const name = formData.get("name")
  if (!name) return { errors: { name: { message: "Required" } } }
  return { success: true, errors: {} }
}

<Form action={contactAction}>
  <FormField name="name">
    <FormItem>
      <FormLabel>Name</FormLabel>
      <FormControl as={Input} name="name" />
      <FormMessage />
    </FormItem>
  </FormField>
  <FormSubmit pending="Sending...">Send</FormSubmit>
</Form>`}>
          <ActionsPathDemo />
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Grouped Fields</h3>
        <p className="pg-description">
          Set <code>grouped</code> on <code>FormItem</code> for controls that are
          groups (<code>role="radiogroup"</code>). <code>FormLabel</code> drops{" "}
          <code>htmlFor</code> and <code>FormControl</code> uses{" "}
          <code>aria-labelledby</code> instead.
        </p>
        <ComponentPreview code={`<FormField name="tier">
  <FormItem grouped>
    <FormLabel>Tier</FormLabel>
    <FormControl>
      <div role="radiogroup">
        <label><input type="radio" name="tier" value="free" /> Free</label>
        <label><input type="radio" name="tier" value="pro" /> Pro</label>
      </div>
    </FormControl>
  </FormItem>
</FormField>`}>
          <GroupedItemDemo />
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Engine-Agnostic Proof</h3>
        <p className="pg-description">
          A hand-rolled <code>{"{ formState: { errors } }"}</code> object works
          identically — the components only read <code>formState.errors</code>{" "}
          from context, so any engine that produces this shape is compatible.
        </p>
        <ComponentPreview code={`const [errors, setErrors] = useState({})
const fakeForm = { formState: { errors } }

<Form form={fakeForm}>
  <FormField name="email">
    <FormItem>
      <FormLabel>Email</FormLabel>
      <FormControl>
        <input className="input" />
      </FormControl>
      <FormMessage />
    </FormItem>
  </FormField>
</Form>`}>
          <EngineAgnosticDemo />
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Portalled Submit (Boundary Test)</h3>
        <p className="pg-description">
          <code>FormSubmit</code> via <code>createPortal</code> outside the{" "}
          <code>&lt;form&gt;</code> always reads <code>pending: false</code>{" "}
          because <code>useFormStatus</code> only sees the nearest ancestor form.
        </p>
        <ComponentPreview code={`{/* Inside <form> — reads pending correctly */}
<FormSubmit pending="Submitting...">Submit (inside form)</FormSubmit>

{/* Portalled outside <form> — always reads pending: false */}
{createPortal(
  <FormSubmit pending="Submitting...">Submit (portalled)</FormSubmit>,
  portalTarget
)}`}>
          <PortalledSubmitDemo />
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Schema Validation</h3>
        <p className="pg-description">
          For schema-based validation, use <code>lib/schema.js</code> and{" "}
          <code>schemaResolver</code> — zero-dependency, zod-shaped API built into
          the kit:
        </p>
        <ComponentPreview code={`import { s, schemaResolver } from "./lib/schema"

const schema = s.object({
  username: s.string().min(2, "At least 2 characters"),
  email: s.string().email("Enter a valid email"),
})

const { register, handleSubmit, formState } = useForm({
  resolver: schemaResolver(schema),
})`}>
          <p style={{ color: "var(--muted-foreground)", fontStyle: "italic" }}>
            The engine-path demo above uses a plain resolver. Replace it with{" "}
            <code>schemaResolver(schema)</code> for declarative validation.
          </p>
        </ComponentPreview>
        <p className="pg-description">
          External resolvers are also compatible — the resolver contract{" "}
          <code>{"(values) => { values, errors }"}</code> matches{" "}
          <code>@hookform/resolvers</code> + <code>zod</code> (verified against{" "}
          <code>@hookform/resolvers 5.5.3</code> + <code>zod 4.4.3</code>).
        </p>
      </section>

      <ApiReference title="Form" props={[
        { name: "form", type: "{ formState: { errors } }", description: "Form engine instance (from useForm or hand-rolled)" },
        { name: "action", type: "(prevState, FormData) => Promise", description: "React 19 action — replaces form + onSubmit" },
        { name: "onSubmit", type: "(e: FormEvent) => void", description: "Submit handler (use with form prop)" },
      ]} />

      <ApiReference title="FormField" props={[
        { name: "name", type: "string", description: "Dotted path into formState.errors (e.g. 'email', 'tags.0.value')" },
      ]} />

      <ApiReference title="FormItem" props={[
        { name: "grouped", type: "boolean", description: "Drop htmlFor on FormLabel, use aria-labelledby instead" },
      ]} />

      <ApiReference title="FormControl" props={[
        { name: "as", type: "ElementType", description: "Render as a specific component (e.g. Input)" },
      ]} />

      <ApiReference title="FormSubmit" props={[
        { name: "pending", type: "ReactNode", description: "Content shown while the action is pending" },
      ]} />
    </>
  )
}
