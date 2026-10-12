import { useState } from "react"
import { DirectionProvider } from "../../lib/direction.jsx"
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
        <h3>Usage</h3>
        <ComponentPreview defaultTab="code" code={`import { RadioGroup, RadioGroupItem } from "./ui/radio-group/radio-group"
import "./ui/radio-group/radio-group.css"

<RadioGroup defaultValue="comfortable">
  <div>
    <RadioGroupItem value="default" id="r1" />
    <Label htmlFor="r1">Default</Label>
  </div>
  <div>
    <RadioGroupItem value="comfortable" id="r2" />
    <Label htmlFor="r2">Comfortable</Label>
  </div>
</RadioGroup>`}>
          <p style={{ fontSize: "0.875rem", color: "var(--muted-foreground)" }}>See the live demos below.</p>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Segmented</h3>
        <ComponentPreview code={`<RadioGroup variant="segmented" defaultValue="week" aria-label="Range">
  <RadioGroupItem value="day">Day</RadioGroupItem>
  <RadioGroupItem value="week">Week</RadioGroupItem>
  <RadioGroupItem value="month">Month</RadioGroupItem>
  <RadioGroupItem value="year" disabled>Year</RadioGroupItem>
</RadioGroup>`}>
          <RadioGroup variant="segmented" defaultValue="week" aria-label="Range" data-pg="rg-segmented">
            <RadioGroupItem value="day">Day</RadioGroupItem>
            <RadioGroupItem value="week">Week</RadioGroupItem>
            <RadioGroupItem value="month">Month</RadioGroupItem>
            <RadioGroupItem value="year" disabled>Year</RadioGroupItem>
          </RadioGroup>
        </ComponentPreview>
        <p className="pg-desc">
          The items join into one row of outline buttons, as in Button Group, and each one shows its children as its label. The checked item is filled. Arrow keys move and select as in the default layout, and clicking the checked item leaves it checked.
        </p>
      </section>

      <section className="pg-section">
        <h3>Segmented RTL</h3>
        <ComponentPreview code={`<DirectionProvider dir="rtl">
  <RadioGroup variant="segmented" defaultValue="day" aria-label="المدة">
    <RadioGroupItem value="day">يوم</RadioGroupItem>
    <RadioGroupItem value="week">أسبوع</RadioGroupItem>
    <RadioGroupItem value="month">شهر</RadioGroupItem>
  </RadioGroup>
</DirectionProvider>`}>
          <DirectionProvider dir="rtl">
            <RadioGroup variant="segmented" defaultValue="day" aria-label="المدة" data-pg="rg-segmented-rtl">
              <RadioGroupItem value="day">يوم</RadioGroupItem>
              <RadioGroupItem value="week">أسبوع</RadioGroupItem>
              <RadioGroupItem value="month">شهر</RadioGroupItem>
            </RadioGroup>
          </DirectionProvider>
        </ComponentPreview>
        <p className="pg-desc">
          The first item sits at the inline start, on the right, and the arrow keys follow the reading direction.
        </p>
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
        { name: "variant", type: '"default" | "segmented"', default: '"default"', description: "A dot beside each label, or the items joined as one row of buttons" },
        { name: "className", type: "string", description: "Additional CSS classes" },
      ]} />

      <ApiReference title="RadioGroupItem" props={[
        { name: "value", type: "string", description: "The value this item represents" },
        { name: "disabled", type: "boolean", description: "Prevents selection and skips arrow-key navigation" },
        { name: "children", type: "ReactNode", description: "The item's label, shown inside it when the group is segmented" },
        { name: "className", type: "string", description: "Additional CSS classes" },
      ]} />
    </>
  )
}
