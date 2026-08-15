import { useState } from "react"
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "../../ui/collapsible/collapsible.jsx"
import { Button } from "../../ui/button/button.jsx"
import "../../ui/collapsible/collapsible.css"
import "../../ui/button/button.css"
import { ComponentPreview } from "../code-example.jsx"
import { InstallSnippet } from "../install-snippet.jsx"
import { ApiReference } from "../api-reference.jsx"
import "../code-example.css"
import "../install-snippet.css"
import "../api-reference.css"

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
      <p>A disclosure primitive that shows and hides content with a measured-height animation.</p>

      <InstallSnippet slug="collapsible" />

      <section className="pg-section">
        <h3>Default</h3>
        <Collapsible
          open={open}
          onOpenChange={setOpen}
          style={{ display: "flex", flexDirection: "column", maxWidth: "22rem" }}
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
          <div style={{ ...repoStyle, marginTop: "0.5rem" }}>@radix-ui/primitives</div>
          <CollapsibleContent>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
                paddingTop: "0.5rem",
              }}
            >
              <div style={repoStyle}>@radix-ui/colors</div>
              <div style={repoStyle}>@stitches/react</div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </section>

      <section className="pg-section">
        <h3>Uncontrolled, default open</h3>
        <Collapsible defaultOpen style={{ maxWidth: "22rem" }}>
          <CollapsibleTrigger as={Button} variant="outline">
            Toggle details
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div style={{ paddingTop: "0.5rem", fontSize: "0.875rem" }}>
              These details render only while open.
            </div>
          </CollapsibleContent>
        </Collapsible>
      </section>

      <section className="pg-section">
        <h3>Usage</h3>
        <ComponentPreview defaultTab="code" code={`import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "./ui/collapsible/collapsible"
import "./ui/collapsible/collapsible.css"
import { Button } from "./ui/button/button"

<Collapsible>
  <CollapsibleTrigger as={Button} variant="outline">Show more</CollapsibleTrigger>
  <CollapsibleContent>
    <p>Hidden content revealed on toggle.</p>
  </CollapsibleContent>
</Collapsible>`}>
          <Collapsible style={{ maxWidth: "22rem" }}>
            <CollapsibleTrigger as={Button} variant="outline">Show more</CollapsibleTrigger>
            <CollapsibleContent>
              <div style={{ paddingTop: "0.5rem", fontSize: "0.875rem" }}>
                Hidden content revealed on toggle.
              </div>
            </CollapsibleContent>
          </Collapsible>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Disabled</h3>
        <p>
          The <code>disabled</code> prop prevents the trigger from toggling. The collapsible stays in whatever state it was in when disabled.
        </p>
        <ComponentPreview code={`<Collapsible disabled>
  <CollapsibleTrigger as={Button} variant="outline" disabled>
    Cannot expand
  </CollapsibleTrigger>
  <CollapsibleContent>
    <p>This content is unreachable.</p>
  </CollapsibleContent>
</Collapsible>`}>
          <Collapsible disabled style={{ maxWidth: "22rem" }}>
            <CollapsibleTrigger as={Button} variant="outline" disabled>
              Cannot expand
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div style={{ paddingTop: "0.5rem", fontSize: "0.875rem" }}>
                This content is unreachable.
              </div>
            </CollapsibleContent>
          </Collapsible>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Custom Trigger</h3>
        <p>
          <code>CollapsibleTrigger</code> accepts <code>as</code> for polymorphic rendering. Any clickable element works; it gets <code>aria-expanded</code> and <code>aria-controls</code> automatically.
        </p>
        <ComponentPreview code={`<Collapsible>
  <CollapsibleTrigger as={Button} variant="secondary">
    Show release notes
  </CollapsibleTrigger>
  <CollapsibleContent>
    <ul>
      <li>Fixed collapsible animation at boundary frames</li>
      <li>Added fractional height measurement</li>
    </ul>
  </CollapsibleContent>
</Collapsible>`}>
          <Collapsible style={{ maxWidth: "22rem" }}>
            <CollapsibleTrigger as={Button} variant="secondary">
              Show release notes
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div style={{ paddingTop: "0.5rem", fontSize: "0.875rem" }}>
                <ul style={{ margin: 0, paddingInlineStart: "1.25rem" }}>
                  <li>Fixed collapsible animation at boundary frames</li>
                  <li>Added fractional height measurement</li>
                </ul>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Multiple Sections</h3>
        <p>
          Each <code>Collapsible</code> manages its own state independently. Stack them for an FAQ or settings panel without needing accordion-style mutual exclusion.
        </p>
        <ComponentPreview code={`<Collapsible>
  <CollapsibleTrigger as={Button} variant="ghost">
    What is vanillin?
  </CollapsibleTrigger>
  <CollapsibleContent>
    <p>A zero-dependency React component kit.</p>
  </CollapsibleContent>
</Collapsible>
<Collapsible>
  <CollapsibleTrigger as={Button} variant="ghost">
    How does it differ from shadcn?
  </CollapsibleTrigger>
  <CollapsibleContent>
    <p>No Radix, no Tailwind, no runtime dependencies.</p>
  </CollapsibleContent>
</Collapsible>`}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", maxWidth: "22rem" }}>
            <Collapsible>
              <CollapsibleTrigger as={Button} variant="ghost">
                What is vanillin?
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div style={{ paddingTop: "0.5rem", paddingInlineStart: "1rem", fontSize: "0.875rem" }}>
                  A zero-dependency React component kit.
                </div>
              </CollapsibleContent>
            </Collapsible>
            <Collapsible>
              <CollapsibleTrigger as={Button} variant="ghost">
                How does it differ from shadcn?
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div style={{ paddingTop: "0.5rem", paddingInlineStart: "1rem", fontSize: "0.875rem" }}>
                  No Radix, no Tailwind, no runtime dependencies.
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Controlled with Readout</h3>
        <ComponentPreview code={`const [open, setOpen] = useState(false)

<Collapsible open={open} onOpenChange={setOpen}>
  <CollapsibleTrigger as={Button} variant="outline">
    {open ? "Hide details" : "View details"}
  </CollapsibleTrigger>
  <CollapsibleContent>
    <p>Controlled content. State: {open ? "open" : "closed"}</p>
  </CollapsibleContent>
</Collapsible>`}>
          <Collapsible open={open} onOpenChange={setOpen} style={{ maxWidth: "22rem" }}>
            <CollapsibleTrigger as={Button} variant="outline">
              {open ? "Hide details" : "View details"}
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div style={{ paddingTop: "0.5rem", fontSize: "0.875rem" }}>
                Controlled content. State: {open ? "open" : "closed"}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>With Rich Content</h3>
        <p>
          The content slot takes any React tree. The measured-height animation adapts to whatever the content renders.
        </p>
        <ComponentPreview code={`<Collapsible>
  <CollapsibleTrigger as={Button} variant="outline">
    Show changelog
  </CollapsibleTrigger>
  <CollapsibleContent>
    <div style={{ paddingTop: "0.5rem" }}>
      <h4 style={{ margin: "0 0 0.5rem", fontSize: "0.875rem" }}>v1.2.0</h4>
      <ul style={{ margin: 0, fontSize: "0.875rem" }}>
        <li>Collapsible fractional height fix</li>
        <li>Accordion inner-wrapper spacing</li>
        <li>Progress indeterminate state</li>
      </ul>
    </div>
  </CollapsibleContent>
</Collapsible>`}>
          <Collapsible style={{ maxWidth: "22rem" }}>
            <CollapsibleTrigger as={Button} variant="outline">
              Show changelog
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div style={{ paddingTop: "0.5rem" }}>
                <h4 style={{ margin: "0 0 0.5rem", fontSize: "0.875rem", fontWeight: 600 }}>v1.2.0</h4>
                <ul style={{ margin: 0, fontSize: "0.875rem", paddingInlineStart: "1.25rem" }}>
                  <li>Collapsible fractional height fix</li>
                  <li>Accordion inner-wrapper spacing</li>
                  <li>Progress indeterminate state</li>
                </ul>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Default Open with Actions</h3>
        <ComponentPreview code={`<Collapsible defaultOpen>
  <CollapsibleTrigger as={Button} variant="outline">
    License agreement
  </CollapsibleTrigger>
  <CollapsibleContent>
    <div style={{ paddingTop: "0.5rem", fontSize: "0.875rem" }}>
      <p>By using this software you agree to the terms.</p>
      <Button size="sm">Accept terms</Button>
    </div>
  </CollapsibleContent>
</Collapsible>`}>
          <Collapsible defaultOpen style={{ maxWidth: "22rem" }}>
            <CollapsibleTrigger as={Button} variant="outline">
              License agreement
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div style={{ paddingTop: "0.5rem", fontSize: "0.875rem" }}>
                <p style={{ margin: "0 0 0.5rem" }}>By using this software you agree to the terms.</p>
                <Button size="sm">Accept terms</Button>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Spacing Contract</h3>
        <p>
          <code>CollapsibleContent</code> owns its spacing through an inner wrapper, never as padding on the content element itself. A <code>Collapsible</code> root must not use <code>gap</code>: a zero-height child still occupies its gap slot, producing a visible step when the content mounts and unmounts.
        </p>
      </section>

      <ApiReference props={[
        { name: "open", type: "boolean", description: "Controlled open state" },
        { name: "defaultOpen", type: "boolean", default: "false", description: "Uncontrolled initial state" },
        { name: "onOpenChange", type: "(open: boolean) => void", description: "Called when open state changes" },
        { name: "disabled", type: "boolean", default: "false", description: "Prevents the trigger from toggling" },
        { name: "className", type: "string", description: "Additional CSS classes" },
      ]} />
    </>
  )
}
