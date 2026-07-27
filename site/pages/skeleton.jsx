import { Skeleton } from "../../ui/skeleton/skeleton.jsx"
import "../../ui/skeleton/skeleton.css"

export default function SkeletonPage() {
  return (
    <>
      <h2>Skeleton</h2>

      <section className="pg-section">
        <h3>Basic shapes</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <Skeleton style={{ height: "1rem", width: "16rem" }} />
          <Skeleton style={{ height: "1rem", width: "12rem" }} />
          <Skeleton style={{ height: "1rem", width: "20rem" }} />
        </div>
      </section>

      <section className="pg-section">
        <h3>Card placeholder</h3>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <Skeleton style={{ height: "2.5rem", width: "2.5rem", borderRadius: "9999px" }} />
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <Skeleton style={{ height: "0.875rem", width: "10rem" }} />
            <Skeleton style={{ height: "0.875rem", width: "7rem" }} />
          </div>
        </div>
      </section>
    </>
  )
}
