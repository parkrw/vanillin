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
  return (
    <>
      <h2>Checkbox</h2>
      <p>A toggle control for boolean values, with indeterminate state support.</p>

      <InstallSnippet slug="checkbox" />

      <section className="pg-section">
        <h3>Usage</h3>
        <ComponentPreview code={`import { Checkbox } from "./ui/checkbox/checkbox"
import "./ui/checkbox/checkbox.css"

<Checkbox id="terms" />
<Label htmlFor="terms">Accept terms and conditions</Label>`}>
          <div className="pg-row">
            <Checkbox id="terms" />
            <Label htmlFor="terms">Accept terms and conditions</Label>
          </div>
        </ComponentPreview>
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
