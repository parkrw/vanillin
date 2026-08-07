import { useState } from "react"
import { Toggle } from "../../ui/toggle/toggle.jsx"
import "../../ui/toggle/toggle.css"
import { ComponentPreview } from "../code-example.jsx"
import { InstallSnippet } from "../install-snippet.jsx"
import { ApiReference } from "../api-reference.jsx"
import "../code-example.css"
import "../install-snippet.css"
import "../api-reference.css"

function BoldIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 12h9a4 4 0 0 1 0 8H7a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h7a4 4 0 0 1 0 8" />
    </svg>
  )
}

function ItalicIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" x2="10" y1="4" y2="4" />
      <line x1="14" x2="5" y1="20" y2="20" />
      <line x1="15" x2="9" y1="4" y2="20" />
    </svg>
  )
}

export default function TogglePage() {
  const [pressed, setPressed] = useState(false)
  return (
    <>
      <h2>Toggle</h2>
      <p>A two-state button that stays pressed until clicked again — bold on, bold off. Tracks state with <code>aria-pressed</code> and <code>data-state</code>.</p>

      <InstallSnippet slug="toggle" />

      <section className="pg-section">
        <h3>Usage</h3>
        <ComponentPreview code={`import { Toggle } from "./ui/toggle/toggle"
import "./ui/toggle/toggle.css"

<Toggle aria-label="Toggle bold">
  <BoldIcon />
</Toggle>`}>
          <Toggle aria-label="Toggle bold">
            <BoldIcon />
          </Toggle>
          <Toggle aria-label="Toggle italic">
            <ItalicIcon />
            Italic
          </Toggle>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Outline</h3>
        <ComponentPreview code={`<Toggle variant="outline" aria-label="Toggle italic">
  <ItalicIcon />
</Toggle>`}>
          <div className="pg-row">
            <Toggle variant="outline" aria-label="Toggle italic">
              <ItalicIcon />
            </Toggle>
          </div>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Sizes</h3>
        <ComponentPreview code={`<Toggle size="sm" aria-label="Toggle bold"><BoldIcon /></Toggle>
<Toggle aria-label="Toggle bold"><BoldIcon /></Toggle>
<Toggle size="lg" aria-label="Toggle bold"><BoldIcon /></Toggle>`}>
          <div className="pg-row">
            <Toggle size="sm" aria-label="Toggle bold">
              <BoldIcon />
            </Toggle>
            <Toggle aria-label="Toggle bold">
              <BoldIcon />
            </Toggle>
            <Toggle size="lg" aria-label="Toggle bold">
              <BoldIcon />
            </Toggle>
          </div>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>States</h3>
        <ComponentPreview code={`<Toggle defaultPressed aria-label="Toggle bold">
  Pressed by default
</Toggle>
<Toggle disabled aria-label="Toggle bold">
  Disabled
</Toggle>
<Toggle pressed={pressed} onPressedChange={setPressed}>
  Controlled: {pressed ? "on" : "off"}
</Toggle>`}>
          <div className="pg-row">
            <Toggle defaultPressed aria-label="Toggle bold">
              Pressed by default
            </Toggle>
            <Toggle disabled aria-label="Toggle bold">
              Disabled
            </Toggle>
            <Toggle pressed={pressed} onPressedChange={setPressed}>
              Controlled: {pressed ? "on" : "off"}
            </Toggle>
          </div>
        </ComponentPreview>
      </section>

      <ApiReference props={[
        { name: "variant", type: '"default" | "outline"', default: '"default"', description: "Visual style of the toggle" },
        { name: "size", type: '"default" | "sm" | "lg"', default: '"default"', description: "Size of the toggle" },
        { name: "pressed", type: "boolean", description: "Controlled pressed state" },
        { name: "defaultPressed", type: "boolean", default: "false", description: "Initial pressed state (uncontrolled)" },
        { name: "onPressedChange", type: "(pressed: boolean) => void", description: "Called when pressed state changes" },
        { name: "className", type: "string", description: "Additional CSS classes" },
      ]} />
    </>
  )
}
