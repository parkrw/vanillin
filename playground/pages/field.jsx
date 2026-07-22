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

export default function FieldPage() {
  return (
    <>
      <h2>Field</h2>

      <section className="pg-section">
        <h3>Vertical (default)</h3>
        <div style={{ maxWidth: "24rem" }}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="field-name">Name</FieldLabel>
              <Input id="field-name" placeholder="Ada Lovelace" />
              <FieldDescription>Shown on your public profile.</FieldDescription>
            </Field>
            <Field data-invalid="">
              <FieldLabel htmlFor="field-email">Email</FieldLabel>
              <Input id="field-email" aria-invalid="true" defaultValue="not-an-email" />
              <FieldError errors={[{ message: "Enter a valid email address." }]} />
            </Field>
          </FieldGroup>
        </div>
      </section>

      <section className="pg-section">
        <h3>Horizontal</h3>
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
      </section>

      <section className="pg-section">
        <h3>Fieldset + legend</h3>
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
      </section>

      <section className="pg-section">
        <h3>Responsive + separator with content</h3>
        <div style={{ maxWidth: "40rem", containerType: "inline-size" }}>
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
      </section>

      <section className="pg-section">
        <h3>Multiple errors</h3>
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
      </section>
    </>
  )
}
