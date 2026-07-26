import { StatusDot } from "../../ui/status-dot/status-dot.jsx"
import "../../ui/status-dot/status-dot.css"

export default function StatusDotPage() {
  return (
    <>
      <h2>Status Dot</h2>

      <section className="pg-section">
        <h3>All statuses</h3>
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
        <div className="pg-row" data-pg="sd-sizes">
          <StatusDot status="success" size="sm" />
          <StatusDot status="success" size="default" />
          <StatusDot status="success" size="lg" />
        </div>
      </section>

      <section className="pg-section">
        <h3>With ring</h3>
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
        <div className="pg-row" data-pg="sd-hidden">
          <span style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
            <StatusDot status="success" label={null} />
            Running (label on adjacent text)
          </span>
        </div>
      </section>

      <section className="pg-section">
        <h3>Custom label</h3>
        <div className="pg-row" data-pg="sd-custom-label">
          <StatusDot status="error" label="Build failed" />
        </div>
      </section>
    </>
  )
}
