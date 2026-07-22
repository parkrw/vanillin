import { AspectRatio } from "../../ui/aspect-ratio/aspect-ratio.jsx"
import "../../ui/aspect-ratio/aspect-ratio.css"

export default function AspectRatioPage() {
  return (
    <>
      <h2>Aspect Ratio</h2>

      <section className="pg-section">
        <h3>16 / 9</h3>
        <div style={{ maxWidth: "28rem" }}>
          <AspectRatio ratio={16 / 9}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "var(--radius-lg)", backgroundColor: "var(--muted)", color: "var(--muted-foreground)" }}>
              16 : 9
            </div>
          </AspectRatio>
        </div>
      </section>

      <section className="pg-section">
        <h3>1 / 1 (Square)</h3>
        <div style={{ maxWidth: "12rem" }}>
          <AspectRatio ratio={1}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "var(--radius-lg)", backgroundColor: "var(--muted)", color: "var(--muted-foreground)" }}>
              1 : 1
            </div>
          </AspectRatio>
        </div>
      </section>

      <section className="pg-section">
        <h3>4 / 3</h3>
        <div style={{ maxWidth: "20rem" }}>
          <AspectRatio ratio={4 / 3}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "var(--radius-lg)", backgroundColor: "var(--muted)", color: "var(--muted-foreground)" }}>
              4 : 3
            </div>
          </AspectRatio>
        </div>
      </section>
    </>
  )
}
