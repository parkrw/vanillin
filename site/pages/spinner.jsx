import { Spinner } from "../../ui/spinner/spinner.jsx"
import "../../ui/spinner/spinner.css"
import { ComponentPreview } from "../code-example.jsx"
import { InstallSnippet } from "../install-snippet.jsx"
import { ApiReference } from "../api-reference.jsx"
import "../code-example.css"
import "../install-snippet.css"
import "../api-reference.css"

export default function SpinnerPage() {
  return (
    <>
      <h2>Spinner</h2>
      <p>An indeterminate loading indicator that announces itself to assistive technology and spins at a fixed cadence immune to motion-scale.</p>

      <InstallSnippet slug="spinner" />

      <section className="pg-section">
        <h3>Usage</h3>
        <ComponentPreview code={`import { Spinner } from "./ui/spinner/spinner"
import "./ui/spinner/spinner.css"

<Spinner />`}>
          <Spinner />
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Sizes</h3>
        <ComponentPreview code={`<Spinner style={{ width: "0.75rem", height: "0.75rem" }} />
<Spinner />
<Spinner style={{ width: "1.5rem", height: "1.5rem" }} />
<Spinner style={{ width: "2rem", height: "2rem" }} />`}>
          <div className="pg-row">
            <Spinner style={{ width: "0.75rem", height: "0.75rem" }} />
            <Spinner />
            <Spinner style={{ width: "1.5rem", height: "1.5rem" }} />
            <Spinner style={{ width: "2rem", height: "2rem" }} />
          </div>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Inline with text</h3>
        <ComponentPreview code={`<button disabled style={{
  display: "inline-flex", alignItems: "center", gap: "0.5rem",
  padding: "0.5rem 1rem", border: "1px solid var(--border)",
  borderRadius: "var(--radius)", background: "var(--muted)",
  color: "var(--muted-foreground)", cursor: "not-allowed",
}}>
  <Spinner style={{ width: "1rem", height: "1rem" }} />
  Loading…
</button>`}>
          <button disabled style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 1rem", border: "1px solid var(--border)", borderRadius: "var(--radius)", background: "var(--muted)", color: "var(--muted-foreground)", cursor: "not-allowed" }}>
            <Spinner style={{ width: "1rem", height: "1rem" }} />
            Loading…
          </button>
        </ComponentPreview>
      </section>

      <ApiReference props={[
        { name: "className", type: "string", description: "Additional CSS classes" },
      ]} />
    </>
  )
}
