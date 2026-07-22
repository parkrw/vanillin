import { Alert, AlertTitle, AlertDescription } from "../../ui/alert/alert.jsx"
import "../../ui/alert/alert.css"

export default function AlertPage() {
  return (
    <>
      <h2>Alert</h2>

      <section className="pg-section">
        <h3>Default</h3>
        <div className="pg-row" style={{ flexDirection: "column", alignItems: "stretch", maxWidth: "32rem" }}>
          <Alert>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4" />
              <path d="M12 8h.01" />
            </svg>
            <AlertTitle>Heads up!</AlertTitle>
            <AlertDescription>
              You can add components and dependencies to your app using the CLI.
            </AlertDescription>
          </Alert>
        </div>
      </section>

      <section className="pg-section">
        <h3>Destructive</h3>
        <div className="pg-row" style={{ flexDirection: "column", alignItems: "stretch", maxWidth: "32rem" }}>
          <Alert variant="destructive">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4" />
              <path d="M12 16h.01" />
            </svg>
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              Your session has expired. Please log in again.
            </AlertDescription>
          </Alert>
        </div>
      </section>

      <section className="pg-section">
        <h3>Without Icon</h3>
        <div className="pg-row" style={{ flexDirection: "column", alignItems: "stretch", maxWidth: "32rem" }}>
          <Alert>
            <AlertTitle>Note</AlertTitle>
            <AlertDescription>
              This alert has no icon.
            </AlertDescription>
          </Alert>
        </div>
      </section>
    </>
  )
}
