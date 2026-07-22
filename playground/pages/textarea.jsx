import { Textarea } from "../../ui/textarea/textarea.jsx"
import "../../ui/textarea/textarea.css"
import { Label } from "../../ui/label/label.jsx"
import "../../ui/label/label.css"

export default function TextareaPage() {
  return (
    <>
      <h2>Textarea</h2>

      <section className="pg-section">
        <h3>Default</h3>
        <div style={{ maxWidth: "24rem" }}>
          <Textarea placeholder="Type your message..." />
        </div>
      </section>

      <section className="pg-section">
        <h3>With label</h3>
        <div style={{ maxWidth: "24rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <Label htmlFor="ta-bio">Bio</Label>
          <Textarea id="ta-bio" placeholder="Tell us about yourself" />
        </div>
      </section>

      <section className="pg-section">
        <h3>States</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", maxWidth: "24rem" }}>
          <Textarea placeholder="Disabled" disabled />
          <Textarea placeholder="Invalid" aria-invalid="true" />
        </div>
      </section>
    </>
  )
}
