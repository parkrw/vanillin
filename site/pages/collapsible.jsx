import { useState } from "react"
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "../../ui/collapsible/collapsible.jsx"
import { Button } from "../../ui/button/button.jsx"
import "../../ui/collapsible/collapsible.css"
import "../../ui/button/button.css"

const repoStyle = {
  border: "1px solid var(--border)",
  borderRadius: "var(--radius-md)",
  padding: "0.5rem 1rem",
  fontSize: "0.875rem",
  fontFamily: "var(--font-mono, monospace)",
}

export default function CollapsiblePage() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <h2>Collapsible</h2>

      <section className="pg-section">
        <h3>Default</h3>
        <Collapsible
          open={open}
          onOpenChange={setOpen}
          style={{ display: "flex", flexDirection: "column", gap: "0.5rem", maxWidth: "22rem" }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingInline: "1rem" }}>
            <span style={{ fontSize: "0.875rem", fontWeight: 600 }}>
              @peduarte starred 3 repositories
            </span>
            <CollapsibleTrigger as={Button} variant="ghost" size="icon" aria-label="Toggle">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="m7 15 5 5 5-5" />
                <path d="m7 9 5-5 5 5" />
              </svg>
            </CollapsibleTrigger>
          </div>
          <div style={repoStyle}>@radix-ui/primitives</div>
          <CollapsibleContent
            style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
          >
            <div style={repoStyle}>@radix-ui/colors</div>
            <div style={repoStyle}>@stitches/react</div>
          </CollapsibleContent>
        </Collapsible>
      </section>

      <section className="pg-section">
        <h3>Uncontrolled, default open</h3>
        <Collapsible defaultOpen style={{ maxWidth: "22rem" }}>
          <CollapsibleTrigger as={Button} variant="outline">
            Toggle details
          </CollapsibleTrigger>
          <CollapsibleContent style={{ paddingTop: "0.5rem", fontSize: "0.875rem" }}>
            These details render only while open.
          </CollapsibleContent>
        </Collapsible>
      </section>
    </>
  )
}
