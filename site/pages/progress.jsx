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

      <InstallSnippet slug="progress" />

      <section className="pg-section">
        <h3>Default</h3>
        <p>
          The bar transitions smoothly when <code>value</code> changes. This
          demo starts at 13 and moves to 66 after 500 ms, showing the CSS
          transition in action.
        </p>
        <div className="pg-row" style={{ width: "60%" }}>
          <Progress value={progress} />
        </div>
      </section>

      <section className="pg-section">
        <h3>Usage</h3>
        <ComponentPreview defaultTab="code" code={`import { Progress } from "./ui/progress/progress"
import "./ui/progress/progress.css"

<Progress value={33} />`}>
          <div style={{ width: "60%" }}>
            <Progress value={33} />
          </div>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Values</h3>
        <p>
          Pass any number between 0 and <code>max</code> (default 100).
          The bar reaches full width at <code>value === max</code> and
          switches to a <code>complete</code> data-state. A custom{" "}
          <code>max</code> sets the scale and is reflected in{" "}
          <code>aria-valuemax</code> and <code>aria-valuetext</code>.
        </p>
        <div className="pg-row" style={{ width: "60%", flexDirection: "column", alignItems: "stretch", gap: "1rem" }}>
          <Progress value={0} aria-label="Empty" />
          <Progress value={33} aria-label="A third" />
          <Progress value={100} aria-label="Complete" />
          <Progress value={30} max={40} aria-label="Custom max" />
        </div>
      </section>

      <section className="pg-section">
        <h3>Indeterminate</h3>
        <p>
          Omit <code>value</code> (or pass <code>null</code>) for an
          indeterminate bar. The component sets{" "}
          <code>data-state=&quot;indeterminate&quot;</code> and drops{" "}
          <code>aria-valuenow</code>, signalling that progress cannot be
          determined.
        </p>
        <ComponentPreview code={`<Progress />
<Progress value={null} />`}>
          <div data-pg="progress-indeterminate" style={{ width: "60%", display: "flex", flexDirection: "column", gap: "1rem" }}>
            <Progress />
            <Progress value={null} />
          </div>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Glow</h3>
        <p>
          Pass <code>glow</code> for the one bar on a page that means
          &quot;live&quot;. A halo in the bar&apos;s own colour breathes on a
          fixed 2 s loop, the same way <code>Badge</code>&apos;s{" "}
          <code>glow</code> and <code>StatusDot</code>&apos;s <code>ring</code>{" "}
          do. Set <code>--progress-glow</code> to recolour the halo when the
          indicator itself is themed. Reduced motion leaves a static halo.
        </p>
        <ComponentPreview code={`<Progress value={64} glow aria-label="Live throughput" />
<Progress value={64} aria-label="Plain" />`}>
          <div
            data-pg="progress-glow"
            style={{ width: "60%", display: "flex", flexDirection: "column", gap: "3rem" }}
          >
            <Progress value={64} glow aria-label="Live throughput" />
            <Progress value={64} aria-label="Plain" />
          </div>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Glow speed and brightness</h3>
        <p>
          Two custom properties retime and dim the halo:{" "}
          <code>--glow-duration</code> is one breath (default <code>2s</code>)
          and <code>--glow-strength</code> multiplies the halo alpha (default{" "}
          <code>1</code>). Set them on any ancestor and every progress bar,
          badge and status dot inside follows. The indeterminate sweep keeps its
          own timing — it is a loading loop, not a &quot;live&quot; halo.
        </p>
        <ComponentPreview code={`<div style={{ "--glow-duration": "4s", "--glow-strength": 0.5 }}>
  <Progress value={64} glow aria-label="Slow live throughput" />
  <Progress aria-label="Indeterminate, unretimed" />
</div>`}>
          <div
            data-pg="progress-glow-controls"
            style={{
              width: "60%",
              display: "flex",
              flexDirection: "column",
              gap: "3rem",
              "--glow-duration": "4s",
              "--glow-strength": 0.5,
            }}
          >
            <Progress value={64} glow aria-label="Slow live throughput" />
            <Progress value={64} aria-label="Plain, slow row" />
            <Progress aria-label="Indeterminate, unretimed" />
          </div>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Complete</h3>
        <p>
          When <code>value</code> reaches <code>max</code> the bar fills
          completely and <code>data-state</code> switches from{" "}
          <code>loading</code> to <code>complete</code>, which you can
          target with CSS for a colour change or checkmark overlay.
        </p>
        <ComponentPreview code={`<Progress value={100} aria-label="Upload finished" />`}>
          <div style={{ width: "60%" }}>
            <Progress value={100} aria-label="Upload finished" />
          </div>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Custom Max</h3>
        <p>
          Set <code>max</code> to change the scale. The{" "}
          <code>aria-valuetext</code> is computed as a percentage of{" "}
          <code>max</code>, so screen readers announce the correct
          proportion regardless of the numeric range.
        </p>
        <ComponentPreview code={`<Progress value={3} max={5} aria-label="Steps completed" />`}>
          <div style={{ width: "60%" }}>
            <Progress value={3} max={5} aria-label="Steps completed" />
          </div>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Multiple Bars</h3>
        <p>
          Stack bars with labels for a multi-metric view. Each bar is
          independent; give each an <code>aria-label</code> so screen
          readers can tell them apart.
        </p>
        <ComponentPreview code={`<div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
  <div>
    <span>CPU</span>
    <Progress value={72} aria-label="CPU usage" />
  </div>
  <div>
    <span>Memory</span>
    <Progress value={45} aria-label="Memory usage" />
  </div>
  <div>
    <span>Disk</span>
    <Progress value={89} aria-label="Disk usage" />
  </div>
</div>`}>
          <div style={{ width: "60%", display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div>
              <span style={{ fontSize: "0.75rem", color: "var(--muted-foreground)" }}>CPU</span>
              <Progress value={72} aria-label="CPU usage" />
            </div>
            <div>
              <span style={{ fontSize: "0.75rem", color: "var(--muted-foreground)" }}>Memory</span>
              <Progress value={45} aria-label="Memory usage" />
            </div>
            <div>
              <span style={{ fontSize: "0.75rem", color: "var(--muted-foreground)" }}>Disk</span>
              <Progress value={89} aria-label="Disk usage" />
            </div>
          </div>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Density</h3>
        <p>
          The bar height scales with <code>--density-scale</code>. Use a
          tighter density for inline indicators and a larger one when the
          bar is the primary visual element.
        </p>
        <ComponentPreview code={`<div style={{ "--density-scale": "0.75" }}>
  <Progress value={60} aria-label="Compact" />
</div>
<Progress value={60} aria-label="Default density" />
<div style={{ "--density-scale": "1.5" }}>
  <Progress value={60} aria-label="Spacious" />
</div>`}>
          <div style={{ width: "60%", display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ "--density-scale": "0.75" }}>
              <Progress value={60} aria-label="Compact" />
            </div>
            <Progress value={60} aria-label="Default density" />
            <div style={{ "--density-scale": "1.5" }}>
              <Progress value={60} aria-label="Spacious" />
            </div>
          </div>
        </ComponentPreview>
      </section>

      <ApiReference props={[
        { name: "value", type: "number | null", description: "Current progress value. Omit or pass null for indeterminate." },
        { name: "max", type: "number", default: "100", description: "Maximum value" },
        { name: "glow", type: "boolean", default: "false", description: "Breathing halo in the bar's own colour (static under reduced motion)" },
        { name: "className", type: "string", description: "Additional CSS classes" },
      ]} />
    </>
  )
}
