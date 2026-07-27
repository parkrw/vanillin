import { Label } from "../../ui/label/label.jsx"
import "../../ui/label/label.css"

export default function LabelPage() {
  return (
    <>
      <h2>Label</h2>

      <section className="pg-section">
        <h3>Default</h3>
        <div className="pg-row">
          <Label>Username</Label>
        </div>
      </section>

      <section className="pg-section">
        <h3>With htmlFor</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <Label htmlFor="email-demo">Email address</Label>
          <input id="email-demo" type="email" placeholder="you@example.com" style={{ padding: "0.375rem 0.75rem", border: "1px solid var(--input)", borderRadius: "var(--radius-md)", background: "transparent" }} />
        </div>
      </section>
    </>
  )
}
