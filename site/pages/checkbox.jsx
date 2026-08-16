import { useState } from "react"
import { Checkbox } from "../../ui/checkbox/checkbox.jsx"
import { Label } from "../../ui/label/label.jsx"
import { Card, CardHeader, CardTitle, CardContent } from "../../ui/card/card.jsx"
import "../../ui/checkbox/checkbox.css"
import "../../ui/label/label.css"
import "../../ui/card/card.css"
import { ComponentPreview } from "../code-example.jsx"
import { InstallSnippet } from "../install-snippet.jsx"
import { ApiReference } from "../api-reference.jsx"
import "../code-example.css"
import "../install-snippet.css"
import "../api-reference.css"

export default function CheckboxPage() {
  const [checked, setChecked] = useState(true)
  const [rows, setRows] = useState([true, false, false])

  return (
    <>
      <h2>Checkbox</h2>
      <p>A toggle control for boolean values, with indeterminate state support.</p>

      <InstallSnippet slug="checkbox" />

      <section className="pg-section">
        <h3>Default</h3>
        <ComponentPreview code={`<Checkbox id="terms" />
<Label htmlFor="terms">Accept terms and conditions</Label>`}>
          <div className="pg-row">
            <Checkbox id="terms" />
            <Label htmlFor="terms">Accept terms and conditions</Label>
          </div>
        </ComponentPreview>
        <p className="pg-desc">
          The control is a <code>button</code> with <code>role="checkbox"</code>, not a native input, so pair it with a <code>Label</code> whose <code>htmlFor</code> matches the id to keep the click target and the announcement right.
        </p>
      </section>

      <section className="pg-section">
        <h3>Usage</h3>
        <ComponentPreview defaultTab="code" code={`import { Checkbox } from "./ui/checkbox/checkbox"
import "./ui/checkbox/checkbox.css"

<Checkbox id="terms" />
<Label htmlFor="terms">Accept terms and conditions</Label>`}>
          <div className="pg-row">
            <Checkbox id="usage-marketing" />
            <Label htmlFor="usage-marketing">Send me product updates</Label>
          </div>
        </ComponentPreview>
        <p className="pg-desc">
          Space and Enter both toggle it, and the checked state is reported through <code>aria-checked</code> rather than a hidden input.
        </p>
      </section>

      <section className="pg-section">
        <h3>Indeterminate</h3>
        <ComponentPreview code={`{/* checked accepts "indeterminate" as a third state. */}
const allChecked = items.every(Boolean)
const someChecked = items.some(Boolean)

<Checkbox
  id="select-all"
  checked={allChecked ? true : someChecked ? "indeterminate" : false}
  onCheckedChange={(next) => setItems(items.map(() => next === true))}
/>`}>
          <div style={{ display: "grid", gap: "0.75rem" }}>
            <div className="pg-row">
              <Checkbox
                id="select-all"
                checked={
                  rows.every(Boolean) ? true : rows.some(Boolean) ? "indeterminate" : false
                }
                onCheckedChange={(next) => setRows(rows.map(() => next === true))}
              />
              <Label htmlFor="select-all">Select all</Label>
            </div>
            {["Invoices", "Receipts", "Statements"].map((label, index) => (
              <div className="pg-row" key={label} style={{ paddingInlineStart: "1.5rem" }}>
                <Checkbox
                  id={`row-${label}`}
                  checked={rows[index]}
                  onCheckedChange={(next) =>
                    setRows(rows.map((value, i) => (i === index ? next === true : value)))
                  }
                />
                <Label htmlFor={`row-${label}`}>{label}</Label>
              </div>
            ))}
          </div>
        </ComponentPreview>
        <p className="pg-desc">
          Passing the string <code>"indeterminate"</code> paints the dash and sets <code>aria-checked="mixed"</code>. Clicking it resolves to a real boolean, so a parent row never leaves the reader stuck in the mixed state.
        </p>
      </section>

      <section className="pg-section">
        <h3>States</h3>
        <ComponentPreview code={`<Checkbox defaultChecked aria-label="Checked" />
<Checkbox disabled aria-label="Disabled" />
<Checkbox disabled defaultChecked aria-label="Disabled checked" />
<Checkbox aria-invalid="true" aria-label="Invalid" />`}>
          <div className="pg-row">
            <Checkbox defaultChecked aria-label="Checked by default" />
            <Checkbox disabled aria-label="Disabled" />
            <Checkbox disabled defaultChecked aria-label="Disabled checked" />
            <Checkbox aria-invalid="true" aria-label="Invalid" />
          </div>
        </ComponentPreview>
        <p className="pg-desc">
          <code>aria-invalid</code> switches the border and focus ring to <code>--destructive</code>. It is an attribute, not a variant, so form libraries can set it without knowing about the component.
        </p>
      </section>

      <section className="pg-section">
        <h3>Controlled</h3>
        <ComponentPreview code={`const [checked, setChecked] = useState(true)

<Checkbox id="newsletter" checked={checked} onCheckedChange={setChecked} />
<Label htmlFor="newsletter">Subscribed: {checked ? "yes" : "no"}</Label>`}>
          <div className="pg-row">
            <Checkbox id="newsletter" checked={checked} onCheckedChange={setChecked} />
            <Label htmlFor="newsletter">Subscribed: {checked ? "yes" : "no"}</Label>
          </div>
        </ComponentPreview>
        <p className="pg-desc">
          Pass <code>checked</code> and the component stops tracking state itself. Leave it off and it manages its own, seeded by <code>defaultChecked</code>.
        </p>
      </section>

      <section className="pg-section">
        <h3>Checkbox List in Card</h3>
        <ComponentPreview code={`<Card>
  <CardHeader>
    <CardTitle>Notifications</CardTitle>
  </CardHeader>
  <CardContent>
    {items.map(item => (
      <div key={item} style={{ display: "flex", gap: "0.5rem" }}>
        <Checkbox id={item} />
        <Label htmlFor={item}>{item}</Label>
      </div>
    ))}
  </CardContent>
</Card>`}>
          <Card style={{ width: "100%", maxWidth: "22rem" }}>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
            </CardHeader>
            <CardContent style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {["Email notifications", "Push notifications", "SMS alerts"].map(item => (
                <div key={item} style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                  <Checkbox id={`cbx-${item}`} defaultChecked={item === "Email notifications"} />
                  <Label htmlFor={`cbx-${item}`}>{item}</Label>
                </div>
              ))}
            </CardContent>
          </Card>
        </ComponentPreview>
        <p className="pg-desc">
          Nothing groups checkboxes for you. A list is just rows of label and control, which is why the card, not the component, owns the spacing.
        </p>
      </section>

      <ApiReference props={[
        { name: "checked", type: "boolean", description: "Controlled checked state" },
        { name: "defaultChecked", type: "boolean", default: "false", description: "Initial checked state (uncontrolled)" },
        { name: "onCheckedChange", type: "(checked: boolean) => void", description: "Called when the checked state changes" },
        { name: "className", type: "string", description: "Additional CSS classes" },
      ]} />
    </>
  )
}
