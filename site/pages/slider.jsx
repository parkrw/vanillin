import { useState } from "react"
import { Slider } from "../../ui/slider/slider.jsx"
import "../../ui/slider/slider.css"
import { ComponentPreview } from "../code-example.jsx"
import { InstallSnippet } from "../install-snippet.jsx"
import { ApiReference } from "../api-reference.jsx"
import "../code-example.css"
import "../install-snippet.css"
import "../api-reference.css"

export default function SliderPage() {
  const [volume, setVolume] = useState([50])
  return (
    <>
      <h2>Slider</h2>
      <p>Selects a value or range from a continuous scale. Drag, click the track, or use arrow keys.</p>

      <InstallSnippet slug="slider" />

      <section className="pg-section">
        <h3>Default</h3>
        <p>
          A single thumb at a starting value. Arrow keys move by one step,
          Shift+Arrow by 10, Home/End jump to the extremes. Clicking the
          track jumps the thumb to that position.
        </p>
        <div className="pg-row" style={{ width: "60%" }}>
          <Slider defaultValue={[33]} aria-label="Default" />
        </div>
      </section>

      <section className="pg-section">
        <h3>Usage</h3>
        <ComponentPreview defaultTab="code" code={`import { Slider } from "./ui/slider/slider"
import "./ui/slider/slider.css"

<Slider defaultValue={[33]} aria-label="Volume" />`}>
          <div style={{ width: "60%" }}>
            <Slider defaultValue={[50]} aria-label="Usage demo" />
          </div>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Range (two thumbs)</h3>
        <p>
          Pass two entries in the value array for a range slider. Each
          thumb clamps at the other so they cannot cross. Clicking the
          track moves the nearest thumb.
        </p>
        <div className="pg-row" style={{ width: "60%" }}>
          <Slider defaultValue={[25, 75]} aria-label="Range" />
        </div>
      </section>

      <section className="pg-section">
        <h3>Controlled</h3>
        <p>
          Wire <code>value</code> and <code>onValueChange</code> for a
          controlled slider. The value is always an array (one entry per
          thumb), even for single-thumb sliders.
        </p>
        <div className="pg-row" style={{ width: "60%" }}>
          <Slider value={volume} onValueChange={setVolume} aria-label="Volume" />
          <span style={{ minWidth: "3ch" }}>{volume[0]}</span>
        </div>
      </section>

      <section className="pg-section">
        <h3>Step + disabled</h3>
        <p>
          <code>step</code> snaps the value to a grid. <code>disabled</code>{" "}
          prevents pointer and keyboard interaction and removes the thumb
          from the tab order.
        </p>
        <div className="pg-row" style={{ width: "60%", flexDirection: "column", alignItems: "stretch", gap: "1.5rem" }}>
          <Slider defaultValue={[40]} step={10} aria-label="Step 10" />
          <Slider defaultValue={[60]} disabled aria-label="Disabled" />
        </div>
      </section>

      <section className="pg-section">
        <h3>Vertical</h3>
        <p>
          Set <code>orientation=&quot;vertical&quot;</code> for a vertical
          axis. ArrowUp increments and ArrowDown decrements, matching the
          visual direction.
        </p>
        <div className="pg-row" style={{ height: "12rem" }}>
          <Slider defaultValue={[30]} orientation="vertical" aria-label="Vertical" />
        </div>
      </section>

      <section className="pg-section">
        <h3>Custom Bounds</h3>
        <p>
          Override <code>min</code> and <code>max</code> to set the value
          range. The thumb position, keyboard steps, and ARIA attributes
          all reflect the custom bounds.
        </p>
        <ComponentPreview code={`<Slider defaultValue={[2023]} min={2000} max={2030} aria-label="Year" />`}>
          <div style={{ width: "60%" }}>
            <Slider defaultValue={[2023]} min={2000} max={2030} aria-label="Year" />
          </div>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Fine Step</h3>
        <p>
          A fractional <code>step</code> works for precision controls.
          The value is rounded to the step's decimal places so 0.1 steps
          never produce 0.30000000000000004.
        </p>
        <ComponentPreview code={`<Slider defaultValue={[0.5]} min={0} max={1} step={0.1} aria-label="Opacity" />`}>
          <div style={{ width: "60%" }}>
            <Slider defaultValue={[0.5]} min={0} max={1} step={0.1} aria-label="Opacity" />
          </div>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>onValueCommit</h3>
        <p>
          <code>onValueChange</code> fires on every move (drag, click,
          key). <code>onValueCommit</code> fires only when the interaction
          ends (pointer release, after each keypress). Use it for
          expensive operations like network requests.
        </p>
        <ComponentPreview code={`<Slider
  defaultValue={[50]}
  onValueChange={v => setLive(v)}
  onValueCommit={v => setCommitted(v)}
  aria-label="Commit demo"
/>`}>
          <div style={{ width: "60%" }}>
            <Slider defaultValue={[50]} aria-label="Commit demo" />
          </div>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Density</h3>
        <p>
          Track height and thumb size scale with{" "}
          <code>--density-scale</code>. A tighter density suits inline
          controls; a larger one gives the thumb a bigger hit target.
        </p>
        <ComponentPreview code={`<div style={{ "--density-scale": "0.75" }}>
  <Slider defaultValue={[40]} aria-label="Compact slider" />
</div>
<Slider defaultValue={[40]} aria-label="Default slider" />
<div style={{ "--density-scale": "1.5" }}>
  <Slider defaultValue={[40]} aria-label="Spacious slider" />
</div>`}>
          <div style={{ width: "60%", display: "flex", flexDirection: "column", gap: "2rem" }}>
            <div style={{ "--density-scale": "0.75" }}>
              <Slider defaultValue={[40]} aria-label="Compact slider" />
            </div>
            <Slider defaultValue={[40]} aria-label="Default slider" />
            <div style={{ "--density-scale": "1.5" }}>
              <Slider defaultValue={[40]} aria-label="Spacious slider" />
            </div>
          </div>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Range with Labels</h3>
        <ComponentPreview code={`const [price, setPrice] = useState([20, 80])

<Slider value={price} onValueChange={setPrice} aria-label="Price range" />
<span>\${price[0]} – \${price[1]}</span>`}>
          <PriceRange />
        </ComponentPreview>
      </section>

      <ApiReference props={[
        { name: "value", type: "number[]", description: "Controlled value. One entry per thumb." },
        { name: "defaultValue", type: "number[]", description: "Initial value (uncontrolled)" },
        { name: "onValueChange", type: "(value: number[]) => void", description: "Called on every value change (drag, click, key)" },
        { name: "onValueCommit", type: "(value: number[]) => void", description: "Called on pointer-up and after each key change" },
        { name: "min", type: "number", default: "0", description: "Minimum value" },
        { name: "max", type: "number", default: "100", description: "Maximum value" },
        { name: "step", type: "number", default: "1", description: "Step increment" },
        { name: "orientation", type: '"horizontal" | "vertical"', default: '"horizontal"', description: "Axis of the slider" },
        { name: "disabled", type: "boolean", default: "false", description: "Prevents interaction" },
        { name: "className", type: "string", description: "Additional CSS classes" },
      ]} />
    </>
  )
}

function PriceRange() {
  const [price, setPrice] = useState([20, 80])
  return (
    <div style={{ width: "60%" }}>
      <Slider value={price} onValueChange={setPrice} aria-label="Price range" />
      <span style={{ fontSize: "0.875rem", marginTop: "0.5rem", display: "block" }}>
        ${price[0]} – ${price[1]}
      </span>
    </div>
  )
}
