import { useState } from "react"
import { RadioGroup, RadioGroupItem } from "../../ui/radio-group/radio-group.jsx"
import { Label } from "../../ui/label/label.jsx"
import "../../ui/radio-group/radio-group.css"
import "../../ui/label/label.css"

export default function RadioGroupPage() {
  const [value, setValue] = useState("comfortable")
  return (
    <>
      <h2>Radio Group</h2>

      <section className="pg-section">
        <h3>Default</h3>
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
      </section>

      <section className="pg-section">
        <h3>Disabled Item</h3>
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
      </section>

      <section className="pg-section">
        <h3>Controlled</h3>
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
        <p style={{ fontSize: "0.875rem", color: "var(--muted-foreground)" }}>Selected: {value}</p>
      </section>
    </>
  )
}
