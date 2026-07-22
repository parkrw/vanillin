import { useState } from "react"
import { Toggle } from "../../ui/toggle/toggle.jsx"
import "../../ui/toggle/toggle.css"

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

      <section className="pg-section">
        <h3>Default</h3>
        <div className="pg-row">
          <Toggle aria-label="Toggle bold">
            <BoldIcon />
          </Toggle>
          <Toggle aria-label="Toggle italic">
            <ItalicIcon />
            Italic
          </Toggle>
        </div>
      </section>

      <section className="pg-section">
        <h3>Outline</h3>
        <div className="pg-row">
          <Toggle variant="outline" aria-label="Toggle italic">
            <ItalicIcon />
          </Toggle>
        </div>
      </section>

      <section className="pg-section">
        <h3>Sizes</h3>
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
      </section>

      <section className="pg-section">
        <h3>States</h3>
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
      </section>
    </>
  )
}
