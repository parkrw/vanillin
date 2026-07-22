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
    </>
  )
}
