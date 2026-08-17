import { Textarea } from "../../ui/textarea/textarea.jsx"
import "../../ui/textarea/textarea.css"
import { Label } from "../../ui/label/label.jsx"
import "../../ui/label/label.css"
import { ComponentPreview } from "../code-example.jsx"
import { InstallSnippet } from "../install-snippet.jsx"
import { ApiReference } from "../api-reference.jsx"
import "../code-example.css"
import "../install-snippet.css"
import "../api-reference.css"

export default function TextareaPage() {
  return (
    <>
      <h2>Textarea</h2>
      <p>Multi-line text input with optional auto-resize via CSS <code>field-sizing: content</code>.</p>

      <InstallSnippet slug="textarea" />

      <section className="pg-section">
        <h3>Default</h3>
        <ComponentPreview code={`import { Textarea } from "./ui/textarea/textarea"
import "./ui/textarea/textarea.css"

<Textarea placeholder="Type your message..." />`}>
          <div style={{ maxWidth: "24rem" }}>
            <Textarea placeholder="Type your message..." />
          </div>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Usage</h3>
        <ComponentPreview defaultTab="code" code={`import { Textarea } from "./ui/textarea/textarea"
import "./ui/textarea/textarea.css"

<Textarea placeholder="Type your message here." />`}>
          <p style={{ fontSize: "0.875rem", color: "var(--muted-foreground)" }}>See the live demos below.</p>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>With Label</h3>
        <ComponentPreview code={`<Label htmlFor="bio">Bio</Label>
<Textarea id="bio" placeholder="Tell us about yourself" />`}>
          <div style={{ maxWidth: "24rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <Label htmlFor="ta-bio">Bio</Label>
            <Textarea id="ta-bio" placeholder="Tell us about yourself" />
          </div>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Auto resize</h3>
        <ComponentPreview code={`{/* Grows with content; rows sets minimum height */}
<Textarea autoResize rows={3} placeholder="Grows with content..." />

{/* max-height (20rem) caps unbounded growth */}
<Textarea autoResize rows={2} placeholder="Empty auto-resize" />`}>
          <div style={{ maxWidth: "24rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <Textarea
              autoResize
              rows={3}
              placeholder="Grows with content (rows=3 minimum)..."
              aria-label="Auto resize"
            />
            <Textarea
              autoResize
              rows={2}
              placeholder="Empty auto-resize (rows=2)"
              aria-label="Auto resize empty"
            />
          </div>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>States</h3>
        <ComponentPreview code={`<Textarea placeholder="Disabled" disabled />
<Textarea placeholder="Invalid" aria-invalid="true" />`}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", maxWidth: "24rem" }}>
            <Textarea placeholder="Disabled" disabled />
            <Textarea placeholder="Invalid" aria-invalid="true" />
          </div>
        </ComponentPreview>
      </section>

      <ApiReference props={[
        { name: "autoResize", type: "boolean", default: "false", description: "Enable CSS field-sizing: content so the textarea grows with its content" },
        { name: "rows", type: "number", description: "Minimum visible rows (standard HTML attribute)" },
        { name: "className", type: "string", description: "Additional CSS classes" },
      ]} />
    </>
  )
}
