import { StatusDot } from "../../ui/status-dot/status-dot.jsx"
import "../../ui/status-dot/status-dot.css"
import { ComponentPreview } from "../code-example.jsx"
import { InstallSnippet } from "../install-snippet.jsx"
import { ApiReference } from "../api-reference.jsx"
import "../code-example.css"
import "../install-snippet.css"
import "../api-reference.css"

export default function StatusDotPage() {
  return (
    <>
      <h2>Status Dot</h2>

      <p>
        A small coloured indicator for tables, resource lists, and anywhere a
        concise visual state signal is needed without a label. Uses{" "}
        <code>error</code> for the failure state (the console convention);
        Badge uses <code>destructive</code> for the same semantic state.
      </p>

      <InstallSnippet slug="status-dot" />

      <section className="pg-section">
        <h3>Default</h3>
        <ComponentPreview code={`<StatusDot status="success" />
<StatusDot status="error" ring />
<StatusDot status="warning" size="lg" />`}>
          <div className="pg-row">
            <StatusDot status="success" />
            <StatusDot status="error" ring />
            <StatusDot status="warning" size="lg" />
          </div>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Usage</h3>
        <ComponentPreview defaultTab="code" code={`import { StatusDot } from "./ui/status-dot/status-dot"
import "./ui/status-dot/status-dot.css"

<StatusDot status="success" />
<StatusDot status="error" ring />
<StatusDot status="warning" size="lg" />`}>
          <div className="pg-row">
            <StatusDot status="success" />
            <StatusDot status="error" ring />
            <StatusDot status="warning" size="lg" />
          </div>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>All statuses</h3>
        <ComponentPreview code={`<StatusDot status="success" />
<StatusDot status="warning" />
<StatusDot status="error" />
<StatusDot status="info" />
<StatusDot status="neutral" />
<StatusDot status="pending" />`}>
          <div>
            <p className="pg-prose">
              Six built-in states. Each maps to the corresponding token family
              in <code>globals.css</code>: <code>error</code> maps to{" "}
              <code>--destructive</code>, <code>neutral</code> and{" "}
              <code>pending</code> share <code>--muted-foreground</code>.
            </p>
            <div className="pg-row" data-pg="sd-statuses">
              <StatusDot status="success" />
              <StatusDot status="warning" />
              <StatusDot status="error" />
              <StatusDot status="info" />
              <StatusDot status="neutral" />
              <StatusDot status="pending" />
            </div>
          </div>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Sizes</h3>
        <ComponentPreview code={`<StatusDot status="success" size="sm" />
<StatusDot status="success" size="default" />
<StatusDot status="success" size="lg" />`}>
          <div>
            <p className="pg-prose">
              <code>sm</code> (6px), <code>default</code> (8px), and{" "}
              <code>lg</code> (10px). The default works in most table cells; use{" "}
              <code>sm</code> in tight inline contexts and <code>lg</code> when
              the dot is the primary visual element.
            </p>
            <div className="pg-row" data-pg="sd-sizes">
              <StatusDot status="success" size="sm" />
              <StatusDot status="success" size="default" />
              <StatusDot status="success" size="lg" />
            </div>
          </div>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>With ring</h3>
        <ComponentPreview code={`<StatusDot status="success" ring />
<StatusDot status="warning" ring />
<StatusDot status="error" ring />
<StatusDot status="info" ring />
<StatusDot status="neutral" ring />
<StatusDot status="pending" ring />`}>
          <div>
            <p className="pg-prose">
              The <code>ring</code> prop draws a halo in the dot's own colour
              and breathes it on a fixed 2s loop, the "live" look consoles use
              for running instances. The halo never takes a second hue: a green
              dot glows green. Under <code>prefers-reduced-motion</code> the
              halo holds still at 20% opacity.
            </p>
            <div className="pg-row" data-pg="sd-ring">
              <StatusDot status="success" ring />
              <StatusDot status="warning" ring />
              <StatusDot status="error" ring />
              <StatusDot status="info" ring />
              <StatusDot status="neutral" ring />
              <StatusDot status="pending" ring />
            </div>
          </div>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Accessibility: hidden label</h3>
        <ComponentPreview code={`{/* Default: role="img" with auto-derived aria-label */}
<StatusDot status="success" />

{/* When adjacent text already names the state, suppress the label */}
<StatusDot status="success" label={null} />
Running (label on adjacent text)

{/* Custom label overrides the auto-derived one */}
<StatusDot status="error" label="Build failed" />`}>
          <div>
            <p className="pg-prose">
              By default, <code>StatusDot</code> renders{" "}
              <code>role="img"</code> with an <code>aria-label</code>{" "}
              derived from the <code>status</code> prop ("Success",
              "Warning", etc.). When the dot sits next to visible
              text that already names the state, pass{" "}
              <code>label=&#123;null&#125;</code> to suppress the label and get{" "}
              <code>aria-hidden="true"</code> instead. Without this,
              screen readers will announce the status twice.
            </p>
            <div className="pg-row" data-pg="sd-hidden">
              <span style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
                <StatusDot status="success" label={null} />
                Running (label on adjacent text)
              </span>
            </div>
          </div>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Custom label</h3>
        <ComponentPreview code={`<StatusDot status="error" label="Build failed" />`}>
          <div>
            <p className="pg-prose">
              Pass a string <code>label</code> to override the default.
            </p>
            <div className="pg-row" data-pg="sd-custom-label">
              <StatusDot status="error" label="Build failed" />
            </div>
          </div>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Pending animation</h3>
        <ComponentPreview code={`<StatusDot status="pending" />
<StatusDot status="pending" ring />`}>
          <div>
            <p className="pg-prose">
              The <code>pending</code> status breathes like the badge glow — a
              gentle dim plus a halo in its own colour, one symmetric 2s cycle —
              behind a <code>prefers-reduced-motion</code> guard.
              Because this is an indeterminate loop (no start, no end), it uses a
              fixed <code>2s</code> literal and deliberately <strong>not</strong>{" "}
              a motion token. <code>--motion-medium</code> is{" "}
              <code>calc(200ms * var(--motion-scale))</code>; using it here would
              pulse at roughly 2.5Hz and would speed up or slow down with the
              user's motion-scale preference, which is meaningless for a
              loop that never terminates.
            </p>
            <div className="pg-row">
              <StatusDot status="pending" />
              <StatusDot status="pending" ring />
            </div>
          </div>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Forced colors and non-colour cues</h3>
        <ComponentPreview code={`{/* Under forced-colors: active, each status takes a distinct shape */}
{/* success = circle, warning = diamond, error = square, info = ringed circle */}
<StatusDot status="success" />
<StatusDot status="warning" />
<StatusDot status="error" />
<StatusDot status="info" />
<StatusDot status="pending" />`}>
          <div>
            <p className="pg-prose">
              Status is communicated by colour, which disappears in Windows High
              Contrast mode, where the OS replaces every colour with its own palette.
              Under <code>forced-colors: active</code> each status therefore takes
              a distinct <em>shape</em>: <code>warning</code> becomes a diamond,{" "}
              <code>error</code> a square, <code>info</code> a ringed circle, and{" "}
              <code>pending</code> stays a circle because its animation already
              distinguishes it.
            </p>
            <p className="pg-prose">
              The dots opt out of the forced palette with{" "}
              <code>forced-color-adjust: none</code> so the shapes stay legible.
              To see this, enable High Contrast in your OS settings, or emulate{" "}
              <code>forced-colors: active</code> in DevTools under Rendering.
            </p>
            <div className="pg-row">
              <StatusDot status="success" />
              <StatusDot status="warning" />
              <StatusDot status="error" />
              <StatusDot status="info" />
              <StatusDot status="pending" />
            </div>
          </div>
        </ComponentPreview>
      </section>

      <ApiReference props={[
        { name: "status", type: '"success" | "warning" | "error" | "info" | "neutral" | "pending"', default: '"neutral"', description: "Semantic state, mapped to the corresponding token family" },
        { name: "size", type: '"sm" | "default" | "lg"', default: '"default"', description: "Dot diameter: 6px, 8px, or 10px" },
        { name: "ring", type: "boolean", default: "false", description: "Draws a breathing halo in the dot's own colour (static under reduced motion)" },
        { name: "label", type: "string | null", default: "auto", description: "Accessible label. null gives aria-hidden; omit for the auto-derived label" },
        { name: "className", type: "string", description: "Additional CSS classes" },
      ]} />
    </>
  )
}
