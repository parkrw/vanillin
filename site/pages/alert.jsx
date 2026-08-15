import { Alert, AlertTitle, AlertDescription } from "../../ui/alert/alert.jsx"
import "../../ui/alert/alert.css"
import { Card, CardContent } from "../../ui/card/card.jsx"
import "../../ui/card/card.css"
import { ComponentPreview } from "../code-example.jsx"
import { InstallSnippet } from "../install-snippet.jsx"
import { ApiReference } from "../api-reference.jsx"
import "../code-example.css"
import "../install-snippet.css"
import "../api-reference.css"

function InfoIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>
  )
}

function WarningIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 8v4" />
      <path d="M12 16h.01" />
    </svg>
  )
}

export default function AlertPage() {
  return (
    <>
      <h2>Alert</h2>
      <p>A callout for important information — tips, warnings, or errors.</p>

      <InstallSnippet slug="alert" />

      <section className="pg-section">
        <h3>Usage</h3>
        <ComponentPreview defaultTab="code" code={`import { Alert, AlertTitle, AlertDescription } from "./ui/alert/alert"
import "./ui/alert/alert.css"

<Alert>
  <InfoIcon />
  <AlertTitle>Heads up!</AlertTitle>
  <AlertDescription>
    You can add components using the CLI.
  </AlertDescription>
</Alert>`}>
          <div style={{ maxWidth: "32rem" }}>
            <Alert>
              <InfoIcon />
              <AlertTitle>Heads up!</AlertTitle>
              <AlertDescription>
                You can add components and dependencies to your app using the CLI.
              </AlertDescription>
            </Alert>
          </div>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Destructive</h3>
        <ComponentPreview code={`<Alert variant="destructive">
  <WarningIcon />
  <AlertTitle>Error</AlertTitle>
  <AlertDescription>
    Your session has expired. Please log in again.
  </AlertDescription>
</Alert>`}>
          <div style={{ maxWidth: "32rem" }}>
            <Alert variant="destructive">
              <WarningIcon />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                Your session has expired. Please log in again.
              </AlertDescription>
            </Alert>
          </div>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Without Icon</h3>
        <ComponentPreview code={`<Alert>
  <AlertTitle>Note</AlertTitle>
  <AlertDescription>This alert has no icon.</AlertDescription>
</Alert>`}>
          <div style={{ maxWidth: "32rem" }}>
            <Alert>
              <AlertTitle>Note</AlertTitle>
              <AlertDescription>
                This alert has no icon.
              </AlertDescription>
            </Alert>
          </div>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Alert in Card</h3>
        <ComponentPreview code={`<Card>
  <CardContent>
    <Alert variant="destructive">
      <WarningIcon />
      <AlertTitle>Payment failed</AlertTitle>
      <AlertDescription>
        Please update your billing information.
      </AlertDescription>
    </Alert>
  </CardContent>
</Card>`}>
          <Card style={{ width: "100%", maxWidth: "32rem" }}>
            <CardContent style={{ paddingTop: "var(--space-6)" }}>
              <Alert variant="destructive">
                <WarningIcon />
                <AlertTitle>Payment failed</AlertTitle>
                <AlertDescription>
                  Please update your billing information to continue.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </ComponentPreview>
      </section>

      <ApiReference title="Alert" props={[
        { name: "variant", type: '"default" | "destructive"', default: '"default"', description: "Visual variant" },
        { name: "className", type: "string", description: "Additional CSS classes" },
      ]} />
    </>
  )
}
