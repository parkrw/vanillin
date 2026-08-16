import { useState } from "react"
import { RadioGroup, RadioGroupItem } from "../../ui/radio-group/radio-group.jsx"
import { Label } from "../../ui/label/label.jsx"
import "../../ui/radio-group/radio-group.css"
import "../../ui/label/label.css"
import { ComponentPreview } from "../code-example.jsx"
import { InstallSnippet } from "../install-snippet.jsx"
import { ApiReference } from "../api-reference.jsx"
import "../code-example.css"
import "../install-snippet.css"
import "../api-reference.css"

export default function RadioGroupPage() {
  const [value, setValue] = useState("comfortable")
  return (
    <>
      <h2>Radio Group</h2>
      <p>A set of mutually exclusive options. Arrow keys rove focus and select, wired through <code>aria-checked</code> and roving tabindex.</p>

      <InstallSnippet slug="radio-group" />

      <section className="pg-section">
        <h3>Default</h3>
        <ComponentPreview code={`import { RadioGroup, RadioGroupItem } from "./ui/radio-group/radio-group"
import "./ui/radio-group/radio-group.css"

<RadioGroup defaultValue="comfortable">
  <div className="pg-row">
    <RadioGroupItem value="default" id="rg-default" />
    <Label htmlFor="rg-default">Default</Label>
  </div>
  <div className="pg-row">
    <RadioGroupItem value="comfortable" id="rg-comfortable" />
    <Label htmlFor="rg-comfortable">Comfortable</Label>
  </div>
  <div className="pg-row">
    <RadioGroupItem value="compact" id="rg-compact" />
    <Label htmlFor="rg-compact">Compact</Label>
  </div>
</RadioGroup>`}>
          <RadioGroup defaultValue="comfortable">
            <div className="pg-row">
              <RadioGroupItem value="default" id="rg-default" />
              <Label htmlFor="rg-default">Default</Label>
            </div>
            <div className="pg-row">
              <RadioGroupItem value="comfortable" id="rg-comfortable" />
              <Label htmlFor="rg-comfortable">Comfortable</Label>
            </div>
            <div className="pg-row">
              <RadioGroupItem value="compact" id="rg-compact" />
              <Label htmlFor="rg-compact">Compact</Label>
            </div>
          </RadioGroup>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Disabled Item</h3>
        <ComponentPreview code={`<RadioGroup defaultValue="active">
  <div className="pg-row">
    <RadioGroupItem value="active" id="rg-active" />
    <Label htmlFor="rg-active">Active</Label>
  </div>
  <div className="pg-row">
    <RadioGroupItem value="disabled" id="rg-disabled" disabled />
    <Label htmlFor="rg-disabled">Disabled</Label>
  </div>
</RadioGroup>`}>
          <RadioGroup defaultValue="active">
            <div className="pg-row">
              <RadioGroupItem value="active" id="rg-active" />
              <Label htmlFor="rg-active">Active</Label>
            </div>
            <div className="pg-row">
              <RadioGroupItem value="disabled" id="rg-disabled" disabled />
              <Label htmlFor="rg-disabled">Disabled</Label>
            </div>
          </RadioGroup>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Controlled</h3>
        <ComponentPreview code={`const [value, setValue] = useState("comfortable")

<RadioGroup value={value} onValueChange={setValue}>
  <div className="pg-row">
    <RadioGroupItem value="default" id="rgc-default" />
    <Label htmlFor="rgc-default">Default</Label>
  </div>
  <div className="pg-row">
    <RadioGroupItem value="comfortable" id="rgc-comfortable" />
    <Label htmlFor="rgc-comfortable">Comfortable</Label>
  </div>
</RadioGroup>
<p>Selected: {value}</p>`}>
          <RadioGroup value={value} onValueChange={setValue}>
            <div className="pg-row">
              <RadioGroupItem value="default" id="rgc-default" />
              <Label htmlFor="rgc-default">Default</Label>
            </div>
            <div className="pg-row">
              <RadioGroupItem value="comfortable" id="rgc-comfortable" />
              <Label htmlFor="rgc-comfortable">Comfortable</Label>
            </div>
          </RadioGroup>
          <p className="pg-desc">Selected: {value}</p>
        </ComponentPreview>
      </section>

      <ApiReference title="RadioGroup" props={[
        { name: "value", type: "string", description: "Controlled selected value" },
        { name: "defaultValue", type: "string", description: "Initial value (uncontrolled)" },
        { name: "onValueChange", type: "(value: string) => void", description: "Called when the selection changes" },
        { name: "className", type: "string", description: "Additional CSS classes" },
      ]} />

      <ApiReference title="RadioGroupItem" props={[
        { name: "value", type: "string", description: "The value this item represents" },
        { name: "disabled", type: "boolean", description: "Prevents selection and skips arrow-key navigation" },
        { name: "className", type: "string", description: "Additional CSS classes" },
      ]} />
    </>
  )
}
