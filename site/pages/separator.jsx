import { Separator } from "../../ui/separator/separator.jsx"
import "../../ui/separator/separator.css"
import { ComponentPreview } from "../code-example.jsx"
import { InstallSnippet } from "../install-snippet.jsx"
import { ApiReference } from "../api-reference.jsx"
import "../code-example.css"
import "../install-snippet.css"
import "../api-reference.css"

export default function SeparatorPage() {
  return (
    <>
      <h2>Separator</h2>
      <p>A thin line between sections or inline elements, carrying the right ARIA role so assistive technology reads it as a divider.</p>

      <InstallSnippet slug="separator" />

      <section className="pg-section">
        <h3>Usage</h3>
        <ComponentPreview defaultTab="code" code={`import { Separator } from "./ui/separator/separator"
import "./ui/separator/separator.css"

<p>Content above</p>
<Separator />
<p>Content below</p>`}>
          <div>
            <p style={{ margin: "0 0 0.75rem" }}>Content above</p>
            <Separator />
            <p style={{ margin: "0.75rem 0 0" }}>Content below</p>
          </div>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Vertical</h3>
        <ComponentPreview code={`<div style={{ display: "flex", alignItems: "center", gap: "0.5rem", height: "1.25rem" }}>
  <span>Left</span>
  <Separator orientation="vertical" />
  <span>Right</span>
</div>`}>
          <div className="pg-row" style={{ height: "1.25rem" }}>
            <span>Left</span>
            <Separator orientation="vertical" />
            <span>Right</span>
          </div>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Decorative</h3>
        <ComponentPreview code={`{/* role="none" — invisible to screen readers */}
<p>Decorative separator below (no ARIA role)</p>
<Separator decorative />`}>
          <div>
            <p style={{ margin: "0 0 0.75rem" }}>Decorative separator below (no ARIA role)</p>
            <Separator decorative />
          </div>
        </ComponentPreview>
      </section>

      <ApiReference props={[
        { name: "orientation", type: '"horizontal" | "vertical"', default: '"horizontal"', description: "Direction of the separator line" },
        { name: "decorative", type: "boolean", default: "false", description: 'When true, renders role="none" instead of "separator"' },
        { name: "className", type: "string", description: "Additional CSS classes" },
      ]} />
    </>
  )
}
