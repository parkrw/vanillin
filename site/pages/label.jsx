import { Label } from "../../ui/label/label.jsx"
import "../../ui/label/label.css"
import { ComponentPreview } from "../code-example.jsx"
import { InstallSnippet } from "../install-snippet.jsx"
import { ApiReference } from "../api-reference.jsx"
import "../code-example.css"
import "../install-snippet.css"
import "../api-reference.css"

export default function LabelPage() {
  return (
    <>
      <h2>Label</h2>
      <p>Accessible text that binds to a form control: click the label and focus lands on the input.</p>

      <InstallSnippet slug="label" />

      <section className="pg-section">
        <h3>Default</h3>
        <ComponentPreview code={`<Label>Email address</Label>`}>
          <Label>Email address</Label>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Usage</h3>
        <ComponentPreview defaultTab="code" code={`import { Label } from "./ui/label/label"
import "./ui/label/label.css"

<Label>Email address</Label>`}>
          <Label>Email address</Label>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>With Input</h3>
        <ComponentPreview code={`<Label htmlFor="email">Email address</Label>
<input id="email" type="email" placeholder="you@example.com" />`}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <Label htmlFor="email-demo">Email address</Label>
            <input id="email-demo" type="email" placeholder="you@example.com" style={{ padding: "0.375rem 0.75rem", border: "1px solid var(--input)", borderRadius: "var(--radius-md)", background: "transparent" }} />
          </div>
        </ComponentPreview>
      </section>

      <ApiReference props={[
        { name: "htmlFor", type: "string", description: "id of the linked form control" },
        { name: "className", type: "string", description: "Additional CSS classes" },
      ]} />
    </>
  )
}
