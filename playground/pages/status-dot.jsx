import { StatusDot } from "../../ui/status-dot/status-dot.jsx"
import "../../ui/status-dot/status-dot.css"

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

      <section className="pg-section">
        <h3>All statuses</h3>
        <p>
          Six built-in states. Each maps to the corresponding token family
          in <code>globals.css</code> — <code>error</code> maps to{" "}
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
      </section>

      <section className="pg-section">
        <h3>Sizes</h3>
        <p>
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
      </section>

      <section className="pg-section">
        <h3>With ring</h3>
        <p>
          The <code>ring</code> prop draws a 20% opacity halo around the
          dot — the &ldquo;live&rdquo; look consoles use for running instances.
        </p>
        <div className="pg-row" data-pg="sd-ring">
          <StatusDot status="success" ring />
          <StatusDot status="warning" ring />
          <StatusDot status="error" ring />
          <StatusDot status="info" ring />
          <StatusDot status="neutral" ring />
          <StatusDot status="pending" ring />
        </div>
      </section>

      <section className="pg-section">
        <h3>Accessibility: hidden label</h3>
        <p>
          By default, <code>StatusDot</code> renders{" "}
          <code>role=&quot;img&quot;</code> with an <code>aria-label</code>{" "}
          derived from the <code>status</code> prop (&ldquo;Success&rdquo;,
          &ldquo;Warning&rdquo;, etc.). When the dot sits next to visible
          text that already names the state, pass{" "}
          <code>label=&#123;null&#125;</code> to suppress the label and get{" "}
          <code>aria-hidden=&quot;true&quot;</code> instead — without this,
          screen readers will announce the status twice.
        </p>
        <div className="pg-row" data-pg="sd-hidden">
          <span style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
            <StatusDot status="success" label={null} />
            Running (label on adjacent text)
          </span>
        </div>
      </section>

      <section className="pg-section">
        <h3>Custom label</h3>
        <p>
          Pass a string <code>label</code> to override the default.
        </p>
        <div className="pg-row" data-pg="sd-custom-label">
          <StatusDot status="error" label="Build failed" />
        </div>
      </section>

      <section className="pg-section">
        <h3>Pending animation</h3>
        <p>
          The <code>pending</code> status pulses with a slow opacity
          animation behind a <code>prefers-reduced-motion</code> guard.
          Because this is an indeterminate loop (no start, no end), it uses a
          fixed <code>2s</code> literal and deliberately <strong>not</strong>{" "}
          a motion token. <code>--motion-medium</code> is{" "}
          <code>calc(200ms * var(--motion-scale))</code>; using it here would
          pulse at roughly 2.5Hz and would speed up or slow down with the
          user&rsquo;s motion-scale preference, which is meaningless for a
          loop that never terminates.
        </p>
        <div className="pg-row">
          <StatusDot status="pending" />
          <StatusDot status="pending" ring />
        </div>
      </section>

      <section className="pg-section">
        <h3>Forced colors and non-colour cues</h3>
        <p>
          Status is communicated by colour, which disappears in Windows High
          Contrast mode — the OS replaces every colour with its own palette.
          Under <code>forced-colors: active</code> each status therefore takes
          a distinct <em>shape</em>: <code>warning</code> becomes a diamond,{" "}
          <code>error</code> a square, <code>info</code> a ringed circle, and{" "}
          <code>pending</code> stays a circle because its animation already
          distinguishes it.
        </p>
        <p>
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
      </section>
    </>
  )
}
