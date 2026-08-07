import { useEffect, useState } from "react"
import { Progress } from "../../ui/progress/progress.jsx"
import "../../ui/progress/progress.css"
import { ComponentPreview } from "../code-example.jsx"
import { InstallSnippet } from "../install-snippet.jsx"
import { ApiReference } from "../api-reference.jsx"
import "../code-example.css"
import "../install-snippet.css"
import "../api-reference.css"

export default function ProgressPage() {
  const [progress, setProgress] = useState(13)
  useEffect(() => {
    const timer = setTimeout(() => setProgress(66), 500)
    return () => clearTimeout(timer)
  }, [])
  return (
    <>
      <h2>Progress</h2>
      <p>A horizontal bar that shows completion or loading state, with ARIA progressbar semantics.</p>

      <section className="pg-section">
        <h3>Default (animates 13 → 66)</h3>
        <div className="pg-row" style={{ width: "60%" }}>
          <Progress value={progress} />
        </div>
      </section>

      <section className="pg-section">
        <h3>Values</h3>
        <div className="pg-row" style={{ width: "60%", flexDirection: "column", alignItems: "stretch", gap: "1rem" }}>
          <Progress value={0} aria-label="Empty" />
          <Progress value={33} aria-label="A third" />
          <Progress value={100} aria-label="Complete" />
          <Progress value={30} max={40} aria-label="Custom max" />
        </div>
      </section>

      <InstallSnippet slug="progress" />

      <section className="pg-section">
        <h3>Usage</h3>
        <ComponentPreview code={`import { Progress } from "./ui/progress/progress"
import "./ui/progress/progress.css"

<Progress value={33} />`}>
          <div style={{ width: "60%" }}>
            <Progress value={33} />
          </div>
        </ComponentPreview>
      </section>

      <ApiReference props={[
        { name: "value", type: "number", description: "Current progress value" },
        { name: "max", type: "number", default: "100", description: "Maximum value" },
        { name: "className", type: "string", description: "Additional CSS classes" },
      ]} />
    </>
  )
}
