import { Skeleton } from "../../ui/skeleton/skeleton.jsx"
import "../../ui/skeleton/skeleton.css"
import { ComponentPreview } from "../code-example.jsx"
import { InstallSnippet } from "../install-snippet.jsx"
import { ApiReference } from "../api-reference.jsx"
import "../code-example.css"
import "../install-snippet.css"
import "../api-reference.css"

export default function SkeletonPage() {
  return (
    <>
      <h2>Skeleton</h2>
      <p>A pulsing placeholder that holds the shape of content while it loads, preventing layout shift and signalling that data is on its way.</p>

      <InstallSnippet slug="skeleton" />

      <section className="pg-section">
        <h3>Usage</h3>
        <ComponentPreview code={`import { Skeleton } from "./ui/skeleton/skeleton"
import "./ui/skeleton/skeleton.css"

<Skeleton style={{ height: "1rem", width: "16rem" }} />`}>
          <Skeleton style={{ height: "1rem", width: "16rem" }} />
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Text lines</h3>
        <ComponentPreview code={`<div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
  <Skeleton style={{ height: "1rem", width: "16rem" }} />
  <Skeleton style={{ height: "1rem", width: "12rem" }} />
  <Skeleton style={{ height: "1rem", width: "20rem" }} />
</div>`}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <Skeleton style={{ height: "1rem", width: "16rem" }} />
            <Skeleton style={{ height: "1rem", width: "12rem" }} />
            <Skeleton style={{ height: "1rem", width: "20rem" }} />
          </div>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Card placeholder</h3>
        <ComponentPreview code={`<div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
  <Skeleton style={{ height: "2.5rem", width: "2.5rem", borderRadius: "9999px" }} />
  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
    <Skeleton style={{ height: "0.875rem", width: "10rem" }} />
    <Skeleton style={{ height: "0.875rem", width: "7rem" }} />
  </div>
</div>`}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <Skeleton style={{ height: "2.5rem", width: "2.5rem", borderRadius: "9999px" }} />
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <Skeleton style={{ height: "0.875rem", width: "10rem" }} />
              <Skeleton style={{ height: "0.875rem", width: "7rem" }} />
            </div>
          </div>
        </ComponentPreview>
      </section>

      <ApiReference props={[
        { name: "className", type: "string", description: "Additional CSS classes" },
      ]} />
    </>
  )
}
