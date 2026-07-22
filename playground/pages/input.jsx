import { Input } from "../../ui/input/input.jsx"
import "../../ui/input/input.css"
import { Label } from "../../ui/label/label.jsx"
import "../../ui/label/label.css"

export default function InputPage() {
  return (
    <>
      <h2>Input</h2>

      <section className="pg-section">
        <h3>Default</h3>
        <div style={{ maxWidth: "20rem" }}>
          <Input placeholder="Type something..." />
        </div>
      </section>

      <section className="pg-section">
        <h3>With label</h3>
        <div style={{ maxWidth: "20rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <Label htmlFor="input-email">Email</Label>
          <Input id="input-email" type="email" placeholder="you@example.com" />
        </div>
      </section>

      <section className="pg-section">
        <h3>File input</h3>
        <div style={{ maxWidth: "20rem" }}>
          <Input type="file" />
        </div>
      </section>

      <section className="pg-section">
        <h3>States</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", maxWidth: "20rem" }}>
          <Input placeholder="Disabled" disabled />
          <Input placeholder="Invalid" aria-invalid="true" />
        </div>
      </section>
    </>
  )
}
