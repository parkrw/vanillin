import { useState } from "react"
import { Checkbox } from "../../ui/checkbox/checkbox.jsx"
import { Label } from "../../ui/label/label.jsx"
import "../../ui/checkbox/checkbox.css"
import "../../ui/label/label.css"

export default function CheckboxPage() {
  const [checked, setChecked] = useState(true)
  return (
    <>
      <h2>Checkbox</h2>

      <section className="pg-section">
        <h3>Default</h3>
        <div className="pg-row">
          <Checkbox id="terms" />
          <Label htmlFor="terms">Accept terms and conditions</Label>
        </div>
      </section>

      <section className="pg-section">
        <h3>States</h3>
        <div className="pg-row">
          <Checkbox defaultChecked aria-label="Checked by default" />
          <Checkbox disabled aria-label="Disabled" />
          <Checkbox disabled defaultChecked aria-label="Disabled checked" />
          <Checkbox aria-invalid="true" aria-label="Invalid" />
        </div>
      </section>

      <section className="pg-section">
        <h3>Controlled</h3>
        <div className="pg-row">
          <Checkbox id="newsletter" checked={checked} onCheckedChange={setChecked} />
          <Label htmlFor="newsletter">Subscribed: {checked ? "yes" : "no"}</Label>
        </div>
      </section>
    </>
  )
}
