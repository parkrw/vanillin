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
import {
  CheckboxField,
  RadioGroupField,
  SelectField,
  SwitchField,
  TextField,
  TextareaField,
} from "../../ui/form-fields/form-fields.jsx"
import { FormFieldBinding } from "../../ui/form-fields/form-fields.jsx"
import { Input } from "../../ui/input/input.jsx"
import { Slider } from "../../ui/slider/slider.jsx"

import "../../ui/form/form.css"
import "../../ui/form-fields/form-fields.css"
import "../../ui/field/field.css"
import "../../ui/input/input.css"
import "../../ui/textarea/textarea.css"
import "../../ui/label/label.css"
import "../../ui/checkbox/checkbox.css"
import "../../ui/switch/switch.css"
import "../../ui/select/select.css"
import "../../ui/radio-group/radio-group.css"
import "../../ui/slider/slider.css"
import "../../ui/button/button.css"

/* ================================================================== */
/*  Schema — the resolver from lib/schema.js (task 62)                 */
/* ================================================================== */

const ROLES = [
  { value: "admin", label: "Admin" },
  { value: "editor", label: "Editor" },
  { value: "viewer", label: "Viewer" },
]

const PLANS = [
  { value: "free", label: "Free" },
  { value: "pro", label: "Pro" },
  { value: "team", label: "Team" },
]

const profileSchema = s.object({
  username: s.string().min(2, "Username must be at least 2 characters"),
  bio: s.string().max(160, "Keep the bio under 160 characters"),
  role: s
    .string()
    .refine((v) => ROLES.some((r) => r.value === v), "Pick a role"),
  plan: s
    .string()
    .refine((v) => PLANS.some((p) => p.value === v), "Pick a plan"),
  marketing: s.boolean(),
  notifications: s.boolean(),
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

        <h4>Which layer to reach for</h4>
        <p>
          <strong>
            <code>ui/form-fields</code>
          </strong>{" "}
          for ordinary fields — a label, a control, a description, an error.
          That is most of them.{" "}
          <strong>
            <code>ui/form</code>
          </strong>{" "}
          when the layout is unusual (two controls in one item, a label that is
          not text, a field whose control is chosen at runtime) or when you are
          driving it with a different engine — React Hook Form, or React 19
          Actions via <code>&lt;Form action&gt;</code>, neither of which this
          layer knows about.{" "}
          <strong>
            <code>lib/use-form</code>
          </strong>{" "}
          alone when there is no field UI at all: a search box, a filter bar, a
          form you are styling from scratch.
        </p>
        <p>
          Mixing them is normal and expected. A bound field and a hand-written
          one sit in the same <code>&lt;Form&gt;</code> and produce the same
          markup — see below.
        </p>

        <h4>Why its own directory</h4>
        <p>
          <code>ui/form/form.jsx</code> inlines its own <code>getByPath</code>{" "}
          rather than importing the engine's, on purpose: copying{" "}
          <code>ui/form/</code> into your project must not drag{" "}
          <code>lib/use-form.js</code> with it. Putting these bindings inside{" "}
          <code>ui/form/</code> would break exactly that. So they live next
          door, and copying <code>ui/form-fields/</code> is an explicit choice
          to take the engine too.
        </p>
      </div>
    </section>
  )
}

/* ================================================================== */
/*  What it replaces                                                   */
/* ================================================================== */

const BOUND_SOURCE = `<SelectField
  name="role"
  control={control}
  label="Role"
  description="Controls what the user can access."
  placeholder="Select a role"
  items={ROLES}
/>`

const HAND_SOURCE = `<Controller
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
          >
            <SelectTrigger>
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
/>`

function ReplacesDemo() {
  return (
    <section className="pg-section">
      <h3>What it replaces</h3>
      <p className="pg-description">
        The role field from the <code>Form</code> page, both ways. Beyond the
        line count, the right-hand version has three places to get wrong:{" "}
        <code>Controller</code> instead of <code>register</code>, the{" "}
        <code>FormField name</code> matching the <code>Controller name</code>,
        and remembering <code>FormMessage</code> at all — drop it and the field
        validates but never says so.
      </p>
      <p className="pg-description">
        One real difference: <code>FormControl</code> wrapping{" "}
        <code>&lt;Select&gt;</code> clones the ARIA props onto the{" "}
        <code>Select</code> root, which does not forward unknown props — so
        they never reach the trigger. <code>SelectField</code> puts{" "}
        <code>FormControl</code> on <code>SelectTrigger</code> instead, where
        they land on a real button.
      </p>

      <div
        style={{
          display: "grid",
          gap: "1rem",
          gridTemplateColumns: "repeat(auto-fit, minmax(20rem, 1fr))",
        }}
      >
        <div>
          <p className="pg-description" style={{ margin: "0 0 0.5rem" }}>
            <strong>Bound</strong> — 8 lines
          </p>
          <pre data-pg="ff-source-bound">{BOUND_SOURCE}</pre>
        </div>
        <div>
          <p className="pg-description" style={{ margin: "0 0 0.5rem" }}>
            <strong>Hand-wired</strong> — 30 lines
          </p>
          <pre data-pg="ff-source-hand">{HAND_SOURCE}</pre>
        </div>
      </div>
    </section>
  )
}

