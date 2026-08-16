import { useState } from "react"
import { ToggleGroup, ToggleGroupItem } from "../../ui/toggle-group/toggle-group.jsx"
import "../../ui/toggle/toggle.css"
import "../../ui/toggle-group/toggle-group.css"
import { ComponentPreview } from "../code-example.jsx"
import { InstallSnippet } from "../install-snippet.jsx"
import { ApiReference } from "../api-reference.jsx"
import "../code-example.css"
import "../install-snippet.css"
import "../api-reference.css"

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
      <p>Groups multiple toggles so they behave as a single-select radio or multi-select checkbox set, with roving keyboard focus between items.</p>

      <InstallSnippet slug="toggle-group" />

      <section className="pg-section">
        <h3>Default</h3>
        <ComponentPreview code={`<ToggleGroup type="single" defaultValue="left" aria-label="Text alignment">
  <ToggleGroupItem value="left" aria-label="Align left">
    <AlignLeftIcon />
  </ToggleGroupItem>
  <ToggleGroupItem value="center" aria-label="Align center">
    <AlignCenterIcon />
  </ToggleGroupItem>
  <ToggleGroupItem value="right" aria-label="Align right">
    <AlignRightIcon />
  </ToggleGroupItem>
</ToggleGroup>`}>
          <AlignmentGroup />
        </ComponentPreview>
        <p className="pg-desc">
          <code>type="single"</code> behaves like a radio set: picking one clears the rest, and clicking the active item clears the group entirely.
        </p>
      </section>

      <section className="pg-section">
        <h3>Usage</h3>
        <ComponentPreview defaultTab="code" code={`import { ToggleGroup, ToggleGroupItem } from "./ui/toggle-group/toggle-group"
import "./ui/toggle/toggle.css"
import "./ui/toggle-group/toggle-group.css"

<ToggleGroup type="single" defaultValue="left" aria-label="Text alignment">
  <ToggleGroupItem value="left" aria-label="Align left">
    <AlignLeftIcon />
  </ToggleGroupItem>
  <ToggleGroupItem value="center" aria-label="Align center">
    <AlignCenterIcon />
  </ToggleGroupItem>
</ToggleGroup>`}>
          <AlignmentGroup aria-label="Usage alignment" />
        </ComponentPreview>
        <p className="pg-desc">
          The group needs an <code>aria-label</code>, and every icon-only item needs one of its own. Without them the control announces as a row of unnamed buttons.
        </p>
      </section>

      <section className="pg-section">
        <h3>Text labels</h3>
        <ComponentPreview code={`<ToggleGroup type="single" defaultValue="month" aria-label="Billing period">
  <ToggleGroupItem value="month">Monthly</ToggleGroupItem>
  <ToggleGroupItem value="year">Yearly</ToggleGroupItem>
</ToggleGroup>`}>
          <ToggleGroup type="single" defaultValue="month" aria-label="Billing period">
            <ToggleGroupItem value="month">Monthly</ToggleGroupItem>
            <ToggleGroupItem value="year">Yearly</ToggleGroupItem>
          </ToggleGroup>
        </ComponentPreview>
        <p className="pg-desc">
          Text items need no <code>aria-label</code>: their content is the accessible name. Two or three short options read better here than a select.
        </p>
      </section>

      <section className="pg-section">
        <h3>Multiple (controlled)</h3>
        <ComponentPreview code={`const [formats, setFormats] = useState(["bold"])

<ToggleGroup type="multiple" value={formats} onValueChange={setFormats} aria-label="Text formatting">
  <ToggleGroupItem value="bold" aria-label="Toggle bold"><BoldIcon /></ToggleGroupItem>
  <ToggleGroupItem value="italic" aria-label="Toggle italic"><ItalicIcon /></ToggleGroupItem>
  <ToggleGroupItem value="underline" aria-label="Toggle underline"><UnderlineIcon /></ToggleGroupItem>
</ToggleGroup>
<span>{formats.join(", ") || "none"}</span>`}>
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
        </ComponentPreview>
        <p className="pg-desc">
          In multiple mode the value is an array and every item toggles independently, which is what a bold, italic, and underline row needs.
        </p>
      </section>

      <section className="pg-section">
        <h3>Outline</h3>
        <ComponentPreview code={`<ToggleGroup type="single" variant="outline" defaultValue="left">
  ...
</ToggleGroup>`}>
          <div className="pg-row">
            <AlignmentGroup variant="outline" aria-label="Outline alignment" />
          </div>
        </ComponentPreview>
        <p className="pg-desc">
          <code>variant</code> and <code>size</code> are set once on the group and forwarded to every item, so the row cannot drift out of alignment with itself.
        </p>
      </section>

      <section className="pg-section">
        <h3>Sizes</h3>
        <ComponentPreview code={`<ToggleGroup type="single" size="sm" defaultValue="left">...</ToggleGroup>
<ToggleGroup type="single" size="lg" defaultValue="left">...</ToggleGroup>`}>
          <div className="pg-row">
            <AlignmentGroup size="sm" aria-label="Small alignment" />
            <AlignmentGroup size="lg" aria-label="Large alignment" />
          </div>
        </ComponentPreview>
        <p className="pg-desc">
          Sizes scale the hit area as well as the icon, so the small variant still clears the minimum touch target under compact density.
        </p>
      </section>

      <section className="pg-section">
        <h3>Disabled</h3>
        <ComponentPreview code={`<ToggleGroup type="single" disabled defaultValue="left">
  ...
</ToggleGroup>`}>
          <div className="pg-row">
            <AlignmentGroup disabled aria-label="Disabled group" />
          </div>
        </ComponentPreview>
        <p className="pg-desc">
          <code>disabled</code> on the group disables every item. Put it on a single <code>ToggleGroupItem</code> to knock out just that one option while the rest stay live.
        </p>
      </section>

      <ApiReference title="ToggleGroup" props={[
        { name: "type", type: '"single" | "multiple"', default: '"single"', description: "Single deselects siblings; multiple allows many active" },
        { name: "value", type: "string | string[]", description: "Controlled value (string for single, array for multiple)" },
        { name: "defaultValue", type: "string | string[]", description: "Initial value (uncontrolled)" },
        { name: "onValueChange", type: "(value) => void", description: "Called when the selection changes" },
        { name: "variant", type: '"default" | "outline"', default: '"default"', description: "Visual style forwarded to every item" },
        { name: "size", type: '"default" | "sm" | "lg"', default: '"default"', description: "Size forwarded to every item" },
        { name: "disabled", type: "boolean", default: "false", description: "Disables every item in the group" },
        { name: "className", type: "string", description: "Additional CSS classes" },
      ]} />

      <ApiReference title="ToggleGroupItem" props={[
        { name: "value", type: "string", description: "Value this item represents (required)" },
        { name: "disabled", type: "boolean", default: "false", description: "Disables this item independently" },
        { name: "className", type: "string", description: "Additional CSS classes" },
      ]} />
    </>
  )
}
