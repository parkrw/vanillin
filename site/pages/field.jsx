import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  FieldTitle,
} from "../../ui/field/field.jsx"
import { Input } from "../../ui/input/input.jsx"
import { Checkbox } from "../../ui/checkbox/checkbox.jsx"
import { Switch } from "../../ui/switch/switch.jsx"
import { Button } from "../../ui/button/button.jsx"
import "../../ui/field/field.css"
import "../../ui/label/label.css"
import "../../ui/input/input.css"
import "../../ui/checkbox/checkbox.css"
import "../../ui/switch/switch.css"
import "../../ui/button/button.css"
import { ComponentPreview } from "../code-example.jsx"
import { InstallSnippet } from "../install-snippet.jsx"
import { ApiReference } from "../api-reference.jsx"
import "../code-example.css"
import "../install-snippet.css"
import "../api-reference.css"

export default function FieldPage() {
  return (
    <>
      <h2>Field</h2>
      <p>Layout primitives for form fields — label, description, error, and grouping — without any form engine dependency.</p>

      <InstallSnippet slug="field" />

      <section className="pg-section">
        <h3>Usage</h3>
        <ComponentPreview code={`import { Field, FieldGroup, FieldLabel, FieldDescription } from "./ui/field/field"
import "./ui/field/field.css"

<FieldGroup>
  <Field>
    <FieldLabel htmlFor="name">Name</FieldLabel>
    <Input id="name" placeholder="Ada Lovelace" />
    <FieldDescription>Shown on your public profile.</FieldDescription>
  </Field>
</FieldGroup>`}>
          <div style={{ maxWidth: "24rem" }}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="field-name">Name</FieldLabel>
                <Input id="field-name" placeholder="Ada Lovelace" />
                <FieldDescription>Shown on your public profile.</FieldDescription>
              </Field>
            </FieldGroup>
          </div>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Vertical (default)</h3>
        <ComponentPreview code={`<FieldGroup>
  <Field>
    <FieldLabel htmlFor="name">Name</FieldLabel>
    <Input id="name" placeholder="Ada Lovelace" />
    <FieldDescription>Shown on your public profile.</FieldDescription>
  </Field>
  <Field data-invalid="">
    <FieldLabel htmlFor="email">Email</FieldLabel>
    <Input id="email" aria-invalid="true" defaultValue="not-an-email" />
    <FieldError errors={[{ message: "Enter a valid email address." }]} />
  </Field>
</FieldGroup>`}>
          <div style={{ maxWidth: "24rem" }}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="field-name2">Name</FieldLabel>
                <Input id="field-name2" placeholder="Ada Lovelace" />
                <FieldDescription>Shown on your public profile.</FieldDescription>
              </Field>
              <Field data-invalid="">
                <FieldLabel htmlFor="field-email">Email</FieldLabel>
                <Input id="field-email" aria-invalid="true" defaultValue="not-an-email" />
                <FieldError errors={[{ message: "Enter a valid email address." }]} />
              </Field>
            </FieldGroup>
          </div>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Horizontal</h3>
        <ComponentPreview code={`<FieldGroup>
  <Field orientation="horizontal">
    <Checkbox id="terms" />
    <FieldContent>
      <FieldLabel htmlFor="terms">Accept terms</FieldLabel>
      <FieldDescription>You agree to the terms of service.</FieldDescription>
    </FieldContent>
  </Field>
  <FieldSeparator />
  <Field orientation="horizontal">
    <FieldContent>
      <FieldTitle>Notifications</FieldTitle>
      <FieldDescription>Email me about account activity.</FieldDescription>
    </FieldContent>
    <Switch aria-label="Notifications" defaultChecked />
  </Field>
</FieldGroup>`}>
          <div style={{ maxWidth: "24rem" }}>
            <FieldGroup>
              <Field orientation="horizontal">
                <Checkbox id="field-terms" />
                <FieldContent>
                  <FieldLabel htmlFor="field-terms">Accept terms</FieldLabel>
                  <FieldDescription>You agree to the terms of service.</FieldDescription>
                </FieldContent>
              </Field>
              <FieldSeparator />
              <Field orientation="horizontal">
                <FieldContent>
                  <FieldTitle>Notifications</FieldTitle>
                  <FieldDescription>Email me about account activity.</FieldDescription>
                </FieldContent>
                <Switch aria-label="Notifications" defaultChecked />
              </Field>
            </FieldGroup>
          </div>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Fieldset + Legend</h3>
        <ComponentPreview code={`<FieldSet>
  <FieldLegend>Delivery address</FieldLegend>
  <FieldGroup>
    <Field>
      <FieldLabel htmlFor="street">Street</FieldLabel>
      <Input id="street" />
    </Field>
    <Field>
      <FieldLabel htmlFor="city">City</FieldLabel>
      <Input id="city" />
    </Field>
  </FieldGroup>
</FieldSet>`}>
          <div style={{ maxWidth: "24rem" }}>
            <FieldSet>
              <FieldLegend>Delivery address</FieldLegend>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="field-street">Street</FieldLabel>
                  <Input id="field-street" />
                </Field>
                <Field>
                  <FieldLabel htmlFor="field-city">City</FieldLabel>
                  <Input id="field-city" />
                </Field>
              </FieldGroup>
            </FieldSet>
          </div>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Responsive + Separator with Content</h3>
        <ComponentPreview code={`<FieldGroup>
  <Field orientation="responsive">
    <FieldContent>
      <FieldTitle>Two-factor authentication</FieldTitle>
      <FieldDescription>
        Horizontal when the container is wide, vertical when narrow.
      </FieldDescription>
    </FieldContent>
    <Button variant="outline">Enable</Button>
  </Field>
  <FieldSeparator>or</FieldSeparator>
  <Field orientation="responsive">
    <FieldContent>
      <FieldTitle>Passkey</FieldTitle>
      <FieldDescription>Sign in with Touch ID or a security key.</FieldDescription>
    </FieldContent>
    <Button variant="outline">Add passkey</Button>
  </Field>
</FieldGroup>`}>
          <div style={{ maxWidth: "40rem" }}>
            <FieldGroup>
              <Field orientation="responsive">
                <FieldContent>
                  <FieldTitle>Two-factor authentication</FieldTitle>
                  <FieldDescription>
                    Horizontal when the container is wide, vertical when narrow.
                  </FieldDescription>
                </FieldContent>
                <Button variant="outline">Enable</Button>
              </Field>
              <FieldSeparator>or</FieldSeparator>
              <Field orientation="responsive">
                <FieldContent>
                  <FieldTitle>Passkey</FieldTitle>
                  <FieldDescription>Sign in with Touch ID or a security key.</FieldDescription>
                </FieldContent>
                <Button variant="outline">Add passkey</Button>
              </Field>
            </FieldGroup>
          </div>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Multiple Errors</h3>
        <ComponentPreview code={`<Field data-invalid="">
  <FieldLabel htmlFor="password">Password</FieldLabel>
  <Input id="password" type="password" aria-invalid="true" />
  <FieldError errors={[
    { message: "At least 8 characters." },
    { message: "At least one number." },
  ]} />
</Field>`}>
          <div style={{ maxWidth: "24rem" }}>
            <Field data-invalid="">
              <FieldLabel htmlFor="field-password">Password</FieldLabel>
              <Input id="field-password" type="password" aria-invalid="true" />
              <FieldError
                errors={[
                  { message: "At least 8 characters." },
                  { message: "At least one number." },
                ]}
              />
            </Field>
          </div>
        </ComponentPreview>
      </section>

      <ApiReference title="Field" props={[
        { name: "orientation", type: '"vertical" | "horizontal" | "responsive"', default: '"vertical"', description: "Layout direction — responsive flips based on container width" },
        { name: "data-invalid", type: "string", description: "Set to mark the field as invalid (styles label and description)" },
        { name: "className", type: "string", description: "Additional CSS classes" },
      ]} />

      <ApiReference title="FieldError" props={[
        { name: "errors", type: "Array<{ message: string }>", description: "Error objects to render — children take precedence" },
        { name: "as", type: "ElementType", default: '"div"', description: 'Wrapper element — use "p" for prose-shaped errors' },
        { name: "className", type: "string", description: "Additional CSS classes" },
      ]} />

      <ApiReference title="FieldLegend" props={[
        { name: "variant", type: '"legend" | "label"', default: '"legend"', description: "Sizing variant — label matches FieldLabel sizing" },
        { name: "className", type: "string", description: "Additional CSS classes" },
      ]} />
    </>
  )
}
