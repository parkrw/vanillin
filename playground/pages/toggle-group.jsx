import { useState } from "react"
import { ToggleGroup, ToggleGroupItem } from "../../ui/toggle-group/toggle-group.jsx"
import "../../ui/toggle/toggle.css"
import "../../ui/toggle-group/toggle-group.css"

const stroke = { fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" }

function AlignIcon({ lines }) {
  return (
    <svg viewBox="0 0 24 24" {...stroke}>
      {lines.map(([x1, x2], i) => (
        <line key={i} x1={x1} x2={x2} y1={6 + i * 6} y2={6 + i * 6} />
      ))}
    </svg>
  )
}

function BoldIcon() {
  return (
    <svg viewBox="0 0 24 24" {...stroke}>
      <path d="M6 12h9a4 4 0 0 1 0 8H7a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h7a4 4 0 0 1 0 8" />
    </svg>
  )
}

function ItalicIcon() {
  return (
    <svg viewBox="0 0 24 24" {...stroke}>
      <line x1="19" x2="10" y1="4" y2="4" />
      <line x1="14" x2="5" y1="20" y2="20" />
      <line x1="15" x2="9" y1="4" y2="20" />
    </svg>
  )
}

function UnderlineIcon() {
  return (
    <svg viewBox="0 0 24 24" {...stroke}>
      <path d="M6 4v6a6 6 0 0 0 12 0V4" />
      <line x1="4" x2="20" y1="20" y2="20" />
    </svg>
  )
}

function AlignmentGroup(props) {
  return (
    <ToggleGroup type="single" defaultValue="left" aria-label="Text alignment" {...props}>
      <ToggleGroupItem value="left" aria-label="Align left">
        <AlignIcon lines={[[3, 15], [3, 21], [3, 17]]} />
      </ToggleGroupItem>
      <ToggleGroupItem value="center" aria-label="Align center">
        <AlignIcon lines={[[6, 18], [3, 21], [5, 19]]} />
      </ToggleGroupItem>
      <ToggleGroupItem value="right" aria-label="Align right">
        <AlignIcon lines={[[9, 21], [3, 21], [7, 21]]} />
      </ToggleGroupItem>
    </ToggleGroup>
  )
}

export default function ToggleGroupPage() {
  const [formats, setFormats] = useState(["bold"])
  return (
    <>
      <h2>Toggle Group</h2>

      <section className="pg-section">
        <h3>Single</h3>
        <div className="pg-row">
          <AlignmentGroup />
        </div>
      </section>

      <section className="pg-section">
        <h3>Multiple (controlled)</h3>
        <div className="pg-row">
          <ToggleGroup type="multiple" value={formats} onValueChange={setFormats} aria-label="Text formatting">
            <ToggleGroupItem value="bold" aria-label="Toggle bold">
              <BoldIcon />
            </ToggleGroupItem>
            <ToggleGroupItem value="italic" aria-label="Toggle italic">
              <ItalicIcon />
            </ToggleGroupItem>
            <ToggleGroupItem value="underline" aria-label="Toggle underline">
              <UnderlineIcon />
            </ToggleGroupItem>
          </ToggleGroup>
          <span>{formats.join(", ") || "none"}</span>
        </div>
      </section>

      <section className="pg-section">
        <h3>Outline</h3>
        <div className="pg-row">
          <AlignmentGroup variant="outline" aria-label="Outline alignment" />
        </div>
      </section>

      <section className="pg-section">
        <h3>Sizes</h3>
        <div className="pg-row">
          <AlignmentGroup size="sm" aria-label="Small alignment" />
          <AlignmentGroup size="lg" aria-label="Large alignment" />
        </div>
      </section>

      <section className="pg-section">
        <h3>Disabled</h3>
        <div className="pg-row">
          <AlignmentGroup disabled aria-label="Disabled group" />
        </div>
      </section>
    </>
  )
}
