import { useEffect, useState } from "react"
import { Progress } from "../../ui/progress/progress.jsx"
import "../../ui/progress/progress.css"

export default function ProgressPage() {
  const [progress, setProgress] = useState(13)
  useEffect(() => {
    const timer = setTimeout(() => setProgress(66), 500)
    return () => clearTimeout(timer)
  }, [])
  return (
    <>
      <h2>Progress</h2>

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
    </>
  )
}
