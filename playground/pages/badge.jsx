import { Badge } from "../../ui/badge/badge.jsx"
import "../../ui/badge/badge.css"

export default function BadgePage() {
  return (
    <>
      <h2>Badge</h2>

      <section className="pg-section">
        <h3>Variants</h3>
        <div className="pg-row">
          <Badge>Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="destructive">Destructive</Badge>
          <Badge variant="outline">Outline</Badge>
        </div>
      </section>

      <section className="pg-section">
        <h3>Status variants (soft)</h3>
        <div className="pg-row" data-pg="badge-status">
          <Badge variant="success">Success</Badge>
          <Badge variant="warning">Warning</Badge>
          <Badge variant="info">Info</Badge>
          <Badge variant="destructive-soft">Destructive soft</Badge>
        </div>
      </section>
    </>
  )
}
