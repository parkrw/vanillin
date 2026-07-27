import { Separator } from "../../ui/separator/separator.jsx"
import "../../ui/separator/separator.css"

export default function SeparatorPage() {
  return (
    <>
      <h2>Separator</h2>

      <section className="pg-section">
        <h3>Horizontal</h3>
        <div>
          <p style={{ margin: "0 0 0.75rem" }}>Content above</p>
          <Separator />
          <p style={{ margin: "0.75rem 0 0" }}>Content below</p>
        </div>
      </section>

      <section className="pg-section">
        <h3>Vertical</h3>
        <div className="pg-row" style={{ height: "1.25rem" }}>
          <span>Left</span>
          <Separator orientation="vertical" />
          <span>Right</span>
        </div>
      </section>
    </>
  )
}
