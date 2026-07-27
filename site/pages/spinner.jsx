import { Spinner } from "../../ui/spinner/spinner.jsx"
import "../../ui/spinner/spinner.css"

export default function SpinnerPage() {
  return (
    <>
      <h2>Spinner</h2>

      <section className="pg-section">
        <h3>Default</h3>
        <div className="pg-row">
          <Spinner />
        </div>
      </section>

      <section className="pg-section">
        <h3>Sizes (via style)</h3>
        <div className="pg-row">
          <Spinner style={{ width: "0.75rem", height: "0.75rem" }} />
          <Spinner />
          <Spinner style={{ width: "1.5rem", height: "1.5rem" }} />
          <Spinner style={{ width: "2rem", height: "2rem" }} />
        </div>
      </section>
    </>
  )
}