/* ================================================================== */
/*  Escape hatch                                                       */
/* ================================================================== */

function EscapeHatchDemo() {
  const { handleSubmit, control, formState } = useForm({
    defaultValues: { budget: 40 },
  })
  const [result, setResult] = useState(null)

  return (
    <section className="pg-section">
      <h3>Escape hatch</h3>
      <p className="pg-description">
        Every <code>&lt;XField&gt;</code> above is a thin call to{" "}
        <code>FormFieldBinding</code>, and so is anything you write yourself.
        It does the plumbing and hands back <code>field</code>; you decide what
        to render. <code>controlled</code> is the one thing it cannot infer —
        set it for a control with its own value channel, leave it off for a
        native input.
      </p>
      <p className="pg-description">
        <code>Slider</code> is a good example of why the hatch exists: it takes
        and emits an array, so the value needs adapting in both directions.
      </p>

      <div style={{ maxWidth: "28rem" }}>
        <Form
          form={{ formState }}
          onSubmit={handleSubmit((data) => setResult(JSON.stringify(data)))}
          data-pg="ff-hatch"
        >
          <FormFieldBinding
            controlled
            name="budget"
            control={control}
            label="Budget"
            description="Anything from 0 to 100."
            render={({ field }) => (
              <FormControl
                as={Slider}
                value={[field.value ?? 0]}
                onValueChange={([v]) => field.onChange(v)}
                data-pg="ff-budget"
              />
            )}
          />

          <button type="submit" className="button" data-pg="ff-hatch-submit">
            Submit
          </button>
        </Form>

        {result && (
          <pre data-pg="ff-hatch-result" style={{ marginTop: "1rem" }}>
            {result}
          </pre>
        )}
      </div>
    </section>
  )
}

/* ================================================================== */
/*  Bound form                                                         */
/* ================================================================== */

function BoundFormDemo() {
  const { handleSubmit, control, formState, reset } = useForm({
    defaultValues: {
      username: "",
      bio: "",
      role: "",
      plan: "free",
      marketing: false,
      notifications: true,
    },
    resolver: schemaResolver(profileSchema),
    mode: "onTouched",
  })
  const [result, setResult] = useState(null)

  return (
    <section className="pg-section">
      <h3>Bound form</h3>
      <p className="pg-description">
        Six fields, six lines. <code>TextField</code> and{" "}
        <code>TextareaField</code> are native inputs, so the binding wires them
        with <code>register</code> — no <code>Controller</code>, no re-render
        per keystroke. <code>SelectField</code>, <code>RadioGroupField</code>,{" "}
        <code>CheckboxField</code> and <code>SwitchField</code> render buttons
        and divs with no DOM value to read, so those get{" "}
        <code>Controller</code>. Nothing in the markup below says which.
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

          <SelectField
            name="role"
            control={control}
            label="Role"
            description="Controls what the user can access."
            placeholder="Select a role"
            items={ROLES}
            data-pg="ff-role"
          />

          <RadioGroupField
            name="plan"
            control={control}
            label="Plan"
            description="Change it any time."
            items={PLANS}
            data-pg="ff-plan"
          />

          <CheckboxField
            name="marketing"
            control={control}
            label="Receive marketing emails"
            description="Opt in to occasional product updates."
            data-pg="ff-marketing"
          />

          <SwitchField
            name="notifications"
            control={control}
            label="Push notifications"
            data-pg="ff-notifications"
          />

          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button type="submit" className="button" data-pg="ff-submit">
              Save profile
            </button>
            <button
              type="button"
              className="button button--outline"
              data-pg="ff-reset"
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
      <ReplacesDemo />
      <ParityDemo />
      <EscapeHatchDemo />
    </>
  )
}
